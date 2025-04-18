import boto3
import pandas as pd
import numpy as np
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import GRU, Dense, Dropout
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.losses import Huber
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau
from xgboost import XGBRegressor
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_absolute_error
from pmdarima import auto_arima
import matplotlib.pyplot as plt
from dotenv import load_dotenv
import os
import warnings

os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'  # Suppresses INFO and WARNING logs
warnings.filterwarnings('ignore')

# Load environment variables from .env file
load_dotenv()

# Access AWS credentials
aws_access_key_id = os.getenv("AWS_ACCESS_KEY_ID")
aws_secret_access_key = os.getenv("AWS_SECRET_ACCESS_KEY")
aws_region = os.getenv("AWS_REGION")

# Initialize the boto3 session
session = boto3.Session(
    aws_access_key_id=aws_access_key_id,
    aws_secret_access_key=aws_secret_access_key,
    region_name=aws_region
)

# Create the S3 client
s3 = session.client('s3')
bucket_name = 'aveva-csv-bucket'
file_key = 'SOIL DATA GR.csv'

# Download the file from S3
local_file_name = 'SOIL DATA GR.csv'
s3.download_file(bucket_name, file_key, local_file_name)

# Load dataset
df = pd.read_csv(local_file_name)

# Select target column
print("Available columns:", df.columns.tolist())
target_column = input("Enter the column you want to predict: ")

if target_column not in df.columns:
    raise ValueError(f"Column '{target_column}' not found in dataset.")

# Fill missing values
df.fillna(df.mean(), inplace=True)

# Add derived features
df['P_diff'] = df[target_column].diff().fillna(0)
df['P_rolling_mean'] = df[target_column].rolling(window=5).mean().fillna(df[target_column])

# Remove outliers using IQR
def remove_outliers(df, column):
    Q1 = df[column].quantile(0.25)
    Q3 = df[column].quantile(0.75)
    IQR = Q3 - Q1
    lower_bound = Q1 - 1.5 * IQR
    upper_bound = Q3 + 1.5 * IQR
    return df[(df[column] >= lower_bound) & (df[column] <= upper_bound)]

df_no_outliers = remove_outliers(df, target_column)

# Separate features and target
target_no_outliers = df_no_outliers[[target_column]]
features_no_outliers = df_no_outliers.drop(columns=[target_column])

# Scale features and target
scaler_X = MinMaxScaler()
scaler_Y = MinMaxScaler()
scaled_features_no_outliers = scaler_X.fit_transform(features_no_outliers)
scaled_target_no_outliers = scaler_Y.fit_transform(target_no_outliers)

# Create dataset with look-back sequences
def create_dataset(features, target, look_back=30):
    dataX, dataY = [], []
    for i in range(len(features) - look_back):
        dataX.append(features[i:(i + look_back)])
        dataY.append(target[i + look_back])
    return np.array(dataX), np.array(dataY)

look_back = 50
X_no_outliers, y_no_outliers = create_dataset(scaled_features_no_outliers, scaled_target_no_outliers, look_back)

# Train/test split
train_start = int(len(y_no_outliers) * 0.6)
train_end = int(len(y_no_outliers) * 0.9)
test_start = train_end
test_end = len(y_no_outliers)

trainX, trainY = X_no_outliers[train_start:train_end], y_no_outliers[train_start:train_end]
testX, testY = X_no_outliers[test_start:test_end], y_no_outliers[test_start:test_end]

# Flatten data for XGBoost and Linear Regression
trainX_flat = trainX.reshape(trainX.shape[0], -1)
testX_flat = testX.reshape(testX.shape[0], -1)

# Define GRU model
def create_gru_model(input_shape):
    model = Sequential([
        GRU(128, return_sequences=True, input_shape=input_shape),
        Dropout(0.3),
        GRU(64),
        Dense(32, activation='relu'),
        Dense(1)
    ])
    model.compile(optimizer=Adam(learning_rate=0.0001), loss=Huber())
    return model

# Safe MAPE calculation
def safe_mape(y_true, y_pred):
    y_true = np.where(y_true == 0, 1e-5, y_true)
    return np.mean(np.abs((y_true - y_pred) / y_true)) * 100

# Additional metrics
def calculate_metrics(y_true, y_pred):
    mae = mean_absolute_error(y_true, y_pred)
    rmse = np.sqrt(np.mean((y_true - y_pred) ** 2))
    return mae, rmse

# Train and evaluate models
results = {}

# GRU Model
gru_model = create_gru_model((look_back, trainX.shape[2]))
early_stopping = EarlyStopping(monitor='val_loss', patience=50, restore_best_weights=True)
reduce_lr = ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=5, min_lr=1e-6)
gru_model.fit(trainX, trainY, epochs=100, batch_size=64, validation_split=0.2,
              callbacks=[early_stopping, reduce_lr], verbose=0)
gru_predictions = scaler_Y.inverse_transform(gru_model.predict(testX))
gru_actual = scaler_Y.inverse_transform(testY)
gru_mape = safe_mape(gru_actual, gru_predictions)
gru_mae, gru_rmse = calculate_metrics(gru_actual, gru_predictions)
results['GRU'] = (100 - gru_mape, gru_predictions)

xgb_model = XGBRegressor(
    n_estimators=5000,
    learning_rate=1,
    max_depth=15,
    subsample=0.8,
    colsample_bytree=0.8,
    lambda_=0.5,  # Reduced L2 regularization
    alpha=0.1,   # Reduced L1 regularization
    objective='reg:squarederror'
)
# Train XGBoost
xgb_model.fit(trainX_flat, trainY.flatten())

# Make predictions
xgb_predictions = scaler_Y.inverse_transform(xgb_model.predict(testX_flat).reshape(-1, 1))

# Evaluate XGBoost
xgb_mape = safe_mape(scaler_Y.inverse_transform(testY), xgb_predictions.flatten())
xgb_mae, xgb_rmse = calculate_metrics(scaler_Y.inverse_transform(testY), xgb_predictions.flatten())
results['XGBoost'] = (100 - xgb_mape, xgb_predictions)

# Flatten data for Linear Regression (only the target column for y=x relationship)
trainX_flat = scaled_features_no_outliers[train_start:train_end]
testX_flat = scaled_features_no_outliers[test_start:test_end]

# Linear Regression Model
linear_model = LinearRegression()
linear_model.fit(trainX_flat, trainY.flatten())  # Fit directly without look-back sequences
linear_predictions_scaled = linear_model.predict(testX_flat).reshape(-1, 1)
linear_predictions = scaler_Y.inverse_transform(linear_predictions_scaled)  # Reverse scaling
linear_actual = scaler_Y.inverse_transform(testY)  # Reverse scaling for comparison

# Evaluate Linear Regression
linear_mape = safe_mape(linear_actual, linear_predictions)
linear_mae, linear_rmse = calculate_metrics(linear_actual, linear_predictions)
results['Linear Regression'] = (100 - linear_mape, linear_predictions)


# Determine the best model
best_model_name = max(results, key=lambda x: results[x][0])
best_accuracy, best_predictions = results[best_model_name]

# Print results for all models
print(f"Best Model: {best_model_name}")
print(f"Accuracy: {best_accuracy:.2f}%")
print(f"Metrics (MAE, RMSE):")
print(f"GRU: MAE={gru_mae:.4f}, RMSE={gru_rmse:.4f}")
print(f"XGBoost: MAE={xgb_mae:.4f}, RMSE={xgb_rmse:.4f}")
print(f"Linear Regression: MAE={linear_mae:.4f}, RMSE={linear_rmse:.4f}")

# Visualization
plt.figure(figsize=(12, 6))
plt.plot(range(len(testY)), scaler_Y.inverse_transform(testY).flatten(), label='Actual Values', marker='o')
plt.plot(range(len(best_predictions)), best_predictions.flatten(), label=f'Predicted Values ({best_model_name})', marker='x')
plt.legend()
plt.title(f"Predicted vs Actual Values for {target_column}\nBest Model: {best_model_name} | Accuracy: {best_accuracy:.2f}%")
plt.xlabel("Time Step")
plt.ylabel(target_column)
plt.show()

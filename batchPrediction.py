import numpy as np
import pandas as pd
from tensorflow.keras.models import Model
from tensorflow.keras.layers import Input, GRU, Dense, Dropout
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau, Callback
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import r2_score, mean_absolute_error, mean_absolute_percentage_error
from tqdm import tqdm
import matplotlib.pyplot as plt
from tkinter import filedialog
import tkinter as tk
import time

# Load the dataset
root = tk.Tk()
root.withdraw()  # Use to hide tkinter window
file_path = filedialog.askopenfilename()
df = pd.read_excel(file_path)
root.destroy()

# Allow user to select target column
print("Available columns:", df.columns.tolist())
target_column = input("Enter the column you want to predict: ")

if target_column not in df.columns:
    raise ValueError(f"Column '{target_column}' not found in dataset.")

# Fill missing values
df.fillna(df.mean(), inplace=True)

# Remove outliers using IQR method
def remove_outliers(df, column):
    Q1 = df[column].quantile(0.25)
    Q3 = df[column].quantile(0.75)
    IQR = Q3 - Q1
    lower_bound = Q1 - 1.5 * IQR
    upper_bound = Q3 + 1.5 * IQR
    return df[(df[column] >= lower_bound) & (df[column] <= upper_bound)]

df_no_outliers = remove_outliers(df, target_column)

# Log-transform the target to reduce skewness
df_no_outliers[target_column] = np.log1p(df_no_outliers[target_column])

# Separate features and target dynamically
features_no_outliers = df_no_outliers.drop(columns=[target_column])
target_no_outliers = df_no_outliers[[target_column]]

# Scale features and target separately
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

look_back = 30
X_no_outliers, y_no_outliers = create_dataset(scaled_features_no_outliers, scaled_target_no_outliers, look_back)

# Train/test split
split_index = int(len(y_no_outliers) * 0.8)
trainX, trainY = X_no_outliers[:split_index], y_no_outliers[:split_index]
testX, testY = X_no_outliers[split_index:], y_no_outliers[split_index:]

# Define the model with Attention mechanism
def create_model(input_shape):
    inputs = Input(shape=input_shape)
    x = GRU(128, return_sequences=True)(inputs)
    x = Dropout(0.2)(x)
    x = GRU(64, return_sequences=True)(x)
    x = GRU(32)(x)
    x = Dense(64, activation='relu')(x)
    outputs = Dense(1)(x)
    model = Model(inputs, outputs)
    model.compile(optimizer=Adam(learning_rate=0.001), loss='mae')
    return model

# Create and compile the model
input_shape = (look_back, trainX.shape[2])
model = create_model(input_shape)

# Callbacks
early_stopping = EarlyStopping(monitor='val_loss', patience=10, restore_best_weights=True)
reduce_lr = ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=5, min_lr=1e-5)

# Train the model
start_time = time.time()
with tqdm(total=100) as pbar:
    model.fit(
        trainX, trainY,
        epochs=100,
        batch_size=32,
        validation_split=0.2,
        callbacks=[early_stopping, reduce_lr],
        verbose=0
    )
end_time = time.time()
print(f"Training completed in {end_time - start_time:.2f} seconds.")

# Predict on the test set
predictions = model.predict(testX)

# Inverse transform predictions and actual values
predicted_values = scaler_Y.inverse_transform(predictions)
actual_values = scaler_Y.inverse_transform(testY)

# Reverse log transformation
predicted_values = np.expm1(predicted_values)
actual_values = np.expm1(actual_values)

# Metrics
r2 = r2_score(actual_values, predicted_values)
mae = mean_absolute_error(actual_values, predicted_values)
mape = mean_absolute_percentage_error(actual_values, predicted_values) * 100
percent_accuracy = 100 - mape
print(f"Model Performance:\nR²: {r2:.3f}\nMAE: {mae:.3f}\nMAPE: {mape:.2f}%\nPercent Accuracy: {percent_accuracy:.2f}%")

# Visualization
plt.figure(figsize=(12, 6))
plt.plot(range(len(actual_values)), actual_values.flatten(), label='Actual Values (No Outliers)', marker='o')
plt.plot(range(len(predicted_values)), predicted_values.flatten(), label='Predicted Values', marker='x')
plt.legend()
plt.title(f"Predicted vs Actual Values for {target_column}\nAccuracy: {percent_accuracy:.2f}%")
plt.xlabel("Time Step")
plt.ylabel(target_column)
plt.show()

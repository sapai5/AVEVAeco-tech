from tkinter import filedialog
import tkinter as tk
import numpy as np
import pandas as pd
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import SimpleRNN, Dense
from tensorflow.keras.optimizers import Adam
from sklearn.preprocessing import MinMaxScaler
import matplotlib.pyplot as plt

# Load the dataset
# Set up GUI for file selection
root = tk.Tk()
root.withdraw()  # Use to hide tkinter window

# Prompt the user to select a file
file_path = filedialog.askopenfilename()

# Load the data from the selected Excel file
df = pd.read_excel(file_path)
root.destroy()

# Fill missing values in the dataset
df['Mn ppm'].fillna(df['Mn ppm'].mean(), inplace=True)

# Define features and target
features = df.drop(columns=['ID', 'pH'])  # All columns except ID and target
target = df[['pH']]  # Target column

# Scale features and target separately
scaler_X = MinMaxScaler()
scaler_Y = MinMaxScaler()

scaled_features = scaler_X.fit_transform(features)
scaled_target = scaler_Y.fit_transform(target)

# Create sequences from the scaled features and target
def create_dataset(features, target, look_back=30):
    dataX, dataY = [], []
    for i in range(len(features) - look_back):
        dataX.append(features[i:(i + look_back)])
        dataY.append(target[i + look_back])
    return np.array(dataX), np.array(dataY)

look_back = 30
X, y = create_dataset(scaled_features, scaled_target, look_back)

# Split into train and last sequence for prediction
trainX, trainY = X[:-1], y[:-1]  # All except last sequence for training
testX, testY = X[-1:], y[-1:]    # Last sequence for prediction

# Define the RNN model
model = Sequential()
model.add(SimpleRNN(50, input_shape=(look_back, trainX.shape[2])))
model.add(Dense(1))  # Single output for the target
model.compile(optimizer=Adam(learning_rate=0.001), loss='mean_squared_error')

# Train the model
model.fit(trainX, trainY, epochs=50, batch_size=16, verbose=2)

# Predict based on the last sequence
predictions = model.predict(testX)

# Inverse transform predictions and actual target
predicted_value = scaler_Y.inverse_transform(predictions)
actual_value = scaler_Y.inverse_transform(testY)

# Print prediction and actual value
print(f"Predicted value: {predicted_value.flatten()[0]}")
print(f"Actual value: {actual_value.flatten()[0]}")

# Extract the original target values for comparison
actual_sequence = scaler_Y.inverse_transform(y[-30:])  # Last 30 actual pH values

# Visualize the actual sequence and predicted value
plt.plot(range(30), actual_sequence.flatten(), label='Actual Data (pH)')
plt.scatter([30], predicted_value, color='red', label='Predicted Value')
plt.legend()
plt.title("Actual Data vs Predicted Value")
plt.xlabel("Time Step")
plt.ylabel("pH")
plt.show()
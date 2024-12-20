import sys
import numpy as np
import pandas as pd
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import SimpleRNN, Dense
from tensorflow.keras.optimizers import Adam
from sklearn.preprocessing import MinMaxScaler

def main(file_path):
    try:
        # Load the data from the CSV file
        df = pd.read_csv(file_path)

        # Define features and target
        features = df.drop(columns=['ID', 'pH'])
        target = df[['pH']]

        # Convert string values to float
        for col in features.columns:
            features[col] = pd.to_numeric(features[col], errors='coerce')
        target['pH'] = pd.to_numeric(target['pH'], errors='coerce')

        # Fill any missing values
        features = features.fillna(features.mean())
        target = target.fillna(target.mean())

        # Scale features and target separately
        scaler_X = MinMaxScaler()
        scaler_Y = MinMaxScaler()

        scaled_features = scaler_X.fit_transform(features)
        scaled_target = scaler_Y.fit_transform(target)

        # Create sequences
        def create_dataset(features, target, look_back=30):
            dataX, dataY = [], []
            for i in range(len(features) - look_back):
                dataX.append(features[i:(i + look_back)])
                dataY.append(target[i + look_back])
            return np.array(dataX), np.array(dataY)

        look_back = 30
        X, y = create_dataset(scaled_features, scaled_target, look_back)

        # Split data
        trainX, trainY = X[:-1], y[:-1]
        testX, testY = X[-1:], y[-1:]

        # Define and train model
        model = Sequential()
        model.add(SimpleRNN(50, input_shape=(look_back, trainX.shape[2])))
        model.add(Dense(1))
        model.compile(optimizer=Adam(learning_rate=0.001), loss='mean_squared_error')
        model.fit(trainX, trainY, epochs=50, batch_size=16, verbose=0)

        # Make prediction
        predictions = model.predict(testX)

        # Transform back to original scale
        predicted_value = scaler_Y.inverse_transform(predictions)
        actual_value = scaler_Y.inverse_transform(testY)
        actual_sequence = scaler_Y.inverse_transform(y[-30:])

        # Print sequence data
        for value in actual_sequence.flatten():
            print(f"{value:.2f}")
        
        # Print prediction and actual value
        print(f"Predicted value: {predicted_value.flatten()[0]:.2f}")
        print(f"Actual value: {actual_value.flatten()[0]:.2f}")

    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Error: Invalid number of arguments", file=sys.stderr)
        print("Usage: python newAI1.py <file_path>", file=sys.stderr)
        sys.exit(1)
    
    main(sys.argv[1])


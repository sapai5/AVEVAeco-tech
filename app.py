from flask import Flask, render_template
from flask_socketio import SocketIO, emit
import pandas as pd
import numpy as np
from scipy.signal import find_peaks
from sklearn.ensemble import RandomForestRegressor
import matplotlib.pyplot as plt
import boto3
import io
import base64
import os
from flask_cors import CORS
import warnings
from sklearn.preprocessing import MinMaxScaler
import eventlet

eventlet.monkey_patch()
warnings.filterwarnings('ignore')

app = Flask(__name__)
CORS(app, resources={
    r"/*": {
        "origins": "*",
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"],
        "supports_credentials": False
    }
})

socketio = SocketIO(
    app,
    cors_allowed_origins="*",
    async_mode='eventlet',
    ping_timeout=60,
    ping_interval=25,
    logger=True,
    engineio_logger=True,
    always_connect=True
)


def custom_percent_accuracy(y_true, y_pred):
    y_true, y_pred = np.array(y_true), np.array(y_pred)
    max_val = np.max(y_true)
    return 100 * (1 - np.mean(np.abs(y_true - y_pred) / max_val))


def analyze_peaks(data):
    """Analyze peak characteristics of the time series."""
    clean_data = np.nan_to_num(data, nan=np.nanmean(data))
    peaks, _ = find_peaks(clean_data, height=np.nanmean(clean_data), distance=20)
    if len(peaks) == 0:
        return np.nanmean(clean_data), 20
    peak_heights = clean_data[peaks]
    avg_peak_height = np.nanmean(peak_heights)
    avg_peak_distance = np.nanmean(np.diff(peaks)) if len(peaks) > 1 else 20
    return float(avg_peak_height), float(avg_peak_distance)


def generate_synthetic_peaks(length, avg_height, avg_distance, noise_level=0.2):
    """Generate synthetic peaks with similar characteristics to the original data."""
    x = np.linspace(0, length, length)
    base_signal = np.zeros(length)
    avg_distance = max(1, int(round(avg_distance)))

    for i in range(0, length, avg_distance):
        peak_height = avg_height * (1 + np.random.normal(0, 0.2))
        base_signal += peak_height * np.exp(-(x - i) ** 2 / (2 * (avg_distance / 5) ** 2))

    noise = np.random.normal(0, noise_level * avg_height, length)
    return base_signal + noise


def download_and_load_data():
    """Function to download data from S3 and load it."""
    try:
        s3 = boto3.client('s3',
                          aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID"),
                          aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY"),
                          region_name=os.environ.get("AWS_REGION"))
        bucket_name = 'aveva-csv-bucket'
        file_key = 'SOIL DATA GR.csv'
        local_file_name = 'SOIL DATA GR.csv'
        s3.download_file(bucket_name, file_key, local_file_name)
        print("Successfully downloaded file from S3")
    except Exception as e:
        print(f"Error downloading data from S3: {str(e)}")
        print("Attempting to load local file")
        local_file_name = 'SOIL DATA GR.csv'

    try:
        df = pd.read_csv(local_file_name)
        print(f"Successfully loaded data from {local_file_name}")
        return df
    except Exception as e:
        print(f"Error loading local file: {str(e)}")
        raise Exception("Failed to load data from both S3 and local file")


@socketio.on('connect')
def on_connect():
    print("Client connected")
    try:
        df = download_and_load_data()
        columns = df.columns.tolist()
        emit('available_columns', {'columns': columns})
        print(f"Emitted {len(columns)} columns to client")
    except Exception as e:
        print(f"Error in on_connect: {str(e)}")
        emit('error', {'message': 'Failed to load data columns'})


@socketio.on('process_data')
def handle_process_data(json):
    try:
        target_column = json['target_column']
        df = download_and_load_data()

        if target_column not in df.columns:
            emit('console_output', {'error': f"Column '{target_column}' not found in dataset."})
            return

        # Data processing
        df[target_column] = pd.to_numeric(df[target_column], errors='coerce')
        df[target_column].fillna(method='ffill', inplace=True)
        df[target_column].fillna(method='bfill', inplace=True)

        # Feature engineering
        df['P_diff'] = df[target_column].diff()
        df['P_diff'].fillna(0, inplace=True)

        df['P_rolling_mean'] = df[target_column].rolling(window=5, min_periods=1).mean()
        df['P_rolling_std'] = df[target_column].rolling(window=5, min_periods=1).std()
        df['P_rolling_std'].fillna(df[target_column].std(), inplace=True)

        # Analyze peak characteristics
        avg_peak_height, avg_peak_distance = analyze_peaks(df[target_column].values)

        # Prepare features and target
        features = df[['P_diff', 'P_rolling_mean', 'P_rolling_std']].values
        target = df[target_column].values.reshape(-1, 1)  # Reshape target to 2D array

        # Scale the data
        scaler_features = MinMaxScaler()
        scaler_target = MinMaxScaler()

        features_scaled = scaler_features.fit_transform(features)
        target_scaled = scaler_target.fit_transform(target)

        # Train model
        model = RandomForestRegressor(n_estimators=100, random_state=42)
        model.fit(features_scaled, target_scaled.ravel())  # Use ravel() for training

        # Generate predictions for existing data
        predictions_scaled = model.predict(features_scaled)
        predictions = scaler_target.inverse_transform(predictions_scaled.reshape(-1, 1)).ravel()

        # Generate future predictions
        future_entries = 100
        synthetic_data = generate_synthetic_peaks(future_entries, avg_peak_height, avg_peak_distance)

        # Create features for future predictions
        future_features = np.zeros((future_entries, 3))
        future_features[:, 0] = np.diff(synthetic_data, prepend=target[-1])  # P_diff
        future_features[:, 1] = pd.Series(synthetic_data).rolling(window=5, min_periods=1).mean()  # P_rolling_mean
        future_features[:, 2] = pd.Series(synthetic_data).rolling(window=5, min_periods=1).std()  # P_rolling_std
        future_features = np.nan_to_num(future_features, nan=0)

        # Scale future features and generate predictions
        future_features_scaled = scaler_features.transform(future_features)
        future_predictions_scaled = model.predict(future_features_scaled)
        future_predictions = scaler_target.inverse_transform(future_predictions_scaled.reshape(-1, 1)).ravel()

        # Prepare data for Recharts
        chart_data = []
        for i, (actual, predicted) in enumerate(zip(df[target_column], predictions)):
            chart_data.append({
                "entry": i + 1,
                "actual": float(actual),
                "predicted": float(predicted)
            })

        # Add future predictions
        for i, future_pred in enumerate(future_predictions):
            chart_data.append({
                "entry": len(df) + i + 1,
                "actual": None,
                "predicted": float(future_pred)
            })

        # Calculate accuracy
        mape = custom_percent_accuracy(df[target_column], predictions)

        # Emit results
        emit('new_plot', {'data': chart_data, 'column': target_column})
        emit('model_mae', {'mae': float(mape)})
        emit('console_output', {'message': f"Processing complete for column: {target_column}"})


    except Exception as e:
        error_message = f'Failed to process data: {str(e)}'
        print(f"Error in handle_process_data: {error_message}")
        emit('error', {'message': error_message})


if __name__ == '__main__':
    socketio.run(app, debug=True, allow_unsafe_werkzeug=True)

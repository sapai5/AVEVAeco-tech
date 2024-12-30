from flask import Flask, render_template
from flask_socketio import SocketIO, emit
import pandas as pd
import numpy as np
from scipy.signal import find_peaks
from sklearn.preprocessing import MinMaxScaler
from sklearn.ensemble import RandomForestRegressor
from statsmodels.tsa.statespace.sarimax import SARIMAX
import matplotlib.pyplot as plt
import boto3
import io
import base64
import os
import warnings

warnings.filterwarnings('ignore')

app = Flask(__name__)
socketio = SocketIO(app)


@app.route('/')
def index():
    return render_template('index.html')


def download_and_load_data():
    """Function to download data from S3 and load it."""
    s3 = boto3.client('s3',
                      aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
                      aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
                      region_name=os.getenv("AWS_REGION"))
    bucket_name = 'aveva-csv-bucket'
    file_key = 'SOIL DATA GR.csv'
    local_file_name = 'SOIL DATA GR.csv'
    s3.download_file(bucket_name, file_key, local_file_name)
    df = pd.read_csv(local_file_name)
    return df


def analyze_peaks(data):
    """Analyze peak characteristics of the time series."""
    # Ensure data is clean before peak analysis
    clean_data = np.nan_to_num(data, nan=np.nanmean(data))
    peaks, _ = find_peaks(clean_data, height=np.nanmean(clean_data), distance=20)
    if len(peaks) == 0:
        return np.nanmean(clean_data), 20  # Default values if no peaks found
    peak_heights = clean_data[peaks]
    avg_peak_height = np.nanmean(peak_heights)
    avg_peak_distance = np.nanmean(np.diff(peaks)) if len(peaks) > 1 else 20
    return float(avg_peak_height), float(avg_peak_distance)


def generate_synthetic_peaks(length, avg_height, avg_distance, noise_level=0.2):
    """Generate synthetic peaks with similar characteristics to the original data."""
    x = np.linspace(0, length, length)
    base_signal = np.zeros(length)

    # Ensure avg_distance is at least 1
    avg_distance = max(1, int(round(avg_distance)))

    for i in range(0, length, avg_distance):
        peak_height = avg_height * (1 + np.random.normal(0, 0.2))
        base_signal += peak_height * np.exp(-(x - i) ** 2 / (2 * (avg_distance / 5) ** 2))

    noise = np.random.normal(0, noise_level * avg_height, length)
    return base_signal + noise


def custom_percent_accuracy(y_true, y_pred):
    y_true, y_pred = np.array(y_true), np.array(y_pred)
    max_val = np.nanmax(y_true)
    if max_val == 0:
        max_val = 1  # Prevent division by zero
    return 100 * (1 - np.nanmean(np.abs(y_true - y_pred) / max_val))


@socketio.on('connect')
def on_connect(sid):
    df = download_and_load_data()
    columns = df.columns.tolist()
    emit('available_columns', {'columns': columns})


@socketio.on('process_data')
def handle_process_data(json, methods=['GET', 'POST']):
    target_column = json['target_column']
    df = download_and_load_data()

    if target_column not in df.columns:
        emit('console_output', {'error': f"Column '{target_column}' not found in dataset."})
        return

    # Data processing
    df[target_column] = pd.to_numeric(df[target_column], errors='coerce')
    df[target_column].fillna(method='ffill', inplace=True)
    df[target_column].fillna(method='bfill', inplace=True)  # Handle any remaining NaNs

    # Feature engineering with proper NaN handling
    df['P_diff'] = df[target_column].diff()
    df['P_diff'].fillna(0, inplace=True)

    df['P_rolling_mean'] = df[target_column].rolling(window=5, min_periods=1).mean()
    df['P_rolling_std'] = df[target_column].rolling(window=5, min_periods=1).std()
    df['P_rolling_std'].fillna(df[target_column].std(), inplace=True)

    # Analyze peak characteristics
    avg_peak_height, avg_peak_distance = analyze_peaks(df[target_column].values)

    # Train model on original data
    X = df[['P_diff', 'P_rolling_mean', 'P_rolling_std']].values
    y = df[target_column].values

    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X, y)

    # Generate predictions for existing data
    predictions = model.predict(X)

    # Generate future predictions
    future_entries = 100

    # Generate synthetic features for future predictions
    synthetic_data = generate_synthetic_peaks(
        future_entries,
        avg_peak_height,
        avg_peak_distance
    )

    # Create features for future predictions
    future_features = np.zeros((future_entries, 3))
    future_features[:, 0] = np.diff(synthetic_data, prepend=y[-1])  # P_diff
    future_features[:, 1] = pd.Series(synthetic_data).rolling(window=5, min_periods=1).mean()  # P_rolling_mean
    future_features[:, 2] = pd.Series(synthetic_data).rolling(window=5, min_periods=1).std()  # P_rolling_std

    # Fill any NaNs in future features
    future_features = np.nan_to_num(future_features, nan=0)

    # Generate future predictions
    future_predictions = model.predict(future_features)

    # Calculate accuracy for existing data
    mape = custom_percent_accuracy(y, predictions)

    # Plotting
    plt.figure(figsize=(12, 6))

    # Plot original data and predictions
    entries = np.arange(len(df[target_column]))
    future_entries_x = np.arange(len(df[target_column]), len(df[target_column]) + future_entries)

    plt.plot(entries, df[target_column], label='Actual', color='blue')
    plt.plot(entries, predictions, label='Predicted', color='orange', linestyle='--')
    plt.plot(future_entries_x, future_predictions, label='Future Predictions',
             color='red', linestyle='--')

    plt.title(f'Predictions vs Actual for {target_column}')
    plt.xlabel('Number of Entries')
    plt.ylabel(f'{target_column} ppm')
    plt.legend()

    # Save and emit plot
    img = io.BytesIO()
    plt.savefig(img, format='png', dpi=300, bbox_inches='tight')
    img.seek(0)
    plot_url = base64.b64encode(img.getvalue()).decode('utf8')
    emit('new_plot', {'image_url': f"data:image/png;base64,{plot_url}"})
    emit('model_mae', {'mae': mape})
    plt.close()


if __name__ == '__main__':
    socketio.run(app, debug=True, allow_unsafe_werkzeug=True)

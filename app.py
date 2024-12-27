from flask import Flask, render_template
from flask_socketio import SocketIO, emit
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_absolute_error
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

    # Data processing and feature engineering
    df.fillna(df.mean(), inplace=True)
    df['P_diff'] = df[target_column].diff().fillna(0)
    df['P_rolling_mean'] = df[target_column].rolling(window=5).mean().fillna(df[target_column])

    scaler = MinMaxScaler()
    features = scaler.fit_transform(df.drop(columns=[target_column]))
    target = scaler.fit_transform(df[[target_column]])

    # Example: simple linear regression model
    model = LinearRegression()
    model.fit(features, target)
    predictions = model.predict(features)
    mae = 100 - mean_absolute_error(target, predictions)*100

    # Generate and emit the plot
    plt.figure(figsize=(10, 5))
    plt.plot(target, label='Actual')
    plt.plot(predictions, label='Predicted', linestyle='--')
    plt.title(f'Predictions vs Actual for {target_column}')
    plt.legend()
    img = io.BytesIO()
    plt.savefig(img, format='png')
    img.seek(0)
    plot_url = base64.b64encode(img.getvalue()).decode('utf8')
    emit('new_plot', {'image_url': f"data:image/png;base64,{plot_url}"})
    emit('model_mae', {'mae': mae})
    plt.close()

if __name__ == '__main__':
    socketio.run(app, debug=True, allow_unsafe_werkzeug=True)

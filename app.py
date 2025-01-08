import eventlet
eventlet.monkey_patch()
from flask import Flask
from flask_socketio import SocketIO, emit
import pandas as pd
import numpy as np
from scipy.signal import find_peaks
from sklearn.ensemble import RandomForestRegressor
from openai import OpenAI
import boto3
from botocore.exceptions import ClientError
import io
import os
from flask_cors import CORS
import warnings
from sklearn.preprocessing import MinMaxScaler
from dotenv import load_dotenv

# Load environment variables from .env file if it exists
load_dotenv()

# Function to validate and get AWS credentials
def get_aws_credentials():
    # Try getting from environment variables
    credentials = {
        "AWS_ACCESS_KEY_ID": os.getenv("AWS_ACCESS_KEY_ID"),
        "AWS_SECRET_ACCESS_KEY": os.getenv("AWS_SECRET_ACCESS_KEY"),
        "AWS_REGION": os.getenv("AWS_REGION")
    }

    # Check if any credentials are missing
    missing_credentials = [key for key, value in credentials.items() if not value]

    if missing_credentials:
        raise Exception(f"Missing required AWS credentials: {', '.join(missing_credentials)}")

    return credentials


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
        # Get and validate AWS credentials
        credentials = get_aws_credentials()

        s3 = boto3.client('s3',
                          aws_access_key_id=credentials["AWS_ACCESS_KEY_ID"],
                          aws_secret_access_key=credentials["AWS_SECRET_ACCESS_KEY"],
                          region_name=credentials["AWS_REGION"])

        bucket_name = 'aveva-csv-bucket'
        file_key = 'SOIL DATA GR.csv'

        print(f"Attempting to access S3 bucket: {bucket_name}")
        print(f"Attempting to read file: {file_key}")

        try:
            obj = s3.get_object(Bucket=bucket_name, Key=file_key)
            df = pd.read_csv(io.BytesIO(obj['Body'].read()))
            print(f"Successfully loaded data from S3. DataFrame shape: {df.shape}")
            return df
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == 'NoSuchBucket':
                raise Exception(f"S3 bucket '{bucket_name}' does not exist")
            elif error_code == 'NoSuchKey':
                raise Exception(f"File '{file_key}' not found in S3 bucket")
            else:
                raise Exception(f"AWS S3 error: {str(e)}")

    except Exception as e:
        raise Exception(str(e))


def get_mineral_weights(columns):
    """Get weights for different minerals using OpenAI API"""
    prompt = f"""
    Given these minerals from soil data: {', '.join(columns)}
    Provide weights (0-1) for each mineral's importance in determining mining sustainability.
    Consider: environmental impact, economic value, scarcity, extraction difficulty, and recovery time.
    Return only a Python dictionary with minerals as keys and weights as values.
    Example format: {{"mineral1": 0.8, "mineral2": 0.6}}
    """

    try:
        response = openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are an expert in mining sustainability and mineral importance."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3
        )
        weights_str = response.choices[0].message.content.strip()
        return eval(weights_str)
    except Exception as e:
        print(f"Error getting mineral weights: {e}")
        return {col: 1.0 / len(columns) for col in columns}


def calculate_sustainability_scores(all_predictions, historical_data, weights):
    """
    Calculate 25 sustainability scores, each combining 4 sequential points from predictions.
    Returns scores on a scale of 1-10.
    """
    scores = []
    points_per_score = 4  # Number of prediction points to combine for each score
    num_scores = 25  # Total number of scores we want to generate

    # Validate we have enough predictions
    prediction_length = len(next(iter(all_predictions.values())))
    if prediction_length < num_scores * points_per_score:
        raise ValueError(
            f"Need at least {num_scores * points_per_score} predictions, but only have {prediction_length}")

    for score_index in range(num_scores):
        start_idx = score_index * points_per_score
        end_idx = start_idx + points_per_score
        point_score = 0
        total_weight = 0

        for mineral, weight in weights.items():
            if mineral not in all_predictions:
                continue

            # Get historical stats for the mineral
            hist_values = historical_data[mineral]
            hist_mean = np.nanmean(hist_values)
            hist_std = np.nanstd(hist_values)

            # Average the predictions for the 4 points
            predicted_values = all_predictions[mineral][start_idx:end_idx]
            avg_predicted_value = np.mean(predicted_values)

            # Calculate z-score based on historical distribution
            z_score = abs((avg_predicted_value - hist_mean) / (hist_std if hist_std != 0 else 1))

            # Convert to 1-10 scale (lower z-score means higher sustainability)
            mineral_score = max(1, min(10, 10 * (1 - (z_score / 3))))

            point_score += mineral_score * weight
            total_weight += weight

        final_score = (point_score / total_weight) if total_weight > 0 else 1

        scores.append({
            'time_period': score_index + 1,
            'points_considered': f"{start_idx + 1}-{end_idx}",
            'score': round(final_score, 2)
        })

    return scores


@socketio.on('connect')
def on_connect():
    print("Client connected")
    try:
        df = download_and_load_data()
        columns = df.columns.tolist()
        columns.remove("ID")
        emit('available_columns', {'columns': columns})
        print(f"Emitted {len(columns)} columns to client")
    except Exception as e:
        error_msg = str(e)
        print(f"Error in on_connect: {error_msg}")
        emit('error', {'message': error_msg})


@socketio.on('request_full_dataset')
def handle_dataset_request():
    print("Received request for full dataset")
    try:
        df = download_and_load_data()
        df.fillna(0, inplace=True)
        # Convert DataFrame to a dictionary format suitable for JSON serialization
        data_dict = {
            'columns': df.columns.tolist(),
            'data': df.to_dict('records')  # Convert DataFrame to list of dictionaries
        }

        # Emit the full dataset
        emit('full_dataset', data_dict)
        print(f"Successfully emitted dataset with {len(df)} rows and {len(df.columns)} columns")
    except Exception as e:
        error_msg = str(e)
        print(f"Error in handle_dataset_request: {error_msg}")
        emit('error', {'message': error_msg})

openai_client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

@socketio.on('process_data')
def handle_process_data(json):
    try:
        print(f"Received process_data request with data: {json}")
        target_column = json['target_column']

        print(f"Loading data for column: {target_column}")
        df = download_and_load_data()
        print(f"Data loaded successfully. Shape: {df.shape}")

        if target_column not in df.columns:
            error_msg = f"Column '{target_column}' not found in dataset."
            print(error_msg)
            emit('console_output', {'error': error_msg})
            return

        # Store all predictions for sustainability calculation
        all_predictions = {}

        print("Processing data...")
        # Data processing
        df[target_column] = pd.to_numeric(df[target_column], errors='coerce')
        df[target_column].fillna(method='ffill', inplace=True)
        df[target_column].fillna(method='bfill', inplace=True)

        print("Creating features...")
        # Feature engineering
        df['P_diff'] = df[target_column].diff()
        df['P_diff'].fillna(0, inplace=True)

        df['P_rolling_mean'] = df[target_column].rolling(window=5, min_periods=1).mean()
        df['P_rolling_std'] = df[target_column].rolling(window=5, min_periods=1).std()
        df['P_rolling_std'].fillna(df[target_column].std(), inplace=True)

        print("Analyzing peaks...")
        # Analyze peak characteristics
        avg_peak_height, avg_peak_distance = analyze_peaks(df[target_column].values)

        print("Preparing features and target...")
        # Prepare features and target
        features = df[['P_diff', 'P_rolling_mean', 'P_rolling_std']].values
        target = df[target_column].values.reshape(-1, 1)

        # Scale the data
        scaler_features = MinMaxScaler()
        scaler_target = MinMaxScaler()

        features_scaled = scaler_features.fit_transform(features)
        target_scaled = scaler_target.fit_transform(target)

        print("Training model...")
        # Train model
        model = RandomForestRegressor(n_estimators=100, random_state=42)
        model.fit(features_scaled, target_scaled.ravel())

        print("Generating predictions...")
        # Generate predictions for existing data
        predictions_scaled = model.predict(features_scaled)
        predictions = scaler_target.inverse_transform(predictions_scaled.reshape(-1, 1)).ravel()

        print("Generating future predictions...")
        # Generate future predictions
        future_entries = 100
        synthetic_data = generate_synthetic_peaks(future_entries, avg_peak_height, avg_peak_distance)

        # Create features for future predictions
        future_features = np.zeros((future_entries, 3))
        future_features[:, 0] = np.diff(synthetic_data, prepend=target[-1])
        future_features[:, 1] = pd.Series(synthetic_data).rolling(window=5, min_periods=1).mean()
        future_features[:, 2] = pd.Series(synthetic_data).rolling(window=5, min_periods=1).std()
        future_features = np.nan_to_num(future_features, nan=0)

        # Scale future features and generate predictions
        future_features_scaled = scaler_features.transform(future_features)
        future_predictions_scaled = model.predict(future_features_scaled)
        future_predictions = scaler_target.inverse_transform(future_predictions_scaled.reshape(-1, 1)).ravel()

        # Store predictions for sustainability calculation
        all_predictions[target_column] = future_predictions

        print("Preparing chart data...")
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

        print("Calculating sustainability scores...")
        # Get mineral columns (excluding ID)
        mineral_columns = [col for col in df.columns if col != 'ID']

        # Get weights for all minerals
        weights = get_mineral_weights(mineral_columns)

        # Process predictions for other minerals if not already processed
        for column in mineral_columns:
            if column not in all_predictions:
                # Process additional columns for sustainability calculation
                df[column] = pd.to_numeric(df[column], errors='coerce')
                df[column].fillna(method='ffill', inplace=True)
                df[column].fillna(method='bfill', inplace=True)

                # Generate predictions using the same process
                avg_height, avg_distance = analyze_peaks(df[column].values)
                synthetic = generate_synthetic_peaks(future_entries, avg_height, avg_distance)
                all_predictions[column] = synthetic

        # Calculate sustainability scores
        sustainability_scores = calculate_sustainability_scores(all_predictions, df, weights)

        # Print sustainability scores
        #print("\nSustainability Scores (Scale 1-10)")
        #print("-" * 60)
        #print("{:^8} | {:^20} | {:^10} | {:^10}".format("Period", "Points Considered", "Score", "Trend"))
        #print("-" * 60)

        sustainability_graph_data = []
        prev_score = None
        for score in sustainability_scores:
            trend = None
            if prev_score is not None:
                diff = score['score'] - prev_score
                trend = diff

            graph_point = {
                'period': score['time_period'],
                'points': score['points_considered'],
                'score': score['score'],
                'trend': trend if trend is not None else 0
            }
            sustainability_graph_data.append(graph_point)
            prev_score = score['score']

        # Calculate overall statistics
        avg_score = sum(s['score'] for s in sustainability_scores) / len(sustainability_scores)
        total_trend = sustainability_scores[-1]['score'] - sustainability_scores[0]['score']

        # Create metadata for the graph
        graph_metadata = {
            'averageScore': round(avg_score, 2),
            'overallTrend': round(total_trend, 2),
            'totalPeriods': len(sustainability_scores),
            'minScore': min(s['score'] for s in sustainability_scores),
            'maxScore': max(s['score'] for s in sustainability_scores)
        }

        # Emit sustainability graph data
        emit('SustainabilityGraph', {
            'graphData': sustainability_graph_data,
            'metadata': graph_metadata,
            'targetColumn': target_column
        })

        print("Emitting results...")
        # Emit results (keeping existing emissions)
        emit('new_plot', {'data': chart_data, 'column': target_column})
        emit('model_mae', {'mae': float(mape)})
        emit('console_output', {'message': f"Processing complete for column: {target_column}"})

        all_columns = df.columns.tolist()
        prompt = f"""
                Given the following information about mining data, please assess if it is sustainable to continue mining:

                Available data columns: {', '.join(all_columns)}
                Target column analyzed: {target_column}
                Prediction accuracy: {mape}%
                Number of future predictions: {len(future_predictions)}

                Based on the historical data and future predictions for {target_column}, analyze the environmental impact 
                and sustainability of continuing mining operations. Consider any trends, patterns, or concerning indicators 
                in the data. Give a definitive yes or no answer at the end if we should continue mining. You must either 
                say yes or no, not maybe or anything like that. Keep the whole response under 200 words.
                """

        print("Process completed successfully")

        response = openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system",
                 "content": "You are an AI assistant that advises on mining sustainability using provided data."},
                {"role": "user", "content": prompt}
            ]
        )

        analysis = response.choices[0].message.content

        print("\n=== AI Analysis ===")
        print(analysis)
        print("==================\n")

        emit('console_output', {
            'message': f"""
                    Sustainability Analysis for {target_column}:

                    {analysis}
                    """
        })

        print("Process completed successfully")

    except Exception as e:
        error_message = f'Failed to process data: {str(e)}'
        print(f"Error in handle_process_data: {error_message}")
        emit('error', {'message': error_message})

if __name__ == '__main__':
    socketio.run(app, debug=True, allow_unsafe_werkzeug=True)

import pandas as pd
import numpy as np
from statsmodels.tsa.arima.model import ARIMA
from sklearn.metrics import mean_squared_error, r2_score
import json
import sys
import warnings
from io import StringIO

warnings.filterwarnings("ignore")

def process_data(predicted_file, actual_file):
    try:
        # Read predicted values
        df_predicted = pd.read_csv(predicted_file, delim_whitespace=True)
        
        # Read actual values
        df_actual = pd.read_csv(actual_file)
        df_actual['Date'] = pd.to_datetime(df_actual['Date'])
        df_actual.set_index('Date', inplace=True)
        df_actual.sort_index(inplace=True)

        # Function to fit ARIMA model and make predictions
        def fit_arima(series, order=(1,1,1)):
            model = ARIMA(series, order=order)
            model_fit = model.fit()
            return model_fit

        # Fit ARIMA for Mercury and Zinc levels
        mercury_model = fit_arima(df_actual['Mercury (%)'])
        zinc_model = fit_arima(df_actual['Zinc (%)'])

        # Make predictions for the next 10 days
        future_dates = pd.date_range(start=df_actual.index[-1] + pd.Timedelta(days=1), periods=10, freq='D')
        mercury_forecast = mercury_model.forecast(steps=10)
        zinc_forecast = zinc_model.forecast(steps=10)

        # Combine actual and forecasted data
        mineral_data = []
        for date, row in df_actual.iterrows():
            mineral_data.append({
                "date": date.strftime('%Y-%m-%d'),
                "mercury": float(row['Mercury (%)']),
                "zinc": float(row['Zinc (%)']),
                "mercuryForecast": None,
                "zincForecast": None
            })

        for date, m_forecast, z_forecast in zip(future_dates, mercury_forecast, zinc_forecast):
            mineral_data.append({
                "date": date.strftime('%Y-%m-%d'),
                "mercury": None,
                "zinc": None,
                "mercuryForecast": float(m_forecast),
                "zincForecast": float(z_forecast)
            })

        forecast = [
            {
                "date": date.strftime('%Y-%m-%d'),
                "mercuryForecast": float(m_forecast),
                "zincForecast": float(z_forecast)
            }
            for date, m_forecast, z_forecast in zip(future_dates, mercury_forecast, zinc_forecast)
        ]

        # Extract the Mercury and Zinc forecast percentages from the predicted file
        mercury_predicted = df_predicted['Forecast'].tolist()
        zinc_predicted = df_predicted['Forecast.1'].tolist()

        # Extract the Mercury and Zinc actual percentages from the actual file
        mercury_actual = df_actual['Mercury (%)'].tolist()
        zinc_actual = df_actual['Zinc (%)'].tolist()

        return {
            "mineralData": mineral_data,
            "forecast": forecast,
            "mercuryPredicted": mercury_predicted,
            "zincPredicted": zinc_predicted,
            "mercuryActual": mercury_actual,
            "zincActual": zinc_actual
        }
    except Exception as e:
        raise Exception(f"Error in data processing: {str(e)}")

if __name__ == "__main__":
    try:
        predicted_file = sys.argv[1]
        actual_file = sys.argv[2]

        result = process_data(predicted_file, actual_file)
        print(json.dumps(result), flush=True)
    except Exception as e:
        print(json.dumps({"error": str(e)}), flush=True)
        sys.exit(1)


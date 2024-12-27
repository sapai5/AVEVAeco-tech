FROM python:3.9

WORKDIR /app

COPY requirements.txt .

RUN pip install --upgrade pip

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

COPY .env .env

EXPOSE 5000

CMD ["gunicorn", "-b", "0.0.0.0:5000", "-k", "eventlet", "app:app"]


FROM python:3.11-slim

WORKDIR /app

# Install system dependencies needed for psycopg2 / compiling
RUN apt-get update && apt-get install -y gcc libpq-dev && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire source tree into the container
COPY . .

# Expose the API port
EXPOSE 8000

# Run uvicorn without --reload for production
CMD ["uvicorn", "src.api.main:app", "--host", "0.0.0.0", "--port", "8000"]

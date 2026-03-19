FROM python:3.11-slim

WORKDIR /app

# Install system dependencies needed for psycopg2 / compiling
RUN apt-get update && apt-get install -y gcc libpq-dev && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire source tree into the container
COPY . .

# Expose the port the app runs on
EXPOSE 8000

# Expose the port the app runs on
EXPOSE 8000

# Start the server
CMD ["uvicorn", "src.api.main:app", "--host", "0.0.0.0", "--port", "8000"]

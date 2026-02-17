# Use Python 3.11 slim as base
FROM python:3.11-slim

# Install system dependencies for OpenCV / Pillow
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade -r requirements.txt

# Copy app files, including model
COPY . /app

# Expose port for Hugging Face Spaces
EXPOSE 7860

# Start FastAPI with Uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
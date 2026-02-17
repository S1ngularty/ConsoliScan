FROM python:3.11-slim

# Create a non-root user
RUN useradd -m -u 1000 user
USER user
ENV PATH="/home/user/.local/bin:$PATH"

WORKDIR /app

# Copy requirements and install
COPY --chown=user requirements.txt requirements.txt
RUN pip install --no-cache-dir --upgrade -r requirements.txt

# Copy app and model
COPY --chown=user . /app

# Run FastAPI directly
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7860"]

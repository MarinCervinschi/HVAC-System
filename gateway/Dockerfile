FROM python:3.14-rc-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY gateway/ ./gateway/
COPY config/ ./config/
COPY smart_objects/ ./smart_objects/

# Set PYTHONPATH so Python can find our modules
ENV PYTHONPATH=/app

EXPOSE 5684/udp

CMD ["python", "gateway/main.py"]

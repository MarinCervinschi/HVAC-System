FROM python:3.14-rc-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY data_collector/ ./data_collector/
COPY config/ ./config/
COPY smart_objects/ ./smart_objects/

# Set PYTHONPATH so Python can find our modules
ENV PYTHONPATH=/app

EXPOSE 7070
EXPOSE 5683/udp

CMD ["python", "data_collector/app.py"]

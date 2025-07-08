FROM python:3.14-rc-slim

WORKDIR /cloud_simulator

COPY app.py .

RUN pip install flask influxdb-client

EXPOSE 5002

CMD ["python", "app.py"]

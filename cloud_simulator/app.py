from flask import Flask, request
import logging
from influxdb_client import InfluxDBClient, Point, WritePrecision
from influxdb_client.client.write_api import SYNCHRONOUS
import os

INFLUX_URL = os.getenv("INFLUX_URL", "http://influxdb:8086")
INFLUX_TOKEN = os.getenv("INFLUX_TOKEN", "my-secret-token")
INFLUX_ORG = os.getenv("INFLUX_ORG", "hvac-org")
INFLUX_BUCKET = os.getenv("INFLUX_BUCKET", "hvac_data")

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)

client = InfluxDBClient(url=INFLUX_URL, token=INFLUX_TOKEN, org=INFLUX_ORG)
write_api = client.write_api(write_options=SYNCHRONOUS)


@app.route("/api/sync", methods=["POST"])
def receive_sync():
    data = request.json
    room_id = data.get("room_id")
    entries = data.get("telemetries", [])

    logging.info(
        f"📥 Received telemetry sync from room {room_id}: {len(entries)} entries"
    )

    try:
        for telemetry in entries:
            metadata = telemetry.get("metadata", {})
            point = (
                Point(telemetry["type"])
                .tag("room_id", metadata.get("room_id"))
                .tag("rack_id", metadata.get("rack_id") or "none")
                .tag("object_id", metadata.get("object_id"))
                .tag("resource_id", metadata.get("resource_id"))
            )

            if "data_value" in telemetry:
                point = point.field("value", telemetry["data_value"])

            elif "event_data" in telemetry:
                event_data = telemetry["event_data"]
                for key, val in event_data.get("new_state", {}).items():
                    if isinstance(val, (int, float)):
                        point = point.field(key, val)

            point = point.time(telemetry["timestamp"], WritePrecision.MS)

            write_api.write(bucket=INFLUX_BUCKET, org=INFLUX_ORG, record=point)

    except Exception as e:
        logging.error(f"❌ Failed to write to InfluxDB: {e}")
        return {"status": "error", "message": str(e)}, 500

    return {"status": "success"}, 200


@app.errorhandler(404)
def not_found(error):
    return {"message": "Cloud Simulator resourece not found"}, 404


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=7171)

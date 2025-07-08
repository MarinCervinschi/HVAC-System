from flask import Flask
from flask_restful import Api
from data_collector.resources.room import RoomListAPI, RoomDetailAPI
from data_collector.resources.rack import RackDetailAPI
from data_collector.resources.device import DeviceControlAPI
from data_collector.resources.policy import PolicyUpdateAPI
from data_collector.resources.policy import PolicyRoomAPI
from data_collector.resources.policy import PolicyRackAPI
from data_collector.core.manager import HVACSystemManager
from flask_cors import CORS
import json
import logging

import os
import sys

project_root = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, project_root)

# Configure logging
#logging.basicConfig(level=logging.INFO)

BASE_URL = "/hvac/api"
CLOUD_URL = "http://cloud-simulator:7171/api"


def create_app() -> Flask:
    app = Flask(__name__)
    CORS(app, origins="*")  # Enable CORS for all domains
    api = Api(app)

    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    rooms_config_path = os.path.join(
        base_dir, "data_collector", "conf", "rooms_config.json"
    )
    policy_file_path = os.path.join(base_dir, "data_collector", "conf", "policy.json")

    with open(rooms_config_path) as f:
        room_configs = json.load(f).get("rooms", [])

    system_manager = HVACSystemManager(
        room_configs=room_configs, policy_file=policy_file_path, cloud_url=CLOUD_URL
    )

    # Room endpoints
    api.add_resource(
        RoomListAPI,
        f"{BASE_URL}/rooms",
        resource_class_kwargs={"system_manager": system_manager},
    )
    api.add_resource(
        RoomDetailAPI,
        f"{BASE_URL}/room/<string:room_id>",
        resource_class_kwargs={"system_manager": system_manager},
    )
    api.add_resource(
        RackDetailAPI,
        f"{BASE_URL}/room/<string:room_id>/rack/<string:rack_id>",
        resource_class_kwargs={"system_manager": system_manager},
    )
    api.add_resource(
        DeviceControlAPI,
        f"{BASE_URL}/proxy/forward",
        resource_class_kwargs={"system_manager": system_manager},
    )
    api.add_resource(
        PolicyUpdateAPI,
        f"{BASE_URL}/policies",
        resource_class_kwargs={"system_manager": system_manager},
    )

    api.add_resource(
        PolicyRoomAPI,
        f"{BASE_URL}/room/<string:room_id>/policies",
        resource_class_kwargs={"system_manager": system_manager},
    )

    api.add_resource(
        PolicyRackAPI,
        f"{BASE_URL}/room/<string:room_id>/rack/<string:rack_id>/device/<string:object_id>/policies",
        resource_class_kwargs={"system_manager": system_manager},
    )

    @app.errorhandler(404)
    def not_found(error):
        return {"message": "Resource not found"}, 404

    return app

if __name__ == "__main__":
    try:
        flask_env = os.getenv("FLASK_ENV")
        print(f"FLASK_ENV: {flask_env}")
    except Exception as e:
        logging.info(f"Error retrieving FLASK_ENV: {e}")
    
    app = create_app()
    app.logger.setLevel(logging.INFO)
    app.logger.info("Starting HVAC System Manager...")
    app.run(host="0.0.0.0", port=7070)
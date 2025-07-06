from flask import Flask
from flask_restful import Api
from data_collector.resources.room import RoomListAPI, RoomDetailAPI
from data_collector.resources.rack import RackDetailAPI
from data_collector.resources.device import DeviceControlAPI
from data_collector.resources.policy import PolicyUpdateAPI
from flask_cors import CORS
import json

from data_collector.core.manager import HVACSystemManager
import os

BASE_URL = "/hvac/api"


def create_app() -> Flask:
    app = Flask(__name__)
    CORS(app)
    api = Api(app)

    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    rooms_config_path = os.path.join(
        base_dir, "data_collector", "conf", "rooms_config.json"
    )
    policy_file_path = os.path.join(base_dir, "data_collector", "conf", "policy.json")

    with open(rooms_config_path) as f:
        room_configs = json.load(f).get("rooms", [])

    system_manager = HVACSystemManager(
        room_configs=room_configs, policy_file=policy_file_path
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
        f"{BASE_URL}/room/<string:room_id>/rack/<string:rack_id>/device/<string:device_id>/fan/control",
        resource_class_kwargs={"system_manager": system_manager},
    )
    api.add_resource(
        PolicyUpdateAPI,
        f"{BASE_URL}/policies",
        resource_class_kwargs={"system_manager": system_manager},
    )

    @app.errorhandler(404)
    def not_found(error):
        return {"message": "Resource not found"}, 404

    return app

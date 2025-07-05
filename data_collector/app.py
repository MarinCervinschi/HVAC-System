from flask import Flask
from flask_restful import Api
from data_collector.resources.room import RoomListAPI, RoomDetailAPI
from data_collector.resources.rack import RackDetailAPI
from data_collector.resources.device import DeviceControlAPI
from data_collector.resources.policy import PolicyUpdateAPI

import json

from data_collector.core.manager import HVACSystemManager
import os


def create_app() -> Flask:
    app = Flask(__name__)
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
        "/hvac/rooms",
        resource_class_kwargs={"system_manager": system_manager},
    )
    api.add_resource(
        RoomDetailAPI,
        "/hvac/room/<string:room_id>",
        resource_class_kwargs={"system_manager": system_manager},
    )
    api.add_resource(
        RackDetailAPI,
        "/hvac/room/<string:room_id>/rack/<string:rack_id>",
        resource_class_kwargs={"system_manager": system_manager},
    )
    api.add_resource(
        DeviceControlAPI,
        "/hvac/room/<string:room_id>/rack/<string:rack_id>/device/<string:device_id>/fan/control",
        resource_class_kwargs={"system_manager": system_manager},
    )
    api.add_resource(
        PolicyUpdateAPI,
        "/hvac/policies",
        resource_class_kwargs={"system_manager": system_manager},
    )

    return app

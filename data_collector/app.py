from flask import Flask, current_app
from flask_restful import Api
from resources.room import RoomListAPI, RoomDetailAPI
from resources.rack import RackDetailAPI
from resources.device import DeviceControlAPI
from resources.policy import PolicyUpdateAPI

import json
import logging
from typing import Optional

from core.manager import HVACSystemManager


def get_system_manager() -> Optional[HVACSystemManager]:
    try:
        return current_app.config.get("SYSTEM_MANAGER")
    except RuntimeError:
        print("Error: The application context is not available.")
        return None


def create_app() -> Flask:
    app = Flask(__name__)
    api = Api(app)

    with open("conf/rooms_config.json") as f:
        room_configs = json.load(f).get("rooms", [])

    system_manager = HVACSystemManager(
        room_configs=room_configs, policy_file="conf/policy.json"
    )
    app.config["SYSTEM_MANAGER"] = system_manager

    # Room endpoints
    api.add_resource(RoomListAPI, "/hvac/rooms")
    api.add_resource(RoomDetailAPI, "/hvac/room/<string:room_id>")
    api.add_resource(RackDetailAPI, "/hvac/room/<string:room_id>/rack/<string:rack_id>")
    api.add_resource(
        DeviceControlAPI,
        "/hvac/room/<string:room_id>/rack/<string:rack_id>/device/<string:device_id>/fan/control",
    )
    api.add_resource(PolicyUpdateAPI, "/hvac/policies")

    return app


if __name__ == "__main__":
    app = create_app()
    app.logger.setLevel(logging.INFO)
    app.logger.info("Starting HVAC System Manager...")
    app.run(host="0.0.0.0", port=5000)

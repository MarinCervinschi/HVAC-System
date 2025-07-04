from flask import Flask
from flask_restful import Api
from data_collector.resources.room import RoomListAPI, RoomDetailAPI
from data_collector.resources.rack import RackDetailAPI
from data_collector.resources.device import DeviceControlAPI
from data_collector.resources.policy import PolicyUpdateAPI

import json
import logging

from data_collector.core.manager import HVACSystemManager
from dotenv import load_dotenv
import os


def create_app() -> Flask:
    app = Flask(__name__)
    api = Api(app)

    with open("data_collector/conf/rooms_config.json") as f:
        room_configs = json.load(f).get("rooms", [])

    system_manager = HVACSystemManager(
        room_configs=room_configs, policy_file="data_collector/conf/policy.json"
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


if __name__ == "__main__":
    load_dotenv()  # Carica le variabili da .flaskenv e .env

    # Verifica se una variabile tipica di .flaskenv è stata letta, ad esempio FLASK_ENV
    flask_env = os.getenv("FLASK_ENV")
    print(f"FLASK_ENV: {flask_env}")

    app = create_app()
    app.logger.setLevel(logging.INFO)
    app.logger.info("Starting HVAC System Manager...")
    app.run(debug=True)

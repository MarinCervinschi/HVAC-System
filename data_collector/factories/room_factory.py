from data_collector.models.Room import Room
from factories.rack_factory import RackFactory
from factories.smart_object_factory import SmartObjectFactory
""" from smart.EnvironmentMonitor import EnvironmentMonitor
from smart.CoolingSystemHub import CoolingSystemHub """

from typing import Dict, Any
import paho.mqtt.client as mqtt


class RoomFactory:

    @staticmethod
    def create_room(room_conf: Dict[str, Any], mqtt_client: mqtt.Client) -> Room:
        room_id = room_conf["room_id"]
        room = Room(room_id)

        """ env_monitor = EnvironmentMonitor(room_id, None, mqtt_client)
        cooling_hub = CoolingSystemHub(room_id, None, mqtt_client)

        room.add_smart_object(env_monitor)
        room.add_smart_object(cooling_hub) """

        for device_conf in room_conf.get("devices", []):
            device = SmartObjectFactory.create_device(
                device_conf=device_conf,
                room_id=room_id,
                rack_id=None,
                mqtt_client=mqtt_client
            )
            room.add_smart_object(device)

        for rack_conf in room_conf.get("racks", []):
            rack = RackFactory.create_rack(rack_conf, room_id, mqtt_client)
            room.add_rack(rack)

        return room

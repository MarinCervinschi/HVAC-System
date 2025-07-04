from data_collector.models.Rack import Rack
from smart_objects.devices.rack_cooling_unit import RackCoolingUnit

""" from smart_objects.devices.WaterLoopController import WaterLoopController
from smart_objects.devices.AirflowManager import AirflowManager
 """
from typing import Dict, Any
import paho.mqtt.client as mqtt


class RackFactory:

    @staticmethod
    def create_rack(
        rack_conf: Dict[str, Any], room_id: str, mqtt_client: mqtt.Client
    ) -> Rack:
        rack_id = rack_conf["rack_id"]
        rack_type = rack_conf.get("type", "air_colled")
        rack = Rack(rack_id, rack_type)

        rcu = RackCoolingUnit(room_id, rack_id, mqtt_client)
        rack.add_smart_object(rcu)

        """ if rack_type == "water_colled":
            wlc = WaterLoopController(room_id, rack_id, mqtt_client)
            rack.add_smart_object(wlc)
        elif rack_type == "air_colled":
            afm = AirflowManager(room_id, rack_id, mqtt_client)
            rack.add_smart_object(afm)
        else:
            raise ValueError(f"❌ Rack type '{rack_type}' not supported") """

        return rack

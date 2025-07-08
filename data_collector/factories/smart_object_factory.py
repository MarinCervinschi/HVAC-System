from smart_objects.devices.water_loop_controller import WaterLoopController
from smart_objects.devices.environment_monitor import EnvironmentMonitor
from smart_objects.devices.airflow_manager import AirflowManager
from smart_objects.devices.energy_metering_unit import EnergyMeteringUnit
from smart_objects.devices.cooling_system_hub import CoolingSystemHub

from smart_objects.devices.SmartObject import SmartObject
from smart_objects.devices.rack_cooling_unit import RackCoolingUnit

from typing import Dict, Any
import paho.mqtt.client as mqtt


class SmartObjectFactory:

    @staticmethod
    def create_device(
        device_conf: Dict[str, Any],
        room_id: str,
        rack_id: str | None,
        mqtt_client: mqtt.Client,
    ) -> SmartObject:
        """Create a SmartObject based on the provided configuration."""
        device_type = device_conf["type"]

        if device_type == "RackCoolingUnit":
            return RackCoolingUnit(room_id, rack_id, mqtt_client)

        elif device_type == "WaterLoopController":
            return WaterLoopController(room_id, rack_id, mqtt_client)

        elif device_type == "EnvironmentMonitor":
            return EnvironmentMonitor(room_id, rack_id, mqtt_client)

        elif device_type == "AirflowManager":
            return AirflowManager(room_id, rack_id, mqtt_client)

        elif device_type == "EnergyMeteringUnit":
            return EnergyMeteringUnit(room_id, rack_id, mqtt_client)

        elif device_type == "CoolingSystemHub":
            return CoolingSystemHub(room_id, rack_id, mqtt_client)

        else:
            raise ValueError(f"❌ Unsupported SmartObject type: {device_type}")

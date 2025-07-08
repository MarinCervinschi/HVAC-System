import logging
from typing import ClassVar
import paho.mqtt.client as mqtt
from .SmartObject import SmartObject
from ..messages.telemetry_message import TelemetryMessage
from smart_objects.sensors.energy_sensor import EnergySensor
from config.mqtt_conf_params import MqttConfigurationParameters


class EnergyMeteringUnit(SmartObject):
    OBJECT_ID: ClassVar[str] = "energy_metering_unit"

    def __init__(
        self,
        room_id: str,
        rack_id: str,
        mqtt_client: mqtt.Client = None,
    ):
        super().__init__(self.OBJECT_ID, room_id, rack_id, mqtt_client)
        self.resource_map["energy"] = EnergySensor(f"{self.OBJECT_ID}_energy")

        self.logger = logging.getLogger(f"{self.OBJECT_ID}")

    def get_energy(self) -> float:
        try:
            energy_sensor = self.get_resource("energy")
            return energy_sensor.load_updated_value()
        except Exception as e:
            self.logger.error(f"Error reading energy: {e}")
            return 0.0

    def _register_resource_listeners(self) -> None:
        """Register listeners for resource data changes."""
        try:
            for resource in self.resource_map.values():
                if isinstance(resource, EnergySensor):
                    self._register_energy_sensor_listener()

        except Exception as e:
            self.logger.error(f"Error registering resources: {e}")
            raise e

    def _register_energy_sensor_listener(self) -> None:
        energy_sensor = self.get_resource("energy")
        if energy_sensor is None:
            self.logger.error("Energy sensor resource not found!")
            return

        topic = MqttConfigurationParameters.build_telemetry_rack_topic(
            room_id=self.room_id,
            rack_id=self.rack_id,
            device_id=self.object_id,
            resource_id=energy_sensor.resource_id,
        )

        listener = self._get_listener(
            data_type=energy_sensor.data_type,
            message_type=TelemetryMessage,
            topic=topic,
        )

        energy_sensor.add_data_listener(listener)

        self.logger.info(
            f"📢 Registered energy sensor listener for {energy_sensor.resource_id} on topic {topic}"
        )

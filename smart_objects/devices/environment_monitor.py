import logging
from typing import ClassVar
import paho.mqtt.client as mqtt
from .SmartObject import SmartObject
from ..messages.telemetry_message import TelemetryMessage
from smart_objects.sensors.humidity_sensor import HumiditySensor
from config.mqtt_conf_params import MqttConfigurationParameters
from smart_objects.sensors.temperature_sensor import TemperatureSensor


class EnvironmentMonitor(SmartObject):
    OBJECT_ID: ClassVar[str] = "environment_monitor"

    def __init__(
        self,
        room_id: str,
        rack_id: str,
        mqtt_client: mqtt.Client = None,
    ):
        SmartObject.__init__(self, self.OBJECT_ID, room_id, rack_id, mqtt_client)

        self.resource_map["temperature"] = TemperatureSensor(f"{self.OBJECT_ID}_temp")
        self.resource_map["humidity"] = HumiditySensor(f"{self.OBJECT_ID}_humidity")

        self.logger = logging.getLogger(f"{self.OBJECT_ID}")

    def get_temperature(self) -> float:
        try:
            temp_sensor = self.get_resource("temperature")
            return temp_sensor.load_updated_value()
        except Exception as e:
            self.logger.error(f"Error reading temperature: {e}")
            return 0.0

    def get_humidity(self) -> float:
        try:
            humidity_sensor = self.get_resource("humidity")
            return humidity_sensor.load_updated_value()
        except Exception as e:
            self.logger.error(f"Error reading humidity: {e}")
            return 0.0

    def _register_resource_listeners(self) -> None:
        """Register listeners for resource data changes."""
        try:
            for resource in self.resource_map.values():
                if isinstance(resource, TemperatureSensor):
                    self._register_temperature_sensor_listener()
                if isinstance(resource, HumiditySensor):
                    self._register_humidity_sensor_listener()

        except Exception as e:
            self.logger.error(f"Error registering resources: {e}")
            raise e

    def _register_temperature_sensor_listener(self) -> None:
        temperature_sensor = self.get_resource("temperature")
        if temperature_sensor is None:
            self.logger.error("Temperature sensor resource not found!")
            return

        topic = MqttConfigurationParameters.build_telemetry_room_topic(
            room_id=self.room_id,
            device_id=self.object_id,
            resource_id=temperature_sensor.resource_id,
        )

        listener = self._get_listener(
            data_type=temperature_sensor.data_type,
            message_type=TelemetryMessage,
            topic=topic,
        )

        temperature_sensor.add_data_listener(listener)

        self.logger.info(
            f"📢 Registered temperature sensor listener for {temperature_sensor.resource_id} on topic {topic}"
        )

    def _register_humidity_sensor_listener(self) -> None:
        humidity_sensor = self.get_resource("humidity")
        if humidity_sensor is None:
            self.logger.error("Humidity sensor resource not found!")
            return

        topic = MqttConfigurationParameters.build_telemetry_room_topic(
            room_id=self.room_id,
            device_id=self.object_id,
            resource_id=humidity_sensor.resource_id,
        )

        listener = self._get_listener(
            data_type=humidity_sensor.data_type,
            message_type=TelemetryMessage,
            topic=topic,
        )

        humidity_sensor.add_data_listener(listener)

        self.logger.info(
            f"📢 Registered humidity sensor listener for {humidity_sensor.resource_id} on topic {topic}"
        )

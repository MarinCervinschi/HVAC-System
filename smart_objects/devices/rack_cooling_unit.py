import logging
import time
from typing import Dict, Any, Optional
import paho.mqtt.client as mqtt
from .SmartObject import SmartObject
from ..resources.sensors.temperature_sensor import TemperatureSensor
from ..resources.actuators.fan_actuator import FanActuator
from ..messages.telemetry_message import TelemetryMessage
from config.mqtt_conf_params import MqttConfigurationParameters
from smart_objects.resources.SmartObjectResource import SmartObjectResource


class RackCoolingUnit(SmartObject):

    TEMP_THRESHOLD_LOW = 28.0  # Below this, reduce fan speed
    TEMP_THRESHOLD_HIGH = 35.0  # Above this, increase fan speed
    TEMP_THRESHOLD_CRITICAL = 40.0  # Above this, maximum fan speed

    def __init__(
        self,
        object_id: str,
        room_id: str,
        rack_id: str,
        mqtt_client: mqtt.Client = None,
    ):

        super().__init__(object_id, room_id, rack_id, mqtt_client)

        self.resource_map["temperature"] = TemperatureSensor(f"{object_id}_temp")
        self.resource_map["fan"] = FanActuator(f"{object_id}_fan")

        self.logger = logging.getLogger(f"{__name__}.{object_id}")
        self.logger.info(f"Rack cooling unit {object_id} initialized at {room_id}")

    def control_fan(self, command: Dict[str, Any]) -> bool:
        try:
            fan = self.get_resource("fan")
            success = fan.apply_command(command)

            if success:
                self.logger.info(f"Fan control command applied: {command}")
            else:
                self.logger.warning(f"Failed to apply fan control command: {command}")

            return success

        except Exception as e:
            self.logger.error(f"Error controlling fan: {e}")
            return False

    def get_temperature(self) -> float:
        try:
            temp_sensor = self.get_resource("temperature")
            return temp_sensor.load_updated_value()
        except Exception as e:
            self.logger.error(f"Error reading temperature: {e}")
            return 0.0

    def get_fan_status(self) -> Dict[str, Any]:
        try:
            fan = self.get_resource("fan")
            return fan.get_current_state()
        except Exception as e:
            self.logger.error(f"Error getting fan status: {e}")
            return {}

    def _register_resource_listeners(self) -> None:
        """Register listeners for resource data changes."""
        try:
            for resource in self.resource_map.values():
                if isinstance(resource, TemperatureSensor):
                    self._register_temperature_sensor_listener()
                elif isinstance(resource, FanActuator):
                    pass

        except Exception as e:
            self.logger.error(f"Error registering resources: {e}")
            raise e

    def _register_temperature_sensor_listener(self) -> None:
        temperature_sensor = self.get_resource("temperature")
        if temperature_sensor is None:
            self.logger.error("Temperature sensor resource not found!")
            return

        topic = "{0}/{1}/{2}/{3}/{4}/{5}/{6}/{7}".format(
            MqttConfigurationParameters.BASIC_TOPIC,
            self.room_id,
            MqttConfigurationParameters.RACK_TOPIC,
            self.rack_id,
            MqttConfigurationParameters.DEVICE_TOPIC,
            self.object_id,
            MqttConfigurationParameters.TELEMETRY_TOPIC,
            temperature_sensor.resource_id,
        )

        listener = self._get_listener(
            data_type=temperature_sensor.data_type,
            message_type=TelemetryMessage,
            topic=topic,
        )

        temperature_sensor.add_data_listener(listener)

        self.logger.info(
            f"Registered temperature sensor listener for {temperature_sensor.resource_id} on topic {topic} with QoS = 0, retain = False"
        )

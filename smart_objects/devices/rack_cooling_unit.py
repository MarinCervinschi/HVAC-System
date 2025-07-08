import logging
from aiocoap import resource
import paho.mqtt.client as mqtt
from .SmartObject import SmartObject
from typing import Dict, Any, ClassVar
from ..messages.telemetry_message import TelemetryMessage
from smart_objects.messages.control_message import ControlMessage
from smart_objects.actuators.fan_actuator import FanActuator
from config.mqtt_conf_params import MqttConfigurationParameters
from config.coap_conf_params import CoapConfigurationParameters
from smart_objects.resources.CoapControllable import CoapControllable
from smart_objects.sensors.temperature_sensor import TemperatureSensor
from smart_objects.resources.actuator_control_resource import ActuatorControlResource


class RackCoolingUnit(SmartObject, CoapControllable):

    OBJECT_ID: ClassVar[str] = "rack_cooling_unit"

    def __init__(
        self,
        room_id: str,
        rack_id: str,
        mqtt_client: mqtt.Client = None,
    ):
        SmartObject.__init__(self, self.OBJECT_ID, room_id, rack_id, mqtt_client)
        CoapControllable.__init__(self)

        self.resource_map["temperature"] = TemperatureSensor(f"{self.OBJECT_ID}_temp")
        self.resource_map["fan"] = FanActuator(f"{self.OBJECT_ID}_fan")

        self.logger = logging.getLogger(f"{self.OBJECT_ID}")

    def get_temperature(self) -> float:
        try:
            temp_sensor = self.get_resource("temperature")
            return temp_sensor.load_updated_value()
        except Exception as e:
            self.logger.error(f"Error reading temperature: {e}")
            return 0.0

    def get_fan_status(self) -> Dict[str, Any]:
        try:
            fan: FanActuator = self.get_resource("fan")
            return fan.get_current_state()
        except Exception as e:
            self.logger.error(f"Error getting fan status: {e}")
            return {}

    def get_coap_resource_tree(self) -> resource.Site:
        """Return the CoAP resource tree for this smart object."""
        site = resource.Site()
        fan_actuator = self.get_resource("fan")

        if fan_actuator is None:
            self.logger.error("Fan actuator resource not found!")
            return None

        site.add_resource(
            (".well-known", "core"),
            resource.WKCResource(site.get_resources_as_linkheader, impl_info=None),
        )

        resource_path = CoapConfigurationParameters.build_coap_rack_path(
            room_id=self.room_id,
            rack_id=self.rack_id,
            device_id=self.object_id,
            resource_id="fan",
        )

        self.logger.info(
            f"📢 Registered CoAP fan control resource for {fan_actuator.resource_id} at path: {'/'.join(resource_path)}"
        )

        attributes = {
            "room_id": self.room_id,
            "rack_id": self.rack_id,
            "object_id": self.object_id,
        }
        site.add_resource(
            resource_path,
            ActuatorControlResource(fan_actuator, attributes),
        )

        return site

    def _register_resource_listeners(self) -> None:
        """Register listeners for resource data changes."""
        try:
            for resource in self.resource_map.values():
                if isinstance(resource, TemperatureSensor):
                    self._register_temperature_sensor_listener()
                elif isinstance(resource, FanActuator):
                    self._register_fan_actuator_listener()

        except Exception as e:
            self.logger.error(f"Error registering resources: {e}")
            raise e

    def _register_temperature_sensor_listener(self) -> None:
        temperature_sensor = self.get_resource("temperature")
        if temperature_sensor is None:
            self.logger.error("Temperature sensor resource not found!")
            return

        topic = MqttConfigurationParameters.build_telemetry_rack_topic(
            room_id=self.room_id,
            rack_id=self.rack_id,
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

    def _register_fan_actuator_listener(self) -> None:
        """Register listener for fan actuator state changes."""
        fan_actuator = self.get_resource("fan")
        if fan_actuator is None:
            self.logger.error("Fan actuator resource not found!")
            print("Fan actuator resource not found!")
            return

        topic = MqttConfigurationParameters.build_control_rack_topic(
            room_id=self.room_id,
            rack_id=self.rack_id,
            device_id=self.object_id,
            resource_id=fan_actuator.resource_id,
        )

        listener = self._get_listener(
            data_type=fan_actuator.data_type,
            message_type=ControlMessage,
            topic=topic,
            qos=1,
        )

        fan_actuator.add_data_listener(listener)

        self.logger.info(
            f"📢 Registered fan actuator listener for {fan_actuator.resource_id} on topic {topic}"
        )

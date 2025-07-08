import logging
from typing import ClassVar
from aiocoap import resource
from typing import Dict, Any
import paho.mqtt.client as mqtt
from .SmartObject import SmartObject
from ..messages.telemetry_message import TelemetryMessage
from smart_objects.messages.control_message import ControlMessage
from smart_objects.actuators.pump_actuator import PumpActuator
from config.mqtt_conf_params import MqttConfigurationParameters
from smart_objects.resources.CoapControllable import CoapControllable
from smart_objects.sensors.pression_sensor import PressureSensor
from smart_objects.resources.actuator_control_resource import ActuatorControlResource


class WaterLoopController(SmartObject, CoapControllable):
    OBJECT_ID: ClassVar[str] = "water_loop_controller"

    def __init__(
        self,
        room_id: str,
        rack_id: str,
        mqtt_client: mqtt.Client = None,
    ):
        SmartObject.__init__(self, self.OBJECT_ID, room_id, rack_id, mqtt_client)
        CoapControllable.__init__(self)

        self.resource_map["pressure"] = PressureSensor(f"{self.OBJECT_ID}_pressure")
        self.resource_map["pump"] = PumpActuator(f"{self.OBJECT_ID}_pump")

        self.logger = logging.getLogger(f"{self.OBJECT_ID}")

    def get_pressure(self) -> float:
        try:
            pressure_sensor = self.get_resource("pressure")
            return pressure_sensor.load_updated_value()
        except Exception as e:
            self.logger.error(f"Error reading pressure: {e}")
            return 0.0

    def get_pump_status(self) -> Dict[str, Any]:
        try:
            pump: PumpActuator = self.get_resource("pump")
            return pump.get_current_state()
        except Exception as e:
            self.logger.error(f"Error getting pump status: {e}")
            return {}

    def get_coap_resource_tree(self) -> resource.Site:
        """Return the CoAP resource tree for this smart object."""
        site = resource.Site()
        pump_actuator = self.get_resource("pump")

        if pump_actuator is None:
            self.logger.error("Pump actuator resource not found!")
            return None

        site.add_resource(
            (".well-known", "core"),
            resource.WKCResource(site.get_resources_as_linkheader, impl_info=None),
        )

        # Example: /hvac/room/{room_id}/rack/{rack_id}/device/{object_id}/pump/control
        resource_path = [
            "hvac",
            "room",
            self.room_id,
            "rack",
            self.rack_id,
            "device",
            self.object_id,
            "pump",
            "control",
        ]

        self.logger.info(
            f"📢 Registered CoAP pump control resource for {pump_actuator.resource_id} at path: {'/'.join(resource_path)}"
        )

        attributes = {
            "room_id": self.room_id,
            "rack_id": self.rack_id,
            "object_id": self.object_id,
        }

        site.add_resource(
            resource_path,
            ActuatorControlResource(pump_actuator, attributes),
        )

        return site

    def _register_resource_listeners(self) -> None:
        """Register listeners for resource data changes."""
        try:
            for resource in self.resource_map.values():
                if isinstance(resource, PressureSensor):
                    self._register_pressure_sensor_listener()
                elif isinstance(resource, PumpActuator):
                    self._register_pump_actuator_listener()

        except Exception as e:
            self.logger.error(f"Error registering resources: {e}")
            raise e

    def _register_pressure_sensor_listener(self) -> None:
        pressure_sensor = self.get_resource("pressure")
        if pressure_sensor is None:
            self.logger.error("Pressure sensor resource not found!")
            return

        topic = MqttConfigurationParameters.build_telemetry_rack_topic(
            room_id=self.room_id,
            rack_id=self.rack_id,
            device_id=self.object_id,
            resource_id=pressure_sensor.resource_id,
        )

        listener = self._get_listener(
            data_type=pressure_sensor.data_type,
            message_type=TelemetryMessage,
            topic=topic,
        )

        pressure_sensor.add_data_listener(listener)

        self.logger.info(
            f"📢 Registered pressure sensor listener for {pressure_sensor.resource_id} on topic {topic}"
        )

    def _register_pump_actuator_listener(self) -> None:
        pump_actuator = self.get_resource("pump")
        if pump_actuator is None:
            self.logger.error("Pump actuator resource not found!")
            return

        topic = MqttConfigurationParameters.build_control_rack_topic(
            room_id=self.room_id,
            rack_id=self.rack_id,
            device_id=self.object_id,
            resource_id=pump_actuator.resource_id,
        )

        listener = self._get_listener(
            data_type=pump_actuator.data_type,
            message_type=ControlMessage,
            topic=topic,
        )

        pump_actuator.add_data_listener(listener)

        self.logger.info(
            f"📢 Registered pump actuator listener for {pump_actuator.resource_id} on topic {topic}"
        )

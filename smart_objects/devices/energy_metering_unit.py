import logging
from aiocoap import resource
from typing import ClassVar, Dict, Any
import paho.mqtt.client as mqtt
from .SmartObject import SmartObject
from ..messages.telemetry_message import TelemetryMessage
from smart_objects.actuators.switch_actuator import SwitchActuatorConcrete
from config.mqtt_conf_params import MqttConfigurationParameters
from smart_objects.resources.CoapControllable import CoapControllable
from smart_objects.sensors.energy_sensor import EnergySensor
from smart_objects.resources.actuator_control_resource import ActuatorControlResource


class EnergyMeteringUnit(SmartObject, CoapControllable):
    OBJECT_ID: ClassVar[str] = "energy_metering_unit"

    def __init__(
        self,
        room_id: str,
        rack_id: str,
        mqtt_client: mqtt.Client = None,
    ):
        SmartObject.__init__(self, self.OBJECT_ID, room_id, rack_id, mqtt_client)
        CoapControllable.__init__(self)

        self.resource_map["energy"] = EnergySensor(f"{self.OBJECT_ID}_energy")
        self.resource_map["switch"] = SwitchActuatorConcrete(f"{self.OBJECT_ID}_switch")

        self.logger = logging.getLogger(f"{self.OBJECT_ID}")

    def get_energy(self) -> float:
        try:
            energy_sensor = self.get_resource("energy")
            return energy_sensor.load_updated_value()
        except Exception as e:
            self.logger.error(f"Error reading energy: {e}")
            return 0.0

    def get_switch_status(self) -> Dict[str, Any]:
        try:
            switch: SwitchActuatorConcrete = self.get_resource("switch")
            return switch.get_current_state()
        except Exception as e:
            self.logger.error(f"Error getting switch status: {e}")
            return {}

    def get_coap_resource_tree(self) -> resource.Site:
        """Return the CoAP resource tree for this smart object."""
        site = resource.Site()
        switch_actuator = self.get_resource("switch")

        if switch_actuator is None:
            self.logger.error("Switch actuator resource not found!")
            return None

        site.add_resource(
            (".well-known", "core"),
            resource.WKCResource(site.get_resources_as_linkheader, impl_info=None)
        )

        # Example: /hvac/room/{room_id}/rack/{rack_id}/device/{object_id}/switch/control
        resource_path = [
            "hvac",
            "room", self.room_id,
            "rack", self.rack_id,
            "device", self.object_id,
            "switch", "control",
        ]

        self.logger.info(
            f"📢 Registered CoAP switch control resource for {switch_actuator.resource_id} at path: {'/'.join(resource_path)}"
        )
        attributes = {
            "room_id": self.room_id,
            "rack_id": self.rack_id,
            "object_id": self.object_id,
        }

        site.add_resource(
            resource_path,
            ActuatorControlResource(switch_actuator, attributes),
        )

        return site

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

        # /hvac/room/{room_id}/rack/{rack_id}/device/{object_id}/telemetry/{energy_sensor.resource_id}
        topic = "{0}/{1}/{2}/{3}/{4}/{5}/{6}/{7}".format(
            MqttConfigurationParameters.BASIC_TOPIC,
            self.room_id,
            MqttConfigurationParameters.RACK_TOPIC,
            self.rack_id,
            MqttConfigurationParameters.DEVICE_TOPIC,
            self.object_id,
            MqttConfigurationParameters.TELEMETRY_TOPIC,
            energy_sensor.resource_id,
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

import logging
from aiocoap import resource
from typing import ClassVar, Dict, Any
import paho.mqtt.client as mqtt
from .SmartObject import SmartObject
from smart_objects.actuators.cooling_level_actuator import CoolingLevelsActuator
from smart_objects.resources.CoapControllable import CoapControllable
from smart_objects.resources.actuator_control_resource import ActuatorControlResource
from config.mqtt_conf_params import MqttConfigurationParameters
from smart_objects.messages.control_message import ControlMessage


class CoolingSystemHub(SmartObject, CoapControllable):
    OBJECT_ID: ClassVar[str] = "cooling_system_hub"

    def __init__(
        self,
        room_id: str,
        rack_id: str,
        mqtt_client: mqtt.Client = None,
    ):
        SmartObject.__init__(self, self.OBJECT_ID, room_id, rack_id, mqtt_client)
        CoapControllable.__init__(self)

        self.resource_map["cooling_levels"] = CoolingLevelsActuator(
            f"{self.OBJECT_ID}_cooling_levels"
        )

        self.logger = logging.getLogger(f"{self.OBJECT_ID}")

    def get_cooling_levels_status(self) -> Dict[str, Any]:
        try:
            cooling_levels: CoolingLevelsActuator = self.get_resource("cooling_levels")
            return cooling_levels.get_current_state()
        except Exception as e:
            self.logger.error(f"Error getting cooling levels status: {e}")
            return {}

    def get_coap_resource_tree(self) -> resource.Site:
        """Return the CoAP resource tree for this smart object."""
        site = resource.Site()
        cooling_levels_actuator = self.get_resource("cooling_levels")

        if cooling_levels_actuator is None:
            self.logger.error("Cooling levels actuator resource not found!")
            return None

        site.add_resource(
            (".well-known", "core"),
            resource.WKCResource(site.get_resources_as_linkheader, impl_info=None),
        )

        resource_path = [
            "hvac",
            "room",
            self.room_id,
            "device",
            self.object_id,
            "cooling_levels",
            "control",
        ]

        self.logger.info(
            f"📢 Registered CoAP cooling levels control resource for {cooling_levels_actuator.resource_id} at path: {'/'.join(resource_path)}"
        )
        attributes = {
            "room_id": self.room_id,
            "rack_id": self.rack_id,
            "object_id": self.object_id,
        }

        site.add_resource(
            resource_path,
            ActuatorControlResource(cooling_levels_actuator, attributes),
        )

        return site

    def _register_resource_listeners(self) -> None:
        """Register listeners for resource data changes."""
        try:
            for resource in self.resource_map.values():
                if isinstance(resource, CoolingLevelsActuator):
                    self._register_cooling_levels_listener()

        except Exception as e:
            self.logger.error(f"Error registering resources: {e}")
            raise e

    def _register_cooling_levels_listener(self) -> None:
        cooling_levels = self.get_resource("cooling_levels")
        if cooling_levels is None:
            self.logger.error("Cooling levels actuator resource not found!")
            return

        topic = MqttConfigurationParameters.build_control_room_topic(
            room_id=self.room_id,
            device_id=self.object_id,
            resource_id=cooling_levels.resource_id,
        )

        listener = self._get_listener(
            data_type=cooling_levels.data_type,
            message_type=ControlMessage,
            topic=topic,
        )

        cooling_levels.add_data_listener(listener)

        self.logger.info(
            f"📢 Registered cooling levels listener for {cooling_levels.resource_id} on topic {topic}"
        )

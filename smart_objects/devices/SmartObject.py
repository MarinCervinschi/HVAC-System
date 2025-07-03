from typing import Dict
from abc import ABC, abstractmethod
from typing import Generic, TypeVar, List, Any
import json
import paho.mqtt.client as mqtt
import logging
from smart_objects.resources.SmartObjectResource import SmartObjectResource
from ..messages.telemetry_message import TelemetryMessage
from smart_objects.messages.GenericMessage import GenericMessage
from smart_objects.resources.ResourceDataListener import ResourceDataListener
from config.mqtt_conf_params import MqttConfigurationParameters

T = TypeVar("T")


class SmartObject(ABC, Generic[T]):
    def __init__(
        self,
        object_id: str,
        room_id: str,
        rack_id: str,
        mqtt_client: mqtt.Client = None,
    ):
        self.object_id = object_id
        self.room_id = room_id
        self.rack_id = rack_id
        self.mqtt_client = mqtt_client
        self.resource_map: Dict[str, SmartObjectResource] = {}

        self.logger = logging.getLogger(f"{__name__}.{object_id}")

    def get_resource(self, name: str) -> SmartObjectResource:
        return self.resource_map[name]

    def start(self) -> None:
        """Start the SmartObject behavior"""
        try:
            if self.mqtt_client is not None and self.resource_map is not None:
                self.logger.info(
                    f"Starting SmartObject {self.object_id} at {self.room_id}"
                )

                self._register_resource_listeners()
        except Exception as e:
            self.logger.error(f"Error starting SmartObject {self.object_id}: {e}")

    def stop(self) -> None:
        """Stop the SmartObject behavior"""
        self.logger.info(f"Stopping SmartObject {self.object_id} at {self.room_id}")
        if self.resource_map:
            for resource in self.resource_map.values():
                for attr_name in dir(resource):
                    if attr_name.startswith("stop_periodic_"):
                        stop_method = getattr(resource, attr_name)
                        if callable(stop_method):
                            try:
                                stop_method()
                                self.logger.info(
                                    f"Called {attr_name} on resource {resource}"
                                )
                            except Exception as e:
                                self.logger.error(
                                    f"Error calling {attr_name} on resource {resource}: {e}"
                                )

        if self.mqtt_client is not None:
            try:
                self.mqtt_client.disconnect()
                self.logger.info("MQTT client disconnected.")
            except Exception as e:
                self.logger.error(f"Error disconnecting MQTT client: {e}")

    @abstractmethod
    def _register_resource_listeners(self) -> None:
        """Register listeners for resource data changes."""
        pass

    def _get_listener(
        self,
        data_type: Any,
        message_type: GenericMessage,
        topic: str,
        qos: int = 0,
        retain: bool = False,
    ):
        """Create a listener for resource data changes and publish to MQTT topic."""
        publish_data = self._publish_data
        logger = self.logger

        class Listener(ResourceDataListener[data_type]):
            def on_data_changed(self, resource, updated_value):
                try:
                    payload = message_type(resource.type, updated_value)

                    publish_data(topic, payload, qos, retain)
                except Exception as e:
                    logger.error(f"Error publishing data: {e}")

        return Listener()

    def _publish_data(
        self, topic: str, payload: GenericMessage, qos: int = 0, retain: bool = False
    ) -> None:
        """Publish data to the specified MQTT topic."""
        try:
            if topic is None or payload is None:
                self.logger.error("❌ Topic or payload is None!")
                return

            self.logger.info(f"📤 Sending to topic: {topic} -> Data: {payload}")

            if self.mqtt_client is not None and self.mqtt_client.is_connected():
                message_payload = payload.to_json()
                self.mqtt_client.publish(topic, message_payload, qos, retain)
                self.logger.info(f"✅ Data published to topic: {topic}")
            else:
                self.logger.error("⚠️ MQTT Client is not connected!")
        except Exception as e:
            self.logger.error(f"🔥 Exception in _publish_data: {e}")
            raise

    def to_dict(self) -> dict:
        return {
            "id": self.object_id,
            "room_id": self.room_id,
            "resources": {k: r.to_dict() for k, r in self.resource_map.items()},
        }

    def to_json(self) -> str:
        return json.dumps(self.to_dict(), indent=4)

    def __str__(self):
        return f"SmartObject(id={self.object_id}, room_id={self.room_id}, resources={list(self.resource_map.keys())})"

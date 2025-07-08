import json
import logging
import paho.mqtt.client as mqtt
from abc import ABC, abstractmethod
from typing import Generic, TypeVar, Any, Dict
from smart_objects.models.Actuator import Actuator
from smart_objects.messages.GenericMessage import GenericMessage
from smart_objects.messages.control_message import ControlMessage
from smart_objects.messages.telemetry_message import TelemetryMessage
from smart_objects.resources.SmartObjectResource import SmartObjectResource
from smart_objects.resources.ResourceDataListener import ResourceDataListener

T = TypeVar("T")


class SmartObject(ABC, Generic[T]):
    def __init__(
        self,
        object_id: str,
        room_id: str,
        rack_id: str | None,
        mqtt_client: mqtt.Client = None,
    ):
        self.object_id = object_id
        self.room_id = room_id
        self.rack_id = rack_id
        self.mqtt_client = mqtt_client
        self.resource_map: Dict[str, SmartObjectResource] = {}

        self.logger = logging.getLogger(f"{object_id}")

    def get_resource(self, name: str) -> SmartObjectResource:
        return self.resource_map[name]

    def start(self) -> None:
        """Start the SmartObject behavior"""
        try:
            if self.mqtt_client is not None and self.resource_map is not None:
                self.logger.info(
                    f"🏁 Starting SmartObject {self.object_id} at {self.room_id}"
                )

                for resource in self.resource_map.values():
                    if isinstance(resource, Actuator):
                        resource.set_operational_status(True)
                        continue
                    for attr_name in dir(resource):
                        if attr_name.startswith("start_periodic_"):
                            start_method = getattr(resource, attr_name)
                            if callable(start_method):
                                try:
                                    start_method()
                                    self.logger.info(
                                        f"Called {attr_name} on resource {resource}"
                                    )
                                except Exception as e:
                                    raise RuntimeError(
                                        f"Error calling {attr_name} on resource {resource}: {e}"
                                    )

                self._register_resource_listeners()

        except Exception as e:
            raise RuntimeError(f"Failed to start SmartObject {self.object_id}: {e}")

    def stop(self) -> None:
        """Stop the SmartObject behavior"""
        self.logger.info(f"Stopping SmartObject {self.object_id} at {self.room_id}")
        if self.resource_map:
            for resource in self.resource_map.values():
                if isinstance(resource, Actuator):
                    resource.set_operational_status(False)
                    resource.reset()
                    continue
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
                                raise RuntimeError(
                                    f"Error calling {attr_name} on resource {resource}: {e}"
                                )

    @abstractmethod
    def _register_resource_listeners(self) -> None:
        """Register listeners for resource data changes."""
        pass

    def _get_listener(
        self,
        data_type: Any,
        message_type: GenericMessage,
        topic: str,
        metadata: Dict[str, Any] = {},
        qos: int = 0,
        retain: bool = False,
    ):
        """Create a listener for resource data changes and publish to MQTT topic."""
        publish_data = self._publish_data

        resource_id = topic.split("/")[-1]
        if not metadata:
            metadata = {}

        metadata.update(
            {
                "object_id": self.object_id,
                "resource_id": resource_id,
                "room_id": self.room_id,
                "rack_id": self.rack_id,
            }
        )

        class Listener(ResourceDataListener[data_type]):
            def on_data_changed(self, resource, updated_value, **kwargs):
                try:
                    payload = None
                    if message_type == ControlMessage:
                        payload = message_type(
                            type_=resource.type,
                            metadata=metadata,
                            timestamp=None,
                            **kwargs,
                        )
                    elif message_type == TelemetryMessage:
                        payload = message_type(
                            type_=resource.type,
                            data_value=updated_value,
                            metadata=metadata,
                        )

                    publish_data(topic, payload, qos, retain)
                except Exception as e:
                    raise RuntimeError(
                        f"Failed to publish data for resource {resource}: {e}"
                    )

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
            raise RuntimeError(f"Failed to publish data to topic {topic}: {e}")

    def to_dict(self) -> dict:
        return {
            "id": self.object_id,
            "room_id": self.room_id,
            "rack_id": self.rack_id,
            "resources": {k: r.to_dict() for k, r in self.resource_map.items()},
        }

    def to_json(self) -> str:
        return json.dumps(self.to_dict(), indent=4)

    def __str__(self):
        return f"SmartObject(id={self.object_id}, room_id={self.room_id}, resources={list(self.resource_map.keys())})"

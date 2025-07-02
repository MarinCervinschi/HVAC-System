from typing import Dict
from abc import ABC, abstractmethod
from typing import Generic, TypeVar, List, Any
import json
import paho.mqtt.client as mqtt
import logging
from smart_objects.resources.SmartObjectResource import SmartObjectResource
from ..messages.telemetry_message import TelemetryMessage
from smart_objects.resources.ResourceDataListener import ResourceDataListener
from config.mqtt_conf_params import MqttConfigurationParameters

T = TypeVar("T")


class SmartObject(ABC, Generic[T]):
    def __init__(self, object_id: str, location: str, mqtt_client: mqtt.Client = None):
        self.object_id = object_id
        self.location = location
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
                    f"Starting SmartObject {self.object_id} at {self.location}"
                )

                self.register_to_available_resources()
        except Exception as e:
            self.logger.error(f"Error starting SmartObject {self.object_id}: {e}")

    def stop(self) -> None:
        """Stop the SmartObject behavior"""
        self.logger.info(f"Stopping SmartObject {self.object_id} at {self.location}")
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

    def register_to_available_resources(self) -> None:
        try:
            for name, resource in self.resource_map.items():
                if not name or not resource:
                    continue

                self.logger.info(
                    f"Registering resource {resource.type} with ID {resource.resource_id}"
                )

                listener = self._get_listener(
                    type=resource.data_type,
                    resource_name=name,
                    smart_object_resource=resource,
                )
                resource.add_data_listener(listener)

        except Exception as e:
            self.logger.error(f"Error registering resources: {e}")
            raise e

    def _get_listener(
        self, type: Any, resource_name: str, smart_object_resource: SmartObjectResource
    ):
        object_id = self.object_id
        publish_telemetry_data = self._publish_telemetry_data

        class Listener(ResourceDataListener[type]):
            def on_data_changed(self, resource, updated_value):
                try:
                    topic = "{0}/{1}/{2}/{3}".format(
                        MqttConfigurationParameters.BASIC_TOPIC,
                        object_id,
                        MqttConfigurationParameters.TELEMETRY_TOPIC,
                        resource_name,
                    )
                    telemetry_message = TelemetryMessage(
                        smart_object_resource.type, updated_value
                    )

                    publish_telemetry_data(topic, telemetry_message)
                except Exception as e:
                    print(f"Error publishing telemetry data: {e}")

        return Listener()

    def _publish_telemetry_data(self, topic: str, telemetry_message: TelemetryMessage):
        try:
            if topic is None or telemetry_message is None:
                self.logger.error("Topic or telemetry_message is None!")
                return

            self.logger.info(f"Sending to topic: {topic} -> Data: {telemetry_message}")

            if self.mqtt_client is not None and self.mqtt_client.is_connected():
                message_payload = telemetry_message.to_json()
                self.mqtt_client.publish(
                    topic=topic, payload=message_payload, qos=0, retain=False
                )
                self.logger.info(f"Data published to topic: {topic}")
            else:
                self.logger.error("MQTT Client is not connected!")
        except Exception as e:
            self.logger.error(f"Exception in _publish_telemetry_data: {e}")
            raise

    def to_dict(self) -> dict:
        return {
            "id": self.object_id,
            "location": self.location,
            "resources": {k: r.to_dict() for k, r in self.resource_map.items()},
        }

    def to_json(self) -> str:
        return json.dumps(self.to_dict(), indent=4)

    def __str__(self):
        return f"SmartObject(id={self.object_id}, location={self.location}, resources={list(self.resource_map.keys())})"

import paho.mqtt.client as mqtt
import json
import logging
from typing import List, Dict, Any
from data_collector.models.Room import Room
from smart_objects.resources.CoapServer import CoapServer
from data_collector.core.data_collector import DataCollector
from data_collector.factories.room_factory import RoomFactory
from smart_objects.resources.CoapControllable import CoapControllable
from config.mqtt_conf_params import MqttConfigurationParameters


class HVACSystemManager:
    def __init__(
        self, room_configs: List[Dict[str, Any]], policy_file: str, cloud_url: str
    ) -> None:
        self.rooms: Dict[str, Room] = {}
        self.data_collectors: Dict[str, DataCollector] = {}
        self.policy_file: str = policy_file
        self.cloud_url = cloud_url
        self.logger = logging.getLogger("HVACSystemManager")

        self.mqtt_client: mqtt.Client = mqtt.Client("hvac_system_manager")
        self.mqtt_client.on_message = self.on_message
        self.mqtt_client.connect(
            MqttConfigurationParameters.BROKER_ADDRESS,
            MqttConfigurationParameters.BROKER_PORT,
        )
        self.coap_server = CoapServer()

        self.initialize_rooms(room_configs)
        self.mqtt_client.loop_start()
        self.coap_server.start_coap_server()

    def on_message(self, client, userdata, msg):
        """Central message router that dispatches to appropriate DataCollector"""
        try:
            telemetry = json.loads(msg.payload.decode())
            room_id = telemetry.get("metadata", {}).get("room_id")

            if room_id and room_id in self.data_collectors:
                self.data_collectors[room_id].handle_message(msg)
            else:
                self.logger.warning(
                    f"No DataCollector found for room_id: {room_id}, topic: {msg.topic}"
                )

        except Exception as e:
            self.logger.error(f"Error routing message: {e}")

    def initialize_rooms(self, room_configs: List[Dict[str, Any]]) -> None:
        for room_conf in room_configs:
            room = RoomFactory.create_room(room_conf, self.mqtt_client)
            self.rooms[room.room_id] = room

            collector = DataCollector(
                room.room_id,
                self.policy_file,
                cloud_url=self.cloud_url,
                sync_interval=30,
            )
            collector.connect(self.mqtt_client)
            self.data_collectors[room.room_id] = collector

            for smart_object in room.smart_objects.values():
                smart_object.start()
                if isinstance(smart_object, CoapControllable):
                    self.coap_server.add_smart_object(smart_object)

            for rack in room.racks.values():
                for smart_object in rack.smart_objects.values():
                    if isinstance(smart_object, CoapControllable):
                        self.coap_server.add_smart_object(smart_object)

    def get_room_by_id(self, room_id: str) -> Room:
        """Retrieve a room by its ID"""
        return self.rooms.get(room_id)

    def disconnect(self) -> None:
        """Disconnect MQTT client and CoAP server gracefully"""
        if self.mqtt_client:
            self.mqtt_client.loop_stop()
            self.mqtt_client.disconnect()

        if hasattr(self, "coap_server"):
            self.coap_server.stop_coap_server()

    def __del__(self) -> None:
        """Ensure MQTT client is disconnected when the manager is deleted"""
        print("HVACSystemManager is being deleted, disconnecting MQTT client...")
        self.disconnect()
        self.data_collectors.clear()
        self.rooms.clear()

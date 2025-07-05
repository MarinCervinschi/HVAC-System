from data_collector.factories.room_factory import RoomFactory
from data_collector.core.data_collector import DataCollector
from data_collector.core.policy_manager import PolicyManager
from data_collector.models.Room import Room
import paho.mqtt.client as mqtt
from typing import List, Dict, Any
from data_collector.models.Room import Room
from config.mqtt_conf_params import MqttConfigurationParameters


class HVACSystemManager:
    def __init__(self, room_configs: List[Dict[str, Any]], policy_file: str) -> None:
        self.rooms: Dict[str, Room] = {}
        self.data_collectors: List[DataCollector] = []
        self.policy_file: str = policy_file

        self.mqtt_client: mqtt.Client = mqtt.Client("hvac_system_manager")
        self.mqtt_client.connect(
            MqttConfigurationParameters.BROKER_ADDRESS,
            MqttConfigurationParameters.BROKER_PORT,
        )

        self.initialize_rooms(room_configs)

        self.mqtt_client.loop_start()

    def initialize_rooms(self, room_configs: List[Dict[str, Any]]) -> None:
        for room_conf in room_configs:
            room = RoomFactory.create_room(room_conf, self.mqtt_client)
            self.rooms[room.room_id] = room

            policy_manager = PolicyManager(room, self.policy_file)
            collector = DataCollector(room, policy_manager)
            collector.connect(self.mqtt_client)
            self.data_collectors.append(collector)

    def get_room_by_id(self, room_id: str) -> Room:
        """Retrieve a room by its ID"""
        return self.rooms.get(room_id)

    def disconnect(self) -> None:
        """Disconnect MQTT client gracefully"""
        if self.mqtt_client:
            self.mqtt_client.loop_stop()
            self.mqtt_client.disconnect()

    def __del__(self) -> None:
        """Ensure MQTT client is disconnected when the manager is deleted"""
        print("HVACSystemManager is being deleted, disconnecting MQTT client...")
        self.disconnect()
        self.data_collectors.clear()
        self.rooms.clear()
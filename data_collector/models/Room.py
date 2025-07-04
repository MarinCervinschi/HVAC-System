from abc import ABC, abstractmethod
from typing import Dict
from data_collector.models.Rack import Rack
from smart_objects.devices.SmartObject import SmartObject


class Room(ABC):
    def __init__(self, room_id: str):
        self.room_id = room_id
        self.racks: Dict[str, Rack] = {}
        self.smart_objects: Dict[str, SmartObject] = (
            {}
        )  # Environment Monitor , Cooling System Hub

    def add_smart_object(self, smart_object: SmartObject):
        self.smart_objects[smart_object.object_id] = smart_object

    def get_smart_object(self, object_id: str) -> SmartObject:
        return self.smart_objects[object_id]

    def add_rack(self, rack: Rack):
        self.racks[rack.rack_id] = rack

    def get_rack(self, rack_id: str) -> Rack:
        return self.racks[rack_id]

from abc import ABC
from typing import Dict
from data_collector.models.Rack import Rack
from data_collector.models.AbstractSmartEntity import (
    AbstractSmartEntity,
)


class Room(AbstractSmartEntity, ABC):

    def __init__(self, room_id: str):
        super().__init__()
        self.room_id = room_id
        self.racks: Dict[str, Rack] = {}

    def add_rack(self, rack: Rack):
        self.racks[rack.rack_id] = rack

    def get_rack(self, rack_id: str) -> Rack:
        return self.racks[rack_id]

    def to_dict(self) -> Dict:
        """Return a dictionary representation of the room."""
        return {
            "room_id": self.room_id,
            "racks": {k: v.to_dict() for k, v in self.racks.items()},
            "smart_objects": {k: v.to_dict() for k, v in self.smart_objects.items()},
        }

    def __str__(self):
        return f"Room ID: {self.room_id}, Racks: {list(self.racks.keys())}, Smart Objects: {list(self.smart_objects.keys())}"

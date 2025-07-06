from abc import ABC
from typing import Dict
from data_collector.models.Rack import Rack
from data_collector.models.AbstractSmartEntity import (
    AbstractSmartEntity,
)


class Room(AbstractSmartEntity, ABC):

    def __init__(self, room_id: str, location: str):
        super().__init__()
        self.room_id = room_id
        self.location = location
        self.racks: Dict[str, Rack] = {}

    def add_rack(self, rack: Rack):
        self.racks[rack.rack_id] = rack

    def get_rack(self, rack_id: str) -> Rack:
        return self.racks[rack_id]

    def to_full_dict(self) -> Dict:
        """Return a dictionary representation of the room."""
        return {
            "room_id": self.room_id,
            "racks": {k: v.to_dict() for k, v in self.racks.items()},
            "smart_objects": {k: v.to_dict() for k, v in self.smart_objects.items()},
        }

    def to_dict(self, title_format: bool = False) -> Dict:
        """Return a dictionary representation of the room."""
        if title_format:
            room_id = self.title_format(self.room_id)
            location = self.title_format(self.location)
            racks = [self.title_format(rack_id) for rack_id in self.racks.keys()]
            smart_objects = [
                self.title_format(obj_id) for obj_id in self.smart_objects.keys()
            ]
        else:
            room_id = self.room_id
            location = self.location
            racks = list(self.racks.keys())
            smart_objects = list(self.smart_objects.keys())

        return {
            "room_id": room_id,
            "location": location,
            "total_smart_objects": self._num_smart_objects(),
            "racks": racks,
            "smart_objects": smart_objects,
        }

    def _num_smart_objects(self) -> int:
        """Return the number of smart objects in the room, including those in racks."""
        return len(self.smart_objects) + sum(
            len(rack.smart_objects) for rack in self.racks.values()
        )

    def __str__(self):
        return f"Room ID: {self.room_id}, Racks: {list(self.racks.keys())}, Smart Objects: {list(self.smart_objects.keys())}"

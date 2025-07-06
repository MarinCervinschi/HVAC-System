from abc import ABC
from typing import Dict
from data_collector.models.AbstractSmartEntity import (
    AbstractSmartEntity,
)


class Rack(AbstractSmartEntity, ABC):
    def __init__(self, rack_id: str, rack_type: str):
        super().__init__()
        self.rack_id = rack_id
        self.rack_type = rack_type

    def to_full_dict(self) -> Dict:
        """Return a full dictionary representation of the rack."""
        return {
            "rack_id": self.rack_id,
            "rack_type": self.rack_type,
            "smart_objects": {k: v.to_dict() for k, v in self.smart_objects.items()},
        }

    def to_dict(self, title_format: bool = False) -> Dict:
        """Return a dictionary representation of the rack."""
        if title_format and hasattr(self, "title_format"):
            rack_id = self.title_format(self.rack_id)
            rack_type = self.title_format(self.rack_type)
            smart_objects = [
                self.title_format(obj_id) for obj_id in self.smart_objects.keys()
            ]
        else:
            rack_id = self.rack_id
            rack_type = self.rack_type
            smart_objects = list(self.smart_objects.keys())

        return {
            "rack_id": rack_id,
            "rack_type": rack_type,
            "smart_objects": smart_objects,
        }

    def __str__(self):
        return f"Rack ID: {self.rack_id}, Type: {self.rack_type}, Smart Objects: {list(self.smart_objects.keys())}"

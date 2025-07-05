import json
from typing import Dict
from abc import ABC, abstractmethod
from smart_objects.devices.SmartObject import SmartObject


class AbstractSmartEntity(ABC):
    def __init__(self):
        self.smart_objects: Dict[str, SmartObject] = {}

    def add_smart_object(self, smart_object: SmartObject):
        self.smart_objects[smart_object.object_id] = smart_object

    def get_smart_object(self, object_id: str) -> SmartObject:
        return self.smart_objects[object_id]

    @abstractmethod
    def to_full_dict(self) -> Dict:
        """Return a full dictionary representation of the entity."""
        pass

    @abstractmethod
    def to_dict(self) -> Dict:
        """Return a dictionary representation of the entity."""
        pass

    def to_json(self) -> str:
        """Return a JSON string representation of the entity."""
        return json.dumps(self.to_dict(), indent=4)

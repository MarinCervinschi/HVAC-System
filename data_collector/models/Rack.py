from abc import ABC, abstractmethod
from typing import Dict
from smart_objects.devices.SmartObject import SmartObject


class Rack(ABC):
    def __init__(self, rack_id: str, rack_type: str):
        self.rack_id = rack_id
        self.rack_type = rack_type
        self.smart_objects: Dict[str, SmartObject] = {}

    def add_smart_object(self, smart_object: SmartObject):
        self.smart_objects[smart_object.object_id] = smart_object

    def get_smart_object(self, object_id: str) -> SmartObject:
        return self.smart_objects[object_id]

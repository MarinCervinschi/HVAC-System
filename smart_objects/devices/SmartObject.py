from typing import Dict
from abc import ABC
from typing import Generic, TypeVar, List
import json
from smart_objects.resources.SmartObjectResource import SmartObjectResource

T = TypeVar("T")


class SmartObject(ABC, Generic[T]):
    def __init__(self, object_id: str, location: str):
        self.object_id = object_id
        self.location = location
        self.resource_map: Dict[str, SmartObjectResource] = {}

    def get_resource(self, name: str) -> SmartObjectResource:
        return self.resource_map[name]

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

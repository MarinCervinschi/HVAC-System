from abc import ABC, abstractmethod
from typing import Generic, TypeVar, List
import json

T = TypeVar("T")


class SmartObjectResource(ABC, Generic[T]):
    def __init__(self, resource_id: str):
        self.resource_id = resource_id

    @abstractmethod
    def load_updated_value(self) -> T:
        pass

    def to_json(self):
        return json.dumps(self, default=lambda o: o.__dict__)

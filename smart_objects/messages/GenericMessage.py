from abc import ABC, abstractmethod
from typing import Dict, Any
import time
import json


class GenericMessage(ABC):

    def __init__(self, type_: str, metadata: Dict[str, Any] = None):
        self.type = type_
        self.metadata = metadata if metadata is not None else {}
        self.timestamp = int(time.time() * 1000)

    @abstractmethod
    def to_dict(self) -> dict:
        pass

    def to_json(self) -> str:
        return json.dumps(self, default=lambda o: o.__dict__)
    
    @abstractmethod
    def __str__(self) -> str:
        pass

from dataclasses import asdict
import time
import json
from typing import Any, Dict
from .GenericMessage import GenericMessage


class TelemetryMessage(GenericMessage):

    def __init__(
        self,
        type_: str,
        data_value: Any,
        timestamp: int = None,
        metadata: Dict[str, Any] = None,
    ):
        if not type_:
            raise ValueError("Type must be a non-empty string.")

        super().__init__(type_, metadata)
        self.data_value = data_value
        self.timestamp = timestamp if timestamp is not None else int(time.time() * 1000)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

    def to_json(self):
        return json.dumps(self, default=lambda o: o.__dict__)

    def __str__(self) -> str:
        return f"TelemetryMessage(type='{self.type}', data_value={self.data_value}, timestamp={self.timestamp})"

    def __repr__(self) -> str:
        return self.__str__()

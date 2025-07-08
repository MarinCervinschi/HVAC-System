from dataclasses import asdict
import time
import json
from typing import Any, Dict
from .GenericMessage import GenericMessage


class ControlMessage(GenericMessage):
    """
    Messaggio per comunicare eventi di controllo e cambiamenti di stato.
    Non per modificare lo stato (quello è gestito da CoAP), ma per notificare:
    - Cambiamenti di stato degli attuatori
    - Allarmi attivati/disattivati
    - Policy applicate
    - Eventi di sistema
    """

    def __init__(
        self,
        type_: str,
        timestamp: int = None,
        metadata: Dict[str, Any] = None,
        **kwargs: Any,
    ):
        event_type = kwargs.get("event_type")
        event_data = kwargs.get("event_data")

        super().__init__(type_, metadata)
        self.event_type = event_type
        self.event_data = event_data
        self.timestamp = timestamp if timestamp is not None else int(time.time() * 1000)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "type": self.type,
            "event_type": self.event_type,
            "event_data": self.event_data,
            "timestamp": self.timestamp,
            "metadata": self.metadata,
        }

    def to_json(self):
        return json.dumps(self, default=lambda o: o.__dict__)

    def __str__(self) -> str:
        return f"ControlMessage(type='{self.type}', event_type='{self.event_type}', event_data={self.event_data}, timestamp={self.timestamp})"

    def __repr__(self) -> str:
        return self.__str__()

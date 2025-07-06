from ..resources.SmartObjectResource import SmartObjectResource
from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
import logging
from typing import Generic, TypeVar, List
import json

T = TypeVar("T")


class Actuator(SmartObjectResource[Dict[str, Any]], ABC):

    DATA_TYPE: T = Dict[str, Any]

    def __init__(
        self,
        resource_id: str,
        type: str,
        is_operational: bool = True,
    ):

        super().__init__(resource_id)
        self.type = type
        self.data_type = self.DATA_TYPE
        self.is_operational = is_operational

        self.logger = logging.getLogger(f"{resource_id}")

    @abstractmethod
    def apply_command(self, command: Dict[str, Any]) -> bool:
        pass

    @abstractmethod
    def get_current_state(self) -> Dict[str, Any]:
        pass

    @abstractmethod
    def reset(self) -> bool:
        pass

    def load_updated_value(self) -> Dict[str, Any]:
        return self.get_current_state()

    def set_operational_status(self, status: bool) -> None:
        self.is_operational = status
        self.logger.info(
            f"Actuator {self.resource_id} operational status set to: {status}"
        )

    def __str__(self):
        return f"Actuator(resource_id={self.resource_id}, type={self.type}, is_operational={self.is_operational})"

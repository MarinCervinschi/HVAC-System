import time
import logging
from abc import ABC, abstractmethod
from typing import Any, Dict, TypeVar
from ..resources.SmartObjectResource import SmartObjectResource

T = TypeVar("T")


class Actuator(SmartObjectResource[Dict[str, Any]], ABC):

    DATA_TYPE: T = Dict[str, Any]

    def __init__(
        self,
        resource_id: str,
        type: str,
        is_operational: bool = False,
    ):

        super().__init__(resource_id)
        self.type = type
        self.data_type = self.DATA_TYPE
        self.is_operational = is_operational
        self.state: Dict[str, Any] = {}

        self.logger = logging.getLogger(f"{resource_id}")

    def apply_command(self, command: Dict[str, Any]) -> bool:
        try:
            self._validate_command(command)
            if not self._is_ready_for_commands():
                raise ValueError(
                    f"Actuator {self.resource_id} is not operational. Cannot apply command."
                )

            self._apply_command(command)
            return True
        except (ValueError, TypeError) as e:
            raise e

    @abstractmethod
    def _apply_command(self, command: Dict[str, Any]) -> None:
        """
        Apply the command to the actuator.
        This method should be implemented by subclasses to handle specific command logic.

        Args:
            command: Dictionary containing the command parameters

        Returns:
            None
        Raises:
            ValueError: If the command is invalid or contains unsupported keys
        """
        pass

    @abstractmethod
    def get_current_state(self) -> Dict[str, Any]:
        pass

    @abstractmethod
    def reset(self) -> None:
        pass

    def _validate_command(self, command: Dict[str, Any]) -> bool:
        """
        Validate the command keys against the actuator's state.
        Raises ValueError if any key is invalid.
        Args:
            command: Dictionary containing the command parameters
        Returns:
            bool: True if the command is valid, False otherwise
        Raises:
            ValueError: If any key in the command is not part of the actuator's state
        """

        for key in command:
            if key not in self.state:
                raise ValueError(
                    f"Invalid command key '{key}'. Must be one of {list(self.state.keys())}"
                )
        return True

    def _is_ready_for_commands(self) -> bool:
        """Check if the switch actuator is ready to accept commands."""
        return self.is_operational

    def load_updated_value(self) -> Dict[str, Any]:
        return self.get_current_state()

    def set_operational_status(self, status: bool) -> None:
        self.is_operational = status
        self.logger.info(
            f"Actuator {self.resource_id} operational status set to: {status}"
        )

    def __str__(self):
        return f"Actuator(resource_id={self.resource_id}, type={self.type}, is_operational={self.is_operational})"

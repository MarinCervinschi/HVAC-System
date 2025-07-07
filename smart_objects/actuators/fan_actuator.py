import time
import logging
from typing import Dict, Any, ClassVar
from smart_objects.resources.SwitchActuator import SwitchActuator


class FanActuator(SwitchActuator):
    RESOURCE_TYPE: ClassVar[str] = "iot:actuator:fan"
    MIN_SPEED: ClassVar[int] = 0
    MAX_SPEED: ClassVar[int] = 100

    def __init__(self, resource_id: str, is_operational: bool = False):
        super().__init__(
            resource_id=resource_id,
            type=self.RESOURCE_TYPE,
            is_operational=is_operational,
        )

        self.state.update(
            {
                "speed": 0,
                "target_speed": 0,
            }
        )

        self.logger = logging.getLogger(f"{resource_id}")

    def _on_status_change(self, new_status: str) -> None:
        """Handle fan-specific behavior when status changes."""
        if new_status == "OFF":
            self.state["speed"] = 0
            self.state["target_speed"] = 0
            self.logger.info(f"Fan {self.resource_id} turned off, speed reset to 0")
        else:
            self.logger.info(f"Fan {self.resource_id} turned on")

    def _apply_command(self, command: Dict[str, Any]) -> None:
        try:
            old_status = self.state["status"]

            self.apply_switch(command)

            if self.state["status"] != old_status:
                self._on_status_change(self.state["status"])

            if "speed" in command:
                speed = int(command["speed"])
                if not (self.MIN_SPEED <= speed <= self.MAX_SPEED):
                    raise ValueError(
                        f"Speed must be between {self.MIN_SPEED} and {self.MAX_SPEED}, got: {speed}"
                    )

                if self.state["status"] == "OFF":
                    if "status" not in command:
                        raise ValueError("Cannot set speed while fan is OFF.")
                else:
                    self.state["target_speed"] = speed
                    self.state["speed"] = speed

            self.state["last_updated"] = int(time.time())
            self.logger.info(f"Fan {self.resource_id} updated state: {self.state}")

        except (ValueError, TypeError) as e:
            raise e

    def get_current_state(self) -> Dict[str, Any]:
        return {
            "resource_id": self.resource_id,
            "type": self.type,
            "is_operational": self.is_operational,
            "max_speed": self.MAX_SPEED,
            **self.state,
        }

    def reset(self) -> None:
        try:
            old_status = self.state["status"]
            self.state.update(
                {
                    "status": "OFF",
                    "speed": 0,
                    "target_speed": 0,
                    "last_updated": int(time.time()),
                }
            )

            if old_status != "OFF":
                self._on_status_change("OFF")

        except Exception as e:
            raise RuntimeError(f"Failed to reset fan {self.resource_id}: {e}")

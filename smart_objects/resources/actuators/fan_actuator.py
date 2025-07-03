import time
import logging
from typing import Dict, Any, Optional, ClassVar
from ...models.Actuator import Actuator


class FanActuator(Actuator):
    RESOURCE_TYPE: ClassVar[str] = "iot:actuator:fan🪭"
    MIN_SPEED: ClassVar[int] = 0
    MAX_SPEED: ClassVar[int] = 100
    VALID_STATUSES: ClassVar[list[str]] = ["ON", "OFF"]

    def __init__(self, resource_id: str):
        super().__init__(
            resource_id=resource_id,
            type=self.RESOURCE_TYPE,
            is_operational=True
        )

        self.max_speed = self.MAX_SPEED
        self.state = {
            "status": "OFF",
            "speed": 0,
            "target_speed": 0,
            "last_updated": int(time.time())
        }

        self.logger = logging.getLogger(f"{__name__}.{resource_id}")
        self.logger.info(
            f"Fan actuator {resource_id} initialized with max speed: {self.max_speed}%"
        )

    def apply_command(self, command: Dict[str, Any]) -> bool:
        if not self.is_ready_for_commands():
            self.logger.warning(
                f"Fan {self.resource_id} not ready for commands. Operational: {self.is_operational}"
            )
            return False

        updated = False

        try:
            if "status" in command:
                status = command["status"].upper()
                if status not in self.VALID_STATUSES:
                    raise ValueError(f"Invalid status '{status}'. Must be one of {self.VALID_STATUSES}")
                self.state["status"] = status
                updated = True

                if status == "OFF":
                    self.state["speed"] = 0
                    self.state["target_speed"] = 0

            if "speed" in command:
                speed = int(command["speed"])
                if not (self.MIN_SPEED <= speed <= self.max_speed):
                    raise ValueError(f"Speed must be between {self.MIN_SPEED} and {self.max_speed}, got: {speed}")

                # Se status è OFF, ignora il comando speed
                if self.state["status"] == "OFF":
                    self.logger.warning(f"Cannot set speed while fan is OFF.")
                else:
                    self.state["target_speed"] = speed
                    self.state["speed"] = speed
                    if speed > 0:
                        self.state["status"] = "ON"
                    updated = True

            if updated:
                self.state["last_updated"] = int(time.time())
                self.logger.info(
                    f"Fan {self.resource_id} updated state: {self.state}"
                )
                return True
            else:
                self.logger.warning(
                    f"No changes applied to fan {self.resource_id}. Command: {command}"
                )
                return False

        except (ValueError, TypeError) as e:
            self.logger.error(
                f"Failed to apply command {command} to fan {self.resource_id}: {e}"
            )
            return False

    def get_current_state(self) -> Dict[str, Any]:
        return {
            "resource_id": self.resource_id,
            "type": self.type,
            "is_operational": self.is_operational,
            "max_speed": self.max_speed,
            **self.state
        }

    def reset(self) -> bool:
        try:
            self.state.update({
                "status": "OFF",
                "speed": 0,
                "target_speed": 0,
                "last_updated": int(time.time())
            })
            self.logger.info(f"Fan {self.resource_id} reset to default state.")
            return True
        except Exception as e:
            self.logger.error(f"Failed to reset fan {self.resource_id}: {e}")
            return False

    def is_ready_for_commands(self) -> bool:
        return self.is_operational

    def to_dict(self) -> Dict[str, Any]:
        return self.get_current_state()

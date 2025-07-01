import time
import logging
from typing import Dict, Any, Optional
from ...models.Actuator import Actuator


class FanActuator(Actuator):

    MIN_SPEED = 0
    MAX_SPEED = 100
    VALID_STATUSES = ["ON", "OFF"]

    def __init__(self, resource_id: str):

        super().__init__(
            resource_id=resource_id, type="FanActuator", is_operational=True
        )

        self.max_speed = self.MAX_SPEED
        self.state = {
            "status": "ON" if self.is_operational else "OFF",
            "speed": 0,
            "target_speed": 0,
            "last_updated": int(time.time()),
        }

        self.logger = logging.getLogger(f"{__name__}.{resource_id}")
        self.logger.info(
            f"Fan actuator {resource_id} initialized with max speed: {self.max_speed}%"
        )

    def apply_command(self, command: Dict[str, Any]) -> bool:
        if not self.is_ready_for_commands():
            self.logger.warning(
                f"Fan {self.resource_id} is not ready for commands. Operational: {self.is_operational}"
            )
            return False

        try:
            if "status" in command:
                status = command["status"].upper()
                if status not in self.VALID_STATUSES:
                    raise ValueError(
                        f"Invalid status '{status}'. Valid values: {self.VALID_STATUSES}"
                    )
                self.state["status"] = status

                if status == "OFF":
                    self.state["speed"] = 0
                    self.state["target_speed"] = 0

            if "speed" in command:
                speed = int(command["speed"])
                if not (self.MIN_SPEED <= speed <= self.max_speed):
                    raise ValueError(
                        f"Speed must be between {self.MIN_SPEED} and {self.max_speed}, got: {speed}"
                    )

                self.state["target_speed"] = speed

                if speed > 0:
                    self.state["status"] = "ON"
                    self.state["speed"] = speed
                elif speed == 0:
                    self.state["status"] = "OFF"
                    self.state["speed"] = 0

            self.state["last_updated"] = int(time.time())

            self.logger.info(
                f"Command applied to fan {self.resource_id}: {command}. New state: {self.state}"
            )
            return True

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
            **self.state,
        }

    def reset(self) -> bool:
        try:
            self.state = {
                "status": "OFF",
                "speed": 0,
                "target_speed": 0,
                "last_updated": int(time.time()),
            }
            self.logger.info(f"Fan {self.resource_id} reset to default state")
            return True
        except Exception as e:
            self.logger.error(f"Failed to reset fan {self.resource_id}: {e}")
            return False

    def is_running(self) -> bool:
        return self.state["status"] == "ON" and self.state["speed"] > 0

    def is_ready_for_commands(self) -> bool:
        return self.state["status"] != "OFF"

    def to_dict(self) -> Dict[str, Any]:
        return self.get_current_state()

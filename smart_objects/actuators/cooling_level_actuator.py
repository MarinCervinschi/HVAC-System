import time
import logging
from typing import Dict, Any, ClassVar
from smart_objects.resources.SwitchActuator import SwitchActuator


class CoolingLevelsActuator(SwitchActuator):
    RESOURCE_TYPE: ClassVar[str] = "iot:actuator:cooling_levels"
    MIN_LEV: ClassVar[int] = 0
    MAX_LEV: ClassVar[int] = 5

    def __init__(self, resource_id: str, is_operational: bool = True):
        super().__init__(
            resource_id=resource_id,
            type=self.RESOURCE_TYPE,
            is_operational=is_operational,
        )

        self.state.update(
            {
                "level": 0,
            }
        )

        self.logger = logging.getLogger(f"{resource_id}")

    def _on_status_change(self, new_status: str) -> None:
        """Handle cooling-specific behavior when status changes."""
        if new_status == "OFF":
            self.state["level"] = 0
            self.logger.info(f"Cooling {self.resource_id} turned off, level reset to 0")
        else:
            self.logger.info(f"Cooling {self.resource_id} turned on")

    def _apply_command(self, command: Dict[str, Any]) -> None:
        try:
            old_status = self.state["status"]

            self.apply_switch(command)

            if self.state["status"] != old_status:
                self._on_status_change(self.state["status"])

            if "level" in command:
                level = int(command["level"])
                if not (self.MIN_LEV <= level <= self.MAX_LEV):
                    raise ValueError(
                        f"Level must be between {self.MIN_LEV} and {self.MAX_LEV}, got: {level}"
                    )

                if self.state["status"] == "OFF":
                    if "status" not in command:
                        raise ValueError("Cannot set level while cooling is OFF.")
                else:
                    self.state["level"] = level

            self.state["last_updated"] = int(time.time())
            self.logger.info(f"Cooling {self.resource_id} updated state: {self.state}")

        except (ValueError, TypeError) as e:
            raise e

    def get_current_state(self) -> Dict[str, Any]:
        return {
            "resource_id": self.resource_id,
            "type": self.type,
            "is_operational": self.is_operational,
            "max_level": self.MAX_LEV,
            "min_level": self.MIN_LEV,
            **self.state,
        }

    def reset(self) -> bool:
        try:
            old_status = self.state["status"]
            self.state.update(
                {
                    "status": "OFF",
                    "level": 0,
                    "last_updated": int(time.time()),
                }
            )
            self.logger.info(f"Cooling {self.resource_id} reset to default state.")

            if old_status != "OFF":
                self._on_status_change("OFF")

            return True
        except Exception as e:
            self.logger.error(f"Failed to reset cooling {self.resource_id}: {e}")
            return False

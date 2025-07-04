import time
import logging
from typing import Dict, Any, ClassVar
from smart_objects.models.Actuator import Actuator


class SwitchActuator(Actuator):
    RESOURCE_TYPE: ClassVar[str] = "iot:actuator:switch🔌"
    VALID_STATUSES: ClassVar[list[str]] = ["ON", "OFF"]

    def __init__(self, resource_id: str):
        super().__init__(
            resource_id=resource_id, type=self.RESOURCE_TYPE, is_operational=True
        )

        self.state = {
            "status": "OFF",
            "last_updated": int(time.time()),
        }

        self.logger = logging.getLogger(f"{resource_id}")

    def apply_command(self, command: Dict[str, Any]) -> bool:
        if not self.is_ready_for_commands():
            self.logger.warning(
                f"Switch {self.resource_id} not ready for commands. Operational: {self.is_operational}"
            )
            return False

        updated = False

        try:
            if "status" in command:
                status = command["status"].upper()
                if status not in self.VALID_STATUSES:
                    raise ValueError(
                        f"Invalid status '{status}'. Must be one of {self.VALID_STATUSES}"
                    )
                self.state["status"] = status
                updated = True

            if updated:
                self.state["last_updated"] = int(time.time())
                self.logger.info(f"Switch {self.resource_id} updated state: {self.state}")
                return True
            else:
                self.logger.warning(
                    f"No changes applied to switch {self.resource_id}. Command: {command}"
                )
                return False

        except (ValueError, TypeError) as e:
            self.logger.error(
                f"Failed to apply command {command} to switch {self.resource_id}: {e}"
            )
            return False

    def get_current_state(self) -> Dict[str, Any]:
        return {
            "resource_id": self.resource_id,
            "type": self.type,
            "is_operational": self.is_operational,
            **self.state,
        }

    def reset(self) -> bool:
        try:
            self.state.update(
                {
                    "status": "OFF",
                    "last_updated": int(time.time()),
                }
            )
            self.logger.info(f"Switch {self.resource_id} reset to default state.")
            return True
        except Exception as e:
            self.logger.error(f"Failed to reset switch {self.resource_id}: {e}")
            return False

    def is_ready_for_commands(self) -> bool:
        return self.is_operational

    def to_dict(self) -> Dict[str, Any]:
        return self.get_current_state()

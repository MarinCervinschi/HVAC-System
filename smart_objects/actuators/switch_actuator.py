import time
import logging
from typing import Dict, Any, ClassVar
from smart_objects.resources.SwitchActuator import SwitchActuator as BaseSwitchActuator


class SwitchActuatorConcrete(BaseSwitchActuator):
    RESOURCE_TYPE: ClassVar[str] = "iot:actuator:switch🔌"

    def __init__(self, resource_id: str):
        super().__init__(
            resource_id=resource_id, type=self.RESOURCE_TYPE, is_operational=True
        )

        self.logger = logging.getLogger(f"{resource_id}")

    def apply_command(self, command: Dict[str, Any]) -> bool:
        """
        Apply a command to the switch actuator.

        Args:
            command: Dictionary containing the command parameters

        Returns:
            bool: True if the command was applied successfully, False otherwise
        """
        if not self.is_ready_for_commands():
            self.logger.warning(
                f"Switch {self.resource_id} not ready for commands. Operational: {self.is_operational}"
            )
            return False

        updated = False

        try:
            updated = self.apply_switch(command)

            if updated:
                self.state["last_updated"] = int(time.time())
                self.logger.info(
                    f"Switch {self.resource_id} updated state: {self.state}"
                )
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

    def reset(self) -> bool:
        """Reset the switch actuator to its default state."""
        try:
            old_status = self.state["status"]
            self.state.update(
                {
                    "status": "OFF",
                    "last_updated": int(time.time()),
                }
            )

            self.logger.info(f"Switch {self.resource_id} reset to default state.")

            # Call the specific implementation for status change
            if old_status != "OFF":
                self._on_status_change(old_status, "OFF")

            return True
        except Exception as e:
            self.logger.error(f"Failed to reset switch {self.resource_id}: {e}")
            return False

    def _on_status_change(self, old_status: str, new_status: str) -> None:
        """
        Handle specific behavior when status changes.
        For a basic switch, we just log the change.
        """
        if new_status == "ON":
            self.logger.info(f"Switch {self.resource_id} turned on")
        else:
            self.logger.info(f"Switch {self.resource_id} turned off")

from abc import ABC
from typing import Dict
from data_collector.models.AbstractSmartEntity import (
    AbstractSmartEntity,
)

import logging


class Rack(AbstractSmartEntity, ABC):
    def __init__(self, rack_id: str, rack_type: str):
        super().__init__()
        self.status = "OFF"
        self.rack_id = rack_id
        self.rack_type = rack_type

        self.logger = logging.getLogger(f"{self.rack_id}")

    def start_all_smart_objects(self):
        """Start all smart objects in the rack."""
        if not self._is_ready_for_commands():
            self.logger.warning(
                f"Rack {self.rack_id} is not ready for commands. Status: {self.status}"
            )
            return
        for smart_object in self.smart_objects.values():
            try:
                smart_object.start()
            except Exception as e:
                raise RuntimeError(
                    f"Failed to start smart object {smart_object}: {e}"
                ) from e

    def stop_all_smart_objects(self):
        """Stop all smart objects in the rack."""
        try:
            if not self._is_ready_for_commands():
                raise RuntimeError(
                    f"Rack {self.rack_id} is not ready for commands. Status: {self.status}"
                )
            for smart_object in self.smart_objects.values():
                try:
                    smart_object.stop()
                except Exception as e:
                    raise RuntimeError(
                        f"Failed to stop smart object {smart_object}: {e}"
                    ) from e
        except Exception as e:
            raise RuntimeError(
                f"Error while stopping all smart objects in rack {self.rack_id}: {e}"
            ) from e

    def apply_command(self, command: str) -> None:
        """Apply a status command to the rack."""
        try:
            if command in ["ON", "OFF"]:
                old_status = self.status
                self.status = command
                self.logger.info(
                    f"Rack {self.rack_id} status changed from {old_status} to {command}"
                )
                if command == "ON":
                    self.start_all_smart_objects()
                elif command == "OFF":
                    self.stop_all_smart_objects()
            else:
                raise ValueError("Invalid status value")
        except Exception as e:
            raise RuntimeError(
                f"Failed to apply command '{command}' to rack {self.rack_id}: {e}"
            )

    def _is_ready_for_commands(self):
        """Check if the rack is ready for commands based on its status."""
        return self.status == "ON"

    def to_full_dict(self) -> Dict:
        """Return a full dictionary representation of the rack."""
        return {
            "rack_id": self.rack_id,
            "status": self.status,
            "rack_type": self.rack_type,
            "smart_objects": {k: v.to_dict() for k, v in self.smart_objects.items()},
        }

    def to_dict(self, full_dict: bool = False) -> Dict:
        """Return a dictionary representation of the rack."""
        if full_dict:
            return self.to_full_dict()
        return {
            "rack_id": self.rack_id,
            "status": self.status,
            "rack_type": self.rack_type,
            "smart_objects": list(self.smart_objects.keys()),
        }

    def __str__(self):
        return f"Rack ID: {self.rack_id}, Type: {self.rack_type}, Smart Objects: {list(self.smart_objects.keys())}"

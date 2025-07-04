from abc import ABC, abstractmethod
from typing import Dict, Any, ClassVar, List
from smart_objects.models.Actuator import Actuator
import logging
import time


class SwitchActuator(Actuator, ABC):
    """
    Abstract base class for all switch actuators.
    Provides common functionality for ON/OFF control devices.
    """
    
    VALID_STATUSES: ClassVar[List[str]] = ["ON", "OFF"]
    
    def __init__(self, resource_id: str, resource_type: str, is_operational: bool = True):
        """
        Initialize the switch actuator.
        
        Args:
            resource_id: Unique identifier for the actuator
            resource_type: Type of the switch actuator
            is_operational: Whether the actuator is operational
        """
        super().__init__(
            resource_id=resource_id,
            type=resource_type,
            is_operational=is_operational
        )
        
        self.state = {
            "status": "OFF",
            "last_updated": int(time.time()),
        }
        
        self.logger = logging.getLogger(f"{resource_id}")
    
    @abstractmethod
    def _on_status_change(self, old_status: str, new_status: str) -> None:
        """
        Hook method called when the status changes.
        Subclasses should implement this to handle specific behavior.
        
        Args:
            old_status: Previous status
            new_status: New status
        """
        pass

    @abstractmethod
    def apply_command(self, command: Dict[str, Any]) -> bool:
        """
        Apply a command to the switch actuator.
        
        Args:
            command: Dictionary containing the command parameters
            
        Returns:
            bool: True if the command was applied successfully, False otherwise
        """
        pass

    @abstractmethod
    def reset(self) -> bool:
        """Reset the switch actuator to its default state."""
        pass
    
    def apply_switch(self, command: Dict[str, Any]) -> bool:
        """
        Check and apply a command to the switch actuator.
        This method handles the common switch logic and can be extended by subclasses.
        
        Args:
            command: Dictionary containing the command parameters
            
        Returns:
            bool: True if the command was applied successfully, False otherwise
        """
        
        try:
            if "status" in command:
                status = command["status"]
                
                # Ensure status is a string
                if not isinstance(status, str):
                    raise ValueError(f"Status must be a string, got: {type(status).__name__}")
                
                status = status.upper()
                if status not in self.VALID_STATUSES:
                    raise ValueError(
                        f"Invalid status '{status}'. Must be one of {self.VALID_STATUSES}"
                    )
                
                self.state["status"] = status
                return True
            
            return False
            
        except (ValueError, TypeError) as e:
            self.logger.error(
                f"Failed to apply command {command} to switch {self.resource_id}: {e}"
            )
            return False

    
    def get_current_state(self) -> Dict[str, Any]:
        """Get the current state of the switch actuator."""
        return {
            "resource_id": self.resource_id,
            "type": self.type,
            "is_operational": self.is_operational,
            **self.state,
        }
    
    def is_ready_for_commands(self) -> bool:
        """Check if the switch actuator is ready to accept commands."""
        return self.is_operational
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert the switch actuator to a dictionary representation."""
        return self.get_current_state()
    
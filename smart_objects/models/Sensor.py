from ..resources.SmartObjectResource import SmartObjectResource
from abc import ABC, abstractmethod


class Sensor(SmartObjectResource[float], ABC):
    def __init__(
        self,
        resource_id: str,
        type: str,
        value: float,
        unit: str,
        timestamp: int,
        min: float,
        max: float,
    ):
        super().__init__(resource_id)
        self.type = type
        self.value = value
        self.unit = unit
        self.timestamp = timestamp
        self.min = min
        self.max = max

    @abstractmethod
    def load_updated_value(self) -> float:
        pass

    @abstractmethod
    def measure(self) -> None:
        """Abstract method to be implemented by subclasses for measuring sensor values."""
        pass

    @abstractmethod
    def start_periodic_event_value_update_task(self) -> None:
        """Abstract method to be implemented by subclasses for starting periodic updates."""
        pass

    @abstractmethod
    def stop_periodic_event_value_update_task(self) -> None:
        """Abstract method to be implemented by subclasses for stopping periodic updates."""
        pass

    def _set_min(self, min_value: float) -> None:
        """Set the minimum value for the sensor."""
        self.min = min_value

    def _set_max(self, max_value: float) -> None:
        """Set the maximum value for the sensor."""
        self.max = max_value

    def _set_unit(self, unit: str) -> None:
        """Set the unit of measurement for the sensor."""
        self.unit = unit

    def __str__(self):
        return f"Sensor(resource_id={self.resource_id}, type={self.type}, value={self.value}, unit={self.unit}, timestamp={self.timestamp}, min={self.min}, max={self.max})"

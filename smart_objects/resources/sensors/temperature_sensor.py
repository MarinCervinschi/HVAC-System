import random
import time
import logging
from ...models.Sensor import Sensor
from typing import Dict, Any


class TemperatureSensor(Sensor):

    DEFAULT_MIN_TEMP = 25.0
    DEFAULT_MAX_TEMP = 45.0
    MEASUREMENT_PRECISION = 2

    def __init__(self, resource_id: str):

        super().__init__(
            resource_id=resource_id,
            type="TemperatureSensor",
            value=0.0,
            unit="Celsius",
            timestamp=0,
            min=self.DEFAULT_MIN_TEMP,
            max=self.DEFAULT_MAX_TEMP,
        )

        self.logger = logging.getLogger(f"{__name__}.{resource_id}")

        self.measure()

    def measure(self) -> None:
        try:
            new_value = random.uniform(self.min, self.max)

            self.value = round(new_value, self.MEASUREMENT_PRECISION)

            self.timestamp = int(time.time())

            self.logger.debug(
                f"Temperature measured: {self.value}°{self.unit} at timestamp {self.timestamp}"
            )

        except Exception as e:
            self.logger.error(f"Failed to measure temperature: {e}")
            raise RuntimeError(f"Temperature measurement failed: {e}")

    def load_updated_value(self) -> float:
        try:
            self.measure()
            return self.value
        except Exception as e:
            self.logger.error(f"Failed to load updated temperature value: {e}")
            raise RuntimeError(f"Failed to get updated temperature: {e}")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "resource_id": self.resource_id,
            "type": self.type,
            "value": self.value,
            "unit": self.unit,
            "timestamp": self.timestamp,
            "min": self.min,
            "max": self.max,
        }

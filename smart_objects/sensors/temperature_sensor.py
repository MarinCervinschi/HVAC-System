import time
import random
import logging
import threading
from typing import Dict, Any, ClassVar
from smart_objects.models.Sensor import Sensor


class TemperatureSensor(Sensor):

    RESOURCE_TYPE: ClassVar[str] = "iot:sensor:temperature🌡️"
    UNIT: ClassVar[str] = "Celsius"
    DATA_TYPE: ClassVar[type] = float
    DEFAULT_MIN_TEMP: ClassVar[float] = 25.0
    DEFAULT_MAX_TEMP: ClassVar[float] = 45.0
    MEASUREMENT_PRECISION: ClassVar[int] = 2
    UPDATE_PERIOD: ClassVar[int] = 60
    TASK_DELAY_TIME: ClassVar[int] = 5

    def __init__(self, resource_id: str):

        super().__init__(
            resource_id=resource_id,
            type=self.RESOURCE_TYPE,
            data_type=self.DATA_TYPE,
            value=0.0,
            unit=self.UNIT,
            timestamp=0,
            min=self.DEFAULT_MIN_TEMP,
            max=self.DEFAULT_MAX_TEMP,
        )

        self.logger = logging.getLogger(f"{resource_id}")
        self._timer = None

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

    def start_periodic_event_value_update_task(self) -> None:
        self.logger.debug(
            f"Starting periodic temperature measurement task for {self.resource_id}, will update every {self.UPDATE_PERIOD} seconds."
        )

        def update_task():
            try:
                updated_value = self.load_updated_value()
                self.notify_update(updated_value)
            except RuntimeError as e:
                self.logger.error(f"Error during temperature update task: {e}")

            self._timer = threading.Timer(self.UPDATE_PERIOD, update_task)
            self._timer.start()

        self._timer = threading.Timer(self.TASK_DELAY_TIME, update_task)
        self._timer.start()

    def stop_periodic_event_value_update_task(self) -> None:
        if self._timer is not None:
            self._timer.cancel()
            self._timer = None
            self.logger.debug(
                f"Stopped periodic temperature measurement task for {self.resource_id}."
            )

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

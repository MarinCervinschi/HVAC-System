import time
import random
import logging
import threading
from smart_objects.models.Sensor import Sensor
from typing import Dict, Any, ClassVar

class EnergySensor(Sensor):
    RESOURCE_TYPE: ClassVar[str] = "iot:sensor:energy⚡"
    UNIT: ClassVar[str] = "kWh"
    DATA_TYPE: ClassVar[type] = float
    DEFAULT_MIN_ENERGY: ClassVar[float] = 0.0
    DEFAULT_MAX_ENERGY: ClassVar[float] = 1000.0
    MEASUREMENT_PRECISION: ClassVar[int] = 3
    UPDATE_PERIOD: ClassVar[int] = 60  
    TASK_DELAY_TIME: ClassVar[int] = 5

    def __init__(self, resource_id):
        super().__init__(
            resource_id=resource_id,
            type=self.RESOURCE_TYPE,
            data_type=self.DATA_TYPE,
            value=0.0,
            unit=self.UNIT,
            timestamp=0,
            min=self.DEFAULT_MIN_ENERGY,
            max=self.DEFAULT_MAX_ENERGY
        )
        
        
        self.logger = logging.getLogger(f"{resource_id}")
        self._timer = None

        self.start_periodic_event_value_update_task()

    def load_updated_value(self) -> float:
        try:
            self.measure()
            return self.value
        except Exception as e:
            self.logger.error(f"Failed to load updated energy value: {e}")
            raise RuntimeError(f"Failed to get updated energy consumption: {e}")

    def measure(self) -> None:
        try:
            new_value = random.uniform(self.min, self.max)  
            self.value = round(new_value, self.MEASUREMENT_PRECISION)
            self.timestamp = int(time.time())
            self.logger.debug(f"Energy consumption measured: {self.value} {self.unit} at timestamp {self.timestamp}")
        except Exception as e:
            self.logger.error(f"Failed to measure energy consumption: {e}")
            raise RuntimeError(f"Energy measurement failed: {e}")

    def start_periodic_event_value_update_task(self) -> None:
        self.logger.debug(
            f"Starting periodic energy measurement task for {self.resource_id}, will update every {self.UPDATE_PERIOD} seconds."
        )

        def update_task():
            try:
                updated_value = self.load_updated_value()
                self.notify_update(updated_value)
            except RuntimeError as e:
                self.logger.error(f"Error during energy update task: {e}")

            self._timer = threading.Timer(self.UPDATE_PERIOD, update_task)
            self._timer.start()

        self._timer = threading.Timer(self.TASK_DELAY_TIME, update_task)
        self._timer.start()

    def stop_periodic_event_value_update_task(self) -> None: 
        if self._timer is not None:
            self._timer.cancel()
            self._timer = None
            self.logger.debug(
                f"Stopped periodic energy measurement task for {self.resource_id}."
            )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "resource_id": self.resource_id,
            "type": self.type,
            "value": self.value,
            "unit": self.unit,
            "timestamp": self.timestamp,
            "min": self.min,
            "max": self.max
        }
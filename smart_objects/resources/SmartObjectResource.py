from abc import ABC, abstractmethod
from typing import Generic, TypeVar, List
from .ResourceDataListener import ResourceDataListener
import json
import logging

T = TypeVar("T")

class SmartObjectResource(ABC, Generic[T]):
    def __init__(self, resource_id: str):
        self.type: str = None
        self.data_type: T = None
        self.resource_id: str = resource_id
        self.resource_listener_list: List[ResourceDataListener[T]] = []

        self.logger = logging.getLogger(f"{resource_id}")

    @abstractmethod
    def load_updated_value(self) -> T:
        pass

    def add_data_listener(self, resource_data_listener: ResourceDataListener[T]) -> None:
        """Add a new listener to be notified of changes"""
        if resource_data_listener not in self.resource_listener_list:
            self.resource_listener_list.append(resource_data_listener)
        else:
            self.logger.debug(f"Listener already registered: {resource_data_listener}")

    def remove_data_listener(
        self, resource_data_listener: ResourceDataListener[T]
    ) -> None:
        """Remove an existing listener"""
        if resource_data_listener in self.resource_listener_list:
            self.resource_listener_list.remove(resource_data_listener)
        else:
            self.logger.debug(f"Listener not found: {resource_data_listener}")

    def notify_update(self, updated_value: T) -> None:
        """Notify all registered listeners of a value change"""
        if not self.resource_listener_list:
            self.logger.info("No active listeners - nothing to notify")
            return

        for listener in self.resource_listener_list:
            if listener is not None:
                listener.on_data_changed(self, updated_value)

    def to_json(self):
        return json.dumps(self, default=lambda o: o.__dict__)

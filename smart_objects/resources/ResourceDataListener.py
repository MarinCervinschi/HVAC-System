from abc import ABC, abstractmethod
from typing import Generic, TypeVar

T = TypeVar('T')

class ResourceDataListener(ABC, Generic[T]):
    @abstractmethod
    def on_data_changed(self, resource, updated_value: T):
        pass
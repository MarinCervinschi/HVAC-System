from abc import ABC, abstractmethod
from typing import Generic, TypeVar, TYPE_CHECKING, Any

if TYPE_CHECKING:
    from smart_objects.resources.SmartObjectResource import SmartObjectResource


T = TypeVar("T")


class ResourceDataListener(ABC, Generic[T]):
    @abstractmethod
    def on_data_changed(
        self, resource: "SmartObjectResource[T]", updated_value: T, **kwargs: Any
    ) -> None:
        pass

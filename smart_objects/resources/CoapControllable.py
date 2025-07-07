from aiocoap import resource
from abc import ABC, abstractmethod


class CoapControllable(ABC):

    @abstractmethod
    def get_coap_resource_tree(self) -> resource.Site:
        """Should return the CoAP resource tree for this smart object"""
        pass

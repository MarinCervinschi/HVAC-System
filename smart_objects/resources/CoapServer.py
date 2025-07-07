import asyncio
import threading
import logging
from aiocoap import resource, Context
from config.coap_conf_params import CoapConfigurationParameters
from typing import List, Optional
from smart_objects.resources.CoapControllable import CoapControllable
from smart_objects.devices.SmartObject import SmartObject


class CoapServer:
    """
    Centralized CoAP server that manages all smart objects' resources across all rooms.
    This prevents port conflicts and creates a unified .well-known/core endpoint.
    """

    def __init__(self):
        self.coap_port: int = CoapConfigurationParameters.COAP_SERVER_PORT
        self.coap_address: str = CoapConfigurationParameters.COAP_SERVER_ADDRESS
        self.coap_context: Optional[Context] = None
        self.coap_server_thread: Optional[threading.Thread] = None
        self.smart_objects: List[CoapControllable | SmartObject] = []
        self.logger: logging.Logger = logging.getLogger("CoapServer")

    def add_smart_object(self, smart_object: CoapControllable | SmartObject) -> None:
        """Add a smart object to be managed by this CoAP server"""
        self.smart_objects.append(smart_object)
        self.logger.info(
            f"Added smart object {smart_object.object_id} from room {smart_object.room_id}"
        )

    def get_unified_resource_tree(self) -> resource.Site:
        """Create a unified resource tree with all smart objects' resources"""
        unified_site: resource.Site = resource.Site()

        unified_site.add_resource(
            (".well-known", "core"),
            resource.WKCResource(
                unified_site.get_resources_as_linkheader, impl_info=None
            ),
        )

        for smart_obj in self.smart_objects:
            obj_site = smart_obj.get_coap_resource_tree()
            if obj_site is not None:
                for path, res in obj_site._resources.items():
                    if path != (".well-known", "core"):
                        unified_site.add_resource(path, res)
                        self.logger.info(
                            f"Added resource {'/'.join(path)} from {smart_obj.object_id}"
                        )

        return unified_site

    def start_coap_server(self) -> None:
        """Start the unified CoAP server"""

        async def coap_app() -> None:
            unified_site = self.get_unified_resource_tree()
            self.coap_context = await Context.create_server_context(
                unified_site, bind=(self.coap_address, self.coap_port)
            )
            await asyncio.get_running_loop().create_future()

        def thread_target() -> None:
            asyncio.run(coap_app())

        self.coap_server_thread = threading.Thread(target=thread_target, daemon=True)
        self.coap_server_thread.start()

    def stop_coap_server(self) -> None:
        """Stop the CoAP server"""
        if self.coap_context:
            self.coap_context.shutdown()
        if self.coap_server_thread and self.coap_server_thread.is_alive():
            # Note: Cannot directly stop a thread, it will end when the context shuts down
            pass

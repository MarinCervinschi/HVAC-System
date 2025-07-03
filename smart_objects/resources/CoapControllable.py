from abc import ABC, abstractmethod
from aiocoap import resource, Context
from config.coap_conf_params import CoapConfigurationParameters
import asyncio
import threading


class CoapControllable(ABC):

    def __init__(self):
        self.coap_port = CoapConfigurationParameters.COAP_SERVER_PORT
        self.coap_context = None
        self.coap_server_thread = None

    @abstractmethod
    def get_coap_resource_tree(self) -> resource.Site:
        """Should return the CoAP resource tree for this smart object"""
        pass

    def start_coap_server(self):
        async def coap_app():
            self.coap_context = await Context.create_server_context(
                self.get_coap_resource_tree(), bind=("::", self.coap_port)
            )
            print(f"📡 CoAP Server listening on port {self.coap_port}")
            await asyncio.get_running_loop().create_future()  # run forever

        def thread_target():
            asyncio.run(coap_app())

        self.coap_server_thread = threading.Thread(target=thread_target, daemon=True)
        self.coap_server_thread.start()

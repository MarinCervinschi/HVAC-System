from aiocoap import Context, Message, Code
from link_header import parse
from gateway.device_registry import DeviceRegistry
from typing import Any


class DeviceDiscoverer:
    def __init__(self, registry: DeviceRegistry):
        self.registry = registry

    async def discover(self, host: str, port: int = 5683) -> None:
        uri = f"coap://{host}:{port}/.well-known/core"

        try:
            context = await Context.create_client_context()
            request = Message(code=Code.GET, uri=uri)
            response = await context.request(request).response

            payload: str = response.payload.decode()
            links: Any = parse(payload)
            print(f"🔍 Discovered resources at {host}:{port}:\n{links}")

            for link in links.links:
                path: str = link.href.strip("/")
                self.registry.add_resource(host, port, path, link.attr_dict)

        except Exception as e:
            print(f"❌ Failed to discover {host}: {e}")

    async def check_connectivity(self, host: str, port: int = 5683) -> bool:
        uri = f"coap://{host}:{port}/.well-known/core"
        try:
            context = await Context.create_client_context()
            request = Message(code=Code.GET, uri=uri)
            response = await context.request(request).response
            return True if response else False
        except Exception as e:
            print(f"❌ Connectivity check failed for {host}:{port} - {e}")
            return False

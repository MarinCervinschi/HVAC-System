import asyncio
from aiocoap import Context
from aiocoap.resource import Site, WKCResource
from gateway.device_discoverer import DeviceDiscoverer
from gateway.device_registry import DeviceRegistry
from gateway.resources.forward_resource import ForwardResource
from config.coap_conf_params import CoapConfigurationParameters


async def start_gateway_coap_server():
    registry = DeviceRegistry()
    discoverer = DeviceDiscoverer(registry)

    print("🚀 Starting CoAP Gateway...")
    devices = [CoapConfigurationParameters.COAP_SERVER_ADDRESS, "192.168.1.101"]

    print("🔍 Checking device connectivity...")
    for ip in devices:
        is_reachable = await discoverer.check_connectivity(ip)
        if is_reachable:
            print(f"✅ {ip} is reachable")
            await discoverer.discover(ip)
        else:
            print(f"❌ {ip} is not reachable - skipping discovery")

    """ print("\n📚 Registry aggiornato:")
    registry.print_registry() """

    site = Site()
    site.add_resource(
        (".well-known", "core"), WKCResource(site.get_resources_as_linkheader)
    )
    site.add_resource(("proxy", "forward",), ForwardResource(registry))

    print(f"🌐 CoAP Proxy Gateway running at {CoapConfigurationParameters.GATEWAY_URI}")
    await Context.create_server_context(
        site,
        bind=(
            CoapConfigurationParameters.COAP_SERVER_ADDRESS,
            CoapConfigurationParameters.COAP_GATEWAY_PORT,
        ),
    )
    await asyncio.get_running_loop().create_future()


def main():
    asyncio.run(start_gateway_coap_server())

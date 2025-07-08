from typing import ClassVar


class CoapConfigurationParameters(object):
    COAP_SERVER_ADDRESS: ClassVar[str] = "127.0.0.1"
    COAP_SERVER_PORT: ClassVar[int] = 5683
    COAP_GATEWAY_PORT: ClassVar[int] = 5684

    BASIC_URI: ClassVar[str] = f"coap://{COAP_SERVER_ADDRESS}:{COAP_SERVER_PORT}"
    GATEWAY_URI: ClassVar[str] = (
        f"coap://{COAP_SERVER_ADDRESS}:{COAP_GATEWAY_PORT}/proxy/forward"
    )

    @staticmethod
    def build_coap_room_path(room_id: str, device_id: str, resource_id: str) -> str:
        """Build the CoAP URI for a specific room and device.
        e.g., hvac/room/{room_id}/device/{device_id}/{resource_id}/control
        """
        return "hvac/room/{0}/device/{1}/{2}/control".format(
            room_id, device_id, resource_id
        ).split("/")

    @staticmethod
    def build_coap_rack_path(
        room_id: str, rack_id: str, device_id: str, resource_id: str
    ) -> str:
        """Build the CoAP URI for a specific room and rack.
        e.g., hvac/room/{room_id}/rack/{rack_id}/device/{device_id}/{resource_id}/control
        """
        return "hvac/room/{0}/rack/{1}/device/{2}/{3}/control".format(
            room_id,
            rack_id,
            device_id,
            resource_id,
        ).split("/")

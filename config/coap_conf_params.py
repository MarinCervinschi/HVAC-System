from typing import ClassVar


class CoapConfigurationParameters(object):
    COAP_SERVER_ADDRESS: ClassVar[str] = "127.0.0.1"
    COAP_SERVER_PORT: ClassVar[int] = 5683
    COAP_GATEWAY_PORT: ClassVar[int] = 5684

    BASIC_URI: ClassVar[str] = f"coap://{COAP_SERVER_ADDRESS}:{COAP_SERVER_PORT}"
    GATEWAY_URI: ClassVar[str] = f"coap://{COAP_SERVER_ADDRESS}:{COAP_GATEWAY_PORT}"

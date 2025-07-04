from typing import ClassVar


class CoapConfigurationParameters(object):
    COAP_SERVER_ADDRESS: ClassVar[str] = "127.0.0.1"
    COAP_SERVER_PORT: ClassVar[int] = 5683

    BASIC_URI: ClassVar[str] = "coap://{host}:{port}/hvac/room"

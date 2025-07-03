import asyncio
from aiocoap import *
import json
from config.coap_conf_params import CoapConfigurationParameters

async def coap_post_command():
    protocol = await Context.create_client_context()

    payload = {
        "status": "ON",
        "speed": 80
    }

    host = CoapConfigurationParameters.COAP_SERVER_ADDRESS
    port = CoapConfigurationParameters.COAP_SERVER_PORT
    # Example: /hvac/room/{room_id}/rack/{rack_id}/device/{object_id}/fan/control
    uri = "hvac/room/room_001/rack/rack_001/device/rack_cooling_unit/fan/control"

    request = Message(
        code=POST,
        uri=f"coap://{host}:{port}/{uri}",
        payload=json.dumps(payload).encode("utf-8"),
    )

    response = await protocol.request(request).response
    print("📨 Response:")
    print(response.code)
    print(response.payload.decode())

asyncio.run(coap_post_command())

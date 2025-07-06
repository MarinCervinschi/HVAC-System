import json
from aiocoap import Context, Message, Code
from aiocoap.resource import Resource
import asyncio

class ForwardResource(Resource):
    def __init__(self, registry):
        super().__init__()
        self.registry = registry

    async def render_post(self, request):
        try:
            payload = json.loads(request.payload.decode())
            device_host = payload["host"]
            resource_path = payload["path"]
            command = payload["command"]

            # Ricostruisci l'URI del device target
            uri = f"coap://{device_host}:5683/{resource_path}"
            context = await Context.create_client_context()
            forward_request = Message(code=Code.POST, uri=uri, payload=json.dumps(command).encode())

            response = await context.request(forward_request).response
            return Message(code=response.code, payload=response.payload)

        except Exception as e:
            return Message(code=Code.INTERNAL_SERVER_ERROR, payload=str(e).encode())

import json
import traceback
from aiocoap.resource import Resource
from typing import Any, Dict, Optional
from aiocoap import Context, Message, Code
from gateway.device_registry import DeviceRegistry


class ForwardResource(Resource):
    def __init__(self, registry: DeviceRegistry):
        super().__init__()
        self.registry = registry

    async def render_post(self, request: Message) -> Message:
        try:
            payload: Dict[str, Any] = json.loads(request.payload.decode())
            object_id: Optional[str] = payload.get("object_id")
            room_id: Optional[str] = payload.get("room_id")
            rack_id: Optional[str] = payload.get("rack_id")
            command: Any = payload["command"]

            if not object_id or not room_id or not command:
                return Message(
                    code=Code.BAD_REQUEST,
                    payload=b"Missing required fields: object_id, room_id, or command",
                )

            print(f"Forwarding command to object_id: {object_id}, room_id: {room_id}, rack_id: {rack_id}, command: {command}")
            uri: Optional[str] = self.registry.get_resource_uri(
                object_id, room_id, rack_id
            )
            if not uri:
                return Message(
                    code=Code.NOT_FOUND,
                    payload=b"Resource not found for the given object_id, room_id, and rack_id",
                )
            context: Context = await Context.create_client_context()
            forward_request: Message = Message(
                code=Code.POST, uri=uri, payload=json.dumps(command).encode()
            )

            response: Message = await context.request(forward_request).response
            return Message(code=response.code, payload=response.payload)

        except Exception as e:
            traceback.print_exc()
            return Message(code=Code.INTERNAL_SERVER_ERROR, payload=str(e).encode())

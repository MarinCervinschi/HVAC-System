from flask import request
from flask_restful import Resource
import asyncio
import json
from aiocoap import Context, Message, POST
from data_collector.core.manager import HVACSystemManager


class DeviceControlAPI(Resource):
    def __init__(self, **kwargs):
        self.system_manager: HVACSystemManager = kwargs.get("system_manager")

    def post(self, room_id, rack_id, device_id):
        try:
            payload = request.get_json(force=True)

            # Esempio: endpoint CoAP da costruire dinamicamente
            coap_endpoint = f"coap://localhost:5683/{device_id}/fan"
            asyncio.run(self.send_coap_command(coap_endpoint, payload))

            return {
                "status": "success",
                "message": f"Command sent to device {device_id}",
                "command": payload,
            }, 200
        except Exception as e:
            return {"status": "error", "message": str(e)}, 500

    async def send_coap_command(self, uri, payload_dict):
        context = await Context.create_client_context()
        payload = json.dumps(payload_dict).encode("utf-8")
        request = Message(code=POST, uri=uri, payload=payload)
        response = await context.request(request).response

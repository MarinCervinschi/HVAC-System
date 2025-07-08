import json
import asyncio
from flask import request
from flask_restful import Resource
from aiocoap import Context, Message, Code
from data_collector.core.manager import HVACSystemManager
from config.coap_conf_params import CoapConfigurationParameters


class DeviceControlAPI(Resource):
    def __init__(self, **kwargs):
        self.system_manager: HVACSystemManager = kwargs.get("system_manager")

    def post(self):
        try:
            payload = request.get_json(force=True)

            required_fields = ["object_id", "room_id", "command"]
            for field in required_fields:
                if field not in payload:
                    return {"error": f"Missing required field: {field}"}, 400

            result = asyncio.run(self.send_coap_command_via_gateway(payload))

            if result.get("success"):
                return {
                    "status": "success",
                    "message": f"Command sent to device {payload['object_id']} in room {payload['room_id']}",
                    "response": result.get("response_data", "No response"),
                }, 200
            else:
                coap_code = result.get("status_code", 500)

                if (
                    128 <= coap_code <= 159
                ):  # CoAP 4.xx range (128 = 4.00, 132 = 4.04, etc.)
                    http_status = 400
                elif 160 <= coap_code <= 191:  # CoAP 5.xx range
                    http_status = 500
                else:
                    http_status = 500  # Default to server error

                error_data = result.get("error", "Unknown error")
                parsed_error = None

                if isinstance(error_data, str):
                    try:
                        parsed_error = json.loads(error_data)
                    except json.JSONDecodeError:
                        parsed_error = {"message": error_data}
                else:
                    parsed_error = error_data

                return {
                    "status": "error",
                    "message": f"Command failed for device {payload['object_id']} in room {payload['room_id']}",
                    "error_details": parsed_error,
                    "coap_status_code": coap_code,
                }, http_status

        except Exception as e:
            return {"status": "error", "message": str(e)}, 500

    async def send_coap_command_via_gateway(self, payload_dict):
        """
        Send CoAP command via the gateway's ForwardResource.
        The gateway will handle device discovery and routing.
        """
        try:
            context = await Context.create_client_context()
            gateway_uri = CoapConfigurationParameters.GATEWAY_URI
            gateway_payload = json.dumps(payload_dict).encode("utf-8")

            request_msg = Message(
                code=Code.POST, uri=gateway_uri, payload=gateway_payload
            )
            response = await context.request(request_msg).response

            response_data = None
            if response.payload:
                try:
                    response_data = json.loads(response.payload.decode())
                except json.JSONDecodeError:
                    response_data = response.payload.decode()

            if response.code.is_successful():
                return {
                    "success": True,
                    "response_data": response_data,
                    "status_code": int(response.code),
                }
            else:
                error_msg = (
                    response.payload.decode()
                    if response.payload
                    else f"CoAP error: {response.code}"
                )
                return {
                    "success": False,
                    "error": error_msg,
                    "status_code": int(response.code),
                }

        except Exception as e:
            return {
                "success": False,
                "error": f"Gateway communication error: {str(e)}",
                "status_code": 500,
            }

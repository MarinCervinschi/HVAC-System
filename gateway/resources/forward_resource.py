import json
import traceback
import logging
import os
from datetime import datetime
from aiocoap.resource import Resource
from typing import Any, Dict, Optional
from aiocoap import Context, Message, Code
from gateway.device_registry import DeviceRegistry


class ForwardResource(Resource):
    def __init__(self, registry: DeviceRegistry):
        super().__init__()
        self.registry = registry
        self.logger = self._setup_logger()

    def _setup_logger(self) -> logging.Logger:
        """Setup del logger per il proxy forward resource"""
        logger = logging.getLogger("ForwardResource")
        logger.setLevel(logging.INFO)

        log_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "logs")
        os.makedirs(log_dir, exist_ok=True)

        log_file = os.path.join(log_dir, "forward_resource.log")
        file_handler = logging.FileHandler(log_file)
        file_handler.setLevel(logging.INFO)

        formatter = logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        )
        file_handler.setFormatter(formatter)

        if not logger.handlers:
            logger.addHandler(file_handler)

        return logger

    async def render_post(self, request: Message) -> Message:
        self.logger.info(f"Received POST request from {request.remote}")

        try:
            payload: Dict[str, Any] = json.loads(request.payload.decode())
            object_id: Optional[str] = payload.get("object_id")
            room_id: Optional[str] = payload.get("room_id")
            rack_id: Optional[str] = payload.get("rack_id")
            command: Any = payload["command"]

            self.logger.info(
                f"Request parameters - object_id: {object_id}, room_id: {room_id}, rack_id: {rack_id}, command: {command}"
            )

            if not object_id or not room_id or not command:
                error_msg = "Missing required fields: object_id, room_id, or command"
                self.logger.warning(f"Bad request: {error_msg}")
                return Message(
                    code=Code.BAD_REQUEST,
                    payload=error_msg.encode(),
                )

            uri: Optional[str] = self.registry.get_resource_uri(
                object_id, room_id, rack_id
            )
            if not uri:
                error_msg = (
                    "Resource not found for the given object_id, room_id, and rack_id"
                )
                self.logger.warning(
                    f"Resource not found - object_id: {object_id}, room_id: {room_id}, rack_id: {rack_id}"
                )
                return Message(
                    code=Code.NOT_FOUND,
                    payload=error_msg.encode(),
                )

            self.logger.info(f"Forwarding command to URI: {uri}")

            context: Context = await Context.create_client_context()
            forward_request: Message = Message(
                code=Code.POST, uri=uri, payload=json.dumps(command).encode()
            )

            response: Message = await context.request(forward_request).response

            self.logger.info(
                f"Received response from {uri} - Code: {response.code}, Payload size: {len(response.payload)} bytes"
            )

            return Message(code=response.code, payload=response.payload)

        except json.JSONDecodeError as e:
            error_msg = f"Invalid JSON payload: {str(e)}"
            self.logger.error(error_msg)
            return Message(code=Code.BAD_REQUEST, payload=error_msg.encode())
        except Exception as e:
            error_msg = f"Internal server error: {str(e)}"
            self.logger.error(f"Exception occurred: {error_msg}")
            self.logger.error(f"Traceback: {traceback.format_exc()}")
            traceback.print_exc()
            return Message(code=Code.INTERNAL_SERVER_ERROR, payload=error_msg.encode())

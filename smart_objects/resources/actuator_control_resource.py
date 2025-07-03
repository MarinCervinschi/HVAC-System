from aiocoap import resource, Message, Code
import json
import traceback
from typing import Callable
from smart_objects.models.Actuator import Actuator


class ActuatorControlResource(resource.Resource):
    def __init__(self, actuator: Actuator):
        super().__init__()
        self.actuator = actuator

    async def render_post(self, request: Message) -> Message:
        try:
            payload = request.payload.decode()
            command = json.loads(payload)

            success = self.actuator.apply_command(command)

            if success:
                return Message(
                    code=Code.CHANGED,
                    payload=json.dumps(
                        {
                            "status": "success",
                            "applied_command": command,
                            "new_state": self.actuator.get_current_state(),
                        }
                    ).encode(),
                )
            else:
                return Message(
                    code=Code.BAD_REQUEST,
                    payload=json.dumps(
                        {
                            "status": "error",
                            "reason": "Command could not be applied",
                            "command": command,
                        }
                    ).encode(),
                )
        except Exception as e:
            traceback.print_exc()
            return Message(
                code=Code.INTERNAL_SERVER_ERROR,
                payload=json.dumps({"status": "error", "reason": str(e)}).encode(),
            )

    async def render_get(self, request):
        """Optional: allow GET to fetch current actuator state"""
        return Message(
            code=Code.CONTENT,
            payload=json.dumps(self.actuator.get_current_state()).encode(),
        )

from aiocoap import resource, Message, Code
import json
import traceback
from smart_objects.models.Actuator import Actuator
from typing import Optional, Dict, Any


class ActuatorControlResource(resource.Resource):
    def __init__(self, actuator: Actuator, attributes: Dict[str, Optional[str]]):
        super().__init__()
        self.actuator = actuator
        self.attributes = attributes

    def get_link_description(self):
        """Return CoAP link attributes for this actuator resource"""
        name = self.actuator.resource_id.replace("_", " ").title()
        attributes = {
            "title": f"{name} Control",
        }

        if hasattr(self.actuator, "rt"):
            attributes["rt"] = " ".join(self.actuator.rt)
        else:
            type = self.actuator.type.split(":")[-1]
            attributes["rt"] = "core.a hvac.actuator." + type

        if hasattr(self.actuator, "if_"):
            attributes["if"] = " ".join(self.actuator.if_)
        else:
            attributes["if"] = "core.a"

        if hasattr(self.actuator, "ct"):
            attributes["ct"] = " ".join(str(ct) for ct in self.actuator.ct)
        else:
            attributes["ct"] = "0 50"

        attributes.update(self.attributes)

        return attributes

    async def render_post(self, request: Message) -> Message:
        try:
            payload = request.payload.decode()
            command = json.loads(payload)
            event_type: str = command.get("event_type", "MANUAL")
            event_data: Dict[str, Any] = command.get("event_data", {})
            if command.get("event_type") is not None:
                del command["event_type"]
            if command.get("event_data") is not None:
                del command["event_data"]

            success = self.actuator.apply_command(
                command, event_type=event_type, event_data=event_data
            )

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

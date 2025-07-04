import json
import logging
import operator
from typing import Dict, List, Callable, Any

import asyncio
from aiocoap import Message, Context, POST
from aiocoap.numbers.codes import Code


class PolicyManager:

    OPERATORS: Dict[str, Callable[[Any, Any], bool]] = {
        ">": operator.gt,
        "<": operator.lt,
        "==": operator.eq,
        ">=": operator.ge,
        "<=": operator.le,
        "!=": operator.ne,
    }

    def __init__(self, room_id: str, policy_file_path: str):
        self.room_id = room_id
        self.policy_file_path = policy_file_path
        self.policies: List[Dict[str, Any]] = []
        self.logger = logging.getLogger(__name__)
        self.load_policies()

    def load_policies(self):
        try:
            with open(self.policy_file_path, "r") as file:
                data = json.load(file)
                self.policies = data.get(self.room_id, [])
                self.logger.info(f"Loaded {len(self.policies)} policies.")
        except Exception as e:
            self.logger.error(f"Error loading policy file: {e}")

    def update_policies(self, new_policies: List[Dict[str, Any]]):
        self.policies = new_policies
        with open(self.policy_file_path, "w") as f:
            json.dump({self.room_id: self.policies}, f, indent=2)
        self.logger.info("Policies updated.")

    def evaluate(self, telemetry: Dict[str, Any]):
        for policy in self.policies:
            try:
                if (
                    telemetry.get("room_id") == policy["room_id"]
                    and telemetry.get("rack_id") == policy["rack_id"]
                    and telemetry.get("type") == policy["sensor_type"]
                ):
                    value = float(telemetry.get("value", 0))
                    operator_fn = self.OPERATORS[policy["condition"]["operator"]]
                    threshold = policy["condition"]["value"]

                    if operator_fn(value, threshold):
                        self.logger.info(f"Policy {policy['id']} triggered.")
                        asyncio.create_task(self._send_coap_command(policy["action"]))
            except Exception as e:
                self.logger.error(f"Error evaluating policy {policy['id']}: {e}")

    async def _send_coap_command(self, action: Dict[str, Any]):
        try:
            context = await Context.create_client_context()
            payload = json.dumps(action["command"]).encode("utf-8")
            request = Message(code=POST, uri=action["endpoint"], payload=payload)
            response = await context.request(request).response
            self.logger.info(f"CoAP Response: {response.code}")
        except Exception as e:
            self.logger.error(f"Failed to send CoAP command: {e}")

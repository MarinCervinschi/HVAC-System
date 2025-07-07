import json
import logging
import operator
from typing import Dict, List, Callable, Any
import threading

import asyncio
from aiocoap import Message, Context, POST
from config.coap_conf_params import CoapConfigurationParameters


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
        self.gateway_uri = CoapConfigurationParameters.GATEWAY_URI
        self.logger = logging.getLogger("PolicyManager")
        self.logger.setLevel(logging.DEBUG)
        self.load_policies()

    def load_policies(self):
        try:
            with open(self.policy_file_path, "r") as file:
                data = json.load(file)

                rooms_data = data.get("rooms", {})

                self.policies = rooms_data.get(self.room_id, [])
                self.logger.info(
                    f"Loaded {len(self.policies)} policies for room {self.room_id}."
                )

        except FileNotFoundError:
            self.logger.error(f"Policy file not found: {self.policy_file_path}")
        except json.JSONDecodeError as e:
            self.logger.error(f"Invalid JSON in policy file: {e}")
        except Exception as e:
            self.logger.error(f"Error loading policy file: {e}")
            import traceback

            self.logger.error(traceback.format_exc())

    def update_policies(self, new_policies: List[Dict[str, Any]]):
        self.policies = new_policies
        with open(self.policy_file_path, "w") as f:
            json.dump({self.room_id: self.policies}, f, indent=2)
        self.logger.info("Policies updated.")

    def evaluate(self, telemetry: Dict[str, Any]) -> None:
        for policy in self.policies:
            try:
                if self._matches_policy_sensor(policy, telemetry):
                    value = float(telemetry.get("data_value", 0))
                    operator_fn = self.OPERATORS[policy["condition"]["operator"]]
                    threshold = policy["condition"]["value"]

                    if operator_fn(value, threshold):
                        self.logger.info(f"Policy {policy['id']} triggered.")

                        payload = self._get_payload(policy)
                        self._execute_policy_action_safely(payload)
            except Exception as e:
                self.logger.error(f"Error evaluating policy {policy['id']}: {e}")

    def _matches_policy_sensor(
        self, policy: Dict[str, Any], telemetry: Dict[str, Any]
    ) -> bool:
        """
        Check if the telemetry matches the policy sensor.
        Uses the policy type field to determine matching logic.
        """
        telemetry_metadata: Dict[str, Any] = telemetry.get("metadata", {})
        telemetry_room_id = telemetry_metadata.get("room_id")
        telemetry_rack_id = telemetry_metadata.get("rack_id")
        telemetry_object_id = telemetry_metadata.get("object_id")
        telemetry_resource_id = telemetry_metadata.get("resource_id")
        telemetry_type = telemetry.get("type")

        if telemetry_room_id != policy["room_id"]:
            return False

        policy_type = policy.get("type", "unknown")

        if policy_type == "room":
            if telemetry_rack_id is not None:
                return False

            return (
                telemetry_object_id == policy.get("object_id")
                and telemetry_resource_id == policy.get("resource_id")
                and telemetry_type == policy.get("sensor_type")
            )

        elif policy_type == "smart_object":
            return (
                telemetry_rack_id == policy.get("rack_id")
                and telemetry_object_id == policy.get("object_id")
                and telemetry_resource_id == policy.get("resource_id")
                and telemetry_type == policy.get("sensor_type")
            )

        self.logger.warning(f"Unknown policy type: {policy_type}")
        return False

    def _get_payload(self, policy: Dict[str, Any]) -> Dict[str, Any]:
        policy_type = policy.get("type", "unknown")
        if policy_type == "room":
            return {
                "object_id": policy.get("action").get("object_id"),
                "room_id": policy.get("room_id"),
                "command": policy["action"]["command"],
            }
        elif policy_type == "smart_object":
            return {
                "object_id": policy.get("object_id"),
                "rack_id": policy.get("rack_id"),
                "room_id": policy.get("room_id"),
                "command": policy["action"]["command"],
            }
        else:
            raise ValueError(
                f"Unknown policy type: {policy_type}. Cannot create payload."
            )

    def _execute_policy_action_safely(self, payload: Dict[str, Any]):
        """
        Execute policy action safely, handling async execution in a separate thread.
        """

        def run_async_action():
            try:
                asyncio.run(self._send_coap_command(payload))
            except Exception as e:
                self.logger.error(f"Error executing policy action: {e}")

        thread = threading.Thread(target=run_async_action, daemon=True)
        thread.start()

    async def _send_coap_command(self, payload: Dict[str, Any]):
        """
        Send a CoAP command to a specific actuator.
        """
        try:
            context = await Context.create_client_context()

            payload_dump = json.dumps(payload).encode("utf-8")
            request = Message(code=POST, uri=self.gateway_uri, payload=payload_dump)

            response = await context.request(request).response
            self.logger.info(
                f"CoAP Response for {payload.get('object_id')}: {response.code}"
            )

        except Exception as e:
            self.logger.error(
                f"Failed to send CoAP command to actuator {payload.get('object_id')}: {e}"
            )

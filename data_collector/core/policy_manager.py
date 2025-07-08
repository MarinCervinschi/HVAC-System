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

    def add_policy(self, policy: Dict[str, Any]):
        """
        Add a new policy to the current policies list and save to file.
        """
        try:
            # Validate required fields based on policy type
            required_fields = ["type", "room_id"]

            for field in required_fields:
                if field not in policy:
                    raise ValueError(f"Missing required field: {field}")

            # Add policy-specific required fields validation
            if policy["type"] == "smart_object":
                smart_object_fields = [
                    "rack_id",
                    "object_id",
                    "resource_id",
                    "sensor_type",
                    "condition",
                    "action",
                ]
                for field in smart_object_fields:
                    if field not in policy:
                        raise ValueError(
                            f"Missing required field for smart_object policy: {field}"
                        )
            elif policy["type"] == "room":
                room_fields = [
                    "object_id",
                    "resource_id",
                    "sensor_type",
                    "condition",
                    "action",
                ]
                for field in room_fields:
                    if field not in policy:
                        raise ValueError(f"Missing required field for room policy: {field}")

            # Validate condition structure
            if "condition" in policy:
                condition = policy["condition"]
                if (
                    not isinstance(condition, dict)
                    or "operator" not in condition
                    or "value" not in condition
                ):
                    raise ValueError(
                        "Invalid condition format. Must contain 'operator' and 'value'"
                    )

                if condition["operator"] not in self.OPERATORS:
                    raise ValueError(
                        f"Invalid operator: {condition['operator']}. Allowed: {list(self.OPERATORS.keys())}"
                    )

            # Validate action structure
            if "action" in policy:
                action = policy["action"]
                if not isinstance(action, dict) or "command" not in action:
                    raise ValueError("Invalid action format. Must contain 'command'")

            # Generate unique ID if not provided
            if "id" not in policy:
                policy["id"] = f"{policy['type']}_{policy['room_id']}_{len(self.policies)}"

            # Ensure room_id matches the policy manager's room
            if policy["room_id"] != self.room_id:
                raise ValueError(
                    f"Policy room_id {policy['room_id']} does not match PolicyManager room_id {self.room_id}"
                )

            # Add the policy to the list
            self.policies.append(policy)

            # Save policies to file
            self._save_policies_to_file()

            self.logger.info(f"Policy {policy['id']} added successfully.")
            return policy

        except Exception as e:
            self.logger.error(f"Error adding policy: {e}")
            raise

    def update_policy(self, policy_id: str, updated_policy: Dict[str, Any]):
        """
        Update an existing policy by ID.
        """
        try:
            # Find the policy to update
            policy_index = None
            for i, policy in enumerate(self.policies):
                if policy.get("id") == policy_id:
                    policy_index = i
                    break
            
            if policy_index is None:
                raise ValueError(f"Policy with ID {policy_id} not found")
            
            # Validate the updated policy structure
            required_fields = ["type", "room_id"]
            for field in required_fields:
                if field not in updated_policy:
                    raise ValueError(f"Missing required field: {field}")
            
            # Add policy-specific required fields validation
            if updated_policy["type"] == "smart_object":
                smart_object_fields = [
                    "rack_id",
                    "object_id", 
                    "resource_id",
                    "sensor_type",
                    "condition",
                    "action",
                ]
                for field in smart_object_fields:
                    if field not in updated_policy:
                        raise ValueError(
                            f"Missing required field for smart_object policy: {field}"
                        )
            elif updated_policy["type"] == "room":
                room_fields = [
                    "object_id",
                    "resource_id",
                    "sensor_type", 
                    "condition",
                    "action",
                ]
                for field in room_fields:
                    if field not in updated_policy:
                        raise ValueError(f"Missing required field for room policy: {field}")
            
            # Validate condition structure
            if "condition" in updated_policy:
                condition = updated_policy["condition"]
                if (
                    not isinstance(condition, dict)
                    or "operator" not in condition
                    or "value" not in condition
                ):
                    raise ValueError(
                        "Invalid condition format. Must contain 'operator' and 'value'"
                    )
                
                if condition["operator"] not in self.OPERATORS:
                    raise ValueError(
                        f"Invalid operator: {condition['operator']}. Allowed: {list(self.OPERATORS.keys())}"
                    )
            
            # Validate action structure
            if "action" in updated_policy:
                action = updated_policy["action"]
                if not isinstance(action, dict) or "command" not in action:
                    raise ValueError("Invalid action format. Must contain 'command'")
            
            # Ensure room_id matches the policy manager's room
            if updated_policy["room_id"] != self.room_id:
                raise ValueError(
                    f"Policy room_id {updated_policy['room_id']} does not match PolicyManager room_id {self.room_id}"
                )
            
            # Preserve the original ID
            updated_policy["id"] = policy_id
            
            # Update the policy in the list
            self.policies[policy_index] = updated_policy
            
            # Save policies to file
            self._save_policies_to_file()
            
            self.logger.info(f"Policy {policy_id} updated successfully.")
            return updated_policy
            
        except Exception as e:
            self.logger.error(f"Error updating policy {policy_id}: {e}")
            raise

    def delete_policy(self, policy_id: str):
        """
        Delete a policy by ID.
        """
        try:
            # Find the policy to delete
            policy_index = None
            for i, policy in enumerate(self.policies):
                if policy.get("id") == policy_id:
                    policy_index = i
                    break
            
            if policy_index is None:
                raise ValueError(f"Policy with ID {policy_id} not found")
            
            # Remove the policy from the list
            deleted_policy = self.policies.pop(policy_index)
            
            # Save policies to file
            self._save_policies_to_file()
            
            self.logger.info(f"Policy {policy_id} deleted successfully.")
            return deleted_policy
            
        except Exception as e:
            self.logger.error(f"Error deleting policy {policy_id}: {e}")
            raise

    def _save_policies_to_file(self):
        """
        Save current policies to the policy file, preserving other rooms' policies.
        """
        try:
            # Load existing data
            existing_data = {"rooms": {}}
            try:
                with open(self.policy_file_path, "r") as file:
                    existing_data = json.load(file)
            except FileNotFoundError:
                self.logger.info(
                    f"Policy file not found, creating new one: {self.policy_file_path}"
                )
            except json.JSONDecodeError:
                self.logger.warning(
                    f"Invalid JSON in policy file, creating new structure"
                )

            # Update only this room's policies
            if "rooms" not in existing_data:
                existing_data["rooms"] = {}

            existing_data["rooms"][self.room_id] = self.policies

            # Save back to file
            with open(self.policy_file_path, "w") as file:
                json.dump(existing_data, file, indent=2)

            self.logger.info(f"Policies saved to file for room {self.room_id}")

        except Exception as e:
            self.logger.error(f"Error saving policies to file: {e}")
            raise

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

from flask import request
from flask_restful import Resource
from data_collector.core.policy_manager import PolicyManager
from data_collector.models.Room import Room
from data_collector.core.manager import HVACSystemManager

POLICY_PATH = "data_collector/conf/policy.json"
# policy_manager = PolicyManager(None, POLICY_PATH)


class PolicyUpdateAPI(Resource):
    def __init__(self, **kwargs):
        self.system_manager: HVACSystemManager = kwargs.get("system_manager")

    def post(self):
        try:
            new_policies = request.get_json(force=True).get("policies", [])
            # policy_manager.update_policies(new_policies)
            return {"status": "success", "message": "Policies updated"}, 200
        except Exception as e:
            return {"status": "error", "message": str(e)}, 500


class PolicyRoomAPI(Resource):
    def __init__(self, **kwargs):
        self.system_manager: HVACSystemManager = kwargs.get("system_manager")

    def get(self, room_id: str):
        try:
            if not self.system_manager:
                return {"error": "System manager not available"}, 500

            room = self.system_manager.get_room_by_id(room_id)
            if not room:
                return {"error": f"Room {room_id} not found"}, 404

            policies = self.system_manager.data_collectors.get(
                room_id
            ).policy_manager.policies
            data = []
            for policy in policies:
                if policy["type"] == "room":
                    data.append(policy)

            return {"status": "success", "policies": data}, 200
        except Exception as e:
            return {"status": "error", "message": str(e)}, 500

    def post(self, room_id: str):
        try:
            if not self.system_manager:
                return {"error": "System manager not available"}, 500

            room = self.system_manager.get_room_by_id(room_id)
            if not room:
                return {"error": f"Room {room_id} not found"}, 404

            data = request.get_json(force=True)
            if not data:
                return {"error": "Invalid data"}, 400

            # Validate required fields for room policy
            required_fields = ["object_id", "resource_id", "sensor_type", "condition", "action"]
            for field in required_fields:
                if field not in data:
                    return {"error": f"Missing required field: {field}"}, 400

            # Validate condition structure
            if "condition" not in data or not isinstance(data["condition"], dict):
                return {"error": "Invalid condition format"}, 400
            
            condition = data["condition"]
            if "operator" not in condition or "value" not in condition:
                return {"error": "Condition must contain 'operator' and 'value'"}, 400

            allowed_operators = [">", "<", "==", ">=", "<=", "!="]
            if condition["operator"] not in allowed_operators:
                return {"error": f"Invalid operator. Allowed: {allowed_operators}"}, 400

            # Validate action structure
            if "action" not in data or not isinstance(data["action"], dict):
                return {"error": "Invalid action format"}, 400
            
            action = data["action"]
            if "command" not in action:
                return {"error": "Action must contain 'command'"}, 400

            # Create a new room policy with proper structure
            policy = {
                "type": "room",
                "room_id": room_id,
                "object_id": data["object_id"],
                "resource_id": data["resource_id"],
                "sensor_type": data["sensor_type"],
                "condition": data["condition"],
                "action": data["action"]
            }

            # Add optional fields if provided
            if "description" in data:
                policy["description"] = data["description"]
            if "id" in data:
                policy["id"] = data["id"]

            # Add policy through policy manager
            policy_manager = self.system_manager.data_collectors.get(room_id).policy_manager
            created_policy = policy_manager.add_policy(policy)

            return {"status": "success", "policy": created_policy}, 201

        except ValueError as ve:
            return {"status": "error", "message": str(ve)}, 400
        except Exception as e:
            return {"status": "error", "message": str(e)}, 500

    def put(self, room_id: str):
        try:
            if not self.system_manager:
                return {"error": "System manager not available"}, 500

            room = self.system_manager.get_room_by_id(room_id)
            if not room:
                return {"error": f"Room {room_id} not found"}, 404

            data = request.get_json(force=True)
            if not data:
                return {"error": "Invalid data"}, 400

            # Get policy ID from request data
            if "id" not in data:
                return {"error": "Policy ID is required for update"}, 400

            policy_id = data["id"]

            # Validate required fields for room policy
            required_fields = ["object_id", "resource_id", "sensor_type", "condition", "action"]
            for field in required_fields:
                if field not in data:
                    return {"error": f"Missing required field: {field}"}, 400

            # Validate condition structure
            if "condition" not in data or not isinstance(data["condition"], dict):
                return {"error": "Invalid condition format"}, 400
            
            condition = data["condition"]
            if "operator" not in condition or "value" not in condition:
                return {"error": "Condition must contain 'operator' and 'value'"}, 400

            allowed_operators = [">", "<", "==", ">=", "<=", "!="]
            if condition["operator"] not in allowed_operators:
                return {"error": f"Invalid operator. Allowed: {allowed_operators}"}, 400

            # Validate action structure
            if "action" not in data or not isinstance(data["action"], dict):
                return {"error": "Invalid action format"}, 400
            
            action = data["action"]
            if "command" not in action:
                return {"error": "Action must contain 'command'"}, 400

            # Create the updated room policy with proper structure
            updated_policy = {
                "id": policy_id,
                "type": "room",
                "room_id": room_id,
                "object_id": data["object_id"],
                "resource_id": data["resource_id"],
                "sensor_type": data["sensor_type"],
                "condition": data["condition"],
                "action": data["action"]
            }

            # Add optional fields if provided
            if "description" in data:
                updated_policy["description"] = data["description"]

            # Update policy through policy manager
            policy_manager = self.system_manager.data_collectors.get(room_id).policy_manager
            result_policy = policy_manager.update_policy(policy_id, updated_policy)

            return {"status": "success", "policy": result_policy}, 200

        except ValueError as ve:
            return {"status": "error", "message": str(ve)}, 400
        except Exception as e:
            return {"status": "error", "message": str(e)}, 500

    def delete(self, room_id: str):
        try:
            if not self.system_manager:
                return {"error": "System manager not available"}, 500

            room = self.system_manager.get_room_by_id(room_id)
            if not room:
                return {"error": f"Room {room_id} not found"}, 404

            # Get policy ID from query parameters or request data
            policy_id = request.args.get('id')
            if not policy_id:
                data = request.get_json(silent=True)
                if data and "id" in data:
                    policy_id = data["id"]
            
            if not policy_id:
                return {"error": "Policy ID is required for deletion"}, 400

            # Delete policy through policy manager
            policy_manager = self.system_manager.data_collectors.get(room_id).policy_manager
            deleted_policy = policy_manager.delete_policy(policy_id)

            return {"status": "success", "message": f"Policy {policy_id} deleted successfully", "deleted_policy": deleted_policy}, 200

        except ValueError as ve:
            return {"status": "error", "message": str(ve)}, 400
        except Exception as e:
            return {"status": "error", "message": str(e)}, 500


class PolicyRackAPI(Resource):
    def __init__(self, **kwargs):
        self.system_manager: HVACSystemManager = kwargs.get("system_manager")

    def get(self, room_id: str, rack_id: str, object_id: str):
        try:
            if not self.system_manager:
                return {"error": "System manager not available"}, 500

            room = self.system_manager.get_room_by_id(room_id)
            if not room:
                return {"error": f"Room {room_id} not found"}, 404

            rack = room.get_rack(rack_id)
            if not rack:
                return {"error": f"Rack {rack_id} not found in room {room_id}"}, 404

            policies = self.system_manager.data_collectors.get(
                room_id
            ).policy_manager.policies

            data = []
            for policy in policies:
                if (
                    policy["type"] == "smart_object"
                    and policy["rack_id"] == rack_id
                    and policy["object_id"] == object_id
                ):
                    data.append(policy)

            return {"status": "success", "policies": data}, 200
        except Exception as e:
            return {"status": "error", "message": str(e)}, 500

    def post(self, room_id: str, rack_id: str, object_id: str):
        try:
            if not self.system_manager:
                return {"error": "System manager not available"}, 500

            room = self.system_manager.get_room_by_id(room_id)
            if not room:
                return {"error": f"Room {room_id} not found"}, 404

            rack = room.get_rack(rack_id)
            if not rack:
                return {"error": f"Rack {rack_id} not found in room {room_id}"}, 404

            data = request.get_json(force=True)
            if not data:
                return {"error": "Invalid data"}, 400

            # Validate required fields for smart_object policy
            required_fields = ["resource_id", "sensor_type", "condition", "action"]
            for field in required_fields:
                if field not in data:
                    return {"error": f"Missing required field: {field}"}, 400

            # Validate condition structure
            if "condition" not in data or not isinstance(data["condition"], dict):
                return {"error": "Invalid condition format"}, 400
            
            condition = data["condition"]
            if "operator" not in condition or "value" not in condition:
                return {"error": "Condition must contain 'operator' and 'value'"}, 400

            allowed_operators = [">", "<", "==", ">=", "<=", "!="]
            if condition["operator"] not in allowed_operators:
                return {"error": f"Invalid operator. Allowed: {allowed_operators}"}, 400

            # Validate action structure
            if "action" not in data or not isinstance(data["action"], dict):
                return {"error": "Invalid action format"}, 400
            
            action = data["action"]
            if "command" not in action:
                return {"error": "Action must contain 'command'"}, 400

            # Create a new policy with proper structure
            policy = {
                "type": "smart_object",
                "room_id": room_id,
                "rack_id": rack_id,
                "object_id": object_id,
                "resource_id": data["resource_id"],
                "sensor_type": data["sensor_type"],
                "condition": data["condition"],
                "action": data["action"]
            }

            # Add optional fields if provided
            if "description" in data:
                policy["description"] = data["description"]
            if "id" in data:
                policy["id"] = data["id"]

            # Add policy through policy manager
            policy_manager = self.system_manager.data_collectors.get(room_id).policy_manager
            created_policy = policy_manager.add_policy(policy)

            return {"status": "success", "policy": created_policy}, 201

        except ValueError as ve:
            return {"status": "error", "message": str(ve)}, 400
        except Exception as e:
            return {"status": "error", "message": str(e)}, 500

    def put(self, room_id: str, rack_id: str, object_id: str):
        try:
            if not self.system_manager:
                return {"error": "System manager not available"}, 500

            room = self.system_manager.get_room_by_id(room_id)
            if not room:
                return {"error": f"Room {room_id} not found"}, 404

            rack = room.get_rack(rack_id)
            if not rack:
                return {"error": f"Rack {rack_id} not found in room {room_id}"}, 404

            data = request.get_json(force=True)
            if not data:
                return {"error": "Invalid data"}, 400

            # Get policy ID from request data
            if "id" not in data:
                return {"error": "Policy ID is required for update"}, 400

            policy_id = data["id"]

            # Validate required fields for smart_object policy
            required_fields = ["resource_id", "sensor_type", "condition", "action"]
            for field in required_fields:
                if field not in data:
                    return {"error": f"Missing required field: {field}"}, 400

            # Validate condition structure
            if "condition" not in data or not isinstance(data["condition"], dict):
                return {"error": "Invalid condition format"}, 400
            
            condition = data["condition"]
            if "operator" not in condition or "value" not in condition:
                return {"error": "Condition must contain 'operator' and 'value'"}, 400

            allowed_operators = [">", "<", "==", ">=", "<=", "!="]
            if condition["operator"] not in allowed_operators:
                return {"error": f"Invalid operator. Allowed: {allowed_operators}"}, 400

            # Validate action structure
            if "action" not in data or not isinstance(data["action"], dict):
                return {"error": "Invalid action format"}, 400
            
            action = data["action"]
            if "command" not in action:
                return {"error": "Action must contain 'command'"}, 400

            # Create the updated policy with proper structure
            updated_policy = {
                "id": policy_id,
                "type": "smart_object",
                "room_id": room_id,
                "rack_id": rack_id,
                "object_id": object_id,
                "resource_id": data["resource_id"],
                "sensor_type": data["sensor_type"],
                "condition": data["condition"],
                "action": data["action"]
            }

            # Add optional fields if provided
            if "description" in data:
                updated_policy["description"] = data["description"]

            # Update policy through policy manager
            policy_manager = self.system_manager.data_collectors.get(room_id).policy_manager
            result_policy = policy_manager.update_policy(policy_id, updated_policy)

            return {"status": "success", "policy": result_policy}, 200

        except ValueError as ve:
            return {"status": "error", "message": str(ve)}, 400
        except Exception as e:
            return {"status": "error", "message": str(e)}, 500

    def delete(self, room_id: str, rack_id: str, object_id: str):
        try:
            if not self.system_manager:
                return {"error": "System manager not available"}, 500

            room = self.system_manager.get_room_by_id(room_id)
            if not room:
                return {"error": f"Room {room_id} not found"}, 404

            rack = room.get_rack(rack_id)
            if not rack:
                return {"error": f"Rack {rack_id} not found in room {room_id}"}, 404

            # Get policy ID from query parameters or request data
            policy_id = request.args.get('id')
            if not policy_id:
                data = request.get_json(silent=True)
                if data and "id" in data:
                    policy_id = data["id"]
            
            if not policy_id:
                return {"error": "Policy ID is required for deletion"}, 400

            # Delete policy through policy manager
            policy_manager = self.system_manager.data_collectors.get(room_id).policy_manager
            deleted_policy = policy_manager.delete_policy(policy_id)

            return {"status": "success", "message": f"Policy {policy_id} deleted successfully", "deleted_policy": deleted_policy}, 200

        except ValueError as ve:
            return {"status": "error", "message": str(ve)}, 400
        except Exception as e:
            return {"status": "error", "message": str(e)}, 500
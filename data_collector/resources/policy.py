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

from flask import request
from flask_restful import Resource
from data_collector.core.policy_manager import PolicyManager
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

            return {"status": "success", "policies": policies}, 200
        except Exception as e:
            return {"status": "error", "message": str(e)}, 500

from flask import request
from flask_restful import Resource
from core.policy_manager import PolicyManager 

POLICY_PATH = "config/policy.json"
policy_manager = PolicyManager(POLICY_PATH)

class PolicyUpdateAPI(Resource):
    def post(self):
        try:
            new_policies = request.get_json(force=True).get("policies", [])
            policy_manager.update_policies(new_policies)
            return {"status": "success", "message": "Policies updated"}, 200
        except Exception as e:
            return {"status": "error", "message": str(e)}, 500

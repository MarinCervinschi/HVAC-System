from flask import request
from flask_restful import Resource
from data_collector.core.policy_manager import PolicyManager
from data_collector.core.manager import HVACSystemManager

POLICY_PATH = "data_collector/conf/policy.json"
#policy_manager = PolicyManager(None, POLICY_PATH)


class PolicyUpdateAPI(Resource):
    def __init__(self, **kwargs):
        self.system_manager: HVACSystemManager = kwargs.get("system_manager")

    def post(self):
        try:
            new_policies = request.get_json(force=True).get("policies", [])
            #policy_manager.update_policies(new_policies)
            return {"status": "success", "message": "Policies updated"}, 200
        except Exception as e:
            return {"status": "error", "message": str(e)}, 500

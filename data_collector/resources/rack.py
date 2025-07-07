from flask import request
from flask_restful import Resource
from typing import Dict, Any, Optional
from data_collector.models.Rack import Rack
from data_collector.models.Room import Room
from data_collector.core.manager import HVACSystemManager


class RackDetailAPI(Resource):
    def __init__(self, **kwargs):
        self.system_manager: HVACSystemManager = kwargs.get("system_manager")

    def get(self, room_id: str, rack_id: str) -> tuple[Dict[str, Any], int]:
        if not self.system_manager:
            return {"error": "System manager not available"}, 500

        room: Optional[Room] = self.system_manager.get_room_by_id(room_id)
        if not room:
            return {"error": f"Room {room_id} not found"}, 404

        rack: Optional[Rack] = room.get_rack(rack_id)
        if not rack:
            return {"error": f"Rack {rack_id} not found in room {room_id}"}, 404

        data: Dict[str, Any] = rack.to_dict()
        data["room_id"] = room_id
        data["smart_objects"] = [
            smart_object.to_dict() for smart_object in rack.smart_objects.values()
        ]
        return {"status": "success", "rack": data}, 200

    def post(self, room_id: str, rack_id: str) -> tuple[Dict[str, Any], int]:
        if not self.system_manager:
            return {"error": "System manager not available"}, 500

        room: Optional[Room] = self.system_manager.get_room_by_id(room_id)
        if not room:
            return {"error": f"Room {room_id} not found"}, 404

        rack: Optional[Rack] = room.get_rack(rack_id)
        if not rack:
            return {"error": f"Rack {rack_id} not found in room {room_id}"}, 404

        json_data = request.get_json(force=True)
        status = json_data.get("status")
        if status not in ("ON", "OFF"):
            return {"error": "Invalid status value. Must be 'ON' or 'OFF'."}, 400

        try:
            rack.apply_command(status)
        except ValueError as ve:
            return {"error": str(ve)}, 400
        except RuntimeError as re:
            return {"error": str(re)}, 500
        except AttributeError:
            return {"error": "Rack object does not support status update."}, 500

        message = f"Rack {rack_id} in room {room_id} has been turned {status}."
        return {"status": "success", "message": message}, 200

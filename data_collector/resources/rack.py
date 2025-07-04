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
        return {"status": "success", "rack": data}, 200

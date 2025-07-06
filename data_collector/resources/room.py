from typing import Any, Dict, Optional, Tuple
from flask_restful import Resource
from data_collector.models.Room import Room
from data_collector.core.manager import HVACSystemManager


class RoomListAPI(Resource):

    def __init__(self, **kwargs):
        self.system_manager: HVACSystemManager = kwargs.get("system_manager")

    def get(self) -> Tuple[Dict[str, Any], int]:

        if not self.system_manager:
            return {"error": "System manager not available"}, 500

        rooms: Dict[str, Room] = self.system_manager.rooms
        data: Dict[str, str] = [room.to_dict(title_format=True) for room in rooms.values()]

        return {"status": "success", "rooms": data}, 200


class RoomDetailAPI(Resource):
    def __init__(self, **kwargs):
        self.system_manager: HVACSystemManager = kwargs.get("system_manager")

    def get(self, room_id: str) -> Tuple[Dict[str, Any], int]:

        if not self.system_manager:
            return {"error": "System manager not available"}, 500

        room: Optional[Room] = self.system_manager.get_room_by_id(room_id)

        if not room:
            return {"error": f"Room {room_id} not found"}, 404

        data: Dict[str, Any] = room.to_dict()
        return {"status": "success", "room": data}, 200

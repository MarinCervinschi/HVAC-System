from typing import Any, Dict, Optional, Set, Tuple
from flask_restful import Resource
from data_collector.app import get_system_manager
from data_collector.models.Room import Room


class RoomListAPI(Resource):
    def get(self) -> Tuple[Dict[str, Any], int]:
        manager = get_system_manager()

        if not manager:
            return {"error": "System manager not available"}, 500
        rooms = manager.rooms
        data: Set[Dict[str, Any]] = {room.to_dict() for room in rooms.values()}
        return {"status": "success", "rooms": data}, 200


class RoomDetailAPI(Resource):
    def get(self, room_id: str) -> Tuple[Dict[str, Any], int]:
        manager = get_system_manager()

        if not manager:
            return {"error": "System manager not available"}, 500

        room: Optional[Room] = manager.get_room_by_id(room_id)

        if not room:
            return {"error": f"Room {room_id} not found"}, 404

        data: Dict[str, Any] = room.to_dict()
        return {"status": "success", "room": data}, 200

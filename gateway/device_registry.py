import json
from pathlib import Path
from collections import defaultdict
from typing import Dict, List, Any, Optional

REGISTRY_FILE = Path("gateway/registry.json")


class DeviceRegistry:
    def __init__(self):
        self.registry: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
        # self._load_registry()

    def add_resource(
        self, host: str, port: int, path: str, attributes: Dict[str, Any]
    ) -> None:
        self.registry[host].append(
            {"port": port, "path": path, "attributes": attributes}
        )
        self._save_registry()

    def get_all(self) -> Dict[str, List[Dict[str, Any]]]:
        return self.registry

    def get_resource_uri(
        self, object_id: Any, room_id: Any, rack_id: Any
    ) -> Optional[str]:
        """
        Returns the URI of a resource matching the given object_id, room_id, and rack_id.
        """
        for host, resources in self.registry.items():
            for res in resources:
                if (
                    res["attributes"].get("object_id") == object_id
                    and res["attributes"].get("room_id") == room_id
                    and res["attributes"].get("rack_id") == rack_id
                ):
                    return f"coap://{host}:{res['port']}/{res['path']}"
        return None

    def _save_registry(self) -> None:
        with open(REGISTRY_FILE, "w") as f:
            json.dump(self.registry, f, indent=2)

    def _load_registry(self) -> None:
        if REGISTRY_FILE.exists():
            with open(REGISTRY_FILE, "r") as f:
                try:
                    data = json.load(f)
                except json.JSONDecodeError:
                    data = {}
                for host, resources in data.items():
                    self.registry[host] = resources

    def print_registry(self) -> None:
        for host, resources in self.registry.items():
            print(f"📡 {host}")
            for res in resources:
                print(f"  ↳ /{res['path']} ({res['attributes']})")

import json
from pathlib import Path
from collections import defaultdict

REGISTRY_FILE = Path("gateway/registry.json")


class DeviceRegistry:
    def __init__(self):
        self.registry = defaultdict(list)
        self._load_registry()

    def add_resource(self, host, port, path, attributes):
        self.registry[host].append(
            {"port": port, "path": path, "attributes": attributes}
        )
        self._save_registry()

    def get_all(self):
        return self.registry

    def _save_registry(self):
        with open(REGISTRY_FILE, "w") as f:
            json.dump(self.registry, f, indent=2)

    def _load_registry(self):
        if REGISTRY_FILE.exists():
            with open(REGISTRY_FILE, "r") as f:
                data = json.load(f)
                for host, resources in data.items():
                    self.registry[host] = resources

    def print_registry(self):
        for host, resources in self.registry.items():
            print(f"📡 {host}")
            for res in resources:
                print(f"  ↳ /{res['path']} ({res['attributes']})")

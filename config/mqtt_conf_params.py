from typing import ClassVar


class MqttConfigurationParameters(object):
    BROKER_ADDRESS: ClassVar[str] = "mqtt-broker"
    BROKER_PORT: ClassVar[int] = 1883
    BASIC_TOPIC: ClassVar[str] = "hvac/room"
    RACK_TOPIC: ClassVar[str] = "rack"
    DEVICE_TOPIC: ClassVar[str] = "device"
    TELEMETRY_TOPIC: ClassVar[str] = "telemetry"
    EVENT_TOPIC: ClassVar[str] = "event"
    CONTROL_TOPIC: ClassVar[str] = "control"

    @staticmethod
    def build_telemetry_room_topic(
        room_id: str, device_id: str, resource_id: str
    ) -> str:
        """Build the telemetry topic for a specific room and device.
        e.g., hvac/room/{room_id}/device/{device_id}/telemetry/{resource_id}
        """
        return "{0}/{1}/{2}/{3}/{4}/{5}".format(
            MqttConfigurationParameters.BASIC_TOPIC,
            room_id,
            MqttConfigurationParameters.DEVICE_TOPIC,
            device_id,
            MqttConfigurationParameters.TELEMETRY_TOPIC,
            resource_id,
        )

    @staticmethod
    def build_control_room_topic(room_id: str, device_id: str, resource_id: str) -> str:
        """Build the control topic for a specific room and device.
        e.g., hvac/room/{room_id}/device/{device_id}/control/{resource_id}
        """
        return "{0}/{1}/{2}/{3}/{4}/{5}".format(
            MqttConfigurationParameters.BASIC_TOPIC,
            room_id,
            MqttConfigurationParameters.DEVICE_TOPIC,
            device_id,
            MqttConfigurationParameters.CONTROL_TOPIC,
            resource_id,
        )

    @staticmethod
    def build_telemetry_rack_topic(
        room_id: str, rack_id: str, device_id: str, resource_id: str
    ) -> str:
        """Build the telemetry topic for a specific room and rack.
        e.g., hvac/room/{room_id}/rack/{rack_id}/device/{device_id}/telemetry/{resource_id}
        """
        return "{0}/{1}/{2}/{3}/{4}/{5}/{6}/{7}".format(
            MqttConfigurationParameters.BASIC_TOPIC,
            room_id,
            MqttConfigurationParameters.RACK_TOPIC,
            rack_id,
            MqttConfigurationParameters.DEVICE_TOPIC,
            device_id,
            MqttConfigurationParameters.TELEMETRY_TOPIC,
            resource_id,
        )

    @staticmethod
    def build_control_rack_topic(
        room_id: str, rack_id: str, device_id: str, resource_id: str
    ) -> str:
        """Build the control topic for a specific room and rack.
        e.g., hvac/room/{room_id}/rack/{rack_id}/device/{device_id}/control/{resource_id}
        """
        return "{0}/{1}/{2}/{3}/{4}/{5}/{6}/{7}".format(
            MqttConfigurationParameters.BASIC_TOPIC,
            room_id,
            MqttConfigurationParameters.RACK_TOPIC,
            rack_id,
            MqttConfigurationParameters.DEVICE_TOPIC,
            device_id,
            MqttConfigurationParameters.CONTROL_TOPIC,
            resource_id,
        )

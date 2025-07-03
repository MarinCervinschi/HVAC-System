from typing import ClassVar

class MqttConfigurationParameters(object):
    BROKER_ADDRESS: ClassVar[str] = "127.0.0.1"
    BROKER_PORT: ClassVar[int] = 7883
    BASIC_TOPIC: ClassVar[str] = "hvac/room"
    RACK_TOPIC: ClassVar[str] = "rack"
    DEVICE_TOPIC: ClassVar[str] = "device"
    TELEMETRY_TOPIC: ClassVar[str] = "telemetry"
    EVENT_TOPIC: ClassVar[str] = "event"
    CONTROL_TOPIC: ClassVar[str] = "control"

    """
        Example of topics:
        Publish telemetry for temperature, humidity, pression and energy consumption
        to the MQTT broker with the following topics:
        hvac/room/#/telemetry/temperature
        hvac/room/+/telemetry/humidity
        hvac/room/+/rack/+/telemetry/pression
        hvac/room/+/rack/+/telemetry/energy
        Publish control commands to the MQTT broker with the following topics:
        hvac/room/+/rack/+/control/speed -> notify change speed of the fan
        hvac/room/+/rack/+/control/pumps -> notify change pumps status
        hvac/room/+/aisle/+/control/airflow -> notify change airflow
        hvac/room/+/rack/+/control/energy -> notify change energy consumption
        hvac/room/+/control/coolinghub -> notify change cooling hub status or level
        Notify events to the MQTT broker with the following topics:
        hvac/room/#/event/+
        notify events like alarms, warnings, or other significant events

    """

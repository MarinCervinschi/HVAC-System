from smart_objects.devices.rack_cooling_unit import RackCoolingUnit
import paho.mqtt.client as mqtt
from config.mqtt_conf_params import MqttConfigurationParameters
import logging

# Configurazione del logging
logging.basicConfig(level=logging.INFO)


def run():
    try:
        object_id = "rack_cooling_unit"
        room_id = "room_001"
        rack_id = "rack_001"
        mqtt_client = mqtt.Client(object_id)
        mqtt_client.connect(
            MqttConfigurationParameters.BROKER_ADDRESS,
            MqttConfigurationParameters.BROKER_PORT,
        )

        rack_cooling_unit = RackCoolingUnit(
            object_id=object_id,
            room_id=room_id,
            rack_id=rack_id,
            mqtt_client=mqtt_client,
        )

        rack_cooling_unit.start()
        mqtt_client.loop_start()

    except Exception as e:
        print(f"An error occurred while running the rack cooling unit process: {e}")


if __name__ == "__main__":
    run()

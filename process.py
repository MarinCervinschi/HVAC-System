from smart_objects.devices.rack_cooling_unit import RackCoolingUnit
import paho.mqtt.client as mqtt
from config.mqtt_conf_params import MqttConfigurationParameters
import logging

# Configurazione del logging
logging.basicConfig(level=logging.INFO)

def run():
    try:
        object_id = f"RACK-COOLING-UNIT-001"
        location = "Server Room A"
        mqtt_client = mqtt.Client(object_id)
        mqtt_client.connect(
            MqttConfigurationParameters.BROKER_ADDRESS,
            MqttConfigurationParameters.BROKER_PORT,
        )

        rack_cooling_unit = RackCoolingUnit(
            object_id=object_id, location=location, mqtt_client=mqtt_client
        )

        rack_cooling_unit.start()
        mqtt_client.loop_start()

    except Exception as e:
        print(f"An error occurred while running the rack cooling unit process: {e}")


if __name__ == "__main__":
    run()

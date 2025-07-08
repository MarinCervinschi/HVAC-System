"""
HVAC System Smart Objects Test Process

This module provides test functions for all Smart Objects in the HVAC system:
- RackCoolingUnit: Controls rack cooling with temperature sensors and fan actuators
- WaterLoopController: Manages water loop with pressure sensors and pump actuators  
- AirflowManager: Controls airflow with airspeed sensors and cooling level actuators
- CoolingSystemHub: Central cooling control with cooling level actuators
- EnergyMeteringUnit: Monitors energy with energy sensors and switch actuators
- EnvironmentMonitor: Monitors environment with temperature and humidity sensors

Usage:
    python process.py  # Runs the default Smart Object (rack_cooling_unit)
    
    # Modify the run() function to:
    # - Test individual Smart Objects
    # - Run all Smart Objects simultaneously
    # - Run specific Smart Objects by name
"""

from smart_objects.devices.rack_cooling_unit import RackCoolingUnit
from smart_objects.devices.airflow_manager import AirflowManager
from smart_objects.devices.cooling_system_hub import CoolingSystemHub
from smart_objects.devices.energy_metering_unit import EnergyMeteringUnit
from smart_objects.devices.environment_monitor import EnvironmentMonitor
from smart_objects.devices.water_loop_controller import WaterLoopController
import paho.mqtt.client as mqtt
from config.mqtt_conf_params import MqttConfigurationParameters
import logging

# Configurazione del logging
logging.basicConfig(level=logging.INFO)

def water_loop_controller_test():
    try:
        object_id = "water_loop_controller"
        room_id = "room_001"
        rack_id = "rack_001"
        mqtt_client = mqtt.Client(client_id=object_id, callback_api_version=mqtt.CallbackAPIVersion.VERSION1)
        mqtt_client.connect(
            MqttConfigurationParameters.BROKER_ADDRESS,
            MqttConfigurationParameters.BROKER_PORT,
        )

        water_loop_controller = WaterLoopController(
            room_id=room_id,
            rack_id=rack_id,
            mqtt_client=mqtt_client,
        )

        water_loop_controller.start()
        mqtt_client.loop_start()

    except Exception as e:
        print(f"An error occurred while running the water loop controller process: {e}")


def rack_cooling_unit_test():
    try:
        object_id = "rack_cooling_unit"
        room_id = "room_001"
        rack_id = "rack_001"
        mqtt_client = mqtt.Client(client_id=object_id, callback_api_version=mqtt.CallbackAPIVersion.VERSION1)
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


def airflow_manager_test():
    try:
        object_id = "airflow_manager"
        room_id = "room_001"
        rack_id = "rack_001"
        mqtt_client = mqtt.Client(client_id=object_id, callback_api_version=mqtt.CallbackAPIVersion.VERSION1)
        mqtt_client.connect(
            MqttConfigurationParameters.BROKER_ADDRESS,
            MqttConfigurationParameters.BROKER_PORT,
        )

        airflow_manager = AirflowManager(
            room_id=room_id,
            rack_id=rack_id,
            mqtt_client=mqtt_client,
        )

        airflow_manager.start()
        mqtt_client.loop_start()

    except Exception as e:
        print(f"An error occurred while running the airflow manager process: {e}")


def cooling_system_hub_test():
    try:
        object_id = "cooling_system_hub"
        room_id = "room_001"
        rack_id = "rack_001"
        mqtt_client = mqtt.Client(client_id=object_id, callback_api_version=mqtt.CallbackAPIVersion.VERSION1)
        mqtt_client.connect(
            MqttConfigurationParameters.BROKER_ADDRESS,
            MqttConfigurationParameters.BROKER_PORT,
        )

        cooling_system_hub = CoolingSystemHub(
            room_id=room_id,
            rack_id=rack_id,
            mqtt_client=mqtt_client,
        )

        cooling_system_hub.start()
        mqtt_client.loop_start()

    except Exception as e:
        print(f"An error occurred while running the cooling system hub process: {e}")


def energy_metering_unit_test():
    try:
        object_id = "energy_metering_unit"
        room_id = "room_001"
        rack_id = "rack_001"
        mqtt_client = mqtt.Client(client_id=object_id, callback_api_version=mqtt.CallbackAPIVersion.VERSION1)
        mqtt_client.connect(
            MqttConfigurationParameters.BROKER_ADDRESS,
            MqttConfigurationParameters.BROKER_PORT,
        )

        energy_metering_unit = EnergyMeteringUnit(
            room_id=room_id,
            rack_id=rack_id,
            mqtt_client=mqtt_client,
        )

        energy_metering_unit.start()
        mqtt_client.loop_start()

    except Exception as e:
        print(f"An error occurred while running the energy metering unit process: {e}")


def environment_monitor_test():
    try:
        object_id = "environment_monitor"
        room_id = "room_001"
        rack_id = "rack_001"
        mqtt_client = mqtt.Client(client_id=object_id, callback_api_version=mqtt.CallbackAPIVersion.VERSION1)
        mqtt_client.connect(
            MqttConfigurationParameters.BROKER_ADDRESS,
            MqttConfigurationParameters.BROKER_PORT,
        )

        environment_monitor = EnvironmentMonitor(
            room_id=room_id,
            rack_id=rack_id,
            mqtt_client=mqtt_client,
        )

        environment_monitor.start()
        mqtt_client.loop_start()

    except Exception as e:
        print(f"An error occurred while running the environment monitor process: {e}")


def run():
    """
    Main function to run Smart Object tests.
    You can choose between:
    1. Running a single Smart Object
    2. Running all Smart Objects simultaneously
    3. Running specific Smart Object by name
    """
    print("HVAC System Smart Objects Test")
    print("===============================")
    print("Available options:")
    print("1. Run single Smart Object (default: rack_cooling_unit)")
    print("2. Run all Smart Objects simultaneously")
    print("3. Run specific Smart Object by name")
    print()
    
    # Option 1: Run a single Smart Object (default)
    #rack_cooling_unit_test()
    
    # Option 2: To run all Smart Objects simultaneously, uncomment this line:
    run_all_smart_objects()
    
    # Option 3: To run a specific Smart Object, uncomment and modify this line:
    #run_specific_smart_object("environment_monitor")  # Change to desired object name


def run_all_smart_objects():
    """
    Function to run all Smart Objects simultaneously.
    Each Smart Object will run in its own thread.
    """
    import threading
    
    # List of all test functions
    test_functions = [
        rack_cooling_unit_test,
        water_loop_controller_test,
        airflow_manager_test,
        cooling_system_hub_test,
        energy_metering_unit_test,
        environment_monitor_test
    ]
    
    threads = []
    
    try:
        # Start each Smart Object in its own thread
        for test_func in test_functions:
            thread = threading.Thread(target=test_func, daemon=True)
            thread.start()
            threads.append(thread)
            print(f"Started {test_func.__name__}")
        
        print("All Smart Objects started successfully!")
        
        # Keep the main thread alive
        while True:
            import time
            time.sleep(1)
            
    except KeyboardInterrupt:
        print("Process interrupted by user")
    except Exception as e:
        print(f"An error occurred while running all Smart Objects: {e}")


def run_specific_smart_object(object_name: str):
    """
    Run a specific Smart Object by name.
    
    Args:
        object_name: Name of the Smart Object to run
                    ("rack_cooling_unit", "water_loop_controller", "airflow_manager", 
                     "cooling_system_hub", "energy_metering_unit", "environment_monitor")
    """
    object_functions = {
        "rack_cooling_unit": rack_cooling_unit_test,
        "water_loop_controller": water_loop_controller_test,
        "airflow_manager": airflow_manager_test,
        "cooling_system_hub": cooling_system_hub_test,
        "energy_metering_unit": energy_metering_unit_test,
        "environment_monitor": environment_monitor_test
    }
    
    if object_name in object_functions:
        try:
            print(f"Starting {object_name}...")
            object_functions[object_name]()
            
            # Keep the main thread alive
            while True:
                import time
                time.sleep(1)
                
        except KeyboardInterrupt:
            print(f"Process interrupted by user for {object_name}")
        except Exception as e:
            print(f"An error occurred while running {object_name}: {e}")
    else:
        print(f"Unknown Smart Object: {object_name}")
        print("Available Smart Objects:", list(object_functions.keys()))


if __name__ == "__main__":
    run()

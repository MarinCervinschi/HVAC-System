# HVAC-System


```
hvac_project/
│
├── docker-compose.yml
├── .env
│
├── gateway/                      # Gateway MQTT/HTTP/CoAP
│   ├── Dockerfile
│   └── main.py
│
├── collector/                    # Data Collector/Manager
│   ├── Dockerfile
│   ├── main.py
│   └── policies/
│       └── policy_config.json
│
├── dashboard/                    # UI e API Flask per l’operatore
│   ├── Dockerfile
│   ├── app.py
│   ├── templates/
│   └── static/
│
├── cloud_sim/                    # Simulazione Cloud con altra Flask
│   ├── Dockerfile
│   ├── app.py
│   └── storage/
│
├── mqtt_broker/                 # Broker Mosquitto (config opzionale)
│   ├── mosquitto.conf
│
├── smart_objects/               # Simulazione dei dispositivi
│   ├── Dockerfile
│   ├── launcher.py
│   ├── devices/
│   │   ├── __init__.py
│   │   ├── base.py              # Sensor, Actuator, SmartObjectResource
│   │   ├── smart_object.py      # SmartObject
│   │   ├── sensors.py
│   │   ├── actuators.py
│   │   └── rack_cooling_unit.py
│   └── config/
│       └── devices_config.json
│
└── shared/
    └── protocol_utils.py        # librerie comuni (mqtt/http/coap helpers)

```
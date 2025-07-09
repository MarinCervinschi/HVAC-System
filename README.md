# HVAC System - Intelligent HVAC Control and Monitoring System

<!-- Badges -->
<div align="center">

![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Flask](https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

![MQTT](https://img.shields.io/badge/MQTT-660066?style=for-the-badge&logo=mqtt&logoColor=white)
![CoAP](https://img.shields.io/badge/CoAP-RFC7252-FF6B6B?style=for-the-badge)
![InfluxDB](https://img.shields.io/badge/InfluxDB-22ADF6?style=for-the-badge&logo=influxdb&logoColor=white)
![Grafana](https://img.shields.io/badge/Grafana-F46800?style=for-the-badge&logo=grafana&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

![License](https://img.shields.io/badge/License-Academic-green?style=for-the-badge)
![GitHub views](https://komarev.com/ghpvc/?username=MarinCervinschi&repo=HVAC-System&style=for-the-badge)
![GitHub repo size](https://img.shields.io/github/repo-size/MarinCervinschi/HVAC-System?style=for-the-badge)
![GitHub last commit](https://img.shields.io/github/last-commit/MarinCervinschi/HVAC-System?style=for-the-badge)
![GitHub issues](https://img.shields.io/github/issues/MarinCervinschi/HVAC-System?style=for-the-badge)
![GitHub stars](https://img.shields.io/github/stars/MarinCervinschi/HVAC-System?style=for-the-badge)

</div>

---

A distributed system for the control and monitoring of HVAC (Heating, Ventilation, Air Conditioning) plants based on IoT and microservices architecture. The system integrates smart objects, CoAP gateways, MQTT broker, web dashboard, and telemetry system for intelligent management of rooms and cooling racks.

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Main Components](#main-components)
- [Smart Objects](#smart-objects)
- [Requirements](#requirements)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Dashboard](#dashboard)
- [Monitoring](#monitoring)
- [Development](#development)
- [Contributing](#contributing)

## 🔍 Overview

The HVAC system manages the automatic control of temperature, humidity, air pressure, and energy consumption through:

- **IoT Smart Objects**: Virtual devices simulating sensors and actuators
- **CoAP Gateway**: Proxy for device communication
- **Policy System**: Automation based on configurable rules
- **Web Dashboard**: Modern user interface for control and monitoring
- **Telemetry**: Data collection and storage with InfluxDB and visualization with Grafana

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Dashboard     │    │   Data Collector│    │  Cloud Simulator│
│   (Next.js)     │    │   (Flask API)   │    │   (Flask API)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
         ┌─────────────────┐     │     ┌─────────────────┐
         │  Gateway CoAP   │─────┼─────│  MQTT Broker    │
         │                 │     │     │                 │
         └─────────────────┘     │     └─────────────────┘
                                 │
         ┌─────────────────┐     │     ┌─────────────────┐
         │  Smart Objects  │─────┼─────│  Monitoring     │
         │  (IoT Devices)  │     │     │  (Grafana)      │
         └─────────────────┘     │     └─────────────────┘
                                 │
                         ┌─────────────────┐
                         │  InfluxDB       │
                         │  (Time Series)  │
                         └─────────────────┘
```

## 🧩 Main Components

### 1. Gateway (`/gateway`)

- **Function**: CoAP proxy for discovery and communication with smart objects
- **Technologies**: aiocoap, asyncio
- **Port**: 5683 (CoAP standard)

### 2. Data Collector (`/data_collector`)

- **Function**: REST API for managing rooms, racks, and devices
- **Technologies**: Flask, Flask-RESTful, Flask-CORS
- **Port**: 5000
- **Endpoints**: `/hvac/api/rooms`, `/hvac/api/room/{id}`, `/hvac/api/rack/{id}`

### 3. Cloud Simulator (`/cloud_simulator`)

- **Function**: Cloud simulation for telemetry collection
- **Technologies**: Flask, InfluxDB Client
- **Port**: 5002
- **Storage**: InfluxDB + JSONL files

### 4. Dashboard (`/dashboard`)

- **Function**: Responsive web interface for control and monitoring
- **Technologies**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Port**: 3000
- **Features**: Real-time MQTT, charts, actuator control

### 5. Smart Objects (`/smart_objects`)

- **Function**: IoT device simulation with sensors and actuators
- **Technologies**: Python, paho-mqtt, aiocoap
- **Protocols**: MQTT (telemetry), CoAP (control)

## 🤖 Smart Objects

### Available Devices

#### 1. **RackCoolingUnit** 🌡️

- **Sensors**: Temperature Sensor
- **Actuators**: Fan Actuator
- **Purpose**: Server rack cooling control

#### 2. **WaterLoopController** 💧

- **Sensors**: Pressure Sensor
- **Actuators**: Pump Actuator
- **Purpose**: Water cooling circuit management

#### 3. **AirflowManager** 💨

- **Sensors**: Airspeed Sensor
- **Actuators**: Cooling Level Actuator
- **Purpose**: Airflow and cooling level control

#### 4. **EnvironmentMonitor** 🌍

- **Sensors**: Temperature Sensor, Humidity Sensor
- **Purpose**: Room environmental monitoring

#### 5. **EnergyMeteringUnit** ⚡

- **Sensors**: Energy Sensor
- **Purpose**: Energy consumption monitoring

#### 6. **CoolingSystemHub** ❄️

- **Actuators**: Cooling Level Actuator
- **Purpose**: Central hub for cooling control

### Sensor Types

- **Temperature**: 0-60°C, accuracy 0.01°C
- **Humidity**: 0-70%, accuracy 0.01%
- **Pressure**: 950-1050 hPa, accuracy 0.01 hPa
- **Airspeed**: 0.1-15 m/s, accuracy 0.01 m/s
- **Energy**: 0-1000 kWh, accuracy 0.001 kWh

### Actuator Types

- **Fan**: ON/OFF + speed (0-100%)
- **Pump**: ON/OFF
- **Cooling Level**: Levels 0-5

## 📋 Requirements

### Software

- **Python**: 3.11+
- **Node.js**: 18+
- **Docker**: 20.0+
- **Docker Compose**: 2.0+

### Recommended Hardware

- **RAM**: 4GB+
- **Storage**: 2GB+ free
- **CPU**: 2+ cores

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd HVAC-System
```

### 2. Setup Python Environment

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows

# Install dependencies
pip install -r requirements.txt
```

### 3. Setup Dashboard (Next.js)

```bash
cd dashboard
npm install
npm run build
cd ..
```

### 4. Start Docker Services

```bash
# Start InfluxDB, Grafana, and Cloud API
docker compose up -d

# Or rebuild everything
chmod +x rebuild.sh
./rebuild.sh
```

## ⚙️ Configuration

### 1. MQTT Configuration (`/config/mqtt_conf_params.py`)

```python
BROKER_ADDRESS = "127.0.0.1"
BROKER_PORT = 1883
BASE_TOPIC = "hvac/system"
```

### 2. CoAP Configuration (`/config/coap_conf_params.py`)

```python
COAP_SERVER_ADDRESS = "127.0.0.1"
COAP_GATEWAY_PORT = 5683
GATEWAY_URI = "coap://127.0.0.1:5683"
```

### 3. Rooms Configuration (`/data_collector/conf/rooms_config.json`)

```json
{
  "rooms": [
    {
      "room_id": "room_A1",
      "location": "Building A, Floor 1",
      "racks": [
        {
          "rack_id": "rack_A1",
          "type": "air_cooled"
        }
      ]
    }
  ]
}
```

### 4. Automation Policies (`/data_collector/conf/policy.json`)

Defines automatic rules for control based on sensor values.

## 🏃‍♂️ Usage

### 1. Start Components

#### CoAP Gateway

```bash
python gateway.py
```

#### Data Collector API

```bash
python run_app.py
```

#### Web Dashboard

```bash
cd dashboard
npm run dev
```

#### Smart Objects (Example)

```bash
python tests_scripts/process.py
```

### 2. System Testing

#### CoAP Connectivity Test

```bash
python tests_scripts/coap_test.py
```

#### Event Monitoring

```bash
python tests_scripts/monitor_control_events.py
```

### 3. Access Interfaces

- **Dashboard**: http://localhost:3000
- **API**: http://localhost:5000/hvac/api
- **Grafana**: http://localhost:3000/grafana (admin/admin)
- **Cloud API**: http://localhost:5002/api

## 📡 API Endpoints

### Rooms API

```
GET    /hvac/api/rooms              # List rooms
GET    /hvac/api/room/{room_id}     # Room details
```

### Racks API

```
GET    /hvac/api/rack/{rack_id}     # Rack details
```

### Device Control API

```
POST   /hvac/api/device/control     # Device control
```

### Policy API

```
POST   /hvac/api/policy/update      # Update policies
GET    /hvac/api/policy/room/{id}   # Room policies
GET    /hvac/api/policy/rack/{id}   # Rack policies
```

### Cloud API

```
POST   /api/telemetry/{room_id}     # Send telemetry
GET    /api/telemetry/{room_id}     # Retrieve telemetry
```

## 📊 Dashboard

### Main Features

- **Room View**: Overview and controls per room
- **Rack View**: Rack details with smart objects
- **Real-time Charts**: Sensor data visualization
- **Actuator Control**: Toggles and controls for actuators
- **Policy Management**: Create and edit automation rules
- **Responsive Design**: Optimized for desktop and mobile

### UI Components

- **Sensor Cards**: Sensor status display
- **Actuator Cards**: Actuator controls
- **Telemetry Tables**: Historical data tables
- **Policy Dialogs**: Modals for policy management

## 📈 Monitoring

### InfluxDB

- **Organization**: hvac-org
- **Bucket**: hvac_data
- **Token**: my-secret-token
- **Retention**: Configurable

### Grafana

- **Dashboards**: Pre-configured for HVAC
- **Panels**: Temperature, Humidity, Energy, Airflow
- **Alerts**: Configurable for critical thresholds

### Logs

- **Telemetry**: `/telemetry_logs/` (JSONL format)
- **Application**: Console output with configurable levels
- **Gateway**: `/gateway/logs/`

## 🛠️ Development

### Project Structure

```
HVAC-System/
├── config/                 # System configurations
├── data_collector/         # Main Flask API
├── dashboard/              # Next.js frontend
├── gateway/                # CoAP Gateway
├── smart_objects/          # Simulated IoT devices
├── cloud_simulator/        # Cloud simulator
├── mqtt_broker/            # MQTT configuration
└── docker-compose.yml      # Service orchestration
```

### Adding New Smart Objects

1. **Create the device** in `/smart_objects/devices/`
2. **Implement sensors/actuators** in `/smart_objects/sensors/` or `/actuators/`
3. **Update the factory** in `/data_collector/factories/smart_object_factory.py`
4. **Configure policies** in `/data_collector/conf/policy.json`
5. **Update UI** in `/dashboard/components/`

### Testing and Debugging

```bash
# Test individual smart objects
python process.py

# CoAP test
python coap_test.py

# Event monitoring
python monitor_control_events.py

# Docker logs
docker compose logs -f
```

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add some AmazingFeature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. **Open** a Pull Request

### Guidelines

- Follow existing code style
- Add tests for new features
- Update documentation
- Test across all components

## 📄 License

This project is developed for academic purposes - UNIMORE.

---

**Note**: This is a simulation system for educational purposes. For production use, implement additional security measures and real hardware validation.

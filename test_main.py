#!/usr/bin/env python3
"""
Main di test per il RackCoolingUnit
Testa tutte le funzionalità dello Smart Object e delle sue risorse
"""

import logging
import time
from smart_objects.devices.rack_cooling_unit import RackCoolingUnit

# Configurazione logging per vedere i messaggi
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

def print_separator(title: str):
    """Stampa un separatore carino per organizzare l'output"""
    print("\n" + "="*50)
    print(f" {title} ")
    print("="*50)

def test_rack_cooling_unit():
    """Test completo del RackCoolingUnit"""
    
    print_separator("INIZIALIZZAZIONE RACK COOLING UNIT")
    
    # Crea un'unità di raffreddamento rack
    rack_unit = RackCoolingUnit("RACK_001", "Server Room A")
    print(f"✅ Creato: {rack_unit}")
    
    # Stampa informazioni generali
    print(f"📍 Posizione: {rack_unit.location}")
    print(f"🆔 ID Oggetto: {rack_unit.object_id}")
    print(f"🔧 Risorse disponibili: {list(rack_unit.resource_map.keys())}")
    
    print_separator("TEST SENSORE TEMPERATURA")
    
    # Test del sensore di temperatura
    print("🌡️  Lettura temperatura...")
    for i in range(3):
        temp = rack_unit.get_temperature()
        print(f"   Lettura {i+1}: {temp}°C")
        time.sleep(1)
    
    # Accesso diretto al sensore
    temp_sensor = rack_unit.get_resource("temperature")
    print(f"📊 Dettagli sensore temperatura:")
    print(f"   - Valore attuale: {temp_sensor.load_updated_value()}°C")
    print(f"   - Unità di misura: {temp_sensor.unit}")
    print(f"   - Tipo: {temp_sensor.type}")
    print(f"   - ID Risorsa: {temp_sensor.resource_id}")
    
    print_separator("TEST ATTUATORE VENTILATORE")
    
    # Test del ventilatore
    print("🌀 Test controllo ventilatore...")
    
    # Ottieni stato iniziale
    fan_status = rack_unit.get_fan_status()
    print(f"📊 Stato iniziale ventilatore: {fan_status}")
    
    # Test comandi ventilatore
    test_commands = [
        {"command": "SET_SPEED", "speed": 30},
        {"command": "SET_SPEED", "speed": 60},
        {"command": "SET_SPEED", "speed": 100},
        {"command": "TURN_OFF"},
        {"command": "TURN_ON"},
        {"command": "SET_SPEED", "speed": 50},
    ]
    
    for i, command in enumerate(test_commands, 1):
        print(f"\n🔄 Test comando {i}: {command}")
        success = rack_unit.control_fan(command)
        if success:
            print(f"   ✅ Comando eseguito con successo")
        else:
            print(f"   ❌ Comando fallito")
        
        # Mostra stato dopo comando
        current_status = rack_unit.get_fan_status()
        print(f"   📊 Stato attuale: {current_status}")
        time.sleep(1)
    
    print_separator("TEST ACCESSO DIRETTO ALLE RISORSE")
    
    # Accesso diretto alle risorse
    print("🔧 Accesso diretto alle risorse:")
    
    # Test sensore
    temp_sensor = rack_unit.get_resource("temperature")
    print(f"🌡️  Sensore temperatura:")
    print(f"   - load_updated_value(): {temp_sensor.load_updated_value()}")
    print(f"   - to_dict(): {temp_sensor.to_dict()}")
    
    # Test attuatore
    fan_actuator = rack_unit.get_resource("fan")
    print(f"\n🌀 Attuatore ventilatore:")
    print(f"   - get_current_state(): {fan_actuator.get_current_state()}")
    print(f"   - is_operational: {fan_actuator.is_operational}")
    print(f"   - type: {fan_actuator.type}")
    
    print_separator("TEST SERIALIZZAZIONE")
    
    # Test serializzazione
    print("💾 Test serializzazione Smart Object:")
    obj_dict = rack_unit.to_dict()
    print(f"📄 to_dict():")
    for key, value in obj_dict.items():
        print(f"   {key}: {value}")
    
    print(f"\n📝 to_json():")
    print(rack_unit.to_json())
    
    print_separator("TEST SOGLIE TEMPERATURA")
    
    # Mostra le soglie di temperatura configurate
    print("🌡️  Soglie temperatura configurate:")
    print(f"   - Soglia bassa: {rack_unit.TEMP_THRESHOLD_LOW}°C")
    print(f"   - Soglia alta: {rack_unit.TEMP_THRESHOLD_HIGH}°C")
    print(f"   - Soglia critica: {rack_unit.TEMP_THRESHOLD_CRITICAL}°C")
    
    current_temp = rack_unit.get_temperature()
    print(f"\n🌡️  Temperatura attuale: {current_temp}°C")
    
    if current_temp < rack_unit.TEMP_THRESHOLD_LOW:
        print("   ❄️  Temperatura sotto soglia bassa - dovrebbe ridurre velocità ventilatore")
    elif current_temp > rack_unit.TEMP_THRESHOLD_CRITICAL:
        print("   🔥 Temperatura critica - dovrebbe attivare ventilatore al massimo!")
    elif current_temp > rack_unit.TEMP_THRESHOLD_HIGH:
        print("   🌡️  Temperatura alta - dovrebbe aumentare velocità ventilatore")
    else:
        print("   ✅ Temperatura normale")
    
    print_separator("TEST COMPLETATO")
    print("🎉 Tutti i test sono stati completati!")
    print("📊 Riepilogo risorse testate:")
    for resource_name, resource in rack_unit.resource_map.items():
        print(f"   - {resource_name}: {resource.__class__.__name__} (ID: {resource.resource_id})")

def test_error_handling():
    """Test gestione errori"""
    print_separator("TEST GESTIONE ERRORI")
    
    rack_unit = RackCoolingUnit("RACK_ERROR_TEST", "Test Room")
    
    # Test comando non valido
    print("❌ Test comando non valido:")
    invalid_command = {"command": "INVALID_COMMAND", "value": "invalid"}
    success = rack_unit.control_fan(invalid_command)
    print(f"   Risultato comando invalido: {success}")
    
    # Test accesso risorsa inesistente
    print("\n❌ Test accesso risorsa inesistente:")
    try:
        nonexistent = rack_unit.get_resource("nonexistent")
        print(f"   Risorsa inesistente: {nonexistent}")
    except KeyError as e:
        print(f"   ✅ Errore gestito correttamente: {e}")

if __name__ == "__main__":
    print("🚀 AVVIO TEST RACK COOLING UNIT")
    print("="*50)
    
    try:
        # Test principale
        test_rack_cooling_unit()
        
        # Test gestione errori
        test_error_handling()
        
    except Exception as e:
        print(f"\n❌ Errore durante i test: {e}")
        import traceback
        traceback.print_exc()
    
    print("\n🏁 FINE TEST")

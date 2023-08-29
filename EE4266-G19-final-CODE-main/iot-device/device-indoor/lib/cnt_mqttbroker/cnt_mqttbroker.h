#ifndef CNT_MQTTBROKER_H
#define CNT_MQTTBROKER_H
#include <Arduino.h>

// Import required libraries
#include "WiFi.h"
#include <PubSubClient.h>

// Add your MQTT Broker IP address, example:
// const char* mqtt_server = "192.168.1.132";
// const int mqtt_port = 1883;
// const char* mqtt_id = "ESP32-DHT11";
// const char* mqttsub_topic = "esp32/output";
extern const int ledPin;

void reconnect() ;
void callback(char* topic, byte* message, unsigned int length);

#endif
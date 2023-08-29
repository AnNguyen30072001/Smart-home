#ifndef READ_DHT_H
#define READ_DHT_H
#include <Arduino.h>
#include <Adafruit_Sensor.h>
#include <DHT.h>


String readDHTTemperature();

String readDHTHumidity();

// Replaces placeholder with DHT values
String processor(const String& var);
#endif
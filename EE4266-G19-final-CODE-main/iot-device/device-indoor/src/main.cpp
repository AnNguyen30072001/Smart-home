#include <Arduino.h>

#include "cnt_mqttbroker.h"
#include "connect_wifi.h"
#include "read_dht.h"

// Digital pin connected to the DHT sensor
#define DHTPIN 4    
#define DHTTYPE    DHT11     // DHT 11

 /******************** CONNECT_WIFI_H *****************************/
// const char* ssid = "Quy Hien";
// const char* password = "12345678";
// const char* ssid = "Wifi Free";
// const char* password = "66668888";
const char* ssid = "Bacus";
const char* password = "87654321";
 /******************** CONNECT_WIFI_H *****************************/

 /******************** CNT_MQTTBROKER_H *****************************/
// const char* mqtt_server = "192.168.1.132";
// const char* mqtt_server = "192.168.1.6";
const char* mqtt_server = "172.20.10.2";
const int mqtt_port = 1883;
const char* mqtt_id = "ESP32-DHT11";
const char* mqttsub_topic = "esp32/output";
const char* user = "sensor-111";
const char* pass = "matteo";
WiFiClient espClient;
PubSubClient client(espClient);

long lastMsg = 0;
char msg[50];
int value = 0;
float temp;
bool led_status = false;
const int ledPin = 2;
 /******************** CNT_MQTTBROKER_H *****************************/

DHT dht(DHTPIN, DHTTYPE);

// float temperature = 0;
// float humidity = 0;

void setup() {
  Serial.begin(115200);

  dht.begin(); // khởi tạo cảm biên

  setup_wifi(); // setup và connect wifi

  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);

  pinMode(ledPin, OUTPUT);
}

void loop() {
  // kết nối broker
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  long now = millis();
  // đọc giá trị cảm biến
  if (now - lastMsg > 10000) {
    lastMsg = now;
    temp = dht.readTemperature();
    String tempString = readDHTTemperature();
    Serial.print("Temperature: ");
    Serial.println(tempString);
    client.publish("indoor/dht11/temp", tempString.c_str());

    String humString = readDHTHumidity();
    Serial.print("Humidity: ");
    Serial.println(humString);
    client.publish("indoor/dht11/humidity", humString.c_str());
    
  }
  
    if (temp > 40.0 && led_status){
      digitalWrite(ledPin, LOW);  // tắt ổ cắm thông minh
      led_status = false;
      client.publish("indoor/state/smartSocket", "off");
    }


  // if (isPress) {
  //   led_status = !led_status;

  //   digitalWrite(ledPin, led_status);
  //   if (led_status) {
  //     client.publish("indoor/state/smartSocket", "on");
  //   } else {
  //     client.publish("indoor/state/smartSocket", "off");
  //   }
     
  //   isPress = false;
  // }

}

| Supported Targets | ESP32 | ESP32-C3 | ESP32-S2 | ESP32-S3 |
| ----------------- | ----- | -------- | -------- | -------- |

# Lưu ý
- Cấu hình SSID và pass WiFi trong `idf.py menuconfig`
- Cấu hình địa chỉ URI server : `COAP_OBSERVE_URI` cho observe, `COAP_POST_URI` cho post method trong file `iot-device\device-outdoor\main\main.c`
- Cấu hình chu kì đo: `DHT_PERIOD` (ms)


## How to use example

### Configure the project

```
idf.py menuconfig
```

Example Connection Configuration  --->
 * Set WiFi SSID
 * Set WiFi Password
Component config  --->
  CoAP Configuration  --->
    * Set encryption method definition, PSK (default) or PKI
    * Enable CoAP debugging if required
    * Disable CoAP using TCP if this is not required (TCP needed for TLS)
    * Disable CoAP server functionality to reduce code size
Example CoAP Client Configuration  --->
 * Set CoAP Target Uri
 * If PSK, Set CoAP Preshared Key to use in connection to the server
 * If PSK, Set CoAP PSK Client identity (username)

### Build and Flash

Build the project and flash it to the board, then run monitor tool to view serial output:

```
idf.py build
idf.py -p PORT flash monitor
```

(To exit the serial monitor, type ``Ctrl-]``.)

See the Getting Started Guide for full steps to configure and use ESP-IDF to build projects.

## libcoap Documentation
This can be found at [libcoap Documentation](https://libcoap.net/documentation.html).
The current API is 4.3.0.

## libcoap Specific Issues
These can be raised at [libcoap Issues](https://github.com/obgm/libcoap/issues).

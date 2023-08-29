const mqtt = require('mqtt');

const client  = mqtt.connect('mqtt://localhost:1883',
                             {username: 'gateway',
                             password: 'matteo'})

const mqtt_pk = require('mqtt-packet');
const opts = { protocolVersion: 4 }; // default is 4. Usually, opts is a connect packet
const parser = mqtt_pk.parser(opts);
const port_coap = 5683;
const token_indoor = '0XFQZ73lAJw1TxOxQYGV';
const token_outdoor = 'nZPWZxEwg64oz4woVVGX';
const thingboard_host_name = 'e4fd-202-191-58-174.ngrok-free.app'
const express = require('express');
const app = express();
const coap = require('coap') // or coap
const server_coap = coap.createServer()
http = require('http');
const events = require('events');
const eventEmitter = new events.EventEmitter();
const server = http.createServer(app);
const {Server} = require('socket.io');
const io = new Server(server); 
const port_local = 8889;
const cookieParser = require('cookie-parser')
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({extended: true}));
const request = require('request')
const name_user = 'matteo'; // tên đăng nhập web local
const password = '2234';    // mật khẩu đăng nhập web local
const cookie = {userId: 'test'};    // cookie web local
///api thingboard để gửi get request, quan sát sự thay đổi nút bấm trên thingboard
const url_indoor = 'https://e4fd-202-191-58-174.ngrok-free.app/api/v1/0XFQZ73lAJw1TxOxQYGV/rpc?timeout=20000'
const url_outdoor = 'https://e4fd-202-191-58-174.ngrok-free.app/api/v1/nZPWZxEwg64oz4woVVGX/rpc?timeout=20000'

//funtion gửi get request bắt sự thay đổi của nút bấm điều khiển indoor trên thingboard
function CatchSwitchIndoor(url) {
          request.get(url, function (err, res, body) {
            if (err) {
              console.error('Lỗi khi gửi yêu cầu:', err);
              return;
            }
        
            if (body) {
                try {
                  const jsonObject = JSON.parse(body);
                  const state = jsonObject.params;
                  console.log(typeof(state));
            
                  if (state === true) {
                    client.publish('esp32/output', 'on');
                    console.log('true');
                  } else if (state === false) {
                    client.publish('esp32/output', 'off');
                    console.log('false');
                  }
                } catch (error) {
                  count++;
                }
                
            }
            CatchSwitchIndoor(url);
          });
        }

function CatchSwitchOutdoor(url) {
        request.get(url, function (err, res, body) {
              if (err) {
                console.error('Lỗi khi gửi yêu cầu:', err);
                return;
              }
          
              // console.log(`Body: ${body}`);
              if (body) {
                  try {
                    const jsonObject = JSON.parse(body);
                    const state = jsonObject.params;
                    console.log(typeof(state));
              
                    if (state === true) {
                    eventEmitter.emit('pump_on');
                      console.log('true');
                    } else if (state === false) {
                    eventEmitter.emit('pump_off');
                      console.log('false');
                    }
                  } catch (error) {
                    count++;
                  }
                  
              }
              CatchSwitchOutdoor(url);
            });
          }
          
    CatchSwitchIndoor(url_indoor);
    CatchSwitchOutdoor(url_outdoor);
// lưu trữ giá trị nhiệt độ, độ ẩm và trạng thái ổ cắm trong nhà
var indoor = {  
    sensor1: {
        temp:{ now : 0},
        humi: { now : 0},
    },
    state1: {now: 'off'},
}

// lưu trữ nhiệt độ, độ ẩm, trạng thái máy bơm ngoài vườn
var outdoor = {
    sensor2: {
        temp:{ now : 0},
        humi: { now : 0},
    }, 
    state1: {now: 'off'},
}


// xử lí khi connect thành công tới mqtt broker => cụ thể là subscribe các topic 
client.on('connect', function () { 
    // subcribe topic esp32/output: điều khiển ổ cắm thông minh 
    client.subscribe('esp32/output', function (err) { 
      if (!err) {
        console.log(`(E-connect-MQTT): ${err}`);
      }
    });

    // subcribe topic indoor/dht11/temp: trao đổi dữ liệu nhiệt độ
    client.subscribe('indoor/dht11/temp', function (err) {  
        if (!err) {
          console.log(`(E-DHT11-TEMP): ${err}`);
        }
    });

     // subcribe topic indoor/dht11/humidity: trao đổi dữ liệu độ ẩm 
    client.subscribe('indoor/dht11/humidity', function (err) {  
      if (!err) {
        console.log(`(E-DHT11-HUMI): ${err}`);
      }
    });

    // subcribe topic indoor/state/smartSocket: trao đổi trạng thái ổ cắm thông minh 
    client.subscribe('indoor/state/smartSocket', function (err) {
        if (!err) {
          console.log(`(E): ${err}`);
        }
    });

  })

// xử lí các message được publish tới các topic đã subscribe
client.on('message', (topic, message, packet) => { 
    console.log('Data from Indoor:') 
    console.log(`(I): Topic: ${topic}`);
    console.log(`(I): Message: ${message}`);
    console.log('')
    switch (topic) {
        case 'indoor/dht11/temp':   // nhiệt độ trong nhà
            indoor.sensor1.temp.now = parseFloat(packet.payload.toString());    // lưu trữ giá trị nhiệt độ
            io.emit('indoor-sensor1-temp', indoor.sensor1.temp.now );   // emit dữ liệu cho weblocal

            var data = {
                        value: parseFloat(packet.payload.toString()),
                    };
            publishToCloud(data, 'temperature',token_indoor); // đẩy dữ liệu tới thingboard
            break;

        case 'indoor/dht11/humidity':  // độ ẩm trong nhà 

            indoor.sensor1.humi.now = parseFloat(packet.payload.toString());
            io.emit('indoor-sensor1-humi', indoor.sensor1.humi.now); 

            var data = {
                        value: parseFloat(packet.payload.toString()),
                    };
            publishToCloud(data, 'humidity',token_indoor);
            break;
        
        case 'indoor/state/smartSocket': // trạng thái ổ cắm thông minh
            var data = {
                value: packet.payload.toString(),
            };
            indoor.state1.now = data.value;
                io.emit('indoor-state1', indoor.state1.now); 
            publishToCloud(data, 'state',token_indoor);
            break;

        default:
            break;
    }

});
// xử lý khi các request tới sever coap
server_coap.on('request', (req, res) => {
    // console.log(req);
    // console.log(`url: ${req.url.split('/')[1]}`);
    const key = req.url.split('/')[1].slice(0, 3);
    // console.log(`key: ${key}`);
    switch (key) {
        case 'obs':
            obs(req, res);
            console.log('Observe')
            break;

        case 'GET':
            getHandle(req, res);
            break;   
            
        case 'POS':
            console.log('POST')
            postHandleCoAP(req, res);
            break;

        default:

            res.end('This is a default messenger\n');
            console.log('default');
            break;
    }

})

/**
 * @brief : gửi dữ liệu tới thingboard bằng phương thức POST tởi cổng API `${cloud}/publish/${topic}`
 * @param {*} data : dữ liệu cần đẩy tới Cloud Server
 * @param {*} type : loại dữ liệu, vd: temp(nhiệt độ), humi(độ ẩm), state...
 * @param {*} topic : topic để ghép thành URL mà Cloud Server lắng nghe
 */
var count =0;
async function publishToCloud(data, type, token){
    if (type === 'state'){
        data.value = data.value === 'on' ? 1:0; // convert state : 'on' -> 1 , 'off' -> 0
    }
    // cấu trúc body của bản tin
    var data =`{${type}: ${data.value}}`; // ví dụ : bản tin nhiệt độ {temperature: 29}
    // console.log(data);
    var option = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: data,
    };
        await fetch(`https://${thingboard_host_name}/api/v1/${token}/telemetry`, option) // POST dữ liệu thông qua api
        .then(function(response) {
            console.log(`(I): Sent ${type} to Cloud`);
            return response.json();
        })
        .then((res) => console.log(res))
        .catch((err)=> count ++)
  }
  // function xử lí khi nhận được dữ liệu tư ngoài vườn
  function postHandleCoAP(req, res) {
      res.end('POST successed!\n')
      let payload = JSON.parse(req.payload);
    //   console.log( 'payload:' + payload)
      console.log('Data from Outdoor:')
      console.log('(I) temp: '+payload['temp'])
      console.log('(I) humi: '+payload['humi'])
             console.log('(I) state: '+payload['state'])
             console.log(``)
             // lưu các giá trị nhiệt độ , độ ẩm , trạng thái máy bơm
             outdoor.sensor2.temp.now = payload['temp'];
             outdoor.sensor2.humi.now = payload['humi'];
             outdoor.state1.now = payload['state'];
             // emit dữ liệu cho weblocal1
             io.emit('outdoor-sensor2-temp', outdoor.sensor2.temp.now);
             io.emit('outdoor-state1', outdoor.state1.now);
             io.emit('outdoor-sensor2-humi', outdoor.sensor2.humi.now);
             var data1 = {
                 value : payload['temp'],
                }
                var data2 = {
                    value : payload['humi'],
                }
                var data3 = {
                    value : payload['state'],
                }
                // gửi dữ liệu lên thingboard
                publishToCloud(data1,'temperature',token_outdoor);
                publishToCloud(data2,'humidity',token_outdoor)
                publishToCloud(data3,'state',token_outdoor)
                // console.log(`temp: ${payload['temp']}`);
}
//function xử lí request observe từ node outdoor
function obs(req, res) {
    if (req.headers.Observe !== 0) {
        return res.end("Oke you fail")
    }
    res.write('false');
    // lắng nghe sự kiện bật bơm
    eventEmitter.on('pump_on', () => {
        res.write('true')
        console.log('pump on')
        // res.write(status.toString() + '\n')
    });
    // lắng nghe sự kiện tắt bơm
    eventEmitter.on('pump_off', () => {
        res.write('false')
        console.log('pump off')
        // res.write(status.toString() + '\n')
    });
    
    res.on('finish', () => {
        // console.log(`Fi: ${JSON.parse(req[0])}`);
        console.log('finish')
        // exit()
        // process.exit()

    })
}
/************************* LOCAL WEB SERVER ************************************** */
//  
app.get('/', (req, res) => {
    res.redirect('/app');
});

// xử lí yêu cầu đăng nhập
app.post('/login', (req, res) => { 

    console.log(req.body.name, req.body.pass);
    // kiểm tra user name và pass
    if (req.body.name === name_user && req.body.pass === password) {
        res.cookie('userId', cookie.userId);    // respone cookie to client
        res.redirect('/app');   // điều hướng tới trang chủ
    } else {
        // respone html trang LOGIN với thông báo lỗi
        res.sendFile(__dirname + '/view/login_wrong.html');  
    } 

});

// yêu cầu truy cập trang login
app.get('/login', (req, res) => {
    console.log('Cookie: ', req.cookies, req.cookies.userId );

    if (req.cookies.userId === cookie.userId) {
        res.redirect('/app');
        return;
    }
    res.sendFile(__dirname + '/view/login.html');
});

// yêu cầu truy cập trang chủ
app.get('/app', (req, res) => {;
    if (req.cookies.userId != cookie.userId) {
        res.redirect('/login');
        return;
    }
    res.sendFile(__dirname + '/view/app.html');
});

// yêu cầu truy cập các trang giám sát và điều khiển từ trang chủ
app.post('/app', (req, res) => {
    console.log( req.body.router);
   switch (req.body.router) {
    
    case 'indoor':
        res.redirect('/indoor');
        break;

    case 'outdoor':
        res.redirect('/outdoor');
        break;

    case 'mainpage':
        res.redirect('/app');
    break;
    default:
        break;
   }

});

// yêu cầu truy cập trang điều khiển trong nhà
app.get('/indoor', (req, res) => {;
    if (req.cookies.userId != cookie.userId) {
        res.redirect('/login');
        return;
    }
    res.sendFile(__dirname + '/view/indoor.html');
    setTimeout(()=>
    {
        io.emit('indoor-state1', indoor.state1.now);
        io.emit('indoor-sensor1-temp', indoor.sensor1.temp.now);
        io.emit('indoor-sensor1-humi', indoor.sensor1.humi.now);
    }, 500);

});

// yêu cầu truy cập trang chủ từ trang điều khiển trong nhà
app.post('/indoor', (req, res) => {;
    switch (req.body.router) {
        case 'mainpage':
            res.redirect('/app');
            break;
    
        default:
            break;
    }
});



// yêu cầu truy cập trang điều khiển ngoài vườn
app.get('/outdoor', (req, res) => {;
    if (req.cookies.userId != cookie.userId) {
        res.redirect('/login');
        return;
    }
    res.sendFile(__dirname + '/view/outdoor.html');
    setTimeout(()=>
    {
        io.emit('outdoor-state1', outdoor.state1.now);
        io.emit('outdoor-sensor1-temp', indoor.sensor1.temp.now);
        io.emit('outdoor-sensor1-humi', indoor.sensor1.humi.now);
    }, 500);
    // res.send('<h1>outdoor</h1>')

});

// yêu cầu truy cập trang chủ từ trang điều khiển ngoài vườn
app.post('/outdoor', (req, res) => {;
    switch (req.body.router) {
        case 'mainpage':
            res.redirect('/app');
            break;
    
        default:
            break;
    }
});



// xử lí khi có connect tới server socket
io.on('connection', (socket) => {
    console.log('user connected');

    // lắng nghe sự kiện bấm nút điều khiển ổ cắm thông minh từ Weblocal
    socket.on('indoor-btn-state1', data => {
        console.log(data);
        if (data.message === 'on') {
            client.publish('esp32/output', 'on');
        }
        else if (data.message === 'off') {
            client.publish('esp32/output', 'off');
        }
    });

    // lắng nghe sự kiện bấm nút điều khiển máy bơm từ Weblocal
    socket.on('outdoor-btn-state1', data => {
        console.log(data);
        if (data.message === 'on') {
            eventEmitter.emit('pump_on');
        }
        else if (data.message === 'off') {
            eventEmitter.emit('pump_off');
        }
    });

  
});


// khởi tạo server lắng nghe cổng 
server.listen(port_local, () => {
    console.log(`App local listening on port ${port_local}`);
});
server_coap.listen(port_coap, () => {
    console.log(`Coap Sever listening on port ${port_coap}`);
})


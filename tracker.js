const WebSocket = require('ws');

// const server = new WebSocket.Server({ port: 3000 });
const server = new WebSocket.Server({host: '0.0.0.0', port: 3000 });

server.on('open', function open() {
  console.log('connected');
});

server.on('close', function close() {
  console.log('disconnected');
});

file_list = {}
conn_list = {}

server.on('connection', function connection(ws, req) {
  const ip = req.connection.remoteAddress;
  console.log(req)
  const port = req.connection.remotePort;
  const clientName = ip + ':' +  port;

  console.log('%s is connected', clientName)

  // 发送欢迎信息给客户端
//   ws.send("Welcome " + clientName);
  ws.on('error', function log_error(message) {
    console.log(message)
  })
  ws.on('close', function disconnected() {
    delete file_list[r][clientName]
    delete conn_list[clientName]
  })

  ws.on('message', function incoming(message) {
    console.log('received: %s from %s', message, clientName);
    let obj = Object()
    try {
        obj = JSON.parse(message)
    }catch(e) {
        console.log(e)
        return
    }

    if (obj.type === 'REQUEST_SERVER') {
        r = Math.floor(Math.random() * 1000000)
        r = String(r)
        // conn_list[clientName] = {'ws': ws, 'role': obj.role, 'offer': obj.offer}
        conn_list[clientName] = {'ws': ws, 'role': obj.role, 'file_id': r}
        res = {'type': 'RESPONSE_URL', 'tracker': '192.168.2.220', 'file_id': `${r}`}
        while(file_list[r] !== undefined) {
          r = Math.floor(Math.random() * 1000000)
          r = String(r)
        }

          // file_list[r] = [{'conn': clientName, 'file_name': obj.file}]
        file_list[r] = {[clientName]: new Set()}
        for(let i = 0; i < obj.file.length; i ++) {
          file_list[r][clientName].add(obj.file[i])
        }
        ws.send(JSON.stringify(res))
    }

    else if (obj.type === 'REQUEST_CLIENT') {
      ret = {}
      r = obj.file_id
      conn_list[clientName] = {'ws': ws, 'role': 'client', 'file_id': r}
      // console.log(file_list, r, file_list[r])
      if(file_list[r] === undefined) {
        ret = {'type': 'RESPONSE_ERR', 'reason': 'FILE_ID_NOTEXIST'}
        ws.send(JSON.stringify(ret))
        return;
      }
      if(obj.action === 'list') {
        ret.type = 'RESPONSE_LIST'
        ret.files = []
        console.log(file_list)
        // for(let i = 0; i < file_list[r].length; i ++) {
        //   ret.files.push({'file_list': file_list[r][i].file_name, 'conn': file_list[r][i].conn})
        // }
        for(const clientName in file_list[r]) {
          file_list[r][clientName].forEach(key => ret.files.push({'file_list': [key], 'conn': clientName}))
          // ret.files.push({'file_list': file_list[r][i].file_name, 'conn': file_list[r][i].conn})
        }
      }
      ws.send(JSON.stringify(ret))
    } else if(obj.type === 'REQUEST_CLIENT_OFFER') {
      console.log(obj)
      console.log(conn_list)
      let conn = obj.conn
      obj['src'] = clientName
      conn_list[conn].ws.send(JSON.stringify(obj))
    }
    else if(obj.type === 'REQUEST_CLIENT_ICE_CAND' || obj.type === 'REQUEST_CLIENT_ICE_FIN') {
      let conn = obj.conn
      obj['src'] = clientName
      conn_list[conn].ws.send(JSON.stringify(obj))
    }
    else if(obj.type === 'RESPONSE_SERVER_ANSWER') {
      let conn = obj.conn
      obj['src'] = clientName
      conn_list[conn].ws.send(JSON.stringify(obj))
    }
    else if(obj.type === 'REQUEST_CLIENT_REGISTER') {
      let r = obj.file_id
      if(file_list[r][clientName] === undefined) {
        file_list[r][clientName] = new Set()
      }
      for(let i = 0; i < obj.file.length; i ++) {
        file_list[r][clientName].add(obj.file[i])
      }
    }

  });

});

server.on('disconnected', function disconnected(ws, req) {
  console.log("on closed")
})
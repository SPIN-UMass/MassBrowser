/**
 * Created by milad on 4/15/17.
 */
const net = require('net');
const fs = require('fs');
import  {ConnectionReceiver} from './ConnectionReceiver';

export function runOBFSserver(port) {

  const options = {
    key: fs.readFileSync('./app/core/test-certs/relay-key.pem'),
    cert: fs.readFileSync('./app/core/test-certs/relay-cert.pem'),
    rejectUnauthorized: false,
    // This is necessary only if using the client certificate authentication.
    requestCert: false


  };


  const server = net.createServer( (socket) => {
    console.log('server connected',
      socket.authorized ? 'authorized' : 'unauthorized');

    var recver = new ConnectionReceiver(socket);
  });


  server.listen(port, () => {
    console.log('server bound');
  });
  console.log("test server started on ",port);
}

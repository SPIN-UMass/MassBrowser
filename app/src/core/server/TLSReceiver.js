/**
 * Created by milad on 4/11/17.
 */
const tls = require('tls');
const fs = require('fs');
import  {ConnectionReceiver} from './ConnectionReceiver';

export function runTLSserver() {

  const options = {
    key: fs.readFileSync('./app/core/test-certs/relay-key.pem'),
    cert: fs.readFileSync('./app/core/test-certs/relay-cert.pem'),
    rejectUnauthorized: false,
    // This is necessary only if using the client certificate authentication.
    requestCert: false


  };


  const server = tls.createServer(options, (socket) => {
    console.log('server connected',
      socket.authorized ? 'authorized' : 'unauthorized');

    var recver = new ConnectionReceiver(socket);
  });


  server.listen(8040, () => {
    console.log('server bound');
  });
  console.log("test server started on 8040");
}


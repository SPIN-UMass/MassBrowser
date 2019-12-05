var rudp = require('./index');
var dgram = require('dgram');
var chalk = require('chalk');
var fs = require('fs');
var path = require('path');
var args = process.argv.slice(2);
var filePath = args[2]
var serverPort = args[1]
var serverAddress = args[0]

var clientSocket = dgram.createSocket('udp4')
var readStream = fs.createReadStream(filePath)
var totalDataSize = 0
var startTime = 0
var timerIsRunning = false

packetSender = new rudp.PacketSender(clientSocket, serverAddress, serverPort);
connection = new rudp.Connection(packetSender);

readStream.on('data', function(chunk) {
	totalDataSize += chunk.length
	connection.write(chunk)
});

connection.on('connect', () => {
	if (!timerIsRunning) {
		startTime = process.hrtime();
		timerIsRunning = true;
	}
});

clientSocket.on('message', function (message, rinfo) {
    var packet = new rudp.Packet(message);
    connection.receive(packet);
});

// clientSocket.send(Buffer.alloc(0), serverPort, serverAddress)
// connection.send(Buffer.from('hey'))
// clientSocket.send(Buffer.alloc(0), serverPort, serverAddress)
// setTimeout(() => {
// 	connection.end()
// }, 1000)

connection.on('close', () => {
	clientSocket.close(() => {
		console.log('closing the socket')
	})
})

connection.on('data', (data) => {
	console.log(data.toString())
})

connection.on('done', () => {
	console.log(totalDataSize)
	var endTime = process.hrtime(startTime);

	console.log(chalk.bold.green('File',totalDataSize,  'has been sent', endTime[0] + endTime[1]/1000000000, 's'))
	connection.close()
})

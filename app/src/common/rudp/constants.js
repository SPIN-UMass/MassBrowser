module.exports.PacketTypes = {
	'ACK': 1,
	'SYN': 2,
	'FIN': 3,
	'SYN_ACK': 4,
	'DATA': 5
};
module.exports.TCPStates = {
	'CLOSED': 0,
	'LISTEN': 1,
	'SYN_SENT': 2,
	'SYN_RCVD': 3,
	'ESTABLISHED': 4,
	'CLOSE_WAIT': 5,
	'FIN_WAIT_1': 6,
	'FIN_WAIT_2': 7,
	'TIME_WAIT': 8,
	'LAST_ACK': 9,
};
module.exports.CongestionControl = {
	'States': {
		'SLOW_START': 0,
		'CONGESTION_AVOIDANCE': 1,
		'FAST_RECOVERY': 2
	},
	'INITIAL_SLOW_START_THRESHOLD': 50
};
module.exports.Retransmission = {
	'ALPHA': 0.125,
	'BETA': 0.25,
	'MAX_NUMBER_OF_RETRANSMISSION': 5,
	'INITIAL_RETRANSMISSION_INTERVAL': 100
};
module.exports.CLOSE_WAIT_TIME = 30000;
module.exports.INITIAL_MAX_WINDOW_SIZE = 16
module.exports.MAX_SEQUENCE_NUMBER = 4294967295;
module.exports.DELAYED_ACK_TIME = 5;
module.exports.UDP_SAFE_SEGMENT_SIZE = 1400;
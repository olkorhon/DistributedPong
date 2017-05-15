// Sockets
const WebSocket = require('ws');

const conf = require('./config.js');
const Message = require('./message.js');
const Logger = require('./logger.js');

let match_making_socket;

let inputs = undefined;
let game_state = undefined;
let node_comms = undefined;

function matchmakingFunctionality(ws, context) {
	inputs = context.inputs;
	game_state = context.game_state;
	node_comms = context.node_comms;

	Logger.log('    └ message recognized to be a match request');
	Logger.log('       ├ stopping game if one is currently playing');
	node_comms.stopGame();

	Logger.log('       └ connecting to matchmaking at: ' + conf.MATCHMAKING_ADDRESS + ':' + conf.MATCHMAKING_PORT + '\n');
	match_making_socket = new WebSocket('ws://' + conf.MATCHMAKING_ADDRESS + ':' + conf.MATCHMAKING_PORT);
	match_making_socket.on('open', function () {
		Logger.log('-> Connected to matchmaking');

		const message = new Message.Message(conf.MY_ID, 'ready_for_game', conf.SERVER_PORT);
		const message_data = message.toJson();

		match_making_socket.send(Message.encrypt(message_data));
	});
	match_making_socket.on('message', function (msg) {
		Logger.log('-> Incoming message from matchmaking: ' + msg);

		let parsed_data = JSON.parse(Message.decrypt(msg));
		Logger.log('    ├ parsed data: ' + parsed_data);

		let parsed_body = JSON.parse(parsed_data.body);
		Logger.log('    ├ parsed body: ' + parsed_body);
	
		// Something is coming from matchmaking, it must be a confirmed match
		Logger.log('    └ connecting to designated opponent: ' + parsed_body.address + ':' + parsed_body.port + '\n');
		opponent_socket = new WebSocket('ws://' + parsed_body.address + ':' + parsed_body.port);
		opponent_socket.on('open', function () {
			Logger.log('-> Connection opened with opponent: ' + opponent_socket._socket.remoteAddress);
			Logger.log('    ├ constructing start message for opponent');
			const message = new Message.Message(conf.MY_ID, 'start', '');
			const message_data = message.toJson();

			Logger.log('<-  └ sending start message to opponent\n');
			opponent_socket.send(Message.encrypt(message_data));
		});
		opponent_socket.on('message', function (msg) {
			Logger.log('-> Message received from opponent: ' + opponent_socket._socket.remoteAddress);
			Logger.log('    ├ contents: ' + msg);

			const data = JSON.parse(Message.decrypt(msg));
			if ('header' in data && 'type' in data.header) {
				if (data.header.type === 'redirect') {
					Logger.log('    ├ message recognized as a redirect request');
					let complete_address = opponent_socket._socket.remoteAddress;
					let relevant_address = complete_address.split(':').slice(-1)[0];

					Logger.log('<-  └ connecting new socket that should start the game loop\n');
					redirected_socket = new WebSocket('ws://' + relevant_address + ':' + data.body);
					node_comms.defineCommunicationSocketCallbacks(redirected_socket, inputs, game_state);
				}
				else {
					unexpectedMessage(data.header.type);
				}
			}
		});

		match_making_socket.close();
	});
	match_making_socket.on('close', function () {
		Logger.log('-> Matchmaking connection ended\n');
	});
}

module.exports = { matchmakingFunctionality: matchmakingFunctionality };
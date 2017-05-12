const WebSocket = require('ws');
const express = require('express');
const app = express();
const expressWs = require('express-ws')(app);

const conf = require('./config.js');
const browser = require('./browser.js');
const node_comms = require('./node_communication.js');
const Message = require('./message.js');
const Logger = require('./logger.js');
const GameState = require('./gamestate.js');

// Setup game
let id = 'test_id';
let game_state = new GameState();

const inputs = {};

// Serve relevant files for convenience
Logger.log('Serving public files');
app.use(express.static('public'));

// Web Socket route for linking with browser
Logger.log('Setting up web socket route');
app.ws('/', function (ws, req) {
    Logger.log('-> Initializing WebSocket connection with: ' + ws._socket.remoteAddress);
    ws.on('message', function (msg) {
        Logger.log('-> Message received from: ' + ws._socket.remoteAddress);
        Logger.log('    ├ contents: ' + msg);
        const data = JSON.parse(msg);
        if ('header' in data && 'type' in data.header) {
            if (data.header.type === 'IO_link') {
                browser.linkingFunctionality(ws, inputs, game_state);
            }
            else if (data.header.type === 'start') {
                node_comms.insertFunctionality(ws, data, inputs, game_state);
            }
            else if (data.header.type === 'ready') {
                Logger.log('    └ connecting to matchmaking\n');
            
                match_making_socket = new WebSocket('ws://192.168.56.1:9009');
                match_making_socket.on('open', function() {
                    Logger.log('-> Connected to matchmaking: ');
                    match_making_socket.send(JSON.stringify({ header: { type: 'ready_for_game' }, body: conf.SERVER_PORT }));
                });
                match_making_socket.on('message', function (data, flags) {
                    Logger.log('-> Incoming message from matchmaking: ' + data);

                    let parsed_data = JSON.parse(data);
                    Logger.log('    ├ parsed data: ' + parsed_data);

                    let parsed_body = JSON.parse(parsed_data.body);
                    Logger.log('    ├ parsed body: ' + parsed_body);
                    //let match_data = JSON.parse(data);

                    // Something is coming from matchmaking, it must be a confirmed match
                    Logger.log('    └ connecting to designated opponent: ' + parsed_body.address + ':' + parsed_body.port + '\n');
                    opponent_socket = new WebSocket('ws://' + parsed_body.address + ':' + parsed_body.port);
                    opponent_socket.on('open', function () {
                        Logger.log('-> Connection opened with opponent: ' + opponent_socket._socket.remoteAddress);
                        Logger.log('    ├ constructing start message for opponent');
                        let message = new Message(id, 'start', '');

                        Logger.log('<-  └ sending start message to opponent\n');
                        opponent_socket.send(message.toJson());
                    });
                    opponent_socket.on('message', function (data, flags) {
                        Logger.log('-> Message received from opponent: ' + opponent_socket._socket.remoteAddress);
                        Logger.log('    ├ contents: ' + data);

                        let opponent_data = JSON.parse(data);
                        if ('header' in opponent_data && 'type' in opponent_data.header) {
                            if (opponent_data.header.type === 'redirect') {
                                Logger.log('    ├ message recognized as a redirect request');
                                let complete_address = opponent_socket._socket.remoteAddress;
                                let relevant_address = complete_address.split(':').slice(-1)[0];

                                Logger.log('<-  └ connecting new socket that should start the game loop\n');
                                redirected_socket = new WebSocket('ws://' + relevant_address + ':' + opponent_data.body);
                                node_comms.defineCommunicationSocketCallbacks(redirected_socket, inputs, game_state);
                            }
                            else {
                                unexpectedMessage(data.header.type);
                            }
                        }
                    });

                });
                match_making_socket.on('close', function () {
                    Logger.log('-> Connection broken from: ' + ws._socket.remoteAddress + '\n');
                });
            }
            else {
                unexpectedMessage(data.header.type);
            }
        }
        else {
            Logger.log('E  └ invalid or missing header in package, cannot process\n');
            ws.close();
        }
    });
    ws.on('close', function () {
        Logger.log('-> Probing socket closed with client: ' + ws.upgradeReq.connection.remoteAddress + '\n');
    });
});

function unexpectedMessage(msg) {
    console.error('Unexpected message received: ' + msg + '\n');
}

Logger.log('Listening started on port: ' + conf.SERVER_PORT);
app.listen(conf.SERVER_PORT);

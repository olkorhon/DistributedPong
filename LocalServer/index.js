const WebSocket = require('ws');
const express = require('express');
const app = express();
const expressWs = require('express-ws')(app);

const conf = require('./config.js');
const browser = require('./browser.js');
const node_comms = require('./node_communication.js');
const GameManager = require('./game_logic.js');


// Setup game
let id = 'test_id';
let game_manager = new GameManager();
game_manager.getCurrentState().addPlayer(id, 'rgb(64, 208, 64)');
let game_state = game_manager.getCurrentState();
log(game_manager.getCurrentState().toJson());

const inputs = {};

// Serve relevant files for convenience
log('Serving public files');
app.use(express.static('public'));

// Web Socket route for linking with browser
log('Setting up web socket route');
app.ws('/', function (ws, req) {
    log('-> Initializing WebSocket connection with: ' + ws._socket.remoteAddress);
    ws.on('message', function (msg) {
        log('-> Message received from: ' + ws._socket.remoteAddress);
        log('    ├ contents: ' + msg);
        const data = JSON.parse(msg);
        if ('header' in data && 'type' in data.header) {
            if (data.header.type === 'IO_link') {
                browser.linkingFunctionality(ws, inputs, game_state);
            }
            else if (data.header.type === 'start_game') {
                node_comms.insertFunctionality(ws, data, inputs, game_state);
            }
            else if (data.header.type === 'ready') {
                log('    └ connecting to matchmaking');
            
                match_making_socket = new WebSocket('ws://192.168.56.1:9009');
                match_making_socket.on('open', function() {
                    log('-> Connected to matchmaking: ');
                    match_making_socket.send(JSON.stringify({ header: { type: 'ready_for_game' }, body: conf.SERVER_PORT }));
                });
                match_making_socket.on('message', function (data, flags) {
                    log('-> Incoming message from matchmaking: ' + data);

                    // Something is coming from matchmaking, it must be a confirmed match
                    log('    └ connecting to designated opponent: ' + data.body.address + ':' + data.body.port);
                    opponent_socket = new WebSocket('ws://' + data.body.address + ':' + data.body.port);
                    node_comms.defineCommunicationSocketCallbacks(opponent_socket);

                });
                match_making_socket.on('close', function () {
                    log('-> Connection broken from: ' + ws._socket.remoteAddress);
                });
            }
            else {
                unexpectedMessage(msg);
            }
        }
        else {
            log('E  └ invalid or missing header in package, cannot process');
            ws.close();
        }
    });
    ws.on('close', function () {
        log('-> Probing socket closed with client: ' + ws.upgradeReq.connection.remoteAddress);
    });
});

function unexpectedMessage(msg) {
    console.error('Unexpected message received: ' + msg);
}

// Utility wrapper for logging, appends a timestamp to all logs
function log(msg) {
    const now = new Date();
    const datestring = ("0" + now.getDate()).slice(-2) + "-"
        + ("0" + (now.getMonth() + 1)).slice(-2) + "-"
        + now.getFullYear() + " "
        + ("0" + now.getHours()).slice(-2) + ":"
        + ("0" + now.getMinutes()).slice(-2) + ":"
        + ("0" + now.getSeconds()).slice(-2) + ":" +
        + ("00" + now.getMilliseconds()).slice(-3);

    console.log(datestring + ': ' + msg);
}

log('Listening started on port: ' + conf.SERVER_PORT);
app.listen(conf.SERVER_PORT);

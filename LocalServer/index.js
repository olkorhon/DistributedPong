const WebSocket = require('ws');
const express = require('express');
const app = express();
const expressWs = require('express-ws')(app);

const conf = require('./config.js');

const browser = require('./browser.js');
const matchmaking = require('./matchmaking.js');
const node_comms = require('./node_communication.js');

const Message = require('./message.js');
const Logger = require('./logger.js');
const GameState = require('./gamestate.js');

// Setup game
let game_state = new GameState();
game_state.setup();

const inputs = {};

const context = {
    browser: browser,
    node_comms: node_comms,
    matchmaking: matchmaking,
    inputs: inputs,
    game_state: game_state
}

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
        const data = JSON.parse(Message.decrypt(msg));
        if ('header' in data && 'type' in data.header) {
            if (data.header.type === 'IO_link') {
                browser.linkingFunctionality(ws, context);
            }
            else if (data.header.type === 'start') {
                node_comms.insertFunctionality(ws, context);
            }
            else if (data.header.type === 'ready') {
                matchmaking.matchmakingFunctionality(ws, context);
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

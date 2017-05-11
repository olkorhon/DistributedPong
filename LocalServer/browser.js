// Sockets
const WebSocket = require('ws');

const conf = require('./config.js');
const GameManager = require('./game_logic.js');

let silence_input = true;
let silence_state = true;

let input_socket_server;
let state_socket_server;
let input_socket;
let state_socket;

let id = 'test_id';

// Setup game
let game_manager = new GameManager();
game_manager.getCurrentState().addPlayer(id, 'rgb(64, 208, 64)');
log(game_manager.getCurrentState().toJson());

let linkingFunctionality = function (ws, input) {
    log('    └ message recognized to be a linking request');

    // Create socket server for input
    if (!input_socket_server) {
        log('       ├ creating end point for input polling');
        input_socket_server = new WebSocket.Server({ port: conf.INPUT_PORT });
        input_socket_server.on('connection', function (ws) {
            // Define input socket behavior
            log('-> Input connection made by: ' + ws.upgradeReq.connection.remoteAddress);
            input_socket = ws;
            input_socket.on('message', function (msg) {
                log('-> Input data received from: ' + state_socket.upgradeReq.connection.remoteAddress, silence_input);
                log('    ├ message: ' + msg, silence_input);

                input[id] = msg;

                log('    └ input processing finished', silence_input);
            });
            input_socket.on('close', function () {
                log('-> State disconnected from: ' + state_socket.upgradeReq.connection.remoteAddress);
            });
            setTimeout(pollForInput, 100, input_socket);
        });
    } else {
        log('W      ├ socket server for input already initiated');
    }

    // Create socket server for status
    if (!state_socket_server) {
        log('       ├ creating end point for game_state pushing');
        state_socket_server = new WebSocket.Server({ port: conf.STATE_PORT });

        state_socket_server.on('connection', function (ws) {
            // Define state socket behavior
            log('-> State connection made by: ' + ws.upgradeReq.connection.remoteAddress);
            state_socket = ws;
            state_socket.on('message', function (msg) {
                log('-> State data received from: ' + state_socket.upgradeReq.connection.remoteAddress, silence_state);
                log('    └ message: ' + msg.data, silence_state);
            })
            state_socket.on('close', function () {
                log('-> Input disconnected from: ' + state_socket.upgradeReq.connection.remoteAddress);
            });

            startTickLoop(10, state_socket);
        });
    } else {
        log('W      ├ socket server for status already initiated');
    }

    log('       ├ building reply package');
    var reply = {
        input: conf.INPUT_PORT,
        state: conf.STATE_PORT
    };

    log('<-     └ replying client with the ports that should be used for further communication: ' + JSON.stringify(reply));
    ws.send(JSON.stringify(reply));
};

function pollForInput(socket) {
    // Different types of requests
    // 0: no data needed, just send the most recent input status
    // 1: undefined
    socket.send("0");
    setTimeout(pollForInput, 1000, socket);
}

function startTickLoop(tick_rate, socket) {
    tick_delay = 1000 / tick_rate;
    setTimeout(advanceTick, tick_delay, current_input, socket, game_manager.getCurrentState());
}

function advanceTick(inputs, socket, game_state) {
    game_state.advanceTick(inputs);
    sendGameState(socket, game_state);
    setTimeout(advanceTick, 1000, current_input, socket, game_state);
}

function sendGameState(socket, game_state) {
    socket.send(game_state.toJson());
}

function log(msg, is_silenced=false) {
    if (!is_silenced) {
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
}

module.exports = { linkingFunctionality: linkingFunctionality };
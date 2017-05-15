// Sockets
const WebSocket = require('ws');

const conf = require('./config.js');
const Logger = require('./logger');

let silence_input = true;
let silence_state = true;

let input_socket_server;
let state_socket_server;
let input_socket;
let state_socket;

let inputs = undefined;
let game_state = undefined;

let linkingFunctionality = function (ws, context) {
    inputs = context.inputs;
    game_state = context.game_state;

    Logger.log('    └ message recognized to be a linking request');
    // Create socket server for input
    if (!input_socket_server) {
        Logger.log('       ├ creating end point for input polling');
        input_socket_server = new WebSocket.Server({ port: conf.INPUT_PORT });
        input_socket_server.on('connection', function (ws) {
            // Define input socket behavior
            Logger.log('-> Input connection made by: ' + ws.upgradeReq.connection.remoteAddress);
            input_socket = ws;
            input_socket.on('message', function (msg) {
                Logger.log('-> Input data received from: ' + state_socket.upgradeReq.connection.remoteAddress, silence_input);
                Logger.log('    ├ message: ' + msg, silence_input);

                inputs[conf.MY_ID] = msg;

                Logger.log('    └ input processing finished\n', silence_input);
            });
            input_socket.on('close', function () {
                Logger.log('-> State disconnected from: ' + state_socket.upgradeReq.connection.remoteAddress);
            });
            setTimeout(pollForInput, conf.BROWSER_INPUT_POLL_DELAY, input_socket);
        });
    } else {
        Logger.log('W      ├ socket server for input already initiated');
    }

    // Create socket server for status
    if (!state_socket_server) {
        Logger.log('       ├ creating end point for game_state pushing');
        state_socket_server = new WebSocket.Server({ port: conf.STATE_PORT });

        state_socket_server.on('connection', function (ws) {
            // Define state socket behavior
            Logger.log('-> State connection made by: ' + ws.upgradeReq.connection.remoteAddress);
            state_socket = ws;
            state_socket.on('message', function (msg) {
                Logger.log('-> State data received from: ' + state_socket.upgradeReq.connection.remoteAddress, silence_state);
                Logger.log('    └ message: ' + msg.data, silence_state);
            })
            state_socket.on('close', function () {
                Logger.log('-> Input disconnected from: ' + state_socket.upgradeReq.connection.remoteAddress);
            });

            startTickLoop(state_socket, game_state);
        });
    } else {
        Logger.log('W      ├ socket server for status already initiated');
    }

    Logger.log('       ├ building reply package');
    var reply = {
        input: conf.INPUT_PORT,
        state: conf.STATE_PORT
    };

    Logger.log('<-     └ replying client with the ports that should be used for further communication: ' + JSON.stringify(reply) + '\n');
    ws.send(JSON.stringify(reply));
};

function pollForInput(socket) {
    // Different types of requests
    // 0: no data needed, just send the most recent input status
    // 1: undefined
    if (socket.readyState === 1) {
        socket.send("0");
        setTimeout(pollForInput, conf.BROWSER_INPUT_POLL_DELAY, socket);
    }
}

function startTickLoop(socket, game_state) {
    setTimeout(advanceTick, conf.BROWSER_STATE_REFRESH_DELAY, socket, game_state);
}

function advanceTick(socket, game_state) {
    if (socket.readyState === 1) {
        sendGameState(socket, game_state);
        setTimeout(advanceTick, conf.BROWSER_STATE_REFRESH_DELAY, socket, game_state);
    }
}

function sendGameState(socket, game_state) {
    socket.send(game_state.toJson());
}

module.exports = { linkingFunctionality: linkingFunctionality };
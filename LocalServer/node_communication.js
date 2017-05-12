// Sockets
const WebSocket = require('ws');

const conf = require('./config.js');

let silence_opponent = false;

let id = 'test_id';
let opponent_socket_server;
let opponent_socket;

let insertFunctionality = function (ws, data, inputs, game_state) {
    log('    └ message recognized to be a matchmaking request');

    if (!opponent_socket) {
        log('       ├ this node does not have an opponent, informing opponent of the socket where to connect for further communication');

        // Create socket for conversation with the opponent
        if (!opponent_socket_server) {
            opponent_socket_server = new WebSocket.Server({ port: conf.OPPONENT_PORT });
            opponent_socket_server.on('connection', function (ws) {
                // Define input socket behavior
                log('-> Opponent connection made by: ' + ws.upgradeReq.connection.remoteAddress);
                opponent_socket = ws;
                defineCommunicationSocketCallbacks(opponent_socket);

                // Start the game_state passing
                const message = new Message(id, 'pass_tick', game_state.toJson());
                opponent_socket.send(message.toJson());
            });
        }
        else {
            log('W      ├ socket server for opponent already initiated');
        }

        // Create message
        log('       ├ building reply package');
        const message = new Message(id, 'redirect', conf.OPPONENT_PORT);
        log('<-     └ replying to the opponent the port that should be used for further communication: ' + JSON.stringify(message));
        ws.send(message.toJson());
    }
    else {
        log('       └ this node already has an opponent, cannot connect to this');
    }
}

function defineCommunicationSocketCallbacks(socket) {
    socket.on('open', function () {
        log('-> Node connection opened with: ' + socket.upgradeReq.connection.remoteAddress, silence_opponent, silence_opponent)
    });
    socket.on('message', function (msg) {
        log('-> Message from opponent received: ' + socket.upgradeReq.connection.remoteAddress, silence_opponent);
        log('    ├ message: ' + msg, silence_opponent);

        const data = JSON.parse(msg);
        if ('header' in data && 'type' in data.header) {
            if (data.header.type === 'pass_tick') {
                log('    ├ opponent is passing processing turn to this node', silence_opponent);

                if ('body' in data) {
                    game_state.fromJson(data.body);

                    log('    ├ advancing game state with one tick', silence_opponent);
                    game_state.advanceTick(inputs);

                    const message = new Message(id, 'pass_tick', game_state.toJson());
                    log('<-  └ sending new state to opponent', silence_opponent);
                    opponent_socket.send(message);
                }
                else {
                    log('E   ├ no body received, using old game_state', silence_opponent);
                    log('    ├ advancing old game state with one tick', silence_opponent);
                    game_state.advanceTick(inputs);

                    const message = new Message(id, 'pass_tick', game_state.toJson());
                    log('<-  └ sending advanced old state to opponent', silence_opponent);
                    opponent_socket.send(message);
                }
            }
        }
        else {
            'E   └ invalid or missing header in package, cannot process'
        }
    });
    socket.on('close', function () {
        log('-> Opponent disconnected from: ' + state_socket.upgradeReq.connection.remoteAddress);
    });
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

module.exports = {
    insertFunctionality: insertFunctionality,
    defineCommunicationSocketCallbacks: defineCommunicationSocketCallbacks
};
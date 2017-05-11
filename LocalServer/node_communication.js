// Sockets
const WebSocket = require('ws');

const conf = require('./config.js');

let silence_opponent = false;

let id = 'test_id';
let opponent_socket_server;
let opponent_socket;

let insertFunctionality = function (ws, data, input) {
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
                opponent_socket.on('message', function (msg) {
                    log('-> Message from opponent received: ' + state_socket.upgradeReq.connection.remoteAddress, silence_opponent);
                    log('    ├ message: ' + msg, silence_opponent);

                    const data = JSON.parse(msg);
                    if ('header' in data && 'type' in data.header) {
                        if (data.header.type === 'pass_tick') {
                            log('    ├ opponent is passing processing turn to this node');

                            if ('body' in data) {
                                game_state = new GameState();
                                game_state.fromJson(data.body);

                                log('    ├ advancing game state with one tick');
                                game_state.advanceTick(input);

                                const message = new Message(id, 'pass_tick', game_state.toJson());
                                log('<-  ├ sending new state to opponent');
                                opponent_socket.send(message);
                            }
                            else {

                            }
                        }
                        log('    └ input processing finished', silence_opponent);
                    }
                    else {
                        'E   └ invalid or missing header in package, cannot process'
                    }
                });
                input_socket.on('close', function () {
                    log('-> State disconnected from: ' + state_socket.upgradeReq.connection.remoteAddress);
                });
                setTimeout(pollForInput, 100, input_socket);
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
    } else {
        log('       └ this node already has an opponent, cannot connect to this');
    }


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

module.exports = { insertFunctionality: insertFunctionality };
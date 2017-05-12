// Sockets
const WebSocket = require('ws');

const conf = require('./config.js');
const Message = require('./message.js');
const Logger = require('./logger.js');

let silence_opponent_specifics = true;
let silence_opponent = false;

let id = 'test_id';
let opponent_socket_server;
let opponent_socket;

let insertFunctionality = function (ws, data, inputs, game_state) {
    Logger.log('    └ message recognized to be a matchmaking request');

    if (!opponent_socket) {
        Logger.log('       ├ this node does not have an opponent, informing opponent of the socket where to connect for further communication');

        // Create socket for conversation with the opponent
        if (!opponent_socket_server) {
            Logger.log('       ├ creating socket server for connections to opponent port: ' + conf.OPPONENT_PORT);
            opponent_socket_server = new WebSocket.Server({ port: conf.OPPONENT_PORT });
            opponent_socket_server.on('connection', function (ws) {
                // Define input socket behavior
                Logger.log('-> Opponent connection made by: ' + ws.upgradeReq.connection.remoteAddress);
                opponent_socket = ws;
                defineCommunicationSocketCallbacks(opponent_socket, inputs, game_state);

                // Start the game_state passing
                const message = new Message(id, 'pass_tick', game_state.toJson());
                opponent_socket.send(message.toJson());
            });
        }
        else {
            Logger.log('W      ├ socket server for opponent already initiated');
        }

        // Create message
        Logger.log('       ├ building reply package');
        const message = new Message(id, 'redirect', conf.OPPONENT_PORT);
        Logger.log('<-     └ replying to the opponent the port that should be used for further communication: ' + JSON.stringify(message) + '\n');
        ws.send(message.toJson());
    }
    else {
        Logger.log('       └ this node already has an opponent, cannot connect to this\n');
    }
}

function defineCommunicationSocketCallbacks(socket, inputs, game_state) {
    socket.on('open', function () {
        Logger.log('-> Game socket opened with: ' + socket._socket.remoteAddress, silence_opponent);
    });
    socket.on('message', function(msg) {
        Logger.log('-> Message from opponent received: ' + socket._socket.remoteAddress, silence_opponent);
        Logger.log('    ├ contents: ' + msg, silence_opponent || silence_opponent_specifics);

        const data = JSON.parse(msg);
        if ('header' in data && 'type' in data.header) {
            if (data.header.type === 'pass_tick') {
                Logger.log('    ├ opponent is passing processing turn to this node', silence_opponent || silence_opponent_specifics);

                if ('body' in data) {
                    const state_data = JSON.parse(data.body);
                    game_state.fromJson(state_data);

                    // If we are not in the game, add us
                    if (!game_state.playerIsInGame(id)) {
                        Logger.log('    ├ player not yet in game, adding player to the game', silence_opponent || silence_opponent_specifics);
                        game_state.addPlayer(id, 'rgb(100, 100, 100)');
                    }

                    Logger.log('    ├ received game state: ' + game_state      , silence_opponent || silence_opponent_specifics);
                    Logger.log('    ├ current input: ' + JSON.stringify(inputs), silence_opponent || silence_opponent_specifics);
                    Logger.log('    ├ advancing game with one tick'      , silence_opponent || silence_opponent_specifics);
                    game_state.advanceTick(inputs);

                    const state_json = game_state.toJson();
                    Logger.log('    ├ package game state: ' + state_json, silence_opponent || silence_opponent_specifics);

                    const message = new Message(id, 'pass_tick', state_json);
                    Logger.log('<-  └ sending new state to opponent\n', silence_opponent || silence_opponent_specifics);
                    setTimeout(sendNewStateToOpponent, 100, socket, message);
                }
                else {
                    Logger.log('E   ├ no body received, using old game_state', silence_opponent || silence_opponent_specifics);
                    Logger.log('    ├ advancing old game state with one tick', silence_opponent || silence_opponent_specifics);
                    game_state.advanceTick(inputs);

                    const message = new Message(id, 'pass_tick', game_state.toJson());
                    Logger.log('<-  └ sending advanced old state to opponent\n', silence_opponent || silence_opponent_specifics);
                    setTimeout(sendNewStateToOpponent, 100, socket, message);
                }
            }
        }
        else {
            Logger.log('E   └ invalid or missing header in package, cannot process\n');
        }
    });
    socket.on('close', function () {
        Logger.log('-> Game socket closed with: ' + state_socket.upgradeReq.connection.remoteAddress);
    });
}

function sendNewStateToOpponent(socket, message) {
    socket.send(message.toJson());
}

module.exports = {
    insertFunctionality: insertFunctionality,
    defineCommunicationSocketCallbacks: defineCommunicationSocketCallbacks
};
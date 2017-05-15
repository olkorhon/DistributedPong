const WebSocket = require('ws');
const express = require('express');
const app = express();
const expressWs = require('express-ws')(app);

const conf = require('./config.js');
const Message = require('./Message.js');

let ready_nodes = {};

// Web Socket route for communication
log('Setting up web socket route');
app.ws('/', function (ws, req) {
    log('-> Initializing matchmaking connection with: ' + ws._socket.remoteAddress + '\n');
    ws.on('message', function (msg) {
        log('-> Message received from: ' + ws._socket.remoteAddress);
        log('    ├ contents: ' + msg);
        const data = JSON.parse(Message.decrypt(msg));
        if ('header' in data && 'type' in data.header) {
            if (data.header.type === 'ready_for_game') {
                if (Object.keys(ready_nodes).length > 0) {
                    log('    ├ one player is already waiting for a match, confirming match');

                    let id = Object.keys(ready_nodes)[0];
                    let another_node = ready_nodes[id];

                    log('    ├ ADDRESS: ' + another_node.address);
                    log('    ├ PORT   : ' + another_node.port);

                    const message = new Message.Message(undefined, 'match_found', JSON.stringify(another_node));
                    const message_data = message.toJson();

                    delete ready_nodes[id];

                    log('<-  └ sending node information\n');
                    ws.send(Message.encrypt(message_data));
                }
                else {
                    log('    ├ not enough players for game yet, saving players address');

                    let id = data.header.id;
                    let port = data.body;

                    let complete_address = ws._socket.remoteAddress;
                    let relevant_address = complete_address.split(':').slice(-1)[0];

                    log('    ├ ADDRESS: ' + relevant_address);
                    log('    ├ PORT   : ' + port);

                    ready_nodes[id] = {
                        address: relevant_address,
                        port: data.body
                    };
                    log('    └ terminating connection\n');
                    ws.close();
                }
            }
            else {
                unexpectedMessage(msg);
            }
        }
        else {
            log('E  └ invalid or missing header in package, cannot process');
        } 
    });
    ws.on('close', function () {
        log('-> Matchmaking socket closed with client: ' + ws.upgradeReq.connection.remoteAddress + '\n');
    });
});

function unexpectedMessage(msg) {
    console.error('Unexpected message received: ' + msg);
}

// Utility wrapper for logging, appends a timestamp to all logs
function log(msg, is_silenced = false) {
    if (!is_silenced) {
        const now = new Date();
        const datestring = ("0" + now.getDate()).slice(-2) + "-"
            + ("0" + (now.getMonth() + 1)).slice(-2) + "-"
            + now.getFullYear() + " "
            + ("0" + now.getHours().toString()).slice(-2) + ":"
            + ("0" + now.getMinutes().toString()).slice(-2) + ":"
            + ("0" + now.getSeconds().toString()).slice(-2) + ":"
            + ("00" + now.getMilliseconds().toString()).slice(-3);

        console.log(datestring + ': ' + msg);
    }
}

log('Listening started on port: ' + conf.MATCHMAKING_PORT);
app.listen(conf.MATCHMAKING_PORT);

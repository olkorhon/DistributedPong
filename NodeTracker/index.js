const WebSocket = require('ws');
const express = require('express');
const app = express();
const expressWs = require('express-ws')(app);

const conf = require('./config.js');
const Message = require('./Message.js');

const ready_nodes = [];


// Serve relevant files for convenience
log('Serving public files');
app.use(express.static('public'));

// Web Socket route for linking with browser
log('Setting up web socket route');
app.ws('/', function (ws, req) {
    log('-> Initializing matchmaking connection with: ' + ws._socket.remoteAddress);
    ws.on('message', function (msg) {
        log('-> Message received from: ' + ws._socket.remoteAddress);
        log('    ├ contents: ' + msg);
        const data = JSON.parse(msg);
        if ('header' in data && 'type' in data.header) {
            if (data.header.type === 'ready_for_game') {
                if (ready_nodes.length > 0) {
                    log('    ├ one player is already waiting for a match, confirming match');

                    const message = new Message(undefined, 'match_found', JSON.stringify(ready_nodes[0]));
                    log('<-  └ sending node information ');
                    ws.send(message.toJson());
                }
                else {
                    log('    ├ not enough players for game yet, saving players address');
                    ready_nodes.push({
                        address: ws._socket.remoteAddress,
                        port: data.body
                    });
                    log('    └ terminating connection');
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
        log('-> Matchmaking socket closed with client: ' + ws.upgradeReq.connection.remoteAddress);
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

log('Listening started on port: ' + conf.MATCHMAKING_PORT);
app.listen(conf.MATCHMAKING_PORT);

let ws_input = undefined;
let ws_state = undefined;

const KEY_CODES = {a: 1, d: 2, w: 4, s: 8}

let input_status = 0
let dummy_gamestate = {  }

function startGame() {
    // Initialize keyboard event listener
    let listener = new window.keypress.Listener();

    const a_listener = createButtonCombo(
        "a",
        function (event, times, auto_repeated) {
            input_status = input_status | KEY_CODES["a"];
            console.log("Input: " + input_status.toString());
        },
        function (event, times, auto_repeated) {
            input_status = input_status & ~KEY_CODES["a"];
            console.log("Input: " + input_status.toString());
        }
    );

    const d_listener = createButtonCombo(
        "d",
        function (event, times, auto_repeated) {
            input_status = input_status | KEY_CODES['d'];
            console.log("Input: " + input_status.toString());
        },
        function (event, times, auto_repeated) {
            input_status = input_status & ~KEY_CODES['d'];
            console.log("Input: " + input_status.toString());
        }
    );

    // Register listeners
    listener.register_many([a_listener, d_listener]);

    // Initialize web socket connection to local server
    let canvas = document.getElementById('canvas');
    prepareCanvas({ arena_radius:300, pad_width:80, pad_height:16}, canvas);

    // Connect to local server
    let ws = new WebSocket('ws://127.0.0.1:' + SERVER_PORT);
    ws.onopen = function (event) {
        ws.send(CryptoJS.AES.encrypt(JSON.stringify({ header: { type: 'IO_link' }}), AES_KEY).toString());
    }
    ws.onmessage = function (msg) {
        log('-> Received further contact details. ' + msg.data);
        json_data = JSON.parse(msg.data)

        const input_port = json_data.input;
        const state_port = json_data.state;

        log(input_port, state_port);

        ws_input = openInputSocket(input_port);
        ws_state = openStateSocket(state_port);
        ws.close();
    }
    ws.onclose = function (event) {
        console.log('Probing connection closed.');
    }
}

function openInputSocket(port) {
    log('Opening input socket ' + port);
    ws_input = new WebSocket('ws://127.0.0.1:' + port);
    ws_input.onopen = function (event) {
        log('Input connection made');
    }
    ws_input.onclose = function (event) {
        log('Input connection lost');
    }
    ws_input.onmessage = handleInputMessage;
    return ws_input
}
function openStateSocket(port) {
    log('Opening state socket ' + port);
    ws_state = new WebSocket('ws://127.0.0.1:' + port);
    ws_state.onopen = function (event) {
        log('State connection made');
    }
    ws_state.onclose = function (event) {
        log('State connection lost');
    }
    ws_state.onmessage = handleStateMessage;
    return ws_state
}

function handleInputMessage(msg) {
    log('-> Input message received: ' + msg.data, SILENCE_INPUT);
    const data = msg.data;

    // If requesting current input
    if (data == "0") {
        log('    ├ Request for input data', SILENCE_INPUT);
        log('<-  └ Sending current input: ' + input_status, SILENCE_INPUT);
        ws_input.send(input_status);
    }
}
function handleStateMessage(msg) {
    log('-> State message received', SILENCE_STATE);
    //console.log('<- State message received: ' + msg.data);
    new_state = JSON.parse(msg.data);
    refreshStatus(new_state);
}

function createButtonCombo(key, press, release) {
    return {
        keys          : key,
        prevent_repeat: true,
        on_keydown    : press,
        on_keyup      : release
    };
}

function readyForMatch() {
    log('Player is ready for a match.');

    // Connect to local server
    let ws = new WebSocket('ws://127.0.0.1:' + SERVER_PORT);
    ws.onopen = function (event) {
        log('Connection made with local server');
        ws.send(CryptoJS.AES.encrypt(JSON.stringify({ header: { type: 'ready' } }), AES_KEY).toString());
    }
    ws.onclose = function (event) {
        log('Probing connection closed.');
    }
}

function log(msg, silenced) {
    if (!silenced) {
        console.log(msg);
    }
}
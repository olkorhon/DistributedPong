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
    let ws = new WebSocket('ws://127.0.0.1:9000');
    ws.onopen = function (event) {
        ws.send(JSON.stringify({ header: { type: 'IO_link' }}));
    }
    ws.onmessage = function (msg) {
        console.log('-> Received further contact details. ' + msg.data);
        json_data = JSON.parse(msg.data)

        const input_port = json_data.input;
        const state_port = json_data.state;

        console.log(input_port, state_port);

        ws_input = openInputSocket(input_port);
        ws_state = openStateSocket(state_port);
        ws.close();
    }
    ws.onclose = function (event) {
        console.log('Probing connection closed.');
    }
}

function openInputSocket(port) {
    console.log('Opening input socket ' + port);
    ws_input = new WebSocket('ws://127.0.0.1:' + port);
    ws_input.onopen = function (event) {
        console.log('Input connection made');
    }
    ws_input.onclose = function (event) {
        console.log('Input connection lost');
    }
    ws_input.onmessage = handleInputMessage;
    return ws_input
}
function openStateSocket(port) {
    console.log('Opening state socket ' + port);
    ws_state = new WebSocket('ws://127.0.0.1:' + port);
    ws_state.onopen = function (event) {
        console.log('State connection made');
    }
    ws_state.onclose = function (event) {
        console.log('State connection lost');
    }
    ws_state.onmessage = handleStateMessage;
    return ws_state
}

function handleInputMessage(msg) {
    console.log('-> Input message received: ' + msg.data);
    const data = msg.data;

    // If requesting current input
    if (data == "0") {
        console.log('    ├ Request for input data');
        console.log('<-  └ Sending current input: ' + input_status);
        ws_input.send(input_status);
    }
}
function handleStateMessage(msg) {
    console.log('-> State message received');
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
    console.log('Player is ready for a match.');

    // Connect to local server
    let ws = new WebSocket('ws://127.0.0.1:9000');
    ws.onopen = function (event) {
        console.log('Connection made with local server');
        ws.send(JSON.stringify({ header: { type: 'ready' } }));
    }
    ws.onclose = function (event) {
        console.log('Probing connection closed.');
    }
}
var SERVER_PORT = 9000;
var INPUT_PORT = 9001;
var STATE_PORT = 9002;
var OPPONENT_PORT = 9003;

var MATCHMAKING_ADDRESS = '192.168.56.1';
var MATCHMAKING_PORT = 9009;

var MY_ID = 'Seppo'
var TICK_DELAY = 10;
var BROWSER_INPUT_POLL_DELAY = 10;
var BROWSER_STATE_REFRESH_DELAY = 10;

var AES_KEY = 'DistributedSystems2017CourseWorkCryptingKey';

module.exports = {
    SERVER_PORT: SERVER_PORT,
    INPUT_PORT: INPUT_PORT,
    STATE_PORT: STATE_PORT,
    OPPONENT_PORT: OPPONENT_PORT,

    MATCHMAKING_ADDRESS: MATCHMAKING_ADDRESS,
    MATCHMAKING_PORT: MATCHMAKING_PORT,

    MY_ID: MY_ID,
    TICK_DELAY: TICK_DELAY,
    BROWSER_INPUT_POLL_DELAY: BROWSER_INPUT_POLL_DELAY,
    BROWSER_STATE_REFRESH_DELAY: BROWSER_STATE_REFRESH_DELAY,

    AES_KEY: AES_KEY
};
const GameState = require('./gamestate.js');

function GameManager() {
    const self = this;
    this.current_state = new GameState();

    this.getCurrentState = function() {
        return self.current_state;
    }
}

module.exports = GameManager;
var arena_radius = 300;
var pad_width = 80;
var pad_height = 16;

function GameState() 
{
	const self = this;

	this.current_players = 0;
    this.arcs = {};
    this.paddles = {};

    this.playerIsInGame = function (id) {
        return id in self.paddles;
    }

	this.addPlayer = function(id, color)
    {
		paddle = { direction  : 0,
			       cur_offset : 0.5,
			       width      : pad_width,
			       height     : pad_height,
			       color      : color       };

		arc = { radius      : arena_radius,
				angle_start : 0,
				angle_size  : 0,
				color       : color }

        // Add player if possible
        if (!(id in self.arcs || id in self.paddles)) {
            self.arcs[id] = arc;
            self.paddles[id] = paddle;
            self.current_players += 1;
        }
        else {
            console.error('Cannot add player, player with id: ' + id + ' is already defined.');
        }

        // Recount starting positions
        arc_gap = Math.PI / 48.0;
        arc_angle_size = Math.PI * 2.0 / self.current_players;
        for (arc in self.arcs) {
            self.arcs[arc].angle_start = arc_angle_size * arc + arc_gap;
            self.arcs[arc].angle_size = arc_angle_size - arc_gap * 2;
        }
	}
	
	this.dropPlayer = function(index)
	{
		if (self.current_players > 0)
		{
			self.current_players -= 1;
			self.arcs.splice(index, 1);
			self.paddles.splice(index, 1);
		}
	}

    this.fromJson = function (package) {
        self.current_players = package.current_players;
        self.arcs = package.arcs;
        self.paddles = package.paddles;
    }

    this.toJson = function() {
        return JSON.stringify(self);
    }

    this.advanceTick = function(inputs) {
        // Iterate through all inputs and move paddles accordingly
        for (input in inputs) {
            // Input 1 means left
            if (inputs[input] == 1) {
                if (self.paddles[input].cur_offset - 0.01 < 0.0) {
                    self.paddles[input].cur_offset = 0.0;
                } else {
                    self.paddles[input].cur_offset -= 0.01;
                }
            }

            // Input 2 means right
            if (inputs[input] == 2) {
                if (self.paddles[input].cur_offset + 0.01 > 1.0) {
                    self.paddles[input].cur_offset = 1.0;
                } else {
                    self.paddles[input].cur_offset += 0.01;
                }
            }
        }
    }
}

module.exports = GameState;
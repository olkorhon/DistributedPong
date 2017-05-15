const ball_colors = ['rgb(0, 0, 0)', 'rgb(255, 0, 0)', 'rgb(0, 255, 0)', 'rgb(0, 0, 255)'];

var arena_radius = 300;
var pad_width = 80;
var pad_height = 16;

function GameState() 
{
	const self = this;

    this.setup = function () {
        self.current_players = 0;
        self.arcs = {};
        self.paddles = {};


        // Initiate ball
        self.ball_pos = [0, 0];

        let random_angle = Math.random() * Math.PI * 2.0;
        self.ball_vel = [Math.cos(random_angle) * 0.005, Math.sin(random_angle) * 0.005];

        self.ball_color = ball_colors[0];
    }

    this.playerIsInGame = function (id) {
        return id in self.paddles;
    }

	this.addPlayer = function(id, color)
    {
        paddle = {
            direction     : 0,
            cur_offset    : 0.5,
            angle_coverage: Math.asin(pad_width * 2.4 / (2.0 * arena_radius)),
			width         : pad_width,
			height        : pad_height,
            color         : color,
            score         : 0};

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

        let order = 0;
        for (arc in self.arcs) {
            self.arcs[arc].angle_start = order * arc_angle_size + arc_gap;
            self.arcs[arc].angle_size = arc_angle_size - arc_gap * 2;
            order += 1;
        }
	}
	
	this.dropPlayer = function(id)
	{
		if (id in self.paddles)
		{
			delete self.paddles[id];
        }

        if (id in self.arcs) {
            delete self.arcs[id];
        }

        self.current_players = self.paddles.keys().length;
	}

    this.fromJson = function (package) {
        self.current_players = package.current_players;
        self.arcs = package.arcs;
        self.paddles = package.paddles;

        self.ball_pos = package.ball_pos;
        self.ball_vel = package.ball_vel;
        self.ball_color = package.ball_color;
    }

    this.toJson = function() {
        return JSON.stringify(self);
    }

    this.advanceTick = function (inputs) {
        // Increase score
        for (key in self.paddles) {
            self.paddles[key].score += 1;
        }

        self._movePaddles(inputs);
        self._moveBall();
    }

    this._movePaddles = function (inputs) {
        // Iterate through all inputs and move paddles accordingly
        for (input in inputs) {
            // Input 1 means left
            if (inputs[input] == 1) {
                if (self.paddles[input].cur_offset - 0.005 < 0.0) {
                    self.paddles[input].cur_offset = 0.0;
                } else {
                    self.paddles[input].cur_offset -= 0.005;
                }
            }

            // Input 2 means right
            if (inputs[input] == 2) {
                if (self.paddles[input].cur_offset + 0.005 > 1.0) {
                    self.paddles[input].cur_offset = 1.0;
                } else {
                    self.paddles[input].cur_offset += 0.005;
                }
            }
        }
    }
    this._moveBall = function () {
        const new_pos = [self.ball_pos[0] + self.ball_vel[0], self.ball_pos[1] + self.ball_vel[1]];
        const len = lengthOfVector(new_pos);

        if (len >= 1) {
            self._edgeCollision(new_pos, len, Math.atan2(self.ball_pos[1], self.ball_pos[0]));
        }
        else {
            self.ball_pos = new_pos;
        }

        
    }
    this._edgeCollision = function(new_pos, len, collision_angle) {
        for (key in self.arcs) {
            let arc = self.arcs[key];

            let arc_middle = arc.angle_start + arc.angle_size / 2.0;
            let arc_angle_dist = angularDistance(collision_angle, arc_middle);

            if (arc_angle_dist <= arc.angle_size / 2.0) {
                // Found matching arc
                let paddle = self.paddles[key];

                let paddle_middle = arc.angle_start + arc.angle_size * paddle.cur_offset;
                let paddle_angle_dist = angularDistance(collision_angle, paddle_middle);

                if (paddle_angle_dist > paddle.angle_coverage / 2.0) {
                    console.log('missed paddle');
                    // Did not hit pad, reset ball
                    paddle.score = 0;
                    self.resetBall();
                    return;
                }
                else {
                    // Normalize position to the edge
                    self.ball_pos[0] = new_pos[0] / len;
                    self.ball_pos[1] = new_pos[1] / len;

                    const entry_angle = Math.atan2(self.ball_vel[1], self.ball_vel[0]);
                    const reflection_angle = paddle_middle + angularDistance(paddle_middle, entry_angle, false);

                    // Turn around
                    const ball_speed = lengthOfVector(self.ball_vel) * -1.1;
                    self.ball_vel[0] = Math.cos(reflection_angle) * ball_speed;
                    self.ball_vel[1] = Math.sin(reflection_angle) * ball_speed;

                    // Limit ball max speed                    
                    if (ball_speed > 0.1) {
                        self.ball_vel[0] = self.ball_vel[0] / ball_speed * 0.1;
                        self.ball_vel[1] = self.ball_vel[1] / ball_speed * 0.1;
                    }
                    return;
                }
            }
        }

        // Did not hit any arcs? Should probably reset
        self.resetBall();
    }

    this.resetBall = function () {
        self.ball_pos[0] = 0;
        self.ball_pos[1] = 0;

        let random_angle = Math.random() * Math.PI * 2.0;
        self.ball_vel[0] = Math.cos(random_angle) * 0.005;
        self.ball_vel[1] = Math.sin(random_angle) * 0.005;

        self.ball_color = ball_colors[Math.floor(Math.random() * 4)];
    }
}

function lengthOfVector(vec) {
    return Math.pow(vec[0] * vec[0] + vec[1] * vec[1], 0.5);
}

function angularDistance(a1, a2, absolute=true) {
    const phi = Math.abs(a2 - a1) % (2.0 * Math.PI);
    const dist = phi > Math.PI ? (2.0 * Math.PI) - phi : phi;

    if (absolute) {
        return dist;
    } else {
        const sign = (a1 - a2 >= 0 && a1 - a2 <= Math.PI) || (a1 - a2 <= -Math.PI && a1 - a2 >= -(2.0 * Math.PI)) ? 1 : -1;
        return dist * sign;
    }
}

module.exports = GameState;
var canvas = undefined;
var context = undefined;

var game_state = undefined;

var arena_radius = 300;
var pad_width = 80;
var pad_height = 16;

var arc_angle_gap = (2 * Math.PI) * (pad_width / (arena_radius * 2 * Math.PI));
var arc_angle_size = Math.PI * 2.0 / 5.0;

function prepareCanvas(game_settings, used_canvas) 
{
    canvas = used_canvas;

    arena_radius = game_settings.arena_radius;
    pad_width = game_settings.pad_width;
    pad_height = game_settings.pad_height;

    arc_angle_gap = (2 * Math.PI) * (pad_width / (arena_radius * 2 * Math.PI));
    arc_angle_size = Math.PI * 2.0 / 1.0;

	// Fetch context from canvas if one exists
    if (canvas.getContext) {
        context = canvas.getContext('2d');
    } else {
        console.log('Canvas has no context, CANNOT display anything!');
    }

    context.font = "16px Comic Sans MS";
}

function refreshStatus(game_state) {
	context.save();

    arc_angle_gap = (2 * Math.PI) * (pad_width / (arena_radius * 2 * Math.PI));
    arc_angle_size = Math.PI * 2.0 / game_state.arcs.length;

    // Clear everything that is currently on the canvas
    context.clearRect(0, 0, canvas.width, canvas.height);
	 
	// Move transform to the middle of the canvas
    context.translate(canvas.width / 2, canvas.height / 2);

	// Draw Arcs
    context.lineWidth = 3;
    for (var key in game_state.arcs)	{
		drawArc(context, game_state.arcs[key]);
	}

    // Draw paddles
    for (var key in game_state.paddles) {
		drawPaddle(context, key, game_state.arcs[key], game_state.paddles[key]);
	}

    // Draw ball
    drawBall(context, game_state.ball_pos, game_state.ball_color);

	context.restore();
}

// Draws a single arc out on the canvas
function drawArc(context, arc) {
	context.beginPath();
	context.arc(0, 0, arc.radius, arc.angle_start, arc.angle_start + arc.angle_size);
	context.stroke();
	//context.closePath() // Not required as beginPath resets the path to a new one anyway
}

// Draws a paddle out to the canvas on a specific arc
function drawPaddle(context, id, arc, paddle) {
	// Save status before translating
	context.save();
	
	// Move to correct paddle position
	var pad_angle = arc.angle_start + arc.angle_size * paddle.cur_offset;
	context.translate(Math.cos(pad_angle) * (arc.radius), Math.sin(pad_angle) * (arc.radius));
		
	// Rotate and draw a rectangle
    context.rotate(pad_angle + Math.PI / 2);
	context.fillStyle = paddle.color;
    context.fillRect(-paddle.width / 2, -paddle.height / 2, paddle.width, paddle.height);		

    context.fillStyle = 'rgb(0, 0, 0)';
    context.textAlign = 'center';

    context.fillText(id, 0, 5);
    context.fillText(paddle.score.toString(), 0, -10);

	// Restore saved status
	context.restore();
}

// Draws a ball in the defined position
function drawBall(context, ball_pos, color) {
    // Save status before translating
    context.save();

    context.fillStyle = color;
    context.translate(ball_pos[0] * (arena_radius - 15), ball_pos[1] * (arena_radius - 15));
    context.fillRect(-5, -5, 10, 10);

    // Restore saved status
    context.restore();
}

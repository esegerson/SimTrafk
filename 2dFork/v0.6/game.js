//globals.js before this
//emitter.js before this
//car.js before this
//road.js before this

function init() {
    //Simple road network for v0.6
    window.roadNetworkData = {
        "comment": "Testing Beziers",
        "boundary": { "minX": 0, "maxX": 1024, "minY": 0, "maxY": 1024 },
        "roads": [
            {
                "id": 1,
                "comment": "Part of an octagon",
                "color": "red",
                "name": "Bezier Test",
                "nodes": [
                    { "id": 1, "x": 128, "y": 512 },
                    { "id": 2, "x": 512, "y": 215, "curve": 100 },
                    { "id": 3, "x": 784, "y": 784 }
                ]
            }
        ]
    }
    sim.roadNetwork = new sim.RoadNetwork();
    sim.roadNetwork.loadNetwork(roadNetworkData);
    sim.roadNetwork.render();
    
    //Create one emitter
    sim.emitters.push(new sim.Emitter(sim.roadNetwork.nodes[0], 64));
    sim.emitters[0].tryEmit();
    
    //What's this for?
    window.addEventListener("mousemove", function(e) {
        window.mouseX = e.clientX;
        window.mouseY = e.clientY;
    });
}

//Startup
document.addEventListener("DOMContentLoaded", () => {
    init();
    step(); //Start the simulation
});

function step() {
    let now = Date.now();
    let delta = (now - sim.run.lastTime) * (sim.run.slow ? 0.1 : 1);
    sim.run.lastTime = now;
    simulate(delta);
    cullAll();

    if (!sim.run.stop)
        setTimeout(function() {
            window.requestAnimationFrame(step);
        }, 1000 / sim.globals.fps * sim.run.slow ? 1000 : 1);
}

function simulate(delta) {
	var debug = "There's something wrong with the steering.  Too jerky.  Too fast.  Too slow.  Needs to emulate human reaction times.<br>";
    sim.drivers.forEach(d => {
        if (!sim.run.pause) d.car.simulate(delta);
		d.car.render();
        debug += formatSteeringNum(d.car.dTarget, d.car.id);
    });
	debug += "<br>Mouse: (" + window.mouseX + ", " + window.mouseY + ")";
	$("#debug").html(debug);
	
	//emitter.cullAll();

    sim.emitters.forEach(e => { e.tryEmit(); });
	
	return;
	
	
    var numAlive = 0;
    var neighborMap = mapDistances(50);
    $.each(cars, function(i, car) {
        //Compute behavior
        if (car.v < 1) {
            car.v = 0;
            $(car.e).addClass("dead");
            car.curAction = '';
            return;
        }
        numAlive++;
        if (carHasNeighbor(car, neighborMap))
            brake(car, delta);
        else {
            if (car.curAction == "brake") {
                car.curAction = '';
                $(car.e).removeClass("brake");
            }
            if (car.v == car.maxV) {
                $(car.e).removeClass("accel");
                car.curAction = '';
            } else
                accellx(car, delta);
        }
        if (car.coolDown > 0) car.coolDown -= delta / 1000;
        if (car.coolDown < 0) car.coolDown = 0;
        car.d += car.dRate * (car.v / 50) * (delta / 1000);
        if (car.d < 0) car.d += 360;
        if (car.d > 360) car.d -= 360;
        car.x += Math.cos(car.d * Math.PI / 180) * car.v * delta / 1000;
        car.y += Math.sin(car.d * Math.PI / 180) * car.v * delta / 1000;

        //Render
        $(car.e).css("left", Math.round(car.x))
            .css("top", Math.round(car.y))
            .css("transform", "rotate(" + Math.round(car.d) + "deg)")
			.attr("title", car.driver.name);
        if (car.maxV > 200) $(car.e).addClass("hotrod");
    });
    $("#spanAlive").html(numAlive + " driving");
}

function formatSteeringNum(n, i) {
    if (typeof(n) == "undefined" || n == null) n = 0;
	//Limit number
	if (n > 99) n = 99;
	if (n < -99) n = -99;

	//Format number
	var num = "";
	if (n >= 0) num += "&nbsp;";
	if (Math.abs(n) < 10) num = "&nbsp;" + num;
	num = num + n.toFixed(0);
	
	//Construct visual
	var exag = (n * 6 + 45).toFixed(1);
	var rv = "<div><span style='transform: rotate(" + exag + "deg)'><span style='transform: rotate(" + (-exag) + "deg)'>" + i + "</span></span>" + num + "</div>";
	
	return rv;
}

function brake(car, delta) {
    $(car.e).removeClass("accel");
    if (car.curAction == "brake" || car.coolDown == 0) {
        car.curAction = "brake";
        car.coolDown = 2;
        car.v -= decel * delta / 1000;
        $(car.e).addClass("brake");
    }
}

function accellx(car, delta) {
    $(car.e).removeClass("brake");
    if (car.curAction == "accel" || car.coolDown == 0) {
        car.curAction = "accel";
        car.coolDown = 0.7;
        car.v += accel * delta / 1000;
        $(car.e).addClass("accel");
        if (car.v > car.maxV)
            car.v = car.maxV;
    }
}

function neighbors(car, radius) {
    //This is a terrible algorithm, it's O(n^2) when run for every single car
    var rv = new Array();
    for (var i = 0; i < max; i++) {
        var c = cars[i];
        if (c.id != car.id) {
            //Omit expensive sqrt()
            var hsq = Math.pow(Math.abs(car.x - c.x), 2) + Math.pow(Math.abs(car.y - c.y), 2);
            if (hsq < Math.pow(radius, 2)) rv.push(c);
        }
    }
    return rv;
}

function mapDistances(radius) {
    //This is an improvement over neighbors().  This is O((n(n-1)/2) which is roughly twice as fast as O(n^2).
    var rv = new Array();
    for (var i = 0; i < max; i++) {
        var a = cars[i];
        for (var j = i + 1; j < max; j++) {
            var b = cars[j];
            //Omit expensive sqrt()
            var hsq = Math.pow(Math.abs(a.x - b.x), 2) + Math.pow(Math.abs(a.y - b.y), 2);
            if (hsq < Math.pow(radius, 2)) rv.push(new Array(i, j, Math.floor(hsq)));
        }
    }
    return rv;
}

function carHasNeighbor(car, map) {
    var id = car.id;
    for (var i = 0; i < map.length; i++) {
        if (map[i][0] == id || map[i][1] == id) return true;
    }
    return false;
}

function pauseSim() {
    sim.run.pause = !sim.run.pause;
	sim.run.lastTime = Date.now();
}

function slowSim() {
    sim.run.slow = !sim.run.slow;
    sim.run.pause = false;
    sim.run.lastTime = Date.now();
}

function stopSim() {
    sim.run.stop = !sim.run.stop;
    if (!sim.run.stop) {
        //Restart things
        sim.run.lastTime = Date.now();
        step();
    }
}

function toggleSteering() {
	$("#debug").toggle();
}

function car_click(e) {
    var id = $(e.target).html();
    var c = emitter.carParticles.filter(x => { return x.car.data("carId") == id });
    c.maxV *= 2;
    if (c.v == 0) {
        $(c.e).removeClass("dead").removeClass("brake");
        c.v = c.maxV / 4;
        c.coolDown = 5;
    }
}

function describeArc(x, y, radius, startAngle, endAngle){
	//Need to mirror the angle along x-axis (y becomes -y) for screen view which has 0,0 at top-left
	startAngle = -startAngle;
	endAngle = -endAngle;

	if (startAngle > endAngle) {
		var t = startAngle;
		startAngle = endAngle;
		endAngle = t;
	}
    var i = 0;
	while (endAngle - startAngle > 360 && i < 10) { endAngle -= 360; i++; }
    
	
	//Take the short route
	if (endAngle - startAngle > 180) {
		var t = startAngle;
		startAngle = endAngle;
		endAngle = t;
	}
	
	var start = polarToCartesian(x, y, radius, endAngle);
	var end = polarToCartesian(x, y, radius, startAngle);

	var largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

	var d = [
		"M", start.x, start.y, 
		"A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
	].join(" ");

	return d;       
}

function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
	var angleInRadians = (angleInDegrees-90) * Math.PI / 180.0;

	return {
		x: centerX + (radius * Math.cos(angleInRadians)),
		y: centerY + (radius * Math.sin(angleInRadians))
	};
}

function angleFromCoords(sourcex, sourcey, targetx, targety) {
    //Angle returned is global (0deg faces right, +deg is counter-clockwise) with range -180 to 180.
	var dx = targetx - sourcex;
	var dy = targety - sourcey;
	var rad = Math.atan(dy / dx);
	var deg = rad * 180 / Math.PI; 

    //Above yields -90 > deg > 90.  Use logic to get full circle
	if (dy > 0 && dx < 0) deg = deg + 180;
	if (dy < 0 && dx < 0) deg = deg - 180;

	return deg;
}

function cullAll() {
    //Remove cars from sim.drivers when car leaves the screen.
    const margin = 100;
    let w0 = -margin;
    let h0 = -margin;
    let w1 = $(window).width() + margin;
    let h1 = $(window).height() + margin;
    for (let i = sim.drivers.length - 1; i  >= 0; i--) {
        let c = sim.drivers[i].car;
        if (c.age > 10 && (c.x < w0 || c.x > w1 || c.y < h0 || c.y > h1)) {
            //Minimum 10 second age so emitter can be placed off-screen
            let deleted = sim.drivers.splice(i, 1)[0]; //Remove from list of drivers
            deleted.car.eSVG.remove();
            deleted.car.eDebug.remove();
            deleted.car.eCar.remove();
            $("#spanAlive").text(sim.drivers.length + " driving"); //! TODO: code smell
        }
    };
}
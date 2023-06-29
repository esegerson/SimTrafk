//globals.js before this
//emitter.js before this
//car.js before this
//road.js before this

function putEmitterBehind(targetNode, distance) {
    var emitterPos = rn.getPositionBehindNode(targetNode, distance);
    if (emitterPos == null) { console.log("Can't place emitter"); return; }
    emitter.x = emitterPos.x;
    emitter.y = emitterPos.y;
    emitter.d = emitterPos.d;
    emitter.render();
}

function init() {
    //Set version
    if (window.location.href.indexOf("index.html") > -1) version = "4.1";
    if (window.location.href.indexOf("road-test.html") > -1) version = "4.2";
    if (window.location.href.indexOf("interactive.html") > -1) version = "4.3";
    
	//Init road network
    rn = new RoadNetwork();
    if (version == "4.1") {
        bezMode = 0;
        rn.generateRoad("sine");
        rn.render();
        emitter = new Emitter();
        emitter.constructor();
        emitter.nearestNode = rn.roads[0].nodes[0];
    } else if (version == "4.2") {
        bezMode = 0;
        rn.loadNetwork(roadNetworkData);
        rn.render();
        emitter = new Emitter();
        emitter.constructor();
        emitter.nearestNode = rn.roads[5].nodes[0]; //The green road
        putEmitterBehind(emitter.nearestNode, 16);
    } else if (version == "4.3") {
        bezMode = 2;
        rn.generateRoad("circle", 16);
        rn.render();
        emitter = new Emitter();
        emitter.constructor();
        emitter.nearestNode = rn.nodes[0];
        putEmitterBehind(emitter.nearestNode, 256);
        window.addEventListener("mousemove", function(e) {
            window.mouseX = e.clientX;
            window.mouseY = e.clientY;
        });
    } else {
        bezMode = 2;
    }
}

//Startup
$(function() {
    init();
    if (version == "4.1") {
        $("#slRate").on("input change", changeRate);
	    $("#slVelo").on("input change", changeVelo);
	    $("#slDir").on("input change", changeDir);
	    changeRate();
	    changeVelo();
	    changeDir();
	    lastTime = Date.now();
        step();
    } else if (version == "4.2") {
        emitter.rate = 20 * 1000; //milliseconds
        step();
    } else {
        //v4.3 or v4.4
        //putEmitterBehind(emitter.nearestRoad.roadId, emitter.nearestRoad.nodeId, 60);
        emitter.rate = 20 * 1000; //milliseconds
        step();
    }
	
	$("IMG[alt='www.000webhost.com']").closest("DIV").remove();
});

function changeRate() {
	var r = $("#slRate").val();
	var s = parseFloat(Math.round(r / 100) / 10).toFixed(0);
	$("#lblSlRate").text(s);
	emitter.rate = r * 1;
}

function changeVelo() {
	var v = $("#slVelo").val();
	var s = Math.round(v);
	$("#lblSlVelo").text(s);
	emitter.v = v * 1;
}

function changeDir() {
	var d = $("#slDir").val();
	var s = Math.round(d);
	$("#lblSlDir").text(s);
	emitter.d = d * 1;
	emitter.render();
}

function step() {
    var now = Date.now();
    var delta = (now - lastTime) * (slow ? 0.1 : 1);
    lastTime = now;
    simulate(delta);

    if (!stop)
        setTimeout(function() {
            window.requestAnimationFrame(step);
        }, 1000 / fps * slow ? 1000 : 1);
}

function simulate(delta) {
	var debug = "There's something wrong with the steering.  Too jerky.  Too fast.  Too slow.  Needs to emulate human reaction times.<br>";
	$.each(emitter.carParticles, function(i, cp) {
        if (roadNetwork.roads == undefined) {
		    if (!pause) cp.car.Simulate(delta, roadPath);
        } else {
            if (!pause) cp.car.Simulate(delta, roadNetwork);
        }
		cp.car.Render();
        debug += formatSteeringNum(cp.car.dTarget, cp.car.id);
	});
    debug += "<br>Mouse: (" + window.mouseX + ", " + window.mouseY + ")";
	$("#debug").html(debug);
	
	emitter.cullAll();

	if (emitter.lastCarEmitted() != null && new Date() - emitter.lastCarEmitted() < emitter.rate) return;
	
	if (!pause) emitter.TryEmit();
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
    pause = !pause;
	lastTime = Date.now();
}

function slowSim() {
    slow = !slow;
    pause = false;
    lastTime = Date.now();
}

function toggleSteering() {
	$("#debug").toggle();
}

bezMode = 0;
function toggleBez() {
    bezMode++;
    if (bezMode > 2) bezMode = 0;
    rn.render();
}

function randomGenRoad() {
    var r = Math.floor(Math.random() * 12);
    var n = r;
    switch (r) {
        case 0:
        case 1:
        case 2:
            rn.generateRoad("sine", n * 10 + 10);
            rn.render();
            emitter.nearestNode = rn.nodes[0];
            emitter.carParticles.forEach(cp => {
                cp.car.target = rn.nodes[0];
            });
            putEmitterBehind(rn.nodes[0], 16);
            emitter.render();
            return;
        case 9: n = 16;
        case 10: n = 32;
        case 11: n = 64;
    }
    rn.generateRoad("circle", n);
    rn.render();
    emitter.nearestNode = rn.nodes[0];
    emitter.carParticles.forEach(cp => {
        cp.car.target = rn.nodes[0];
    });
    putEmitterBehind(rn.nodes[0], 128);
    emitter.render();
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
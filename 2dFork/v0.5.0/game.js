//globals.js before this
//emitter.js before this
//car.js before this

function generateRoadPath() {
		var w = $(window).width();
		var h = $(window).height();
		for (var i = 0; i < h * 2; i += 100) {
			var x = Math.sin(-i / 200) * 300 + w / 2 - 3;
			var y = i - 3;
			if (i > 0) roadPath.push({ x: x, y: y });
		}
}

function drawRoad() {
	for (var i = 0; i < roadPath.length; i++) {
		var e = "<div class='roadDot'></div>";
        e = $("#road").append(e).find("DIV.roadDot:last-child");
		$(e).css("left", Math.round(roadPath[i].x))
            .css("top", Math.round(roadPath[i].y));
	}
}

function init() {
	//Init emitter
	emitter = new Emitter();
	emitter.constructor();
	generateRoadPath();
	drawRoad();
	return;

    //Init cars
    var h = $(window).height();
    var w = $(window).width();
    for (var i = numCars; i < max; i++) {
        var e = "<div class='car'>" + i + "</div>";
        $("#cars").append(e);
        var c = new Car();
        c.id = i;
        c.e = $(".car:last-child");
        $(c.e).click(car_click);
        c.v = Math.random() * 150 + 20;
        c.maxV = c.v;
        c.x = Math.random() * w * 2 / 3 + w / 6;
        c.y = Math.random() * h * 2 / 3 + h / 6;
        c.d = Math.random() * 360 - 180;
        c.dRate = Math.random() * 40 - 20;
        //$(c.e).css("background-color", c.color);
        if (i < 100) $(c.e).css("background-color", "#88f").css("z-index", "1");
        if (i < 10) $(c.e).css("background-color", "#8f8").css("z-index", "2");
        if (i < 1) $(c.e).css("background-color", "white").css("z-index", "3");

        cars.push(c);
    }
    numCars = max;
    $("#btnAdd").html("Add " + max + " cars");
}

//Startup
$(function() {
    init();
    $("#slRate").on("input change", changeRate);
	$("#slVelo").on("input change", changeVelo);
	$("#slDir").on("input change", changeDir);
	changeRate();
	changeVelo();
	changeDir();
	lastTime = Date.now();
    step();
	
	$("IMG[alt='www.000webhost.com']").closest("DIV").remove();
});

function changeRate() {
	var r = $("#slRate").val();
	var s = parseFloat(Math.round(r / 100) / 10).toFixed(1);
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
	if (!pause) {
		var now = Date.now();
		var delta = now - lastTime;
		lastTime = now;
		simulate(delta);
    }
	setTimeout(function() {
        window.requestAnimationFrame(step);
    }, 1000 / fps);
}

function simulate(delta) {
	var debug = "There's something wrong with the steering.  Too jerky.  Too fast.  Too slow.  Needs to emulate human reaction times.<br>";
	$.each(emitter.carParticles, function(i, cp) {
		cp.car.Simulate(delta, roadPath);
		cp.car.Render();
		debug += formatSteeringNum(cp.car.dRate, cp.car.id);
	});
	$("#debug").html(debug);
	
	emitter.cullAll();

	if (emitter.lastCarEmitted() != null && new Date() - emitter.lastCarEmitted() < emitter.rate) return;
	
	emitter.TryEmit();
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
	//Limit number
	if (n > 99.9) n = 99.9;
	if (n < -99.9) n = -99.9;

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

function add() {
    max *= 2;
    init();
}

function pauseSim() {
    pause = !pause;
	lastTime = Date.now();
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

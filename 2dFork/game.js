//globals.js before this
//emitter.js before this
//car.js before this

function generateRoadPath() {
		var w = $(window).width();
		var h = $(window).height();
		for (var i = 0; i < h * 2; i += 30) {
			var x = Math.sin(-i / 80) * 300 + w / 2 - 3;
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

function addVirtualRoadNodes() {
    //Add more hinting for the cars, since I may have defined the roads simplistically (distant nodes).
    //Algorithm here just subdivides in half.  Repeat until satisfied.
    //TODO:  Not quite working on joins
    const C_maxDist = 70; //pixels
    var didSubdivide = false;
    roadNetwork.roads.forEach(r => {
        var nodeCopy = [];
        r.nodes.forEach((n, i) => {
            if (i > 0 || n.joins != undefined) { //Skip first node if not joining
                var nodePrev = {};
                if (i == 0)
                    nodePrev = roadNetwork.roads
                        .find(x => x.id == n.joins.roadId).nodes
                        .find(x => x.id == n.joins.nodeId);
                else
                    nodePrev = r.nodes[i - 1];
                var h = Math.hypot((nodePrev.x - n.x), (nodePrev.y - n.y));
                if (h > C_maxDist) {
                    var newNode = {
                        x: (nodePrev.x + n.x) / 2,
                        y: (nodePrev.y + n.y) / 2,
                        isVirtual: true
                    };
                    if (i == 0) {
                        newNode.joins = structuredClone(n.joins);
                        delete n.joins;
                    }
                    nodeCopy.push(newNode);
                    didSubdivide = true;
                }
            }
            nodeCopy.push(structuredClone(n)); //Copy original nodes
        });
        if (r.nodes[r.nodes.length - 1].joins != undefined) {
            //Subdivide connector to next road
            var n = r.nodes[r.nodes.length - 1];
            var nextRoadId = n.joins.roadId;
            var nextNodeId = n.joins.nodeId;
            var nodeNext = roadNetwork.roads.find(x => x.id == nextRoadId).nodes.find(x => x.id == nextNodeId);
            var h = Math.hypot((nodeNext.x - n.x), (nodeNext.y - n.y));
            if (h > C_maxDist) {
                var newNode = {
                    x: (nodeNext.x + n.x) / 2,
                    y: (nodeNext.y + n.y) / 2,
                    isVirtual: true,
                    joins: structuredClone(n.joins)
                };
                delete n.joins;
                nodeCopy.push(newNode);
                didSubdivide = true;
            }
        }
        r.nodes = nodeCopy;
    });
    if (didSubdivide) addVirtualRoadNodes(); //Run until all road nodes are sufficiently spaced
}

function renderRoad() {
    var svgBuffer = document.createElement("SVG");
    var svgMain = document.createElement("SVG");
    svgBuffer.setAttribute("class", "buffer");

    //Draw each road in network
    roadNetwork.roads.forEach(r => {
        //Need to make this:
        //<path d="M 32 0 L 64 64 L 32 64 L 64 128" stroke="black" fill="transparent" />
        var svgLineData = "M";
        r.nodes.forEach((n, i) => {
            if (i > 0) svgLineData += " L";
            svgLineData += " " + n.x + " " + n.y;
            if (n.joins != undefined) {
                var road = roadNetwork.roads.find(x => n.joins.roadId == x.id);
                var node = road.nodes.find(x => n.joins.nodeId == x.id);
                if (i == 0) {
                    //Add to beginning of road
                    svgLineData = "M" + node.x + " " + node.y + " L " + n.x + " " + n.y;
                } else if (i == r.nodes.length - 1) {
                    //Add to end of road
                    svgLineData += " L " + node.x + " " + node.y;
                }
            }
        });
        var pathElem = document.createElement("PATH");
        pathElem.setAttribute("d", svgLineData);
        pathElem.setAttribute("stroke", r.color);
        pathElem.setAttribute("title", r.comment);
        svgMain.appendChild(pathElem);

        //At bottom (under the roads and dots), draw the road width
        var bufferElem = document.createElement("PATH");
        bufferElem.setAttribute("d", svgLineData);
        svgBuffer.appendChild(bufferElem);
    });

    //Draw dot for each node (overtop the lines)
    roadNetwork.roads.forEach(r => {
        var foundFirstNonVirtualNode = false;
        r.nodes.forEach((n, i) => {
            var dotElem = document.createElement("CIRCLE");
            dotElem.setAttribute("cx", n.x);
            dotElem.setAttribute("cy", n.y);
            var r = 8;
            if (n.isVirtual != undefined) r = 3;
            dotElem.setAttribute("r", r);
            if (!foundFirstNonVirtualNode && n.isVirtual == undefined) {
                dotElem.classList.add("firstnode");
                foundFirstNonVirtualNode = true;
            }
            if (n.isVirtual != undefined) dotElem.classList.add("virtual");
            svgMain.appendChild(dotElem);
        });
    });

    document.getElementById("roadNetwork").innerHTML = 
        svgMain.outerHTML + svgBuffer.outerHTML; //Could not get this to render with append
}

function getNode(roadId, nodeId) {
    return roadNetwork.roads.find(x => x.id == roadId).nodes.find(x => x.id == nodeId);
}

function getNextNode(roadId, nodeId) {
    var road = roadNetwork.roads.find(x => x.id == roadId);
    var node = getNode(roadId, nodeId);
    var nodeIx = road.nodes.findIndex(x => x.id == nodeId);
    if (nodeIx < road.nodes.length - 1)
        return road.nodes[nodeIx + 1];
    if (node.join == undefined) return null; //Dead-end
    return getNode(node.join.roadId, node.join.nodeId);
}

function getPositionBehindNode(roadId, nodeId, distance) {
    //Useful for approaching a node or placing the emitter
    var node = getNode(roadId, nodeId);
    var nextNode = getNextNode(roadId, nodeId);
    var dir = Math.atan2(node.y - nextNode.y, node.x - nextNode.x);
    var newX = Math.cos(dir) * distance + node.x;
    var newY = Math.sin(dir) * distance + node.y;
    return { x: newX, y: newY, d: dir * 180 / Math.PI - 180 };
}

function putEmitterBehind(roadId, nodeId, distance) {
    var emitterPos = getPositionBehindNode(roadId, nodeId, distance);
    emitter.x = emitterPos.x;
    emitter.y = emitterPos.y;
    emitter.d = emitterPos.d;
    emitter.render();
}

function init() {
	//Init emitter
	emitter = new Emitter();
	emitter.constructor();
    if (typeof(roadNetwork.roads) === "undefined") {
        //v4.1
	    generateRoadPath();
	    drawRoad();
    } else {
        //v4.2
        addVirtualRoadNodes();
        renderRoad();
        emitter.TryEmit();
    }
    
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
    if (typeof(roadNetwork.roads) === "undefined") {
        //v4.1
        $("#slRate").on("input change", changeRate);
	    $("#slVelo").on("input change", changeVelo);
	    $("#slDir").on("input change", changeDir);
	    changeRate();
	    changeVelo();
	    changeDir();
	    lastTime = Date.now();
        step();
    } else {
        //v4.2
        putEmitterBehind(1, 1, 60); //roadId=6 for the off-screen-starting road
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
            if (!pause) cp.car.Simulate(delta, roadNetwork.roads[0].nodes);
        }
		cp.car.Render();
		debug += formatSteeringNum(cp.car.dTarget, cp.car.id);
	});
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

function add() {
    max *= 2;
    init();
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
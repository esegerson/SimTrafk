var fps = 60;
var max = 32;
var numCars = 0;
var lastTime = null;
var accel = 30;
var decel = accel * 4;

var Car = { id: 0,
            x: 0,
            y: 0,
            v: 0,
            maxV: 0,
            d: 0,
            dRate: 0,
            e: null,
            coolDown: 0,
            curAction: ''
};

var cars = new Array();

function init() {
    //Init cars
    var h = $(window).height();
    var w = $(window).width();
    for (var i = numCars; i < max; i++) {
        var e = "<div class='car'>" + i + "</div>";
        $("BODY").append(e);
        var c = Object.create(Car);
        c.id = i;
        c.e = $(".car:last-child");
        c.v = Math.random() * 150 + 20;
        //if (c.v > 150) c.v *= 1.5;
        c.maxV = c.v;
        //if (c.maxV > 200) $(c.e).addClass("hotrod");
        c.x = Math.random() * w * 2 / 3 + w / 6;
        c.y = Math.random() * h * 2 / 3 + h / 6;
        c.d = Math.random() * 360 - 180;
        c.dRate = Math.random() * 40 - 20;
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
    lastTime = Date.now();
    step();
});

function step() {
    var now = Date.now();
    var delta = now - lastTime;
    lastTime = now;
    simulate(delta);
    setTimeout(function() {
        window.requestAnimationFrame(step);
    }, 1000 / fps);
}

function simulate(delta) {
    var numAlive = 0;
    $.each(cars, function(i, car) {
        //Compute behavior
        if (car.v < 1) {
            car.v = 0;
            $(car.e).addClass("dead");
            car.curAction = '';
            return;
        }
        numAlive++;
        if (neighbors(car, 50).length > 0)
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
            .css("transform", "rotate(" + Math.round(car.d) + "deg)");
    });
    $("#spanAlive").html(numAlive + " driving");
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
            var h = Math.sqrt(Math.pow(Math.abs(car.x - c.x), 2) + Math.pow(Math.abs(car.y - c.y), 2));
            if (h < radius) rv.push(c);
        }
    }
    return rv;
}

function add() {
    max *= 2;
    init();
}

function reset() {
    max = 1;
    numCars = 1;
    cars = cars.splice(0,1);
    $(".car:not(:first)").remove();
    $("#btnAdd").html("Add " + max + " car" + ((max > 1) ? "s" : ""));
}
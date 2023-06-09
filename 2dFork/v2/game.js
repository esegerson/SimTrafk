var fps = 60;
var max = 512;
var numCars = 0;
var lastTime = null;

var Car = { id: 0,
            x: 0,
            y: 0,
            v: 0,
            d: 0,
            dRate: 0,
            e: null
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
        c.v = Math.random() * 100 + 20;
        c.x = Math.random() * (w - 32);
        c.y = Math.random() * (h - 16);
        c.d = 0;
        c.dRate = Math.random() * 40 - 20;
        if (i < 100) $(c.e).css("background-color", "#88f").css("z-index", "1");
        if (i < 10) $(c.e).css("background-color", "#8f8").css("z-index", "2");
        if (i < 1) $(c.e).css("background-color", "white").css("z-index", "3");
        cars.push(c);
    }
    numCars = max;
    $("#btnAdd").html("Add " + max + " cars");
}

$(function() {
    init();
    lastTime = Date.now();
    step();
});

function step() {
    var now = Date.now();
    var delta = now - lastTime;
    lastTime = now;
    $.each(cars, function(i, car) {
        car.d += car.dRate * delta / 1000;
        if (car.d < 0) car.d += 360;
        if (car.d > 360) car.d -= 360;
        car.x += Math.cos(car.d * Math.PI / 180) * car.v * delta / 1000;
        car.y += Math.sin(car.d * Math.PI / 180) * car.v * delta / 1000;
        $(car.e).css("left", Math.round(car.x))
            .css("top", Math.round(car.y))
            .css("transform", "rotate(" + Math.round(car.d) + "deg)");
    });
    var numAlive = cars.length;
    $("#spanAlive").html(numAlive + " driving");
    setTimeout(function() {
        window.requestAnimationFrame(step);
    }, 1000 / fps);
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
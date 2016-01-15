var fps = 60;
var max = 100;
var lastTime = null;
var Car = { id: 0,
            x: 0,
            y: 0,
            v: 0,
            e: null
};

var cars = new Array();

$(function() {
    //Init cars
    var h = $(window).height();
    for (var i = 0; i < max; i++) {
        var e = "<div class='car'>" + i + "</div>";
        $("BODY").append(e);
        var c = Object.create(Car);
        c.id = i;
        c.e = $(".car:last-child");
        c.v = Math.random() * 50 + 100;
        c.x = -i * 5 - 100;
        c.y = Math.random() * (h - 20);
        cars.push(c);
    }
    lastTime = Date.now();
    step();
});

function step() {
    var now = Date.now();
    var delta = now - lastTime;
    lastTime = now;
    $.each(cars, function(i, car) {
        var d = car.v * delta / 1000;
        car.x += d;
        $(car.e).css("left", Math.round(car.x)).css("top", Math.round(car.y));
    });
    setTimeout(function() {
        window.requestAnimationFrame(step);
    }, 1000 / fps);
}


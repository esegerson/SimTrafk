var fps = 60;
var max = 32;
var numCars = 0;
var lastTime = null;
var accel = 30;
var decel = accel * 4;

var carType = { 
    Subcompact : 0,
    Sedan : 1,
    SUV : 2,
    BoxTruck : 3
};

var driverActivity = {
    Nothing : 0,
    Accelerating : 1,
    Decelerating : 2
};

function chance(p) {
    return p >= Math.random();
}

//Constants & defaults
//                      Subcompact                  Sedan                       SUV                     BoxTruck
var C_weightSpreads =   [{min: 2000, max: 3000},    {min: 3000, max: 4000},     {min: 4000, max: 5000}, {min: 8000, max: 15000}]; //In pounds
var C_carSizes =        [{width: 3, length: 6},     {width : 4, length : 8},    {width: 5, length: 10}, {width: 7, length: 15}]; //In pounds
var C_horsepower =      [10,                        13,                         20,                     25]; //Made-up units
var C_defaultFuel = 1000;
var C_carTypeWeights =  [10,                        10,                         5,                      2]; //Weighted probability of type
var C_names = ["Ann", "Bob", "Chad", "Dory", "Eric", "Fran", "Gwen", "Hank", "Ian", "Jane", "Kate", "Larry", "Meg",
                "Nate", "Olive", "Pam", "Qix", "Ray", "Steve", "Tia", "Usa", "Viv", "Wyatt", "Xena", "Yanni", "Zoe"];
var C_namesTop200M = ["John", "William", "James", "George", "Charles", "Robert", "Joseph", "Frank", "Edward", "Thomas", 
    "Henry", "Walter", "Harry", "Willie", "Arthur", "Albert", "Clarence", "Fred", "Harold", "Paul", "Raymond", 
    "Richard", "Roy", "Joe", "Louis", "Carl", "Ralph", "Earl", "Jack", "Ernest", "David", "Samuel", "Howard", 
    "Charlie", "Francis", "Herbert", "Lawrence", "Theodore", "Alfred", "Andrew", "Elmer", "Sam", "Eugene", 
    "Leo", "Michael", "Lee", "Herman", "Anthony", "Daniel", "Leonard", "Floyd", "Donald", "Kenneth", "Jesse", 
    "Russell", "Clyde", "Oscar", "Peter", "Lester", "Leroy", "Ray", "Stanley", "Clifford", "Lewis", "Benjamin", 
    "Edwin", "Frederick", "Chester", "Claude", "Eddie", "Cecil", "Lloyd", "Jessie", "Martin", "Bernard", "Tom", 
    "Will", "Norman", "Edgar", "Harvey", "Ben", "Homer", "Luther", "Leon", "Melvin", "Philip", "Johnnie", "Jim", 
    "Milton", "Everett", "Allen", "Leslie", "Alvin", "Victor", "Marvin", "Stephen", "Alexander", "Jacob", "Hugh", 
    "Patrick", "Virgil", "Horace", "Glenn", "Oliver", "Morris", "Vernon", "Archie", "Julius", "Gerald", "Maurice", 
    "Sidney", "Marion", "Otis", "Vincent", "Guy", "Earnest", "Wilbur", "Gilbert", "Willard", "Ed", "Roosevelt", 
    "Hubert", "Manuel", "Warren", "Otto", "Alex", "Ira", "Wesley", "Curtis", "Wallace", "Lonnie", "Gordon", "Isaac", 
    "Jerry", "Charley", "Jose", "Nathan", "Max", "Mack", "Rufus", "Arnold", "Irving", "Percy", "Bill", "Dan", 
    "Willis", "Bennie", "Jimmie", "Orville", "Sylvester", "Rudolph", "Glen", "Nicholas", "Dewey", "Emil", "Roland", 
    "Steve", "Calvin", "Mike", "Johnie", "Bert", "August", "Clifton", "Franklin", "Matthew", "Emmett", "Phillip", 
    "Wayne", "Edmund", "Abraham", "Nathaniel", "Marshall", "Dave", "Elbert", "Clinton", "Felix", "Alton", "Ellis", 
    "Nelson", "Amos", "Clayton", "Aaron", "Perry", "Adam", "Tony", "Irvin", "Jake", "Dennis", "Jerome", "Mark", 
    "Cornelius", "Ollie", "Douglas", "Pete", "Ted", "Adolph", "Roger", "Jay", "Roscoe", "Juan"];
var C_namesTop200F = ["Mary", "Helen", "Margaret", "Anna", "Ruth", "Elizabeth", "Dorothy", "Marie", "Florence", 
    "Mildred", "Alice", "Ethel", "Lillian", "Gladys", "Edna", "Frances", "Rose", "Annie", "Grace", "Bertha", 
    "Emma", "Bessie", "Clara", "Hazel", "Irene", "Gertrude", "Louise", "Catherine", "Martha", "Mabel", "Pearl", 
    "Edith", "Esther", "Minnie", "Myrtle", "Ida", "Josephine", "Evelyn", "Elsie", "Eva", "Thelma", "Ruby", 
    "Agnes", "Sarah", "Viola", "Nellie", "Beatrice", "Julia", "Laura", "Lillie", "Lucille", "Ella", "Virginia", 
    "Mattie", "Pauline", "Carrie", "Alma", "Jessie", "Mae", "Lena", "Willie", "Katherine", "Blanche", "Hattie", 
    "Marion", "Lucy", "Stella", "Mamie", "Vera", "Cora", "Fannie", "Eleanor", "Bernice", "Jennie", "Ann", "Leona", 
    "Beulah", "Lula", "Rosa", "Ada", "Ellen", "Kathryn", "Maggie", "Doris", "Dora", "Betty", "Marguerite", "Violet", 
    "Lois", "Daisy", "Anne", "Sadie", "Susie", "Nora", "Georgia", "Maude", "Marjorie", "Opal", "Hilda", "Velma", 
    "Emily", "Theresa", "Charlotte", "Inez", "Olive", "Flora", "Della", "Lola", "Jean", "Effie", "Nancy", "Nettie", 
    "Sylvia", "May", "Lottie", "Alberta", "Eunice", "Sallie", "Katie", "Genevieve", "Estelle", "Lydia", "Loretta", 
    "Mable", "Goldie", "Eula", "Rosie", "Lizzie", "Vivian", "Verna", "Ollie", "Harriet", "Lucile", "Addie", "Marian", 
    "Henrietta", "Jane", "Lela", "Essie", "Caroline", "Ora", "Iva", "Sara", "Maria", "Madeline", "Rebecca", "Wilma", 
    "Etta", "Barbara", "Rachel", "Kathleen", "Irma", "Christine", "Geneva", "Sophie", "Juanita", "Nina", "Naomi", 
    "Victoria", "Amelia", "Erma", "Mollie", "Susan", "Flossie", "Ola", "Nannie", "Norma", "Sally", "Olga", "Alta", 
    "Estella", "Celia", "Freda", "Isabel", "Amanda", "Frieda", "Luella", "Matilda", "Janie", "Fern", "Cecelia", 
    "Audrey", "Winifred", "Elva", "Ina", "Adeline", "Leola", "Hannah", "Geraldine", "Amy", "Allie", "Miriam", 
    "Isabelle", "Bonnie", "Virgie", "Sophia", "Cleo", "Jeanette", "Nell", "Eliza"];

function Driver() {
    //Methods
    this.Accelerate = function(power, delta) {
        this.curActivity = driverActivity.Accelerating;
        this.Car.Accelerate(power, delta);
    };

    this.Decelerate = function(power, delta) {
        this.curActivity = driverActivity.Decelerating;
        this.Car.Decelerate(power, delta);
    };

    //Properties
    this.id = 0;
    this.Car = null; //Pointer to parent object
    this.isMale = Math.random() < 0.5;
    this.name = this.isMale ? 
        C_namesTop200M[Math.floor(Math.random() * C_namesTop200M.length)] : 
        C_namesTop200F[Math.floor(Math.random() * C_namesTop200F.length)]; //C_names[Math.floor(Math.random() * C_names.length)];
    this.age = Math.floor(Math.random() * (100 - 15) + 15); //15-99
    this.reaction = Math.floor(Math.random() * 10); //0 (computer-perfect) to 9 (incapacitated)
    this.intelligence = Math.floor(Math.random() * 10); //0 (stupid) to 9 (computer-perfect genius)
    this.aggressiveness = Math.floor(Math.random() * 10); //0 (timid, cowed) to 9 (fast accel/decel, tailgaiting, weaving, selfish, zero margin of error)
    this.vision = Math.floor(Math.random() * 10); //0 (blind) to 9 (road segments distant)
    this.pRubbernecker = Math.random(); //0 (never) to 1 (always), slows around accidents
    this.pCellPhone = Math.random(); //0 (never) to 1 (always), periods of distracted driving
    this.pSoccerMom = Math.random(); //0 (never) to 1 (total stereotype), changes agendas often, erratic behavior, different from aggressiveness
    this.pHeartAttack = Math.random() * 0.001; //Never to rare, driver goes unresponsive (maintains speed, drifts)
    
    //Time-sensitive variables
    this.isRubbernecking = false;
    this.isUsingCellPhone = chance(this.pCellPhone);
    this.isSoccerMom = chance(this.pSoccerMom);
    this.isHavingHeartAttack = chance(this.pHeartAttack);
    this.curActivity = driverActivity.Nothing;
};


function Car() { 
    //Methods
    this._pickRandomCarType = function() {
        var _maxWeights = 0; C_carTypeWeights.forEach(function(e, i, a) { _maxWeights += e; });
        var _r = Math.floor(Math.random() * _maxWeights);
        var _t = 0;
        var _i = 0;
        var rv = 0;
        C_carTypeWeights.some(function(e) {
            _t += e;
            if (_t > _r) { rv = _i; return true; }
            _i++;
        });
        return rv;
    };

    this._pickRandomColor = function() {
        //Returns a hex color string ("#abc").  Uses CSS color shorthand.  Digits range between A and D (a lightish, dusty color), 64 unique colors
        var _r = [Math.floor(Math.random() * 4 + 10), Math.floor(Math.random() * 4 + 10), Math.floor(Math.random() * 4 + 10)];
        return "#" + _r[0].toString(16) + _r[1].toString(16) + _r[2].toString(16);
    };
    
    this.Accelerate = function(power, delta) {
        this.v += this.maxAccel * power * delta;
    };

    this.Decelerate = function(power, delta) {
        this.v -= this.maxDecel * power * delta;
    };

    //Properties
    this.id = 0;
    this.e = null; //DOM element for rendering
    this.color = this._pickRandomColor();
    this.type = this._pickRandomCarType();
    this.weight = Math.floor(Math.random() * (C_weightSpreads[this.type].max - C_weightSpreads[this.type].min) + C_weightSpreads[this.type].min);
    this.width = C_carSizes[this.type].width;
    this.height = C_carSizes[this.type].height;
    this.fuelLevel = C_defaultFuel;
    this.driver = new Driver();
    this.driver.Car = this;
    this.horsepower = C_horsepower[this.type];
    this.horseMultiplier = Math.random() * 0.4 - 0.2; //Plus or minus 20% (variances of engines)
    this.maxAccel = function() { return this.weight / (this.horsepower * this.horseMultiplier); };
    this.brakepower = this.horsepower * 1.5; //Can brake faster than can accelerate
    this.brakeMultiplier = Math.random() * 0.4 - 0.2; //Plus or minus 20% (variances of brakes)
    this.maxDecel = function() { return this.weight / (this.brakepower * this.brakeMultiplier); };
    this.turnRadius = Math.floor(Math.random() * 10 + 1); //1 for motorcycles, 10 for 18 wheelers
    
    //Rules
    this.maxV = 0;
    this.dRate = 0;

    //Time-sensitive stuff
    this.x = 0;
    this.y = 0;
    this.v = 0;
    this.d = 0;
    this.coolDown = 0;
    this.curAction = driverActivity.Nothing;
};


var cars = new Array();

function init() {
    //Init cars
    var h = $(window).height();
    var w = $(window).width();
    for (var i = numCars; i < max; i++) {
        var e = "<div class='car'>" + i + "</div>";
        $("BODY").append(e);
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
    lastTime = Date.now();
    step();
});

function step() {
    var now = Date.now();
    var delta = now - lastTime;
    lastTime = now;
    //if (delta > 2000) delta = 1000 / fps; //More than two seconds, treat it as a "pause" rather than lag
    simulate(delta);
    setTimeout(function() {
        window.requestAnimationFrame(step);
    }, 1000 / fps);
}

function simulate(delta) {
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
            .css("transform", "rotate(" + Math.round(car.d) + "deg)");
        if (car.maxV > 200) $(car.e).addClass("hotrod");
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

function reset() {
    max = 1;
    numCars = 1;
    cars = cars.splice(0,1);
    $(".car:not(:first)").remove();
    $("#btnAdd").html("Add " + max + " car" + ((max > 1) ? "s" : ""));
}

function car_click(e) {
    var id = $(e.target).html();
    var c = cars[id];
    c.maxV *= 2;
    if (c.v == 0) {
        $(c.e).removeClass("dead").removeClass("brake");
        c.v = c.maxV / 4;
        c.coolDown = 5;
    }
}
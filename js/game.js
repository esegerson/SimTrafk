var canvas;

function resize() {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	
	var ctx = canvas.getContext("2d");
	var centerX = canvas.width / 2;
	var centerY = canvas.height / 3;
	
	//Make title
	ctx.rect(0, 0, canvas.width, canvas.height);
	var grd = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, centerX);
    grd.addColorStop(0, "#aaf");
	grd.addColorStop(1, "white");
	ctx.fillStyle = grd;
	ctx.fill();
	var titleImg = new Image();
	titleImg.onload = function() { ctx.drawImage(titleImg, centerX - 140, centerY - 62); };
	titleImg.src = "images/title.png";
	ctx.font = "410% Play";
	ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
	ctx.shadowBlur = "2";
	ctx.fillStyle = "white";
	ctx.textAlign = "center";
	//ctx.fillText("SimTrafk", centerX, centerY);
	ctx.font = "90% Play";
	ctx.fillText("a traffic simulator game by Eric Segerson", centerX, centerY + 15);
	ctx.font = "70% Play";
	ctx.fillText("0.1", centerX + 145, centerY);
	
	drawTestTrack(ctx, centerX, centerY);
}

function drawShape(ctx, xoff, yoff) { //This is from a tool, linked below
	ctx.beginPath();
	ctx.moveTo(6 + xoff, 225 + yoff);
	ctx.bezierCurveTo(68 + xoff, 192 + yoff, 136 + xoff, 152 + yoff, 176 + xoff, 179 + yoff);
	ctx.bezierCurveTo(214 + xoff, 205 + yoff, 176 + xoff, 306 + yoff, 274 + xoff, 316 + yoff);
	ctx.bezierCurveTo(364 + xoff, 325 + yoff, 342 + xoff, 214 + yoff, 395 + xoff, 180 + yoff);
	ctx.bezierCurveTo(452 + xoff, 143 + yoff, 493 + xoff, 216 + yoff, 584 + xoff, 202 + yoff);
	ctx.stroke();
}

function drawTestTrack(ctx, centerX, centerY) {
	//This chunk of code makes a 4-lane, curvy road, two lanes each way, with dashed white lines and solid yellow double-lines

      
	//Draw the shape
	drawShape(ctx, centerX - 280, centerY - 100);

	//The pavement
	ctx.lineWidth = 50;
	ctx.strokeStyle = '#444';
	ctx.stroke(); 

	//The white dashed lines
	ctx.lineWidth = 28;
	ctx.strokeStyle = "#eee";
	ctx.setLineDash([10]);
	ctx.lineDashOffset = 5;
	ctx.stroke();
	ctx.lineWidth = 24;
	ctx.strokeStyle = "#444";
	ctx.setLineDash([0]);
	ctx.stroke();

	//The yellow line
	ctx.lineWidth = 5;
	ctx.strokeStyle = "#dd2";
	ctx.getLineDash();
	ctx.stroke(); 

	//The division between the yellow lines (makes it double)
	ctx.lineWidth = 2;
	ctx.strokeStyle = "#444";
	ctx.stroke(); 
}

window.requestAnimFrame = (function(callback) {
	return window.requestAnimationFrame 
		|| window.webkitRequestAnimationFrame 
		|| window.mozRequestAnimationFrame 
		|| window.oRequestAnimationFrame 
		|| window.msRequestAnimationFrame ||
		function(callback) {
			window.setTimeout(callback, 1000 / 60);
		};
})();

function drawCar(ctx) {
	var carImg = new Image();
	carImg.onload = function() { ctx.drawImage(carImg, cX, 400); };
	carImg.src = "images/car0.png";
}

function animateCar(ctx, startTime) {
	var time = (new Date()).getTime() - startTime;
	var linearSpeed = 100; //pixels per second
	var newX = linearSpeed * time / 1000;
	if (newX < 2000) cX = newX; else cX = -300;
	ctx.clearRect(cX, 400, cX + 128, 400 + 256);
	resize(); //Clear
	requestAnimFrame(function() {
		animateCar(ctx, startTime);
	});
}

function launchIntoFullscreen(element) {
	if (element.requestFullscreen) {
		element.requestFullscreen();
	} else if(element.mozRequestFullScreen) {
		element.mozRequestFullScreen();
	} else if(element.webkitRequestFullscreen) {
		element.webkitRequestFullscreen();
	} else if(element.msRequestFullscreen) {
		element.msRequestFullscreen();
	}
}

var carType = { 
	Subcompact : 0,
	Sedan : 1,
	SUV : 2,
	BoxTruck : 3
};

//Constants & defaults
//						Subcompact					Sedan						SUV						BoxTruck
var C_weightSpreads = 	[{min: 2000, max: 3000}, 	{min: 3000, max: 4000}, 	{min: 4000, max: 5000}, {min: 8000, max: 15000}]; //In pounds
var C_carSizes =		[{width: 3, length: 6}, 	{width : 4, length : 8}, 	{width: 5, length: 10}, {width: 7, length: 15}]; //In pounds
var C_horsepower = 		[10,						13,							20,						25]; //Made-up units
var C_defaultFuel = 1000;
var C_carTypeWeights = 	[10,						10,							5,						2]; //Weighted probability of type
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

//Other globals
var driverIdInc = 0;

function chance(p) {
	return p >= Math.random();
}
				
//Set up driver, prototype object
var Driver = function() {
	this.id = driverIdInc++;
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
};

//Set up test car, prototype object
var Car = function() {
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
	
	this.color = this._pickRandomColor();
	this.type = this._pickRandomCarType();
	this.weight = Math.floor(Math.random() * (C_weightSpreads[this.type].max - C_weightSpreads[this.type].min) + C_weightSpreads[this.type].min);
	this.width = C_carSizes[this.type].width;
	this.length = C_carSizes[this.type].length;
	this.fuelLevel = C_defaultFuel;
	this.driver = new Driver();
	this.horsepower = C_horsepower[this.type];
	this.horseMultiplier = Math.random() * 0.4 - 0.2; //Plus or minus 20% (variances of engines)
	this.maxAccel = function() { return this.weight / (this.horsepower * this.horseMultiplier); };
	this.brakepower = this.horsepower * 1.5; //Can brake faster than can accelerate
	this.brakeMultiplier = Math.random() * 0.4 - 0.2; //Plus or minus 20% (variances of brakes)
	this.maxDecel = function() { return this.weight / (this.brakepower * this.brakeMultiplier); };
	this.turnRadius = Math.floor(Math.random() * 10 + 1); //1 for motorcycles, 10 for 18 wheelers
	
	//Time-sensitive info
	this.x = 0; //Horizontal position on screen, positive is rightward (in feet, not pixels)
	this.y = 0; //Vertical position on screen, positive is downward (in feet, not pixels)
	this.d = 0; //Direction, radians, 0 = "right", positive is counter-clockwise
	this.v = 0; //Velocity (speed, in feet per second)
	this.a = 0; //Current acceleration (positive or negative, in feet per second squared)
	this.t = 0; //Current turning operation (positive or negative, in radians per second)
};

var car = new Car();

var cX = 0;

function animCar2(o, startTime) {
	var time = (new Date()).getTime() - startTime;
	var linearSpeed = 300; //px per sec
	var newX = linearSpeed * time / 1000;
	if (newX < 3000) cX = newX; else { cX = 0; startTime = (new Date()).getTime(); }
	$(o).css("left", (cX - 1000) + "px");
	requestAnimFrame(function() { animCar2(o, startTime); });
}


$(function() {
	//On Load
	canvas = document.getElementById("canvas");
	
	//Rig events
	$(window).resize(resize);
	//$(canvas).click(function() { launchIntoFullscreen(canvas); });
	resize();
	//animateCar(canvas.getContext("2d"), (new Date()).getTime());
	animCar2($("IMG#car0"), (new Date()).getTime());
	
	
});
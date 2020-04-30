//globals.js before this

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
	this.constructor = function(i, x, y, d, v) {
		var el = $("<div class='car'>" + i + "</div>");
        this.e = $("#cars").append(el).find(".car:last-child");
		this.id = i;
        $(this.e).data("carId", i);
		$(this.e).click(car_click);
        this.v = v + Math.random() * v - v / 2;
        this.maxV = this.v;
        this.x = Math.random() * 6 + x - 3;
        this.y = y + Math.random() * 6 - 3 + 8; //+8 for unknown reasons except it lines up the car with the emitter pointer
        this.d = d + Math.random() * 4 - 2;
        this.dRate = 0;
        //$(this.e).css("background-color", c.color);
        if (i < 100) $(this.e).css("background-color", "#88f").css("z-index", "1");
        if (i < 10) $(this.e).css("background-color", "#8f8").css("z-index", "2");
        if (i < 1) $(this.e).css("background-color", "white").css("z-index", "3");
	}
	
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
	
	this.Simulate = function(delta, road) {
		var t = this.GetTarget(road); //This will change the target down the road
		this.TurnTo(t.x, t.y, delta); //This will change this.dRate to steer toward the road
		this.d += this.dRate * (this.v / 50) * (delta / 1000);
        if (this.d < 0) this.d += 360;
        if (this.d > 360) this.d -= 360;
        this.x += Math.cos(this.d * Math.PI / 180) * this.v * delta / 1000;
        this.y += Math.sin(this.d * Math.PI / 180) * this.v * delta / 1000;
	}
	
	this.Render = function() {
		$(this.e).css("left", Math.round(this.x) - 16) //-16 for half-length of car
            .css("top", Math.round(this.y) - 8) //-8 for half-width of car
            .css("transform", "rotate(" + Math.round(this.d) + "deg)")
			.attr("title", this.driver.name);
        if (this.maxV > 200) $(this.e).addClass("hotrod");
	}
	
	this.GetTarget = function(road) {
		//road is an array of {x,y}
		var curTarget = road[this.curRoadTargetIndex];
		var dist = this.DistanceTo(curTarget.x, curTarget.y);
		var lookAheadDist = this.v / 2 * 3;
		if (lookAheadDist < 30) lookAheadDist = 30;
		if (dist < lookAheadDist && this.curRoadTargetIndex < road.length - 1) this.curRoadTargetIndex++;
		return road[this.curRoadTargetIndex];
	}
	
	this.DistanceTo = function(x, y) {
		var dist = Math.sqrt(Math.pow(this.x - x, 2) + Math.pow(this.y - y, 2)); //Pythag
		return dist;
	}
	
	this.TurnTo = function(x, y, delta) {
		//If car is at (0, 0) and pointed at angle 0 and target is at (100, 10), then target angle = ~10 deg.
		//This will be a simple algorithm.  Given the car's turning radius, it's possible to get stuck circling
		//a target forever.  This algorithm does not care if that happens.
		
		//absAng is the angle between positive-x axis and the target, sweeping clockwise
		var absAng = Math.atan2(y - this.y, x - this.x) * 180 / Math.PI;
		
		//Correct absAng so it sweeps CCW from positive-x axis to the target (the "normal" way)
		absAng = 360 - absAng;
		if (absAng > 180) absAng -= 360;
		if (absAng < -180) absAng += 360;
		
		//Change absAng to local coordintes (with 0deg pointing straight forward from car's direction, degrees increasing clockwise)
		var localAng = -(absAng + this.d);
		if (localAng > 180) localAng -= 360;
		if (localAng < -180) localAng += 360;
		
		//Overturn a bit, otherwise will never hit target
		var requestTurnRate = localAng * 2;
		if (requestTurnRate > 90) requestTurnRate = 90 * Math.abs(requestTurnRate) / requestTurnRate;
		
		this.dRate = this.getTurnRate(requestTurnRate, delta);
		return localAng;
	}
	
	this.getTurnRate = function(requestDRate, delta) {
		//Returns dRate dependant on v
		//The faster you go, the slower you can turn
		//if v = 10 then dRate = 10
		//if v = 100 then dRate = 1
		//Also, if prior dRate was -10 and requestDRate is 10, can't jerk the wheel instantly 
		//from one side to the other:  limit to dRateJerkMax
		var curDRate = this.dRate;
		var maxDRate = 3000 / this.v; //This number/equation "feels" right with various speeds
		var dRateJerkMax = this.v / 10; //How quickly the steering wheel is being turned
		if (dRateJerkMax < 5) dRateJerkMax = 5;
		var sign = Math.abs(requestDRate) / requestDRate;
		if (Math.abs(requestDRate) > maxDRate) requestDRate = maxDRate * sign;
		
		//"Turn" the wheel at a certain speed
		var dif = requestDRate - curDRate;
		if (Math.abs(dif) > dRateJerkMax) 
			requestDRate = curDRate + dRateJerkMax * delta / 1000 * sign;
		//if (requestDRate > 20) console.log(this.dRate + " " + curDRate + " " + requestDRate + " " + dRateJerkMax);
		return requestDRate;
	}
	
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
	this.curRoadTargetIndex = 0;
    
    //Rules
    this.maxV = 0;
    this.dRate = 0; //How much the steering wheel is turned

    //Time-sensitive stuff
    this.x = 0;
    this.y = 0;
    this.v = 0;
    this.d = 0; //degrees, 0-360
    this.coolDown = 0;
    this.curAction = driverActivity.Nothing;
};
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
        C_namesTop200F[Math.floor(Math.random() * C_namesTop200F.length)];
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
	this.constructor = function(i, x, y, d, v, curTarg) {
        //i = ID, x,y = position coordinates, d = direction (degrees), v = velocity
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
        this.target = curTarg;
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
        this.v -= this.maxDecel() * power * delta;
    };
	
	this.Simulate = function(delta) {
        //delta = time since last simulation step
        
		this.target = this.GetTarget(); //This will change the target down the road
		this.dTarget = this.GetTargetAngle(); //Ranges from -180 to 180 with 0 pointing "forward" and -90 = "left side"

        if (this.target != null) {
		    this.TurnTo(this.target.x, this.target.y, delta); //This will change this.dRate to steer toward the road
		    //this.dRate += 0.01 * delta;

            //this.Decelerate(1, delta);

            this.d += this.dRate * (this.v / 50) * (delta / 1000);
            if (this.d < 0) this.d += 360;
            if (this.d > 360) this.d -= 360;
        }		
		
        this.x += Math.cos(this.d * Math.PI / 180) * this.v * delta / 1000;
        this.y += Math.sin(this.d * Math.PI / 180) * this.v * delta / 1000;
	}
	
	this.GetTargetAngle = function() {
        //Return angle in degrees ranging from -180 to 180
        //with 0 pointing "forward", -90 pointing "left" and 90 pointing "right".
        if (this.target == null) return null;
		var deg = angleFromCoords(this.x, this.y, this.target.x, this.target.y);

		//Convert to local (so 0deg faces "forward")
		deg -= this.d; 
		
		if (deg > 180) deg -= 360;
		if (deg < -180) deg += 360;
		return deg;
	}
	
	this.Render = function() {
        //if (this.target == undefined) return; //May be if in slow mode
		$(this.e).css("left", Math.round(this.x) - 16) //-16 for half-length of car
            .css("top", Math.round(this.y) - 8) //-8 for half-width of car
            .css("transform", "rotate(" + Math.round(this.d) + "deg)")
			.attr("title", this.driver.name);
        if (this.maxV > 200) $(this.e).addClass("hotrod");
		
		//Draw extra SVG info
        if (this.target != null) {
            var x1 = Math.round(this.x);
            var y1 = Math.round(this.y);
            var x2 = Math.round(this.target.x);
            var y2 = Math.round(this.target.y);
            
            var d1 = -this.d - 90; //Start of arc is in front of car
            var d2 = -this.d - this.dTarget - 90; //End of arc is at red line to target
            
            var target = "<line class='targ' x1='" + x1 + "' y1='" + y1 + "' x2='" + x2 + "' y2='" + y2 + "' />";
            var steeringTarget = "<path class='steer' d='" + describeArc(x1, y1, 40, d1, d2) + "' />";
            var svg = "<svg id='svg" + this.id + "' class='cardebug'>" + target + steeringTarget + "</svg>";
            if ($("BODY > svg#svg" + this.id).length == 0)
                $("BODY").append(svg);
            else
                $("BODY > svg#svg" + this.id).replaceWith(svg);
        }
		
        //Add some text debugging data
        if ($("#dbg" + this.id).length == 0)
			$("BODY > DIV#cars").append("<div id='dbg" + this.id + "' class='carExtra'></div>");
		var debugText = "<b>" + this.driver.name + "</b>"
            + "<br>d=" + this.d.toFixed(0) 
            + "<br>dTarget=" + (this.dTarget == null ? "" : this.dTarget.toFixed(0))
            + "<br>dRate=" + this.dRate.toFixed(0);
        $("#dbg" + this.id).html(debugText).css("top", this.y + 20).css("left", this.x + 20);

        //Draw turn circle
        //Turn circle is based on dRate.  
        //dRate=0 is a straight line (infinite radius).  
        //Don't draw circles with radius greater than 1000
        //Circle center point will be somewhere along line +/-90deg from direction of car
        //dRate < 0 = turn left, dRate > 0 = turn right
        //Eyeball, dRate=30 = ~3 car lengths radius.  Car length = 32px
        //If dRate=30 = r=50, then dRate=15 = r=100 and dRate=5 = r=300 and dRate=60 = r=25
        //That matches the equation:  r=30*50/dRate
        svg = document.getElementById("svg" + this.id);
        var dRateTest = this.dRate;
        if (Math.abs(dRateTest) > 0.0001) {
            var sign = Math.abs(dRateTest) / dRateTest;
            const factor = 2865; //Magic number based on various observations (varying dRate and v)
            var r = Math.abs(factor / dRateTest);
            if (Math.abs(r) < 1000) {
                var g = -90 * sign - this.d; //Perpendicular to local direction
                var cx = Math.cos(g * Math.PI / 180) * r + this.x;
                var cy = -Math.sin(g * Math.PI / 180) * r + this.y;
                var turnCircle = "<circle r='" + r + "' cx='" + cx + "' cy='" + cy + "' class='turnCircle'></circle>";
                var turnCircleCenter = "<circle r='1' cx='" + cx + "' cy='" + cy + "' class='turnCircle'></circle>";
                svg.innerHTML = svg.innerHTML + turnCircle + turnCircleCenter;
            }
        }
	}

    this.GetTarget = function() {
        if (this.target == null) return null;
        var dist = this.DistanceTo(this.target.x, this.target.y);
        var lookAheadDist = this.v / 2;
        if (lookAheadDist < 30) lookAheadDist = 30;
        if (dist < lookAheadDist) {
            //Get next node (which may be on another road)
            var i = Math.floor(Math.random() * this.target.nextList.length);
            this.target = this.target.nextList[i];
        }
        return this.target;
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
		
		//Change absAng to local coordinates (with 0deg pointing straight forward from car's direction, degrees increasing clockwise)
		var localAng = -(absAng + this.d);
		if (localAng > 180) localAng -= 360;
		if (localAng < -180) localAng += 360;
		
		//Overturn a bit, otherwise will never hit target
		var requestTurnRate = localAng * 2;
		if (requestTurnRate > 90) requestTurnRate = 90 * Math.abs(requestTurnRate) / requestTurnRate;
		
		this.dRate = this.getTurnRate(requestTurnRate, delta);
		this.dTarget = localAng;
		return localAng;
	}
	
	this.getTurnRate = function(requestDRate, delta) {
		//4.0 rules:  dRateMax is dependant on v:  the faster you go, the slower the turn rate.  This is stupid.
		//4.1 rules:  dRateMax is a constant now, not dependant on v.
		//Also, dRateJerkMax is dumb.  
		//Remember:  dRate = the speed at which the wheel is turning.  
        //Nope:  dRate is how much the wheel has turned.  Something else represents the delta-dRate.
		//dRateJerk = the change, which is practically infinity:  anybody can be turning left and instantly start turning right.
		//Might still keep dRateJerkMax just to round off hard edges, though.
        //v4.0:  This function produced a wavy, oscillating motion of oversteering and correction, ending with
        //spinning in spot.  For example, if target is at 90deg (right side), slowly start turning the wheel
        //to the right.  When the car is pointed directly at the target, the wheel is torqued way to the right
        //so takes time to get it back to neutral, at which point the target is way to the left, so repeat.
        //v4.1:  Anticipate oversteering, start "un-steering" when target angle is getting small.
		
        //v4.1: But how do I do that?
        //      Maybe cap dRate as less than dTarget?
        //      Also, this is the steering wheel which has a max.

        //v4.1: No human makes 60 course corrections per second (the framerate of this sim).
        //      Give course corrections a 1 second cooldown (similar to human reaction times).
        //      That means after issuing a requestedDRate, can't change that for 60 frames.
        //      Meanwhile, can move the steering wheel toward that target (slowly or quickly).

        //Also, let's talk about moving a steering wheel.  To make a sharp turn, isn't it normal 
        //to twist the wheel some amount, hold it for a short time, then turn it back past zero a bit,
        //then turn it slowly back to zero (oversteer a bit)?

		//Get the basics down
		var dRateMax = 3; //Units unknown, produces a "peppy" but realistic turn rate
		var curDRate = this.dRate;
		var dRateJerkMax = 0.1; //How quickly the steering wheel is being turned
		var sign = Math.abs(requestDRate) / requestDRate; //Either +1 or -1
		
		//Apply rules
		if (Math.abs(requestDRate) > dRateMax) requestDRate = dRateMax * sign * delta;
		//requestDRate = curDRate + requestDRate * dRateJerkMax;
		
		//"Turn" the wheel at a certain speed
		var dif = requestDRate - curDRate;
		//if (requestDRate > 20) console.log(this.dRate + " " + curDRate + " " + requestDRate + " " + dRateJerkMax);
		//if (dif > dRateMax) requestDRate = curDRate + dRateMax;
		
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
	this.target = null;
    
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
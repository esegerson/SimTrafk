//globals.js before this
//driver.js after this

sim.Car = class {
    eCar; //DOM element representing the render of this car (the "shoe")
    eDebug; //DOM element for debugging box
    eSVG; //DOM element for SVG details
    id;
    v; //Velocity, in px/sec
    maxV;
    x;
    y;
    d; //Direction car is facing, in degrees.  0=right, 90=down
    dRate;
    target; //Reference to road network node, which has an (x,y)
    driver; //Reference to the driver of the car
    _createdTime;

    /**
     * Initialize a car. x,y,d,v,curTarg set by emitter.
     * @param {Driver} driver - Reference to driver of car
     * @param {int} id - Unique numeric identifier of car
     * @param {*} x - X position
     * @param {*} y - Y position
     * @param {*} d - direction, in degrees. 0=right, 90=down
     * @param {*} v - velocity, in px/sec
     * @param {*} curTarg - where to aim for, a reference to a road network node
     */
    constructor(driver, x, y, d, v, curTarg) {
        this.driver = driver;
        this.id = this.driver.id;
        this.x = x + Math.random() * 6 - 3;
        this.y = y + Math.random() * 6 - 3 + 8; //+8 for unknown reasons except it lines up the car with the emitter pointer
        this.d = d + Math.random() * 4 - 2;
        this.maxV = v + Math.random() * v - v / 2;
        this.v = this.maxV; //Init going max speed
        this.dRate = 0;
        this.target = curTarg;
        this.ensureInDom(); //This initializes this.eCar, this.eDebug, and this.eSVG
        if (this.id < 100) this.eCar.style.backgroundColor = "#88f"; //blue
        if (this.id < 10) this.eCar.style.backgroundColor = "#8f8"; //green
        if (this.id < 1) this.eCar.style.backgroundColor = "white"; //otherwise, default blue

        //Other properties
        this.color = this._pickRandomColor();
        this.type = this._pickRandomCarType();
        this.weight = sim.randomInt(sim.carData.C_weightSpreads[this.type].max, sim.carData.C_weightSpreads[this.type].min);
        this.width = sim.carData.C_carSizes[this.type].width;
        this.height = sim.carData.C_carSizes[this.type].height;
        this.fuelLevel = sim.carData.C_defaultFuel;
        this.horsepower = sim.carData.C_horsepower[this.type];
        this.horseMultiplier = Math.random() * 0.4 - 0.2; //Plus or minus 20% (variances of engines)
        this.maxAccel = function() { return this.weight / (this.horsepower * this.horseMultiplier); };
        this.brakepower = this.horsepower * 1.5; //Can brake faster than can accelerate
        this.brakeMultiplier = Math.random() * 0.4 - 0.2; //Plus or minus 20% (variances of brakes)
        this.maxDecel = function() { return this.weight / (this.brakepower * this.brakeMultiplier); };
        this.turnRadius = sim.randomInt(11, 1); //1 for motorcycles, 10 for 18 wheelers
        this.coolDown = 0;
        this.curAction = sim.carData.driverActivity.Nothing;
        this._createdTime = new Date();
	}

    ensureInDom = function() {
		if (sim.isNull(this.eCar)) {
            //Build eCar and put in #carShoes
			this.eCar = document.createElement("DIV");
			this.eCar.classList.add("car");
            this.eCar.setAttribute("data-id", this.id);
            this.eCar.innerText = this.id;
            this.eCar.title = this.driver.name;
            // ? Add click event?
			let c = document.getElementById("carShoes");
			c.appendChild(this.eCar);

            //Build eDebug and put in #carDebugBox
            this.eDebug = document.createElement("DIV");
            this.eDebug.classList.add("carDebug");
            this.eDebug.setAttribute("data-id", this.id);
            this.eDebug.innerHTML = "<b>" + this.driver.name + "</b>";
            c = document.getElementById("carDebugBox");
            c.appendChild(this.eDebug);

            //Build eSVG and put in #carSVG
            this.eSVG = document.createElement("svg");
            this.eSVG.setAttribute("data-id", this.id);
            c = document.getElementById("carSVG");
            c.appendChild(this.eSVG);
		}
	}

    /**
     * Draw the car on screen.  Draws the "shoe", the debug box, and additional details with SVG
     */
	render = function() {
        /*  Car rendering is done in several layers, from top to bottom:
                1. Basic car rendering (the "shoe")
                2. Debug box that follows the car (the dark-gray square)
                3. Debug scalar vector graphics (red target line, blue turn arc, gray turn circle & centerpoint)
        */

        //1. Basic car rendering
        this.eCar.style.left = Math.round(this.x) - 16 + "px"; //-16 for half-length of car
        this.eCar.style.top = Math.round(this.y) - 8 + "px"; //-8 for half-width of car
        this.eCar.style.transform = "rotate(" + Math.round(this.d) + "deg";
        if (this.maxV > 200) this.e.classList.add("hotrod");

		
		//Draw extra SVG info
        if (this.target != null) {
            let x1 = Math.round(this.x);
            let y1 = Math.round(this.y);
            let x2 = Math.round(this.target.x);
            let y2 = Math.round(this.target.y);
            
            let d1 = -this.d - 90; //Start of arc is in front of car
            let d2 = -this.d - this.dTarget - 90; //End of arc is at red line to target
            
            let target = "<line class='targ' x1='" + x1 + "' y1='" + y1 + "' x2='" + x2 + "' y2='" + y2 + "' />";
            let steeringTarget = "<path class='steer' d='" + describeArc(x1, y1, 40, d1, d2) + "' />";
            let svg = "<svg id='svg" + this.id + "' class='cardebug'>" + target + steeringTarget + "</svg>";
            this.eSVG.innerHTML = svg;
        }
		
        //Add some text debugging data
        let debugText = "<b>" + this.driver.name + "</b>"
            + "<br>v=" + this.v.toFixed(0) + " (" + sim.getMph(this.v) + " mph)"
            + "<br>d=" + this.d.toFixed(0) 
            + "<br>dTarget=" + (this.dTarget == null ? "" : this.dTarget.toFixed(0))
            + "<br>dRate=" + this.dRate.toFixed(0);
        this.eDebug.innerHTML = debugText;
        this.eDebug.style.left = this.x + 20 + "px";
        this.eDebug.style.top = this.y + 20 + "px";

        //Draw turn circle
        //Turn circle is based on dRate.  
        //dRate=0 is a straight line (infinite radius).  
        //Don't draw circles with radius greater than 1000
        //Circle center point will be somewhere along line +/-90deg from direction of car
        //dRate < 0 = turn left, dRate > 0 = turn right
        //Eyeball, dRate=30 = ~3 car lengths radius.  Car length = 32px
        //If dRate=30 = r=50, then dRate=15 = r=100 and dRate=5 = r=300 and dRate=60 = r=25
        //That matches the equation:  r=30*50/dRate
        let dRateTest = this.dRate;
        if (Math.abs(dRateTest) > 0.0001) {
            let sign = Math.abs(dRateTest) / dRateTest;
            const factor = 2865; //Magic number based on various observations (varying dRate and v)
            let r = Math.abs(factor / dRateTest);
            if (Math.abs(r) < 1000) {
                let g = -90 * sign - this.d; //Perpendicular to local direction
                let cx = Math.cos(g * Math.PI / 180) * r + this.x;
                let cy = -Math.sin(g * Math.PI / 180) * r + this.y;
                let turnCircle = "<circle r='" + r + "' cx='" + cx + "' cy='" + cy + "' class='turnCircle'></circle>";
                let turnCircleCenter = "<circle r='1' cx='" + cx + "' cy='" + cy + "' class='turnCircle'></circle>";
                this.eSVG.innerHTML = this.eSVG.innerHTML + turnCircle + turnCircleCenter;
            }
        }
	}

    /**
     * Remove car from DOM
     */
    destroy = function() {
        this.eSVG.remove();
        this.eDebug.remove();
        this.eCar.remove();
    }
	
    /**
     * 
     * @returns 
     */
    _pickRandomCarType = function() {
        let _maxWeights = 0; 
        sim.carData.C_carTypeWeights.forEach(function(e, i, a) { _maxWeights += e; });
        let _r = sim.randomInt(_maxWeights);
        let _t = 0;
        let _i = 0;
        let rv = 0;
        sim.carData.C_carTypeWeights.some(function(e) {
            _t += e;
            if (_t > _r) { rv = _i; return true; }
            _i++;
        });
        return rv;
    };

    /**
     * Returns a hex color string ("#abc").  Uses CSS color shorthand. Digits range between A and D (a lightist, dusty color), 64 unique colors
     * @returns Returns a hex color string ("#abc").
     */
    _pickRandomColor = function() {
        //Returns a hex color string ("#abc").  Uses CSS color shorthand.  Digits range between A and D (a lightish, dusty color), 64 unique colors
        let _r = [sim.randomInt(14, 10), sim.randomInt(14, 10), sim.randomInt(14, 10)];
        return "#" + _r[0].toString(16) + _r[1].toString(16) + _r[2].toString(16);
    };
    
    /**
     * Send speed-up signal to the car.  Simulates car's reaction.  May be hampered by mass of car or friction of wheels.
     * @param {int} power - How much the accelerator pedal is being pushed
     * @param {decimal} delta - Time in sec since last frame
     */
    accelerate = function(power, delta) {
        this.v += this.maxAccel * power * delta;
    };

    /**
     * Send slow-down signal to the car.  Simulates car's reaction.  May be hampered by mass of car or friction of wheels.
     * @param {int} power - How much the brake pedal is being pushed
     * @param {decimal} delta - Time in sec since last frame
     */
    decelerate = function(power, delta) {
        this.v -= this.maxDecel() * power * delta;
    };
	
    /**
     * Simulate the car.
     * ! This might not be needed. Maybe move this to driver
     * @param {decimal} delta - Time in sec since last frame
     */
	simulate = function(delta) {
        //delta = time since last simulation step
        
		this.target = this.getTarget(); //This will change the target down the road
		this.dTarget = this.getTargetAngle(); //Ranges from -180 to 180 with 0 pointing "forward" and -90 = "left side"

        if (this.target != null) {
		    this.turnTo(this.target.x, this.target.y, delta); //This will change this.dRate to steer toward the road
		    //this.dRate += 0.01 * delta;

            //this.Decelerate(1, delta);

            this.d += this.dRate * (this.v / 50) * (delta / 1000);
            if (this.d < 0) this.d += 360;
            if (this.d > 360) this.d -= 360;
        }		
		
        this.x += Math.cos(this.d * Math.PI / 180) * this.v * delta / 1000;
        this.y += Math.sin(this.d * Math.PI / 180) * this.v * delta / 1000;
	}
	
    /**
     * Get angle of target relative to direction car is pointing, in degrees.
     * @returns Angle in degrees ranging from -180 to 180, with 0 pointing "forward", -90 pointing "left"
     */
	getTargetAngle = function() {
        //Return angle in degrees ranging from -180 to 180
        //with 0 pointing "forward", -90 pointing "left" and 90 pointing "right".
        if (this.target == null) return null;
		let deg = angleFromCoords(this.x, this.y, this.target.x, this.target.y);

		//Convert to local (so 0deg faces "forward")
		deg -= this.d; 
		
		if (deg > 180) deg -= 360;
		if (deg < -180) deg += 360;
		return deg;
	}
	
	
    /**
     * Get reference to a node in the road network.  If too close to current target, get the next one.
     * @returns A reference to a node from the road network.
     */
    getTarget = function() {
        if (this.target == null) return null;
        let dist = this.distanceTo(this.target.x, this.target.y);
        let lookAheadDist = this.v / 2;
        if (lookAheadDist < 30) lookAheadDist = 30;
        if (dist < lookAheadDist) {
            //Get next node (which may be on another road)
            let i = sim.randomInt(this.target.nextList.length); //Random meandering (no purposeful goal)
            this.target = this.target.nextList[i];
        }
        return this.target;
	}
	
    /**
     * Measure how far away something is from car
     * @param {decimal} x 
     * @param {decimal} y 
     * @returns Decimal number in pixels
     */
    distanceTo = function(x, y) {
        let hypot = Math.hypot(this.x - x, this.y - y); //? Use this instead?
		let dist = Math.sqrt(Math.pow(this.x - x, 2) + Math.pow(this.y - y, 2)); //Pythag
		return dist;
	}
	
    /**
     * 
     * @param {decimal} x 
     * @param {decimal} y 
     * @param {decimal} delta Time in seconds since last frame
     * @returns An angle in degrees relative to car's direction
     */
	turnTo = function(x, y, delta) {
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
	
    /**
     * Dunno man, see internal comments
     * @param {decimal} requestDRate - Requested direction turn rate
     * @param {decimal} delta - Time in seconds since last frame
     * @returns 
     */
	getTurnRate = function(requestDRate, delta) {
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
		let dRateMax = 3; //Units unknown, produces a "peppy" but realistic turn rate
		let curDRate = this.dRate;
		let dRateJerkMax = 0.1; //How quickly the steering wheel is being turned
		let sign = Math.abs(requestDRate) / requestDRate; //Either +1 or -1
		
		//Apply rules
		if (Math.abs(requestDRate) > dRateMax) requestDRate = dRateMax * sign * delta;
		//requestDRate = curDRate + requestDRate * dRateJerkMax;
		
		//"Turn" the wheel at a certain speed
		let dif = requestDRate - curDRate;
		//if (requestDRate > 20) console.log(this.dRate + " " + curDRate + " " + requestDRate + " " + dRateJerkMax);
		//if (dif > dRateMax) requestDRate = curDRate + dRateMax;
		
		return requestDRate;
	}

    /**
     * Return age of car in seconds
     */
    get age() {
        return (new Date() - this._createdTime) / 1000; //Seconds
    }
};
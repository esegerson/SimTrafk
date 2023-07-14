//globals.js before this
//car.js before this

/**
 * Emitter class.  Used to produce cars and drivers at regular intervals.
 */
sim.Emitter = class Emitter {
	id;
	x;
	y;
	d; //Direction, in degrees, 0=right, 90=down
	v; //General velocity to initialize cars to
	rate; //Rate of car generation, in milliseconds (20000 = 1 car every 20 sec)
	e; //The on-screen rendered representation of the emitter (DOM element)
	_counter; //How many cars emitted
	nearestNode; //Reference to sim.roadNetwork.nodes, the first target of emitted cars
	lastEmit;
	distance;
	
	static get C_defaultDistanceBehindNode() { return 64; }

	/**
	 * @param {*} targetNode Node in the road network to assign cars to aim for
	 * @param {*} distance How far behind the node to place the emitter
	 */
	constructor(targetNode, distance) {
		this.id = document.querySelectorAll("#emitters").length + 1;
		this.rate = 20 * 1000; //20 sec
		this.v = 100;
		this._counter = 0;
		this.nearestNode = targetNode;
		this.positionBehind(targetNode, distance);
		this.render();
		this.lastEmit = new Date(new Date().getTime() - this.rate * 2); //Emit instantly on init
		this.distance = distance;
	}

	canEmit = function() {
		//If there is a car in the way, return false
		if (new Date() - this.lastEmit < this.rate) return false;

		return true;
	}

	tryEmit = function() {
		if (!this.canEmit()) return;
		this._counter++;
		
		//Make a new driver, then a new car.
		let driver = new sim.Driver();
		let car = new sim.Car(driver, this.x, this.y, this.d, this.v, this.nearestNode);
		driver.car = car;
		sim.drivers.push(driver);
		sim.globals.carCount++;
		car.render();
		this.lastEmit = new Date();
		$("#spanAlive").text(sim.drivers.length + " driving"); //! TODO: code smell
	}

	ensureInDom = function() {
		if (typeof(this.e) == "undefined") {
			this.e = document.createElement("DIV");
			this.e.classList.add("emitter");
			this.e.id = "emitter" + this.id;
			this.e.setAttribute("data-id", this.id);
			let c = document.getElementById("emitters");
			c.appendChild(this.e);
		}
	}

	render = function() {
		this.ensureInDom();
		let d = Math.round(this.d);
		d = d + 45 - 180;
		this.e.style.left = Math.round(this.x) - 30 + "px"; //-30 for half-width of emitter
        this.e.style.top  = Math.round(this.y) - 30 + "px"; //-30 for half-height of emitter
		this.e.style.transform = "rotate(" + d + "deg)";
	}

	positionBehind = function(targetNode, distance) {
		let emitterPos = sim.roadNetwork.getPositionBehindNode(targetNode, distance);
		if (emitterPos == null) { console.log("Can't place emitter"); return; }
		this.x = emitterPos.x;
		this.y = emitterPos.y;
		this.d = emitterPos.d;
	}

	reposition = function(distance) {
		let emitterPos = sim.roadNetwork.getPositionBehindNode(this.nearestNode, distance);
		if (emitterPos == null) { console.log("Can't place emitter"); return; }
		this.x = emitterPos.x;
		this.y = emitterPos.y;
		this.d = emitterPos.d;
	}
};

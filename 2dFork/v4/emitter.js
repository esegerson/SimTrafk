//globals.js before this

function Emitter() {
	//Properties
	this.x = $(window).width() / 2;
	this.y = 50;
	this.d = 140; //degrees, 0-360
	this.v = 100;
	this.rate = 1000; //milliseconds
	this.e = null;
	this.carParticles = [];
	this._num = -1;
	
	this.constructor = function() {
		this.draw();
		this.render();
	}
	
	this.TryEmit = function() {
		if (!this.canEmit()) return;
		this._num++;
		var cp = new CarParticle();
		cp.constructor(this._num, this.x, this.y, this.d, this.v);
		this.carParticles.push(cp);
		$("#spanAlive").text(this.carParticles.length + " driving");
	}
	
	this.canEmit = function() {
		//If there is a car in the way, return false
		return true;
	}
	
	this.lastCarEmitted = function() {
		if (this.carParticles.length == 0) return null;
		return this.carParticles[this.carParticles.length - 1].createdTime;
	}
	
	this.cullAll = function() {
		//Remove cars from this.carParticles when car leaves the screen
		var margin = 50;
		var w0 = -margin;
		var h0 = -margin;
		var w1 = $(window).width() + margin;
		var h1 = $(window).height() + margin;
		for (var i = this.carParticles.length - 1; i >= 0; i--) {
			var cp = this.carParticles[i];
			var c = cp.car;
			if (cp.age() > 10 && (c.x < w0 || c.x > w1 || c.y < h0 || c.y > h1)) {
				//Minimum 10 second age so emitter can be placed off-screen
				var deleted = this.carParticles.splice(i, 1)[0].car.e;
				$(deleted).remove();
				$("#spanAlive").text(this.carParticles.length + " driving");
			}
		};
	}
	
	this.cull = function(i) {
		//Not used yet
		var margin = -50;
		var w0 = -margin;
		var h0 = -margin;
		var w1 = $(window).width() + margin;
		var h1 = $(window).height() + margin;
		var c = this.carParticles[i].car;
		if (c.x < w0 || c.x > w1 || c.y < h0 || c.y > h1) {
			var deleted = this.carParticles.splice(i, 1)[0].car.e;
			$(deleted).remove();
		}
	}
	
	this.draw = function() {
		var el = $("<div class='emitter'></div>");
        this.e = $("BODY").append(el).find("DIV.emitter:last-child");
	}
	
	this.render = function() {
		var d = Math.round(this.d);
		d = d + 45 - 180;
		$(this.e).css("left", Math.round(this.x) - 25 + "px") //-25 for half-width of emitter
            .css("top", Math.round(this.y) - 25 + "px") //-25 for half-height of emitter
			.css("transform", "rotate(" + d + "deg)");
	}
}

function CarParticle() {
	this.createdTime = new Date();
	this.car = null;
	
	this.fake = function(i) {
		alert(i);
	}
	
	this.constructor = function(i, x, y, d, v) {
		this.car = new Car();
		this.car.constructor(i, x, y, d, v);
		this.createdTime = new Date();
	}
	
	this.age = function() {
		return (new Date() - this.createdTime) / 1000;
	};
}
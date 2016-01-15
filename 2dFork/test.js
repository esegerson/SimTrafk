var Car = Object.create(null);
Car.prototype = {
	_pickRandomColor: function() {
        //Returns a hex color string ("#abc").  Uses CSS color shorthand.  Digits range between A and D (a lightish, dusty color), 64 unique colors
        var _r = [Math.floor(Math.random() * 4 + 10), Math.floor(Math.random() * 4 + 10), Math.floor(Math.random() * 4 + 10)];
        return "#" + _r[0].toString(16) + _r[1].toString(16) + _r[2].toString(16);
    },
    getInfo: function() { return 'A ' + this.color + ' ' + this.desc + '.'; },
    color: ''//_pickRandomColor()
};

var c = Object.create(Car.prototype, {
	color: {writable: true, configurable: true, value: 'red'},
	rawDesc: {writeable: false, configurable: true, value: 'Porsche boxter'},
	desc: {writeable: true, configurable: true, 
		get: function() { return this.rawDesc.toUpperCase(); },
		set: function(value) { this.rawDesc = value.toLowerCase();}
	}
});
c.color = c._pickRandomColor();
c.rawDesc = 'f';
c.des = 'FFFF';
//alert(c.desc);

//------------------------------
function Shape() {
	this.x = 0;
	this.y = 0;
}

Shape.prototype.move = function(x, y) {
	this.x += x;
	this.y += y;
}

function Rectangle() {
	Shape.call(this);
}

Rectangle.prototype = Object.create(Shape.prototype);
Rectangle.prototype.constructor = Rectangle;

var rect = new Rectangle();
rect.x = 5;
rect.y = 10;
rect.move(1, 1);
//alert(rect.x);

//------------------------------

//Car - superclass
function Car2() {
	this.type = '';
	this.x = 0;
	this.y = 0;
	this.v = 0;
	this.assignColor = function() {
		//Returns a hex color string ("#abc").  Uses CSS color shorthand.  Digits range between A and D (a lightish, dusty color), 64 unique colors
	    var _r = [Math.floor(Math.random() * 4 + 10), Math.floor(Math.random() * 4 + 10), Math.floor(Math.random() * 4 + 10)];
	    return "#" + _r[0].toString(16) + _r[1].toString(16) + _r[2].toString(16);	
	}
	this.color = this.assignColor();
}

var myC = new Car2();
alert(myC.color);



//Superclass method
Car2.prototype._pickRandomColor = function() {
	//Returns a hex color string ("#abc").  Uses CSS color shorthand.  Digits range between A and D (a lightish, dusty color), 64 unique colors
    var _r = [Math.floor(Math.random() * 4 + 10), Math.floor(Math.random() * 4 + 10), Math.floor(Math.random() * 4 + 10)];
    return "#" + _r[0].toString(16) + _r[1].toString(16) + _r[2].toString(16);	
};


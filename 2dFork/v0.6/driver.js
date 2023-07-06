//globals.js before this
//car.js before this

/**
 * Driver class
 */
sim.Driver = class Driver {
    id;
    car;
    isMale;
    name;
    age;
    reation;
    intelligence;
    vision;
    pRubbernecker;
    pCellPhone;
    pSoccerMom;
    pHeartAttack;
    isRubbernecking;
    isUsingCellPhone;
    isSoccerMom;
    isHavingHeartAttack;
    curActivity;

    //Methods

    /**
     * Tell the driver to accelerate the car by pushing the pedal.  May incur human delays.
     * @param {decimal} power - How hard is the driver hitting the pedal?
     * @param {decimal} delta - Seconds since last frame
     */
    accelerate = function(power, delta) {
        this.curActivity = sim.carData.driverActivity.Accelerating;
        this.car.accelerate(power, delta);
    };

    /**
     * Tell the driver to slow the car by pushing the brake pedal. May incur human delays.
     * @param {decimal} power - How hard is the driver hitting the pedal?
     * @param {decimal} delta - Seconds since last frame
     */
    decelerate = function(power, delta) {
        this.curActivity = sim.carData.driverActivity.Decelerating;
        this.car.decelerate(power, delta);
    };

    /**
     * Tell the driver to turn
     */
    turn = function() {
        //Add more human simulation here. Actions are not instant
        //How does the driver control the car?
        this.car.turn();
    };

    /**
     * Tell the driver to observe the surroundings.
     */
    look = function() {
        //How does the driver detect nearby cars?
        //How does the driver identify the road target, road borders, and upcoming straightaways and curves?
        //Does this function update a local "map" of what the driver thinks the immediate area looks like?
    }

    /**
     * Initialize a driver with a preset car
     * @param {Car} car - Car already initialized by an emitter
     */
    constructor() {
        this.id = sim.globals.carCount;
        this.isMale = sim.chance(0.5);
        this.name = this.isMale ? 
            sim.carData.C_namesTop200M[sim.randomInt(sim.carData.C_namesTop200M.length)] : 
            sim.carData.C_namesTop200F[sim.randomInt(sim.carData.C_namesTop200F.length)];
        this.age = sim.randomInt(100, 15); //15-99
        this.reaction = sim.randomInt(10); //0 (computer-perfect) to 9 (incapacitated)
        this.intelligence = sim.randomInt(10); //0 (stupid) to 9 (computer-perfect genius)
        this.aggressiveness = sim.randomInt(10); //0 (timid, cowed) to 9 (fast accel/decel, tailgaiting, weaving, selfish, zero margin of error)
        this.vision = sim.randomInt(10); //0 (blind) to 9 (road segments distant)
        this.pRubbernecker = Math.random(); //0 (never) to 1 (always), slows around accidents
        this.pCellPhone = Math.random(); //0 (never) to 1 (always), periods of distracted driving
        this.pSoccerMom = Math.random(); //0 (never) to 1 (total stereotype), changes agendas often, erratic behavior, different from aggressiveness
        this.pHeartAttack = Math.random() * 0.001; //Never to rare, driver goes unresponsive (maintains speed, drifts)
    
        //Time-sensitive variables
        this.isRubbernecking = false;
        this.isUsingCellPhone = sim.chance(this.pCellPhone);
        this.isSoccerMom = sim.chance(this.pSoccerMom);
        this.isHavingHeartAttack = sim.chance(this.pHeartAttack);
        this.curActivity = sim.carData.driverActivity.Nothing;
    }
}
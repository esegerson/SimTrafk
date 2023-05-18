
# SimTrafk
SimTrafk is a fun little browser-based traffic simulator. The idea is to build a little network of roads, populate them with cars with drivers, give each of the drivers a randomized personality (such as "impatient", "cautious", "speeder", "tailgater", or even "drunk"), and see what traffic patterns emerge.

## Experiments
At this stage, SimTrafk consists of a series of experiments, building the groundwork for a proper traffic simulator.  I originally wasn't sure if creating this in a browser was even viable.  (Could a browser track and render hundreds of cars?)

Different versions can be found under the "2dfork" directory.

**Version 1** tested the performance of the browser and created a CSS-based car.

**Version 2** adapts to a variable framerate and gives each car a turning rate.

**Version 3** has each car detecting if another car is in front of it.  Cars will brake to avoid collisions and accelerate to their nominal speed if the way is clear.  There is a built-in reaction time for the drivers.  If there's a collision, the car permanently brakes and stops.  Very rudimentary.

**Version 3.1** refactors the code.  It adds the ability to click a car to double it's nominal speed and turn on the engine if it's off.  This might be the most fun version at the moment.  At this point, the viability of a browser-based traffic simulator is proven to me.  

**Version 4** refactors the code more.  An emitter object is created and cars attempt to follow a road (of dots).  Auto-steering does not work very well.  A button was added to show the steering wheel of each car to better figure out what was going wrong in the code.

**Version 4.1** continues to debug the auto-steering of the cars.  A box that follows each car is a place to put more debugging information.  Steering is worse in this version.

## Current State
At the moment, all work is being done in the "2dfork" folder.  That implies a 3D implementation, but that's not on the radar at the moment.

Automatic steering needs to be improved.  The strategy being aimed for is to have each car look for the next dot on the road and turn the steering wheel to get there.  An evolution of this strategy would be to have each car calculate the angle that the immediate three dots make and aim to match that, which I think would reduce the "wandering" effect seen in v4.  Or have each car create a virtual "dot" before the next dot that that is half the angle between the car and the road dots, to get the car "in position" for the subsequent dots on the road.  

Obviously, this area needs more working out, and visuals would probably clarify things.  

## Wishlist
### Near-Term:
- Cars that follow a road of dots/waypoints and can self-correct to get back onto the road.
- Some way to define (in a data file) a network of roads.
- Multiple emitters for different roads that cross each other.
- Collision-avoidance code (starting with code from v3.1).
- Support for a closed network of roads
	- Need a car-placer that spreads cars around the closed network at the start of the simulation.
	- An emitter and culler would still be used for any roads that leave the simulation space (ala v4.1).
### Longer-Term:
- Add personalities to each car ("cautious", "wreckless")
- Add rare, random events ("heart attack", "road rage") for other cars to respond to according to their personalities.
- Add mitigation strategies to bad situations (such as driving off the road to avoid a collision).
- Add the ability to take over a car and drive it with arrow keys.
- Add more fun things, like adding and removing cars, and pushing cars (in any direction).
- Add trucks and motorcycles for different weight classes, acceleration and braking capabilities, and a different visual representation for them.
- Better visual rendering of the road and intersections.

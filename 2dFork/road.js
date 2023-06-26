//globals.js before this

function RoadNetwork() {
    /*
        This handles all things roads.
        One road object per game.
        Input road1.js data.
        Convert that simple coordinate data to a more robust object-based graph of nodes 
        with curves and references to next nodes, etc.
     
    */

    //Constants
    this.C_maxNodeDist = 70; //pixels
    this.C_numBezierSubdivides = 16;

    //Properties
    this.roads = []; //Collection of roads. Each road holds a collection of nodes.
    this.nodes = []; //A single list of all nodes. Each node has a reference to its parent road.

    //Methods
    this.generateRoad = function(type, count) {
        var w = $(window).width();
        var h = $(window).height();
        this.roads = [];
        this.nodes = [];
        var r = new Road(1, "gray");
        if (type == "sine") {
            //Simple sine wave
            r.id = "1";
            r.name = "Sine Wave Street";
            r.comment = "Simple sine wave for demonstration";
            this.roads.push(r);
            const centerline = 512;
            const radius = 512 - 128;
            for (var i = 0; i < h * 1.1; i += 30) {
                var x = Math.floor(Math.sin(-i / 80) * radius + centerline);
                var y = i - 3;
                if (i > 0) {
                    var n = new Node(r, i, x, y);
                    r.nodes.push(n);
                    this.nodes.push(n);
                }
            }
            //Connect together
            this.nodes.forEach((n, i) => {
                if (i < this.nodes.length - 1) n.nextList.push(this.nodes[i + 1]);
                if (i > 0) n.prevList.push(this.nodes[i - 1]);
            });
        } else if (type == "circle") {
            r.id = "1";
            r.name = "Circle";
            r.comment = "Self-connecting circle for demonstration";
            this.roads.push(r);
            if (typeof(count) == "undefined") count = 64;
            var numNodes = count;
            const radius = 512 - 128;
            const centerX = 512;
            const centerY = 512;
            for (var i = 0; i < numNodes; i++) {
                var x = Math.round(Math.cos(2 * Math.PI / numNodes * i) * radius + centerX);
                var y = Math.round(Math.sin(2 * Math.PI / numNodes * i) * radius + centerY);
                var n = new Node(r, i, x, y);
                r.nodes.push(n);
                this.nodes.push(n);
            }
            //Connect together
            this.nodes.forEach((n, i) => {
                if (i < this.nodes.length - 1) n.nextList.push(this.nodes[i + 1]);
                if (i > 0) n.prevList.push(this.nodes[i - 1]);
            });
            this.nodes[0].prevList.push(this.nodes[this.nodes.length - 1]);
            this.nodes[this.nodes.length - 1].nextList.push(this.nodes[0]);
        }
    }

    this.loadNetwork = function(data) {
        //data is defined in road1.js
        //Convert this data into a collection of linked pointers
        if (typeof(data) == "undefined" || data == null) return;
        if (data.roads == null || data.roads.length < 1) return;

        //Init network
        this.roads = [];
        this.nodes = [];

        //Parse data object, all roads, all nodes
        data.roads.forEach(r => {
            var newRoad = new Road(r.id, r.color);
            newRoad.comment = r.comment;
            this.roads.push(newRoad);
            r.nodes.forEach((n, i) => {
                var id = i + 1; //1-based
                if (typeof(n.id) != "undefined") id = n.id;
                var newNode = new Node(r, id, n.x, n.y, n.curve);
                if (i > 0) {
                    var prevNode = this.nodes[this.nodes.length - 1];
                    newNode.prevList.push(prevNode); //Link backward
                    prevNode.nextList.push(newNode); //Link forward
                }
                this.nodes.push(newNode);
                newRoad.nodes.push(newNode);
            });
        });

        //Parse again, this time for the join data
        data.roads.forEach(r => {
            var curRoadId = r.id;
            r.nodes.forEach((n, i) => {
                var curNodeId = n.id;
                if (typeof(n.joins) != "undefined") {
                    var rid = n.joins.roadId;
                    var nid = n.joins.nodeId;
                    var curNode = this.roads.find(x => x.id == curRoadId).nodes.find(x => x.id == curNodeId);
                    var targetNode = this.roads.find(x => x.id == rid).nodes.find(x => x.id == nid);
                    if (i == 0) {
                        //Linking FROM SOMEWHERE ELSE to here
                        targetNode.nextList.push(curNode);
                        curNode.prevList.push(targetNode);
                    } else {
                        //Linking from here TO SOMEWHERE ELSE
                        targetNode.prevList.push(curNode);
                        curNode.nextList.push(targetNode);
                    }
                }
            });
        });    
    }

    this.renderSimple = function() {
        //For simple sine wave or circle
        this.nodes.forEach(n => {
            var e = "<div class='roadDot'></div>";
            e = $("#road").append(e).find("DIV.roadDot:last-child");
            $(e).css("left", Math.round(n.x - 4))
                .css("top", Math.round(n.y - 4)); //-4 to center 8px-wide dot on coordinate
        });
    }

    this.getTangent = function (roadId, nodeId) {

    }

    this.addVirtualNodes = function() {
        //Add more hinting for the cars, since I may have defined the roads simplistically (distant nodes).
        //Algorithm here just subdivides in half.  Repeat until satisfied.
        //TODO:  Not quite working on joins
        //TODO:  Account for curve
        //ALSO:  It works well but is this even needed?
        var didSubdivide = false;
        roadNetwork.roads.forEach(r => {
            var nodeCopy = [];
            r.nodes.forEach((n, i) => {
                if (i > 0 || n.joins != undefined) { //Skip first node if not joining
                    var nodePrev = {};
                    if (i == 0)
                        nodePrev = roadNetwork.roads
                            .find(x => x.id == n.joins.roadId).nodes
                            .find(x => x.id == n.joins.nodeId);
                    else
                        nodePrev = r.nodes[i - 1];
                    var h = Math.hypot((nodePrev.x - n.x), (nodePrev.y - n.y));
                    if (h > C_maxNodeDist) {
                        var newNode = {
                            x: (nodePrev.x + n.x) / 2,
                            y: (nodePrev.y + n.y) / 2,
                            isVirtual: true
                        };
                        if (i == 0) {
                            newNode.joins = structuredClone(n.joins);
                            delete n.joins;
                        }
                        nodeCopy.push(newNode);
                        didSubdivide = true;
                    }
                }
                nodeCopy.push(structuredClone(n)); //Copy original nodes
            });
            if (r.nodes[r.nodes.length - 1].joins != undefined) {
                //Subdivide connector to next road
                var n = r.nodes[r.nodes.length - 1];
                var nextRoadId = n.joins.roadId;
                var nextNodeId = n.joins.nodeId;
                var nodeNext = roadNetwork.roads.find(x => x.id == nextRoadId).nodes.find(x => x.id == nextNodeId);
                var h = Math.hypot((nodeNext.x - n.x), (nodeNext.y - n.y));
                if (h > C_maxNodeDist) {
                    var newNode = {
                        x: (nodeNext.x + n.x) / 2,
                        y: (nodeNext.y + n.y) / 2,
                        isVirtual: true,
                        joins: structuredClone(n.joins)
                    };
                    delete n.joins;
                    nodeCopy.push(newNode);
                    didSubdivide = true;
                }
            }
            r.nodes = nodeCopy;
        });
        if (didSubdivide) addVirtualRoadNodes(); //Run until all road nodes are sufficiently spaced
    }

    this.render = function() {
        //Clear out whatever was there
        window.road.innerHTML = "";

        var svgBuffer = document.createElement("SVG");
        var svgMain = document.createElement("SVG");
        svgBuffer.setAttribute("class", "buffer");

        //Draw each road in network
        this.roads.forEach(r => {
            //Need to make this:
            //<path d="M 32 0 L 64 64 L 32 64 L 64 128" stroke="black" fill="transparent" />
            var svgLineData = "M";
            r.nodes.forEach((n, i) => {
                if (i > 0) svgLineData += " L";
                svgLineData += " " + n.x + " " + n.y;
                if (i == 0 && n.prevList.length > 0) {
                    //Add to beginning of road
                    var prev = n.prevList[0];
                    svgLineData = "M" + prev.x + " " + prev.y + " L " + n.x + " " + n.y;
                } else if (i == r.nodes.length - 1 && n.nextList.length > 0) {
                    //Add to end of road
                    var next = n.nextList[0];
                    svgLineData += " L " + next.x + " " + next.y;
                }
            });
            var pathElem = document.createElement("PATH");
            pathElem.setAttribute("d", svgLineData);
            pathElem.setAttribute("stroke", r.color);
            pathElem.setAttribute("title", r.comment);
            svgMain.appendChild(pathElem);

            //At bottom (under the roads and dots), draw the road width
            var bufferElem = document.createElement("PATH");
            bufferElem.setAttribute("d", svgLineData);
            svgBuffer.appendChild(bufferElem);
        });

        //Draw the "curve" control points (for debugging)
        var svgBez = document.createElement("svg");
        svgBez.id = "beziers";
        if (version != "4.1") {
            var bpRadius = 5;
            this.nodes.forEach(n => {
                var bp = n.bezierPoints; //Format:  { prev: {x,y}, next: {x,y} }
                var svgCirclePrev = document.createElement("CIRCLE");
                svgCirclePrev.classList.add("bezier");
                svgCirclePrev.classList.add("prev");
                svgCirclePrev.setAttribute("r", bpRadius);
                svgCirclePrev.setAttribute("cx", bp.prev.x);
                svgCirclePrev.setAttribute("cy", bp.prev.y);
                var svgCircleNext = document.createElement("CIRCLE");
                svgCircleNext.classList.add("bezier");
                svgCircleNext.classList.add("next");
                svgCircleNext.setAttribute("r", bpRadius);
                svgCircleNext.setAttribute("cx", bp.next.x);
                svgCircleNext.setAttribute("cy", bp.next.y);
                var svgLine = document.createElement("PATH");
                svgLine.classList.add("bezier");
                svgLine.setAttribute("d", "M " + bp.prev.x + " " + bp.prev.y + " L " + bp.next.x + " " + bp.next.y);
                svgBez.appendChild(svgCirclePrev);
                svgBez.appendChild(svgCircleNext);
                svgBez.appendChild(svgLine);
            });
        }
        var svgBezSubdiv = document.createElement("svg");
        svgBezSubdiv.id = "bezsubdiv";
        if (version == "4.2" || version == "4.3" || version == "4.4") {
            let bezNodes = beztest();
            let svgContents = "";
            bezNodes.forEach(b => {
                let pt = "<circle r='3' cx='" + b.x + "' cy='" + b.y + "'></circle>\n";
                svgContents += pt;
            });
            svgBezSubdiv.innerHTML = svgContents;
        }
        window.road.innerHTML = window.road.innerHTML + svgBez.outerHTML + svgBezSubdiv.outerHTML;

        //Draw dot for each node (overtop the lines)
        this.roads.forEach(r => {
            var foundFirstNonVirtualNode = false;
            r.nodes.forEach((n, i) => {
                var dotElem = document.createElement("CIRCLE");
                dotElem.setAttribute("cx", n.x);
                dotElem.setAttribute("cy", n.y);
                var rad = 8;
                if (n.isVirtual != undefined) rad = 3;
                dotElem.setAttribute("r", rad);
                if (!foundFirstNonVirtualNode && n.isVirtual == undefined) {
                    dotElem.classList.add("firstnode");
                    foundFirstNonVirtualNode = true;
                }
                dotElem.setAttribute("data-roadid", r.id);
                dotElem.setAttribute("data-nodeix", i);
                if (n.isVirtual != undefined) dotElem.classList.add("virtual");
                svgMain.appendChild(dotElem);
            });
        });
        
        var divRoadNetwork = document.createElement("DIV");
        divRoadNetwork.id = "roadNetwork";
        divRoadNetwork.innerHTML =
            svgMain.outerHTML + svgBuffer.outerHTML; //Could not get this to render with append
        window.road.append(divRoadNetwork);
    }

    this.getPositionBehindNode = function(targetNode, distance) {
        //Useful for approaching a node or placing the emitter
        if (targetNode == null) return null;
        if (targetNode.nextList.length == 0) return null;
        var nextNode = targetNode.nextList[0]; //Pick first one
        var dir = Math.atan2(targetNode.y - nextNode.y, targetNode.x - nextNode.x);
        var newX = Math.cos(dir) * distance + targetNode.x;
        var newY = Math.sin(dir) * distance + targetNode.y;
        return { x: newX, y: newY, d: dir * 180 / Math.PI - 180 };
    }
}

class Road {
    id;
    color;
    name;
    comment;
    nodes;
    constructor(id, color) {
        this.id = id;
        this.color = color;
        this.name = color + " road";
        this.comment = "";
        this.nodes = [];
    }
}

class Node {
    //Note, for simplicity, next and prev just pick the first one for now
    
    //Properties
    road; //Reference to parent road
    id;
    x; //In px
    y; //In px
    prevList; //Array of references to nodes
    nextList; //Array of references to nodes
    curve; //In px.  The descriptor for the cubic bezier.  0 = sharp angle, 50 = probably a good curve, 500 = wildly distorted (bad)
    
    //Constants
    C_DefaultCurve = 50;
    C_MaxCurve = 100;

    //Constructor and methods
    constructor(road, id, x, y, curve) {
        this.road = road;
        this.id = id;
        if (typeof(x) == "undefined" || x == null) this.x = 0; else this.x = x;
        if (typeof(y) == "undefined" || y == null) this.y = 0; else this.y = y;
        this.prevList = [];
        this.nextList = [];
        if (typeof(curve) == "undefined" || curve == null || curve === "auto") curve = this.C_DefaultCurve;
        if (curve > this.C_MaxCurve) curve = this.C_MaxCurve;
        if (curve < 0) curve = 0;
        this.curve = curve;        
    }
    
    get angle() {
        if (this.prevList.length == 0) return 0;
        if (this.nextList.length == 0) return 0;

        //Pick a prev & next (just pick first one)
        var prev = this.prevList[0];
        var next = this.nextList[0];

        //Figure out angle created between prev and next using side-side-side geometry
        //First, calculate the side lengths
        var side1 = Math.hypot(prev.x - this.x, prev.y - this.y); //Prev leg
        var side2 = Math.hypot(this.x - next.x, this.y - next.y); //Next leg
        var side3 = Math.hypot(next.x - prev.x, next.y - prev.y); //Imaginary leg from next to prev
        //Formula is:  cos(a) = (y^2+z^2-x^2)/2yz
        //where "a" = the angle I want, y = side1, z = side2, x = side3
        //To get "a" use Math.acos()
        var rad = Math.acos((Math.pow(side1, 2) + Math.pow(side2, 2) - Math.pow(side3, 2)) / (2 * side1 * side2));

        //rad is always (0 >= rad >= 180).  Can't tell if it's a left-turn or right-turn
        //Do some detection to change so range is (0 >= rad >= 360)
        var a1 = Math.atan2(prev.y - this.y, prev.x - this.x);
        var a2t = Math.atan2(this.y - next.y, this.x - next.x);
        if (a2t < 0) a2t += Math.PI * 2;
        var a2 = a1 - Math.atan2(this.y - next.y, this.x - next.x); //Relative to a1. -179 is a right U-turn, 0 is straight, 179 is a left U-turn
        if (a2 < -Math.PI) a2 += Math.PI;
        if (a2 > Math.PI) a2 -= Math.PI;
        //if (a2 < 0) rad = Math.PI * 2 - rad;

        var deg = function(rad) {
            return Math.round(rad * 180 / Math.PI);
        }

        console.log("rad="+deg(rad) + " a1="+deg(a1) + " a2=" + deg(a2) + " a2t=" + deg(a2t));
        return rad; 
    }

    get bezierPoints() {
        /*  Given an angle between prev and next (for illustration, pretend they make an /\ "A" shape where
            this node is at the apex), return (x,y) points to either side of the angle at a distance
            defined by this.curve, such that a smoothly-curved line can be drawn.  A line drawn between
            the two returned points will be tangential to the apex, balanced in angles (perpendic).
            
            Uses angle() above.

            Returns { prev: {x,y}, next: {x,y} }
        */
        
        //Pick a prev & next (just pick first one)
        let prev = this.prevList.length == 0 ? null : this.prevList[0];
        let next = this.nextList.length == 0 ? null : this.nextList[0];

        //Set up return variable, defaulting to this node
        let rv = { prev: { x: this.x, y: this.y }, next: { x: this.x, y: this.y } };

        //Return this node if beginning or end of road
        if (prev == null || next == null) return rv;

        //Calc bezier points
        let dx1 = prev.x - this.x;
        let dy1 = prev.y - this.y;
        let dx2 = this.x - next.x;
        let dy2 = this.y - next.y;
        let a1 = Math.atan2(dy1, dx1);
        let a2 = Math.atan2(dy2, dx2);
        let a2rel = a1 - a2 + Math.PI; //So a 179deg right U-turn is 1deg and straight is 180 or -180
        if (a2rel < Math.PI) a2rel += Math.PI * 2;
        if (a2rel > Math.PI) a2rel -= Math.PI * 2;
        let c = (a1 + a2) / 2; //Average of two angles
        let e = c + Math.PI / 2; //Offset, global space rotation
        //Rotate e by 180 when "next" node is between "prev" and 0deg ("right") so "next" bezier stays "closest"
        if ((a2rel < 0 && a2rel > a1) || (a2rel > 0 && a2rel < a1)) e += Math.PI;
        let f1 = e - Math.PI / 2; //Get perpendicular angle 1
        let f2 = e + Math.PI / 2; //Get perpendicular angle 2

        //Return results
        rv.prev.x = Math.cos(f1) * this.curve + this.x;
        rv.prev.y = Math.sin(f1) * this.curve + this.y;
        rv.next.x = Math.cos(f2) * this.curve + this.x;
        rv.next.y = Math.sin(f2) * this.curve + this.y;
        return rv;
    }
}

var getBezierSubdivideNodes = function(p0, p1, p2, p3, numSubdivisions) {
    /*  Formula for drawing bezier curves:
        B(t) = (1 - t)^3 * P0 + 3 * (1-t)^2 * t * P1 + 3 * (1-t) * t^2 * P2 + t^3 * P3
        where t is a fractional value along the length of the line (0 <= t <= 1).
        P0 = start of line
        P1 = first control point
        P2 = second control point
        P3 = end of line
    */
    let rv = [];
    for (var t = 0; t < 1; t+= 1 / numSubdivisions) {
        rv.push({
            t: t,
            x: Math.pow(1 - t, 3) * p0.x + 3 * Math.pow(1 - t, 2) * t * p1.x + 3 * (1 - t) * Math.pow(t, 2) * p2.x + Math.pow(t, 3) * p3.x,
            y: Math.pow(1 - t, 3) * p0.y + 3 * Math.pow(1 - t, 2) * t * p1.y + 3 * (1 - t) * Math.pow(t, 2) * p2.y + Math.pow(t, 3) * p3.y
        });
    }
    return rv;
}

//Testing bezier algorithm:  subdivide roads using bezier curves.  Returns an array of (x,y) points.
function beztest() {
    let rv = [];
    rn.roads.forEach(r => {
        r.nodes.forEach((n,i) => {
            let prev = n.prevList[0];
            let next = n.nextList[0];
            if (prev != undefined && next != undefined) {
                let prevBez = prev.bezierPoints;
                let curBez = n.bezierPoints;
                let nextBez = next.bezierPoints;
                let bezNodes1 = getBezierSubdivideNodes(
                    {x: prev.x, y: prev.y},
                    {x: prevBez.next.x, y: prevBez.next.y},
                    {x: curBez.prev.x, y: curBez.prev.y},
                    {x: n.x, y: n.y},
                    16
                );
                let bezNodes2 = getBezierSubdivideNodes(
                    {x: n.x, y: n.y},
                    {x: curBez.next.x, y: curBez.next.y},
                    {x: nextBez.prev.x, y: nextBez.prev.y},
                    {x: next.x, y: next.y},
                    16
                );
                bezNodes1.concat(bezNodes2).forEach(b => {
                    rv.push({ x: b.x, y: b.y });
                });
            }
        });
    });
    return rv;

    let n = rn.nodes[1];
    let virtualRoadNodes1 = getBezierSubdivideNodes(
        {x: n.prevList[0].x, y: n.prevList[0].y}, 
        {x: n.prevList[0].bezierPoints.next.x, y: n.prevList[0].bezierPoints.next.y}, 
        {x: n.bezierPoints.prev.x, y: n.bezierPoints.prev.y}, 
        {x: n.x, y: n.y}, 
        20);
    let virtualRoadNodes2 = getBezierSubdivideNodes( //n1, bezNext, nextBezPrev, next
        {x: n.x, y: n.y}, 
        {x: n.bezierPoints.next.x, y: n.bezierPoints.next.y}, 
        {x: n.nextList[0].bezierPoints.prev.x, y: n.nextList[0].bezierPoints.prev.y}, 
        {x: n.nextList[0].x, y: n.nextList[0].y}, 
        20);
    let svgContents = "";
    virtualRoadNodes1.forEach(n => {
        let pt = "<circle r='3' cx='" + n.x + "' cy='" + n.y + "'></circle>\n";
        svgContents += pt;
    });
    virtualRoadNodes2.forEach(n => {
        let pt = "<circle r='3' cx='" + n.x + "' cy='" + n.y + "'></circle>\n";
        svgContents += pt;
    });
    return rv;
}

//Drag & Drop Test
function initDragDrop(obj) {
    obj.onmousedown = function(e) {
        obj.dx = obj.getBoundingClientRect().left - e.clientX;
        obj.dy = obj.getBoundingClientRect().top  - e.clientY;
        obj.isDown = true;
        dragObj = this;
    }
    obj.onmouseup = function(e) {
        obj.isDown = false;
    }
    obj.onmousemove = function(e) {
        if (dragObj && dragObj.isDown) {
            //dragObj.style.left = e.pageX - dragObj.adx + dragObj.dx + "px";
            //dragObj.style.top  = e.pageY - dragObj.ady + dragObj.dy + "px";
            dragObj.setAttribute("cx", e.clientX);
            dragObj.setAttribute("cy", e.clientY);

        }
    }
}

function makeNetworkDraggable() {
    var svg = document.querySelector("#roadNetwork > svg");
    svg.addEventListener("mousedown", startDrag);
    svg.addEventListener("mousemove", drag);
    svg.addEventListener("mouseup", endDrag);
    svg.addEventListener("mouseleave", endDrag);
    svg.childNodes.forEach(c => {
        if (c.tagName == "circle") c.classList.add("draggable");
    });
}

var selectedElement = null;

function startDrag(evt) {
    if (evt.target.classList.contains("draggable")) {
        selectedElement = evt.target;
        selectedElement.classList.add("selected");
    }
}

function drag(evt) {
    if (selectedElement) {
        evt.preventDefault();
        var dragX = evt.clientX;
        var dragY = evt.clientY;
        selectedElement.setAttribute("cx", dragX);
        selectedElement.setAttribute("cy", dragY);
        //Record new data in road network
        var r = rn.roads.find(r => r.id == selectedElement.getAttribute("data-roadid"));
        var n = r.nodes[selectedElement.getAttribute("data-nodeix")];
        n.x = dragX;
        n.y = dragY;
        rn.render();
        makeNetworkDraggable();
        //selectedElement.classList.add("selected"); //didn't work
    }
}

function endDrag(evt) {
    if (selectedElement == null) return;
    selectedElement.classList.remove("selected");
    selectedElement = null;
    rn.render();
    makeNetworkDraggable();
}

window.setTimeout(makeNetworkDraggable, 1000);


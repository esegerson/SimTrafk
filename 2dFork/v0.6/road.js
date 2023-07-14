//globals.js before this

/**
 * This handles all things roads.
 * One road object per game.
 * Input road1.js data.
 * Convert that simple coordinate data to a more robust object-based graph of nodes 
 * with curves and references to next nodes, etc.
 */
sim.RoadNetwork = class RoadNetwork {
    C_maxNodeDist = 70; //pixels
    C_numBezierSubdivides = 16;
    roads; //Collection of roads. Each road holds a collection of nodes.
    nodes; //A single list of all nodes. Each node has a reference to its parent road.
    selectedElement; //For drag & drop
    dragObj; //For drag & drop

    constructor() {
        this.roads = Array();
        this.nodes = Array();

        setTimeout(this.makeDraggable, 1000);
        //this.makeDraggable();
    }

    generateRoad = function(type, count) {
        var w = $(window).width();
        var h = $(window).height();
        this.roads = Array();
        this.nodes = Array();
        var r = new sim.Road(1, "gray");
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
                    var n = new sim.Node(r, i, x, y);
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
                var n = new sim.Node(r, i, x, y);
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

    loadNetwork = function(data) {
        //data is defined in road1.js
        //Convert this data into a collection of linked pointers
        if (typeof(data) == "undefined" || data == null) return;
        if (data.roads == null || data.roads.length < 1) return;

        //Init network
        this.roads = Array();
        this.nodes = Array();

        //Parse data object, all roads, all nodes
        data.roads.forEach(r => {
            var newRoad = new sim.Road(r.id, r.color);
            newRoad.comment = r.comment;
            this.roads.push(newRoad);
            r.nodes.forEach((n, i) => {
                var id = i + 1; //1-based
                if (typeof(n.id) != "undefined") id = n.id;
                var newNode = new sim.Node(r, id, n.x, n.y, n.curve);
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

    /**
     * Take the rough outline from the data file and smooth out the curves.
     * Add additinal nodes to the network.
     * @param {boolean} init - True if this is the first time this is called, default = false.
     */
    interpolateNetwork = function(init) {
        let getBezierSubdivideNodes = function(p0, p1, p2, p3, numSubdivisions) {
            /*  Formula for drawing bezier curves:
                B(t) = (1 - t)^3 * P0 + 3 * (1-t)^2 * t * P1 + 3 * (1-t) * t^2 * P2 + t^3 * P3
                where t is a fractional value along the length of the line (0 <= t <= 1).
                P0 = start of line
                P1 = first control point
                P2 = second control point
                P3 = end of line
            */
            let rv = Array();
            let tinc = 1 / numSubdivisions;
            let t0 = tinc; //Skip first one
            let t1 = 1;// - tinc; //Skip last one
            for (var t = t0; t < t1; t += tinc) {
                rv.push({
                    t: t,
                    x: Math.pow(1 - t, 3) * p0.x + 3 * Math.pow(1 - t, 2) * t * p1.x + 3 * (1 - t) * Math.pow(t, 2) * p2.x + Math.pow(t, 3) * p3.x,
                    y: Math.pow(1 - t, 3) * p0.y + 3 * Math.pow(1 - t, 2) * t * p1.y + 3 * (1 - t) * Math.pow(t, 2) * p2.y + Math.pow(t, 3) * p3.y
                });
            }
            return rv;
        }

        init = sim.setDefaultIfEmpty(init, false);

        //Auto-detect if init is needed, even if false was passed in.
        //The second node on the first road should be interpolated.
        if (!this.roads[0].nodes[1].isInterpolated) {
            //This network needs interpolation
            init = true;
        }

        if (init) {
            //Interpolate each road
            this.roads.forEach(r => {
                //Clear out old interpolation
                for (let i = r.nodes.length - 1; i >= 0; i--) {
                    let n = r.nodes[i];
                    if (n.isInterpolated) r.nodes.splice(i, 1);
                    n.interpolatedNextList = Array();
                }

                let newNodeList = Array();
                //Interpolate each node in each road
                r.nodes.forEach((n,i) => {
                    n.nextList.forEach(next => {
                        //Interpolate each road segment from cur-to-next
                        let curBez = n.bezierPoints;
                        let nextBez = next.bezierPoints;
                        let bezNodes = getBezierSubdivideNodes(
                            {x: n.x, y: n.y},
                            {x: curBez.next.x, y: curBez.next.y},
                            {x: nextBez.prev.x, y: nextBez.prev.y},
                            {x: next.x, y: next.y},
                            this.C_numBezierSubdivides
                        );

                        //Build new chain of subdivided nodes, backward: easier to build Next chain this way
                        let nextNode = next;
                        for (let j = bezNodes.length - 1; j >= 0; j--) {
                            let newNode = new sim.Node(r, null, bezNodes[j].x, bezNodes[j].y, 0);
                            newNode.isInterpolated = true;
                            newNode.interpolatedNextList.push(nextNode);
                            nextNode = newNode;
                        }
                        n.interpolatedNextList.push(nextNode);
                        if (n.interpolatedNextList.length > 0) {
                            let itr = n;
                            while (itr.interpolatedNextList.length > 0) {
                                newNodeList.push(itr); //Build node array for road
                                itr = itr.interpolatedNextList[0]; //Advance
                            }
                            if (itr.nextList.length == 0) newNodeList.push(itr); //Include end of road
                        }
                    }); //end nextList
                }); //end Nodes
                r.nodes = newNodeList;
            }); //end Roads
        } else {
            //init = false, just rejigger the interpolated points based on the control (original) nodes.
            //This situation happens when the road is drag & dropped
            //Just change the x and y on each interpolated node.
            
            this.roads.forEach(r => {
                r.nodes.filter(n => !n.isInterpolated).forEach(n => {
                    n.nextList.forEach(next => {
                        let curBez = n.bezierPoints;
                        let nextBez = next.bezierPoints;
                        let bezNodes = getBezierSubdivideNodes(
                            {x: n.x, y: n.y},
                            {x: curBez.next.x, y: curBez.next.y},
                            {x: nextBez.prev.x, y: nextBez.prev.y},
                            {x: next.x, y: next.y},
                            this.C_numBezierSubdivides
                        );
                        let subdivIter = n.interpolatedNextList[0];
                        for (let i = 0; i < bezNodes.length; i++) {
                            subdivIter.x = bezNodes[i].x;
                            subdivIter.y = bezNodes[i].y;
                            subdivIter = subdivIter.interpolatedNextList[0];
                        }
                    }); //end nextList            
                }); //end Nodes
            }); //end Roads
        } //end init=true/false
    }

    render = function() {
        /*  DOM structure:
                <div id="road">
                    <svg id="roadBackground">
                        <path ... for road 1></path>
                    </svg>
                    <svg id="roadLines">
                        <path ... for road 1></path>
                        ...
                    </svg>
                    <svg id="roadNodes">
                        <circle ... for road 1 node 1></circle>
                        <circle ... for road 1 node 2></circle>
                        <circle ... for road 1 node 3></circle>
                        ...
                    </svg>
                    <svg id="roadBeziers">
                        <circle ... for road 1 node 1 prev />
                        <circle ... for road 1 node 1 next />
                        <line ... for road 1 node 1 tangent />
                        ...
                    </svg>
                </div>
        */

        //Turn containers into vars
        let eBackground = document.getElementById("roadBackground");
        let eLines = document.getElementById("roadLines");
        let eNodes = document.getElementById("roadNodes");
        let eBeziers = document.getElementById("roadBeziers");

        //Clear out whatever was there
        eBackground.innerHTML = "";
        eLines.innerHTML = "";
        eNodes.innerHTML = "";
        eBeziers.innerHTML = "";

        //Draw each road in network
        this.roads.forEach(r => {
            //Need to make this:
            //<path d="M 32 0 L 64 64 L 32 64 L 64 128" stroke="black" fill="transparent" />
            let svgLineData = "M";
            r.nodes.forEach((n, i) => {
                if (i > 0) svgLineData += " L";
                svgLineData += " " + Math.round(n.x) + " " + Math.round(n.y);
                if (i == 0 && n.prevList.length > 0) {
                    //Add to beginning of road
                    var prev = n.prevList[0];
                    svgLineData = "M" + Math.round(prev.x) + " " + Math.round(prev.y) + " L " 
                        + Math.round(n.x) + " " + Math.round(n.y);
                } else if (i == r.nodes.length - 1 && n.nextList.length > 0) {
                    //Add to end of road
                    var next = n.nextList[0];
                    svgLineData += " L " + Math.round(next.x) + " " + Math.round(next.y);
                }
            });
            let pathElem = document.createElement("PATH");
            pathElem.setAttribute("d", svgLineData);
            pathElem.setAttribute("stroke", r.color);
            eLines.appendChild(pathElem);

            //At bottom (under the roads and dots), draw the road width
            var bufferElem = document.createElement("PATH");
            bufferElem.setAttribute("d", svgLineData);
            eBackground.appendChild(bufferElem);
        });

        //Draw the "curve" control points (for debugging)
        let svgBez = document.createElement("svg");
        svgBez.id = "beziers";
        
        let bpRadius = 5;
        this.nodes.forEach(n => {
            let bp = n.bezierPoints; //Format:  { prev: {x,y}, next: {x,y} }
            let svgCirclePrev = document.createElement("CIRCLE");
            svgCirclePrev.classList.add("bezier");
            svgCirclePrev.classList.add("prev");
            svgCirclePrev.setAttribute("r", bpRadius);
            svgCirclePrev.setAttribute("cx", bp.prev.x);
            svgCirclePrev.setAttribute("cy", bp.prev.y);
            let svgCircleNext = document.createElement("CIRCLE");
            svgCircleNext.classList.add("bezier");
            svgCircleNext.classList.add("next");
            svgCircleNext.setAttribute("r", bpRadius);
            svgCircleNext.setAttribute("cx", bp.next.x);
            svgCircleNext.setAttribute("cy", bp.next.y);
            let svgLine = document.createElement("PATH");
            svgLine.classList.add("bezier");
            svgLine.setAttribute("d", "M " + bp.prev.x + " " + bp.prev.y + " L " + bp.next.x + " " + bp.next.y);
            svgBez.appendChild(svgCirclePrev);
            svgBez.appendChild(svgCircleNext);
            svgBez.appendChild(svgLine);
        });

        var svgBezSubdiv = document.createElement("svg");
        svgBezSubdiv.id = "bezsubdiv";
        
        let bezSvg = document.getElementById("roadBeziers");
        bezSvg.innerHTML = "";
        this.nodes.forEach(n => {
            let b = n.bezierPoints;
            let pt0 = document.createElement("circle");
            pt0.classList.add("prev");
            pt0.setAttribute("r", "3");
            pt0.setAttribute("cx", Math.round(b.prev.x));
            pt0.setAttribute("cy", Math.round(b.prev.y));
            let pt1 = document.createElement("circle");
            pt1.classList.add("next");
            pt1.setAttribute("r", "3");
            pt1.setAttribute("cx", Math.round(b.next.x));
            pt1.setAttribute("cy", Math.round(b.next.y));
            let ln = document.createElement("line");
            ln.setAttribute("x1", Math.round(b.prev.x));
            ln.setAttribute("y1", Math.round(b.prev.y));
            ln.setAttribute("x2", Math.round(b.next.x));
            ln.setAttribute("y2", Math.round(b.next.y));
            bezSvg.appendChild(ln);
            bezSvg.appendChild(pt0);
            bezSvg.appendChild(pt1);
        });
        bezSvg.innerHTML = bezSvg.innerHTML; //To get SVG to render

        //Draw dot for each node (overtop the lines)
        this.roads.forEach(r => {
            var foundFirstNonVirtualNode = false;
            r.nodes.forEach((n, i) => {
                var dotElem = document.createElement("CIRCLE");
                dotElem.setAttribute("cx", Math.round(n.x));
                dotElem.setAttribute("cy", Math.round(n.y));
                let rad = 8;
                if (n.isInterpolated) { 
                    rad = 3;
                    dotElem.setAttribute("data-inter", "true");
                }
                dotElem.setAttribute("r", rad);
                if (!foundFirstNonVirtualNode && n.isVirtual == undefined) {
                    dotElem.classList.add("firstnode");
                    foundFirstNonVirtualNode = true;
                }
                dotElem.setAttribute("data-roadid", r.id);
                dotElem.setAttribute("data-nodeix", i);
                if (n.isVirtual != undefined) dotElem.classList.add("virtual");
                if (n.isInterpolated) dotElem.classList.add("virtual");
                eNodes.appendChild(dotElem);
            });
        });
        
        //SVG isn't rendering with DOM manipulation.  Force redraw with .innerHTML.
        eBackground.innerHTML = eBackground.innerHTML;
        eLines.innerHTML = eLines.innerHTML;
        eNodes.innerHTML = eNodes.innerHTML
        eBeziers.innerHTML = eBeziers.innerHTML;
    }

    getPositionBehindNode = function(targetNode, distance) {
        //Useful for approaching a node or placing the emitter
        if (targetNode == null) return null;
        if (targetNode.nextList.length == 0) return null;
        var nextNode = targetNode.nextList[0]; //Pick first one
        var dir = Math.atan2(targetNode.y - nextNode.y, targetNode.x - nextNode.x);
        var newX = Math.cos(dir) * distance + targetNode.x;
        var newY = Math.sin(dir) * distance + targetNode.y;
        return { x: newX, y: newY, d: dir * 180 / Math.PI - 180 };
    }

    makeDraggable = function() {
        //Make network drag & droppable
        let svg = document.querySelector("#roadNodes");
        svg.addEventListener("mousedown", sim.roadNetwork.startDrag);
        svg.addEventListener("mousemove", sim.roadNetwork.drag);
        svg.addEventListener("mouseup", sim.roadNetwork.endDrag);
        svg.addEventListener("mouseleave", sim.roadNetwork.endDrag);
        svg.childNodes.forEach(c => {
            if (c.tagName == "circle" && c.getAttribute("data-inter") == null) 
                c.classList.add("draggable");
        });
    }

    startDrag = function(evt) {
        if (evt.target.classList.contains("draggable")) {
            sim.roadNetwork.selectedElement = evt.target;
            sim.roadNetwork.selectedElement.classList.add("selected");
        }
    };
    
    drag = function(evt) {
        if (sim.roadNetwork.selectedElement) {
            evt.preventDefault();
            let dragX = evt.clientX;
            let dragY = evt.clientY;
            sim.roadNetwork.selectedElement.setAttribute("cx", dragX);
            sim.roadNetwork.selectedElement.setAttribute("cy", dragY);
            //Record new data in road network
            var r = sim.roadNetwork.roads.find(r => r.id == sim.roadNetwork.selectedElement.getAttribute("data-roadid"));
            var n = r.nodes[sim.roadNetwork.selectedElement.getAttribute("data-nodeix")];
            n.x = dragX;
            n.y = dragY;
            sim.roadNetwork.interpolateNetwork(false);
            sim.roadNetwork.render();
            sim.roadNetwork.makeDraggable();
            sim.emitters.forEach(e => {
                e.reposition(e.distance);
                e.render();
            });
        }
    };
    
    endDrag = function(evt) {
        if (sim.roadNetwork.selectedElement == null) return;
        sim.roadNetwork.selectedElement.classList.remove("selected");
        sim.roadNetwork.selectedElement = null;
        sim.roadNetwork.render();
        sim.roadNetwork.makeDraggable();
        sim.emitters.forEach(e => {
            e.reposition(e.distance);
            e.render();
        });
    };
}

sim.Road = class Road {
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
        this.nodes = Array(); //List of non-interpolated nodes, I think.
    }
}

sim.Node = class Node {
    //Note, for simplicity, next and prev just pick the first one for now
    
    //Properties
    road; //Reference to parent road
    id;
    x; //In px
    y; //In px
    prevList; //Array of references to nodes
    nextList; //Array of references to nodes
    curve; //In px.  The descriptor for the cubic bezier.  0 = sharp angle, 50 = a gentle curve
    isInterpolated; //Distinguish between nodes in the original data and bezier-curve nodes.
    interpolatedNextList; //Array of references to interpolated nodes.
    
    //Constants
    C_DefaultCurve = 50;
    C_MaxCurve = 200;

    //Constructor and methods
    constructor(road, id, x, y, curve) {
        this.road = road;
        this.id = id;
        this.x = sim.setDefaultIfEmpty(x, 0);
        this.y = sim.setDefaultIfEmpty(y, 0);
        this.prevList = Array(); //List of references to non-interpolated nodes
        this.nextList = Array(); //List of references to non-interpolated nodes
        curve = sim.setDefaultIfEmpty(curve, this.C_DefaultCurve);
        if (curve > this.C_MaxCurve) curve = this.C_MaxCurve;
        if (curve < 0) curve = 0;
        this.curve = curve;
        this.isInterpolated = false;
        this.interpolatedNextList = Array(); //List of references to interpolated or non-interpolated nodes
    }
    
    /**
     * Used to determine the curve of the road.  Took a while to get this function working properly.
     */
    get bezierPoints() {
        /*  Given an angle between prev and next (for illustration, pretend they make an /\ "A" shape where
            this node is at the apex), return (x,y) points to either side of the angle at a distance
            defined by this.curve, such that a smoothly-curved line can be drawn.  A line drawn between
            the two returned points will be tangential to the apex, balanced in angles (perpendic).
            
            Returns { prev: {x,y}, next: {x,y} }
        */

        //Pick a prev & next (just pick first one)
        let prev = this.prevList.length == 0 ? null : this.prevList[0];
        let next = this.nextList.length == 0 ? null : this.nextList[0];

        //Set up return variable, defaulting to this node
        let rv = { prev: { x: this.x, y: this.y }, next: { x: this.x, y: this.y } };

        //Return this node if beginning or end of road or if this isn't an original node
        if (this.isInterpolated || prev == null || next == null) return rv;

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

    getNextTarget = function(method, ignoreSubdisions) {
        method = sim.setDefaultIfEmpty(method, "random");
        if (method == "random") {
            if (ignoreSubdisions || this.interpolatedNextList.length == 0) {
                let i = sim.randomInt(this.nextList.length); //Random meandering (no purposeful goal)
                return this.nextList[i];
            }
            let i = sim.randomInt(this.interpolatedNextList.length); //Random
            return this.interpolatedNextList[i];
        }
    }
}
roadNetworkData = {
    "comment": "Proof of concept network with loops, dead-ends, and splits",
    "boundary": { "minX": 0, "maxX": 1024, "minY": 0, "maxY": 1024 },
    "roads": [
        {
            "id": 1,
            "comment": "Simple one-lane road",
            "color": "red",
            "name": "Red Rt-1",
            "nodes": [
                { "id": 1, "x": 100, "y": 100, "curve": 20 },
                { "id": 2, "x": 200, "y": 90 },
                { "id": 3, "x": 300, "y": 105 },
                { "id": 4, "x": 400, "y": 120 },
                { "id": 5, "x": 500, "y": 140 },
                { "id": 6, "x": 600, "y": 130 },
                { "id": 7, "x": 730, "y": 150, "curve": 10, "joins": { "roadId": 2, "nodeId": 1 } }
            ]
        },
        {
            "id": 2,
            "comment": "Second one-lane road continues from the first",
            "color": "red",
            "name": "Red Rt-2",
            "nodes": [
                { "id": 1, "x": 700, "y": 250 },
                { "id": 2, "x": 690, "y": 360, "curve": 30 },
                { "id": 3, "x": 720, "y": 450, "curve": 20 },
                { "id": 4, "x": 850, "y": 500 },
                // { "id": 5, "x": 880, "y": 550 },
                { "id": 6, "x": 860, "y": 600 },
                // { "id": 7, "x": 850, "y": 650 },
                { "id": 8, "x": 830, "y": 700 },
                { "id": 9, "x": 770, "y": 770, "curve": 30, "joins": { "roadId": 3, "nodeId": 1 } }
            ]
        },
        {
            "id": 3,
            "comment": "Third one-lane road continues from the second toward the first",
            "color": "red",
            "name": "Red Rt-3",
            "nodes": [
                { "id": 1, "x": 700, "y": 800, "curve": 30 },
                // { "id": 2, "x": 700, "y": 810 },
                { "id": 3, "x": 600, "y": 750 },
                { "id": 4, "x": 500, "y": 700 },
                { "id": 5, "x": 400, "y": 650 },
                { "id": 6, "x": 300, "y": 600 },
                { "id": 7, "x": 200, "y": 550 },
                { "id": 8, "x": 80, "y": 350, "joins": { "roadId": 1, "nodeId": 1 } }
            ]
        },
        {
            "id": 4,
            "comment": "Fourth one-lane road shortcut (back-joins from 1 and leads to 3)",
            "color": "orange",
            "name": "Shortcut",
            "nodes": [
                { "id": 1, "x": 600, "y": 200, "curve": 20, "joins": { "roadId": 1, "nodeId": 6 } },
                { "id": 2, "x": 400, "y": 320 },
                { "id": 3, "x": 200, "y": 370, "joins": { "roadId": 3, "nodeId": 8 } }
            ]
        },
        {
            "id": 5,
            "comment": "Dead-end road from 2, cars should either stop or if off-screen, be removed",
            "color": "brown",
            "name": "Eternal Road",
            "nodes": [
                { "id": 1, "x": 900, "y": 700, "joins": { "roadId": 2, "nodeId": 6 } },
                { "id": 2, "x": 990, "y": 650 },
                { "id": 3, "x": 1100, "y": 500, "comment": "outside of bounds" }
            ]
        },
        {
            "id": 6,
            "comment": "Feeder road (for emitter) connects to 3, starts off-screen",
            "color": "green",
            "name": "Welcome Road",
            "nodes": [
                { "id": 1, "x": 300, "y": 1100, "comment": "outside of bounds" },
                { "id": 2, "x": 600, "y": 900 },
                { "id": 3, "x": 640, "y": 820, "curve": 20, "joins": { "roadId": 3, "nodeId": 3 } }
            ]
        },
        {  
            "id": 7,
            "comment": "Dead-end (inside of bounds), cars should stop",
            "color": "blue",
            "name": "Dead End",
            "nodes": [
                { "id": 1, "x": 100, "y": 600, "joins": { "roadId": 3, "nodeId": 7 } },
                // { "id": 2, "x": 50, "y": 700 },
                { "id": 3, "x": 150, "y": 740 },
                { "id": 4, "x": 400, "y": 760, "curve": 100 },
                { "id": 5, "x": 50, "y": 850, "curve": 100 },
                { "id": 6, "x": 450, "y": 900 },
                { "id": 7, "x": 500, "y": 800, "comment": "dead-end in-bounds" }
            ]
        },
        {
            "id": 8,
            "comment": "Self-connecting road (cul-de-sac), effectively a one-way dead-end",
            "color": "purple",
            "name": "Cul-de-Sac Court",
            "nodes": [
                { "id": 1, "x": 800, "y": 580, "curve": 30, "joins": { "roadId": 2, "nodeId": 4 } },
                { "id": 2, "x": 650, "y": 570, "curve": 200 },
                { "id": 3, "x": 500, "y": 400, "curve": 200 },
                { "id": 4, "x": 450, "y": 600, "curve": 200, "joins": { "roadId": 8, "nodeId": 2} }
            ]
        }
    ]
}
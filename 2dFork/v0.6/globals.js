//global.js is the first JavaScript file to include.  It initializes the sim object.

let sim = {
    globals: {
        fps: 30,
        max: 32,
        accel: 30,
        decel: this.accel * 4,
        C_scale: 0.144, //meters per pixel, see notes.txt
        C_convertMpsMph: 2.2369, //meters per second to miles per hour
        version: "0.6",
        carCount: 0,
        fStops: [0.5, 0.7, 1, 1.4, 2, 2.8, 4, 5.6, 8, 11, 15, 21, 30, 45, 60, 90, 120] //Used for rate slider
    },
    
    run: {
        lastTime: Date.now(),
        pause: false, //Pause the simulation
        slow: false, //Slow the simulation down by 1/1000 for debugging
        stop: false, //Kills iteration of step()

    },
    
    carData: {
        carType: { 
            Subcompact      : 0,
            Sedan           : 1,
            SUV             : 2,
            BoxTruck        : 3
        },

        driverActivity: {
            Nothing         : 0,
            Accelerating    : 1,
            Decelerating    : 2
        },

        //Constants & defaults
        //                      Subcompact                  Sedan                       SUV                     BoxTruck
        C_weightSpreads:        [{min: 2000, max: 3000},    {min: 3000, max: 4000},     {min: 4000, max: 5000}, {min: 8000, max: 15000}], //In pounds
        C_carSizes:             [{width: 3, length: 6},     {width : 4, length : 8},    {width: 5, length: 10}, {width: 7, length: 15}], //In pounds
        C_horsepower:           [10,                        13,                         20,                     25], //Made-up units
        C_defaultFuel: 1000,
        C_carTypeWeights:       [10,                        10,                         5,                      2], //Weighted probability of type
        
        //Simple, short names, one per letter of the alphabet
        C_names: ["Ann", "Bob", "Chad", "Dory", "Eric", "Fran", "Gwen", "Hank", "Ian", "Jane", "Kate", "Larry", "Meg",
                        "Nate", "Olive", "Pam", "Qix", "Ray", "Steve", "Tia", "Usa", "Viv", "Wyatt", "Xena", "Yanni", "Zoe"],
        //Top 200 most popular names for males
        C_namesTop200M: ["John", "William", "James", "George", "Charles", "Robert", "Joseph", "Frank", "Edward", "Thomas", 
            "Henry", "Walter", "Harry", "Willie", "Arthur", "Albert", "Clarence", "Fred", "Harold", "Paul", "Raymond", 
            "Richard", "Roy", "Joe", "Louis", "Carl", "Ralph", "Earl", "Jack", "Ernest", "David", "Samuel", "Howard", 
            "Charlie", "Francis", "Herbert", "Lawrence", "Theodore", "Alfred", "Andrew", "Elmer", "Sam", "Eugene", 
            "Leo", "Michael", "Lee", "Herman", "Anthony", "Daniel", "Leonard", "Floyd", "Donald", "Kenneth", "Jesse", 
            "Russell", "Clyde", "Oscar", "Peter", "Lester", "Leroy", "Ray", "Stanley", "Clifford", "Lewis", "Benjamin", 
            "Edwin", "Frederick", "Chester", "Claude", "Eddie", "Cecil", "Lloyd", "Jessie", "Martin", "Bernard", "Tom", 
            "Will", "Norman", "Edgar", "Harvey", "Ben", "Homer", "Luther", "Leon", "Melvin", "Philip", "Johnnie", "Jim", 
            "Milton", "Everett", "Allen", "Leslie", "Alvin", "Victor", "Marvin", "Stephen", "Alexander", "Jacob", "Hugh", 
            "Patrick", "Virgil", "Horace", "Glenn", "Oliver", "Morris", "Vernon", "Archie", "Julius", "Gerald", "Maurice", 
            "Sidney", "Marion", "Otis", "Vincent", "Guy", "Earnest", "Wilbur", "Gilbert", "Willard", "Ed", "Roosevelt", 
            "Hubert", "Manuel", "Warren", "Otto", "Alex", "Ira", "Wesley", "Curtis", "Wallace", "Lonnie", "Gordon", "Isaac", 
            "Jerry", "Charley", "Jose", "Nathan", "Max", "Mack", "Rufus", "Arnold", "Irving", "Percy", "Bill", "Dan", 
            "Willis", "Bennie", "Jimmie", "Orville", "Sylvester", "Rudolph", "Glen", "Nicholas", "Dewey", "Emil", "Roland", 
            "Steve", "Calvin", "Mike", "Johnie", "Bert", "August", "Clifton", "Franklin", "Matthew", "Emmett", "Phillip", 
            "Wayne", "Edmund", "Abraham", "Nathaniel", "Marshall", "Dave", "Elbert", "Clinton", "Felix", "Alton", "Ellis", 
            "Nelson", "Amos", "Clayton", "Aaron", "Perry", "Adam", "Tony", "Irvin", "Jake", "Dennis", "Jerome", "Mark", 
            "Cornelius", "Ollie", "Douglas", "Pete", "Ted", "Adolph", "Roger", "Jay", "Roscoe", "Juan"],
        //Top 200 most popular names for females
        C_namesTop200F: ["Mary", "Helen", "Margaret", "Anna", "Ruth", "Elizabeth", "Dorothy", "Marie", "Florence", 
            "Mildred", "Alice", "Ethel", "Lillian", "Gladys", "Edna", "Frances", "Rose", "Annie", "Grace", "Bertha", 
            "Emma", "Bessie", "Clara", "Hazel", "Irene", "Gertrude", "Louise", "Catherine", "Martha", "Mabel", "Pearl", 
            "Edith", "Esther", "Minnie", "Myrtle", "Ida", "Josephine", "Evelyn", "Elsie", "Eva", "Thelma", "Ruby", 
            "Agnes", "Sarah", "Viola", "Nellie", "Beatrice", "Julia", "Laura", "Lillie", "Lucille", "Ella", "Virginia", 
            "Mattie", "Pauline", "Carrie", "Alma", "Jessie", "Mae", "Lena", "Willie", "Katherine", "Blanche", "Hattie", 
            "Marion", "Lucy", "Stella", "Mamie", "Vera", "Cora", "Fannie", "Eleanor", "Bernice", "Jennie", "Ann", "Leona", 
            "Beulah", "Lula", "Rosa", "Ada", "Ellen", "Kathryn", "Maggie", "Doris", "Dora", "Betty", "Marguerite", "Violet", 
            "Lois", "Daisy", "Anne", "Sadie", "Susie", "Nora", "Georgia", "Maude", "Marjorie", "Opal", "Hilda", "Velma", 
            "Emily", "Theresa", "Charlotte", "Inez", "Olive", "Flora", "Della", "Lola", "Jean", "Effie", "Nancy", "Nettie", 
            "Sylvia", "May", "Lottie", "Alberta", "Eunice", "Sallie", "Katie", "Genevieve", "Estelle", "Lydia", "Loretta", 
            "Mable", "Goldie", "Eula", "Rosie", "Lizzie", "Vivian", "Verna", "Ollie", "Harriet", "Lucile", "Addie", "Marian", 
            "Henrietta", "Jane", "Lela", "Essie", "Caroline", "Ora", "Iva", "Sara", "Maria", "Madeline", "Rebecca", "Wilma", 
            "Etta", "Barbara", "Rachel", "Kathleen", "Irma", "Christine", "Geneva", "Sophie", "Juanita", "Nina", "Naomi", 
            "Victoria", "Amelia", "Erma", "Mollie", "Susan", "Flossie", "Ola", "Nannie", "Norma", "Sally", "Olga", "Alta", 
            "Estella", "Celia", "Freda", "Isabel", "Amanda", "Frieda", "Luella", "Matilda", "Janie", "Fern", "Cecelia", 
            "Audrey", "Winifred", "Elva", "Ina", "Adeline", "Leola", "Hannah", "Geraldine", "Amy", "Allie", "Miriam", 
            "Isabelle", "Bonnie", "Virgie", "Sophia", "Cleo", "Jeanette", "Nell", "Eliza"]
    }, //End carData

    //This holds the road data and road-related functions.  See road.js
    roadNetwork: {},
    
    //This holds the data for the emitters.  See emitter.js
    emitters: Array(),

    //This holds the data for the drivers on the road.  Each driver has a Car.  See driver.js and car.js
    drivers: Array(),

    //Helper functions

    /**
     * Is undefined or null or empty?
     * @param {*} x - Any object
     * @returns Boolean
     */
    isNull: function(x) {
        return typeof(x) == "undefined" || x == null || x == "";
    },

    /**
     * If x is null, set it to a default value.
     * @param {*} x - Input parameter
     * @param {*} def - Default value to set if x is undefined, null, or empty
     * @returns A value that isn't undefined or null or empty
     */
    setDefaultIfEmpty: function(x, def) {
        if (this.isNull(x)) return def; else return x;
    },

    /**
     * Random function for probabilities
     * @param {decimal} p - Probability
     * @returns Boolean randomly based on probability p
     */
    chance: function(p) {
        return p >= Math.random();
    },

    /**
     * Returns a random integer in range of min (inclusive) to max (exclusive)
     * @param {int} max - Max value (won't ever return this number)
     * @param {int} min - Optional. Default 0. Min value (may return this number)
     * @returns Integer
     */
    randomInt: function(max, min) {
        min = this.setDefaultIfEmpty(min, 0);
        return Math.floor(Math.random() * (max - min)) + min;
    },

    /**
     * Convert meters per second to miles per hour
     * @param {decimal} v - Velocity in meters per second
     * @returns Integer in miles per hour
     */
    getMph: function(v) {
        return Math.round(v * this.globals.C_scale * this.globals.C_convertMpsMph);
    },

    getKph: function(v) {
        return Math.round(v * this.globals.C_scale * 60 * 60 / 1000);
    }
};

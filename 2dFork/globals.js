var fps = 60;
var max = 32;
var numCars = 0;
var lastTime = null;
var accel = 30;
var decel = accel * 4;
var pause = false; //Pause the simulation
var slow = false; //Slow the simulation down by 1/1000 for debugging
var stop = false; //Kills iteration of step()

var carType = { 
    Subcompact : 0,
    Sedan : 1,
    SUV : 2,
    BoxTruck : 3
};

var driverActivity = {
    Nothing : 0,
    Accelerating : 1,
    Decelerating : 2
};

function chance(p) {
    return p >= Math.random();
}

//Constants & defaults
//                      Subcompact                  Sedan                       SUV                     BoxTruck
var C_weightSpreads =   [{min: 2000, max: 3000},    {min: 3000, max: 4000},     {min: 4000, max: 5000}, {min: 8000, max: 15000}]; //In pounds
var C_carSizes =        [{width: 3, length: 6},     {width : 4, length : 8},    {width: 5, length: 10}, {width: 7, length: 15}]; //In pounds
var C_horsepower =      [10,                        13,                         20,                     25]; //Made-up units
var C_defaultFuel = 1000;
var C_carTypeWeights =  [10,                        10,                         5,                      2]; //Weighted probability of type
var C_names = ["Ann", "Bob", "Chad", "Dory", "Eric", "Fran", "Gwen", "Hank", "Ian", "Jane", "Kate", "Larry", "Meg",
                "Nate", "Olive", "Pam", "Qix", "Ray", "Steve", "Tia", "Usa", "Viv", "Wyatt", "Xena", "Yanni", "Zoe"];
var C_namesTop200M = ["John", "William", "James", "George", "Charles", "Robert", "Joseph", "Frank", "Edward", "Thomas", 
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
    "Cornelius", "Ollie", "Douglas", "Pete", "Ted", "Adolph", "Roger", "Jay", "Roscoe", "Juan"];
var C_namesTop200F = ["Mary", "Helen", "Margaret", "Anna", "Ruth", "Elizabeth", "Dorothy", "Marie", "Florence", 
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
    "Isabelle", "Bonnie", "Virgie", "Sophia", "Cleo", "Jeanette", "Nell", "Eliza"];

var roadPath = [];
var roadNetwork = {};
var emitter = {}; 

const fs = require('fs');

//these are the parameters of the terrain generation
var resolution = 150 //resolution of terrain
    hilliness = 175 //variable for hilliness of the terrain
    baseHumidity = 10 //base humidity for the biomes

var elevation = [] //elevation heightmap
    humidity = []; //humidity heightmap

//Incline -- inclines by a random value
function incline(base = 0, slope = hilliness) {
    return base + (Math.random() * slope - (slope / 2));
}

//heightmap -- has equations for the heightmaps used in the terrain gen
function heightmap(array, base = 0, slope = hilliness){
    //setup 2d array for heightmaps
    for (i = 0; i, i < resolution; i++) {
        array[i] = [];
    }

    //generates terrain heightmap for top layer
    array[0][0] = incline(base, slope);
    for (var i = 1; i < resolution * 2; i++) {
        array[0][i] = incline(array[0][i - 1], slope);
    }
    //generates rest of the heightmap
    for (var i = 1; i < resolution; i++) {
        array[i][0] = incline(array[i - 1][0], slope);
        for (var j = 1; j < resolution * 2; j++) {
            array[i][j] = incline((array[i][j - 1] + array[i - 1][j + 1]) / 2, slope);
        }
    }
}

//Terrain generation -- generates terrain
function generate() {

    //generates heightmap
    heightmap(elevation);

    //generates humidity map    
    heightmap(humidity, baseHumidity, 40);

    for (var i = 0; i < resolution; i++) {
        for (var j = 0; j < resolution; j++) {
            if (elevation[i][j] <= 0) {
                humidity[i][j] += 1000;
            }
        }
    }

    //draws terrain
    draw();
}

//Draw -- draws terrain to canvas 
function draw(mode) {
    var canvas = document.getElementById('terrainbox');
    var ctx = canvas.getContext('2d');

    //clears previous terrain
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    //draws terrain
    for (var i = 0; i < resolution; i++) {
        for (var j = 0; j < resolution; j++) {

            switch (mode) {
                default:
                    //default fill colors
                    ctx.fillStyle =
                        elevation[i][j] > 1000 ? "white" //peak
                        : elevation[i][j] > 800 ? "sienna" //mountain
                        : elevation[i][j] > 0 ? 
                        humidity[i][j] > 80 ? "darkgreen" //forest
                            : humidity[i][j] > -50 ? "green" //plains
                            : "sandybrown" //desert
                        /*SEA LEVEL ELEVATION*/
                        : elevation[i][j] > -500 ? 
                            humidity[i][j] > -70 ? "dodgerblue" //water
                            : "sandybrown" //below sea level desert 
                        : humidity[i][j] > -100 ? "royalblue" //abyss
                        : "brown"; //desert abyss
                    break;
                case "heightmap":
                    var lightLevel = (elevation[i][j]+500) /7;
                    ctx.fillStyle = `rgb(${lightLevel}, ${lightLevel}, ${lightLevel})`;
                    break;
                case "humidity":
                    var lightLevel = (humidity[i][j]+150) /3;
                    ctx.fillStyle = `rgb(${lightLevel}, ${lightLevel}, ${lightLevel})`;
                    break;
            }

            ctx.fillRect((canvas.width / resolution) * i, (canvas.height / resolution) * j, (canvas.width / resolution), (canvas.height / resolution) + 2);

            //nice ;)
            if (hilliness == 69) {
                ctx.fillStyle = ("black");
                ctx.fillText("nice", 69, 69);
            }
        }
    }
}
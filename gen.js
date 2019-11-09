const fs = require('fs');

var resolution = 150 //resolution of terrain
    hilliness = 150; //max incline between parts

var elevation = []

//Incline -- inclines by a random value
function incline(base = 0, slope = hilliness) {
    return base + (Math.random() * slope - (slope / 2))
}

//Terrain generation -- draws and generates terrain
function generate() {

    //setup 2d array for heightmap
    for (i = 0; i, i < resolution; i++) {
        elevation[i] = [];
    }

    //generates terrain heightmap for top layer
    elevation[0][0] = incline();
    for (var i = 1; i < resolution * 2; i++) {
        elevation[0][i] = incline(elevation[0][i - 1]);
    }
    //generates rest of the heightmap
    for (var i = 1; i < resolution; i++) {
        elevation[i][0] = incline(elevation[i - 1][0]);
        for (var j = 1; j < resolution * 2; j++) {
            elevation[i][j] = incline((elevation[i][j - 1] + elevation[i - 1][j + 1]) / 2);
        }
    }

    //adds noise
    for (var i = 0; i < resolution; i++) {
        for (var j = 0; j < resolution; j++) {
            elevation[i][j] = incline(elevation[i][j], hilliness * 0.25);
        }
    }

    //draws terrain
    draw();
}

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
                        elevation[i][j] > 1000 ? "white" //snow mountain
                        : elevation[i][j] > 800 ? "sienna" //mountain
                        : elevation[i][j] > 0 ? "green" //default (will soon add biomes)
                        : elevation[i][j] > -500 ? "dodgerblue" //ocean
                        : "royalblue"; //abyss
                    break;
                case "heightmap":
                    var lightLevel = (elevation[i][j]+500) /7;
                    ctx.fillStyle = `rgb(${lightLevel}, ${lightLevel}, ${lightLevel})`;
                    break;
            }

            ctx.fillRect((canvas.width / resolution) * i, (canvas.height / resolution) * j, (canvas.height / resolution) + 2, (canvas.height / resolution) + 2);

            //nice ;)
            if(hilliness == 69) {
                ctx.fillStyle = ("black");
                ctx.fillText("nice", 69, 69);
            }
        }
    }
}
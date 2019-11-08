var terrainScale = 150 //resolution of terrain
hilliness = 150; //max incline between parts

var terrainHeight = []

//Randomizer -- returns random value in an array
function rdm(array) {
    return array[Math.floor(Math.random() * (array.length))];
}

//Incline -- inclines by a random value
function incline(base = 0, slope = hilliness) {
    return base + (Math.random() * slope - (slope / 2))
}

//Terrain generation -- draws and generates terrain
function generate() {

    //setup 2d array for heightmap
    for (i = 0; i, i < terrainScale; i++) {
        terrainHeight[i] = [];
    }

    //generates terrain heightmap for top layer
    terrainHeight[0][0] = incline();
    for (var i = 1; i < terrainScale * 2; i++) {
        terrainHeight[0][i] = incline(terrainHeight[0][i - 1]);
    }
    //generates rest of the heightmap
    for (var i = 1; i < terrainScale; i++) {
        terrainHeight[i][0] = incline(terrainHeight[i - 1][0]);
        for (var j = 1; j < terrainScale * 2; j++) {
            terrainHeight[i][j] = incline((terrainHeight[i - 1][j] + terrainHeight[i][j - 1] + terrainHeight[i - 1][j + 1]) / 3);
        }
    }

    //adds noise
    for (var i = 0; i < terrainScale; i++) {
        for (var j = 0; j < terrainScale; j++) {
            terrainHeight[i][j] = incline(terrainHeight[i][j], hilliness * 0.34);
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
    for (var i = 0; i < terrainScale; i++) {
        for (var j = 0; j < terrainScale; j++) {

            switch (mode) {
                default:
                    //default fill colors
                    ctx.fillStyle =
                        terrainHeight[i][j] > 1000 ? "white" //snow mountain
                        : terrainHeight[i][j] > 800 ? "sienna" //mountain
                        : terrainHeight[i][j] > 0 ? "green" //default (will soon add biomes)
                        : terrainHeight[i][j] > -500 ? "dodgerblue" //ocean
                        : "royalblue"; //abyss
                    break;
                case "heightmap":
                    var lightLevel = (terrainHeight[i][j]+300) /6;
                    ctx.fillStyle = `rgb(${lightLevel}, ${lightLevel}, ${lightLevel})`;
                    break;
            }

            ctx.fillRect((canvas.width / terrainScale) * i, (canvas.height / terrainScale) * j, (canvas.height / terrainScale) + 1, (canvas.height / terrainScale) + 1);
        }
    }
}
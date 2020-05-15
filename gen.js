const {ipcRenderer} = require("electron"),
    tumult = require('tumult');

//these are the parameters of the terrain generation
var resolution = 256, //resolution of terrain
    hilliness = 30, //variable for hilliness of the terrain
    baseHumidity = 50, //base humidity for the biomes
    biomeScale = 155, //size for the biomes
    landScale = 100; //size for the land

var elevation = [], //elevation heightmap
    humidity = []; //humidity heightmap

var drawMode, seaLevel;

//Incline -- inclines by a random value
function incline(base = 0, slope = hilliness) {
    return base + (Math.random() * slope - (slope / 2));
}

//detects setting change from the settings window and applies it
ipcRenderer.on("setting", (e, value) => {
    let newValue = parseInt(value[1]);
    switch(value[0]){
        case "resolution":
            resolution = newValue;
            break;
        case "hilliness":
            hilliness = newValue;
            break;
        case "baseHumidity":
            baseHumidity = newValue;
            break;
    }
});

//sends settings to settings screen when it's loaded
ipcRenderer.on("loadSettings", (e) => {
    ipcRenderer.send("sendSettings",
        {"resolution": resolution,
        "hilliness": hilliness,
        "baseHumidity": baseHumidity
        });
});

//keyboard shortcut to generate terrain (ctrl+g) and drawmodes (ctrl + 1,2,3)
ipcRenderer.on("shortcut", (e, value) => {
    switch (value[0]){
        case "generate":
            generate();
            break;
        case "draw":
            draw(value[1]);
        break;
    }
});

//P O L Y G O N S
function poly(array, base = 0, slope = hilliness){

    //hardcapping resolution at 1024
    if(resolution > 1024) resolution = 1024

    for (let i = 0; i, i < resolution; i++) {
        array[i] = [];
    }
    array[0][0] = incline(base, slope/3);
    for (let i = 1; i < resolution; i++) {
        array[0][i] = incline(array[0][i - 1], slope);
    }
    if(Math.floor(Math.random() * 2) == 0){
        for (let i = 1; i < resolution; i++) {
            array[i][0] = incline(array[i - 1][0], slope);
            for (let j = 1; j < resolution; j++) {
                array[i][j] = incline(array[i][j - 1] ^ array[i - 1][j] / (Math.random() * 100), slope);
            }
        }
    }else{
        for (let i = 1; i < resolution; i++) {
            array[i][0] = incline(array[i - 1][0], slope);
            for (let j = 1; j < resolution; j++) {
                array[i][j] = incline(array[i][j - 1] * array[i - 1][j] / (Math.random() * 100), slope);
            }
        }
    }
}

function polygon(){

        poly(elevation);   
        poly(humidity, baseHumidity, 60);
    
        seaLevel = 0
    
        draw();
        console.log("Hail Sierpinski")
}

//heightmap -- generates 2d arrays using perlin noise
function heightmap(array, base = 0, slope = 20, scale = 100, seed){

    array.length = 0; //clears any existing terrain

    //setup 2d array for heightmaps
    for (let x = 0; x < resolution; x++) {
        array[x] = [];
    }

    const small = 0.03 * scale;

    //creates new heightmap from perlin noise
    const map = new tumult.Perlin2(seed); 
    
    //sets array values to that from perlin object
    for (let x = 0; x < resolution; x++) {
        for (let y = 0; y < resolution; y++) {
            array[x][y] = base + (6 * map.gen(x / small, y / small) + 120 * map.octavate(6, x / scale, y / scale)) * slope;
        }
    }
}

//Generate -- generates terrain
function generate(seed) {

    //hardcapping resolution at 512
    if(resolution > 512) resolution = 512;

    //limiting scales
    if (landScale < 50) landScale = 50;
    if (biomeScale < 50) biomeScale = 50;

    //generates heightmap
    heightmap(elevation, 15, hilliness, landScale, seed);

    //generates humidity map    
    heightmap(humidity, baseHumidity, 6, biomeScale, seed);

    seaLevel = incline(baseHumidity - 50, 5);

    //draws terrain
    draw();
}

//Draw -- draws terrain to canvas 
function draw(mode = drawMode) {

    const canvas = document.getElementById('terrainbox'),
        ctx = canvas.getContext('2d'),
        biomes = require('./biomes.json')
    
    //HD
    canvas.width = 1200;
    canvas.height = 900;

    drawMode = mode || "normal"; //sets the draw mode to the input if given

    const {width, height} = canvas;

    //clears previous terrain
    ctx.clearRect(0, 0, width, height);

    //draws terrain
    for (let x = 0; x < resolution; x++) {
        for (let y = 0; y < resolution; y++) {

            switch (mode) {
                default:
                case "normal":
                    //default fill colors
                    if(elevation[x][y] > seaLevel){
                    ctx.fillStyle =
                        elevation[x][y] > 1200 ? biomes.peak
                        : elevation[x][y] > 1000 ? biomes.mountain
                        : elevation[x][y] > 850 ? biomes.mountain2
                        : elevation[x][y] > 750 ?
                            humidity[x][y] > 0 ? biomes.mountain2
                            : biomes.mesa
                        : elevation[x][y] > -100 ? 
                            humidity[x][y] > 250 ? biomes.urwald
                            : humidity[x][y] > 150 ? biomes.forest
                            : humidity[x][y] > 0 ? biomes.plains
                            : humidity[x][y] > -30 ? biomes.savannah
                            : biomes.desert
                        : elevation[x][y] > -500 ? 
                            humidity[x][y] > 0 ? biomes.desert
                            : biomes.canyon
                        : biomes.desertabyss
                    //filling in water
                    }else if (elevation[x][y] > seaLevel - 700){
                        ctx.fillStyle = "dodgerblue"; //water
                    }else {
                        ctx.fillStyle = "royalblue"; //abyss
                    }
                    break;
                case "heightmap":
                    var lightLevel = (elevation[x][y]+500) /7;
                    ctx.fillStyle = `rgb(0, ${lightLevel}, 0)`;
                    break;
                case "humidity":
                    if(elevation[x][y] > seaLevel){
                        var lightLevel = (humidity[x][y]+100) /2;
                    }else{
                        //undersea is always blue
                        var lightLevel = '256';
                    }
                    ctx.fillStyle = `rgb(0, 0, ${lightLevel})`;
                    break;
            }

            //draws pixel
            ctx.fillRect((width / resolution) * x, (height / resolution) * y, width / resolution + 1, height / resolution + 1);
        }
    }

    //nice ;)
    if (baseHumidity == 69) {
        ctx.fillStyle = ("black");
        ctx.fillText("nice", 69, 69);
    }
}
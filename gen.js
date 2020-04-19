const fs = require('fs')
    electron = require("electron")

const {ipcRenderer} = electron;

//these are the parameters of the terrain generation
var resolution = 240 //resolution of terrain
    hilliness = 175 //variable for hilliness of the terrain
    baseHumidity = 50 //base humidity for the biomes

var elevation = [] //elevation heightmap
    humidity = []; //humidity heightmap

var drawMode, seaLevel;

//Incline -- inclines by a random value
function incline(base = 0, slope = hilliness) {
    return base + (Math.random() * slope - (slope / 2));
}

//detects setting change from the settings window and applies it
ipcRenderer.on("setting", function(e, value){
    switch(value[0]){
        case "resolution":
            resolution = value[1];
            break;
        case "hilliness":
            hilliness = value[1];
            break;
        case "baseHumidity":
            baseHumidity = parseInt(value[1]);
            break;
    }
});

//sends settings to settings screen when it's loaded
ipcRenderer.on("loadSettings", function(e){
    ipcRenderer.send("sendSettings", [resolution, hilliness, baseHumidity]);
})

//heightmap -- has equations for the heightmaps used in the terrain gen
function heightmap(array, base = 0, slope = hilliness){
    //setup 2d array for heightmaps
    for (i = 0; i, i < resolution; i++) {
        array[i] = [];
    }

    //generates terrain heightmap for top layer
    array[0][0] = incline(base, slope/3);
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

//P O L Y G O N S
function poly(array, base = 0, slope = hilliness){

    //hardcapping resolution at 1024
    if(resolution > 1024){
        resolution = 1024
    }

    for (i = 0; i, i < resolution; i++) {
        array[i] = [];
    }
    array[0][0] = incline(base, slope/3);
    for (var i = 1; i < resolution; i++) {
        array[0][i] = incline(array[0][i - 1], slope);
    }
    if(Math.floor(Math.random() * 2) == 0){
        for (var i = 1; i < resolution; i++) {
            array[i][0] = incline(array[i - 1][0], slope);
            for (var j = 1; j < resolution; j++) {
                array[i][j] = incline(array[i][j - 1] ^ array[i - 1][j] / (Math.random() * 100), slope);
            }
        }
    }else{
        for (var i = 1; i < resolution; i++) {
            array[i][0] = incline(array[i - 1][0], slope);
            for (var j = 1; j < resolution; j++) {
                array[i][j] = incline(array[i][j - 1] * array[i - 1][j] / (Math.random() * 100), slope);
            }
        }
    }
}

function polygon(){

        poly(elevation);   
        poly(humidity, baseHumidity, 40);
    
        seaLevel = 0
    
        draw();
        console.log("Hail Sierpinski")
}

//Generate -- generates terrain
function generate() {

    //hardcapping resolution at 512
    if(resolution > 512){
        resolution = 512
    }

    //generates heightmap
    heightmap(elevation);

    //generates humidity map    
    heightmap(humidity, baseHumidity, 40);

    seaLevel = incline(baseHumidity - 50, 10) / 2;

    //draws terrain
    draw();
}

//Draw -- draws terrain to canvas 
function draw(mode = drawMode) {

    var canvas = document.getElementById('terrainbox');
    var ctx = canvas.getContext('2d');
    
    //HD
    canvas.width = 1200;
    canvas.height = 900;

    if(mode){
        drawMode = mode; //sets the draw mode to the input if given
    }

    //clears previous terrain
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    //draws terrain
    for (var i = 0; i < resolution; i++) {
        for (var j = 0; j < resolution; j++) {

            switch (mode) {
                default:
                case "normal":
                    //default fill colors
                    if(elevation[i][j] > seaLevel){
                    ctx.fillStyle =
                        elevation[i][j] > 1200 ? "white" //peak
                        : elevation[i][j] > 1000 ? "silver" //mountain
                        : elevation[i][j] > 850 ? "sienna"
                        : elevation[i][j] > 750 ?
                            humidity[i][j] > 0 ? "sienna" //hill
                            : "tomato" //mesa
                        : elevation[i][j] > -100 ? 
                            humidity[i][j] > 200 ? "#005700"//primeval forest
                            : humidity[i][j] > 150 ? "darkgreen" //forest
                            : humidity[i][j] > 0 ? "green" //plains
                            : humidity[i][j] > -30 ? "#8a9932" //savannah
                            : "sandybrown" //desert
                        : elevation[i][j] > -500 ? 
                            humidity[i][j] > 0 ? "sandybrown"
                            : "coral" //canyon 
                        : humidity[i][j] > 0 ? "sandybrown"
                            : "brown" //desert abyss
                    //filling in water
                    }else if (elevation[i][j] > seaLevel - 500){
                        ctx.fillStyle = "dodgerblue"; //water
                    }else {
                        ctx.fillStyle = "royalblue"; //abyss
                    }
                    break;
                case "heightmap":
                    var lightLevel = (elevation[i][j]+500) /7;
                    ctx.fillStyle = `rgb(0, ${lightLevel}, 0)`;
                    break;
                case "humidity":
                    if(elevation[i][j] > seaLevel){
                        var lightLevel = (humidity[i][j]+100) /2;
                    }else{
                        //undersea is always blue
                        var lightLevel = '256';
                    }
                    ctx.fillStyle = `rgb(0, 0, ${lightLevel})`;
                    break;
            }

            //draws pixel
            ctx.fillRect((canvas.width / resolution) * i, (canvas.height / resolution) * j, canvas.width / resolution + 1, canvas.height / resolution + 1);
        }
    }

    //nice ;)
    if (hilliness == 69) {
        ctx.fillStyle = ("black");
        ctx.fillText("nice", 69, 69);
    }

}
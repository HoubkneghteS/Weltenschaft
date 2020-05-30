const { ipcRenderer } = require("electron");

//these are the parameters of the terrain generation
var resolution = 256, //resolution of terrain
	hilliness = 30, //hilliness of the terrain
	baseHumidity = 50, //base humidity for the biomes
	biomeScale = 155, //size for the biomes
	landScale = 100; //size for the land

var elevation = [], //elevation heightmap
	humidity = []; //humidity heightmap

var seaLevel = 0;

var drawMode;

var lastCall;

//detects setting change from the settings window and applies it
ipcRenderer.on("setting", (e, args) => {
	let newValue = parseInt(args[1]);

	global[args[0]] = newValue; //applies new value

	if(args[0] == "seaLevel"){
		let drawDelay = Math.round(elevation.length / 2.9);

		//prevents redrawing from happening too often as it slows things down
		if (new Date() - lastCall > drawDelay || !lastCall) {
			draw();
			lastCall = new Date();
		}	
	}
});

//sends settings to settings screen when it's loaded
ipcRenderer.on("loadSettings", (e, id) =>
	ipcRenderer.sendTo(id, "sendSettings",
		{
			"resolution": resolution,
			"hilliness": hilliness,
			"baseHumidity": baseHumidity,
			"seaLevel": seaLevel
}));

//keyboard shortcut to generate terrain (ctrl+g) and drawmodes (ctrl + 1,2,3)
ipcRenderer.on("shortcut", (e, ...args) => {
	switch (args[0]) {
		case "generate":
			generate();
			break;
		case "draw":
			draw(args[1]);
			break;
	}
});

//heightmap -- generates 2d arrays using perlin noise
function heightmap(array, base = 0, slope = 20, scale = 100, seed) {

	const {Perlin2} = require('tumult');

	const small = 0.03 * scale;

	//creates new heightmap from perlin noise
	const map = new Perlin2(seed);

	//etches perlin noise value onto the heightmap array in rows
	for (let x = 0; x < resolution; x++) {
		let row = [];
		for (let y = 0; y < resolution; y++) {
			row.push(base + (6 * map.gen(x / small, y / small) + 120 * map.octavate(5, x / scale, y / scale)) * slope);
		}
		array.push(row);
	}
}

//Generate -- generates terrain
function generate(seed) {

	console.time("generate"); //starts timer

	//softcapping resolution at 512
	if (resolution > 512) console.warn("Warning - map sizes above 512 not officially supported, any bugs related to this may not be fixed");

	//limiting scales
	if (landScale < 50) landScale = 50;
	if (biomeScale < 50) biomeScale = 50;

	//clears existing terrain
	elevation = [];
	humidity = [];

	heightmap(elevation, 0, hilliness, landScale, seed); //generates heightmap 
	heightmap(humidity, baseHumidity, 6, biomeScale, seed); //generates humidity map

	//draws terrain
	draw();

	console.timeEnd("generate"); //stops timer
}

//Draw -- draws terrain to canvas 
function draw(mode = drawMode) {

	const canvas = document.getElementById('terrainbox'),
		ctx = canvas.getContext('2d'),
		biomes = require('./biomes.json');

	drawMode = mode || "normal"; //sets the draw mode to the input if given

	const { width, height } = canvas;

	let r = elevation.length;

	//draws terrain
	for (let x = 0; x < r; x++) {
		for (let y = 0; y < r; y++) {

			switch (mode) {
				default:
				case "normal":
					//default fill colors
					if (elevation[x][y] > seaLevel) {
						ctx.fillStyle =
							elevation[x][y] > 1250 ? biomes.peak
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
					} else if (elevation[x][y] > seaLevel - 700) {
						ctx.fillStyle = biomes.water;
					} else if (elevation[x][y] > seaLevel - 1250) {
						ctx.fillStyle = biomes.abyss;
					} else {
						ctx.fillStyle = biomes.trench;
					}
					break;
				case "heightmap":
					var lightLevel = (elevation[x][y] + 1000) / 11;
					ctx.fillStyle = `rgb(0, ${lightLevel}, 0)`;
					break;
				case "humidity":
					var lightLevel = (elevation[x][y] > seaLevel)
						? (humidity[x][y] + 100) / 2
						: 256; //undersea is always blue

					ctx.fillStyle = `rgb(0, 0, ${lightLevel})`;
					break;
			}

			//draws pixel
			ctx.fillRect(Math.ceil((width / r) * x), Math.ceil((height / r) * y), Math.ceil(width / r), Math.ceil(height / r));
		}
	}

	//nice ;)
	if (baseHumidity == 69) {
		ctx.fillStyle = ("black");
		ctx.fillText("nice", 69, 69);
	}
}
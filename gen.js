const { ipcRenderer } = require("electron");

var resolution = 256,
	hilliness = 30,
	baseHumidity = 50,
	biomeScale = 155,
	landScale = 100;

var elevation = [],
	humidity = [];

var seaLevel = 0;

var drawMode;

var lastCall;

function createHeightmap(array, base = 0, slope = 20, scale = 100, seed) {

	const {Perlin2} = require('tumult');

	const small = 0.03 * scale,
		map = new Perlin2(seed);

	for (let x = 0; x < resolution; x++) {
		let row = [];
		for (let y = 0; y < resolution; y++) {
			row.push(base + (6 * map.gen(x / small, y / small) + 120 * map.octavate(5, x / scale, y / scale)) * slope);
		}
		array.push(row);
	}
}

function generate(seed) {

	console.time("generate");

	//softcapping resolution at 512
	if (resolution > 512) console.warn("Warning - map sizes above 512 not officially supported, any bugs related to this may not be fixed");

	if (landScale < 50) landScale = 50;
	if (biomeScale < 50) biomeScale = 50;

	//clears existing terrain
	elevation = [];
	humidity = [];

	createHeightmap(elevation, 0, hilliness, landScale, seed);  
	createHeightmap(humidity, baseHumidity, 6, biomeScale, seed);

	draw();

	console.timeEnd("generate");
}

function draw(mode = drawMode) {

	const canvas = document.getElementById('terrainbox'),
		ctx = canvas.getContext('2d'),
		biomes = require('./biomes.json');

	drawMode = mode || "normal";

	const { width, height } = canvas;

	let r = elevation.length;

	for (let x = 0; x < r; x++) {
		for (let y = 0; y < r; y++) {

			switch (mode) {
				default:
				case "normal":
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

			ctx.fillRect(Math.ceil((width / r) * x), Math.ceil((height / r) * y), Math.ceil(width / r), Math.ceil(height / r));
		}
	}

	//nice ;)
	if (baseHumidity == 69) {
		ctx.fillStyle = ("black");
		ctx.fillText("nice", 69, 69);
	}
}

/*INTERPROCESS COMMUNICATION*/

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
ipcRenderer.on("loadSettings", (e, winID) =>
	ipcRenderer.sendTo(winID, "sendSettings",
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
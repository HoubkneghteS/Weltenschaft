const params = {
	resolution: 256, //resolution of terrain array (n * n)
	hilliness: 30, //amplitude of the elevation noise
	baseHumidity: 50, //baseline for humidity
	biomeScale: 155, //scale of humidity-based biomes
	landScale: 100, //scale for landforms
	drawMode: 'normal' //drawmode - valid values: normal, heightmap, humidity
};

var world = {
	elevation: [],
	humidity: [],
	seaLevel: 0
};

var lastCall;

function createHeightmap({base = 0, amplitude = 6, scale = 100, resolution = 256} = {}, seed) {

	var array = [];
	const {Perlin2} = require('tumult');

	const small = 0.03 * scale,
		map = new Perlin2(seed);

	for (let x = 0; x < resolution; x++) {
		let row = [];
		for (let y = 0; y < resolution; y++) {
			row.push(base + (6 * map.gen(x / small, y / small) + 120 * map.octavate(5, x / scale, y / scale)) * amplitude);
		}
		array.push(row);
	}
	return array;
}

function generate({resolution, hilliness, baseHumidity, biomeScale, landScale} = params, seed = Math.random()) {

	console.time("generate");

	//softcapping resolution at 512
	if (resolution > 512) console.warn("Map sizes above 512 not officially supported, any bugs related to this may not be fixed");

	if (landScale < 50) landScale = 50;
	if (biomeScale < 50) biomeScale = 50;

	world.elevation = createHeightmap({amplitude: hilliness, scale: landScale, resolution: resolution}, seed);  
	world.humidity = createHeightmap({base: baseHumidity, scale: biomeScale, resolution: resolution}, seed);

	if (!world.seaLevel) world.seaLevel = 0;

	world.seed = seed;

	draw();

	console.timeEnd("generate");
}

function draw(mode = params.drawMode) {

	const biomes = require('./biomes.json'),
		{elevation, humidity, seaLevel} = world;

	params.drawMode = mode || "normal";

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
					lightLevel = (elevation[x][y] > seaLevel)
						? (humidity[x][y] + 100) / 2
						: 256; //undersea is always blue

					ctx.fillStyle = `rgb(0, 0, ${lightLevel})`;
					break;
			}

			ctx.fillRect(Math.ceil((width / r) * x), Math.ceil((height / r) * y), Math.ceil(width / r), Math.ceil(height / r));
		}
	}

	//nice ;)
	if (params.baseHumidity == 69) {
		ctx.fillStyle = ("black");
		ctx.fillText("nice", 69, 69);
	}
}

/* SAVING AND LOADING WORLDS*/

function saveWorld(){
	ipcRenderer.send("saveWorld", world);
}

async function loadWorld(){
	const savedWorld = await ipcRenderer.invoke("loadWorld");

	if (!savedWorld) return;

	world = {};

	for(key in savedWorld){
		world[key] = savedWorld[key];
	}
	draw();
}

/*INTERPROCESS COMMUNICATION*/

const { ipcRenderer } = require("electron");

//detects setting change from the settings window and applies it
ipcRenderer.on("setting", (e, args) => {
	let settingToChange = args[0],
		newValue = parseInt(args[1]);

	if(settingToChange == "seaLevel"){
		let drawDelay = Math.round(world.elevation.length / 2.9);

		//prevents redrawing from happening too often as it slows things down
		if (new Date() - lastCall > drawDelay || !lastCall) {
			draw();
			lastCall = new Date();
		}
		world.seaLevel = newValue;	
	} else params[settingToChange] = newValue;
});

//sends settings to settings screen when it's loaded
ipcRenderer.on("loadSettings", (e, winID) => {

	let {resolution, hilliness, baseHumidity} = params;

	ipcRenderer.sendTo(winID, "sendSettings",
		{
			"resolution": resolution,
			"hilliness": hilliness,
			"baseHumidity": baseHumidity,
			"seaLevel": world.seaLevel
		});
});

//keyboard shortcut to generate terrain (ctrl+g) and drawmodes (ctrl + 1,2,3)
ipcRenderer.on("shortcut", (e, ...args) => {
	switch (args[0]) {
		case "generate":
			generate();
			break;
		case "draw":
			draw(args[1]);
			break;
		case "save":
			saveWorld();
			break;
		case "load":
			loadWorld();
			break;
	}
});
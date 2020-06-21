const params = {
	resolution: 256, //resolution of terrain array (n * n)
	hilliness: 30, //amplitude of the elevation noise
	baseHumidity: 50, //baseline for humidity
	biomeScale: 155, //scale of humidity-based biomes
	landScale: 100, //scale for landforms
	seaLevel: 0, //default sea level
	drawMode: 'normal', //drawmode - valid values: normal, heightmap, humidity
	roundFactor: 100, //to which decimal place terrain array values are rounded
};

var world = {};

var lastCall;

function createHeightmap({base = 0, amplitude = 6, scale = 100, resolution = 256, roundFactor = 100} = {}, seed) {

	var array = [];
	const {Perlin2} = require('tumult'),
		small = 0.03 * scale,
		map = new Perlin2(seed);

	for (let x = 0; x < resolution; x++) {
		let row = [];
		for (let y = 0; y < resolution; y++) {
			const value = base + (6 * map.gen(x / small, y / small) + 120 * map.octavate(5, x / scale, y / scale)) * amplitude;
			row.push( Math.round( value * roundFactor) / roundFactor );
		}
		array.push(row);
	}

	return array;
}

function generate({resolution, hilliness, baseHumidity, biomeScale, landScale, seaLevel, roundFactor} = params, seed = Math.random()) {

	console.time("generate");

	//softcapping resolution at 512
	if (resolution > 512) console.warn("Map sizes above 512 not officially supported, any bugs related to this may not be fixed");

	world = {
		elevation: createHeightmap({amplitude: hilliness, scale: landScale, resolution: resolution, roundFactor: roundFactor}, seed + 0.01),
		humidity: createHeightmap({base: baseHumidity, scale: biomeScale, resolution: resolution, roundFactor: roundFactor}, seed),
		seaLevel: seaLevel,
		seed: seed,
		structures: {},
	};

	draw();

	console.timeEnd("generate");
}

function draw(mode = params.drawMode) {

	if(!world.elevation || !Array.isArray(world.elevation) || !world.humidity || !Array.isArray(world.humidity)) {
		console.error("Missing heightmap");
		ctx.clearRect(0, 0, width, height);
		return;
	}

	const canvas = document.getElementById('terrainbox'),
		ctx = canvas.getContext('2d');
	
	canvas.width = 1200;
	canvas.height = 900;

	const { width, height } = canvas;

	const biomes = require('./biomes.json'),
		{elevation, humidity, seaLevel} = world,
		r = elevation.length;

	params.drawMode = mode || "normal";

	for (let x = 0; x < r; x++) {
		for (let y = 0; y < r; y++) {

			var redLevel, greenLevel, blueLevel;

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
					} else if (elevation[x][y] > seaLevel - 200) {
						ctx.fillStyle = biomes.shore;
					} else if (elevation[x][y] > seaLevel - 800) {
						ctx.fillStyle = biomes.water;
					} else if (elevation[x][y] > seaLevel - 1250) {
						ctx.fillStyle = biomes.abyss;
					} else {
						ctx.fillStyle = biomes.trench;
					}
					break;
				case "heightmap":
					greenLevel = (elevation[x][y] + 1000) / 11;
					ctx.fillStyle = `rgb(0, ${greenLevel}, 0)`;
					break;
				case "humidity":
					blueLevel = (elevation[x][y] > seaLevel)
						? (humidity[x][y] + 100) / 2
						: 256; //undersea is always blue

						ctx.fillStyle = `rgb(0, 0, ${blueLevel})`;
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
	const saveWorld = {...world}

	ipcRenderer.send("saveWorld", saveWorld);
}

async function loadWorld(){
	const savedWorld = await ipcRenderer.invoke("loadWorld");

	if (!savedWorld) return;

	world = {};

	for(key in savedWorld){
		world[key] = savedWorld[key];
	}

	//repairs worlds with missing data

	let {seed, seaLevel, humidity, elevation} = world;

	if(!seed) {
		console.warn("No seed detected, defaulting to undefined");
		world.seed = undefined;
	}
	if (seaLevel === undefined){
		console.warn("No sea level detected, defaulting to 0");
		world.seaLevel = 0;
	}
	if(!humidity || !Array.isArray(humidity)){
		console.warn("No humidity heightmap detected, defaulting to seed");
		world.humidity = createHeightmap({ resolution: elevation.length }, seed)
	}
	if(!elevation || !Array.isArray(elevation)){
		console.error("World data irreversably corrupted");
		return;
	}

	draw();
}

/*INTERPROCESS COMMUNICATION*/

const { ipcRenderer } = require("electron");

//detects setting change from the settings window and applies it
ipcRenderer.on("setting", (e, args) => {
	const settingToChange = args[0],
		newValue = parseInt(args[1]);

	if(settingToChange == "seaLevel"){
		let drawDelay = Math.round(world.elevation.length / 2.8);
		world.seaLevel = newValue;	

		//prevents redrawing from happening too often as it slows things down
		if (new Date() - lastCall > drawDelay || !lastCall) {
			draw();
			lastCall = new Date();
		}
	}
	params[settingToChange] = newValue;
});

//sends settings to settings screen when it's loaded
ipcRenderer.on("loadSettings", (e, winID) => {

	const {resolution, hilliness, baseHumidity} = params;

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
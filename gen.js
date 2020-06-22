const params = {
	resolution: 256, //resolution of terrain array (n * n)
	hilliness: 30, //amplitude of the elevation noise
	baseHumidity: 50, //baseline for humidity
	biomeScale: 155, //scale of humidity-based biomes
	landScale: 100, //scale for landforms
	seaLevel: 0, //default sea level
	drawMode: 'normal', //drawmode - valid values: normal, heightmap, humidity, absolute, jango
	roundFactor: 100, //to which decimal place terrain array values are rounded
};

var world = {};

var lastCall;

function loopThroughHeightmap(callback){
	world.elevation.forEach((row, x) => {
		row.forEach((element, y) => {
			callback(element, world.humidity[x][y], x, y);
		});
	});
}

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
		return;
	}

	const {elevation, humidity, seaLevel} = world,
		r = elevation.length;

	ctx.clearRect(0, 0, width, height);

	params.drawMode = mode || "normal";

	let redLevel, greenLevel, blueLevel;

	switch (mode) {
		default:
		case "normal":
			var biomes = require('./biomes.json');
			loopThroughHeightmap((localElevation, localHumidity, x, y) => {
				if (localElevation > seaLevel) {
					ctx.fillStyle =
						localElevation > 1250 ? biomes.peak
							: localElevation > 1000 ? biomes.mountain
							: localElevation > 850 ? biomes.mountain2
							: localElevation > 750 ?
								localHumidity > 0 ? biomes.mountain2
								: biomes.mesa
							: localElevation > -100 ?
								localHumidity > 250 ? biomes.urwald
								: localHumidity > 150 ? biomes.forest
								: localHumidity > 0 ? biomes.plains
								: localHumidity > -30 ? biomes.savannah
								: biomes.desert
							: localElevation > -500 ?
								localHumidity > 0 ? biomes.desert
								: biomes.canyon
								: biomes.desertabyss
				} else if (localElevation > seaLevel - 200) {
					ctx.fillStyle = biomes.shore;
				} else if (localElevation > seaLevel - 800) {
					ctx.fillStyle = biomes.water;
				} else if (localElevation > seaLevel - 1250) {
					ctx.fillStyle = biomes.abyss;
				} else {
					ctx.fillStyle = biomes.trench;
				}

				ctx.fillRect(Math.ceil((width / r) * x), Math.ceil((height / r) * y), Math.ceil(width / r), Math.ceil(height / r));
			});
			break;
		case "elevation":
			loopThroughHeightmap((localElevation, localHumidity, x, y) => {
				greenLevel = (localElevation > seaLevel)
				? localElevation / 10 + 30
				: 0;
				blueLevel = (localElevation > seaLevel)
					? 0
					: (seaLevel - localElevation) / 10 + 30;

				ctx.fillStyle = `rgb(0, ${greenLevel}, ${blueLevel})`;
				ctx.fillRect(Math.ceil((width / r) * x), Math.ceil((height / r) * y), Math.ceil(width / r), Math.ceil(height / r));
			});
			break;
		case "absolute":
			loopThroughHeightmap((localElevation, localHumidity, x, y) => {
				greenLevel = (localElevation + 1000) / 15;
				redLevel = (localElevation + 1000) / 15;
				
				ctx.fillStyle = `rgb(${redLevel}, ${greenLevel}, 0)`;	
				ctx.fillRect(Math.ceil((width / r) * x), Math.ceil((height / r) * y), Math.ceil(width / r), Math.ceil(height / r));
			});
			break;
		case "humidity":
			loopThroughHeightmap((localElevation, localHumidity, x, y) => {
				blueLevel = (localElevation > seaLevel)
					? (localHumidity + 100) / 2
					: 256; //undersea is always blue

				ctx.fillStyle = `rgb(0, 0, ${blueLevel})`;
				ctx.fillRect(Math.ceil((width / r) * x), Math.ceil((height / r) * y), Math.ceil(width / r), Math.ceil(height / r));
			});
			break;
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
		const drawDelay = Math.round((world.elevation.length ** 2) / 600);
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
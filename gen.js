const params = {
	resolution: 256, //resolution of terrain array (n * n)
	hilliness: 30, //amplitude of the elevation heightmap
	humidityRange: 6, //amplitude for the humidity heightmap
	baseElevation: 0, //baseline for elevation
	baseHumidity: 50, //baseline for humidity
	biomeScale: 155, //scale of humidity-based biomes
	landScale: 100, //scale for landforms
	granularScale: 0.03, //size of granular octave relative to the land and biomeScale
	seaLevel: 0, //default sea level
	drawMode: 'normal', //drawmode - valid values: normal, heightmap, humidity, absolute
	roundFactor: 10, //to which decimal place terrain array values are rounded
};

var world;

function loopThroughHeightmap(callback, targetWorld = world) {
	targetWorld.elevation.forEach((row, x) => {
		row.forEach((localElevation, y) => {
			let localHumidity = targetWorld.humidity[x][y];
			callback(localElevation, localHumidity, x, y);
		});
	});
}

function createHeightmap({ base = 0, amplitude, scale, resolution = 256, roundFactor = 10, granularScale = 0.03 } = {}, seed) {
s
	var heightmap = [];
	const { Perlin2 } = require('tumult'),
		small = granularScale * scale,
		map = new Perlin2(seed);

	for (let x = 0; x < resolution; x++) {
		let row = [];
		for (let y = 0; y < resolution; y++) {
			const value = base + (6 * map.gen(x / small, y / small) + 120 * map.octavate(5, x / scale, y / scale)) * amplitude;
			row.push(Math.round(value * roundFactor) / roundFactor);
		}
		heightmap.push(row);
	}

	return heightmap;
}

function generate({ resolution, hilliness, baseHumidity, humidityRange, biomeScale, landScale, seaLevel, roundFactor, granularScale, baseElevation } = params, seed = Math.random()) {

	console.time("generate");

	//softcapping resolution at 512
	if (resolution > 512) console.warn("Map sizes above 512 not officially supported, any bugs related to this may not be fixed");

	world = {
		elevation: createHeightmap(
			{
				base: baseElevation,
				amplitude: hilliness,
				scale: landScale,
				resolution: resolution,
				roundFactor: roundFactor,
				granularScale: granularScale
			},
			seed + 0.01),
		humidity: createHeightmap(
			{
				base: baseHumidity,
				amplitude: humidityRange,
				scale: biomeScale,
				resolution: resolution,
				roundFactor: roundFactor,
				granularScale: granularScale
			},
			seed),
		seaLevel: seaLevel,
		seed: seed,
		structures: [],
	};

	draw();

	console.timeEnd("generate");
}

function polygon() {
	generate({ ...params, granularScale: 0.000000001 });
	console.log("HAIL SIERPINSKI");
}

/*DRAWING TERRAIN TO CANVAS*/

function drawPixel(ctx, width, height, x, y){
	ctx.fillRect(width * x, height * y, width, height);
}

function drawLand(mode = params.drawmode, targetCanvas = document.getElementById("terrainbox")) {

	const ctx = targetCanvas.getContext('2d'),
		{ width, height } = targetCanvas;
		
	const biomes = require('./biomes.json'),
		{ elevation } = world,
		r = elevation.length;

	ctx.clearRect(0, 0, width, height);

	const boxWidth = Math.ceil(width / r),
		boxHeight = Math.ceil(height / r);

	switch (mode) {
		default:
		case "normal":
			loopThroughHeightmap((localElevation, localHumidity, x, y) => {
				ctx.fillStyle =
					localElevation > 1300 ? biomes.peak
						: localElevation > 1100 ? biomes.mountain
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
											: biomes.desertabyss;
				drawPixel(ctx, boxWidth, boxHeight, x, y);
			});
			break;
		case "elevation":
			loopThroughHeightmap((localElevation, localHumidity, x, y) => {
				ctx.fillStyle = `rgb(0, ${localElevation / 10 + 30}, 0)`;
				drawPixel(ctx, boxWidth, boxHeight, x, y);
			});
			break;
		case "absolute":
			loopThroughHeightmap((localElevation, localHumidity, x, y) => {
				let zLevel = (localElevation + 1000) / 15;
				ctx.fillStyle = `rgb(${zLevel}, ${zLevel}, 0)`;
				drawPixel(ctx, boxWidth, boxHeight, x, y);
			});
			break;
		case "humidity":
			loopThroughHeightmap((localElevation, localHumidity, x, y) => {
				ctx.fillStyle = `rgb(0, 0, ${(localHumidity + 100) / 2})`;
				drawPixel(ctx, boxWidth, boxHeight, x, y);
			});
			break;
	}
}

function drawWater(mode = params.drawMode, targetCanvas = document.getElementById("waterbox")) {

	const ctx = targetCanvas.getContext('2d'),
		{ width, height } = targetCanvas;

	const biomes = require('./biomes.json'),
		{ elevation, seaLevel } = world,
		r = elevation.length;

	ctx.clearRect(0, 0, width, height);

	const boxWidth = Math.ceil(width / r),
		boxHeight = Math.ceil(height / r);

	switch (mode) {
		default:
		case "normal":
			loopThroughHeightmap((localElevation, localHumidity, x, y) => {
				if (localElevation > seaLevel) return;
				if (localElevation > seaLevel - 200) ctx.fillStyle = biomes.shore;
				else if (localElevation > seaLevel - 800) ctx.fillStyle = biomes.water;
				else if (localElevation > seaLevel - 1250) ctx.fillStyle = biomes.abyss;
				else ctx.fillStyle = biomes.trench;
				drawPixel(ctx, boxWidth, boxHeight, x, y);
			});
			break;
		case "elevation":
			loopThroughHeightmap((localElevation, localHumidity, x, y) => {
				if (localElevation > seaLevel) return;

				ctx.fillStyle = `rgb(0, 0, ${(seaLevel - localElevation) / 10 + 30})`;
				drawPixel(ctx, boxWidth, boxHeight, x, y);
			});
			break;
		case "absolute":
			//absolute drawmode does not render water but I'm still putting it here so it matches
			return;
		case "humidity":
			loopThroughHeightmap((localElevation, localHumidity, x, y) => {
				if (localElevation > seaLevel) return;
				ctx.fillStyle = '#0AF';
				drawPixel(ctx, boxWidth, boxHeight, x, y);
			});
			break;
	}
}

function draw(mode = params.drawMode) {
	params.drawMode = mode || "normal";

	drawLand(mode, document.getElementById("terrainbox"));
	drawWater(mode, document.getElementById("waterbox"));
}

/* SAVING AND LOADING WORLDS*/

function saveWorld() {
	const saveWorld = { ...world }
	ipcRenderer.send("saveWorld", saveWorld);
}

async function loadWorld() {
	const savedWorld = await ipcRenderer.invoke("loadWorld");

	if (!savedWorld) return;

	world = { ...savedWorld };

	//repairs worlds with missing data

	let { seed, seaLevel, humidity, elevation } = world;

	if (!seed) {
		console.warn("No seed detected, defaulting to undefined");
		world.seed = undefined;
	}
	if (seaLevel === undefined) {
		console.warn("No sea level detected, defaulting to 0");
		world.seaLevel = 0;
	}
	if (!humidity || !Array.isArray(humidity)) {
		console.warn("No humidity heightmap detected, defaulting to seed");
		world.humidity = createHeightmap({ resolution: elevation.length }, seed)
	}
	if (!elevation || !Array.isArray(elevation)) {
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
		newValue = parseFloat(args[1]);

	params[settingToChange] = newValue;

	if (settingToChange == "seaLevel") {
		const drawDelay = Math.round(world.elevation.length ** 2 / 550);
		world.seaLevel = newValue;

		//prevents redrawing from happening too often as it slows things down
		if (new Date() - drawWater.lastCall > drawDelay || !drawWater.lastCall) {
			drawWater();
			drawWater.lastCall = new Date();
		}
	}
});

//sends settings to settings screen when it's loaded
ipcRenderer.on("loadSettings", (e, winID) => {
	const { resolution, hilliness, baseHumidity, humidityRange, granularScale} = params;

	ipcRenderer.sendTo(winID, "sendSettings",
		{
			"resolution": resolution,
			"hilliness": hilliness,
			"humidityRange": humidityRange,
			"granularScale": granularScale,
			"baseHumidity": baseHumidity,
			"seaLevel": world.seaLevel
		});
});

//keyboard shortcut to generate terrain (ctrl+g) and drawmodes (ctrl + 1,2,3)
ipcRenderer.on("shortcut", (e, ...args) => {
	//calls function with name args[0] with argument args[1]
	window[args[0]](args[1]);
});
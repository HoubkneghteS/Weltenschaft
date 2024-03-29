function loopThroughHeightmap(callback) {
	world.elevation.forEach((row, x) => {
		row.forEach((localElevation, y) => {
			let localHumidity = world.humidity[x][y];
			callback(localElevation, localHumidity, x, y);
		});
	});
}

function chooseRandom(array) {
	return array[Math.floor(Math.random() * (array.length))];
}

/*GENERATION OF TERRAIN*/

var world, params;

function performStructureCheck(structureWeight, structureConditions) {
	let structureRoll = Math.random();

	if(structureRoll > structureWeight) return false
	if(structureConditions == false) return false
	return true
}

function createHeightmap({ base = 0, amplitude = 1, scale = 100, resolution = 256, roundFactor = 10, granularScale = 0.03, octaves = 5 } = {}, seed) {
	const { Perlin2 } = require('tumult'),
		small = granularScale * scale,
		map = new Perlin2(seed);

	var heightmap = Array(resolution).fill().map(() => Array(resolution).fill(0));
	for (let x = 0; x < resolution; x++) {
		for (let y = 0; y < resolution; y++) {
			const value = base + (6 * map.gen(x / small, y / small) + 120 * map.octavate(octaves, x / scale, y / scale)) * amplitude;
			heightmap[x][y] = Math.round(value * roundFactor) / roundFactor;
		}
	}

	return heightmap;
}

function createStructure({type, x = 0, y = 0, ...otherData} = {}, {offset = 0.5, roundFactor = 10} = {}) {
	var structure = {
		type: type,
		x: Math.round((x + (2 * offset * Math.random()) - offset) * roundFactor) / roundFactor,
		y: Math.round((y + (2 * offset * Math.random()) - offset) * roundFactor) / roundFactor,
		elevation: world.elevation[x][y],
		humidity: world.humidity[x][y],
		...otherData
	};

	return structure;
}

function generate({ resolution, hilliness, baseHumidity, humidityRange, biomeScale, landScale, seaLevel, roundFactor, granularScale, baseElevation, generateStructures, structureOffset, structureWeights, octaves } = params, seed = Math.random()) {

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
				granularScale: granularScale,
				octaves: octaves
			},
			seed + 0.01),
		//elevation uses a different seed than humidity so that the heightmaps don't look identical
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

	if (generateStructures) {
		loopThroughHeightmap((localElevation, localHumidity, x, y) => {
			//cactus
			if(performStructureCheck(structureWeights.cactus, (localElevation < 400 && localElevation > (seaLevel + 15) && localHumidity < -15 && localHumidity > -100))){
				world.structures.push(createStructure(
					{
						type: "cactus",
						x: x,
						y: y, 
						height: Math.round(roundFactor * (Math.random() * 2.3 + 1)) / roundFactor
				},
				{
					offset: structureOffset,
					roundFactor: roundFactor 
				}));
			}
			//cactusDry
			if(performStructureCheck(structureWeights.cactusDry, (localElevation < 400 && localElevation > (seaLevel + 15) && localHumidity < -100 && localHumidity > -250))){
				world.structures.push(createStructure(
				{
					type: "cactus",
					x: x,
					y: y, 
					height: Math.round(roundFactor * (Math.random() * 1.9 + 1)) / roundFactor, //dry variant of cactus cannot generate as tall
					...(Math.random() < 0.04) && { customColor: "#C81" } //4% of drycactuses will be "dead"
				},
				{
					offset: structureOffset,
					roundFactor: roundFactor 
				}));
			}
			//castle
			if(performStructureCheck(structureWeights.castle, (localElevation < 900 && localElevation > (seaLevel + 15) && localHumidity > -80))){
				world.structures.push(createStructure(
				{	
					type: "castle",
					x: x,
					y: y, 
					customColor: chooseRandom(['#333', "#666", "#005", "#500", "#050"]),
					height: Math.round(roundFactor * (Math.random() * 2 + 2)) / roundFactor,
				},
				{
					offset: structureOffset,
					roundFactor: roundFactor 
				}));
			}

		});
	}

	draw();

	console.timeEnd("generate");
}

function polygon() {
	generate({
		...params,
		granularScale: 0.000000001,
		generateStructures: false //THERE ARE NO STRUCTURES IN THE POLYGON REALM MUAHAHAH
	});
	console.log("HAIL SIERPINSKI");
}

function regenerate(){
	generate(params, world.seed);
}

/*DRAWING TERRAIN TO CANVAS*/

function drawPixel(ctx, width, height, x, y){
	ctx.fillRect(width * x, height * y, width + 1, height + 1);
}

function drawTriangle(ctx, width, height, x, y){
	let path = new Path2D();

	path.moveTo(width * x, height * (y + 1));
	path.lineTo(width * (x + 0.5), height * y);
	path.lineTo(width * (x + 1), height * (y + 1));
	ctx.fill(path);
}


function drawLand(mode = params.drawmode) {

	const ctx = document.getElementById("terrainbox").getContext('2d'),
		{ width, height } = document.getElementById("terrainbox"),
		{ elevation } = world,
		boxWidth = (width / elevation.length),
		boxHeight = (height / elevation.length),
		biomes = require('./biomes.json');

	switch (mode) {
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
		default:
		case "normal":
			loopThroughHeightmap((localElevation, localHumidity, x, y) => {
				if (localElevation > 1300) ctx.fillStyle = biomes.peak;
				else if (localElevation > 1100) ctx.fillStyle = biomes.mountain;
				else if (localElevation > 850) ctx.fillStyle = biomes.mountain2;
				else if (localElevation > 750) {
					ctx.fillStyle = localHumidity > 0 ? biomes.mountain2 : biomes.mesa;
				}
				else if (localElevation > -100) {
					ctx.fillStyle = biomes.desert;
					if (localHumidity > -30 ) ctx.fillStyle = biomes.savannah;
					if (localHumidity > 0 ) ctx.fillStyle = biomes.plains;
					if (localHumidity > 150 ) ctx.fillStyle = biomes.forest;
					if (localHumidity > 250 ) ctx.fillStyle = biomes.urwald;
				}
				else if (localElevation > -500){
					ctx.fillStyle = localHumidity > 0 ? biomes.desert : biomes.canyon;
				}
				else ctx.fillStyle = biomes.desertabyss;

				drawPixel(ctx, boxWidth, boxHeight, x, y);
			});
	}
}

function drawWater(mode = params.drawMode) {

	const ctx = document.getElementById("waterbox").getContext('2d'),
		{ width, height } = document.getElementById("waterbox"),
		{ elevation, seaLevel } = world,
		boxWidth = (width / elevation.length),
		boxHeight = (height / elevation.length),
		biomes = require('./biomes.json');

	ctx.clearRect(0, 0, width, height);

	switch (mode) {
		case "elevation":
			loopThroughHeightmap((localElevation, localHumidity, x, y) => {
				if (localElevation > seaLevel) return
				ctx.fillStyle = `rgb(0, 0, ${(seaLevel - localElevation) / 10 + 30})`;
				drawPixel(ctx, boxWidth, boxHeight, x, y);
			});
			break;
		case "absolute":
			//absolute drawmode does not render water but I'm still putting it here so it matches
			return
		case "humidity":
			loopThroughHeightmap((localElevation, localHumidity, x, y) => {
				if (localElevation > seaLevel) return
				ctx.fillStyle = '#07F';
				drawPixel(ctx, boxWidth, boxHeight, x, y);
			});
			break;
		default:
		case "normal":
			loopThroughHeightmap((localElevation, localHumidity, x, y) => {
				if (localElevation > seaLevel) return
				else if (localElevation > seaLevel - 200) ctx.fillStyle = biomes.shore;
				else if (localElevation > seaLevel - 800) ctx.fillStyle = biomes.water;
				else if (localElevation > seaLevel - 1250) ctx.fillStyle = biomes.abyss;
				else ctx.fillStyle = biomes.trench;
				drawPixel(ctx, boxWidth, boxHeight, x, y);
			});
	}
}

function drawStructures(mode = params.drawMode) {

	const ctx = document.getElementById("strbox").getContext('2d'),
		{ width, height } = document.getElementById("strbox"),
		{ elevation, structures } = world,
		boxWidth = (width / elevation.length),
		boxHeight = (height / elevation.length);

	ctx.clearRect(0, 0, width, height);

	if(mode != "normal") return //structures should only be visable in the normal drawmode

	structures.forEach(structure => {
		const {x, y, type, customColor} = structure;
		if(type == "cactus"){
			ctx.fillStyle = customColor || "#371";
			drawPixel(ctx, boxWidth * 0.9, boxHeight * structure.height, x / 0.9, (y / structure.height) - structure.height);
		}
		if(type =="castle"){
			ctx.fillStyle = customColor;

			drawTriangle(ctx, boxWidth * 1.5, boxHeight * structure.height, x / 1.5, (y / structure.height) - structure.height)
			drawPixel(ctx, boxWidth * 1.5, boxHeight * structure.height, (x / 1.5) - 0.05, 0.95 + (y / structure.height) - structure.height);
		}
	});
}

function draw(mode = params.drawMode) {
	params.drawMode = mode || "normal";

	drawLand(mode);
	drawStructures(mode);
	drawWater(mode);
}

/* SAVING AND LOADING WORLDS AND PARAMETERS*/

function saveWorld() {
	const saveWorld = { ...world };
	ipcRenderer.send("saveWorld", saveWorld);
}

async function loadWorld() {
	const savedWorld = await ipcRenderer.invoke("loadWorld");

	if (!savedWorld) return

	world = { ...savedWorld };

	//repairs worlds with missing data

	const { seed, seaLevel, humidity, elevation } = world;

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
		const {baseHumidity, humidityRange, biomeScale, roundFactor, granularScale} = params;
		world.humidity = createHeightmap({
			base: baseHumidity,
			amplitude: humidityRange,
			scale: biomeScale,
			resolution: elevation.length,
			roundFactor: roundFactor,
			granularScale: granularScale
		}, seed);
	}
	if (!elevation || !Array.isArray(elevation)) {
		console.error("World data irreversably corrupted");
		return
	}

	draw();
}

function initParams() {
	params = {
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
		waterDrawRate: 700, //how fast water is redrawn
		retainParams: true, //whether params should be saved/loaded
		generateStructures: true, //whether structures will be generated
		structureOffset: 0.5, //how far structures can be moved in the x and y direction
		structureWeights: {
			cactus: 0.0071,
			cactusDry: 0.0012,
			castle: 0.00005
		} //how often the various structures generate
	};
}

function loadParams () {
	const fs = require('fs');

	initParams();
	
	if (fs.existsSync(`${__dirname}/params.json`)){
		let savedParams = JSON.parse(fs.readFileSync(`${__dirname}/params.json`));

		if(savedParams.retainParams == false) {
			params.retainParams = false;
			return
		}
		for(let param in savedParams){
			if(param == "drawMode") return //drawmode does not need to be saved
			params[param] = savedParams[param];
		}
		console.log(`Loaded params from ${__dirname}/params.json`);
	} else {
		console.log("No params.json detected, creating one");
		saveParams();
	}
}

function saveParams(){
	const fs = require('fs');
	fs.writeFileSync(`${__dirname}/params.json`, JSON.stringify(params));
}

/*INTERPROCESS COMMUNICATION*/

const { ipcRenderer } = require("electron");

//detects setting change from the settings window and applies it
ipcRenderer.on("setting", (e, args) => {
	const settingToChange = args[0],
		newValue = args[1];

	params[settingToChange] = newValue;

	if (settingToChange == "seaLevel") {
		const drawDelay = (world.elevation.length ** 2 / params.waterDrawRate) | 0;
		world.seaLevel = newValue;

		//prevents redrawing from happening too often as it slows things down
		if (new Date() - drawWater.lastCall > drawDelay || !drawWater.lastCall) {
			drawWater();
			drawWater.lastCall = new Date();
		}
	}
	if(settingToChange != "retainParams" && params.retainParams == false) return //only save params to params.json if allowed to do so
	saveParams();
});

//sends settings to settings screen when it's loaded
ipcRenderer.on("loadSettings", (e, winID) => {
	ipcRenderer.sendTo(winID, "sendSettings",
		{
			...params,
			seaLevel: world.seaLevel
		});
});

//keyboard shortcut to generate terrain (ctrl+g) and drawmodes (ctrl + 1,2,3)
ipcRenderer.on("shortcut", (e, ...args) => {
	const shortcut = args[0],
		shortcutArgs = args.slice(1);

	window[shortcut](...shortcutArgs);
});
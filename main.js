const { app, BrowserWindow, Menu, ipcMain } = require('electron');

var locale, menuTemplate;

app.on('ready', () => {

	locale = getLocaleObject(); //sets locale from translate.js

	menuTemplate = [
		{
			label: locale.file,
			submenu: [
				{
					label: locale.settings,
					accelerator: 'CmdOrCtrl+E',
					click() {
						createSettingsWindow();
					}
				},
				{
					label: locale.generate,
					accelerator: 'CmdOrCtrl+G',
					click() {
						mainWindow.webContents.send("shortcut", "generate");
					}
				},
				{
					label: "polygon",
					visible: false,
					accelerator: 'CmdOrCtrl+Shift+P',
					click() {
						mainWindow.webContents.send("shortcut", "polygon");
					}
				},

				{ type: 'separator' },
				{
					label: locale.save,
					accelerator: 'CmdOrCtrl+S',
					click() {
						mainWindow.webContents.send("shortcut", "saveWorld");
					}
				},
				{
					label: locale.load,
					accelerator: 'CmdOrCtrl+O',
					click() {
						mainWindow.webContents.send("shortcut", "loadWorld");
					}
				},
				{ type: 'separator' },
				{
					accelerator: 'CmdOrCtrl+Q',
					label: locale.exit,
					role: "quit"
				}
			],
		},
		{
			label: locale.view,
			submenu: [
				{
					label: locale.console,
					role: "toggleDevTools"
				},
				{
					label: locale.info,
					accelerator: "F1",
					click() {
						createInfoWindow();
					}
				},
				{ type: "separator" },
				{
					label: locale.standardDraw,
					accelerator: 'CmdOrCtrl+1',
					click() {
						mainWindow.webContents.send("shortcut", "draw", "normal");
					}
				},
				{
					label: locale.elevation,
					accelerator: 'CmdOrCtrl+2',
					click() {
						mainWindow.webContents.send("shortcut", "draw", "elevation");
					}
				},
				{
					label: locale.absolute,
					accelerator: 'CmdOrCtrl+3',
					click() {
						mainWindow.webContents.send("shortcut", "draw", "absolute");
					}
				},
				{
					label: locale.humidity,
					accelerator: 'CmdOrCtrl+4',
					click() {
						mainWindow.webContents.send("shortcut", "draw", "humidity");
					}
				},
				{ type: 'separator' },
				{
					label: locale.fullscreen,
					role: 'togglefullscreen'
				}
			]
		}
	];

	Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));

	createMainWindow();
});

//mac menu compatibility
if (process.platform == 'darwin') {
	menuTemplate.unshift({});
}

function getLocaleObject(src = app.getLocale()){
	const fs = require('fs');

	if (fs.existsSync(`${__dirname}/locales/${src}.json`)) return JSON.parse(fs.readFileSync(`${__dirname}/locales/${src}.json`));

	//if lang.json file does not exist use english as default
	console.warn(`Locale for language: ${src} not detected - using English`);

	return JSON.parse(fs.readFileSync(`${__dirname}/locales/en.json`));
}

/* WINDOWS */

var mainWindow, infoWindow, settingsWindow;

const windowDefaults = {
	width: 375,
	height: 500,
	backgroundColor: "#101010",
	show: false,
	fullscreenable: false,
	resizable: false,
	webPreferences: {
		nodeIntegration: true,
	}
};

function createMainWindow() {

	mainWindow = new BrowserWindow({...windowDefaults,
		title: `Weltenschaft ${app.getVersion()}`,
		fullscreenable: true,
		resizable: true,
		minWidth: 642,
		minHeight: 605,
	});

	mainWindow.once('ready-to-show', () => {
		mainWindow.show();
	});

	mainWindow.loadFile('main.html');
	
	//quits all windows when closed
	mainWindow.on('close', () => {
		app.quit();
	});
}

function createInfoWindow() {

	if (infoWindow) return; //blocks multiple from being created

	infoWindow = new BrowserWindow({...windowDefaults,
		title: locale.info,
		height: 300,
		autoHideMenuBar: true,
		parent: mainWindow, //always shows on top of main window
	});

	infoWindow.once('ready-to-show', () => {
		infoWindow.show();
	});

	infoWindow.loadFile('info.html');

	infoWindow.on('close', () => {
		infoWindow = null;
	});

	//opens github and discord link in browser instead of in the app itself
	infoWindow.webContents.on('new-window', (e, url) => {
		const { shell } = require('electron')
		e.preventDefault();
		shell.openExternal(url);
	});
}

function createSettingsWindow() {

	if (settingsWindow) return; //blocks multiple from being created

	settingsWindow = new BrowserWindow({...windowDefaults,
		title: locale.settings,
		autoHideMenuBar: true,
		parent: mainWindow, //always shows on top of main window
	});

	settingsWindow.once('ready-to-show', () => {
		settingsWindow.show();
		mainWindow.webContents.send("loadSettings", settingsWindow.webContents.id);
	})

	settingsWindow.loadFile('settings.html');

	settingsWindow.on('close', () => {
		settingsWindow = null;
	});
}

/*INTERPROCESS COMMUNICATION*/

//Detects settings and sends it to main window
ipcMain.on("setting", (e, ...args) => {
	mainWindow.webContents.send("setting", args);
});

ipcMain.on("polygon", () => {
	mainWindow.webContents.send("shortcut", "polygon");
});

ipcMain.handle('getLang', async(e, language) => {
	if (!language) return locale
	return getLocaleObject(language)
});

ipcMain.on("saveWorld", (e, world) => {
	const fs = require('fs'),
	{ dialog } = require('electron'),
		path = dialog.showSaveDialogSync(mainWindow, {
		filters: [
			{ name: locale.filetype, extensions: ['ws'] }
		]});

	if (!path) return;

	fs.writeFileSync(path.toString(), JSON.stringify(world));
});

ipcMain.handle("loadWorld", async () => {
	const fs = require('fs'),
	{ dialog } = require('electron'),
		path = dialog.showOpenDialogSync(mainWindow, {
			filters: [
				{ name: locale.filetype, extensions: ['ws'] }
		]});

	if (!path) return;

	const world = await JSON.parse(fs.readFileSync(path.toString()));

	return world;
});
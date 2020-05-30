const { app, BrowserWindow, Menu, ipcMain } = require('electron');

var locale,
	menuTemplate;

//startup functions
app.on('ready', () => {

	locale = getLocaleObject(); //sets locale from translate.js

	menuTemplate = [
		{
			label: locale.file,
			submenu: [
				{
					label: locale.info,
					click() {
						createInfoWindow();
					}
				},
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
					label: "Debug",
					accelerator: 'CmdOrCtrl+I',
					role: "toggleDevTools"
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
					label: locale.heightmap,
					accelerator: 'CmdOrCtrl+2',
					click() {
						mainWindow.webContents.send("shortcut", "draw", "heightmap");
					}
				},
				{
					label: locale.humidity,
					accelerator: 'CmdOrCtrl+3',
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

	//quits all windows when closed
	mainWindow.on('close', () => {
		app.quit();
	});
});

//mac compatibility
if (process.platform == 'darwin') {
	menuTemplate.unshift({});
}

//sets locale object from JSON
function getLocaleObject(src = app.getLocale()){
	const fs = require('fs');

	//searches places where the file could be
	if (fs.existsSync(`./locales/${src}.json`)) return JSON.parse(fs.readFileSync(`./locales/${src}.json`));
	if (fs.existsSync(`./resources/app/locales/${src}.json`)) return JSON.parse(fs.readFileSync(`./resources/app/locales/${src}.json`));

	//if lang.json does not exist use english as default
	if (fs.existsSync(`./locales/en.json`)){
		console.warn(`Locale for language: ${src} not detected - using English`);
		return JSON.parse(fs.readFileSync(`./locales/en.json`));
	}else{
		console.warn(`Locale for language: ${src} not detected - using English`);
		return JSON.parse(fs.readFileSync(`./resources/app/locales/en.json`));
	}
}

/* WINDOWS */

var mainWindow, infoWindow, settingsWindow; //window setup

const windowDefaults = {
	width: 375,
	height: 500,
	backgroundColor: "#101010",
	show: false,
	webPreferences: {
		nodeIntegration: true,
	}
};

//main window
function createMainWindow() {

	mainWindow = new BrowserWindow({...windowDefaults,
		title: `Weltenschaft ${app.getVersion()}`,
		minWidth: 642,
		minHeight: 600,
		width: 750,
	});

	//delays showing
	mainWindow.once('ready-to-show', () => {
		mainWindow.show();
	});

	mainWindow.loadFile('main.html');
}

//info window
function createInfoWindow() {

	if (infoWindow) return; //blocks multiple from being created

	infoWindow = new BrowserWindow({...windowDefaults,
		title: locale.info,
		fullscreenable: false,
		resizable: false,
		autoHideMenuBar: true,
	});

	//delays showing
	infoWindow.once('ready-to-show', () => {
		infoWindow.show();
	});

	// Load html into window
	infoWindow.loadFile('info.html');

	//clears memory when closed
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

//settings window
function createSettingsWindow() {

	if (settingsWindow) return; //blocks multiple from being created

	settingsWindow = new BrowserWindow({...windowDefaults,
		title: locale.settings,
		fullscreenable: false,
		resizable: false,
		autoHideMenuBar: true,
		parent: mainWindow, //always shows on top of main window
	});

	//delays showing
	settingsWindow.once('ready-to-show', () => {
		settingsWindow.show();
		mainWindow.webContents.send("loadSettings", settingsWindow.webContents.id);
	})

	// Load html into window
	settingsWindow.loadFile('settings.html');

	//clears memory when closed
	settingsWindow.on('close', () => {
		settingsWindow = null;
	});
}

/*INTERPROCESS COMMUNICATION*/

//Detects settings and sends it to main window
ipcMain.on("setting", (e, ...args) => {
	mainWindow.webContents.send("setting", args);
});

//sends locale to translate.js
ipcMain.handle('getLang', async(e, language) => getLocaleObject(language));
const { app, BrowserWindow, Menu, ipcMain } = require('electron');

var mainWindow, infoWindow, settingsWindow; //window setup

var locale;

//create menu template
var menuTemplate;

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

//Detects settings and sends it to main window
ipcMain.on("setting", (e, ...args) => {
	mainWindow.webContents.send("setting", args);
});

//main window
function createMainWindow() {

	mainWindow = new BrowserWindow({
		title: `Weltenschaft ${app.getVersion()}`,
		minWidth: 642,
		minHeight: 600,
		show: false,
		webPreferences: {
			nodeIntegration: true,
		}
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

	infoWindow = new BrowserWindow({
		title: locale.info,
		width: 375,
		height: 500,
		fullscreenable: false,
		show: false,
		resizable: false,
		autoHideMenuBar: true,
		webPreferences: {
			nodeIntegration: true,
		}
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
};

//settings window
function createSettingsWindow() {

	if (settingsWindow) return; //blocks multiple from being created

	settingsWindow = new BrowserWindow({
		title: locale.settings,
		width: 375,
		height: 500,
		fullscreenable: false,
		show: false,
		resizable: false,
		autoHideMenuBar: true,
		parent: mainWindow, //always shows on top of main window
		webPreferences: {
			nodeIntegration: true,
		}
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

//mac compatibility
if (process.platform == 'darwin') {
	menuTemplate.unshift({});
}

//sets locale object from JSON
function getLocaleObject(src = app.getLocale()){
	const fs = require('fs');
	if (fs.existsSync(`./locales/${src}.json`)){
		return JSON.parse(fs.readFileSync(`./locales/${src}.json`));
	}else if(fs.existsSync(`./resources/app/locales/${src}.json`)){
		return JSON.parse(fs.readFileSync(`./resources/app/locales/${src}.json`));
	}else if(fs.existsSync(`./locales/en.json`)){
		console.warn(`Locale for language: ${src} not detected - using English`);
		return JSON.parse(fs.readFileSync(`./locales/en.json`));
	}else{
		console.warn(`Locale for language: ${src} not detected - using English`);
		return JSON.parse(fs.readFileSync(`./resources/app/locales/en.json`));
	}
}

//sends locale to translate.js
ipcMain.handle('getLang', async(e, language) => getLocaleObject(language));
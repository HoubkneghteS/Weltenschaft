//modules
const electron = require('electron'),
    fs = require('fs');

const {app, BrowserWindow, Menu, ipcMain} = electron;

//futureproofing (remember to remove this when electron 9.0 comes out)
app.allowRendererProcessReuse = true;

var mainWindow, infoWindow, settingsWindow; //window setup

var locale;

//startup functions
app.on('ready', () => {

    locale = require("./translate.js"); //sets locale from translate.js

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
                        mainWindow.webContents.send("shortcut", ["generate"]);
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
                { type: "separator"},
                {
                    label: locale.standardDraw,
                    accelerator: 'CmdOrCtrl+1',
                    click() {
                        mainWindow.webContents.send("shortcut", ["draw", "normal"]);
                    }
                },
                {
                    label: locale.heightmap,
                    accelerator: 'CmdOrCtrl+2',
                    click() {
                        mainWindow.webContents.send("shortcut", ["draw", "heightmap"]);
                    }
                },
                {
                    label: locale.humidity,
                    accelerator: 'CmdOrCtrl+3',
                    click() {
                        mainWindow.webContents.send("shortcut", ["draw", "humidity"]);
                    }
                },
            ]
        }
    ];

    mainWindow = new BrowserWindow({
        title: `Weltenschaft ${app.getVersion()}`,
        minWidth: 650,
        minHeight: 600,
        show: false,
        webPreferences: {
            nodeIntegration: true
        }
    });

    //delays showing
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    mainWindow.loadFile('main.html');

    Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));

    //quits all windows when closed
    mainWindow.on('close', () => {
        app.quit();
    });
});

//create menu template
var menuTemplate;

//Detects settings and sends it to main window
ipcMain.on("setting", (e, value) => {
    mainWindow.webContents.send("setting", value);
});

//sends settings from mainWindow into settingsWindow
ipcMain.on("sendSettings", (e, value) =>{
    if(settingsWindow){
        settingsWindow.webContents.send("sendSettings", value)
    }
})

//info window
function createInfoWindow() {

    if(infoWindow) return; //blocks multiple from being created

    infoWindow = new BrowserWindow({
        title: locale.info,
        width: 375,
        height: 500,
        show: false,
        resizable: false,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true
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
        e.preventDefault();
        electron.shell.openExternal(url);
    });
};

//settings window
function createSettingsWindow() {

    if(settingsWindow) return; //blocks multiple from being created

    settingsWindow = new BrowserWindow({
        title: locale.settings,
        width: 375,
        height: 500,
        show: false,
        resizable: false,
        autoHideMenuBar: true,
        parent: mainWindow, //always shows on top of main window
        webPreferences: {
            nodeIntegration: true
          }
    });

    //delays showing
    settingsWindow.once('ready-to-show', () => {
        settingsWindow.show();
        mainWindow.webContents.send("loadSettings");
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
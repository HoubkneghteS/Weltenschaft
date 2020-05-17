//modules
const electron = require('electron'),
    fs = require('fs');

const {app, BrowserWindow, Menu, ipcMain} = electron;

//futureproofing (remember to remove this when electron 9.0 comes out)
app.allowRendererProcessReuse = true;

var mainWindow, infoWindow, settingsWindow; //window setup

//startup functions
app.on('ready', () => {

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
const menuTemplate = [
    {
        label: 'File',
        submenu: [
            {
                label: 'Info',
                click() {
                    createInfoWindow();
                }
            },
            {
                label: 'Settings',
                accelerator: 'CmdOrCtrl+E',
                click() {
                    createSettingsWindow();
                }
            },
            {
                label: 'Generate',
                accelerator: 'CmdOrCtrl+G',
                click() {
                    mainWindow.webContents.send("shortcut", ["generate"]);
                }
            },
            {
                accelerator: 'CmdOrCtrl+Q',
                role: "quit"
            }
        ],
    },
    {
        label: "View",
        submenu: [
            {
                label: "Debug",
                accelerator: 'CmdOrCtrl+I',
                role: "toggleDevTools"
            },
            { type: "separator"},
            {
                label: "Draw Regular",
                accelerator: 'CmdOrCtrl+1',
                click() {
                    mainWindow.webContents.send("shortcut", ["draw", "normal"]);
                }
            },
            {
                label: "Draw Heightmap",
                accelerator: 'CmdOrCtrl+2',
                click() {
                    mainWindow.webContents.send("shortcut", ["draw", "heightmap"]);
                }
            },
            {
                label: "Draw Humidity",
                accelerator: 'CmdOrCtrl+3',
                click() {
                    mainWindow.webContents.send("shortcut", ["draw", "humidity"]);
                }
            },
        ]
    }
];

//Detects settings and sends it to main window
ipcMain.on("setting", (e, value) => {
    mainWindow.webContents.send("setting", value);
});

//tells mainWindow to send values back to settingsWindow
ipcMain.on("sendSettings", (e, value) =>{
    settingsWindow.webContents.send("sendSettings", value)
})

//info window
function createInfoWindow() {

    if(infoWindow) return; //blocks multiple from being created

    infoWindow = new BrowserWindow({
        title: "Weltenschaft Info",
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
        title: "Settings",
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
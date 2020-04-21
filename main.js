//modules
const electron = require('electron');
    fs = require('fs');

const {app, BrowserWindow, Menu, ipcMain} = electron;

//futureproofing (remember to remove this when electron 9.0 comes out)
app.allowRendererProcessReuse = true;

let mainWindow, infoWindow, settingsWindow; //window setup

//startup functions
app.on('ready', function () {

    mainWindow = new BrowserWindow({
        title: `Weltenschaft ${app.getVersion()}`,
        minWidth: 650,
        minHeight: 600,
        webPreferences: {
            nodeIntegration: true
          }
    });

    if (!fs.existsSync('lang.json')){
        var lang = app.getLocale(); //gets locale and saves it to a const if there is no json already existant
        if (lang != "de" & lang != "en") {
            lang = "en" //default translation is english
        }
        fs.writeFileSync('lang.json', JSON.stringify(lang)); //saves to json
    }

    mainWindow.loadFile('main.html');

    Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));

    //quits all windows when closed
    mainWindow.on('close', function () {
        app.quit();
    })
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
                    mainWindow.webContents.send("generate");
                }
            },
            {
                label: 'Quit',
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
            {
                label: "Reload",
                role: "reload",
                accelerator: 'CmdOrCtrl+R',
            }
        ]
    }
];

//Detects settings and sends it to main window
ipcMain.on("setting", function(e, value){
    mainWindow.webContents.send("setting", value);
});

//tells mainWindow to send values back to settingsWindow
ipcMain.on("loadSettings", function(e){
    mainWindow.webContents.send("loadSettings");
})
ipcMain.on("sendSettings",function(e, value){
    settingsWindow.webContents.send("sendSettings", value)
})

//info window
function createInfoWindow() {
    infoWindow = new BrowserWindow({
        width: 375,
        height: 500,
        resizable: false,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true
          }
    });

    // Load html into window
    infoWindow.loadFile('info.html');

    //clears memory when closed
    infoWindow.on('close', function () {
        infoWindow = null;
    });

    //opens github and discord link in browser instead of in the app itself
    infoWindow.webContents.on('new-window', function(e, url) {
        e.preventDefault();
        electron.shell.openExternal(url);
    });
}

//settings window
function createSettingsWindow() {

    if(settingsWindow) return; //blocks multiple from being created

    settingsWindow = new BrowserWindow({
        width: 375,
        height: 500,
        resizable: false,
        autoHideMenuBar: true,
        parent: mainWindow, //always shows on top of main window
        webPreferences: {
            nodeIntegration: true
          }
    });

    // Load html into window
    settingsWindow.loadFile('settings.html');

    //clears memory when closed
    settingsWindow.on('close', function () {
        settingsWindow = null;
    });
}

//mac compatibility
if (process.platform == 'darwin') {
    menuTemplate.unshift({});
}
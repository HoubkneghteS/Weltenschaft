//modules
const electron = require('electron');
    fs = require('fs');

const {app, BrowserWindow, Menu, ipcMain} = electron;

let mainWindow, infoWindow, settingsWindow; //window setup

//startup functions
app.on('ready', function () {

    mainWindow = new BrowserWindow({
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
                accelerator: process.platform == 'darwin' ? 'Command+E' : 'Ctrl+E',
                click() {
                    createSettingsWindow();
                }
            },
            {
                label: "Debug",
                accelerator: process.platform == 'darwin' ? 'Command+I' : 'Ctrl+I',
                click(item, focusedWindow) {
                    focusedWindow.toggleDevTools();
                }
            },
            {
                label: 'Quit',
                accelerator: process.platform == 'darwin' ? 'Command+Q' : 'Ctrl+Q',
                click() {
                    app.quit();
                }
            }
        ]
    }
];

//Detects settings and sends it to main window
ipcMain.on("setting", function(e, value){
    mainWindow.webContents.send("setting", value);
});

//info window
function createInfoWindow() {
    infoWindow = new BrowserWindow({
        width: 375,
        height: 500,
        resizable: false,
        webPreferences: {
            nodeIntegration: true
          }
    });

    // Load html into window
    infoWindow.loadFile('info.html');

    //no Menu bar
    infoWindow.removeMenu();

    //clears memory when closed
    infoWindow.on('close', function () {
        infoWindow = null;
    });

    //opens github link in browser instead of in the app itself
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
        webPreferences: {
            nodeIntegration: true
          }
    });

    // Load html into window
    settingsWindow.loadFile('settings.html');

    //tells main window to send its paramaters
    mainWindow.webContents.send("createSettingsWindow");

    //no Menu bar
    settingsWindow.removeMenu();

    //clears memory when closed
    settingsWindow.on('close', function () {
        settingsWindow = null;
    });
}

//mac compatibility
if (process.platform == 'darwin') {
    menuTemplate.unshift({});
}
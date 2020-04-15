//modules
const electron = require('electron');
    url = require('url');
    path = require('path');
    fs = require('fs');


const { app, BrowserWindow, Menu } = electron;

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
    if(settingsWindow == null){
    settingsWindow = new BrowserWindow({
        width: 375,
        height: 500,
        resizable: false,
        webPreferences: {
            nodeIntegration: true
          }
    });
    }

    // Load html into window
    settingsWindow.loadFile('settings.html');

    //clears memory when closed
    settingsWindow.on('close', function () {
        settingsWindow = null;
    });

    //opens github link in browser instead of in the app itself
    settingsWindow.webContents.on('new-window', function(e, url) {
        e.preventDefault();
        electron.shell.openExternal(url);
    });
}

//mac compatibility
if (process.platform == 'darwin') {
    menuTemplate.unshift({});
}
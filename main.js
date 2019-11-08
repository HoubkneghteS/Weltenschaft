//modules
const electron = require('electron');
    url = require('url');
    path = require('path');

const { app, BrowserWindow, Menu } = electron;

let mainWindow, infoWindow; //window setup

//startup functions
app.on('ready', function () {

    mainWindow = new BrowserWindow({
        minWidth: 800,
        minHeight: 600
    });

    // Load html into window
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'main.html'),
        protocol: 'file',
        slashes: true
    }));

    //Build menu from template
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
    });

    // Load html into window
    infoWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'info.html'),
        protocol: 'file',
        slashes: true
    }));

    //clears memory when closed
    infoWindow.on('close', function () {
        infoWindow = null;
    });

    //opens github link in browser instead of in the app itself
    infoWindow.webContents.on('new-window', function(e, url) {
        e.preventDefault();
        electron.shell.openExternal(url);
    });
};

//mac compatibility
if (process.platform == 'darwin') {
    menuTemplate.unshift({});
};
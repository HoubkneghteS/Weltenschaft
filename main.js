//modules
const electron = require('electron');
    url = require('url');
    path = require('path');

const { app, BrowserWindow, Menu } = electron;

let mainWindow, infoWindow; //window setup

//startup functions
app.on('ready', function () {

    mainWindow = new BrowserWindow({
        minWidth: 400,
        minHeight: 350
    });

    // Load html into window
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'mainWindow.html'),
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
};

//mac compatibility
if (process.platform == 'darwin') {
    menuTemplate.unshift({});
};
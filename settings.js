const { ipcRenderer } = require("electron");

ipcRenderer.on("sendSettings", (e, value) => {
    for (let key in value) {
        document.getElementById(key).value = value[key];
    }
});

function polygon(){
    ipcRenderer.send('polygon');
}

function settingsSet(setting) {
    ipcRenderer.send("setting", setting, document.getElementById(setting).value);
}

function reset() {
    let value = {
        resolution: 256,
        hilliness: 30,
        baseHumidity: 50,
        humidityRange: 6,
        granularScale: 0.03,
        seaLevel: 0
    }

    for (let key in value) {
        document.getElementById(key).value = value[key];
        settingsSet(key);
    }
}

function randomize(){
    let value = {
        resolution: Math.floor(Math.random() * 462) + 50,
        hilliness: Math.floor(Math.random() * 36) + 15,
        baseHumidity: Math.floor(Math.random() * 500) - 250,
        seaLevel: Math.floor(Math.random() * 600) - 300
    }

    //only randomizes advanced settings if they are visible
    if(document.getElementById("showless")){
        value = {
            ...value,
            humidityRange: Math.floor(Math.random() * 17) + 3,
            granularScale: (Math.random() * 0.082)  + 0.018,
        }
    }

    for (let key in value) {
        document.getElementById(key).value = value[key];
        settingsSet(key);
    }
}

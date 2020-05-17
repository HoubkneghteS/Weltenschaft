const electron = require('electron'),
    fs = require('fs'),
    lang = electron.remote.app.getLocale() ? electron.remote.app.getLocale() : "en";

function setLang() {
    document.getElementsByTagName("html").lang = lang; //sets content language to whatever language is being used

    //sets locale object from JSON
    if (fs.existsSync(__dirname + `/locales/${lang}.json`)) {
        const loadedLanguage = JSON.parse(fs.readFileSync(__dirname + `/locales/${lang}.json`), 'utf8');
    }
    else {
        const loadedLanguage = JSON.parse(fs.readFileSync(__dirname + `/locales/en.json`), 'utf8');
    }

    //replaces text with the value found in the locale JSON
    for (var string in loadedLanguage) {
        if (document.getElementById(string)) {
            document.getElementById(string).innerHTML = loadedLanguage[string];
        }
    }
}
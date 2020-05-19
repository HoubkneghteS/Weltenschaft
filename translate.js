const electron = require("electron"),
    fs = require('fs'),
    app = electron.app || electron.remote.app,
    lang = app.getLocale() || "en";

//sets locale object from JSON
const locale = fs.existsSync(`./locales/${lang}.json`)
    ? JSON.parse(fs.readFileSync(`./locales/${lang}.json`), 'utf8')
    : JSON.parse(fs.readFileSync(`./locales/en.json`), 'utf8');

module.exports = locale;

function setLang() {
    document.getElementsByTagName("html").lang = lang; //sets content language to whatever language is being used

    //replaces text with the value found in the locale JSON
    for (let string in locale) {
        if (document.getElementById(string)) {
            document.getElementById(string).innerHTML = locale[string];
        }
    }
}
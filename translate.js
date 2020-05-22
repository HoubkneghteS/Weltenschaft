const electron = require("electron"),
	fs = require('fs'),
	app = electron.app || electron.remote.app,
	lang = app.getLocale() || "en"; //default language is english

//sets locale object from JSON
var locale;
if (fs.existsSync(`./locales/${lang}.json`)){
	locale = JSON.parse(fs.readFileSync(`./locales/${lang}.json`));
}else if(fs.existsSync(`./resources/app/locales/${lang}.json`)){
	locale = JSON.parse(fs.readFileSync(`./resources/app/locales/${lang}.json`));
}else if(fs.existsSync(`./locales/en.json`)){
	locale = JSON.parse(fs.readFileSync(`en.json`));
}else{
	locale = JSON.parse(fs.readFileSync(`./resources/app/locales/en.json`));
}

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
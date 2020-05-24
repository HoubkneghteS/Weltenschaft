const electron = require("electron"),
	app = electron.app || electron.remote.app,
	lang = app.getLocale() || "en"; //default language is english

//sets locale object from JSON
function getLocaleObject(src = lang){
	const fs = require('fs')
	if (fs.existsSync(`./locales/${src}.json`)){
		return JSON.parse(fs.readFileSync(`./locales/${src}.json`));
	}else if(fs.existsSync(`./resources/app/locales/${src}.json`)){
		return JSON.parse(fs.readFileSync(`./resources/app/locales/${src}.json`));
	}else if(fs.existsSync(`./locales/en.json`)){
		console.warn(`Locale for language: ${src} not detected - using English`);
		return JSON.parse(fs.readFileSync(`./locales/en.json`));
	}else{
		console.warn(`Locale for language: ${src} not detected - using English`);
		return JSON.parse(fs.readFileSync(`./resources/app/locales/en.json`));
	}
}

function setLang(language = lang) {
	const locale = getLocaleObject(language);
	document.getElementsByTagName("html").lang = language; //sets content language to whatever language is being used

	//replaces text with the value found in the locale JSON
	for (let string in locale) {
		if (document.getElementById(string)) {
			document.getElementById(string).innerHTML = locale[string];
		}
	}
}

//use in other js files
module.exports = getLocaleObject();
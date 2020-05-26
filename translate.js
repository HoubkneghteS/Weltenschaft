async function setLang(language) {
	const {ipcRenderer} = require('electron');
	const locale = await ipcRenderer.invoke('getLang', language);
	document.getElementsByTagName("html").lang = language; //sets content language to whatever language is being used

	//replaces text with the value found in the locale JSON
	for (let string in locale) {
		if (document.getElementById(string)) {
			document.getElementById(string).innerHTML = locale[string];
		}
	}
}
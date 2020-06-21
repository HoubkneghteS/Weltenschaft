async function setLang(language) {
	const {ipcRenderer} = require('electron'),
		locale = await ipcRenderer.invoke('getLang', language);

	for (let string in locale) {
		if (document.getElementById(string)) {
			document.getElementById(string).innerHTML = locale[string];
		}
	}
}

//is automatically called on page load
setLang();
const en = require("./en.json")
    de = require("./de.json") //jsons for the strings
    lang = require("./lang.json"); //detects system language

function langSet(lang) {
    document.getElementsByTagName("html").lang = lang; //sets content language to whatever language is being used
}
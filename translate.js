const en = require("./en.json")
    de = require("./de.json");
    //jsons for the strings

function langSet(lang) {
    document.getElementsByTagName("html").lang = lang; //sets content language to whatever language is being used
}
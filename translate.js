const lang = require("./lang.json"); //detects system language

function setLang() {
    document.getElementsByTagName("html").lang = lang; //sets content language to whatever language is being used

    //sets local locale object from JSON
    if(lang == "de"){
        var locale = require("./de.json");
    }else{
        var locale = require("./en.json"); 
    }

    //replaces text with the value found in the locale JSON
    for (var string in locale) {
        if (document.getElementById(string)) {
            document.getElementById(string).innerHTML = locale[string];
        }
    }
}
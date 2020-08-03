function toggleShow(){
    if(document.getElementById("showmore")){
        document.getElementById("showmore").id = "showless";
        document.getElementById("advanced").style.display = "block";
    }else{
        document.getElementById("showless").id = "showmore";
        document.getElementById("advanced").style.display = "none";
    }
    //changes showmore/showless text when the id changes
    setLang();
}
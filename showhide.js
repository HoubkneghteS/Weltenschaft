function toggleShow(id){
    if(document.getElementById("showmore")){
        document.getElementById("showmore").id = "showless";
        document.getElementById(id).style.display = "block";
    }else{
        document.getElementById("showless").id = "showmore";
        document.getElementById(id).style.display = "none";
    }
    //changes showmore/showless text when the id changes
    setLang();
}
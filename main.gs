function mainFunction(){
  //I analyze the database of a new request for VU
  var requests = SpreadsheetApp.openById(getdbbyname("formvu"));
  
  //Start Config
  var configvu = [];
  configvu["requestid"] = generaterandom();
  configvu["nbcolonnes"] = 14;
  configvu["name"] = 1;
  configvu["platforms"] = 2;
  configvu["urlAndroid"] = 5;
  configvu["urliOS"] = 6;
  configvu["type"] = 7;
  configvu["sexe"] = 8;
  configvu["spe"] = 9;
  configvu["datedebut"] = 10;
  configvu["datedefin"] = 11;
  //End config
  //Status
  //0 - Waiting to start
  //1 - Forms created
  //2 - Forms finished ⇒ It's time to pay
  
  var resquestsheet = requests.getSheets()[0];
  var lastRow = resquestsheet.getLastRow();
  var values = resquestsheet.getRange(2,1,lastRow-1,configvu["nbcolonnes"]).getValues();
  var now = new Date();
  var enum = 2;
  values.forEach(function(row){
    //I get the starting date
    //Logger.log(row[10] + " " + row[configvu["nbcolonnes"]-1]);
    
    if(row[configvu["datedebut"]] == ""){
      //if the date of debut is empty
      resquestsheet.getRange(enum,configvu["datedebut"]+1).setValue(now);
      row[configvu["datedebut"]] = now;
    }
    if(row[configvu["datedefin"]] == ""){
      //if the date of end is empty I put the date one month after the start date
      var datefin  = now.setMonth(now.getMonth()+1);
      resquestsheet.getRange(enum,configvu["datedefin"]+1).setValue(new Date(datefin));
    }
           
    if (row[configvu["datedebut"]] <= now && row[configvu["nbcolonnes"]-1] != "1"){
      //If the date is in the past (so it's suppose to have been sent)
      
      //I create an Unique ID for this request, taking into account the name and the versions of the apps
      resquestsheet.getRange(enum,configvu["nbcolonnes"]-1).setValue(configvu["requestid"]);
      var platforms = row[configvu["platforms"]];
      platforms = platforms.split(",");
      platforms.forEach(function(plateform){
        //I create a form for each plateform and for each kind of stakeholder
        plateform = plateform.trim();
        
        //******* Forms creation *******
        var rowdata = {};for(key in configvu){rowdata[key] = row[configvu[key]];}
        createForms(configvu["requestid"],plateform,rowdata);
        
        //******* Forms sending *******
        SendForms();
        
      },row,configvu);
      
      resquestsheet.getRange(enum,configvu["nbcolonnes"]).setValue(1);//En cours
      sendtoslack("nouvelle request reçue"); //📢
      enum++;
    }
    else{
      //The date is in the future
      resquestsheet.getRange(enum,configvu["nbcolonnes"]).setValue(0);//En attente
    }
  },resquestsheet,enum,now);
}



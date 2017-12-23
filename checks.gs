function paymentofevaluators(){
  //🚨🚨 Il faut un backoffice pour savoir quand et combien de personnes on a payé
  
}

function relancequestionnaires(){
  //We need to send the forms 3 times in order to maximise de probability of response
  var vudbsheet = SpreadsheetApp.openById(getdbbyname("formvu")).getSheets()[0]; 
  var sheetlastRow = vudbsheet.getLastRow();
  var vuvalues = vudbsheet.getRange(2,1,sheetlastRow-1,14).getValues(); 
  
  //I don't take into account if I have already sent it to a person / he has already answerd / I had sufficient persones because :
  //- Those who didn't answer before will be willing to answer
  //- Those who answered will know that the VU is still ongoing and that's why they haven't been payed
  //- If I had insufficient persons before it doesn't mean that I still have insufficient amount of persons now
  
  //Start Config
  var configvu = [];
  configvu["datedebut"] = 10;
  configvu["datedefin"] = 11;
  configvu["requestid"] = 12;
  configvu["requestid"] = 13;
 
  vuvalues.forEach(function(row){
    if (parseInt(row[configvu["requestid"]])<2){//I check the request that are not done yet
      var debut = row[configvu["datedebut"]];
      var fin = row[configvu["datedefin"]];
      var timeDifftotal = Math.ceil((Math.abs(fin.getTime() - debut.getTime())) / (1000 * 3600 * 24)); //We take the total amount of days allowed
      var teorical = parseInt(80/100*timeDifftotal); //we take the first 80% of the time to re-send the emails. Afterwards the chances of success are low
      var step = parseInt(teorical/4); //we calculate the day inverval that will allow to send 4 emails in total
      var now = new Date();
      var timeDiffpartial = Math.ceil((Math.abs(now.getTime() - debut.getTime())) / (1000 * 3600 * 24));
      if (timeDiffpartial%step == 0){ //the day interval has been obtained
        SendForms(row[configvu["requestid"]]);
      };
    }
  });
}

function requestsdone(){
  //Check if all the forms of a request have been finished and mark the request as done
  
  var vudbsheet = SpreadsheetApp.openById(getdbbyname("formvu")).getSheets()[0]; 
  var sheetlastRow = vudbsheet.getLastRow();
  var vuvalues = vudbsheet.getRange(2,1,sheetlastRow-1,14).getValues();
  
  //Start Config
  var configvu = [];
  configvu["resquestid"] = 12;
  configvu["status"] = 13;
  
  //I choose the requests that are not already done
  var requests = [];
  vuvalues.forEach(function(row){
    if (requests.indexOf(row[configvu["resquestid"]]) === -1 && row[configvu["resquestid"]] != "2") {
      requests.push(row[configvu["resquestid"]]);
    }
  });
  
  //Forms Database
  var fdbsheet = SpreadsheetApp.openById(getdbbyname("formdb")).getSheets()[0]; 
  var sheetlastRow = fdbsheet.getLastRow();
  var values = fdbsheet.getRange(4,1,sheetlastRow-3,15).getValues();
  
  //Start Config
  var configform = [];
  configform["resquestid"] = 1;
  configform["status"] = 14;
  
  var done = [];
  requests.forEach(function(request){
    var add = true;
    values.forEach(function(row){
      if(row[configform["resquestid"]] == request && row[configform["status"]] != "3" && add == true){
        add = false;
      }
    },request,add);
    if (add){
      done.push(request)
    }
  },values);
  
  done.forEach(function(requestid){
    enum = 2;
    vuvalues.forEach(function(row){
      if(row[configvu["resquestid"]] == requestid){
        vudbsheet.getRange(enum,configvu["status"]+1).setValue(2);
        sendtoslack("📢📢 L'évaluation d'une application est finie");
      }
      enum++;
    },enum,requestid,vudbsheet,enum,configvu);
  },vuvalues,vudbsheet,configvu);
}

function checkenoughevaluators(){
  //Check that we have enough evaluators for an app
  var dbid = getdbbyname("formdb"); //Forms Database
  var fdbsheet = SpreadsheetApp.openById(dbid).getSheets()[0]; 
  var sheetlastRow = fdbsheet.getLastRow();
  var values = fdbsheet.getRange(4,1,sheetlastRow-3,14).getValues();
  
  //Start Config
  var configvu = [];
  configvu["resquestid"] = 1;
  configvu["needresponse"] = 11;
  configvu["emailsent"] = 12;
  //End Config
  
  var buffer = [];
  values.forEach(function(row){
    if(parseInt(row[configvu["emailsent"]]) < parseInt(row[configvu["needresponse"]])){
      //The emails sent < response needed (so it's likely that we will never be able to have a good evaluation
      if (buffer.indexOf(row[configvu["resquestid"]]) === -1) {
        //I return an array of all the resquest id's that have problematic forms
        buffer.push(row[configvu["resquestid"]]);
      }
    }
  },buffer);
  
  if (buffer.length > 0){
    sendtoslack("🚨🚨 Il n'y a pas suffisamment d'évaluateurs pour répondre à une demande de VU");
  }
  
  return buffer;
}

function checkduplicateevaluators(){
  //Check the duplicates in GP evaluators based on their email
  removeduplicates(getdbbyname("gpdb"),0,2,5);
  //Check the duplicates in GP evaluators based on their RIB
  removeduplicates(getdbbyname("gpdb"),0,2,12);
  //Check the duplicates in PDS evaluators based on their email
  removeduplicates(getdbbyname("pdsdb"),0,2,4);
  //Check the duplicates in PDS evaluators based on their RIB
  removeduplicates(getdbbyname("pdsdb"),0,2,12); 
}

function suscribedevaluator(){
  //When an evaluator is added to the database I change his/her statut to Actif (1) after checking that his/her email adress exists
  
  //Start Config
  var configvu = [];
  configvu["status"] = 13;
  configvu["emailgp"] = 4;
  configvu["emailpds"] = 3;
  //End Config
  
  var pdssheet = SpreadsheetApp.openById(getdbbyname("pdsdb")).getSheets()[0]; //PDS DB
  var sheetlastRow = pdssheet.getLastRow();
  var values = pdssheet.getRange(2,1,sheetlastRow-1,15).getValues();
  var enum=2;
  values.forEach(function(row){
    if(row[configvu["status"]] == ""){
      //🚨🚨 Checker qu’un mail est valide avant d’envoyer pour DMD !!!!!!!!
      //🚨🚨 Sinon on reçoit des messages d'erreur pendant des semaines!!!!!!!
    
      if(checkemail(row[configvu["emailpds"]])){
        pdssheet.getRange(enum,configvu["status"]+1).setValue(1);
      }else{
        pdssheet.getRange(enum,configvu["status"]+1).setValue(-1);
      }
    }
    enum++;
  },enum,pdssheet);
  
  var gpsheet = SpreadsheetApp.openById(getdbbyname("gpdb")).getSheets()[0]; //GP DB
  var sheetlastRow = gpsheet.getLastRow();
  var values = gpsheet.getRange(2,1,sheetlastRow-1,15).getValues();
  enum=2;
  values.forEach(function(row){
    if(row[configvu["status"]] == ""){
      if(checkemail(row[configvu["emailgp"]])){
        pdssheet.getRange(enum,configvu["status"]+1).setValue(1);
      }else{
        
        pdssheet.getRange(enum,configvu["status"]+1).setValue(-1);
      }
    }
    enum++;
  },enum,gpsheet);
}

function checkunsuscribed (){
  //Check if users have unsuscribed
  //Start Config
  var configvu = [];
  configvu["email"] = 1;
  configvu["status"] = 4;
  //End config
  //Status :
  //-1 - Not found
  //empty - To analyze
  //1 - Unsuscribed
  //2 - Ignore
  //End config
  //Statut
  
  //I don't ask if the person is GP or PDS for 2 reasons 
  //- A PDS can be a user of an app that is not related to his/her specialty 
  //- The UX of the person that want to leave must be good and it's better not to ask too many questions 
  //- Check duplicates in the inscription
  
  var unsuscribedbsheet = SpreadsheetApp.openById(getdbbyname("unsusdb")).getSheets()[0];
  var sheetlastRow = unsuscribedbsheet.getLastRow();
  var values = unsuscribedbsheet.getRange(2,1,sheetlastRow-1,5).getValues();
  var enum=2;
  
  values.forEach(function(row){
    var foundpds = true;
    var foundgp = true;
    var status = parseInt(row[configvu["status"]]) || 0;
    if (status == 0){
      var line = searchspreadsheet(getdbbyname("pdsdb"),row[configvu["email"]],4); //pds spreadsheet
      if(line != -1){
        //I update the status of the evaluators 
        changespreadsheetcell(getdbbyname("pdsdb"),line,14,0);
        //I change the status of the unsuscribed request
        unsuscribedbsheet.getRange(enum,configvu["status"]+1).setValue(1);
      }
      else{
        foundpds = false;
      }
      var line = searchspreadsheet(getdbbyname("gpdb"),row[configvu["email"]],5); //gp spreadsheet
      if(line != -1){
        //I update the status of the evaluators 
        changespreadsheetcell(getdbbyname("gpdb"),line,14,0);
        //I change the status of the unsuscribed request
        unsuscribedbsheet.getRange(enum,configvu["status"]+1).setValue(1);
      }
      else{
        foundgp = false;
      }
    }
    if (!foundpds && !foundgp){//The person has not been found at all
      //🚨🚨 The person has not been found in this database
      unsuscribedbsheet.getRange(enum,configvu["status"]+1).setValue("-1"); 
    }
  },unsuscribedbsheet);
}

function checkenddate() {
  //Check that the end-date of the evaluation has not been reached
  //I open the BackOffice VU
  //If a request is taking to long to be finished people are note payed⇒ In which case it would be interesting to do a parainage :) 
  
  var formss = SpreadsheetApp.openById(getdbbyname("formvu"));
  var formsheet = formss.getSheets()[0];
  var formlastRow = formsheet.getLastRow();
  var values = formsheet.getRange(2,1,formlastRow-1,14).getValues();
  
  //Start Config
  var configvu = [];
  configvu["datedefin"] = 11;
  //End config
  //Status :
  //0 - Waiting
  //1 - Created Forms
  //2 - Filled forms
  //End config
  
  var enum=2;
  
  var now = new Date();
  values.forEach(function(row){
    if(row[configvu["datedefin"]] < now){
      sendtoslack("🚨🚨 Une demande de VU a pris plus d'un moins a être finie");
    };
  });
}

function checkevaluationdone() {
  //I open the forms database spreadsheet
  var formss = SpreadsheetApp.openById(getdbbyname("formdb"));
  var formsheet = formss.getSheets()[0];
  var formlastRow = formsheet.getLastRow();
  var values = formsheet.getRange(4,1,formlastRow-3,15).getValues();
  var enum=4;
  
  //Start Config
  var configvu = [];
  configvu["formid"] = 0;
  configvu["requestid"] = 1;
  configvu["responseid"] = 4;
  configvu["cible"] = 9;
  configvu["responsemax"] = 11;
  configvu["filled"] = 13;
  configvu["status"] = 14; 
  //Status :
  //0 - Disabled form
  //1 - Form created but not sent
  //2 - Form created and sent
  //3 - Form finished and closed
  //End config
  
  /* test 
  var testspread = SpreadsheetApp.openById("1iiA0GXBWGTcQDM4BJdbcW0WqGlGCTGBiARPy8ZIraHs");
  testspread.getSheets()[1].getRange(1,1,15,20).copyTo(testspread.getSheets()[0].getRange(2,1));  
  */
  
  values.forEach(function(row){
    if(row[configvu["status"]] == "1" || row[configvu["status"]] == "2" ){
      //We only look for this status to increase performance
      row[configvu["filled"]] = removeduplicates(row[configvu["responseid"]],0,2,2); // I set the number of unique responses after deleting duplicates
      formsheet.getRange(enum,configvu["filled"]+1).setValue(row[configvu["filled"]]);
      if (parseInt(row[configvu["filled"]]) >= parseInt(row[configvu["responsemax"]])){
        //I've reached the number min of responses 
        deactivateform(row[configvu["formid"]]);
        formsheet.getRange(enum,configvu["status"]+1).setValue(3); //Evaluations are done
        var emails = getfilledemails(row[configvu["responseid"]]);
        for (i = 0; i < emails.length; i++) { 
          //I log all the persons that answered to the form that has just been done
          logevent({"requestid":row[configvu["requestid"]],"type":"fill","id":emails[i][0],"category":row[configvu["cible"]]})
        }
      }
    }    
    enum++;
  },enum,formsheet);
}
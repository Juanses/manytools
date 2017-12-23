function SendForms(requestid){
  //I open the forms database spreadsheet
  var formss = SpreadsheetApp.openById(getdbbyname("formdb"));
  var formsheet = formss.getSheets()[0];
  var formlastRow = formsheet.getLastRow();
  var values = formsheet.getRange(4,1,formlastRow-3,15).getValues(); 
  
  //Start Config
  var configvu = [];
  configvu["id"] = 0;
  configvu["requestid"] = 1;
  configvu["created"] = 2;
  configvu["formurl"] = 3;
  configvu["responseid"] = 4;
  configvu["responseurl"] = 5;
  configvu["nom"] = 6;
  configvu["plateform"] = 7;
  configvu["type"] = 8;
  configvu["cible"] = 9;
  configvu["detail"] = 10;
  configvu["responsemin"] = 11;
  configvu["status"] = 14;
  //End config
  
  var enum=4;
  values.forEach(function(row){
    var rowdata = {};for(key in configvu){rowdata[key] = row[configvu[key]];}
    //Status :
    //0 - Disabled form
    //1 - Form created but not analyzed (we haven't checked the match with evaluators)
    //2 - Form created and analyzed (we havec checked even if we couldn't find evaluators that match)
    //3 - Form finished and closed
    if((parseInt(rowdata["status"]) == 1 && rowdata["requestid"] == "" ) || (parseInt(rowdata["status"]) == 2 && rowdata["requestid"] == requestid)){
      Logger.log(rowdata["status"]);
      Logger.log(rowdata["requestid"]);
      var selected = getUsers(rowdata); //selected = [Prefixe, Nom de famille, email]
      formsheet.getRange(enum,13).setValue(selected.length);     
      if (selected.length > 0){
        //There's at least one user selected
        var data = {"requestid":row[configvu["requestid"]],"destination":selected, "subject": "[📱 mHQ] Evaluation d'une application mobile" , "platform": rowdata["plateform"], "form_link": FormApp.openById(rowdata["id"]).getPublishedUrl(), "unsuscribe":"https://docs.google.com/forms/d/e/1FAIpQLSchg6gnWL7J23_o5_QhHHjQ_1UIVyQYGfRrTDy_xy-_XhKWbw/viewform", "type":rowdata["cible"]};
        var template = "eval_template";
        //SendEmail(selected,template,data);
      }
      else{
        //Pas de match pour les critères, il faut trouver cette personne à tout prix
        switch (rowdata["cible"]){
          case "GP":
            //sendtoslack("🚨🚨 Pas d'évaluateur dans la catégorie 'grand public' avec les critères suivants : "+ rowdata["detail"] + " | | |  " + rowdata["plateform"]); //📢
            break;
          case "PDS":
            //sendtoslack("🚨🚨 Pas d'évaluateur dans la catégorie 'professionnel de santé' avec les critères suivants : "+ rowdata["detail"] + " | | |  " + rowdata["plateform"]); //📢
            break;
        }
      }
    }
    formsheet.getRange(enum,15).setValue(2);
    enum++;
  },enum,formsheet,requestid);
}

function getUsers(formdata){
  switch(formdata["cible"]){
    case "GP":
      var db = SpreadsheetApp.openById(getdbbyname("gpdb")); //DB of GP evaluators
      break;
    case "PDS":
      var db = SpreadsheetApp.openById(getdbbyname("pdsdb")); //DB of PDS evaluators
      break;           
  }
  //Start Config
  var configvu = [];
  configvu["platforms"] = 10;
  configvu["sexe"] = 3;
  configvu["spe"] = 9;
  configvu["actif"] = 13;
  configvu["emailgp"] = 4;
  configvu["emailpds"] = 3;
  //End config
  
  var pdssheet = db.getSheets()[0];
  var pdslast = pdssheet.getLastRow();
  var values = pdssheet.getRange(2,1,pdslast-1,14).getValues();
  
  var selected = [];
  values.forEach(function(row){
    var rowdata = {};for(key in configvu){rowdata[key] = row[configvu[key]];}
    switch (formdata["cible"]){
      case "GP":
        var sexo = rowdata["sexe"]; //I need this to send an email with the right particle
        if (rowdata["sexe"] == "Indifférent"){
          //I do this to make the next test to pass if the person is either a man or a woman
          //I only works for GP because the physicians are not affected but this criteria
          rowdata["sexe"] = "Indifférent";
        }
        if (rowdata["sexe"] == formdata["detail"] && rowdata["platforms"].indexOf(formdata["plateform"]) != -1 && rowdata["actif"]== "1"){
          if (sexo == "Homme"){
            selected.push(["M.",row[1],row[configvu["emailgp"]]]);
          }
          else{
            selected.push(["Mme.",row[1],row[configvu["emailgp"]]]);
          }
        }
        break;
      case "PDS":
        if (rowdata["spe"] == formdata["detail"] && rowdata["platforms"].indexOf(formdata["plateform"]) != -1 && rowdata["actif"] == "1"){
          selected.push(["Dr.",row[1],row[configvu["emailpds"]]]);
        }
        break;
    }
    
  },selected,configvu,formdata);
  
  return selected;
  
}

function SendEmail(list,template,keywords){
  list.forEach(function(row){
    //I prepare the data to populate the email
    var htmlBody = HtmlService.createHtmlOutputFromFile(template).getContent();
    //I replace the values on the template with the values in the object
    keywords["prefixe"] = row[0];
    keywords["nom"] = row[1];
    for (var key in keywords) {
      if(key == "nom"){
        htmlBody = htmlBody.replace("%"+key+"%", keywords[key].toProperCase());
      }
      else{
        htmlBody = htmlBody.replace("%"+key+"%", keywords[key]);
      }
      //Logger.log("key " + key + " has value " + myArray[key]);
    }
    //Logger.log(htmlBody);
    
    logevent({"requestid":keywords["requestid"],"type":"email","id":row[2],"category":keywords["type"]})
    MailApp.sendEmail(row[2],keywords["subject"],"This message requires HTML support to view.",{name: 'Juan mHealthQuality',htmlBody: htmlBody});
    
  },template,keywords);
}

function sendtoslack (message){
  // Make a POST request with a JSON payload.
  //https://zapier.com/help/slack/#tips-formatting-your-slack-messages
  var data = {
    'message': message
  };
  var options = {
    'method' : 'post',
    'contentType': 'application/json',
    'payload' : JSON.stringify(data)
  };
  //UrlFetchApp.fetch('https://hooks.zapier.com/hooks/catch/2479763/r4up7r/', options);
  UrlFetchApp.fetch('https://hook.integromat.com/rpj3sa5o8hejm5qqk5vivl58css9467v', options);
}
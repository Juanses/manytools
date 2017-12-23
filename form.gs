function createForms(RequestID,Plateform,Data){
  var Title = "Evaluation "+Data["name"]+" "+Plateform
  switch(Plateform){
    case "Android":
      var appurl = Data["urlAndroid"];
      break; 
    case "iOS":
      var appurl = Data["urliOS"];
      break;
  }
  var Name = Data["name"];
  var Description = "L'application s'appelle "+Name+". La plateforme sur laquelle elle est disponible est : "+Plateform+". Pour la télécharger, voici le lien : "+appurl;
  var Type = Data["type"];
  
  switch(Type){
    case "GP - GP": //There will be 2 type of forms, for the PDS and for the GP
      var cible = "GP";
      var formulaire = new FormPrepare(Title,Description);
      Formfill(formulaire.formobject,0);
      dbfill(formulaire,RequestID,Type,Name,Plateform,cible,Data["sexe"]);
      cible = "PDS";
      var formulaire = new FormPrepare(Title,Description);
      Formfill(formulaire.formobject,1);
      dbfill(formulaire,RequestID,Type,Name,Plateform,cible,Data["spe"]);     
      break;
    case "PDS - GP": //There will be 2 type of forms, for the PDS and for the GP
      var cible = "GP";
      var formulaire = new FormPrepare(Title,Description);
      Formfill(formulaire.formobject,0);
      dbfill(formulaire,RequestID,Type,Name,Plateform,cible,Data["sexe"]);
      cible = "PDS";
      var formulaire = new FormPrepare(Title,Description);
      Formfill(formulaire.formobject,1);
      dbfill(formulaire,RequestID,Type,Name,Plateform,cible,Data["spe"]);     
      break;
    case "PDS - PDS"://There will be only one type of form the one for PDS
      cible = "PDS";
      var formulaire = new FormPrepare(Title,Description);
      Formfill(formulaire.formobject,2);
      dbfill(formulaire,RequestID,Type,Name,Plateform,cible,Data["spe"]);     
      break;
  }
}

function FormPrepare(Title,Description){
  //I Create and Open the form
  var form = FormApp.create(Title)
  .setTitle(Title)
  .setDescription(Description)
  .setConfirmationMessage('Merci de votre réponse')
  .setAllowResponseEdits(false)
  .setShowLinkToRespondAgain(false)
  .setRequireLogin(false)
  .setAcceptingResponses(true);
  //.collectsEmail(true) It doesn't work, I don't know why
  
  //set all the variables and create the response spreadsheet
  var responsess = SpreadsheetApp.create(form.getId());
  // Update the form's response destination.
  form.setDestination(FormApp.DestinationType.SPREADSHEET, responsess.getId());  
  //🚨🚨 I've had to add the formula to calculate the score of the app when the sheet will be filled
  //🚨🚨 Don't forget to put the formula to calculate the score of the app
  
  //I have to move the file because they are created at the root of the Drive by default
  moveFile(form.getId(),"0BzWLWb2JQXdPd2M3NlR6TzMtWEU");
  moveFile(responsess.getId(),"0BzWLWb2JQXdPd2M3NlR6TzMtWEU");
  
  this.formobject = form;
  this.responsessobject = responsess;
  
}

function Formfill(form,sheet){
  //I open the spreadsheet where are the templates of the type of VU forms 
  var ss = SpreadsheetApp.openById(getdbbyname("formdb"));
  //I go to the sheet where is the form template for this type of application (PDS - PDS or GP - GP etc...) 
  var sheet = ss.getSheets()[sheet];
  var qamount = sheet.getLastRow();
  var values = sheet.getRange(4,1,qamount-3,8).getValues(); 
  
  //Creation of the email field to know who's answering the form
  var textItem = form.addTextItem().setTitle('Votre adresse email').setRequired(true);
  var textValidation = FormApp.createTextValidation()
  .setHelpText('Votre email')
  .setRequired(true)
  .requireTextIsEmail()
  .build();
  textItem.setValidation(textValidation);
  
  //Create all other items
  values.forEach(function(row){
    switch(row[2]){
      case "Multiple": //In case of a Slider from 1 to X
        var item = form.addScaleItem();
        item.setTitle(row[0])
        .setBounds(parseInt(row[3]), parseInt(row[4]))
        .setLabels(row[5], row[6])
        break;
      case "Radio": //In case of a radiobox
        var item = form.addMultipleChoiceItem();
        item.setTitle(row[0]);
        var valeurs = [row[3],row[4]];
        var choicearray = [];
        for (var i=0; i < valeurs.length; i++ ) {
          choicearray.push(item.createChoice(valeurs[i]));
        }
        item.setChoices(choicearray);
        break;
      case "Champ Libre": //In case of a TextArea
        var item = form.addParagraphTextItem();
        item.setTitle(row[0])
        break;
    }
    if (parseInt(row[1]) == 1){
      item.setRequired(true);
    }
  }); 
  //return form.getId()
}

function dbfill(formulaire,requestID,type,name,plateform,cible,detail){
  //I open the forms database spreadsheet
  //Store the new form in the Forms Database
  var formss = SpreadsheetApp.openById(getdbbyname("formdb"));
  var formsheet = formss.getSheets()[0];
  var formlastRow = formsheet.getLastRow();
  formlastRow++;
 
  var today = new Date();
  formsheet.getRange(formlastRow,1).setValue(formulaire.formobject.getId());
  formsheet.getRange(formlastRow,2).setValue(requestID);
  formsheet.getRange(formlastRow,3).setValue(today);
  formsheet.getRange(formlastRow,4).setFormula('=HYPERLINK("'+formulaire.formobject.getPublishedUrl()+'";"URL")');
  formsheet.getRange(formlastRow,5).setValue(formulaire.responsessobject.getId());
  formsheet.getRange(formlastRow,6).setFormula('=HYPERLINK("'+formulaire.responsessobject.getUrl()+'";"URL")');
  formsheet.getRange(formlastRow,7).setValue(name);
  formsheet.getRange(formlastRow,8).setValue(plateform);
  formsheet.getRange(formlastRow,9).setValue(type);
  formsheet.getRange(formlastRow,10).setValue(cible);
  formsheet.getRange(formlastRow,11).setValue(detail);
  
  switch(type){
    case "GP - GP":
      var value = (cible == "GP")?8:2;
      formsheet.getRange(formlastRow,12).setValue(value);
      break;
    case "PDS - GP":
      var value = (cible == "GP")?8:2;
      formsheet.getRange(formlastRow,12).setValue(value);
      break;
    case "PDS - PDS":
      formsheet.getRange(formlastRow,12).setValue(6);
      break;
  }
  
  //Status :
  //0 - Disabled form
  //1 - Form created but not sent
  //2 - Form created and sent
  //3 - Form finished and closed
  
  formsheet.getRange(formlastRow,15).setValue(1);  
}

function deactivateform(formid){  
  FormApp.openById(formid)
  .setAcceptingResponses(false)
  .setCustomClosedFormMessage("Trop tard 😜! Nous sommes désolés de vous avoir dérangé 😓 mais nous avons obtenu la quantité de réponses nécessaires pour l'évaluation 😄. Ça sera pour une prochaine fois ! 👍");
}

function getfilledemails(responsesid){
  var responsesheet = SpreadsheetApp.openById(responsesid).getSheets()[0];
  var lastrow = responsesheet.getLastRow();
  var values = responsesheet.getRange(2,2,lastrow-1,1).getValues();
  return values;  
}

/*
function FormUpdateSent(formid,type,sent){ 
  switch (type){
    case "PDS":
      var col = 12;
      break;
    case "GP":
      var col = 13;
      break;      
  }
  //I open the forms database spreadsheet
  var formss = SpreadsheetApp.openById("1KqJKgC6qMkoJvBB8O3zDkNXhbB5QIitoRdg7u8eibUM");
  var formsheet = formss.getSheets()[0];
  var formlastRow = formsheet.getLastRow();
  var values = formsheet.getRange(4,1,formlastRow-3).getValues();
  var enum = 4;
  values.forEach(function(row){
    if(row[0] == formid){
      formsheet.getRange(enum,col).setValue(sent);
    };
    enum++;
  },enum,formid,sent,formsheet,col);
}*/
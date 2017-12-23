String.prototype.toProperCase = function () {
    return this.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
};

function moveFile(fileid,destinationfolderid){
  var destinationid = destinationfolderid;
  var file = DriveApp.getFileById(fileid);
  var parents = file.getParents();
  while (parents.hasNext()) {
    var parent = parents.next();
    //Logger.log(parent.getName());
    parent.removeFile(file);
  }
  DriveApp.getFolderById(destinationid).addFile(file); 
}

function generaterandom(){
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (var i = 0; i < 15; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  return text;
}

function changespreadsheetcell(spreadsheetid,line,col,value){
  var sspreadsheet = SpreadsheetApp.openById(spreadsheetid).getSheets()[0];
  sspreadsheet.getRange(line,col).setValue(value);
}

function searchspreadsheet(spreadsheetid,value,col){
  var unsuscribedbsheet = SpreadsheetApp.openById(spreadsheetid).getSheets()[0];
  var sheetlastRow = unsuscribedbsheet.getLastRow();
  var values = unsuscribedbsheet.getRange(2,1,sheetlastRow-1,15).getValues();
  var enum=2;
  var found=-1;
  values.forEach(function(row){
    if (row[col-1] == value){
      found = enum;
      return found;
    }
   enum++;
  });
  return found;
}

function removeduplicates(spreadsheetid,sheet,startrow,col){
  //I remove duplicates and return the number of unique responses
  var responses = SpreadsheetApp.openById(spreadsheetid);
  var responsessheet = responses.getSheets()[sheet];
  var responsestRow = responsessheet.getLastRow();
  if (responsestRow != 1){
    //The form has responses
    var values = responsessheet.getRange(startrow,col,responsestRow-(startrow-1),1).getValues();
    var buffer = []; 
    var continuer = true;
    var i = 0;
    while (continuer) {
      if (buffer.indexOf(values[i][0]) === -1) {
        buffer.push(values[i][0]);
        i++;
      }
      else{
        responsessheet.deleteRow(i+2);
        values.splice(i, 1);
        i = buffer.length;
      }
      continuer = (buffer.length == values.length)?false:true;
    }
    return buffer.length;
  }
  else{
    return 0;
  }
}

function logevent(data){
  //I open the forms database spreadsheet
  var logsheet = SpreadsheetApp.openById("1y4_ZyNZA2gtBJlEkAQz1Y5TtfaHhxU9TdnMt1vTcv-4").getSheets()[0];
  var loglastrow = logsheet.getLastRow();
  loglastrow++;
  var now = new Date();
  logsheet.getRange(loglastrow,1).setValue(data["id"]);
  logsheet.getRange(loglastrow,2).setValue(data["category"]);
  logsheet.getRange(loglastrow,3).setValue(data["requestid"]);
  logsheet.getRange(loglastrow,4).setValue(data["type"]);
  if (data["details"] != undefined){
    logsheet.getRange(loglastrow,5).setValue(data["details"])
  }
  logsheet.getRange(loglastrow,6).setValue(now);
}

function getdbbyname(name) {
  switch(name){
    case "formvu":
      return "1mkpVls9p1_k50H5iO28Va3x7r5dnnqpiFzXvOrcjmgM";
      break;
    case "formdb":
      return "1KqJKgC6qMkoJvBB8O3zDkNXhbB5QIitoRdg7u8eibUM";
      break;
    case "gpdb":
      return "1B15GhbKGYnzQTBln7t3Sljw_sW_ERpSPzYbJ7og_3V0";
      break;
    case "pdsdb":
      return "1XxRPPe2IGikhPNnTjsxdWk2GfhnDetnTdSNdrL8JXQc";
      break;
    case "logdb":
      return "1KqJKgC6qMkoJvBB8O3zDkNXhbB5QIitoRdg7u8eibUM-4";
      break;
    case "vuquest":
      return "1fvCKqYz2OjHgfkFZbDlb3m23a8vRX2TKD54DcjtQQHU";
      break;
    case "unsusdb":
      return "16Sy43NayDZcaLPk1lxBI96QTtgnKBMWJFcg_idJZ5Wg";
      break;
  }
}

function checkemail (emailadress){
  var response = UrlFetchApp.fetch('http://apilayer.net/api/check?access_key=2c633dc5186a0b58982efcbfe1c4c5c2&email='+emailadress+'&smtp=1&format=1');
  var dataAll = JSON.parse(response.getContentText());
  if (dataAll["smtp_check"] && dataAll["mx_found"]){
    return true;
  }
  else{
    return false;
  }
}
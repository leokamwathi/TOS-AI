
$("#process").click(processData);
$("#reset").click(resetData);
$("#highlight").click(saveData);
$(document).ready(function(){
   loadEntries(true);
});

var sentences = [];
var selected = [];

function resetData(){
  sentences = [];
  selected = [];
  $("#out").html("");
  $("#process").prop("disabled",false);
  $("#highlight").prop("disabled",true);
}

function saveData(){
  $("#highlight").prop("disabled",true);
  $.post( "db.php", { text: sentences, selected: selected, title: $("#title").val() }).done(function( data ) {
    resetData();
    loadEntries(false);
  });
}

function processData(){
  $("#process").prop("disabled",true);
  var data = $("#text").val();
  sentences = data.split(/\.\s|\n/g);
  for(var i=0;i<sentences.length;i++){
    if(sentences[i].length == 0)
      sentences.splice(i,1);
  }
  renderData();
  $("#highlight").prop("disabled",false);
}

function renderData(){
  var txt = "";
  var style = "";
  for(var i=0;i<sentences.length;i++){
    style = "";
    if(selected.indexOf(""+i) != -1)
      style = "style='background-color:#0174DF;'";
    txt += "<span id='sentence"+i+"' class='sentence' onclick='selectSentence(this);' "+style+">"+sentences[i]+". </span>";
  }
  $("#out").html(txt);
}

function selectSentence(e){
  var id = e.id;
  id = id.split("sentence")[1];
  if(selected.indexOf(id) == -1)
    selected.push(id);
  else
    selected.splice(selected.indexOf(id),1);
  renderData();
}


var titles = [];
var texts = [];
var selects = [];
function loadEntries(b){
  $.get( "save.json?r="+Math.random(), function( data ) {
    var txt = "<ol>";
    for(var i=0;i<data.length;i++){
      titles[i] = data[i].title;
      texts[i] = data[i].text;
      selects[i] = data[i].selected;
      txt += "<li><b>"+data[i].title+"</b> [<a href='#' onclick='view("+i+");'>view</a>] [<a href='#' style='color:red;' onclick='deleteItem("+i+");'>delete</a>]</li>";
    }
    txt += "</ol>";
    $("#entries").html(txt);
    if(data.length == 0){
      $("#entries").html("No entries yet");
    }
    if(b)
      setTimeout(function(){loadEntries(true);},10000);
  },"json");
}

function deleteItem(id){
  var text = prompt("Enter title of entry to confirm", "");
  if (text == titles[id]) {
    $.post( "db.php", { id: id }).done(function( data ) {
      loadEntries(false);
    });
  }else if(text != null){
    alert("Incorrect");
  }
  
}

function view(id){
  var txt = "<hr/><a href='#' onclick='clearViewer();'>clear</a> "+(id+1)+". ";
  var style = "";
  for(var i=0;i<texts[id].length;i++){
    style = "";
    if(selects[id].indexOf(""+i) != -1)
      style = "style='background-color:#0174DF;'";
    txt += "<span "+style+">"+texts[id][i]+". </span>";
  }
  $("#viewer").html(txt);
}

function clearViewer(){
  $("#viewer").html("");
}

function calcWords(){
  wordsin = {};
  wordsout = {};
  numin = 0;
  numout = 0;
  for(var i=0;i<texts.length;i++){
    for(var j=0;j<texts[i].length;j++){
      var s = texts[i][j].split(/\s/);
      for(var k=0;k<s.length;k++){
        s[k] = s[k].replace(/[^\w]/g,"").toLowerCase();
        if(selects[i].indexOf(""+j) == -1){
          numout += 1;
          if(s[k] in wordsout)
            wordsout[s[k]] += 1;
          else
            wordsout[s[k]] = 1;
        }else{
          numin += 1;
          if(s[k] in wordsin)
            wordsin[s[k]] += 1;
          else
            wordsin[s[k]] = 1;
        }
      }
    }
  }

  wordScores = {};

  $.each( wordsin, function( key, value ) {
    wordScores[key] = value*10000/numin;
  });
  $.each( wordsout, function( key, value ) {
    if(key in wordScores)
      wordScores[key] -= value*10000/numout;
    else
      wordScores[key] = -value*10000/numout;
  });

  $.post( "db.php", { wordscores: wordScores }).done(function( data ) {
    $("#scoreResult").show();
    $("#test_btn").prop("disabled",false);
  });

}

function scoreSentences(){
    var str = $("#test_txt").val();
    var s = str.split(/\.\s|\n/g);
    var s_scores = [];
    for(var i=0;i<s.length;i++){
      var score = 0;
      var words = s[i].replace(/[^\w\s]/g,"").toLowerCase().split(/\s/);
      for(var j=0;j<words.length;j++){
        if(words[j].length > 0 && words[j] in wordScores){
          score += wordScores[words[j]];
        }
      }
      s_scores[i] = score;
    }
    var scores_copy = s_scores.slice(0);
    scores_copy.sort(function (a, b) { 
      return b - a;
    });
    var min_score = 0;
    if(scores_copy.length >= 10){
      min_score = scores_copy[9];
    }else{
      min_score = scores_copy[scores_copy.length-1];
    }
    var txt = "";
    for(var i=0;i<s.length;i++){
      if(s[i].length > 0 && s_scores[i] > min_score)
        txt += s[i]+" : "+s_scores[i]+"<br/>";
    }
    $("#sum").html(txt);
}
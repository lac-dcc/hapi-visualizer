function post(endpoint, data) {
  return fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
    .then(res => res.json());
}

function genDot(svgId, dot) {
  var viz = new Viz();

  const svgDiv = $(`div#${svgId}`);
  svgDiv.html("");

  viz.renderSVGElement(dot)
    .then(function (svg) {
      svgDiv.append(svg);
    })
    .catch(error => {
      svgDiv.html("Error");

      // Create a new Viz instance (@see Caveats page for more info)
      viz = new Viz();

      // Possibly display the error
      console.error(error);
    });
}

function generate(){

  // add d-flex class
  $("div#load-overlay").addClass("d-flex");

  const request = new XMLHttpRequest();
  const formData = new FormData();
  var mainCode = undefined;

  if (document.getElementById('toggle-main-code').checked ) {
    const typedCode = $('textarea#code').val();
    mainCode = new File(typedCode.split('\n'), "main.hp", {
      type: "text/plain",
    });
  } else {
    mainCode = mainFile;
    //ToDo: throws an error if mainFile is undefined
  }

  // append main file at formData
  formData.append('action', 'hapicode');
  formData.append('main', mainCode);

  // append importFiles at formData
  for(i=0; i< filesForUp.length; i++){
    formData.append('import'+(i+1), filesForUp[i]);
  }
  request.onreadystatechange = receivingData;
  request.open("POST", '/generate', true);
  request.send(formData);
}

function receivingData() {
  if (this.readyState == 4){
    var response = JSON.parse(this.responseText);
    if (this.status == 200)
      receivingSuccess(response);
    else
      receivingError(response);

    $("div#load-overlay").removeClass("d-flex");
  }
};

function isHapiFile(path){
  if(path.includes('.') &&
    path.substr(path.lastIndexOf(".")+1) == 'hp'){
      return true;
  }
  return false;
}

function receivingError(res){
  var msg = "";
  if(!res.error || !res.error.msg){
    // unknown error
    msg = "Unknown error";
  } else {
    msg = res.error.msg;
  }
  $('textarea#error-message').text(msg);
  $('#errorModal').modal('show');
}

function receivingSuccess(res){
  $('textarea#yaml-code').text(res.yaml);

  addMatrixDisplay(res.jsonMatrix);
  updateMatrixCheckboxes();
    
  genDot('actorsGraph', res.actors);
  genDot('resourcesGraph', res.resources);
  genDot('actionsGraph', res.actions);
  $('input#preview').removeClass('disabled');
  $('input#preview').removeAttr('disabled');
  $('#resultsModal').modal('show');

}

// Output from parsing json matrix received from Hapi program
// All of these are to be global objects, so that it may be possible to
//   dynamically filter the matrix, without having to find and parse the json
//   file every time.
var jsonMatrix = undefined;
var matrixActors = undefined;
var matrixResources = undefined;
var matrixActions = undefined;

// This function adds the first display of the Matrix, which shall be
//   unfiltered. That means that all the actors, resources and actions should be
//   displayed.
// Also, it initializes the variable jsonMatrix
function addMatrixDisplay(jsonStringMatrix) {
  // Create HTML Object from JSON object
  jsonMatrix = JSON.parse(jsonStringMatrix);
  matrixActors = Object.keys(jsonMatrix);
  matrixResources = Object.keys(jsonMatrix[matrixActors[0]]);
  matrixActions = Object.keys(jsonMatrix[matrixActors[0]][matrixResources[0]]);

  updateMatrixDisplay(matrixActors, matrixResources, matrixActions);
}

// Adds checkboxes into the Hapi matrix area (preferably into a modal created
//   specifically for this purpose).
// The idea is to create three bootstrap columns, one for each lattice - actors,
//   resources, actions.
// Each actor, resource and action shall have its own checkbox, to determine
//   whether or not to display it in the matrix.
// The default status of the checkboxes shall be "checked".
function updateMatrixCheckboxes() {
  // Clear current checkboxes
  $("#matrixFilterBody>div>*").get().forEach(el => el.remove());

  // Now, for each actor, resource and actions, we must add its respective
  //   checkboxes.
  [matrixActors, matrixResources, matrixActions]
    .forEach( function (arr, index) {
      arr.forEach( function (el) {
        var newRow = document.createElement("div");
        newRow.classList.add("row");
    
        var newInput = document.createElement("input");
        newInput.setAttribute("type", "checkbox");
        newInput.toggleAttribute("checked");
    
        var newSpan = document.createElement("span");
        newSpan.innerHTML = el;
    
        newRow.appendChild(newInput);
        newRow.appendChild(newSpan);
        document.getElementById("matrixFilterBody").children[index].appendChild(newRow)
      })
  });    
}
    
// Gets information on checked checkboxes to determine which rows / columns and
//   actions should be displayed.
// Whenever it is decided to implement filtering based on user input text, this
//   function should also handle this factor (that is, take into account the
//   text input).
// Delegates task of actually changing html elements to function updateMatrix
function filterMatrix() {
    var filteredActors = undefined;
    var filteredResources = undefined;
    var filteredActions = undefined;

    function filterLattice(index) {
      return $(`#matrixFilterBody>div:nth-child(${index}) input`).filter(
        function() { return this.checked }).siblings().get()
        .map(el => el.innerHTML);
    }
    
    filteredActors = filterLattice(1);
    filteredResources = filterLattice(2);
    filteredActions = filterLattice(3);

    updateMatrixDisplay(filteredActors, filteredResources, filteredActions);
}

function updateMatrixDisplay(actors, resources, actions) {
  // Clear current matrix
  $("#matrixDisplayTable").html("");

  // Create new one from scratch
  var matrixTable = document.createElement("table");

  // Fill the table
  var newRow = document.createElement("tr"); // Top row
  var newTh = document.createElement("th"); // Upper left corner
  var newThead = document.createElement("thead");
    
    // Generating column headers
  newRow.appendChild(newTh);
  for (i in resources) {
    newTh = document.createElement("th");
    newTh.innerHTML = resources[i];
    newRow.appendChild(newTh);
  }
  newThead.appendChild(newRow);
  matrixTable.appendChild(newThead);

  var newTbody = document.createElement("tbody");
  var newTd = undefined;
  var newDiv = undefined;
  // Now the rest of the rows, one by one
  for(i in actors) {
    newRow = document.createElement("tr");

    // Line header
    newTh = document.createElement("th");
    newTh.innerHTML = actors[i];
    newRow.appendChild(newTh);

    // Adding tds (each action status)
    for (j in resources) {
      newTd = document.createElement("td");
      for (k in actions) {
        newDiv = document.createElement("div");
        newDiv.setAttribute("align", "center");

        if (jsonMatrix[actors[i]][resources[j]][actions[k]] === 0)
          newDiv["style"]["backgroundColor"] = "#C8C8C8";
        else
          newDiv["style"]["backgroundColor"] = "#3786BD";

        newDiv.innerHTML = actions[k];
        newTd.appendChild(newDiv);
      }
      newRow.appendChild(newTd);
    }
    newTbody.appendChild(newRow);
  }
  matrixTable.appendChild(newTbody);

  // Finally, insert table in appropriate area
  document.getElementById("matrixDisplayTable").appendChild(matrixTable);
}

$(document).ready(function () {
  $('#toggle-main-code')[0].checked = true;

  // Add tab key functionality to the code text area
  $("#code").on("keydown", function (ev) {
    if (ev.key === "Tab") {
      ev.preventDefault();

      var start = this.selectionStart;
      var end = this.selectionEnd;

      this.value = this.value.substring(0, start) + "\t" +
        this.value.substring(end);

      // Make sure to return the caret to the right place
      this.selectionStart =
        this.selectionEnd = start + 1;
    }
  })

  $("#generate").click(function (e) {

    generate();

    e.preventDefault();
  });

  $(document).on('change', ':file', function() {
    var input = $(this),
        numFiles = input.get(0).files ? input.get(0).files.length : 1,
        label = input.val().replace(/\\/g, '/').replace(/.*\//, '');
    input.trigger('fileselect', [numFiles, label]);
  });

  $("#customFile").on('fileselect', function() {
    var inputedFiles = document.getElementById('customFile').files;
    addFiles(inputedFiles);
  });

  $("#customFile2").on('fileselect', function() {
    var mainFile = document.getElementById('customFile2').files[0];
    addMain(mainFile);
  });

  $('#toggle-main-code').on('change', function(ev) {
    var textArea = document.getElementById('code');
    var dropArea = document.getElementById('file-main');
    var fileInputToggleLabel = document.getElementById('fileInput');
    var typeCodeToggleLabel = document.getElementById('typeCode');

    if(ev.target.checked){
      dropArea.setAttribute('disabled', '');
      textArea.removeAttribute('disabled');
      toggleMain(textArea, dropArea, typeCodeToggleLabel, fileInputToggleLabel);

    } else {
      dropArea.removeAttribute('disabled');
      textArea.setAttribute('disabled', '');
      toggleMain(dropArea, textArea, fileInputToggleLabel, typeCodeToggleLabel);
    }
  });

  $('.toggle-text').on('click', function(ev){
    var toggleLabel = ev.target;
    if(!toggleLabel.classList.contains('selected'))
      document.getElementById('toggle-main-code').click();
  });

  // Matrix filter events

  // The collapse animation is done purely in css by a checkbox
  // trick
  $("#matrixCollapseBtnBottom").click(
    _ => document.getElementById("matrixCollapseBtn").checked = false
  )
  $("#matrixFilterAreaOps input[name=ClearAll]").click(
    _ => $("#matrixFilterBody input").get().forEach(el => el.checked = false)
  )                
  $("#matrixFilterAreaOps input[name=SelectAll]").click(
    _ => $("#matrixFilterBody input").get().forEach(el => el.checked = true)
  )
  $("#matrixFilterAreaOps input[name=Filter]").click(function (e) {
    e.preventDefault();
    filterMatrix();
  });

});

function toggleMain(toAble, toDisable, toggleTrue, toggleFalse){
  toggleTrue.classList.add('selected');
  toggleFalse.classList.remove('selected');
  toAble.classList.remove('disabled');
  toDisable.classList.add('disabled');
}

var mainFile = undefined;
function addMain(_mainFile){
  if(!isHapiFile(_mainFile.name)){
    // TODO: popup with error is not a Hapi File
    return;
  }
  filenameArea = document.getElementById('filename-row');
  if (mainFile != undefined){
    mainFile = _mainFile;
    var span = filenameArea.children[0];
    span.textContent = _mainFile.name;
    return;
  }

  mainFile = _mainFile;

  var span = document.createElement('span');
  span.appendChild(document.createTextNode(_mainFile.name));
  span.className = 'col-10 file-name';
  filenameArea.appendChild(span);

  var button = document.createElement('button');
  button.addEventListener('click', function(ev){
    removeMain(ev.target.parentElement);
  });
  button.className = 'btn btn-danger remove-button'
  button.appendChild(document.createTextNode('X'));
  button.setAttribute('type', 'button');
  filenameArea.appendChild(button);
}

function removeMain(filenameArea){
  mainFile = undefined
  filenameArea.innerHTML = '';
}

function removeFile(removedLi){
  console.log(removedLi)
  // get index to remove
  var index = parseInt(removedLi.getAttribute('index'));

  // remove the indexed element from the <ul>
  var ul = removedLi.parentElement;
  ul.removeChild(removedLi);

  //apply FileForUp.splice(i, 1)
  filesForUp.splice(index, 1);

  //reset the attr (index, id) for each <li>
  var children = ul.children;
  for(i=0; i< children.length; i++){
    children[i].setAttribute('index', i)
  }
  updateCounter();
}

var filesForUp = [];
var maxFiles = 5;
function addFiles(files){
  var size = files.length;
  if(size + filesForUp.length > maxFiles){
    // put a message to show maxFiles overflow
    return false;
  }

  var ul = document.getElementById('upload-list');

  for(var i=0; i<size; i++){
    if(!isHapiFile(files[i].name)){
      // TODO: popup with error: Is not a Hapi file
      return;
    }
  }

  for(var i=0; i<size; i++){
    var li = document.createElement('li');
    li.className = 'list-group-item d-flex justify-content-between align-items-center'

    var span = document.createElement('span');
    span.appendChild(document.createTextNode(files[i].name));
    li.appendChild(span);

    var button = document.createElement('button');
    button.addEventListener('click', function(ev){
      removeFile(ev.target.parentElement);
    });
    button.className = 'btn btn-danger btn-sm'
    button.appendChild(document.createTextNode('X'));
    button.setAttribute('type', 'button');
    li.appendChild(button);


    var elemNumber = filesForUp.length+i;
    li.setAttribute('index', elemNumber);
    ul.appendChild(li);
    filesForUp.push(files[i])
  }
  updateCounter();
}

function updateCounter(){
  var counter = document.getElementById('counter');
  counter.innerText = ''+filesForUp.length+'/'+maxFiles;
}

+ function($) {
  'use strict';

  var dropZone = document.getElementById('drop-zone');

  dropZone.ondrop = function(e) {
    e.stopPropagation();
    e.preventDefault();
    this.className = 'col-11  upload-drop-zone';
    $('#label-drop')[0].className = 'col-auto';
    addFiles(e.dataTransfer.files)
  }

  dropZone.ondragover = preventDrag;

  dropZone.ondragleave = function(e) {
    e.stopPropagation();
    e.preventDefault();
    this.className = 'col-11 upload-drop-zone';
    $('#label-drop')[0].className = 'col-auto';
    return false;
  }

  dropZone.ondragenter = preventDrag;

  dropZone.ondragstart = preventDrag;
}(jQuery);

function preventDrag(e){
  e.stopPropagation();
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  this.className = 'col-11 upload-drop-zone drop';

  $('#label-drop')[0].className = 'col-auto label-blue';
  return false;
}

+ function($) {
  'use strict';

  var dropMain = document.getElementById('drop-main');

  dropMain.ondrop = function(e) {
    e.stopPropagation();
    e.preventDefault();
    if(document.getElementById('toggle-main-code').checked)
      return;
    this.className = 'col-9';
    addMain(e.dataTransfer.files[0])
  }

  dropMain.ondragover = preventDragMain;

  dropMain.ondragleave = function(e) {
    e.stopPropagation();
    e.preventDefault();
    if(document.getElementById('toggle-main-code').checked)
      return;
    this.className = 'col-9';
    return false;
  }

  dropMain.ondragenter = preventDragMain;

  dropMain.ondragstart = preventDragMain;
}(jQuery);

function preventDragMain(e){
  e.stopPropagation();
  e.preventDefault();
  if(document.getElementById('toggle-main-code').checked)
    return;
  e.dataTransfer.dropEffect = 'move';
  this.className = 'col-9 drop';
  return false;
}

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

$(document).ready(function () {

  $("#generate").click(function (e) {

    const hapi = $('textarea#hapi').val();

    const data = {
      hapi
    };

    post('generate', data).then(({ error, ...res }) => {
      if (error) {
        return alert(error);
      }

      $("textarea#yaml").val(res.yaml);
      genDot("actorsGraph", res.actors);
      genDot("resourcesGraph", res.resources);
      genDot("actionsGraph", res.actions);

      $("#matrix").load("output/main.html");

    });

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
    var mainFile = document.getElementById('customFile').files;
    addMain(mainFile[0]);
    console.log(mainFile[0]);
  });
});

function addMain(mainFile){
  dropMainArea = document.getElementById('drop-main');

  var span = document.createElement('span');
  span.appendChild(document.createTextNode(mainFile.name));
  dropMainArea.appendChild(span);
  
  var button = document.createElement('button');
  button.addEventListener('click', function(ev){
    removeMain(ev.target.parentElement);
  });
  button.className = 'btn btn-danger btn-sm'
  button.appendChild(document.createTextNode('X'));
  button.setAttribute('type', 'button'); // added line
  dropMainArea.appendChild(button);
}

function removeMain(){

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
    button.setAttribute('type', 'button'); // added line
    li.appendChild(button);
    
    
    var elemNumber = filesForUp.length+i;
    // li.setAttribute('id', 'file'+elemNumber); // added line
    li.setAttribute('index', elemNumber); // added line
    ul.appendChild(li);
    filesForUp.push(files[i])
  }
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
    this.className = 'col-9';
    addMain(e.dataTransfer.files[0])
  }

  dropMain.ondragover = preventDragMain;

  dropMain.ondragleave = function(e) {
    e.stopPropagation();
    e.preventDefault();
    this.className = 'col-9';
    return false;
  }
    
  dropMain.ondragenter = preventDragMain;

  dropMain.ondragstart = preventDragMain;
}(jQuery);

function preventDragMain(e){
  e.stopPropagation();
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  this.className = 'col-9 drop';
  return false;
}
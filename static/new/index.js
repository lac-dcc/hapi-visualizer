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

  $("#customFile").on('change', function() {
    var inputedFiles = document.getElementById('customFile').files;
    addFiles(inputedFiles.files);
  });
});

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
  var childrens = ul.children;
  for(i=0; i< childrens.length; i++){
    childrens[i].setAttribute('index', i)
  }

}

var filesForUp = [];
var maxFiles = 5;
function addFiles(files){
  var size = files.length;
  if(size + filesForUp > maxFiles){
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

  // UPLOAD CLASS DEFINITION
  // ======================

  var dropZone = document.getElementById('drop-zone');

  dropZone.ondrop = function(e) {
    // e.preventDefault();
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
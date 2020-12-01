const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const { exec } = require('child_process');
const fs = require('fs');
const formidable = require('formidable')

// const outputDir = "static/output";
const outputDir = "./static/output/";

const hapiFile = `${outputDir}/main.hp`;

// const program = "legalease/legalease.jar legalease/config.yaml";
// const program = `bin/hapi.jar ${hapiFile}`;
const program = `bin/hapi.jar`;

const resultHapiFile = `${outputDir}/main.yaml`;
const resultActorsFile = `${outputDir}/actors.dot`;
const resultResourcesFile = `${outputDir}/resources.dot`;
const resultActionsFile = `${outputDir}/actions.dot`;

const app = express();
const jsonParser = bodyParser.json()

app.use(express.static('static'));

// app.get('/', function (req, res) {
//   res.sendFile(path.join(__dirname + '/static/index.html'));
// });

app.post('/generate', jsonParser, function (req, res) {

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  const { hapi } = req.body;

  fs.writeFileSync(hapiFile, hapi);

  exec(`java -jar ${program}`,
    (error, stdout, stderr) => {

      if (error || stderr) {
        console.log('stderr: ' + stderr);
        res.json({ error: { msg: stderr, ...error } });
        return;
      }

      const resultHapi = fs.readFileSync(resultHapiFile, "utf8");
      const resultActors = fs.readFileSync(resultActorsFile, "utf8");
      const resultResources = fs.readFileSync(resultResourcesFile, "utf8");
      const resultActions = fs.readFileSync(resultActionsFile, "utf8");

      res.json({
        yaml: resultHapi,
        actors: resultActors,
        resources: resultResources,
        actions: resultActions,
        datamap: stdout
      });
    });

});

function moveFiles(files){
  if (Object.size(files) > 6){
    return;
  } else {
    var oldpath = '';
    var newpath = '';
    
    for(key in files){
      oldpath = files[key].path;
      newpath = files[key].name;
      fs.rename(oldpath, outputDir+newpath, function (err) {
        if (err) throw err;
      });
    }
  }
}

app.post('/new/generate', function(req, res, next){
  Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
  }; 

  var fs = require('fs');
  var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
      mainFileName = undefined;
      try{
        moveFiles(files);
        mainFile = files.main.name.substr(0, files.main.name.lastIndexOf("."));
      } catch (e){
        res.status(500);
        res.json({ error: { msg: 'Error at file moving' }});
      }
      // mainFile = outputDir+files.main.name;
      exec(`java -jar ${program} ${outputDir+mainFile}.hp`,
        (error, stdout, stderr) => {
        if (error || stderr) {
          // console.log('stderr: ' + stderr);
          res.status(500);
          res.json({ error: { msg: stderr, ...error } });
          return;
        }

        const resultHapi = fs.readFileSync(`${outputDir+mainFile}.yaml`, "utf8");
        const resultActors = fs.readFileSync(resultActorsFile, "utf8");
        const resultResources = fs.readFileSync(resultResourcesFile, "utf8");
        const resultActions = fs.readFileSync(resultActionsFile, "utf8");
        const resultMatrix = fs.readFileSync(`${outputDir+mainFile}.html`, "utf8");

        res.json({
          yaml: resultHapi,
          actors: resultActors,
          resources: resultResources,
          actions: resultActions,
          matrix: resultMatrix,
          datamap: stdout
        });
      });    
    });
});

app.listen(8080, () => {
  console.log("server running!");
});
var utilscripts = require('./utilscripts');
var path = require('path');
var fs = require('fs');

/*global __dirname */
var basePath = path.join(__dirname, '..');
var modules = utilscripts.findDuplicatedModules(path.join(basePath, 'buildOutput/app-packages/build-report.txt'));
var str = '';
for(var key in modules){
  var line = key + ':\n  ' + modules[key].join(',');
  str = str + '\n\n' + line;
}
if(str){
  console.log('build has duplicated modules. Please see report here: buildOutput/app-packages/duplicate-modules.txt');
  fs.writeFileSync(path.join(basePath, 'buildOutput/app-packages/duplicate-modules.txt'), str, 'utf-8');  
}

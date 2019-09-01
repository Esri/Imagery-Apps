var fs = require('fs');
var path = require('path');
var fse = require('fs-extra');
var utilscripts = require('./utilscripts');

/*global __dirname */
var basePath = path.join(__dirname, '..');
var appPackagePath, appOutputPath;
var options = {};

exports.copy = function(pathInfo, _options){
  setPath(pathInfo);
  options = _options || {};
  if(fs.existsSync(appOutputPath)){
    console.log('remove', appOutputPath);
    fse.removeSync(appOutputPath);
  }

  fse.mkdirsSync(appOutputPath);
  fs.mkdirSync(path.join(appOutputPath, 'jimu.js'));
  fs.mkdirSync(path.join(appOutputPath, 'arcgis-js-api'));

  utilscripts.copyPartAppSrc(basePath, appOutputPath);

  utilscripts.copyAppBuildPackages(appPackagePath, appOutputPath, options);

  utilscripts.docopy(path.join(appPackagePath, 'build-report.txt'), path.join(appOutputPath, 'build-report.txt'));
};

function setPath(pathInfo){
  if(pathInfo.appPackagePath){
    appPackagePath = pathInfo.appPackagePath;
  }else{
    appPackagePath = path.join(basePath, 'buildOutput/app-packages');
  }

  if(pathInfo.appOutputPath){
    appOutputPath = pathInfo.appOutputPath;
  }else{
    appOutputPath = path.join(basePath, 'buildOutput/app');
  }
}


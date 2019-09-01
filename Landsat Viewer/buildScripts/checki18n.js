var fs = require('fs');
var path = require('path');
var requirejs = require('requirejs');
var fse = require('fs-extra');

/*global __dirname */
var basePath = path.join(__dirname, '..');

function getAllErrors(){
  var errors = [].concat(getNlsError(path.join(basePath, 'jimu.js/nls'), 'main.js'));

  fs.readdirSync(path.join(basePath, 'widgets')).forEach(function(widgetName){
    errors = errors.concat(getNlsError(path.join(basePath, 'widgets', widgetName, 'nls'), 'strings.js'));

    errors = errors.concat(getNlsError(path.join(basePath, 'widgets', widgetName, 'setting/nls'), 'strings.js'));
  });

  fs.readdirSync(path.join(basePath, 'themes')).forEach(function(themeName){
    errors = errors.concat(getNlsError(path.join(basePath, 'themes', themeName, 'nls'), 'strings.js'));

    if(!fs.existsSync(path.join(basePath, 'themes', themeName, 'widgets'))){
      return;
    }
    fs.readdirSync(path.join(basePath, 'themes', themeName, 'widgets')).forEach(function(widgetName){
      errors = errors.concat(getNlsError(path.join(basePath, 'themes', themeName, 'widgets', widgetName, 'nls'), 'strings.js'));

      errors = errors.concat(getNlsError(path.join(basePath, 'themes', themeName, 'widgets', widgetName, 'setting/nls'), 'strings.js'));
    });
  });

  return errors;
}

exports.getAllErrors = getAllErrors;

exports.check = function(){
  var allErrors = getAllErrors();
  if(allErrors.length === 0){
    console.log('no error.');
  }else{
    console.log('find', allErrors.length ,'errors. Please see report: buildOutput/nls-check-error.txt.');
    fse.ensureDirSync(path.join(basePath, 'buildOutput'));
    fs.writeFileSync(path.join(basePath, 'buildOutput/nls-check-error.txt'), allErrors.join('\r\n'), 'utf-8');
  }
};

exports.flatObject = flatObject;
exports.getNlsError = getNlsError;

function getNlsError(folder, name){
  if(!fs.existsSync(path.join(folder, name))){
    return [];
  }

  var errors = [], defaultStrings;
  try{
    defaultStrings = requirejs(path.join(folder, name));
  }catch(err){
    errors.push('[' + path.join(folder, name).substr(basePath.length) + '] has syntax error.');
  }

  if(defaultStrings){
    var keys = [];
    flatObject(defaultStrings.root, keys);
    
    for(var p in defaultStrings){
      if(p === 'root' || !defaultStrings[p]){
        continue;
      }
      var localeFile = path.join(folder, p, name);
      if(!fs.existsSync(localeFile)){
        errors.push('[' + localeFile.substr(basePath.length) + '] not exists.');
        continue;
      }
      try{
        var localeStrings = requirejs(localeFile);
        keys.forEach(function(key){
          errors = errors.concat(checkLocaleKey(localeStrings, localeFile, key));
        });
      }catch(err){
        errors.push('[' + localeFile.substr(basePath.length) + '] has syntax error.');
      }
      
    }
  }
  return errors;
}

function flatObject(obj, keys, pkey){
  for(var key in obj){
    var _k = pkey? pkey + '.' + key: key;
    if(keys.indexOf(_k) < 0){
      keys.push(_k);
    }
    if(typeof obj[key] === 'object'){
      flatObject(obj[key], keys, pkey? pkey + '.' + key: key);
    }
  }
}

function checkLocaleKey(localeStrings, localeFile, key){
  var errors = [];
  if(localeStrings){
    var obj = localeStrings, subkey = '';
    key.split('.').forEach(function(keySeg){
      if(subkey === ''){
        subkey = keySeg;
      }else{
        subkey = subkey + '.' + keySeg;
      }
      if(subkey === key && obj && typeof obj[keySeg] === 'undefined'){
        var str = '[' + localeFile.substr(basePath.length) + '] does not have key: ' + subkey;
        errors.push(str);
      }
      if(obj){
        obj = obj[keySeg];
      }else{
        obj = undefined;
      }
    });
  }
  return errors;
}


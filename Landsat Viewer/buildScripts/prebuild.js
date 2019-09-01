var fs = require('fs');
var path = require('path');
var fse = require('fs-extra');
var vm = require('vm');
var utilscripts = require('./utilscripts');

/*global __dirname */
var basePath = path.join(__dirname, '..');

var appConfig, appConfigFile, rProfileFile, wProfileFile, profile;

function isTest(test, e, i, isThemeWidget, isOnscreen){
  switch(test){
  case 'onScreenOffPanelWidget':
    return !e.widgets && e.uri && e.visible !== false && !isThemeWidget &&
      !widgetIsInPanel(e.uri) && isOnscreen;
  case 'themeOffPanelWidget':
    return !e.widgets && e.uri && e.visible !== false && isThemeWidget &&
      !widgetIsInPanel(e.uri);
  case 'inPanelWidget':
    return !e.widgets && e.uri && e.visible !== false && !isThemeWidget &&
      widgetIsInPanel(e.uri);
  case 'offPanelWidget':
    return !e.widgets && e.uri && e.visible !== false && !widgetIsInPanel(e.uri);
  case 'themeWidget':
    return !e.widgets && e.uri && e.visible !== false && isThemeWidget;
  case 'widget':
    return !e.widgets && e.uri && e.visible !== false;
  }
}

exports.setInfo = function(info){
  if(info.appConfigFile){
    appConfigFile = info.appConfigFile;
  }else{
    appConfigFile = path.join(basePath, 'config.json');
  }

  appConfig = fse.readJsonSync(appConfigFile, 'utf-8');
  appConfig._buildInfo = {};

  rProfileFile = path.join(basePath, 'buildScripts/_app.profile.js');
  wProfileFile = path.join(basePath, 'buildScripts/app.profile.js');

  var profileStr = fs.readFileSync(rProfileFile, 'utf-8');
  profile = vm.runInThisContext(profileStr);
};

exports.prepare = function(){
  addBuildLayers();
  addBuildFiles();

  utilscripts.writeThemeResourceModule(basePath, appConfig);
  writeAllWidgetResourceModules();

  mergeAndWriteWidgetManifests();

  writeAppConfig();
  writeProfile();
};

function writeAppConfig(){
  var segs = appConfigFile.split(path.sep);
  segs.pop();
  var appConfigPath = segs.join(path.sep);
  fse.writeJsonSync(path.join(appConfigPath, '_build-generate_config.json'), appConfig, 'utf-8');
}

function writeProfile(){
  var profileStr = 'profile = ' + JSON.stringify(profile, null, 2) + ';';
  fs.writeFileSync(wProfileFile, profileStr, 'utf-8');
}

////////////////layers
function addBuildLayers(){
  var dynamicLayers = getAllWidgetsLayers();
  dynamicLayers.push(getThemeLayer());

  dynamicLayers.forEach(function(layer){
    profile.layers[layer.name] = {
      include: layer.include,
      exclude: layer.exclude
    };
  });

  var preloadLayers = getPreloadLayers();
  preloadLayers.forEach(function(layer){
    profile.layers['dynamic-modules/preload'].include.push(layer.name);
  });

  var postloadLayers = getPostLoadLayers();
  postloadLayers.forEach(function(layer){
    profile.layers['dynamic-modules/postload'].include.push(layer.name);
  });
}

function getPreloadLayers(){
  var layers = [];

  layers.push(getThemeLayer());
  //all off panel widget
  utilscripts.visitElement(appConfig, function(e, i, isThemeWidget, isOnscreen){
    if(!isTest('offPanelWidget', e, i, isThemeWidget, isOnscreen)){
      return;
    }
    var layer = {};
    layer.name = e.uri;
    layers.push(layer);
  });
  return layers;
}

function getPostLoadLayers(){
  var layers = [];

  //all in panel widget
  utilscripts.visitElement(appConfig, function(e, i, isThemeWidget, isOnscreen){
    if(!isTest('inPanelWidget', e, i, isThemeWidget, isOnscreen)){
      return;
    }
    var layer = {};
    layer.name = e.uri;
    layers.push(layer);
  });
  return layers;
}

function getThemeLayer(){
  var layer = {};
  layer.name = 'themes/' + appConfig.theme.name + '/main';
  layer.include = ['themes/' + appConfig.theme.name + '/_build-generate_module'];
  layer.exclude = ['jimu/main', 'libs/main', 'esri/main'];
  return layer;
}

function getAllWidgetsLayers(){
  var layers = [];
  utilscripts.visitElement(appConfig, function(e, i, isThemeWidget, isOnscreen){
    if(!isTest('widget', e, i, isThemeWidget, isOnscreen)){
      return;
    }
    var layer = {};
    layer.name = e.uri;
    layer.include = [utilscripts.getAmdFolderFromUri(e.uri) + '/_build-generate_module'];
    layer.exclude = ['jimu/main', 'libs/main', 'esri/main'];
    layers.push(layer);
  });
  return layers;
}

/////////////build files
function addBuildFiles(){
  if(!profile.files){
    profile.files = [];
  }

  profile.files.push(['./widgets/_build-generate_widgets-manifest.json', './widgets/widgets-manifest.json']);
  profile.files.push(['./_build-generate_config.json', './config.json']);
}

/////////////////widget module
function writeAllWidgetResourceModules(){
  utilscripts.visitElement(appConfig, function(e, i, isThemeWidget, isOnscreen){
    if(!isTest('widget', e, i, isThemeWidget, isOnscreen)){
      return;
    }
    utilscripts.writeWidgetResourceModule(basePath, e);
  });
}

//////////////////////widget manifest
function mergeAndWriteWidgetManifests(){
  var resultJson = {};

  utilscripts.visitElement(appConfig, function(e) {
    if (!e.uri) {
      return;
    }
    var segs = e.uri.split('/');
    segs.pop();
    var widgetFolder = segs.join('/');
    var manifestFile = path.join(basePath, widgetFolder, 'manifest.json');
    var manifestJson = fse.readJsonSync(manifestFile, 'utf-8');
    manifestJson.location = path.join(basePath, widgetFolder);
    manifestJson.category = 'widget';
    utilscripts.addI18NLabel(manifestJson);
    
    delete manifestJson.location;
    resultJson[e.uri] = manifestJson;
  });

  appConfig._buildInfo.widgetManifestsMerged = true;
  
  fse.writeJsonSync(path.join(basePath, 'widgets/_build-generate_widgets-manifest.json'),
    resultJson, 'utf-8');
}

function widgetIsInPanel(uri){
  var segs = uri.split('/');
  segs.pop();
  var folder = segs.join('/');
  var manifestFile = path.join(basePath, folder, 'manifest.json');
  if(fs.existsSync(manifestFile)){
    var manifest = fse.readJsonSync(manifestFile, 'utf-8');
    if(manifest.properties && manifest.properties.inPanel === false){
      return false;
    }else{
      return true;
    }
  }
  return true;
}
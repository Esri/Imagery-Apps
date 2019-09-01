///////////////////////////////////////////////////////////////////////////
// Copyright © 2014 Esri. All Rights Reserved.
//
// Licensed under the Apache License Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
///////////////////////////////////////////////////////////////////////////

define(function() {
  var mo = {};

  var widgetProperties = ['inPanel', 'hasLocale', 'hasStyle', 'hasConfig', 'hasUIFile',
  'hasSettingPage', 'hasSettingUIFile', 'hasSettingLocale', 'hasSettingStyle',
  'keepConfigAfterMapSwithched', 'isController', 'hasVersionManager', 'isThemeWidget'];

  mo.visitElement = visitElement;
  
  mo.getWidgetNameFromUri = getWidgetNameFromUri;

  mo.getAmdFolderFromUri = getAmdFolderFromUri;
  
  mo.widgetProperties = widgetProperties;

  mo.processWidgetProperties = processWidgetManifestProperties;

  //add default value for widget properties.
  function processWidgetManifestProperties(manifest){
    if (typeof manifest.properties.isController === 'undefined') {
      manifest.properties.isController = false;
    }
    if (typeof manifest.properties.isThemeWidget === 'undefined') {
      manifest.properties.isThemeWidget = false;
    }
    if (typeof manifest.properties.hasVersionManager === 'undefined') {
      manifest.properties.hasVersionManager = false;
    }

    widgetProperties.forEach(function(p) {
      if (typeof manifest.properties[p] === 'undefined') {
        manifest.properties[p] = true;
      }
    });
  }
  
  function visitElement(config, cb) {
    visitBigSection('widgetOnScreen', cb);
    visitBigSection('widgetPool', cb);

    function visitBigSection(section, cb){
      var i, j, isThemeWidget;
      if (config[section]) {
        if (config[section].groups) {
          for (i = 0; i < config[section].groups.length; i++) {
            cb(config[section].groups[i], i, false);
            for (j = 0; j < config[section].groups[i].widgets.length; j++) {
              isThemeWidget = config[section].groups[i].widgets[j].uri &&
                config[section].groups[i].widgets[j].uri
                .indexOf('themes/' + config.theme.name) > -1;
              cb(config[section].groups[i].widgets[j], j, isThemeWidget);
            }
          }
        }

        if (config[section].widgets) {
          for (i = 0; i < config[section].widgets.length; i++) {
            isThemeWidget = config[section].widgets[i].uri &&
                config[section].widgets[i].uri.indexOf('themes/' + config.theme.name) > -1;
            cb(config[section].widgets[i], i, isThemeWidget);
          }
        }
      }
    }
  }

  function getWidgetNameFromUri(uri) {
    var segs = uri.split('/');
    segs.pop();
    return segs.pop();
  }

  function getAmdFolderFromUri(uri){
    var segs = uri.split('/');
    segs.pop();
    return segs.join('/') + '/';
  }
  return mo;
});
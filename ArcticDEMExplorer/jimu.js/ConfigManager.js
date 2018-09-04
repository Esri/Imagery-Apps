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

define([
  'dojo/_base/declare',
  'dojo/_base/lang',
  'dojo/_base/array',
  'dojo/_base/kernel',
  'dojo/_base/config',
  'dojo/topic',
  'dojo/aspect',
  'dojo/i18n',
  'dojo/cookie',
  'dojo/Deferred',
  'dojo/promise/all',
  'dojo/request/xhr',
  'dojo/request/script',
  'require',
  './utils',
  './WidgetManager',
  './shared/AppVersionManager',
  './tokenUtils',
  './portalUtils',
  './portalUrlUtils',
  'esri/IdentityManager',
  'esri/config',
  'esri/tasks/GeometryService',
  'esri/urlUtils',
  'esri/request'
],
function (declare, lang, array, dojoKernel, dojoConfig, topic, aspect, i18n, cookie,
  Deferred, all, xhr, script, require, jimuUtils, WidgetManager, AppVersionManager, tokenUtils,
  portalUtils, portalUrlUtils, IdentityManager, esriConfig, GeometryService, esriUrlUtils) {
  var instance = null, clazz;
  /* global jimuConfig */

  clazz = declare(null, {
    urlParams: null,
    config: null,
    rawConfig: null,
    configFile: null,
    _configLoaded: false,
    portalSelf: null,

    constructor: function (urlParams) {
      this._removeHash(urlParams);
      this.urlParams = urlParams || {};
      this.listenBuilderEvents();
      this.isRunInPortal = false;
      this.versionManager = new AppVersionManager();
      this.widgetManager = WidgetManager.getInstance();

      if(this.urlParams.mode === 'config' && window.parent.setConfigViewerTopic &&
        lang.isFunction(window.parent.setConfigViewerTopic)){
        window.parent.setConfigViewerTopic(topic);
      }
      if(this.urlParams.mode === 'preview' && window.parent.setPreviewViewerTopic &&
        lang.isFunction(window.parent.setPreviewViewerTopic)){
        window.parent.setPreviewViewerTopic(topic);
      }
    },

    listenBuilderEvents: function(){
      //whatever(app, map, widget, widgetPoolChanged) config changed, publish this event.
      //*when app changed, the id is "app", the data is app's properties, like title, subtitle.
      //*when map changed, the id is "map", the data is itemId
      //*when widget that is in preloadwidget/widgetpool changed, the id is widget's id,
      //  the data is widget's setting
      //*when anything in the widget pool changed, the id is "widgetPool", the data is
      //  widgets and groups
      topic.subscribe('configChanged', lang.hitch(this, this.onConfigChanged));

      topic.subscribe('resetConfig', lang.hitch(this, this.onConfigReset));

      topic.subscribe('themeChanged', lang.hitch(this, this.onThemeChanged));
      //be published when layout in the same theme changed.
      topic.subscribe('layoutChanged', lang.hitch(this, this.onLayoutChanged));
      //be published when style in the same theme changed.
      topic.subscribe('styleChanged', lang.hitch(this, this.onStyleChanged));

      topic.subscribe('appConfigLoaded',lang.hitch(this, this._addDefaultGeometryService));

      topic.subscribe('appConfigChanged',lang.hitch(this, this._addDefaultGeometryService));
    },

    _tryLoadConfig: function() {
      if(this.urlParams.config) {
        this.configFile = this.urlParams.config;
        return xhr(this.configFile, {handleAs: 'json'});
      }else if(this.urlParams.id){
        //app is hosted in portal
        this.isRunInPortal = true;
        var portalUrl = portalUrlUtils.getPortalUrlFromLocation();
        var def = new Deferred();
        tokenUtils.setPortalUrl(portalUrl);
        //we don't process webtier in portal because portal has processed.
        var portal = portalUtils.getPortal(portalUrl);
        portal.loadSelfInfo().then(lang.hitch(this, function(portalSelf){
          this.portalSelf = portalSelf;
          this._processSignIn(portalUrl).then(lang.hitch(this, function(){
            //integrated in portal, open as a WAB app
            this._getAppConfigFromAppId(portalUrl, this.urlParams.id)
            .then(lang.hitch(this, function(appConfig){
              return this._processInPortalAppProtocol(appConfig);
            })).then(function(appConfig){
              def.resolve(appConfig);
            }, function(err){
              def.reject(err);
            });
          }));
        }));
        return def;
      } else{
        this.configFile = "config.json";
        return xhr(this.configFile, {handleAs: 'json'});
      }
    },

    _setPortalUrl: function(appConfig){
      if(appConfig.portalUrl){
        return;
      }
      //if there is no portalUrl in appConfig, try to check whether the app
      //is launched from XT version builder
      if(cookie('wab_portalurl')){
        appConfig.portalUrl = cookie('wab_portalurl');
        return;
      }

      //if not launched from XT builder and has no portalurl is set,
      //let's assume it's hosted in portal, use the browser location
      this.isRunInPortal = true;
      appConfig.portalUrl = portalUrlUtils.getPortalUrlFromLocation();
      return;
    },

    /****************************************************
    * The app accept the following URL parameters:
    * ?config=<abc-config.json>, this is a config file url
    * ?id=<123>, the id is WAB app id, which is created from portal.
          URL has this parameter means open WAB app from portal.
    * ?appid=<123>, the appid is portal/AGOL app id, which is created from portal/AGOL template.
          The template is created from WAB's app.
          When URL has this parameter, we'll check whether the app is launched
          in portal/AGOL, or not in portal/AGOL.
          > IF in portal, we'll use the appid to get portal/AGOL template id and app data,
          then get WAB app id, then get WAB app config, then merge config;
          > IF NOT in portal, we'll use the appid to get app data, then merge the data
          to WAB app config.
        How to check whether the app is in portal?
          When try to load config file, if URL has no config or id parameter, we'll load
          <app>/config.json file. If the app is in XT, the portalUrl in config.json is not empty.
          If the app is in portal/AGOL, the app is stemapp indeed, which portalUrl is empty.
          So, if portal url is empty, we consider the app is in portal. However, the exception is
          launch stemapp directly. The solution is the XT builder will write "wab_portalurl" cookie
          for stemapp. So, if we find this cookie, we know the app is not in portal.
    * ?webmap=<itemid>, this webmap item will override the itemid in app config
    * ?style=<black>, this style will override the default style in app config
    * ?mode=<config|preview>, this is for internal using purpose
    ********************************************************/
    loadConfig: function () {
      console.time('Load Config');
      if(this.urlParams.mode === 'preview'){
        //in preview mode, the config is set by the builder.
        return;
      }
      
      var def = this._tryLoadConfig(), configDef = new Deferred();

      def.then(lang.hitch(this, function(appConfig) {
        var err = this.checkConfig(appConfig);
        if (err) {
          topic.publish("appConfigLoadError", err);
          // this.showError(err);
          console.error(err);
          configDef.reject(err);
          return;
        }
        this.rawConfig = lang.clone(appConfig);
        appConfig = this._upgradeAppConfig(appConfig);
        this.postProcess(appConfig);
        this.config = appConfig;

        if(this.urlParams.id){
          this._loadWidgetsManifest(appConfig).then(lang.hitch(this, function() {
            return this._upgradeAllWidgetsConfig(appConfig);
          })).then(lang.hitch(this, function() {
            this._configLoaded = true;
            if(appConfig.title){
              document.title = appConfig.title;
            }
            console.timeEnd('Load Config');
            topic.publish("appConfigLoaded", this.getConfig());
            configDef.resolve(this.getConfig());
          }));
        }else{
          tokenUtils.setPortalUrl(appConfig.portalUrl);
          this._proesssWebTierAndSignin(appConfig).then(lang.hitch(this, function() {
            var def;
            if(this.urlParams.appid){
              //url has appid parameter means open app as an app created from AGOL template
              
              if(!this.isRunInPortal){
                def = new Deferred();
                this._processNotInPortalAppProtocol(appConfig).
                then(lang.hitch(this, function(appConfig){
                  this._getAppDataFromTemplateAppId(appConfig.portalUrl, this.urlParams.appid).
                  then(lang.hitch(this, function(itemData){
                    appConfig._itemData = itemData;
                    def.resolve(appConfig);
                  }));
                }));
                return def;
              }else{
                return this._getAppConfigFromTemplateAppId(appConfig.portalUrl,
                this.urlParams.appid).then(lang.hitch(this, function(appConfig){
                  return this._processInPortalAppProtocol(appConfig);
                }));
              }
            }else{
              def = this._processNotInPortalAppProtocol(appConfig);
              return def;
            }
          })).then(lang.hitch(this, function(appConfig) {
            this.postProcess(appConfig);
            this.config = appConfig;
            var def = new Deferred();
            if(appConfig.map.itemId){
              def.resolve(appConfig);
              return def;
            }else{
              portalUtils.getDefaultWebMap(appConfig.portalUrl).then(function(itemId){
                appConfig.map.itemId = itemId;
                def.resolve(appConfig);
              });
            }
            return def;
          })).then(lang.hitch(this, function(appConfig) {
            return this._loadWidgetsManifest(appConfig);
          })).then(lang.hitch(this, function(appConfig) {
            //if opened from template, the appConfig will have one property:_itemData
            if(appConfig._itemData){
              appConfig.getConfigElementById = function(id){
                return getConfigElementById(appConfig, id);
              };
              return this._mergeTemplateAppConfigToAppConfig(appConfig._itemData, appConfig);
            } else {
              var def = new Deferred();
              def.resolve(appConfig);
              return def;
            }
          })).then(lang.hitch(this, function() {
            return this._upgradeAllWidgetsConfig(appConfig);
          })).then(lang.hitch(this, function() {
            this._configLoaded = true;
            if(appConfig.title){
              document.title = appConfig.title;
            }
            console.timeEnd('Load Config');
            topic.publish("appConfigLoaded", this.getConfig());
            configDef.resolve(this.getConfig());
          }));
        }
      }), lang.hitch(this, function(err) {
        console.error(err);
        configDef.reject(err);
      }));
        
      return configDef;
    },

    _upgradeAppConfig: function(appConfig){
      var appVersion = window.wabVersion;
      var configVersion = appConfig.wabVersion;
      var newConfig;

      if(appVersion === configVersion){
        return appConfig;
      }
      var configVersionIndex = this.versionManager.getVersionIndex(configVersion);
      var appVersionIndex = this.versionManager.getVersionIndex(appVersion);
      if(configVersionIndex > appVersionIndex){
        throw Error('Bad version number, ' + configVersion);
      }else{
        newConfig = this.versionManager.upgrade(appConfig, configVersion, appVersion);
        newConfig.wabVersion = appVersion;
        newConfig.isUpgraded = true;
        return newConfig;
      }
    },

    _upgradeAllWidgetsConfig: function(appConfig){
      var def = new Deferred(), defs = [];
      if(!appConfig.isUpgraded){
        //app is latest, all widgets are lastest.
        def.resolve(appConfig);
        return def;
      }

      delete appConfig.isUpgraded;
      visitElement(appConfig, lang.hitch(this, function(e){
        if(!e.uri){
          return;
        }
        if(e.config){
          //if widget is configured, let's upgrade it
          var upgradeDef = this.widgetManager.tryLoadWidgetConfig(e)
          .then(lang.hitch(this, function(widgetConfig){
            e.config = widgetConfig;
          }));
          defs.push(upgradeDef);
        }else{
          e.version = e.manifest.version;
        }
      }));
      all(defs).then(lang.hitch(this, function(){
        def.resolve(appConfig);
      }), function(err){
        def.reject(err);
      });
      return def;
    },

    _changePortalUrlProtocol: function(appConfig, protocol){
      //if browser uses https protocol, portalUrl should also use https
      appConfig.portalUrl = portalUrlUtils.setProtocol(appConfig.portalUrl, protocol);

      if(appConfig.map.portalUrl){
        appConfig.map.portalUrl = portalUrlUtils.setProtocol(appConfig.map.portalUrl, protocol);
      }

      if(appConfig.httpProxy){
        var httpProxyUrl = appConfig.httpProxy.url;

        appConfig.httpProxy.url = portalUrlUtils.setProtocol(httpProxyUrl, protocol);

        if(appConfig.httpProxy && appConfig.httpProxy.rules){
          array.forEach(appConfig.httpProxy.rules, lang.hitch(this, function(rule){
            rule.proxyUrl = portalUrlUtils.setProtocol(rule.proxyUrl, protocol);
          }));
        }
      }
    },

    _processInPortalAppProtocol: function(appConfig){
      var def = new Deferred();
      var portalUrl = appConfig.portalUrl;
      var portal = portalUtils.getPortal(portalUrl);
      var sharingUrl = portalUrlUtils.getSharingUrl(portalUrl);

      //for hosted app, we need to check allSSL property
      var handleAllSSL = lang.hitch(this, function(allSSL){
        if(window.location.protocol === 'https:'){
          this._changePortalUrlProtocol(appConfig, 'https');
        }else{
          if(allSSL){
            //keep the protocol of browser honor allSSL property
            window.location.protocol = 'https:';
            def.reject();
            return;
          }else{
            this._changePortalUrlProtocol(appConfig, 'http');
          }
        }
        this._checkLocale();
        def.resolve(appConfig);
      });
      
      //we have called checkSignInStatus in _processSignIn before come here
      portal.loadSelfInfo().then(lang.hitch(this, function(portalSelf){
        //we need to check anonymous property for orgnization first,
        if(portalSelf.access === 'private'){
          //Don't allow anonymous access to portal.
          
          if(portalUrlUtils.isArcGIScom(window.location.href)){
            //for www.arcgis.com, we should not force user to sign in,
            //we just check protocol of portalUrl in appConfig as allSSL
            var isPortalHttps = appConfig.portalUrl.toLowerCase().indexOf('https://') === 0;
            handleAllSSL(isPortalHttps);
          }
          else{
            //user must sign in no matter the app is public or not
            IdentityManager.getCredential(sharingUrl).then(lang.hitch(this, function(){
              //after sign in, re-request portal self info with token to get allSSL
              portal.loadSelfInfo().then(lang.hitch(this, function(portalSelf){
                handleAllSSL(portalSelf.allSSL);
              }), lang.hitch(this, function(err){
                def.reject(err);
              }));
            }), lang.hitch(this, function(err){
              def.reject(err);
            }));
          }
        }
        else{
          //Allow anonymous access to portal.
          handleAllSSL(portalSelf.allSSL);
        }
      }), lang.hitch(this, function(err){
        def.reject(err);
      }));
      return def;
    },

    _processNotInPortalAppProtocol: function(appConfig){
      var def = new Deferred();
      if(appConfig.portalUrl){
        var portal = portalUtils.getPortal(appConfig.portalUrl);
        portal.loadSelfInfo().then(lang.hitch(this, function(portalSelf){
          var isBrowserHttps = window.location.protocol === 'https:';
          var allSSL = !!portalSelf.allSSL;
          if(allSSL || isBrowserHttps){
            this._changePortalUrlProtocol(appConfig, 'https');
          }

          var isPortalHttps = appConfig.portalUrl.toLowerCase().indexOf('https://') === 0;
          if(isPortalHttps && !isBrowserHttps){
            //for app in configWindow and previewWindow, we should not refresh url because there is
            //a DOMException if protocol of iframe is not same as protocol of builder window
            //such as:Blocked a frame with origin "https://***" from accessing a cross-origin frame.
            if(!tokenUtils.isInConfigOrPreviewWindow()){
              //if portal uses https protocol, the browser must use https too
              window.location.protocol = "https:";
              def.reject();
              return;
            }
          }
          def.resolve(appConfig);
        }), lang.hitch(this, function(err){
          def.reject(err);
        }));
      }
      else{
        def.resolve(appConfig);
      }
      return def;
    },

    //this function will be not called if app is in portal.
    _proesssWebTierAndSignin: function(appConfig){
      var def = new Deferred();
      var isWebTier = false;
      var portalUrl = appConfig.portalUrl;
      this._processWebTier(appConfig).then(lang.hitch(this, function(webTier){
        isWebTier = webTier;
        var portal = portalUtils.getPortal(portalUrl);
        return portal.loadSelfInfo();
      })).then(lang.hitch(this, function(portalSelf) {
        this.portalSelf = portalSelf;
        return this._processSignIn(portalUrl, isWebTier);
      })).then(lang.hitch(this, function() {
        def.resolve();
      }), function(err){
        def.reject(err);
      });
      return def;
    },

    _processWebTier: function(appConfig){
      var def = new Deferred();
      var portalUrl = appConfig.portalUrl;
      if(appConfig.isWebTier){
        //Although it is recommended to enable ssl for IWA/PKI portal by Esri,
        //there is no force on the client. They still can use http for IWA/PKI.
        //It is not correnct to assume web-tier authorization only works with https.
        tokenUtils.isWebTierPortal(portalUrl).then(lang.hitch(this, function(isWebTier) {
          var credential = tokenUtils.getPortalCredential(portalUrl);
          if(credential.ssl){
            //if credential.ssl, it means that the protal is allSSL enabled
            if(window.location.protocol === 'http:' && !tokenUtils.isInConfigOrPreviewWindow()){
              window.location.protocol = 'https:';
              return;
            }
          }
          def.resolve(isWebTier);
        }), lang.hitch(this, function(err) {
          def.reject(err);
        }));
      }else{
        def.resolve(false);
      }
      return def;
    },

    _processSignIn: function(portalUrl, isWebTier){
      var def = new Deferred();
      var portal = portalUtils.getPortal(portalUrl);
      var sharingUrl = portalUrlUtils.getSharingUrl(portalUrl);
      var defSignIn;

      if(this.isRunInPortal){
        //we don't register oauth info for app run in portal.
        defSignIn = IdentityManager.checkSignInStatus(sharingUrl);
        defSignIn.promise.always(lang.hitch(this, function(){
          def.resolve();
        }));
      }else{
        if (!tokenUtils.isInBuilderWindow() && !tokenUtils.isInConfigOrPreviewWindow() &&
          this.portalSelf.supportsOAuth && this.rawConfig.appId && !isWebTier) {
          tokenUtils.registerOAuthInfo(portalUrl, this.rawConfig.appId);
        }
        //we call checkSignInStatus here because this is the first place where we can get portal url
        defSignIn = IdentityManager.checkSignInStatus(sharingUrl);
        defSignIn.promise.always(lang.hitch(this, function(){
          tokenUtils.xtGetCredentialFromCookie(portalUrl);
          //call portal self again because the first call is not sign in,
          //this call maybe have signed in.
          portal.loadSelfInfo().then(lang.hitch(this, function(portalSelf) {
            this.portalSelf = portalSelf;
            this._checkLocale();
            def.resolve();
          }));
        }));
      }
      return def;
    },

    onThemeChanged: function(theme){
      this._getAppConfigFromTheme(theme).then(lang.hitch(this, function(config){
        this.config = config;
        topic.publish('appConfigChanged', this.getConfig(), 'themeChange');
      }));
    },

    onLayoutChanged: function(layout){
      //summary:
      //    layouts in the same theme should have the same:
      //      1. count of preload widgets, count of widgetOnScreen groups
      //        (if not same, we just ignore the others)
      //      2. app properties (if not same, we just ignore the new layout properties)
      //      3. map config (if not same, we just ignore the new layout properties)
      //    can only have these differrences:
      //      1. panel, 2. position, 3, predefined widgets
      var layoutConfig = layout.layoutConfig;
      var layoutConfigScreenSection = layoutConfig.widgetOnScreen;
      var thisConfigScreenSection = this.config.widgetOnScreen;
      if(layoutConfigScreenSection){
        //copy preload widget panel
        if(layoutConfigScreenSection.panel && layoutConfigScreenSection.panel.uri){
          thisConfigScreenSection.panel.uri = layoutConfigScreenSection.panel.uri;
        }
        
        //copy preload widget position
        array.forEach(layoutConfigScreenSection.widgets, function(widget, i){
          if(thisConfigScreenSection.widgets[i] && layoutConfigScreenSection.widgets[i]){
            if(layoutConfigScreenSection.widgets[i].position){
              thisConfigScreenSection.widgets[i].position =
              layoutConfigScreenSection.widgets[i].position;
            }
            if(layoutConfigScreenSection.widgets[i].positionRelativeTo){
              thisConfigScreenSection.widgets[i].positionRelativeTo =
              layoutConfigScreenSection.widgets[i].positionRelativeTo;
            }

            thisConfigScreenSection.widgets[i].panel = {
              uri: thisConfigScreenSection.panel.uri,
              position: thisConfigScreenSection.widgets[i].position,
              positionRelativeTo: thisConfigScreenSection.widgets[i].positionRelativeTo
            };
          }
        }, this);
        //copy preload group panel
        array.forEach(layoutConfigScreenSection.groups, function(group, i){
          if(thisConfigScreenSection.groups[i] && layoutConfigScreenSection.groups[i] &&
            layoutConfigScreenSection.groups[i].panel){
            thisConfigScreenSection.groups[i].panel = layoutConfigScreenSection.groups[i].panel;
          }
        }, this);
      }
      
      if(layoutConfig.map){
        //copy map position
        this.config.map.position = layoutConfig.map.position;
      }

      if(layoutConfig.widgetPool){
        //copy pool widget panel
        if(layoutConfig.widgetPool.panel){
          this.config.widgetPool.panel = layoutConfig.widgetPool.panel;
        }
        //copy pool group panel
        array.forEach(layoutConfig.widgetPool.groups, function(group, i){
          if(this.config.widgetPool.groups[i] && layoutConfig.widgetPool.groups[i] &&
            layoutConfig.widgetPool.groups[i].panel){
            this.config.widgetPool.groups[i].panel = layoutConfig.widgetPool.groups[i].panel;
          }
        }, this);
      }
      
      topic.publish('appConfigChanged', this.getConfig(), 'layoutChange');
    },

    onStyleChanged: function(style){
      this.config.theme.styles = this._genStyles(this.config.theme.styles, style.name);
      topic.publish('appConfigChanged', this.getConfig(), 'styleChange');
    },

    _getAppConfigFromTemplateAppId: function(portalUrl, appId){
      //the appid means: the app created by AGOL template.
      var def = new Deferred();
      this._getWabAppIdAndDataFromTemplateAppId(portalUrl, appId).
      then(lang.hitch(this, function(response){
        var wabAppId = response.appId;
        var itemData = response.itemData;

        this._getAppConfigFromAppId(portalUrl, wabAppId).then(function(appConfig){
          appConfig._itemData = itemData;
          def.resolve(appConfig);
        });
      }));
      return def;
    },

    _getAppDataFromTemplateAppId: function(portalUrl, appId){
      //the appid means: the app created by AGOL template.      
      var portal = portalUtils.getPortal(portalUrl);
      return portal.getItemData(appId);
    },

    _getWabAppIdAndDataFromTemplateAppId: function(portalUrl, appId){
      //the appid means: the app created by AGOL template.
      var def = new Deferred();
      var portal = portalUtils.getPortal(portalUrl);
      portal.getItemData(appId).then(lang.hitch(this, function(itemData) {
      //itemData.source means template id
        portal.getItemById(itemData.source).then(lang.hitch(this, function(item) {
          var urlObject = esriUrlUtils.urlToObject(item.url);
          def.resolve({
            appId: urlObject.query.id,
            itemData: itemData
          });
        }));
      }), function(err){
        def.reject(err);
      });
      return def;
    },

    _getAppConfigFromAppId: function(portalUrl, appId){
      //the appid means: the app created by app builder.
      return portalUtils.getPortal(portalUrl).getItemData(appId);
    },

    _mergeTemplateAppConfigToAppConfig: function(itemData, _appConfig){
      //url has appid parameter means open app in AGOL's template config page
      //merge the AGOL's template config parameters into the config.json
      var i;
      var screenSectionConfig = _appConfig.widgetOnScreen;
      var portalUrl = _appConfig.portalUrl;
      _appConfig.agolConfig = itemData;
      _appConfig.map.itemId = itemData.values.webmap;
      _appConfig.map.portalUrl = portalUrl;

      function reorderWidgets(widgetArray) {
        var tempWidgets = [];
        array.forEach(widgetArray, function(widget) {
          if (widget) {
            tempWidgets.push(widget);
          }
        }, this);
        return tempWidgets;
      }

      var title = null, subtitle = null;
      for (var key in itemData.values) {
        if (key !== "webmap") {
          jimuUtils.setConfigByTemplateWithId(_appConfig, key, itemData.values[key]);
        }
        if (key === "app_title") {
          title = itemData.values[key];
        }
        if (key === "app_subtitle") {
          subtitle = itemData.values[key];
        }
      }

      var defRet = new Deferred();
      if (!title || !subtitle) {
        var portal = portalUtils.getPortal(portalUrl);
        portal.getItemById(itemData.values.webmap).then(lang.hitch(this, function(item){
          // merge title
          if (!title) {
            _appConfig.title = item.title;
          }
          // subtitle
          if (!subtitle) {
            _appConfig.subtitle = item.snippet;
          }
          reorder();
          defRet.resolve();
        }));
      } else {
        reorder();
        defRet.resolve();
      }

      function reorder() {
        //reorderWidgets 
        _appConfig.widgetPool.widgets = reorderWidgets(_appConfig.widgetPool.widgets);
        screenSectionConfig.widgets = reorderWidgets(screenSectionConfig.widgets);
        if (_appConfig.widgetPool.groups) {
          for (i = 0; i < _appConfig.widgetPool.groups.length; i++) {
            _appConfig.widgetPool.groups[i].widgets =
            reorderWidgets(_appConfig.widgetPool.groups[i].widgets);
          }
        }
        if (screenSectionConfig.groups) {
          for (i = 0; i < screenSectionConfig.groups.length; i++) {
            screenSectionConfig.groups[i].widgets =
            reorderWidgets(screenSectionConfig.groups[i].widgets);
          }
        }
      }
      return defRet;

    },

    _removeHash: function(urlParams){
      for(var p in urlParams){
        if(urlParams[p]){
          urlParams[p] = urlParams[p].replace('#', '');
        }
      }
    },

    _genStyles: function(allStyle, currentStyle){
      var styles = [];
      styles.push(currentStyle);
      array.forEach(allStyle, function(_style){
        if(styles.indexOf(_style) < 0){
          styles.push(_style);
        }
      });
      return styles;
    },

    /**************************************
    Keep the following same between themes:
    1. map config excluding map's position
    2. widget pool config excluding pool panel config
    ***************************************/
    _getAppConfigFromTheme: function(theme){
      var def = new Deferred();
      var config, styles = [];
      var currentConfig = this.getConfig().getCleanConfig();
      //because we don't allow user config panel for group,
      //and group's panel should be different between differrent theme
      //so, we delete group panel
      array.forEach(currentConfig.widgetPool.groups, function(group){
        delete group.panel;
      }, this);
      //theme has already appConfig object, use it but keep something
      if(theme.appConfig){
        config = lang.clone(theme.appConfig);
        config.map = currentConfig.map;
        config.map.position = theme.appConfig.map.position;
        if(currentConfig.widgetPool.widgets){
          config.widgetPool.widgets = currentConfig.widgetPool.widgets;
        }
        if(currentConfig.widgetPool.groups){
          config.widgetPool.groups = currentConfig.widgetPool.groups;
        }
        if (currentConfig.links){
          config.links = currentConfig.links;
        }
      }else{
        //use layout and style to create a new appConfig, which may contain some place holders
        var layout = theme.getCurrentLayout();
        var style = theme.getCurrentStyle();

        config = lang.clone(currentConfig);
        
        config.widgetOnScreen = layout.layoutConfig.widgetOnScreen;
        if(layout.layoutConfig.widgetPool && layout.layoutConfig.widgetPool.panel){
          config.widgetPool.panel = layout.layoutConfig.widgetPool.panel;
        }
        if(layout.layoutConfig.map && layout.layoutConfig.map.position){
          config.map.position = layout.layoutConfig.map.position;
        }

        //put all styles into the style array, and the current style is the first element
        styles = this._genStyles(array.map(theme.getStyles(), function(style){
          return style.name;
        }), style.name);
        config.theme = {
          name: theme.getName(),
          styles: styles,
          version: theme.getVersion()
        };
      }
      
      this.processUrlParams(config);
      this._addNeedValues(config);
      this._loadWidgetsManifest(config).then(function(){
        def.resolve(config);
      });
      return def;
    },

    getConfig: function () {
      var c = lang.clone(this.config);

      c.rawConfig = this.rawConfig;
      c.getConfigElementById = function(id){
        return getConfigElementById(this, id);
      };

      c.processNoUriWidgets = function(){
        processNoUriWidgets(this);
      };

      c.addElementId = function(){
        addElementId(this);
      };

      c.getCleanConfig = function(){
        return getCleanConfig(this);
      };

      c.visitElement = function(cb){
        visitElement(this, cb);
      };
      return c;
    },

    onConfigReset: function(c){
      //summary:
      //  this method may be called by builder or UT
      c = jimuUtils.reCreateObject(c);

      this._processProxy(c);

      if(this.config){
        //delete initial extent when change map
        if(c.map.itemId && c.map.itemId !== this.config.map.itemId){
          if(c.map.mapOptions){
            delete c.map.mapOptions.extent;
          }
        }
        this.config = c;
        topic.publish('appConfigChanged', this.getConfig(), 'resetConfig', c);
      }else{
        this.config = c;
        topic.publish("appConfigLoaded", this.getConfig());
      }
    },

    _addNeedValues: function(config){
      processNoUriWidgets(config);
      addElementId(config);
      this.addDefaultValues(config);
    },

    postProcess: function(config){
      this._setPortalUrl(config);
      this.processUrlParams(config);
      this._addNeedValues(config);
      this._processProxy(config);

      IdentityManager.tokenValidity = 60 * 24 * 7;//token is valid in 7 days
      return config;
    },

    _processProxy: function(config){
      esriConfig.defaults.io.alwaysUseProxy = config.httpProxy &&
      config.httpProxy.useProxy && config.httpProxy.alwaysUseProxy;
      esriConfig.defaults.io.proxyUrl = "";
      esriConfig.defaults.io.proxyRules = [];

      if (config.httpProxy && config.httpProxy.useProxy && config.httpProxy.url) {
        esriConfig.defaults.io.proxyUrl = config.httpProxy.url;
      }
      if (config.httpProxy && config.httpProxy.useProxy && config.httpProxy.rules) {
        array.forEach(config.httpProxy.rules, function(rule) {
          esriUrlUtils.addProxyRule(rule);
        });
      }
    },

    _loadWidgetsManifest: function(config){
      var defs = [], def = new Deferred();
      if(config._buildInfo && config._buildInfo.widgetManifestsMerged){
        this._loadMergedWidgetManifests().then(lang.hitch(this, function(manifests){
          visitElement(config, lang.hitch(this, function(e){
            if(!e.widgets && e.uri){
              this._addNeedValuesForManifest(manifests[e.uri]);
              jimuUtils.addManifest2WidgetJson(e, manifests[e.uri]);
            }
          }));
          def.resolve(config);
        }));
      }else{
        visitElement(config, lang.hitch(this, function(e){
          if(!e.widgets && e.uri){
            defs.push(this.widgetManager.loadWidgetManifest(e));
          }
        }));
        all(defs).then(function(){
          def.resolve(config);
        }, function(){
          //we ignore this error because we don't want the individual widget error
          //block the whole loading progress
          def.resolve(config);
        });
      }

      setTimeout(function(){
        if(!def.isResolved()){
          def.resolve(config);
        }
      }, jimuConfig.timeout);
      return def;
    },

    _loadMergedWidgetManifests: function(){
      /*global path*/
      var file = path + 'widgets/widgets-manifest.json';
      return xhr(file, {
        handleAs: 'json'
      });
    },

    _addNeedValuesForManifest: function(manifest){
      jimuUtils.addManifestProperies(manifest);
      jimuUtils.processManifestLabel(manifest, dojoConfig.locale);
    },

    _addDefaultPortalUrl: function(config){
      if(typeof config.portalUrl === 'undefined'){
        config.portalUrl = 'http://www.arcgis.com/';
      }
      if(config.portalUrl && config.portalUrl.substr(config.portalUrl.length - 1) !== '/'){
        config.portalUrl += '/';
      }
    },

    _addDefaultGeometryService: function(appConfig){
      var geoServiceUrl = appConfig && appConfig.geometryService;
      var validGeoServiceUrl = geoServiceUrl && typeof geoServiceUrl === 'string' &&
      lang.trim(geoServiceUrl);
      if(validGeoServiceUrl){
        geoServiceUrl = lang.trim(geoServiceUrl);
      }
      else{
        geoServiceUrl = this.portalSelf.helperServices.geometry.url;
      }
      appConfig.geometryService = geoServiceUrl;
      esriConfig.defaults.geometryService = new GeometryService(appConfig.geometryService);
    },

    _checkLocale: function(){
      var appLocale;
      if(tokenUtils.isInConfigOrPreviewWindow()){
        appLocale = this.portalSelf.user && this.portalSelf.user.culture ||
          this.portalSelf.culture || dojoConfig.locale;
      }else{
        appLocale = this.portalSelf.user && this.portalSelf.user.culture ||
          dojoConfig.locale;
      }
      
      appLocale = appLocale.toLowerCase();

      if(jimuUtils.isLocaleChanged(dojoConfig.locale, appLocale)){
        cookie('wab_app_locale', appLocale);
        window.location.reload();
      }
    },

    _addDefaultStyle: function(config){
      if(config.theme){
        if(!config.theme.styles || config.theme.styles.length === 0){
          config.theme.styles = ['default'];
        }
      }
    },

    _addDefaultMap: function(config){
      config.map.id = 'map';

      if(typeof config.map['3D'] === 'undefined' && typeof config.map['2D'] === 'undefined'){
        config.map['2D'] = true;
      }

      if(typeof config.map.position === 'undefined'){
        config.map.position = {
          left: 0,
          right: 0,
          top: 0,
          bottom: 0
        };
      }

      if(typeof config.map.portalUrl === 'undefined'){
        config.map.portalUrl = config.portalUrl;
      }
    },

    _addDefaultVisible: function(config){
      visitElement(config, function(e){
        if(e.visible === undefined){
          e.visible = true;
        }
      });
    },

    _addDefaultPanelAndPosition: function(config){
      var i, j, screenSectionConfig = config.widgetOnScreen, poolSectionConfig = config.widgetPool;
      //panel
      if(typeof screenSectionConfig.panel === 'undefined' ||
        typeof screenSectionConfig.panel.uri === 'undefined'){
        screenSectionConfig.panel = {uri: 'jimu/PreloadWidgetIconPanel', positionRelativeTo: 'map'};
      }else if(typeof screenSectionConfig.panel.positionRelativeTo === 'undefined'){
        screenSectionConfig.panel.positionRelativeTo = 'map';
      }

      if(typeof poolSectionConfig.panel === 'undefined' ||
        typeof poolSectionConfig.panel.uri === 'undefined'){
        poolSectionConfig.panel = {uri: 'jimu/PreloadWidgetIconPanel', positionRelativeTo: 'map'};
      }else if(typeof poolSectionConfig.panel.positionRelativeTo === 'undefined'){
        poolSectionConfig.panel.positionRelativeTo = 'map';
      }

      if(screenSectionConfig.widgets){
        for(i = 0; i < screenSectionConfig.widgets.length; i++){
          if(!screenSectionConfig.widgets[i].position){
            screenSectionConfig.widgets[i].position = {
              left: 0,
              top: 0
            };
          }
          if(!screenSectionConfig.widgets[i].positionRelativeTo){
            screenSectionConfig.widgets[i].positionRelativeTo = 'map';
          }
          if(!screenSectionConfig.widgets[i].panel){
            screenSectionConfig.widgets[i].panel = lang.clone(screenSectionConfig.panel);
            screenSectionConfig.widgets[i].panel.position = screenSectionConfig.widgets[i].position;
            screenSectionConfig.widgets[i].panel.positionRelativeTo =
            screenSectionConfig.widgets[i].positionRelativeTo;
          }
        }
      }

      if(screenSectionConfig.groups){
        for(i = 0; i < screenSectionConfig.groups.length; i++){
          if(!screenSectionConfig.groups[i].position){
            screenSectionConfig.groups[i].position = {
              left: 0,
              top: 0
            };
          }
          
          if(!screenSectionConfig.groups[i].panel){
            screenSectionConfig.groups[i].panel = screenSectionConfig.panel;
          }

          for(j = 0; j < screenSectionConfig.groups[i].widgets.length; j++){
            screenSectionConfig.groups[i].widgets[j].panel = screenSectionConfig.groups[i].panel;
          }
        }
      }

      if(poolSectionConfig){
        if(poolSectionConfig.groups){
          for(i = 0; i < poolSectionConfig.groups.length; i++){
            if(!poolSectionConfig.groups[i].panel){
              poolSectionConfig.groups[i].panel = poolSectionConfig.panel;
            }else if(!poolSectionConfig.groups[i].panel.positionRelativeTo){
              poolSectionConfig.groups[i].panel.positionRelativeTo = 'map';
            }

            for(j = 0; j < poolSectionConfig.groups[i].widgets.length; j++){
              poolSectionConfig.groups[i].widgets[j].panel = poolSectionConfig.groups[i].panel;
            }
          }
        }
        
        if(poolSectionConfig.widgets){
          for(i = 0; i < poolSectionConfig.widgets.length; i++){
            if(!poolSectionConfig.widgets[i].panel){
              poolSectionConfig.widgets[i].panel = config.widgetPool.panel;
            }
          }
        }
      }
    },

    _addDefaultOfWidgetGroup: function(config){
      //group/widget labe, icon
      visitElement(config, lang.hitch(this, function(e, i, gid, isPreload){
        e.isPreload = isPreload;
        if(e.widgets){
          //it's group
          e.gid = e.id;
          if(e.widgets.length === 1){
            if(!e.label){
              e.label = e.widgets[0].label? e.widgets[0].label: 'Group';
            }
            if(!e.icon){
              if(e.widgets[0].uri){
                e.icon = this._getDefaultIconFromUri(e.widgets[0].uri);
              }else{
                e.icon = 'jimu.js/images/group_icon.png';
              }
            }
          }else{
            e.icon = e.icon? e.icon: 'jimu.js/images/group_icon.png';
            e.label = e.label? e.label: 'Group_' + i;
          }
        }else{
          e.gid = gid;
          if(e.uri){
            jimuUtils.processWidgetSetting(e);
          }
        }
      }));
    },

    _getDefaultIconFromUri: function(uri){
      var segs = uri.split('/');
      segs.pop();
     return segs.join('/') + '/images/icon.png?wab_dv=' + window.deployVersion;
    },

    addDefaultValues: function(config) {
      this._addDefaultPortalUrl(config);
      //comment out temporary
      //this._addDefaultGeometryService(config);
      this._addDefaultStyle(config);
      this._addDefaultMap(config);
      this._addDefaultVisible(config);

      //preload widgets
      if(typeof config.widgetOnScreen === 'undefined'){
        config.widgetOnScreen = {};
      }

      if(typeof config.widgetPool === 'undefined'){
        config.widgetPool = {};
      }

      this._addDefaultPanelAndPosition(config);
      this._addDefaultOfWidgetGroup(config);
      //if the first widget or first group doesn't have index property, we add it
      if(config.widgetPool.widgets && config.widgetPool.widgets.length > 0 &&
        config.widgetPool.widgets[0].index === undefined ||
        config.widgetPool.groups && config.widgetPool.groups.length > 0 &&
        config.widgetPool.groups[0].index === undefined){
        this._addIndexForWidgetPool(config);
      }
    },

    _addIndexForWidgetPool: function(config){
      //be default, widgets are in front
      var index = 0, i, j;
      if(config.widgetPool.widgets){
        for(i = 0; i < config.widgetPool.widgets.length; i++){
          config.widgetPool.widgets[i].index = index;
          index ++;
        }
      }

      if(config.widgetPool.groups){
        for(i = 0; i < config.widgetPool.groups.length; i++){
          config.widgetPool.groups[i].index = index;
          index ++;
          for(j = 0; j < config.widgetPool.groups[i].widgets.length; j++){
            config.widgetPool.groups[i].widgets[j].index = j;
          }
        }
      }
    },

    checkConfig: function(config){
      var repeatedId = this._getRepeatedId(config);
      if(repeatedId){
        return 'repeated id:' + repeatedId;
      }
      return null;
    },

    _getRepeatedId: function(config){
      var id = [], ret;
      visitElement(config, function(e){
        if(id.indexOf(e.id) > 0){
          ret = e.id;
          return true;
        }
        id.push(e.id);
      });
      return ret;
    },

    showError: function(err){
      var s = '<div class="jimu-error-code"><span>' + this.nls.errorCode + ':</span><span>' +
        err.response.status + '</span></div>' +
       '<div class="jimu-error-message"><span>' + this.nls.errorMessage + ':</span><span>' +
        err.message + '</span></div>' +
       '<div class="jimu-error-detail"><span>' + this.nls.errorDetail + ':</span><span>' +
        err.response.text + '<span></div>';
      document.body.innerHTML = s;
    },

    processUrlParams: function(config){
      if(this.urlParams.style){
        if(config.theme){
          if(config.theme.styles){
            config.theme.styles.splice(config.theme.styles.indexOf(this.urlParams.style), 1);
            config.theme.styles = [this.urlParams.style].concat(config.theme.styles);
          }else{
            config.theme.styles = [this.urlParams.style];
          }
        }
      }
      if(this.urlParams.webmap){
        config.map.itemId = this.urlParams.webmap;
      }
      if(this.urlParams.mode){
        config.mode = this.urlParams.mode;
      }
    },
      

    onConfigChanged: function(id, changedData, otherOptions){
      var oldConfig, reason;
      if(id === 'app'){
        lang.mixin(this.config, changedData);
        reason = 'attributeChange';

        this._processProxy(changedData);
      }else if(id === 'map'){
        if(changedData.itemId && changedData.itemId !== this.config.map.itemId){
          //delete initial extent when change map
          if(this.config.map.mapOptions && this.config.map.mapOptions.extent){
            delete this.config.map.mapOptions.extent;
          }
        }
        lang.mixin(this.config.map, changedData);
        reason = 'mapChange';
      }else if(id === 'widgetPool'){
        this.config.widgetPool.widgets = changedData.widgets;
        this.config.widgetPool.groups = changedData.groups;

        //TODO we support only one controller for now, so we don't do much here
        // this._processPoolChangeEvent(changedData, otherOptions);
        reason = 'widgetPoolChange';
      }else{
        oldConfig = getConfigElementById(this.config, id);
        //for now, we can add/update property only
        for(var p in changedData){
          oldConfig[p] = changedData[p];
        }
        if(oldConfig.widgets){
          reason = 'groupChange';
        }else{
          reason = 'widgetChange';
        }
      }
      this._addNeedValues(this.config);

      // transfer obj to another iframe may cause problems on IE8
      topic.publish('appConfigChanged', jimuUtils.reCreateObject(this.getConfig()),
        reason, changedData, otherOptions);
    },

    _processPoolChangeEvent: function(widgetPool, options){
      var controllerId = options.controllerId;
      var controllerSetting = getConfigElementById(controllerId);
      controllerSetting.controlledWidgets = array.map(widgetPool.widgets,
        function(widget){return widget.label;});
      controllerSetting.controlledGroups = array.map(widgetPool.groups,
        function(group){return group.label;});
    }

  });

  clazz.getInstance = function (urlParams) {
    if(instance === null) {
      instance = new clazz(urlParams);
    }else{
      instance.urlParams = urlParams;
    }
    return instance;
  };

  clazz.getConfig = function(){
    return clazz.getInstance().config;
  };

  //for debug
  window.getConfig = function(){
    return clazz.getInstance().config;
  };

  function visitElement(config, cb){
  //the cb signature: cb(element, index, groupId, isPreload), the groupId can be:
  //groupId, widgetOnScreen, widgetPool
    visitBigSection('widgetOnScreen', cb);
    visitBigSection('widgetPool', cb);

    function visitBigSection(section, cb){
      var i, j, sectionConfig = config[section], isPreload = (section === 'widgetOnScreen');
      if(!sectionConfig){
        return;
      }
      if(sectionConfig.groups){
        for(i = 0; i < sectionConfig.groups.length; i++){
          if(cb(sectionConfig.groups[i], i, sectionConfig.groups[i].id, isPreload)){
            break;
          }
          for(j = 0; j < sectionConfig.groups[i].widgets.length; j++){
            if(cb(sectionConfig.groups[i].widgets[j], j, sectionConfig.groups[i].id, isPreload)){
              break;
            }
          }
        }
      }

      if(sectionConfig.widgets){
        for(i = 0; i < sectionConfig.widgets.length; i++){
          if(cb(sectionConfig.widgets[i], i, section, isPreload)){
            break;
          }
        }
      }
    }
  }

  function getConfigElementById(config, id){
    var c;
    if(id === 'map'){
      return config.map;
    }
    visitElement(config, function(e){
      if(e.id === id){
        c = e;
        return true;
      }
    });
    return c;
  }

  function addElementId(config){
    var maxId = 0, i;

    visitElement(config, function(e){
      if(!e.id){
        return;
      }
      var li = e.id.lastIndexOf('_');
      if(li > -1){
        i = e.id.substr(li + 1);
        maxId = Math.max(maxId, i);
      }
    });

    visitElement(config, function(e){
      if(!e.id){
        maxId ++;
        e.id = e.uri? (e.uri + '_' + maxId): (''  + '_' + maxId);
      }
    });
  }

  function processNoUriWidgets(config){
    var i = 0;
    visitElement(config, function(e){
      if(!e.widgets && !e.uri){
        i ++;
        e.placeholderIndex = i;
      }
    });
  }

  function getCleanConfig(config){
    //delete the properties that framework add
    var newConfig = lang.clone(config);
    var properties = jimuUtils.widgetProperties;

    delete newConfig.mode;
    visitElement(newConfig, function(e, i, gid, isPreload){
      if(e.widgets){
        delete e.isPreload;
        delete e.gid;
        if(e.icon === 'jimu.js/images/group_icon.png'){
          delete e.icon;
        }
        delete e.openType;
        if(isPreload){
          if(e.panel && jimuUtils.isEqual(e.panel, newConfig.widgetOnScreen.panel)){
            delete e.panel;
          }
        }
        return;
      }

      if(e.icon && e.icon === e.amdFolder + 'images/icon.png'){
        delete e.icon;
      }

      delete e.panel;
      delete e.folderUrl;
      delete e.amdFolder;
      delete e.thumbnail;
      delete e.configFile;
      delete e.gid;
      delete e.isPreload;

      properties.forEach(function(p){
        delete e[p];
      });

      
      if(e.visible){
        delete e.visible;
      }
      delete e.manifest;
    });
    delete newConfig.rawConfig;
    //the _ssl property is added by esriRequest
    delete newConfig._ssl;
    //delete all of the methods
    delete newConfig.getConfigElementById;
    delete newConfig.processNoUriWidgets;
    delete newConfig.addElementId;
    delete newConfig.getCleanConfig;
    delete newConfig.visitElement;

    delete newConfig.agolConfig;
    delete newConfig._itemData;
    delete newConfig.oldWabVersion;

    return newConfig;
  }

  return clazz;
});

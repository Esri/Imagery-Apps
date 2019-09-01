define(['./BaseVersionManager'],
function(BaseVersionManager) {

  //app version manager manage config and framework version
  function AppWidgetManager(){
    this.versions = [{
      version: '1.0',

      description: 'The version embedded in portal 10.3 final.',

      upgrader: function(oldConfig){
        return oldConfig;
      },
      //if true, means widgets that depend on the last version can run in this version.
      //if not set, means true.
      compatible: true
    }, {
      version: '1.1',

      description: 'The version embedded in online3.6, and used in developer edition 1.0.',

      upgrader: function(oldConfig){
        if(oldConfig.widgetOnScreen && oldConfig.widgetOnScreen.panel &&
          oldConfig.widgetOnScreen.panel.uri === 'themes/FoldableTheme/panels/TitlePanel/Panel'){
          oldConfig.widgetOnScreen.panel.uri = 'jimu/PreloadWidgetIconPanel';
        }
        
        return oldConfig;
      },
      compatible: true
    }];

    this.isCompatible = function(_oldVersion, _newVersion){
      var oldVersionIndex = this.getVersionIndex(_oldVersion);
      var newVersionIndex = this.getVersionIndex(_newVersion);
      var i;
      for(i = oldVersionIndex + 1; i <= newVersionIndex; i++){
        if(this.versions[i].compatible === false){
          return false;
        }
      }
      return true;
    };
  }

  AppWidgetManager.prototype = new BaseVersionManager();
  AppWidgetManager.prototype.constructor = AppWidgetManager;
  return AppWidgetManager;
});
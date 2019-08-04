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

define(['dojo/_base/declare',
  'dojo/_base/lang',
  'dojo/_base/html',
  'dojo/dom-class',
  'jimu/BaseWidgetFrame',
  'dijit/Dialog', "dojo/dom-style"],
  function(declare, lang, html, domClass, BaseWidgetFrame, Dialog, domStyle){
  return declare([BaseWidgetFrame], {
    baseClass: 'jimu-widget-frame dialog-widget-frame',
    widgetConfig: null,
    widgetManager: null,
    panelManager: null,
    _dialog: null,

    postCreate: function(){
      this.inherited(arguments);

    },

    startup: function(){
      this.inherited(arguments);

      if(!this.widgetConfig) {
        console.error("widgetConfig does not exist.");
        return false;
      }

      this.domNode.style.width = this.widgetConfig.panel.position.width + "px";
      this.domNode.style.height = this.widgetConfig.panel.position.height + "px";
      
      var dialog = this._dialog = new Dialog({
        title: this.widgetConfig.label,
        content: this.domNode,
        
        id: this.widgetConfig.label
      });

      dialog.on('hide', lang.hitch(this, function(){
        if(this.widget){
          this.widgetManager.closeWidget(this.widget);
          this.panelManager.closePanel(this.parent);
        }
      }));

    },

    show: function(){
      this._dialog.show();
        domStyle.set(this._dialog.id,"left","160px");
                        domStyle.set(this._dialog.id,"top","75px");
     /* if(this.widgetConfig.panel.position.height != undefined)
        this._dialog.domNode.style.height = this.widgetConfig.panel.position.height+"px";*/
     /* if(this.widgetConfig.panel.position.left != undefined){
        this._dialog.domNode.style.right = "auto";
        this._dialog.domNode.style.left = this.widgetConfig.panel.position.left+"px";
        console.log(this._dialog.domNode.style.left);
      }
      if(this.widgetConfig.panel.position.top != undefined){
        this._dialog.domNode.style.top = this.widgetConfig.panel.position.bottom + "px";
        console.log( this._dialog.domNode.style.top);
      } else if(this.widgetConfig.panel.position.bottom != undefined){
        this._dialog.domNode.style.top = document.body.clientHeight - this._dialog.domNode.clientHeight - this.widgetConfig.panel.position.bottom + "px";
      }
      
      this._dialog.resize();*/

    },
    hide:function(){
      this._dialog.hide();
       domClass.remove(document.body, "no-dialog-overlay");

    }
  });
});
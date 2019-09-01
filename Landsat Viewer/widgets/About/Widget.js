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
    'dojo/on',
    'dojo/json',
    'dojo/query',
    'dojo/cookie',
    'dijit/_WidgetsInTemplateMixin',
    'jimu/BaseWidget',
    "dojo/_base/connect",
    "jimu/PanelManager",
    "dijit/registry",
    "esri/layers/MosaicRule",
      "dojo/dom-style",
  ],
  function(declare, lang, html, on, dojoJson, query, cookie, _WidgetsInTemplateMixin, BaseWidget, connect,PanelManager, registry, MosaicRule,domStyle) {
    var pm = PanelManager.getInstance();
      var clazz = declare([BaseWidget, _WidgetsInTemplateMixin], {
      baseClass: 'jimu-widget-about',
      // clasName: 'esri.widgets.About',

      _hasContent: null,
a:null,
      postCreate: function() {
          window.addEventListener("resize",lang.hitch(this,this.resizeAbout));
        this.inherited(arguments);
       // var pm1 = pm.getPanelById('_22_panel');
        //console.log(pm1);
       // domStyle.set( pm.getPanelById('_22_panel'),"height", 380);
        this._hasContent = this.config.about && this.config.about.aboutContent;
     
      //console.log(pm);
     //connect.publish("aboutstatus",[{status : "open"}]); 
         
},
/*onOpen : function()
{
    connect.publish("aboutstatus",[{status : "open"}]); 
},*/resizeAbout: function(){
     
     
  if(window.innerWidth < 620){
      domStyle.set("About","font-size","7px");
      domStyle.set("About","width","200px");
      domStyle.set("About","height","170px");
      document.getElementById("About").childNodes[3].style.height="100px";
  } else if(window.innerWidth < 850){
      domStyle.set("About","font-size","8px");
      domStyle.set("About","width","250px");
      domStyle.set("About","height","225px");
      document.getElementById("About").childNodes[3].style.height="175px";
  } else if(window.innerWidth < 1200){
      domStyle.set("About","font-size","9px");
      domStyle.set("About","width","280px");
      domStyle.set("About","height","250px");
      document.getElementById("About").childNodes[3].style.height="200px";
  } else {
      domStyle.set("About","font-size","12px");
      domStyle.set("About","width","430px");
      domStyle.set("About","height","380px");
      document.getElementById("About").childNodes[3].style.height="330px";
  } 
  if(registry.byId("About").open){
      domStyle.set("About","top","70px");
      domStyle.set("About","left","160px");
  }
},
      startup: function() {
        this.inherited(arguments);
        this.resizeAbout();
        this.resize();
      },

      resize: function() {
        this._resizeContentImg();
      },

      _resizeContentImg: function() {
        var customBox = html.getContentBox(this.customContentNode);

        if (this._hasContent) {
          html.empty(this.customContentNode);

          var aboutContent = html.toDom(this.config.about.aboutContent);
          // DocumentFragment or single node
          if (aboutContent.nodeType &&
            (aboutContent.nodeType === 11 || aboutContent.nodeType === 1)) {
            var contentImgs = query('img', aboutContent);
            if (contentImgs && contentImgs.length) {
              contentImgs.style({
                maxWidth: (customBox.w - 20) + 'px' // prevent x scroll
              });
            } else if (aboutContent.nodeName.toUpperCase() === 'IMG') {
              html.setStyle(aboutContent, 'maxWidth', (customBox.w - 20) + 'px');
            }
          }
          html.place(aboutContent, this.customContentNode);
         
        }
      }
      
    });
    return clazz;
  });
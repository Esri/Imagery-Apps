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
    'jimu/BaseWidget',
    "esri/dijit/HomeButton",
    "esri/geometry/Extent",
    'dojo/_base/html',
    'dojo/dom-construct',
    'dojo/topic',
    "esri/map"
  ],
  function(
    declare,
    lang,
    BaseWidget,
    HomeButton,
    Extent,
    html,
    domConstruct,
    topic) {
        
    var clazz = declare([BaseWidget], {

      name: 'HomeButton',
      baseClass: 'jimu-widget-homebutton',

      postCreate: function() {
        this.own(topic.subscribe("appConfigChanged", lang.hitch(this, this.onAppConfigChanged)));
      },

      startup: function() {
        this.inherited(arguments);
var extent1 = new esri.geometry.Extent(-4529070.309668285,-1601360.6373974876,9015980.510253938,5368929.977372406,new esri.SpatialReference({wkid:5936}));
        this.createHomeDijit({
          map: this.map,
          extent: extent1
        });
      },

      createHomeDijit: function(options) {
        this.homeDijit = new HomeButton(options, domConstruct.create("div"));
        html.place(this.homeDijit.domNode, this.domNode);
        this.homeDijit.startup();
      },

      onAppConfigChanged: function(appConfig, reason, changedData) {
        if (reason === "mapChange" && changedData &&
          changedData.mapOptions && changedData.mapOptions.extent) {
          var extent = new Extent({
                  "xmin": -4529070.309668285, "ymin": -1601360.6373974876, "xmax": 9015980.510253938, "ymax": 5368929.977372406,
                "spatialReference": {
                    "wkid": 5936,
                    "latestWkid": 5936
                }
            });
          this.homeDijit.set("extent", extent);
        }
      }
    });
    return clazz;
  });
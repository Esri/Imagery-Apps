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
    "dojo/dom-class",
    'esri/dijit/LayerList',
    "dojo/domReady!"
],
    function (declare, lang, html, on, dojoJson, query, cookie, _WidgetsInTemplateMixin, BaseWidget, connect, PanelManager, registry, MosaicRule, domStyle, domClass, LayerList) {
        var pm = PanelManager.getInstance();
        var clazz = declare([BaseWidget, _WidgetsInTemplateMixin], {
            baseClass: 'jimu-widget-layerlist',
            // clasName: 'esri.widgets.About',

            _hasContent: null,
            a: null,

            postCreate: function () {
                this.inherited(arguments);
                
                
            },

            startup: function () {
                this.inherited(arguments);
                this.map.on("layer-add", lang.hitch(this, function(layer) {
                    var layerArray = [];
                    for (var i in this.map._layers) {
                        if (i !== "graphicsLayer1" && i !== "map_graphics") {
                            layerArray.push({layer: this.map.getLayer(i)});
                        }
                    }
                    this.layerList.set("layers", layerArray);
                    this.layerList.refresh();
                }));

                this.map.on("layer-remove", lang.hitch(this, function(layer) {
                    var layerArray = [];
                    for (var i in this.map._layers) {
                        if (i !== "graphicsLayer1" && i !== "map_graphics") {
                            layerArray.push({layer: this.map.getLayer(i)});
                        }
                    }
                    this.layerList.set("layers", layerArray);
                    this.layerList.refresh();
                }))
            },

            onOpen: function () {
                if (!this.layerList) {
                    var layerArray = [];
                    for (var i=0; i<this.map.layerIds.length; i++) {
                        layerArray.push({layer: this.map.getLayer(this.map.layerIds[i])});
                    }       
                    this.layerList = new LayerList({
                        map: this.map,
                        layers: layerArray
                     }, "layerlist-holder");
                     this.layerList.startup();
                }
                var x = document.getElementsByClassName("icon-node");
                for (var i = 0; i < x.length; i++) {
                    if (i !== 2) {
                        if (domClass.contains(x[i], "jimu-state-selected")) {
                            x[i].click();
                        }
                    }
                }
                

            },

            resizeAbout: function () {
                
            },

            resize: function () {
                
            },

            _resizeContentImg: function () {
                
            }
        });
        return clazz;
    });
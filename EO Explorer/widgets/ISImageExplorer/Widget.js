/*
 | Copyright 2018 Esri. All Rights Reserved.
 |
 | Licensed under the Apache License, Version 2.0 (the "License");
 | you may not use this file except in compliance with the License.
 | You may obtain a copy of the License at
 |
 |    http://www.apache.org/licenses/LICENSE-2.0
 |
 | Unless required by applicable law or agreed to in writing, software
 | distributed under the License is distributed on an "AS IS" BASIS,
 | WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 | See the License for the specific language governing permissions and
 | limitations under the License.
 */

define([
    "dojo/_base/declare",
    'jimu/BaseWidget',
    'dijit/_WidgetsInTemplateMixin',
    'dojo/text!./Widget.html',
    "dojo/_base/lang",
    "dojo/_base/kernel",
    "dojo/on",
    "dojo/query",
    "dijit/focus",
    "dojo/dom-attr",
    "./Single",
    "dijit/registry",
    'dojo/html',
    'dojo/dom-class',
    'dojo/dom',
    'esri/layers/MosaicRule',
    'esri/tasks/query',
    'esri/tasks/QueryTask',
    'esri/geometry/Extent',
    'dojo/date/locale',
    'dojo/dom-construct',
    'dijit/form/HorizontalSlider',
    'dijit/form/HorizontalRule',
    'dijit/form/HorizontalRuleLabels',
    'esri/graphic',
    'esri/symbols/SimpleLineSymbol',
    'esri/symbols/SimpleFillSymbol',
    'esri/Color',
    'esri/InfoTemplate',
    'esri/geometry/mathUtils',
    'dojo/dom-style',
    'esri/layers/ArcGISImageServiceLayer',
    'esri/layers/ImageServiceParameters',
    'esri/tasks/ImageServiceIdentifyTask',
    'esri/tasks/ImageServiceIdentifyParameters',
    'esri/layers/RasterFunction',
    'esri/geometry/Polygon',
    'esri/geometry/Point',
    'esri/request',
    'dijit/Tooltip',
    'dijit/form/Select',
    'dijit/form/Button',
    'dijit/form/NumberSpinner',
    'dijit/form/CheckBox',
    'dijit/form/TextBox',
    'dijit/form/DropDownButton',
    'dijit/TooltipDialog',
    'dijit/form/RadioButton',
    "esri/dijit/LayerSwipe",
    "jimu/PanelManager",
    "dijit/ColorPalette",
    "dijit/form/Button",
    "dojo/domReady!"

], function (declare, BaseWidget, _WidgetsInTemplateMixin, template, lang, kernel, on, query, focus, domAttr, Single, registry, html, domClass, dom, MosaicRule, Query, QueryTask, Extent, locale, domConstruct,
    HorizontalSlider, HorizontalRule, HorizontalRuleLabels, Graphic, SimpleLineSymbol, SimpleFillSymbol, Color, InfoTemplate, mathUtils, domStyle, ArcGISImageServiceLayer,
    ImageServiceParameters, ImageServiceIdentifyTask, ImageServiceIdentifyParameters, RasterFunction, Polygon, Point, esriRequest, Tooltip, Select, Button,
    NumberSpinner, CheckBox, TextBox, DropDownButton, TooltipDialog, RadioButton, LayerSwipe, PanelManager, ColorPalette, Button) {

        //var pm = PanelManager.getInstance();
        return declare([BaseWidget, _WidgetsInTemplateMixin], {

            templateString: template,
            baseClass: 'jimu-widget-ISImageExplorer',

            startup: function () {
                this.inherited(arguments);
                console.log('startup'); 
                this.setupLayerViewer("singleLayerViewer");
                this.resizeExploreWidget();
            },

            onOpen: function () {
                console.log('onOpen');
                var x = document.getElementsByClassName("icon-node");
                for (var i = 0; i < x.length; i++) {
                    if (i !== 0) {
                        if (domClass.contains(x[i], "jimu-state-selected")) {
                            x[i].click();
                        }
                    }
                }
                if (this.layerViewerFunction) {
                    this.layerViewerFunction.onOpen();
                }
            },

            resizeExploreWidget: function() {
                domStyle.set("rendererInfoDialog", "left", 170 + document.getElementById("Explore Imagery").offsetWidth + "px");
                var x = document.getElementsByClassName("dijitCheckBox");
                var y = document.getElementsByClassName("dijitSliderH");
                if (window.innerWidth < 620) {
                    domStyle.set("widgets_ISImageExplorer_Widget_15", "font-size", "7px");                    
                    domStyle.set("cloudFilterView", "width", "26px");              
                    domStyle.set("rendererInfoDialog", "font-size", "7px");      
                    domStyle.set("sensorInfoDialog", "font-size", "7px");                                      
                    domStyle.set("renderingInfo", "height", "7px");
                    domStyle.set("sensorInfo", "height", "7px");
                    domStyle.set("switchDisplayImageView", "height", "10px");
                    domStyle.set("refreshIconView", "height", "10px");

                    
                    for (var a=0; a<x.length; a++) {
                        domStyle.set(x[a], "height", "9px");
                        domStyle.set(x[a], "width", "9px");
                    }
                    domStyle.set("resultOpacity", "width", "100px!important");
                    // for (var a = 0; a < y.length; a++) {
                    //     domStyle.set(y[a], "width", "100px");
                    // }
                    
                } else if (window.innerWidth < 850) {
                    domStyle.set("widgets_ISImageExplorer_Widget_15", "font-size", "8px");                                      
                    domStyle.set("cloudFilterView", "width", "34px");                    
                    domStyle.set("rendererInfoDialog", "font-size", "8px");   
                    domStyle.set("sensorInfoDialog", "font-size", "8px");                                        
                    domStyle.set("renderingInfo", "height", "12px");
                    domStyle.set("sensorInfo", "height", "12px");
                    domStyle.set("switchDisplayImageView", "height", "11px");
                    domStyle.set("refreshIconView", "height", "11px");

                           
                    for (var a=0; a<x.length; a++) {
                        domStyle.set(x[a], "height", "11px");
                        domStyle.set(x[a], "width", "11px");
                    }    
                    domStyle.set("resultOpacity", "width", "130px!important");
                    // for (var a = 0; a < y.length; a++) {
                    //     domStyle.set(y[a], "width", "200px");
                    // }
                    
                } else {
                    domStyle.set("widgets_ISImageExplorer_Widget_15", "font-size", "12px");                   
                    domStyle.set("cloudFilterView", "width", "50px");                   
                    domStyle.set("rendererInfoDialog", "font-size", "11px"); 
                    domStyle.set("sensorInfoDialog", "font-size", "11px");                   
                    domStyle.set("renderingInfo", "height", "17px");
                    domStyle.set("sensorInfo", "height", "17px");
                    domStyle.set("switchDisplayImageView", "height", "13px");
                    domStyle.set("refreshIconView", "height", "13px");  

                    
                    
                    for (var a=0; a<x.length; a++) {
                        domStyle.set(x[a], "height", "14px");
                        domStyle.set(x[a], "width", "14px");
                    }
                    domStyle.set("resultOpacity", "width", "170px!important");
                    // for (var a = 0; a < y.length; a++) {
                    //     domStyle.set(y[a], "width", "300px");
                    // }
                }
            },

            postCreate: function() {
                window.addEventListener("resize", lang.hitch(this, this.resizeExploreWidget));
            },

            onClose: function () {
                console.log("onClose");
                if (this.layerViewerFunction) {
                    this.layerViewerFunction.onClose();
                }
            },

            setupLayerViewer: function (viewerType) {                
                if (viewerType === "singleLayerViewer") {
                    this.layerViewerFunction = new Single({ map: this.map, config: this.config, nls: this.nls, mainConfig: this });
                }
            }

        });
    });







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
    'dijit/registry',
    "./Double",
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
    "dojo/domReady!"

], function (declare, BaseWidget, _WidgetsInTemplateMixin, template, lang, kernel, on, query, focus, domAttr, registry, Double, html, domClass, dom, MosaicRule, Query, QueryTask, Extent, locale, domConstruct,
    HorizontalSlider, HorizontalRule, HorizontalRuleLabels, Graphic, SimpleLineSymbol, SimpleFillSymbol, Color, InfoTemplate, mathUtils, domStyle, ArcGISImageServiceLayer,
    ImageServiceParameters, ImageServiceIdentifyTask, ImageServiceIdentifyParameters, RasterFunction, Polygon, Point, esriRequest, Tooltip, Select, Button,
    NumberSpinner, CheckBox, TextBox, DropDownButton, TooltipDialog, RadioButton, LayerSwipe, PanelManager) {

        //var pm = PanelManager.getInstance();
        return declare([BaseWidget, _WidgetsInTemplateMixin], {

            templateString: template,
            baseClass: 'jimu-widget-ISImageViewer',

            startup: function () {
                this.inherited(arguments);
                console.log('startup');
                // var params = new ImageServiceParameters();
                // params.format = "jpgpng";

                // for (var a in this.config.operationalLayers) {
                // 	var maplayer = new ArcGISImageServiceLayer(this.config.operationalLayers[a].url, {
                // 		id: this.config.operationalLayers[a].id,
                // 		imageServiceParameters: params,
                // 	});
                // 	this.map.addLayer(maplayer);
                // }
                //this.primaryLayer = this.map.primaryLayer;
                this.setupLayerViewer("twoLayerViewer");
                this.resizeCompareWidget();
            },

            resizeCompareWidget: function() {
                domStyle.set("rendererInfoDialogCompare", "left", 170 + document.getElementById("Compare Imagery").offsetWidth + "px");
                var x = document.getElementsByClassName("dijitCheckBox");
                var y = document.getElementsByClassName("dijitSliderH");
                if (window.innerWidth < 620) {
                    domStyle.set("widgets_ISImageCompare_Widget_150", "font-size", "7px");                    
                    domStyle.set("positiveRange", "width", "160px");
                    domStyle.set("negativeRange", "width", "160px");
                    domStyle.set("thresholdValue", "width", "160px");
                    domStyle.set("differenceValue", "width", "160px");
                    domStyle.set("resultOpacityChange", "width", "142px");
                               
                    domStyle.set("rendererInfoDialogCompare", "font-size", "7px");      
                    domStyle.set("sensorInfoDialogCompare", "font-size", "7px");                                  

                    domStyle.set("swapLayerIcon", "height", "7px");
                    domStyle.set("swapLayerIcon", "margin-left", "25px");
                    domStyle.set("renderingInfoLeft", "height", "7px");
                    domStyle.set("sensorInfoLeft", "height", "7px");
                    domStyle.set("switchDisplayImageLeft", "height", "10px");
                    domStyle.set("refreshIconLeft", "height", "10px");
                    domStyle.set("renderingInfoRight", "height", "7px");
                    domStyle.set("sensorInfoRight", "height", "7px");
                    domStyle.set("switchDisplayImageRight", "height", "10px");
                    domStyle.set("refreshIconRight", "height", "10px");
                    domStyle.set("itals", "font-size", "7px");                   

                    for (var a=0; a<x.length; a++) {
                        domStyle.set(x[a], "height", "9px");
                        domStyle.set(x[a], "width", "9px");
                    }

                } else if (window.innerWidth < 850) {
                    domStyle.set("widgets_ISImageCompare_Widget_150", "font-size", "8px");                    
                    domStyle.set("positiveRange", "width", "170px");
                    domStyle.set("negativeRange", "width", "170px");
                    domStyle.set("thresholdValue", "width", "170px");
                    domStyle.set("differenceValue", "width", "170px");
                    domStyle.set("resultOpacityChange", "width", "152px");
                    
                    domStyle.set("rendererInfoDialogCompare", "font-size", "8px");  
                    domStyle.set("sensorInfoDialogCompare", "font-size", "8px");                    

                    domStyle.set("swapLayerIcon", "height", "11px");
                    domStyle.set("swapLayerIcon", "margin-left", "45px");
                    domStyle.set("renderingInfoLeft", "height", "12px");
                    domStyle.set("sensorInfoLeft", "height", "12px");
                    domStyle.set("switchDisplayImageLeft", "height", "11px");
                    domStyle.set("refreshIconLeft", "height", "11px");
                    domStyle.set("renderingInfoRight", "height", "12px");
                    domStyle.set("sensorInfoRight", "height", "12px");
                    domStyle.set("switchDisplayImageRight", "height", "11px");
                    domStyle.set("refreshIconRight", "height", "11px");
                    domStyle.set("itals", "font-size", "9px");

                    for (var a=0; a<x.length; a++) {
                        domStyle.set(x[a], "height", "11px");
                        domStyle.set(x[a], "width", "11px");
                    }

                } else {
                    domStyle.set("widgets_ISImageCompare_Widget_150", "font-size", "12px");
                    domStyle.set("positiveRange", "width", "180px");
                    domStyle.set("negativeRange", "width", "180px");
                    domStyle.set("thresholdValue", "width", "180px");
                    domStyle.set("differenceValue", "width", "180px");
                    domStyle.set("resultOpacityChange", "width", "180px");
                    
                    domStyle.set("rendererInfoDialogCompare", "font-size", "11px");   
                    domStyle.set("sensorInfoDialogCompare", "font-size", "11px");                   

                    domStyle.set("swapLayerIcon", "height", "13px");
                    domStyle.set("swapLayerIcon", "margin-left", "55px");
                    domStyle.set("renderingInfoLeft", "height", "17px");
                    domStyle.set("sensorInfoLeft", "height", "17px");
                    domStyle.set("switchDisplayImageLeft", "height", "13px");
                    domStyle.set("refreshIconLeft", "height", "13px");
                    domStyle.set("renderingInfoRight", "height", "17px");
                    domStyle.set("sensorInfoRight", "height", "17px");
                    domStyle.set("switchDisplayImageRight", "height", "13px");
                    domStyle.set("refreshIconRight", "height", "13px");
                    domStyle.set("itals", "font-size", "11px");

                    for (var a=0; a<x.length; a++) {
                        domStyle.set(x[a], "height", "14px");
                        domStyle.set(x[a], "width", "14px");
                    }
                }
            },

            postCreate: function() {
                window.addEventListener("resize", lang.hitch(this, this.resizeCompareWidget));
            },

            onOpen: function () {
                console.log('onOpen');
                var x = document.getElementsByClassName("icon-node");
                for (var i = 0; i < x.length; i++) {
                    if (i !== 1) {
                        if (domClass.contains(x[i], "jimu-state-selected")) {
                            x[i].click();
                        }
                    }
                }

                if (this.layerViewerFunction) {
                    this.layerViewerFunction.onOpen();
                }
            },

            onClose: function () {
                console.log("onClose");
                if (this.layerViewerFunction) {
                    this.layerViewerFunction.onClose();
                }
            },

            setupLayerViewer: function (viewerType) {
                if (viewerType === "twoLayerViewer") {
                    this.layerViewerFunction = new Double({ map: this.map, config: this.config, nls: this.nls, mainConfig: this });
                }
                
            }

        });
    });







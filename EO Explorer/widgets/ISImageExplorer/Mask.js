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
    'dijit/_TemplatedMixin',
    'dojo/text!./Widget.html',
    'dijit/registry',
    "dojo/_base/lang",
    "dojo/Deferred",
    "dojo/Evented",
    "dojo/_base/kernel",
    "dojo/on",
    "dojo/query",
    "dijit/focus",
    "dojo/dom-attr",
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
    "dijit/popup",
    'esri/InfoTemplate',
    'esri/geometry/mathUtils',
    'dojo/dom-style',
    'esri/layers/ArcGISImageServiceLayer',
    "esri/layers/RasterLayer",
    'esri/layers/ImageServiceParameters',
    'esri/tasks/ImageServiceIdentifyTask',
    'esri/tasks/ImageServiceIdentifyParameters',
    'esri/layers/RasterFunction',
    'esri/geometry/Polygon',
    'esri/geometry/Point',
    'esri/request',
    "esri/toolbars/draw",
    "esri/geometry/geometryEngine",
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
    "dijit/ColorPalette",
    "dijit/Dialog",
    "dojo/domReady!"

], function (declare, BaseWidget, _WidgetsInTemplateMixin, _TemplatedMixin, template, registry, lang, Deferred, Evented, kernel, on, query, focus, domAttr, html, domClass, dom, MosaicRule, Query, QueryTask, Extent, locale, domConstruct,
    HorizontalSlider, HorizontalRule, HorizontalRuleLabels, Graphic, SimpleLineSymbol, SimpleFillSymbol, Color, popup, InfoTemplate, mathUtils, domStyle, ArcGISImageServiceLayer, RasterLayer,
    ImageServiceParameters, ImageServiceIdentifyTask, ImageServiceIdentifyParameters, RasterFunction, Polygon, Point, esriRequest, Draw, geometryEngine, Tooltip, Select, Button,
    NumberSpinner, CheckBox, TextBox, DropDownButton, TooltipDialog, RadioButton, LayerSwipe, ColorPalette, Dialog) {

        return declare([BaseWidget, Evented, _TemplatedMixin], {
            constructor: function (parameters) {
                var defaults = {
                    map: null,
                    config: null,
                    layers: null,
                    nls: null,
                    mainConfig: null,
                };
                lang.mixin(this, defaults, parameters);
            },
            primaryLayer: null,
            orderedDates: null,
            sliderRules: null,
            sliderLabels: null,
            slider: null,
            featureIds: [],
            defaultMosaicRule: null,
            mapZoomFactor: 2.0,
            mapWidthPanFactor: 0.75,
            updateMask: false,

            postCreate: function () {
                this.layerInfos = this.layers;
                
                registry.byId("methodMask").on("change", lang.hitch(this, this.setMethod));
                registry.byId("maskApply").on("click", lang.hitch(this, this.getMinMaxCheck));
                registry.byId("maskClear").on("click", lang.hitch(this, function () {
                    domStyle.set("updateMaskLayer", "display", "none");
                    this.clearResultLayer();
                }));

                this.setTooltips();
                //this.map.spectralRenderer = null;
               

                for (var a in this.map.layerIds) {
                    var layer = this.map.getLayer(this.map.layerIds[a]);
                    if ((layer.type && layer.type === 'ArcGISImageServiceLayer') || (layer.serviceDataType && layer.serviceDataType.substr(0, 16) === "esriImageService")) {
                        this.resultLayerIndex = a + 1;
                    }
                }

                

                registry.byId("resultOpacity").on("change", lang.hitch(this, function (value) {
                    if (this.map.getLayer("resultLayer")) {
                      this.map.getLayer("resultLayer").setOpacity(1 - value);
                    }
                }));
                //this.main.resizeTemplate();
                registry.byId("colorPalette").on("change", lang.hitch(this, function (value) {

                    this.color = (new Color(value)).toRgb();

                    var layer = this.map.getLayer("resultLayer");
                    if (layer && layer.maskMethod) {
                        layer.maskMethod.color = this.color;
                        layer.redraw();
                    }
                    domStyle.set("areaValueMask", "color", "rgb(" + this.color[0] + "," + this.color[1] + "," + this.color[2] + ")");
                    popup.close(registry.byId("colorDialog"));
                }));
                registry.byId("aoiExtentMask").on("change", lang.hitch(this, function (value) {
                    this.polygons = null;
                    if (value) {
                        this.map.setInfoWindowOnClick(false);
                        this.toolbar.activate(Draw.POLYGON);
                    } else {
                        this.map.setInfoWindowOnClick(true);
                        this.removeGraphic();
                        this.toolbar.deactivate();
                    }
                }));

                
                //registry.byId("band1Mask").on("change", lang.hitch(this, this.getMinMaxCheck));
                //registry.byId("refreshImageSliderBtnMask").on("click", lang.hitch(this, this.imageSliderRefresh));
                registry.byId("maskModeList").on("change", lang.hitch(this, function (value) {
                    var layer = this.map.getLayer("resultLayer");
                    if (layer && layer.maskMethod) {
                        this.createSlider(true);
                        layer.redraw();
                        layer.maskMethod.mode = value;
                    }
                }));
                this.populateMethods();
                //document.getElementById("advanceIndexBtnMask").addEventListener("click", lang.hitch(this, this.expandMenu));
                this.toolbar = new Draw(this.map);
                this.toolbar.on("draw-complete", lang.hitch(this, this.addGraphic));
                this.primaryLayer = this.map.primaryLayer;
                this.populateBands();
            },

            // resizeSlider: function () {
            //     var y = document.getElementsByClassName("dijitSliderH");
            //     if (window.innerWidth < 620) {
            //         for (var a = 0; a < y.length; a++) {
            //             domStyle.set(y[a], "width", "100px");
            //         }
            //     }
            //     else if (window.innerWidth < 850) {
            //         for (var a = 0; a < y.length; a++) {
            //             domStyle.set(y[a], "width", "200px");
            //         }
            //     } else {
            //         for (var a = 0; a < y.length; a++) {
            //             domStyle.set(y[a], "width", "300px");
            //         }
            //     }
            // },

            populateMethods: function (currentValue) {
                registry.byId("methodMask").removeOption(registry.byId("methodMask").getOptions());
                if (this.config.changeMethods.veg) {
                    registry.byId("methodMask").addOption({ label: this.nls.method2, value: "ndvi" });
                }
                if (this.config.changeMethods.savi) {
                    registry.byId("methodMask").addOption({ label: this.nls.method3, value: "savi" });
                }
                if (this.config.changeMethods.water) {
                    registry.byId("methodMask").addOption({ label: this.nls.method4, value: "water" });
                }
                if (this.config.changeMethods.burn) {
                    registry.byId("methodMask").addOption({ label: this.nls.method5, value: "burn" });
                }
                if (this.config.changeMethods.custom && this.config.customFormula) {
                    registry.byId("methodMask").addOption({ label: this.config.customIndexLabel, value: "custom" });
                }
                registry.byId("methodMask").addOption({ label: this.nls.method8, value: "one" });
            },

            setCurrentMethod: function (currentValue) {
                if (currentValue !== registry.byId("methodMask").get("value")) {
                    if (currentValue !== "difference") {
                        registry.byId("methodMask").set("value", currentValue);
                    }
                    else {
                        this.setMethod(registry.byId("methodMask").get("value"));
                    }
                } else {
                    this.setMethod(registry.byId("methodMask").get("value"));
                }
            },
            setTooltips: function () {
                this.switchDisplayTooltip = new Tooltip({
                    connectId: ['dropDownImageListMask'],
                    position: ['below'],
                    label: this.nls.dropDown
                });
                new Tooltip({
                    connectId: ["refreshImageSliderBtnMask"],
                    position: ['after', 'below'],
                    label: this.nls.refreshTooltip
                });
                new Tooltip({
                    connectId: ["colorButton"],
                    position: ['after', 'below'],
                    label: this.nls.colorpickerText
                });

            },
            onOpen: function () {
                if (!this.previousInfo) {
                    this.previousInfo = {
                        extent: this.map.extent,
                        level: this.map.getLevel()
                    };
                    this.previousExtentChangeLevel = this.previousInfo.level;
                }
                if (this.map.getLevel() < this.config.zoomLevel) {
                    this.turningOffSelector();
                }
                this.primaryLayer = this.map.primaryLayer;
                if (this.map) {                    
                    this.transparentMaskHandler = this.map.on("layer-add", lang.hitch(this, function (response) {
                        if (response.layer.id === "resultLayer") {
                            if (this.imageMaskTool === "mask") {
                                registry.byId("aoiExtentMask").set("checked", false);
                            }
                            domStyle.set("transparencySlider", "display", "block");
                            registry.byId("resultOpacity").set("value", 1 - response.layer.opacity);
                        }
                    }));
                }
                //this.getMinMaxCheck();
                //this.imageSliderShow();
                if (registry.byId("methodValue").get("value")) {
                    registry.byId("methodMask").set("value", registry.byId("methodValue").get("value"));
                    registry.byId("methodValue").set("value", "");
                    // setTimeout(function () {
                    //     dom.byId("maskApply").click();
                    // }, 1000);
                }
            },           

            mapExtentChange: function (evt) {

                if (this.map.getLayer("resultLayer") && this.map.getLayer("resultLayer").maskMethod) {
                    if (this.maskExtent && !geometryEngine.intersects(this.maskExtent, this.map.extent)) {
                        this.clearResultLayer();
                    }
                    else {
                        this.map.getLayer("resultLayer").suspend();

                        this.calculatePixelSize();
                        if (this.primaryLayer) {
                            this.createHistogram(this.map.getLayer("resultLayer").renderingRule, true).then(lang.hitch(this, function () {
                                var layer = this.map.getLayer("resultLayer");
                                if (layer && layer.maskMethod) {
                                    layer.maskMethod.range = [this.min, this.max];
                                    layer.maskMethod.value = this.maskSlider.get("value");
                                    layer.resume();
                                }
                            }));
                        } else
                            this.map.getLayer("resultLayer").resume();
                    }
                }               
            },

            mosaicRuleChanged: function () {
                var resultLayer = this.map.getLayer("resultLayer");
                if (resultLayer && this.primaryLayer && this.primaryLayer.mosaicRule !== resultLayer.mosaicRule && this.primaryLayer.url === resultLayer.url) {
                    dom.byId("updateMaskLayer").innerHTML = this.nls.updateResult;
                    domStyle.set("maskApply", "border", "1px solid #007ac2");
                    domStyle.set("updateMaskLayer", "display", "block");
                }

            },
           
            onClose: function () {
                registry.byId("aoiExtentMask").set("checked", false);
                if (this.transparentMaskHandler) {
                    this.transparentMaskHandler.remove();
                    this.transparentMaskHandler = null;
                }
                this.map.primaryLayer = this.primaryLayer;
            },

            populateBands: function () {
                this.bandNames = [];
                registry.byId("band1Mask").removeOption(registry.byId("band1Mask").getOptions());
                registry.byId("band2Mask").removeOption(registry.byId("band2Mask").getOptions());
                var layersRequest = esriRequest({
                    url: this.primaryLayer.url + "/keyProperties",
                    content: { f: "json" },
                    handleAs: "json",
                    callbackParamName: "callback"
                });

                layersRequest.then(lang.hitch(this, function (response) {

                    var bandProp = response.BandProperties;
                    if (bandProp) {
                        for (var i = 0; i < this.primaryLayer.bandCount; i++) {
                            if (bandProp[i] && bandProp[i].BandName) {
                                this.bandNames[i] = bandProp[i].BandName;
                            } else {
                                var num = i + 1;
                                this.bandNames[i] = "Band_" + num.toString();
                            }

                        }
                    } else {
                        for (var i = 0; i < this.primaryLayer.bandCount; i++) {
                            var num = i + 1;
                            this.bandNames[i] = "Band_" + num.toString();
                        }
                    }
                    this.populateBandsContinue();

                }), lang.hitch(this, function () {
                    for (var i = 0; i < this.primaryLayer.bandCount; i++) {
                        var num = i + 1;
                        this.bandNames[i] = "Band_" + num.toString();
                    }
                    this.populateBandsContinue();
                }));
            },

            populateBandsContinue: function () {
                for (var a in this.bandNames) {
                    registry.byId("band1Mask").addOption({ label: this.bandNames[a], value: (parseInt(a) + 1) });
                    registry.byId("band2Mask").addOption({ label: this.bandNames[a], value: (parseInt(a) + 1) });
                }
                this.setBandValues();
            },

            setBandValues: function () {
                this.initialVal_nir = "";
                this.initialVal_red = "";
                this.initialVal_swir = "";
                this.initialVal_green = "";
                var nirExp = new RegExp(/N[a-z]*I[a-z]*R[_]?[1]?/i);
                var redExp = new RegExp(/red/i);
                var swirExp = new RegExp(/S[a-z]*W[a-z]*I[a-z]*R[_]?[1]?/i);
                var greenExp = new RegExp(/green/i);
                for (var i in this.bandNames) {
                    if (this.initialVal_green === "" && greenExp.test(this.bandNames[i])) {
                        this.initialVal_green = parseInt(i) + 1;
                    }
                    if (this.initialVal_red === "" && redExp.test(this.bandNames[i])) {
                        this.initialVal_red = parseInt(i) + 1;
                    }
                    if (this.initialVal_nir === "" && nirExp.test(this.bandNames[i])) {
                        this.initialVal_nir = parseInt(i) + 1;
                    }
                    if (this.initialVal_swir === "" && swirExp.test(this.bandNames[i])) {
                        this.initialVal_swir = parseInt(i) + 1;
                    }

                }
                this.setMethod(registry.byId("methodMask").get("value"));
            },

            setMethod: function (value) {
                if (value === "ndvi" || value === "savi") {
                    document.getElementById("bandName1Mask").innerHTML = this.nls.nir + ":";
                    document.getElementById("bandName2Mask").innerHTML = this.nls.red + ":";
                } else if (value === "water") {
                    document.getElementById("bandName1Mask").innerHTML = this.nls.green + ":";
                    document.getElementById("bandName2Mask").innerHTML = this.nls.swir + ":";
                } else if (value === "burn") {
                    document.getElementById("bandName1Mask").innerHTML = this.nls.nir + ":";
                    document.getElementById("bandName2Mask").innerHTML = this.nls.swir + ":";
                } else {
                    document.getElementById("bandName1Mask").innerHTML = this.nls.band1 + ":";
                    document.getElementById("bandName2Mask").innerHTML = this.nls.band2 + ":";
                }
                if (value === "one") {
                    domStyle.set("bandRowTable", "display", "none");
                    domStyle.set("bandInputsMask", "display", "block");
                    
                }
                else {
                    domStyle.set("bandInputsMask", "display", "none");
                    domStyle.set("bandRowTable", "display", "table-row");
                }
                // if (value === "custom") {
                //     //domStyle.set("advanceIndexBtnMask", "display", "none");
                //     if (domClass.contains(document.getElementById("advanceIndexBtnMask").children[1], "launchpad-icon-arrow-down")) {
                //         document.getElementById("advanceIndexBtnMask").click();
                //     }
                // } else {
                //     domStyle.set("advanceIndexBtnMask", "display", "block");

                // }
                this.setBands(value);
                this.color = null;
            },

            setBands: function (value) {
                if ((value === "ndvi" || value === "savi") && this.initialVal_red && this.initialVal_nir) {
                    registry.byId("band1Mask").set("value", this.initialVal_nir);
                    registry.byId("band2Mask").set("value", this.initialVal_red);
                } else if (value === "water" && this.initialVal_green && this.initialVal_swir) {
                    registry.byId("band1Mask").set("value", this.initialVal_green);
                    registry.byId("band2Mask").set("value", this.initialVal_swir);
                } else if (value === "burn" && this.initialVal_nir && this.initialVal_swir) {
                    registry.byId("band1Mask").set("value", this.initialVal_nir);
                    registry.byId("band2Mask").set("value", this.initialVal_swir);
                } else {
                    registry.byId("band1Mask").set("value", "1");
                    registry.byId("band2Mask").set("value", "2");
                }
                //this.getMinMaxCheck();
            },

            getMinMaxCheck: function () {
                if (this.map.updating === true) {
                    return;
                }
                registry.byId("changeMaskDetect").set("value", "mask");
                registry.byId("methodValue").set("value", registry.byId("methodMask").value);
                domStyle.set("maskApply", "border", "1px solid #ddd");
                this.showLoading();
                this.clearResultLayer(true);
                domStyle.set("updateMaskLayer", "display", "none");
                var method = registry.byId("methodMask").get("value");
                if (method !== "one" && method !== "custom" && !method.includes('Analytic')) {
                    var request = new esriRequest({
                        url: this.primaryLayer.url,
                        content: {
                            f: "json"
                        },
                        handleAs: "json",
                        callbackParamName: "callback"
                    });
                    request.then(lang.hitch(this, function (prop) {

                        var band1Index = Math.abs(parseInt(registry.byId("band1Mask").get("value")));
                        var band2Index = Math.abs(parseInt(registry.byId("band2Mask").get("value")));

                        if (prop.minValues && prop.minValues.length > 0 && prop.minValues[0] && prop.minValues.length > band1Index) {
                            this.min1 = prop.minValues[band1Index];
                            this.min2 = prop.minValues[band2Index];
                        } else {
                            this.min1 = 0;
                            this.min2 = 0;
                        }
                        if (prop.maxValues && prop.maxValues.length > 0 && prop.maxValues[0] && prop.maxValues.length > band1Index) {
                            this.max1 = prop.maxValues[band1Index];
                            this.max2 = prop.maxValues[band2Index];
                        } else {
                            this.max1 = 1;
                            this.max2 = 1;
                        }
                        this.selectFunction(true);
                    }), lang.hitch(this, function () {
                        this.min1 = 0;
                        this.max1 = 1;
                        this.min2 = 0;
                        this.max2 = 1;
                        this.selectFunction(true);
                    }));
                } else {
                    this.selectFunction(false);
                }
            },

            selectFunction: function (flag) {
                if (registry.byId("band1Mask").get("value") === registry.byId("band2Mask").get("value")) {
                    this.maskFunction(false);
                }
                else {
                    this.maskFunction(flag);
                }
            },

            checkMinMax: function (min, max) {
                var temp = min;
                min = max;
                max = temp;
                return [min, max];
            },

            createSlider: function (preserveSliderValue) {
                if (preserveSliderValue && this.maskSlider) {
                    var value = this.maskSlider.get("value");
                    if (value < this.min) {
                        value = this.min;
                    }
                    else if (value > this.max) {
                        value = this.max;
                    }
                } else {
                    value = (this.min + this.max) / 2;
                }
                document.getElementById("sliderCurrentValue").innerHTML = value.toFixed(2);
                if (this.maskSlider) {
                    this.maskSlider.destroy();
                    this.maskSliderRules.destroy();
                    this.maskSliderLabels.destroy();
                    this.maskSlider = null;
                }
                var sliderNode = domConstruct.create("div", {}, "maskSlider", "first");

                var rulesNode = domConstruct.create("div", {}, sliderNode, "first");
                this.maskSliderRules = new HorizontalRule({
                    container: "bottomDecoration",
                    count: 11,
                    style: "height:5px;"
                }, rulesNode);
                var labels = [];
                if (this.min.toString().indexOf(".") !== -1) {
                    labels[0] = this.min.toFixed(2);
                }
                else {
                    labels[0] = this.min;
                }
                if (this.max.toString().indexOf(".") !== -1) {
                    labels[1] = this.max.toFixed(2);
                }
                else {
                    labels[1] = this.max;
                }
                var labelsNode = domConstruct.create("div", {}, sliderNode, "second");
                this.maskSliderLabels = new HorizontalRuleLabels({
                    container: "bottomDecoration",
                    labelStyle: "height:1em;font-size:75%;color:gray;",
                    labels: labels
                }, labelsNode);

                this.maskSlider = new HorizontalSlider({
                    name: "slider",
                    class: registry.byId("maskModeList").get("value") === "less" ? "mask-slider-left mask-align" : "mask-slider mask-align",
                    value: value,
                    minimum: this.min,
                    maximum: this.max,
                    style: "width: 300px",
                    intermediateChanges: true,
                    onChange: lang.hitch(this, this.redrawFunction)
                }, sliderNode);

                this.maskSlider.startup();
                this.maskSliderRules.startup();
                this.maskSliderLabels.startup();
                domStyle.set("maskSettingsDiv", "display", "block");
                //this.resizeSlider();

                if (registry.byId("maskSliderReceiveValue").get("value")) {
                    this.maskSlider.set("value", parseFloat(registry.byId("maskSliderReceiveValue").get("value")));
                    registry.byId("maskSliderReceiveValue").set("value", "");
                }
            },

            redrawFunction: function (value) {
                registry.byId("maskSliderValue").set("value", value);
                var layer = this.map.getLayer("resultLayer");
                if (layer && layer.maskMethod) {
                    layer.maskMethod.value = value;
                    layer.redraw();
                }

            },

            maskFunction: function (flag) {
                var previousMethod = registry.byId("methodMask").get("value");
                if (this.map.getLayer("resultLayer")) {
                    var layer = this.map.getLayer("resultLayer");
                    if (layer.maskMethod) {
                        previousMethod = layer.maskMethod.method;
                    }
                    layer.suspend();
                    this.map.removeLayer(layer);
                }
                var method = registry.byId("methodMask").get("value");
                if (!this.color) {
                    if (method === "ndvi") {
                        this.color = [124, 252, 0];
                    } else if (method === "savi") {
                        this.color = [218, 165, 32];
                    } else if (method === "water") {
                        this.color = [64, 164, 223];
                    } else if (method === "burn") {
                        this.color = [255, 109, 49];
                    } else {
                        this.color = [255, 102, 102];
                    }
                }

                if (flag) {
                    var band1 = "B" + registry.byId("band1Mask").get("value");
                    var band2 = "B" + registry.byId("band2Mask").get("value");
                    var value1 = this.max1 - this.min1;
                    var value2 = this.max2 - this.min2;
                    if (method !== "savi") {
                        var indexFormula = "((" + value2 + "*(" + band1 + "-" + this.min1 + "))+(" + value1 + "*(" + this.min2 + "-" + band2 + ")))/((" + value2 + "*(" + band1 + "-" + this.min1 + "))+(" + value1 + "*(" + band2 + "-" + this.min2 + ")))";
                        
                    } else {
                        var indexFormula = "1.5 * ((" + value2 + "*(" + band1 + "-" + this.min1 + "))+(" + value1 + "*(" + this.min2 + "-" + band2 + ")))/((" + value2 + "*(" + band1 + "-" + this.min1 + "))+(" + value1 + "*(" + band2 + "-" + this.min2 + "))+(0.5*" + value1 + "*" + value2 + "))";
                    }
                    var raster = new RasterFunction();
                    raster.functionName = "BandArithmetic";
                    raster.outputPixelType = "F32";
                    var args = {};
                    args.Method = 0;
                    args.BandIndexes = indexFormula;
                    raster.functionArguments = args;
                } else {

                    var raster = new RasterFunction();
                    var args = {};
                    if (method === "custom") {
                        raster.functionName = "BandArithmetic";
                        raster.outputPixelType = "F32";
                        args.Method = 0;
                        args.BandIndexes = this.config.customFormula;
                        raster.functionArguments = args;
                    } else if (method === "one") {
                        raster.functionName = "ExtractBand";
                        args.BandIDs = [registry.byId("band1Mask").get("value") - 1];
                        raster.functionArguments = args;
                    } else {
                        raster = this.map.spectralRenderer;
                    }
                    
                }
                if (this.polygons) {
                    var rasterClip = new RasterFunction();
                    rasterClip.functionName = "Clip";
                    var clipArguments = {};
                    clipArguments.ClippingGeometry = this.polygons;
                    clipArguments.ClippingType = 1;
                    clipArguments.Raster = raster;
                    rasterClip.functionArguments = clipArguments;
                    raster = rasterClip;
                    this.maskExtent = this.polygons;
                } else {
                    this.maskExtent = null;
                }
                this.calculatePixelSize();

                var params = new ImageServiceParameters();
                params.renderingRule = raster;
                this.createHistogram(params.renderingRule, previousMethod === method ? true : false).then(lang.hitch(this, function (value) {
                    if (value) {

                        if (this.primaryLayer && this.primaryLayer.mosaicRule) {
                            params.mosaicRule = this.primaryLayer.mosaicRule;
                        }
                        if (params.mosaicRule && params.mosaicRule.method === "esriMosaicLockRaster") {
                            if (!this.maskExtent) {
                                this.maskExtent = this.map.extent;
                            }
                            this.currentScene = params.mosaicRule.lockRasterIds;
                        }
                        params.format = "lerc";
                        
                        var maskLayer = new RasterLayer(this.primaryLayer.url, {
                            imageServiceParameters: params,
                            visible: true,
                            id: "resultLayer",
                            pixelFilter: lang.hitch(this, this.maskPixels)
                        });
                        maskLayer.on("load", lang.hitch(this, function () {
                            if (flag) {
                                maskLayer.pixelType = "F32";
                            }
                        }));

                        maskLayer.title = "Mask Layer";
                        maskLayer.maskMethod = { method: method, color: this.color, range: [this.min, this.max], value: this.maskSlider.get("value"), mode: registry.byId("maskModeList").get("value") };
                        this.map.addLayer(maskLayer, this.resultLayerIndex);
                    }
                }));
            },

            createHistogram: function (raster, preserveSliderValue) {
                var dfd = new Deferred();
                if (raster.functionName === "Clip") {
                    var geometry = raster.functionArguments.ClippingGeometry;
                    var type = "esriGeometryPolygon";
                } else {
                    var geometry = this.map.extent;
                    var type = "esriGeometryEnvelope";
                }

                var request = new esriRequest({
                    url: this.primaryLayer.url + "/computehistograms",
                    content: {
                        f: "json",
                        geometry: JSON.stringify(geometry.toJson()),
                        geometryType: type,
                        renderingRule: JSON.stringify(raster.toJson()),
                        mosaicRule: this.primaryLayer.mosaicRule ? JSON.stringify(this.primaryLayer.mosaicRule.toJson()) : this.primaryLayer.defaultMosaicRule ? JSON.stringify(this.primaryLayer.defaultMosaicRule.toJson()) : "",
                        pixelSize: '{"x":' + this.pixelSizeX + ', "y":' + this.pixelSizeY + '}'
                    },
                    handleAs: "json",
                    callbackParamName: "callback"
                });
                request.then(lang.hitch(this, function (result) {
                    if (result && result.histograms[0]) {
                        this.min = result.histograms[0].min;
                        this.max = result.histograms[0].max;
                        this.createSlider(preserveSliderValue);
                        dfd.resolve(true);
                    }
                }), lang.hitch(this, function () {
                    dfd.resolve(false);
                }));
                return dfd.promise;
            },

            maskPixels: function (pixelData) {
                if (pixelData === null || pixelData.pixelBlock === null) {
                    return;
                }
                if (pixelData && pixelData.pixelBlock && pixelData.pixelBlock.pixels === null) {
                    return;
                }
                var p1 = pixelData.pixelBlock.pixels[0];
                var pr = new Uint8Array(p1.length);
                var pg = new Uint8Array(p1.length);
                var pb = new Uint8Array(p1.length);

                var area = 0;
                var numPixels = pixelData.pixelBlock.width * pixelData.pixelBlock.height;
                var method = registry.byId("methodMask").get("value");
                var mode = registry.byId("maskModeList").get("value");

                if (this.maskSlider) {
                    var maskRangeValue = parseFloat(this.maskSlider.get("value"));
                    if (!pixelData.pixelBlock.mask) {
                        pixelData.pixelBlock.mask = new Uint8Array(p1.length);
                        var noDataValue = pixelData.pixelBlock.statistics[0].noDataValue;
                        if (mode !== "less") {
                            for (var i = 0; i < numPixels; i++) {
                                if (p1[i] >= maskRangeValue && p1[i] !== noDataValue) {
                                    pixelData.pixelBlock.mask[i] = 1;
                                    pr[i] = this.color[0];
                                    pg[i] = this.color[1];
                                    pb[i] = this.color[2];
                                    area++;
                                } else {
                                    pixelData.pixelBlock.mask[i] = 0;
                                }
                            }
                        } else {
                            for (var i = 0; i < numPixels; i++) {
                                if (p1[i] <= parseFloat(maskRangeValue) && p1[i] !== noDataValue) {
                                    pixelData.pixelBlock.mask[i] = 1;
                                    pr[i] = this.color[0];
                                    pg[i] = this.color[1];
                                    pb[i] = this.color[2];
                                    area++;
                                } else {
                                    pixelData.pixelBlock.mask[i] = 0;
                                }
                            }
                        }
                    } else {
                        var mask = pixelData.pixelBlock.mask;
                        if (mode !== "less") {
                            for (var i = 0; i < numPixels; i++) {
                                if (mask[i] === 1 && p1[i] >= maskRangeValue) {
                                    pr[i] = this.color[0];
                                    pg[i] = this.color[1];
                                    pb[i] = this.color[2];
                                    area++;
                                } else {
                                    pixelData.pixelBlock.mask[i] = 0;
                                }
                            }
                        } else {
                            for (var i = 0; i < numPixels; i++) {
                                if (mask[i] === 1 && p1[i] <= maskRangeValue) {
                                    pr[i] = this.color[0];
                                    pg[i] = this.color[1];
                                    pb[i] = this.color[2];
                                    area++;
                                } else {
                                    pixelData.pixelBlock.mask[i] = 0;
                                }
                            }
                        }
                    }
                    pixelData.pixelBlock.pixels = [pr, pg, pb];

                    pixelData.pixelBlock.pixelType = "U8";
                    document.getElementById("sliderCurrentValue").innerHTML = maskRangeValue.toFixed(2);
                    domStyle.set("areaValueMask", "color", "rgb(" + this.color[0] + "," + this.color[1] + "," + this.color[2] + ")");
                    html.set(document.getElementById("areaValueMask"), parseInt((area * this.pixelSizeX * this.pixelSizeY) / (1000000 * this.scale)) + " " + this.nls.unit + "<sup>2</sup>");
                    domStyle.set("areaValueContainerMask", "display", "block");
                    this.hideLoadingChang();
                }

            },

            calculatePixelSize: function () {
                var xdistance = this.map.extent.xmax - this.map.extent.xmin;
                var ydistance = this.map.extent.ymax - this.map.extent.ymin;
                this.pixelSizeX = xdistance / this.map.width;
                this.pixelSizeY = ydistance / this.map.height;
                var latitude = ((this.map.extent.getCenter()).getLatitude() * Math.PI) / 180;
                this.scale = Math.pow((1 / Math.cos(latitude)), 2);
            },
           
            clearResultLayer: function (value) {
                var layer = this.map.getLayer("resultLayer");

                if (layer) {

                    layer.suspend();
                    if (layer.maskMethod && this.maskSlider) {
                        this.maskSlider.destroy();
                        this.maskSliderRules.destroy();
                        this.maskSliderLabels.destroy();
                    }
                    this.map.removeLayer(layer);
                }
                domStyle.set("transparencySlider", "display", "none");
                domStyle.set("areaValueContainerMask", "display", "none");
                domStyle.set("maskSettingsDiv", "display", "none");
                html.set(document.getElementById("areaValueMask"), "");
                this.maskExtent = null;
                if (!value) {
                    registry.byId("aoiExtentMask").set("checked", false);
                }
            },

            addGraphic: function (object) {
                var symbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([200, 0, 0]), 2);
                var graphic = new Graphic(object.geometry, symbol, { maskWidget: true });
                this.map.graphics.add(graphic);
                if (this.polygons) {
                    this.polygons.addRing(object.geometry.rings[0]);
                }
                else {
                    this.polygons = object.geometry;
                }
            },

            removeGraphic: function () {
                var temp;
                for (var k = this.map.graphics.graphics.length - 1; k >= 0; k--) {
                    temp = this.map.graphics.graphics[k];
                    if (temp.geometry && temp.geometry.type === "polygon" && temp.attributes && temp.attributes.maskWidget) {
                        this.map.graphics.remove(this.map.graphics.graphics[k]);
                    }
                }
            },

            showLoading: function () {
                domStyle.set("loadingLayerViewer", "display", "block");
            },
            
            hideLoadingChang: function () {
                domStyle.set("loadingLayerViewer", "display", "none");
            }


        });
    });
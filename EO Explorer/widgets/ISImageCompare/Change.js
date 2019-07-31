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
    "dojo/_base/lang",
    "dojo/Evented",
    "dojo/_base/connect",
    "jimu/PanelManager",
    "dijit/registry",
    "dojo/html",
    "dojo/dom-class",
    "dojo/dom",
    "esri/layers/MosaicRule",
    "esri/tasks/query",
    "esri/tasks/QueryTask",
    "esri/geometry/Extent",
    "dojo/date/locale",
    "dojo/html",
    "dojo/dom-construct",
    "dijit/form/HorizontalSlider",
    "dijit/form/HorizontalRule",
    "dijit/form/HorizontalRuleLabels",
    "esri/layers/RasterFunction",
    "esri/geometry/mathUtils",
    "dojo/dom-style",
    "esri/dijit/LayerSwipe",
    "esri/layers/ArcGISImageServiceLayer",
    "esri/layers/RasterLayer",
    "esri/layers/ImageServiceParameters",
    "esri/tasks/ImageServiceIdentifyTask",
    "esri/tasks/ImageServiceIdentifyParameters",
    "esri/geometry/geometryEngine",
    "esri/Color",
    "esri/toolbars/draw",
    "esri/graphic",
    "esri/symbols/SimpleLineSymbol",
    "esri/request",
    "dijit/Tooltip",
    "dijit/Dialog",
    "dijit/form/Select",
    "dijit/form/Button",
    "dijit/form/CheckBox",
    "dijit/form/DropDownButton",
    "dijit/TooltipDialog",
    "dojo/domReady!"

], function (declare, BaseWidget, _WidgetsInTemplateMixin, _TemplatedMixin, lang, Evented, connect, PanelManager, registry,
    html,
    domClass,
    dom,
    MosaicRule,
    Query, QueryTask, Extent, locale, html, domConstruct, HorizontalSlider, HorizontalRule, HorizontalRuleLabels, RasterFunction, mathUtils, domStyle, LayerSwipe,
    ArcGISImageServiceLayer, RasterLayer, ImageServiceParameters, ImageServiceIdentifyTask, ImageServiceIdentifyParameters, geometryEngine, Color, Draw, Graphic,
    SimpleLineSymbol, esriRequest, Tooltip, Dialog) {

        var pm = PanelManager.getInstance();
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
            secondaryLayer: null,
            orderedDates: null,
            sliderRules: null,
            sliderLabels: null,
            slider: null,
            defaultMosaicRule: null,
            mapZoomFactor: 2.0,
            previousValue: null,
            mapWidthPanFactor: 0.75,
            panZoomUpdate: false,
            previousLayerInfo: { primary: null, secondary: null },

            postCreate: function () {
                var widgetId = this.mainConfig.id;
                var panelId = widgetId + "_panel";
                this.panel = pm.getPanelById(panelId);
                this.layerInfos = this.layers;

                registry.byId("methodChange").on("change", lang.hitch(this, this.setMethod));
                registry.byId("changeApply").on("click", lang.hitch(this, this.getMinMaxCheck));
                registry.byId("positiveRange").on("change", lang.hitch(this, function () {
                    if (this.map.getLayer("resultLayer")) {
                        this.map.getLayer("resultLayer").redraw();
                    }
                }));
                registry.byId("negativeRange").on("change", lang.hitch(this, function () {
                    if (this.map.getLayer("resultLayer")) {
                        this.map.getLayer("resultLayer").redraw();
                    }
                }));
                registry.byId("thresholdValue").on("change", lang.hitch(this, function () {
                    if (this.map.getLayer("resultLayer")) {
                        this.map.getLayer("resultLayer").redraw();
                    }
                }));
                registry.byId("differenceValue").on("change", lang.hitch(this, function () {
                    if (this.map.getLayer("resultLayer")) {
                        this.map.getLayer("resultLayer").redraw();
                    }
                }));

                registry.byId("changeClear").on("click", lang.hitch(this, function () {
                    domStyle.set("updateChangeLayer", "display", "none");
                    this.clearResultLayer();
                }));
                registry.byId("band1Change").on("change", lang.hitch(this, function (value) {

                    if (value === registry.byId("band2Change").get("value")) {
                        registry.byId("changeApply").set("disabled", true);
                    }
                    else {
                        registry.byId("changeApply").set("disabled", false);
                    }

                }));
                registry.byId("band2Change").on("change", lang.hitch(this, function (value) {
                    if (value === registry.byId("band1Change").get("value")) {
                        registry.byId("changeApply").set("disabled", true);
                    }
                    else {
                        registry.byId("changeApply").set("disabled", false);
                    }
                }));
                if (this.map) {
                    this.map.on("update-start", lang.hitch(this, this.showLoadingMaskk));
                    this.map.on("update-end", lang.hitch(this, this.hideLoadingMaskk));
                    //this.map.on("update-end", lang.hitch(this, this.refreshSwipeChange));                    
                }
                this.setTooltips();

                for (var a in this.map.layerIds) {
                    var layer = this.map.getLayer(this.map.layerIds[a]);
                    if ((layer.type && layer.type === 'ArcGISImageServiceLayer') || (layer.serviceDataType && layer.serviceDataType.substr(0, 16) === "esriImageService")) {
                        if (!this.secondaryLayerIndex) {
                            this.secondaryLayerIndex = a;
                        }
                        this.resultLayerIndex = a + 1;
                    }
                }

                registry.byId("resultOpacityChange").on("change", lang.hitch(this, function (value) {
                    if (this.map.getLayer("resultLayer")) {
                        this.map.getLayer("resultLayer").setOpacity(1 - value);
                    }
                }));

                registry.byId("aoiExtentChange").on("change", lang.hitch(this, function (value) {
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

                this.populateMethods();
                this.toolbar = new Draw(this.map);
                this.toolbar.on("draw-complete", lang.hitch(this, this.addGraphic));
                var popup = this.map.infoWindow;
                connect.connect(popup, "onDfdComplete", lang.hitch(this, function (e) {
                    if (this.layerSwipe && popup && popup.location && popup.features) {
                        var showFeatures = [];
                        var screenPoint = this.map.toScreen(popup.location);
                        if (screenPoint.x <= this.layerSwipe.domNode.children[0].offsetLeft) {
                            var layerId = this.secondaryLayer ? this.secondaryLayer.id : "";
                        } else {
                            var layerId = this.primaryLayer ? this.primaryLayer.id : "";
                        }


                        for (var b = popup.features.length - 1; b >= 0; b--) {
                            if (popup.features[b]._layer.id === layerId) {
                                popup.features.splice(b, 1);
                                popup.count--;
                            } else {
                                showFeatures.push(popup.features[b]);
                            }
                        }
                        if (!popup.deferreds) {
                            popup.setFeatures(showFeatures);
                        }
                    }
                }));
                this.primaryLayer = this.map.primaryLayer;
                this.secondaryLayer = this.map.secondaryLayer;
                this.populateBands();

            },

            setFilter: function (value) {
                if (value) {
                    this.imageSliderRefresh();
                    domStyle.set("selectorDivChange", "display", "block");
                } else {
                    domStyle.set("selectorDivChange", "display", "none");
                    this.imageSliderHide();

                    if (this.primaryLayer) {
                        //this.layerInfos[this.primaryLayer.id].imageSelector = false;
                        if (this.defaultMosaicRule) {
                            this.primaryLayer.setMosaicRule(this.defaultMosaicRule);
                        }
                    }
                    // this.hideSelector = true;
                    if (this.secondaryLayer) {
                        this.secondaryLayer.suspend();
                        this.map.removeLayer(this.secondaryLayer);
                        this.secondaryLayer = null;
                        this.map.secondaryLayer = null;
                    }
                }

            },

            resizeSlider: function () {
                if (this.config.display === "both") {
                    document.getElementById("imageSliderDiv").style.width = "82%";
                } else if (this.config.display === "slider") {
                    document.getElementById("imageSliderDiv").style.width = "95%";
                    document.getElementById("imageSliderDiv").style.marginBottom = "13px";
                }
            },

            populateMethods: function (currentValue) {
                registry.byId("methodChange").removeOption(registry.byId("methodChange").getOptions());
                if (this.config.changeMethods.difference) {
                    registry.byId("methodChange").addOption({ label: this.nls.method1, value: "difference" });
                }
                if (this.config.changeMethods.veg) {
                    registry.byId("methodChange").addOption({ label: this.nls.method2, value: "ndvi" });
                }
                if (this.config.changeMethods.savi) {
                    registry.byId("methodChange").addOption({ label: this.nls.method3, value: "savi" });
                }
                if (this.config.changeMethods.water) {
                    registry.byId("methodChange").addOption({ label: this.nls.method4, value: "water" });
                }
                if (this.config.changeMethods.burn) {
                    registry.byId("methodChange").addOption({ label: this.nls.method5, value: "burn" });
                }
                if (this.config.changeMethods.custom && this.config.customFormula) {
                    registry.byId("methodChange").addOption({ label: this.config.customIndexLabel, value: "custom" });
                }
                registry.byId("methodChange").set("value", "ndvi");

            },

            setCurrentMethod: function (currentValue) {
                if (currentValue !== registry.byId("methodChange").get("value")) {
                    if (currentValue !== "one") {
                        registry.byId("methodChange").set("value", currentValue);
                    }
                    else {
                        this.setMethod(registry.byId("methodChange").get("value"));
                    }
                } else {
                    this.setMethod(registry.byId("methodChange").get("value"));
                }
            },

            setTooltips: function () {
                this.switchDisplayTooltip = new Tooltip({
                    connectId: ['dropDownImageListLeftMask'],
                    position: ['after', 'below'],
                    label: this.nls.dropDown
                });
                this.switchDisplayTooltipRight = new Tooltip({
                    connectId: ['dropDownImageListRightMask'],
                    position: ['after', 'below'],
                    label: this.nls.dropDown
                });
                new Tooltip({
                    connectId: ["refreshImageSliderBtn"],
                    position: ['after', 'below'],
                    label: this.nls.refreshTooltip
                });
                new Tooltip({
                    connectId: ["positiveRange"],
                    position: ['after', 'below'],
                    label: this.nls.positiveSliderText
                });
                new Tooltip({
                    connectId: ["negativeRange"],
                    position: ['after', 'below'],
                    label: this.nls.negativeSliderText
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
                if (this.map) {
                    this.transparentChangeHandler = this.map.on("layer-add", lang.hitch(this, function (response) {
                        if (response.layer.id === "resultLayer") {
                            domStyle.set("transparencySliderChange", "display", "block");
                            registry.byId("resultOpacityChange").set("value", 1 - response.layer.opacity);

                            registry.byId("aoiExtentChange").set("checked", false);
                            var method = registry.byId("methodChange").get("value");

                            var mode = registry.byId("changeModeList").get("value");
                            if (mode === "image" || method === "difference") {
                                registry.byId("resultOpacityChange").set("value", 1 - 0.8);
                                domStyle.set("changeSettingsDiv", "display", "none");
                            } else if (mode === "mask") {
                                domStyle.set("changeSettingsDiv", "display", "block");
                                domStyle.set("maskRangeSpinners", "display", "block");
                                domStyle.set("thresholdRangeSpinners", "display", "none");
                            } else {
                                domStyle.set("changeSettingsDiv", "display", "block");
                                domStyle.set("maskRangeSpinners", "display", "none");
                                domStyle.set("thresholdRangeSpinners", "display", "block");
                            }
                            var element = document.getElementById("imageMaskNode").children[1];
                            element.scrollTop = element.scrollHeight;

                        }
                    }));
                }
                this.primaryLayer = this.map.getLayer(registry.byId("leftLayerSelector").value);
                this.secondaryLayer = this.map.getLayer(registry.byId("leftLayerSelector").value);

                if (registry.byId("methodValue").get("value")) {
                    registry.byId("methodChange").set("value", registry.byId("methodValue").get("value"));
                    if (registry.byId("methodValue").get("value") !== "difference") {
                        registry.byId("changeModeList").set("value", registry.byId("modeValue").get("value"));
                    }
                    registry.byId("methodValue").set("value", "");
                    registry.byId("modeValue").set("value", "");
                    
                }
            },

            mosaicRuleChanged: function () {
                var resultLayer = this.map.getLayer("resultLayer");
                if (resultLayer && this.primaryLayer && this.secondaryLayer && this.primaryLayer.url === resultLayer.url && this.primaryLayer.mosaicRule &&
                    this.primaryLayer.mosaicRule.lockRasterIds && (this.primaryLayer.mosaicRule.lockRasterIds[0] !== resultLayer.rasterIds[0] ||
                        this.secondaryLayer.mosaicRule.lockRasterIds[0] !== resultLayer.rasterIds[1])) {
                    domStyle.set("changeApply", "border", "1px solid #007ac2");
                    domStyle.set("updateChangeLayer", "display", "block");
                }
            },

            mapExtentChange: function (evt) {
                if (evt.lod.level >= this.config.zoomLevel) {
                    if (this.hideSelector) {
                        this.hideSelector = false;
                        html.set(document.getElementById("errorDivChange"), "");
                        this.selectLayer(registry.byId("layerSelector").get("value"));
                    }
                    if (this.changeExtent && !geometryEngine.intersects(this.changeExtent, this.map.extent)) {
                        this.clearResultLayer();
                    }
                } else {
                    this.turningOffSelector();
                }
            },

            onClose: function () {
                registry.byId("aoiExtentChange").set("checked", false);
                if (this.layerSwipe) {
                    this.swipePosition = this.layerSwipe.domNode.children[0].offsetLeft;
                    this.layerSwipe.destroy();
                    this.layerSwipe = null;
                }

                if (this.transparentChangeHandler) {
                    this.transparentChangeHandler.remove();
                    this.transparentChangeHandler = null;
                }
                dom.byId("compDisplay").innerHTML = "";
                this.map.primaryLayer = this.primaryLayer;

            },

            populateBands: function () {
                this.bandNames = [];
                registry.byId("band1Change").removeOption(registry.byId("band1Change").getOptions());
                registry.byId("band2Change").removeOption(registry.byId("band2Change").getOptions());
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
                    registry.byId("band1Change").addOption({ label: this.bandNames[a], value: (parseInt(a) + 1) });
                    registry.byId("band2Change").addOption({ label: this.bandNames[a], value: (parseInt(a) + 1) });
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
                this.setMethod(registry.byId("methodChange").get("value"));
            },

            setMethod: function (value) {
                if (value === "ndvi" || value === "savi") {
                    document.getElementById("bandName1Change").innerHTML = this.nls.nir + ":";
                    document.getElementById("bandName2Change").innerHTML = this.nls.red + ":";
                } else if (value === "water") {
                    document.getElementById("bandName1Change").innerHTML = this.nls.green + ":";
                    document.getElementById("bandName2Change").innerHTML = this.nls.swir + ":";
                } else if (value === "burn") {
                    document.getElementById("bandName1Change").innerHTML = this.nls.nir + ":";
                    document.getElementById("bandName2Change").innerHTML = this.nls.swir + ":";
                } else {
                    document.getElementById("bandName1Change").innerHTML = this.nls.band1 + ":";
                    document.getElementById("bandName2Change").innerHTML = this.nls.band2 + ":";
                }

                if (value === "difference") {
                    //domStyle.set("advanceIndexBtn", "display", "none");
                    // if (domClass.contains(document.getElementById("advanceIndexBtn").children[1], "launchpad-icon-arrow-down")) {
                    //     document.getElementById("advanceIndexBtn").click();
                    // }
                    domStyle.set("changeMode", "display", "none");
                } else {
                    domStyle.set("areaValueChange", "color", "magenta");
                    html.set(document.getElementById("areaValueLabelChange"), this.nls.areaText + ":");
                    if (value === "burn") {
                        domStyle.set("areaValueChange", "color", "#fc6d31");
                        html.set(document.getElementById("areaValueLabelChange"), this.nls.areaText2 + ":");
                    }
                    domStyle.set("changeMode", "display", "block");
                    // if (value === "custom") {
                    //     //domStyle.set("advanceIndexBtn", "display", "none");
                    //     if (domClass.contains(document.getElementById("advanceIndexBtn").children[1], "launchpad-icon-arrow-down")) {
                    //         document.getElementById("advanceIndexBtn").click();
                    //     }
                    // } else {
                    //     domStyle.set("advanceIndexBtn", "display", "block");
                    // }
                }
                this.setBands(value);              
            },

            setBands: function (value) {
                if ((value === "ndvi" || value === "savi") && this.initialVal_red && this.initialVal_nir) {
                    registry.byId("band1Change").set("value", this.initialVal_nir);
                    registry.byId("band2Change").set("value", this.initialVal_red);
                } else if (value === "water" && this.initialVal_green && this.initialVal_swir) {
                    registry.byId("band1Change").set("value", this.initialVal_green);
                    registry.byId("band2Change").set("value", this.initialVal_swir);
                } else if (value === "burn" && this.initialVal_nir && this.initialVal_swir) {
                    registry.byId("band1Change").set("value", this.initialVal_nir);
                    registry.byId("band2Change").set("value", this.initialVal_swir);
                } else {
                    registry.byId("band1Change").set("value", "1");
                    registry.byId("band2Change").set("value", "2");
                }
            },

            getMinMaxCheck: function () {
                if (this.map.updating === true) {
                    return;
                }
                registry.byId("changeMaskDetect").set("value", "change");
                domStyle.set("changeApply", "border", "1px solid #ddd");
                this.showLoadingMaskk();
                this.clearResultLayer(true);
                this.secondaryLayer = this.map.secondaryLayer;
                domStyle.set("updateChangeLayer", "display", "none");
                var method = registry.byId("methodChange").get("value");
                if (method !== "difference" && method !== "custom") {
                    var request = new esriRequest({
                        url: this.primaryLayer.url,
                        content: {
                            f: "json"
                        },
                        handleAs: "json",
                        callbackParamName: "callback"
                    });
                    request.then(lang.hitch(this, function (prop) {
                        var band1Index = Math.abs(parseInt(registry.byId("band1Change").get("value")));
                        var band2Index = Math.abs(parseInt(registry.byId("band2Change").get("value")));

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
                        this.detectChange();
                    }), lang.hitch(this, function () {
                        this.min1 = 0;
                        this.max1 = 1;
                        this.min2 = 0;
                        this.max2 = 1;
                        this.detectChange();
                    }));
                } else {
                    this.detectChange();
                }
            },

            detectChange: function () {

                var raster1, raster2, raster2, raster3, args1 = {}, args2 = {}, args = {}, changeDetectionLayer, params;
                var method = registry.byId("methodChange").get("value");
                if (this.map.getLayer("resultLayer")) {
                    this.map.getLayer("resultLayer").suspend();
                    this.map.removeLayer(this.map.getLayer('resultLayer'));

                }
                this.layerInfos[this.primaryLayer.id].primary = this.mainConfig.orderedDates[this.mainConfig.valueSelected];
                this.layerInfos[this.primaryLayer.id].comparison = this.mainConfig.orderedDatesRight[this.mainConfig.valueSelectedRight];
                var primaryDate = this.layerInfos[this.primaryLayer.id].primary.value;
                var secondaryDate = this.layerInfos[this.primaryLayer.id].comparison.value;

                if (method === "difference") {
                    raster1 = new RasterFunction();
                    raster1.functionName = "Grayscale";
                    args1.Raster = "$" + this.primaryLayer.mosaicRule.lockRasterIds[0];
                    args1.ConversionParameters = this.conversionparameters;
                    raster1.functionArguments = args1;

                    raster2 = new RasterFunction();
                    raster2.functionName = "Grayscale";
                    args2.Raster = "$" + this.secondaryLayer.mosaicRule.lockRasterIds[0];
                    args2.ConversionParameters = this.conversionparameters;
                    raster2.functionArguments = args2;

                    raster3 = new RasterFunction();
                    raster3.functionName = "Arithmetic";
                    raster3.outputPixelType = "F32";
                    if (primaryDate > secondaryDate && this.imageFieldType === "esriFieldTypeDate") {
                        args.Raster = raster1;
                        args.Raster2 = raster2;
                    } else {
                        args.Raster = raster2;
                        args.Raster2 = raster1;
                    }
                    args.Operation = "2";
                    args.ExtentType = 0;
                    args.CellsizeType = 1;
                    raster3.functionArguments = args;

                    var raster4 = new RasterFunction();
                    raster4.functionName = "Stretch";
                    raster4.outputPixelType = "U8";
                    var args4 = {};
                    args4.StretchType = 6;
                    args4.MinPercent = 2.0;
                    args4.MaxPercent = 2.0;
                    args4.Gamma = [1.25, 1.25, 1.25];
                    args4.DRA = true;
                    args4.Min = 0;
                    args4.Max = 255;
                    args4.Raster = raster3;
                    raster4.functionArguments = args4;
                    raster3 = raster4;
                } else {
                    var changeMode = registry.byId("changeModeList").get("value");
                    if (method === "custom") {
                        var indexFormula = this.config.customFormula;
                    } else {
                        var band1 = "B" + (Math.abs(parseInt(registry.byId("band1Change").get("value"))));
                        var band2 = "B" + (Math.abs(parseInt(registry.byId("band2Change").get("value"))));
                        var value1 = this.max1 - this.min1;
                        var value2 = this.max2 - this.min2;

                        if (method !== "savi") {
                            var indexFormula = "((" + value2 + "*(" + band1 + "-" + this.min1 + "))+(" + value1 + "*(" + this.min2 + "-" + band2 + ")))/((" + value2 + "*(" + band1 + "-" + this.min1 + "))+(" + value1 + "*(" + band2 + "-" + this.min2 + ")))";
                        } else {
                            var indexFormula = "1.5 * ((" + value2 + "*(" + band1 + "-" + this.min1 + "))+(" + value1 + "*(" + this.min2 + "-" + band2 + ")))/((" + value2 + "*(" + band1 + "-" + this.min1 + "))+(" + value1 + "*(" + band2 + "-" + this.min2 + "))+(0.5*" + value1 + "*" + value2 + "))";
                        }
                    }
                    raster1 = new RasterFunction();
                    raster1.functionName = "BandArithmetic";
                    args1.Method = 0;
                    args1.Raster = "$" + this.primaryLayer.mosaicRule.lockRasterIds[0];
                    args1.BandIndexes = indexFormula;
                    raster1.functionArguments = args1;
                    raster1.outputPixelType = "F32";

                    raster2 = new RasterFunction();
                    raster2.functionName = "BandArithmetic";
                    args2.Method = 0;
                    args2.Raster = "$" + this.secondaryLayer.mosaicRule.lockRasterIds[0];
                    args2.BandIndexes = indexFormula;
                    raster2.functionArguments = args2;
                    raster2.outputPixelType = "F32";

                    // raster1 = this.map.spectralRenderer;
                    // raster1.functionArguments.Raster.arguments.Raster.arguments.Raster.arguments.Raster.value = "$" + this.primaryLayer.mosaicRule.lockRasterIds[0];
                    // raster2 = this.map.spectralRenderer;
                    // raster2.functionArguments.Raster.arguments.Raster.arguments.Raster.arguments.Raster.value = "$" + this.secondaryLayer.mosaicRule.lockRasterIds[0];

                    if (changeMode === "image") {
                        raster3 = new RasterFunction();
                        raster3.functionName = "CompositeBand";
                        raster3.outputPixelType = "F32";
                        if (this.imageFieldType === "esriFieldTypeDate" && primaryDate > secondaryDate) {
                            args.Rasters = [raster2, raster1, raster2];
                        }
                        else {
                            args.Rasters = [raster1, raster2, raster1];
                        }
                        raster3.functionArguments = args;

                        var stretch = new RasterFunction();
                        stretch.functionName = "Stretch";
                        stretch.outputPixelType = "U8";
                        var stretchArg = {};
                        stretchArg.StretchType = 3;
                        stretchArg.NumberOfStandardDeviations = 3;
                        stretchArg.DRA = true;
                        stretchArg.Min = 0;
                        stretchArg.Max = 255;
                        stretchArg.Raster = raster3;
                        stretch.functionArguments = stretchArg;
                        raster3 = stretch;
                        domStyle.set("changeSettingsDiv", "display", "none");
                    } else if (changeMode === "mask") {
                        var raster3 = new RasterFunction();
                        var arithmeticArg = {};
                        raster3.functionName = "Arithmetic";
                        if (this.imageFieldType === "esriFieldTypeDate" && primaryDate > secondaryDate) {
                            arithmeticArg.Raster = raster1;
                            arithmeticArg.Raster2 = raster2;
                        } else {
                            arithmeticArg.Raster = raster2;
                            arithmeticArg.Raster2 = raster1;
                        }
                        arithmeticArg.Operation = 2;
                        arithmeticArg.ExtentType = 1;
                        arithmeticArg.CellsizeType = 0;
                        raster3.outputPixelType = "F32";
                        raster3.functionArguments = arithmeticArg;
                        domStyle.set("changeSettingsDiv", "display", "block");
                        domStyle.set("maskRangeSpinners", "display", "block");
                        domStyle.set("thresholdRangeSpinners", "display", "none");
                    } else {
                        var raster3 = new RasterFunction();
                        var compositeArg = {};
                        raster3.functionName = "CompositeBand";
                        if (this.imageFieldType === "esriFieldTypeDate" && primaryDate > secondaryDate) {
                            compositeArg.Rasters = [raster2, raster1];
                        }
                        else {
                            compositeArg.Rasters = [raster1, raster2];
                        }
                        raster3.outputPixelType = "F32";
                        raster3.functionArguments = compositeArg;
                        domStyle.set("changeSettingsDiv", "display", "block");
                        domStyle.set("maskRangeSpinners", "display", "none");
                        domStyle.set("thresholdRangeSpinners", "display", "block");
                    }
                }

                this.currentScene = [this.primaryLayer.mosaicRule.lockRasterIds[0], this.secondaryLayer.mosaicRule.lockRasterIds[0]];
                var query = new Query();
                query.where = "(OBJECTID = " + this.primaryLayer.mosaicRule.lockRasterIds[0] + ") OR (OBJECTID = " + this.secondaryLayer.mosaicRule.lockRasterIds[0] + ")";
                query.returnGeometry = true;
                var queryTask = new QueryTask(this.primaryLayer.url);
                queryTask.execute(query, lang.hitch(this, function (result) {

                    var intersectGeometry = geometryEngine.intersect(result.features[0].geometry, result.features[1].geometry);
                    if (this.polygons) {
                        intersectGeometry = geometryEngine.intersect(intersectGeometry, this.polygons);
                    }
                    if (intersectGeometry) {
                        intersectGeometry.cache = undefined;
                        var rasterClip = new RasterFunction();
                        rasterClip.functionName = "Clip";
                        // rasterClip.outputPixelType = "U8";
                        var clipArguments = {};
                        clipArguments.ClippingGeometry = intersectGeometry;
                        clipArguments.ClippingType = 1;
                        clipArguments.Raster = raster3;
                        rasterClip.functionArguments = clipArguments;
                        raster3 = rasterClip;
                        this.changeExtent = intersectGeometry;
                    } else {
                        this.changeExtent = this.map.extent;
                    }


                    params = new ImageServiceParameters();
                    params.renderingRule = raster3;
                    if (method === "difference") {
                        this.changeDetectionLayer = new ArcGISImageServiceLayer(
                            this.primaryLayer.url,
                            {
                                id: "resultLayer",
                                imageServiceParameters: params
                            });
                    } else {
                        if (changeMode === "image") {
                            this.changeDetectionLayer = new RasterLayer(
                                this.primaryLayer.url,
                                {
                                    id: "resultLayer",
                                    imageServiceParameters: params
                                });
                            // this.changeDetectionLayer.on("load", lang.hitch(this, function () {
                            //     this.changeDetectionLayer.pixelType = "U8";
                            // }));
                        } else {
                            this.calculatePixelSize();
                            params.format = "lerc";
                            this.changeDetectionLayer = new RasterLayer(
                                this.primaryLayer.url,
                                {
                                    id: "resultLayer",
                                    imageServiceParameters: params,
                                    pixelFilter: lang.hitch(this, this.changePixels)
                                });
                            this.changeDetectionLayer.on("load", lang.hitch(this, function () {
                                this.changeDetectionLayer.pixelType = "F32";
                            }));
                        }
                    }
                    //this.number++;
                    this.changeDetectionLayer.title = "Change Layer";
                    this.changeDetectionLayer.changeMethod = method;
                    this.changeDetectionLayer.changeMode = changeMode;
                    this.changeDetectionLayer.rasterIds = [this.primaryLayer.mosaicRule.lockRasterIds[0], this.secondaryLayer.mosaicRule.lockRasterIds[0]];
                    this.map.addLayer(this.changeDetectionLayer, this.resultLayerIndex);
                }), lang.hitch(this, function () {
                    params = new ImageServiceParameters();
                    params.renderingRule = raster3;
                    if (method === "difference") {
                        this.changeDetectionLayer = new ArcGISImageServiceLayer(
                            this.primaryLayer.url,
                            {
                                id: "resultLayer",
                                imageServiceParameters: params
                            });
                    } else {
                        if (changeMode === "image") {
                            this.changeDetectionLayer = new RasterLayer(
                                this.primaryLayer.url,
                                {
                                    id: "resultLayer",
                                    imageServiceParameters: params
                                });
                            // this.changeDetectionLayer.on("load", lang.hitch(this, function () {
                            //     this.changeDetectionLayer.pixelType = "U8";
                            // }));
                        } else {
                            this.calculatePixelSize();
                            params.format = "lerc";
                            this.changeDetectionLayer = new RasterLayer(
                                this.primaryLayer.url,
                                {
                                    id: "resultLayer",
                                    imageServiceParameters: params,
                                    pixelFilter: lang.hitch(this, this.changePixels)
                                });
                            this.changeDetectionLayer.on("load", lang.hitch(this, function () {
                                this.changeDetectionLayer.pixelType = "F32";
                            }));
                        }
                    }
                    this.changeDetectionLayer.title = "Change Layer";
                    this.changeExtent = this.map.extent;
                    this.changeDetectionLayer.changeMethod = method;
                    this.changeDetectionLayer.changeMode = changeMode;
                    this.changeDetectionLayer.rasterIds = [this.primaryLayer.mosaicRule.lockRasterIds[0], this.secondaryLayer.mosaicRule.lockRasterIds[0]];
                    this.map.addLayer(this.changeDetectionLayer, this.resultLayerIndex);
                }));
            },

            calculatePixelSize: function () {
                var xdistance = this.map.extent.xmax - this.map.extent.xmin;
                var ydistance = this.map.extent.ymax - this.map.extent.ymin;
                this.pixelSizeX = xdistance / this.map.width;
                this.pixelSizeY = ydistance / this.map.height;
                var latitude = ((this.map.extent.getCenter()).getLatitude() * Math.PI) / 180;
                this.scale = Math.pow((1 / Math.cos(latitude)), 2);
            },

            changePixels: function (pixelData) {
                if (pixelData === null || pixelData.pixelBlock === null) {
                    return;
                }
                var numPixels = pixelData.pixelBlock.width * pixelData.pixelBlock.height;
                if (!pixelData.pixelBlock.mask) {
                    pixelData.pixelBlock.mask = new Uint8Array(numPixels);
                }

                if (pixelData.pixelBlock.pixels === null) {
                    return;
                }
                var pr = new Uint8Array(numPixels);
                var pg = new Uint8Array(numPixels);
                var pb = new Uint8Array(numPixels);
                var areaLeft = 0, areaRight = 0;
                var color = registry.byId("methodChange").get("value") === "burn" ? [255, 69, 0] : [255, 0, 255];
                if (this.changeDetectionLayer.changeMode === "mask") {
                    var pixelScene = pixelData.pixelBlock.pixels[0];
                    var nodata = (pixelData.pixelBlock.statistics[0] && pixelData.pixelBlock.statistics[0].noDataValue) ? pixelData.pixelBlock.statistics[0].noDataValue : 0;
                    var positiveDif = registry.byId("positiveRange").get("value");
                    var negativeDif = registry.byId("negativeRange").get("value");

                    for (var i = 0; i < numPixels; i++) {

                        if (pixelScene[i] === nodata) {
                            pixelData.pixelBlock.mask[i] = 0;
                        } else if (pixelScene[i] <= negativeDif) {
                            pr[i] = color[0];
                            pg[i] = color[1];
                            pb[i] = color[2];
                            pixelData.pixelBlock.mask[i] = 1;
                            areaLeft++;
                        } else if (pixelScene[i] >= positiveDif) {
                            pr[i] = 0;
                            pg[i] = 252;
                            pb[i] = 0;
                            pixelData.pixelBlock.mask[i] = 1;
                            areaRight++;
                        } else {
                            pixelData.pixelBlock.mask[i] = 0;
                        }
                    }

                } else {
                    var pixelScene1 = pixelData.pixelBlock.pixels[0];
                    var pixelScene2 = pixelData.pixelBlock.pixels[1];
                    var threshold = registry.byId("thresholdValue").get("value");
                    var differenceThreshold = registry.byId("differenceValue").get("value");
                    var noData1 = (pixelData.pixelBlock.statistics[0] && pixelData.pixelBlock.statistics[0].noDataValue) ? pixelData.pixelBlock.statistics[0].noDataValue : 0;
                    var noData2 = (pixelData.pixelBlock.statistics[1] && pixelData.pixelBlock.statistics[1].noDataValue) ? pixelData.pixelBlock.statistics[1].noDataValue : 0;

                    for (var i = 0; i < numPixels; i++) {
                        if (pixelScene1[i] === noData1 || pixelScene2[i] === noData2) {
                            pixelData.pixelBlock.mask[i] = 0;
                        } else {
                            if (pixelScene1[i] > 10) {
                                pixelScene1[i] = 0;
                            }
                            if (pixelScene2[i] > 10) {
                                pixelScene2[i] = 0;
                            }
                            if (pixelScene1[i] < threshold && pixelScene2[i] > threshold && (pixelScene2[i] - pixelScene1[i]) > differenceThreshold) {
                                pixelData.pixelBlock.mask[i] = 1;
                                pr[i] = 0;
                                pg[i] = 252;
                                pb[i] = 0;
                                areaLeft++;
                            } else if (pixelScene1[i] > threshold && pixelScene2[i] < threshold && (pixelScene1[i] - pixelScene2[i]) > differenceThreshold) {
                                pixelData.pixelBlock.mask[i] = 1;
                                pr[i] = color[0];
                                pg[i] = color[1];
                                pb[i] = color[2];
                                areaRight++;
                            } else {
                                pixelData.pixelBlock.mask[i] = 0;
                            }
                        }
                    }
                }
                html.set(document.getElementById("areaValueChange"), parseInt((areaLeft * this.pixelSizeX * this.pixelSizeY) / (1000000 * this.scale)) + " " + this.nls.unit + "<sup>2</sup> <span style='color:black;'>/</span> <span style='color:green;'>" + parseInt((areaRight * this.pixelSizeX * this.pixelSizeY) / (1000000 * this.scale)) + " " + this.nls.unit + "<sup>2</sup></span>");
                domStyle.set("areaValueContainerChange", "display", "block");
                pixelData.pixelBlock.pixels = [pr, pg, pb];
                pixelData.pixelBlock.pixelType = "U8";
                this.hideLoadingMaskk();
            },

            checkMinMax: function (min, max) {
                var temp = min;
                min = max;
                max = temp;
                return [min, max];
            },

            turningOffSelector: function () {
                html.set(document.getElementById("errorDivChange"), this.nls.zoom);
                if (this.primaryLayer && this.defaultMosaicRule) {
                    this.primaryLayer.setMosaicRule(this.defaultMosaicRule);
                }
                this.hideSelector = true;
                if (this.secondaryLayer) {
                    this.secondaryLayer.suspend();
                    this.map.removeLayer(this.secondaryLayer);
                    this.secondaryLayer = null;
                    this.map.secondaryLayer = null;
                }

            },

            clearResultLayer: function (value) {
                var layer = this.map.getLayer("resultLayer");
                if (layer) {
                    layer.suspend();
                    this.map.removeLayer(layer);
                }
                domStyle.set("transparencySliderChange", "display", "none");
                domStyle.set("areaValueContainerChange", "display", "none");
                domStyle.set("maskRangeSpinners", "display", "none");
                domStyle.set("thresholdRangeSpinners", "display", "none");
                domStyle.set("changeSettingsDiv", "display", "none");
                html.set(document.getElementById("areaValueChange"), "");
                this.changeExtent = null;
                if (!value) {
                    registry.byId("aoiExtentChange").set("checked", false);
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

            showLoadingMaskk: function () {
                domStyle.set("loadingLayerCompare", "display", "block");
            },

            hideLoadingMaskk: function () {
                domStyle.set("loadingLayerCompare", "display", "none");
            }

        });
    });
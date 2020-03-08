///////////////////////////////////////////////////////////////////////////
// Copyright (c) 2013 Esri. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
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
    'dijit/_WidgetsInTemplateMixin',
    'dojo/text!./Widget.html',
    'jimu/BaseWidget',
    "dijit/popup", "esri/geometry/Extent",
    "dojo/on",
    "dojo/_base/lang",
    'dojo/dom-class',
    "esri/layers/RasterFunction",
    "esri/dijit/ColorPicker",
    "esri/layers/ImageServiceParameters",
    "dojo/dom-construct", "esri/layers/MosaicRule",
    "dojo/dom", "dojox/form/HorizontalRangeSlider", "dijit/form/HorizontalRule",
    "dijit/form/HorizontalRuleLabels",
    "dojo/html",
    "dojo/dom-style",
    "dojo/_base/connect",
    "esri/Color", "esri/tasks/query",
    "esri/tasks/QueryTask",
    "dojox/charting/Chart",
    "dojox/charting/action2d/Tooltip",
    "dojox/charting/themes/PrimaryColors",
    "dojox/charting/action2d/Magnify",
    "esri/toolbars/draw", "esri/request",
    "esri/geometry/Polygon", "esri/SpatialReference",
    "dijit/registry",
    "esri/layers/RasterLayer",
    "jimu/PanelManager",
    "dijit/Dialog", "dijit/ColorPalette", "dojo/parser", "dijit/form/DropDownButton", "dijit/TooltipDialog",
    "dojox/charting/plot2d/Lines",
    "dojox/charting/plot2d/Areas",
    "dojox/charting/axis2d/Default"

],
        function (
                declare,
                _WidgetsInTemplateMixin,
                template,
                BaseWidget,
                popup, Extent, on,
                lang,
                domClass,
                RasterFunction, ColorPicker,
                ImageServiceParameters,
                domConstruct, MosaicRule,
                dom, HorizontalRangeSlider, HorizontalRule, HorizontalRuleLabels, html, domStyle, connect, Color, Query, QueryTask, Chart, Tooltip, theme, Magnify, Draw, esriRequest, Polygon, SpatialReference, registry, RasterLayer, PanelManager) {

            var pm = PanelManager.getInstance();
            var clazz = declare([BaseWidget, _WidgetsInTemplateMixin], {
                templateString: template,
                name: 'Mask',
                baseClass: 'jimu-widget-Mask',
                flagValue: true,
                color: [255,109,49],
                extentChangeHandler: null,
                startup: function () {
                    this.inherited(arguments);
                    var headerCustom = domConstruct.toDom('<div id="minimizeButton" style="background-color: black; border-radius: 4px;height: 30px;width:30px;position: absolute;top:260px;left: 20px;display: none;cursor:pointer;"><a   id="maskMinimize" target="_blank"><img id="maskThumnail" src="widgets/ISLayers/images/mask.png" style="height: 20px;margin:5px;" alt="M" /></a></div>');
                    domConstruct.place(headerCustom, this.map.container);
                    domConstruct.place('<img id="loadingMask" style="position: absolute;top:0;bottom: 0;left: 0;right: 0;margin:auto;z-index:100;" src="' + require.toUrl('jimu') + '/images/loading.gif">', "maskDialog");
                    on(dom.byId("maskMinimize"), "click", lang.hitch(this, lang.hitch(this, function () {
                        domStyle.set("minimizeButton", "display", "none");
                        this.skipMaskFlag = true;
                        this.onOpen();
                        this.extentChange = true;
                        this.createHistogram(this.map.getLayer("resultLayer").renderingRule);
                    })));
                    this.hideLoading();
                    this.resizeMaskWidget();
                },
                resizeMaskWidget: function () {
                    if (window.innerWidth < 620) {
                        domStyle.set("maskDialog", "font-size", "7px");
                        domStyle.set("maskHistogram", "width", "180px");
                        domStyle.set("maskHistogram", "height", "92px");
                        domStyle.set("maskSliderDiv", "width", "180px");
                        domStyle.set("resultOpacity", "width", "129px");
                    } else if (window.innerWidth < 850) {
                        domStyle.set("maskDialog", "font-size", "8px");
                        domStyle.set("maskHistogram", "width", "200px");
                        domStyle.set("maskHistogram", "height", "102px");

                        domStyle.set("maskSliderDiv", "width", "200px");
                        domStyle.set("resultOpacity", "width", "142px");
                    } else {
                        domStyle.set("maskDialog", "font-size", "12px");
                        domStyle.set("maskHistogram", "width", "270px");
                        domStyle.set("maskHistogram", "height", "140px");
                        domStyle.set("maskSliderDiv", "width", "270px");
                        domStyle.set("resultOpacity", "width", "180px");
                    }
                },
                postCreate: function () {

                    window.addEventListener("resize", lang.hitch(this, this.resizeMaskWidget));

                    var layer = this.map.getLayer("primaryLayer");
                    if (layer)
                        layer.on("rendering-change", lang.hitch(this, function (value) {
                            if (!this.stateClosed)
                                this.getMinMaxSlider();
                        }));
                    registry.byId("resultOpacity").on("change", lang.hitch(this, function () {
                        this.maskLayer.setOpacity(1 - registry.byId("resultOpacity").get("value"));
                        if (registry.byId("resultOpacity").get("value") === 1)
                            this.maskLayer.hide();
                        else {
                            if (!this.maskLayer.visible)
                                this.maskLayer.show();
                        }
                    }));
                    registry.byId("maskDialog").on("hide", lang.hitch(this, function () {
                        if (!this.noMinimizeDisplay)
                            domStyle.set("minimizeButton", "display", "block");
                        else
                            this.noMinimizeDisplay = false;
                    }));


                    this.map.on("update-start", lang.hitch(this, this.showLoading));
                    this.map.on("update-end", lang.hitch(this, this.hideLoading));

                    if (this.map.getLayer("primaryLayer")) {
                        this.map.getLayer("primaryLayer").on("mosaic-rule-change", lang.hitch(this, this.mosaicRuleApplied));
                    }
                    this.map.on("layer-add-result", lang.hitch(this, function (layer) {
                        if (!this.stateClosed) {
                            if (layer.layer.id === "resultLayer") {
                                this.maskLayer = this.map.getLayer("resultLayer");
                                this.maskLayer.setOpacity(1 - registry.byId("resultOpacity").get("value"));
                                if (registry.byId("resultOpacity").get("value") === 1)
                                    this.maskLayer.hide();
                                else {
                                    if (!this.maskLayer.visible)
                                        this.maskLayer.show();
                                }
                            } else if (layer.layer.id === "primaryLayer")
                                this.map.getLayer("primaryLayer").on("mosaic-rule-change", lang.hitch(this, this.mosaicRuleApplied));
                        }
                    }));


                    this.map.on("extent-change", lang.hitch(this, function (zoom) {
                        if (!this.stateClosed) {
                            var latitude = ((this.map.extent.getCenter()).getLatitude() * Math.PI) / 180;
                            this.scale = Math.pow((1 / Math.cos(latitude)), 2);

                            if (zoom.levelChange) {
                                var xdistance = this.map.extent.xmax - this.map.extent.xmin;
                                var ydistance = this.map.extent.ymax - this.map.extent.ymin;
                                this.pixelSizeX = xdistance / this.map.width;
                                this.pixelSizeY = ydistance / this.map.height;
                            }
                            if (this.map.getLayer("resultLayer")) {
                                this.extentChange = true;
                                this.createHistogram(this.map.getLayer("resultLayer").renderingRule);
                            }
                        }
                    }));
                    this.toolbarAreas = new Draw(this.map);
                    dojo.connect(this.toolbarAreas, "onDrawEnd", lang.hitch(this, this.addGraphic));
                },
                getMinMaxSlider: function () {
                    var raster = new RasterFunction();
                    raster.functionName = this.map.primaryRenderer;
                    var layer = this.map.getLayer("primaryLayer");
                    var renderer = this.map.primaryRenderer;
                    if (layer && layer.mosaicRule && layer.mosaicRule.method === "esriMosaicLockRaster")
                        var mosaic = layer.mosaicRule.toJson();
                    else {
                        var mosaic = {"mosaicMethod": "esriMosaicAttribute", "ascending": true, "mosaicOperation": "MT_FIRST", "sortField": "StdTime", "sortValue": "2050/01/01", "where": "Variable = '" + this.config[renderer] + "'"};
                    }

                    var extent = new Extent(-28901757.63895707, -15262945.807980005, 28901757.63895707, 16358747.045476068, 102100);
                    var request = new esriRequest({
                        url: this.config.hycomUrl + "/computehistograms",
                        content: {
                            f: "json",
                            geometry: JSON.stringify(extent),
                            geometryType: "esriGeometryEnvelope",
                            renderingRule: JSON.stringify(raster.toJson()),
                            mosaicRule: JSON.stringify(mosaic),
                        },
                        handleAs: "json",
                        callbackParamName: "callback"
                    });
                    request.then(lang.hitch(this, function (result) {
                        if (result && result.histograms[0]) {
                            this.minSlider = result.histograms[0].min;
                            this.maxSlider = result.histograms[0].max;
                         //   html.set(this.maskSliderValue, "[" + this.minSlider.toFixed(2) + " to " + this.maxSlider.toFixed(2) + "]");
                         
                            if (this.rangeSlider) {
                                this.rangeSlider.destroy();
                                this.rangeRule.destroy();
                                this.rangeRuleLabels.destroy();
                                this.rangeSlider = null;
                                this.rangeRule = null;
                                this.rangeRuleLabels = null;
                            }
                            var sliderNode = domConstruct.create("div", {}, "maskSliderDiv", "first");
                            var rulesNode = domConstruct.create("div", {}, sliderNode, "first");
                            if (!this.rangeRule) {
                                this.rangeRule = new HorizontalRule({
                                    id: "sliderMask1",
                                    count: 11,
                                    style: "height:5px;"
                                }, rulesNode);
                            }

                            var labelsNode = domConstruct.create("div", {}, sliderNode, "second");
                            if (!this.rangeRuleLabels) {
                                this.rangeRuleLabels = new HorizontalRuleLabels({
                                    id: "sliderMask2",
                                    labelStyle: "height:1em;font-size:75%;color:gray;",
                                    labels: [parseInt(this.minSlider), parseInt(this.maxSlider)]
                                }, labelsNode);
                            }

                            if (!this.rangeSlider) {
                                this.rangeSlider = new HorizontalRangeSlider({
                                    id: "maskSlider",
                                    style: "",
                                    value: [this.minSlider, this.maxSlider],
                                    minimum: this.minSlider,
                                    maximum: this.maxSlider,
                                    intermediateChanges: true,
                                    showButtons: true,
                                    onChange: lang.hitch(this, this.redrawFunction)

                                }, sliderNode);
                            }

                            this.rangeSlider.startup();
                            this.rangeRule.startup();
                            this.rangeRuleLabels.startup();
                            this.maskFunction();
                            var maskRangeValue = registry.byId("maskSlider").get("value");
                            html.set(this.maskSliderValue, "[" + maskRangeValue[0].toFixed(2) + " to " + maskRangeValue[1].toFixed(2) + "]");
                        }
                   }));
                },
                createHistogram: function (raster) {

                    if (this.chart) {
                        dojo.empty("maskHistogram");
                        this.chart = null;
                    }

                    var geometry = this.map.extent;
                    var type = "esriGeometryEnvelope";

                    var layer = this.map.getLayer("primaryLayer");
                    var renderer = this.map.primaryRenderer;

                    if (layer && layer.mosaicRule && layer.mosaicRule.method === "esriMosaicLockRaster")
                        var mosaic = layer.mosaicRule.toJson();
                    else {

                        var mosaic = {"mosaicMethod": "esriMosaicAttribute", "ascending": true, "mosaicOperation": "MT_FIRST", "sortField": "StdTime", "sortValue": "2050/01/01", "where": "Variable = '" + this.config[renderer] + "'"};
                   }

                    var request = new esriRequest({
                        url: this.config.hycomUrl + "/computehistograms",
                        content: {
                            f: "json",
                            geometry: JSON.stringify(geometry.toJson()),
                            geometryType: type,
                            renderingRule: JSON.stringify(raster.toJson()),
                            mosaicRule: JSON.stringify(mosaic),
                            pixelSize: '{"x":' + this.pixelSizeX + ', "y":' + this.pixelSizeY + '}'
                        },
                        handleAs: "json",
                        callbackParamName: "callback"
                    });
                   request.then(lang.hitch(this, function (result) {
                        if (result && result.histograms[0]) {
                            this.min = result.histograms[0].min;
                            this.max = result.histograms[0].max;
                           
                           if (parseInt(this.min) < parseInt(this.minSlider) || parseInt(this.min) > parseInt(this.maxSlider) || parseInt(this.max) > parseInt(this.maxSlider) || parseInt(this.max) < parseInt(this.minSlider)) {
                           html.set(this.maskSliderValue, "[" + this.min.toFixed(2) + " to " + this.max.toFixed(2) + "]"); 
                               this.previousSliderRange = this.rangeSlider ? this.rangeSlider.get("value") : [this.min, this.max];
                                var ratio = (this.previousSliderRange[0] - this.minSlider) / (this.maxSlider - this.minSlider);
                                var ratio2 = (this.maxSlider - this.previousSliderRange[1]) / (this.maxSlider - this.minSlider);


                                this.minSlider = this.min;
                                this.maxSlider = this.max;

                                if (this.rangeSlider) {
                                    this.rangeSlider.destroy();
                                    this.rangeRule.destroy();
                                    this.rangeRuleLabels.destroy();
                                    this.rangeSlider = null;
                                    this.rangeRule = null;
                                    this.rangeRuleLabels = null;
                                }
                                var sliderNode = domConstruct.create("div", {}, "maskSliderDiv", "first");
                                var rulesNode = domConstruct.create("div", {}, sliderNode, "first");
                                if (!this.rangeRule) {
                                    this.rangeRule = new HorizontalRule({
                                        id: "sliderMask1",
                                        count: 11,
                                        style: "height:5px;"
                                    }, rulesNode);
                                }

                                var labelsNode = domConstruct.create("div", {}, sliderNode, "second");
                                if (!this.rangeRuleLabels) {
                                    this.rangeRuleLabels = new HorizontalRuleLabels({
                                        id: "sliderMask2",
                                        labelStyle: "height:1em;font-size:75%;color:gray;",
                                        labels: [parseInt(this.min), parseInt(this.max)]
                                    }, labelsNode);
                                }

                                if (!this.rangeSlider) {
                                    var value = [];


                                    value[0] = this.min + (ratio * (this.max - this.min));
                                    value[1] = this.max - (ratio2 * (this.max - this.min));
                                    this.rangeSlider = new HorizontalRangeSlider({
                                        id: "maskSlider",
                                        style: "",
                                        value: value,
                                        minimum: this.min,
                                        maximum: this.max,
                                        intermediateChanges: true,
                                        showButtons: true,
                                        onChange: lang.hitch(this, this.redrawFunction)

                                    }, sliderNode);
                                }

                                this.rangeSlider.startup();
                                this.rangeRule.startup();
                                this.rangeRuleLabels.startup();
                            }
                            var chartData = result.histograms[0].counts;
                            this.value = [];
                            for (var a = 0; a < 256; a++) {
                                this.value.push({
                                    x: a,
                                    y: chartData[a]
                                });

                            }
                            var threshold = registry.byId("maskSlider").get("value")[0];
                            var threshold2 = registry.byId("maskSlider").get("value")[1]
                            var increaseLimit = parseInt(((threshold - this.min) / (this.max - this.min)) * 255);
                            var increaseLimit2 = parseInt(((threshold2 - this.min) / (this.max - this.min)) * 255);

                            if (increaseLimit < 0)
                                increaseLimit = 0;
                            else if (increaseLimit > 255)
                                increaseLimit = 255;
                            if (increaseLimit2 > 255)
                                increaseLimit2 = 255;
                            else if (increaseLimit2 < 0)
                                increaseLimit2 = 0;

                            this.dataIncrease = this.value.slice(increaseLimit, increaseLimit2 + 1);

                            if (!this.chart) {
                                this.chart = new Chart("maskHistogram");
                                this.chart.addPlot("default", {
                                    type: "Areas",
                                    markers: false,
                                    areas: true,
                                    tension: "S",
                                    color: "black",
                                    shadows: {dx: 4, dy: 4}
                                });

                                this.chart.setTheme(theme);

                                this.chart.addAxis("y", {vertical: true, fixLower: "none", fixUpper: "none", titleOrientation: "axis", minorLabels: false, microTicks: false, majorLabels: false, minorTicks: false, majorTicks: false, stroke: "white", majorTick: {color: "white"}});
                                this.chart.addAxis("x", {titleOrientation: "away", fixLower: "none", fixUpper: "none", minorLabels: false, microTicks: false, majorLabels: false, minorTicks: false, majorTicks: false, majorTick: {color: "white"}, stroke: "white"});
                                this.chart.addSeries("Mask", this.dataIncrease, {stroke: {color: this.color, width: 0.5}, fill: this.color});


                                this.magnify = new Magnify(this.chart, "default");
                                this.chart.render();
                            }
                            if(!this.extentChange){
                            if (this.map.getLayer("resultLayer")) {
                                this.map.getLayer("resultLayer").setRenderingRule(raster);
                            }else if(this.newLayer) {
                                if (this.map.getLayer("secondaryLayer"))
                            this.map.addLayer(this.newLayer, 3);
                            else
                            this.map.addLayer(this.newLayer, 2);
                            }
                        }
                    }
                    }));

                },
                mosaicRuleApplied: function (layer) {
                    if (!this.stateClosed) {
                    if (this.newLayer)
                            this.newLayer.setMosaicRule(layer.target.mosaicRule);
                    }


                },
                onOpen: function () {
                    this.stateClosed = false;


                    var x = document.getElementsByClassName("icon-node");
                    if (domClass.contains(x[4], "jimu-state-selected"))
                        x[4].click();
                    if (registry.byId("timeDialog") && registry.byId("timeDialog").open)
                        registry.byId("timeDialog").hide();
                    if(registry.byId("depthDialog") && registry.byId("depthDialog").open)
                        registry.byId("depthDialog").hide();

                    if (pm.getPanelById("_22_panel") && pm.getPanelById("_22_panel").state === "opened")
                        pm.closePanel("_22_panel");
                    if (registry.byId("overlayLayerDialog").open)
                       registry.byId("overlayLayerDialog").hide();
                    if (registry.byId("oceanCurrentsDialog").open)
                        registry.byId("oceanCurrentsDialog").hide();
                    registry.byId("maskDialog").show();
                    registry.byId("maskDialog").closeButtonNode.title = "Minimize";
                    domStyle.set("maskDialog", "top", "100px");
                    domStyle.set("maskDialog", "left", "160px");
                    domConstruct.destroy("maskDialog_underlay");

                    if (!this.skipMaskFlag) {
                     this.getMinMaxSlider();

                    } else
                        this.skipMaskFlag = false;
                },
                onClose: function () {
                    this.stateClosed = true;
                    if (this.chart) {
                        dojo.empty("maskHistogram");
                        this.chart = null;
                    }


                    if (registry.byId("maskDialog").open) {
                        this.noMinimizeDisplay = true;
                        registry.byId("maskDialog").hide("hide");
                    }
                    domStyle.set("minimizeButton", "display", "none");
                    if (this.extentChangeHandler) {
                        this.extentChangeHandler.remove();
                        this.extentChangeHandler = null;
                    }
                    if (this.map.getLayer("resultLayer")) {

                        this.map.getLayer("resultLayer").suspend();
                        this.map.removeLayer(this.map.getLayer("resultLayer"));
                    }
                    this.newLayer = null;
                    this.map.getLayer("primaryLayer").show();
                    this.hideLoading();

                },
                redrawFunction: function (value) {

                    html.set(this.maskSliderValue, "[" + value[0].toFixed(2) + " to " + value[1].toFixed(2) + "]");
                    if (this.chart) {
                        var threshold = value[0];
                        var threshold2 = value[1];
                        var increaseLimit = parseInt(((threshold - this.min) / (this.max - this.min)) * 255);
                        var increaseLimit2 = parseInt(((threshold2 - this.min) / (this.max - this.min)) * 255);
                        if (increaseLimit < 0)
                            increaseLimit = 0;
                        else if (increaseLimit > 255)
                            increaseLimit = 255;
                        if (increaseLimit2 > 255)
                            increaseLimit2 = 255;
                        else if (increaseLimit2 < 0)
                            increaseLimit2 = 0;

                        this.dataIncrease = this.value.slice(increaseLimit, increaseLimit2 + 1);


                        this.chart.updateSeries("Mask", this.dataIncrease);
                        this.chart.render();
                    }
                    if (this.sliderErrorFlag)
                        this.newLayer.redraw();
                    else
                        this.sliderErrorFlag = true;
                },
                maskFunction: function (value) {

                    this.sliderErrorFlag = false;

                    var raster = new RasterFunction();
                    raster.functionName = this.map.primaryRenderer;//"None";



                    var xdistance = this.map.extent.xmax - this.map.extent.xmin;
                    var ydistance = this.map.extent.ymax - this.map.extent.ymin;
                    this.pixelSizeX = xdistance / this.map.width;
                    this.pixelSizeY = ydistance / this.map.height;
                    var latitude = ((this.map.extent.getCenter()).getLatitude() * Math.PI) / 180;
                    this.scale = Math.pow((1 / Math.cos(latitude)), 2);

                    var params = new ImageServiceParameters();
                    params.renderingRule = raster;
                    var renderer = this.map.primaryRenderer;
                    this.extentChange = false;
                    this.createHistogram(params.renderingRule);
                    var layer = this.map.getLayer("primaryLayer");
                    if (layer && layer.mosaicRule && layer.mosaicRule.method === "esriMosaicLockRaster")
                        params.mosaicRule = layer.mosaicRule;
                    else {

                        params.mosaicRule = new MosaicRule({"method": "esriMosaicAttribute", "ascending": true, "operation": "MT_FIRST", "sortField": "StdTime", "sortValue": "2050/01/01", "where": "Variable = '" + this.config[renderer] + "'"});
                 }

                    if (this.map.getLayer("resultLayer")) {
                        this.map.getLayer("resultLayer").setMosaicRule(params.mosaicRule, true);
                    //    this.map.getLayer("resultLayer").setRenderingRule(params.renderingRule);
                    } else {
                        var layer = this.map.getLayer("primaryLayer");


                        params.format = "lerc";
                        params.lercVersion = 1;
                        this.newLayer = new RasterLayer(this.config.hycomUrl, {
                            imageServiceParameters: params,
                            visible: true,
                            id: "resultLayer",
                            pixelFilter: lang.hitch(this, this.maskPixels)
                        });

                        this.newLayer.on("load", lang.hitch(this, function () {
                            this.newLayer.pixelType = "F32";
                        }));
                        if (this.map.getLayer("resultLayer")) {
                            this.map.getLayer("resultLayer").suspend();
                            this.map.removeLayer(this.map.getLayer("resultLayer"));
                        }
                      /*  if (this.map.getLayer("secondaryLayer"))
                            this.map.addLayer(this.newLayer, 3);
                        else
                            this.map.addLayer(this.newLayer, 2);*/
                    }
                    this.map.getLayer("primaryLayer").hide();
                    
                },
                maskPixels: function (pixelData) {

                    if (pixelData === null || pixelData.pixelBlock === null) {

                        return;
                    }
                    if (pixelData && pixelData.pixelBlock && pixelData.pixelBlock.pixels === null)
                        return;
                    var p1 = pixelData.pixelBlock.pixels[0];
                    if (!pixelData.pixelBlock.mask) {
                        pixelData.pixelBlock.mask = new Uint8Array(p1.length);
                    }
                    var pr = new Uint8Array(p1.length);
                    var pg = new Uint8Array(p1.length);
                    var pb = new Uint8Array(p1.length);

                    var area = 0;
                    var numPixels = pixelData.pixelBlock.width * pixelData.pixelBlock.height;
                    var maskRangeValue = registry.byId("maskSlider").get("value");
                    var noDataValue = pixelData.pixelBlock.statistics[0].noDataValue;
                    var factor = 255 / (this.maxSlider - this.minSlider);
                    var index;
                    for (var i = 0; i < numPixels; i++) {
                        if (p1[i] !== noDataValue && p1[i] >= maskRangeValue[0] && p1[i] <= maskRangeValue[1]) {
                            pixelData.pixelBlock.mask[i] = 1;
                            index = parseInt((p1[i] - this.minSlider) * factor);
                            pr[i] = this.config.colormap[index][0];
                            pg[i] = this.config.colormap[index][1];
                            pb[i] = this.config.colormap[index][2];
                            area++;
                        } else
                            pixelData.pixelBlock.mask[i] = 0;
                    }

                    pixelData.pixelBlock.pixels = [pr, pg, pb];

                    pixelData.pixelBlock.pixelType = "U8";
                    dom.byId("maskArea").innerHTML = "&nbsp;&nbsp;" + parseInt(((area * this.pixelSizeX * this.pixelSizeY) / (1000000 * this.scale)) * 0.386102) + " sq. miles";

                },
                showLoading: function () {
                    if (dom.byId("loadingMask"))
                        domStyle.set("loadingMask", "display", "block");

                },
                hideLoading: function () {
                    if (dom.byId("loadingMask"))
                        domStyle.set("loadingMask", "display", "none");
                }
            });
            clazz.hasLocale = false;
            return clazz;
        });
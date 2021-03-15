///////////////////////////////////////////////////////////////////////////
// Copyright (c) 2017 Esri. All Rights Reserved.
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
    'dijit/_TemplatedMixin',
    'dojo/text!./Widget.html',
    'jimu/BaseWidget',
    "dojo/Evented",
    "dijit/registry",
    "dojo/_base/lang",
    "dojo/dom",
    "dojo/dom-construct",
    'dojo/dom-style',
    "esri/request",
    "dojox/charting/Chart",
    "dojox/charting/action2d/Tooltip",
    "dojox/charting/themes/PrimaryColors",
    "dojox/charting/widget/SelectableLegend",
    "dojox/charting/action2d/Magnify",
    "dojo/date/locale",
    "dojo/html",
    "dojo/on",
    "dijit/popup",
    "esri/layers/RasterFunction",
    "esri/layers/ImageServiceParameters",
    "esri/layers/RasterLayer",
    "dojo/_base/connect",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/symbols/SimpleLineSymbol",
    "esri/Color",
    'dojo/dom-class',
    "jimu/PanelManager",
    "dijit/Tooltip",
    "esri/tasks/query",
    "esri/tasks/QueryTask",
    "esri/toolbars/draw",
    "esri/geometry/Polygon",
    "esri/SpatialReference",
    "dijit/form/NumberTextBox",
    "dojo/domReady!"
],
    function (
        declare,
        _WidgetsInTemplateMixin, _TemplatedMixin,
        template,
        BaseWidget, Evented,
        registry,
        lang,
        dom,
        domConstruct,
        domStyle, esriRequest, Chart, Tooltip, theme, SelectableLegend, Magnify, locale, html, on, popup, RasterFunction, ImageServiceParameters, RasterLayer, connect,
        SimpleMarkerSymbol, SimpleLineSymbol, Color, domClass, PanelManager, tooltip, Query, QueryTask, Draw, Polygon, SpatialReference, NumberTextBox
    ) {

        var pm = PanelManager.getInstance();
        var clazz = declare([BaseWidget, Evented, _TemplatedMixin], {
            constructor: function (parameters) {
                var defaults = {
                    map: null,
                    config: null,
                    nls: null,
                    mainConfig: null,
                };
                lang.mixin(this, defaults, parameters);
            },
            templateString: template,
            name: 'Identify',
            baseClass: 'jimu-widget-Identify',
            layerInfos: [],
            primaryLayerIndex: null,
            secondaryLayerIndex: null,
            primaryLayer: null,
            secondaryLayer: null,
            layerSwipe: null,
            layerList: null,
            bandNames1: [],
            clickhandle13: null,
            clickhandle12: null,
            w: null,
            h: null,
            clickhandle14: null,
            wiopen: false,
            levelzoom: null,
            clickX: [],
            clickY: [],
            scatterPlotFlag: 0,
            updateBandsFlag: 1,
            //bandNames: ["Coastal", "Blue", "Green", "Red", "VRE", "VRE", "VRE", "NIR", "VRE", "Water_Vapor", "Cirrus", "SWIR_1", "SWIR_2"],
            myColor: {
                colors: {
                    background: new Color([0, 0, 0, 0]),
                    disabled: new Color([205, 205, 205, 1]),
                    draw: new Color([0, 245, 245])
                },
                freqRamp: {
                    //colors should not overlap with ramp, otherwise behavior may not be correct
                    start: new Color([140, 200, 240, 1]),
                    end: new Color([240, 10, 10, 1]),
                    breaks: 200,
                    cover: function (r, g, b) {
                        //checks if color rgb is in freqRamp range
                        for (var i = 0; i <= this.breaks; i++) {
                            if (this.between(r, this.start.r, this.end.r, i) && this.between(g, this.start.g, this.end.g, i) && this.between(b, this.start.b, this.end.b, i)) {
                                return true;
                            }
                        }
                        return false;
                    },
                    between: function (x, a, b, i) {
                        //checks if value lies in specified range
                        if (x === Math.round(a + (b - a) * (i / this.breaks))) {
                            return true;
                        }
                        return false;
                    },
                    colorAt: function (idx) {
                        //ensure idx is b/w breaks and 0
                        idx = idx > this.breaks ? this.breaks : idx;
                        idx = idx < 0 ? 0 : idx;
                        var r = Math.round(this.start.r + (this.end.r - this.start.r) * (idx / this.breaks));
                        var g = Math.round(this.start.g + (this.end.g - this.start.g) * (idx / this.breaks));
                        var b = Math.round(this.start.b + (this.end.b - this.start.b) * (idx / this.breaks));
                        var a = this.start.a + (this.end.a - this.start.a) * (idx / this.breaks);
                        return new Color([r, g, b, a]);
                    }
                }
            },

            startup: function () {
                this.inherited(arguments);
                // domConstruct.place('<img id="loadingLayerViewer" style="position: absolute;top:0;bottom: 0;left: 0;right: 0;margin:auto;z-index:100;" src="' + require.toUrl('jimu') + '/images/loading.gif">', this.map.container);

                // this.hideLoading();
                // domConstruct.place('<img id="markerPixel" style="display:none;position: absolute;z-index:100;" src="./widgets/Identify/images/marker.png">', "canvasContainer");
                // this.pointTooltip = new tooltip({
                //     connectId: ["markerPixel"]
                // });
                // this.resizeIdentifyWidget();
            },

            postCreate: function () {
                window.addEventListener("resize", lang.hitch(this, this.resizeIdentifyWidget));
                this.inherited(arguments);
                //domConstruct.place('<img id="loadingLayerViewer" style="position: absolute;top:0;bottom: 0;left: 0;right: 0;margin:auto;z-index:100;" src="' + require.toUrl('jimu') + '/images/loading.gif">', this.map.container);

                this.hideLoading();
                domConstruct.place('<img id="markerPixel" style="display:none;position: absolute;z-index:100;" src="./widgets/ISImageExplorer/images/marker.png">', "canvasContainer");
                this.pointTooltip = new tooltip({
                    connectId: ["markerPixel"]
                });
                this.resizeIdentifyWidget();
                this.scatterFlag = 0;
                this.eventsOnCanvas();

                this.primaryLayer = this.map.primaryLayer;
                registry.byId("type").on("change", lang.hitch(this, this.displaysp));

                registry.byId("xBand").on("change", lang.hitch(this, function () {
                    if (this.scatterPlotFlag === 1) {
                    this.scatterLayer();
                    }
                }));
                registry.byId("yBand").on("change", lang.hitch(this, function () {
                    if (this.scatterPlotFlag === 1) {
                    this.scatterLayer();
                    }
                }));
                this.extentCheck = this.map.extent;
                if (this.map) {
                    this.map.on("update-start", lang.hitch(this, this.showLoading));
                    this.map.on("update-end", lang.hitch(this, this.hideLoading));
                    this.map.on("update-end", lang.hitch(this, this.refreshData));

                    registry.byId("markedAreasScatter").on("change", lang.hitch(this, function (value) {
                        if (value) {
                            this.polygons = null;
                            this.polygons = new Polygon(new SpatialReference({ wkid: 102100 }));
                            this.toolbarAreas.activate(Draw.POLYGON);
                            for (var k = this.map.graphics.graphics.length - 1; k >= 0; k--) {
                                if (this.map.graphics.graphics[k].geometry.type === "polygon") {
                                    if (this.map.graphics.graphics[k].symbol.color.r === 200) {
                                        this.map.graphics.remove(this.map.graphics.graphics[k]);
                                    }
                                }
                            }

                            this.turnOffClick = true;
                            domStyle.set(registry.byId("resetScatter").domNode, "display", "none");
                            domStyle.set(registry.byId("clipScatter").domNode, "display", "inline-block");
                            registry.byId("clipScatter").set("disabled", true);
                        } else {
                            this.toolbarAreas.deactivate();
                            this.turnOffClick = false;
                            domStyle.set(registry.byId("clipScatter").domNode, "display", "none");
                        }
                    }));

                    registry.byId("clipScatter").on("click", lang.hitch(this, function (value) {
                        registry.byId("clipScatter").set("disabled", true);
                        domStyle.set(registry.byId("clipScatter").domNode, "display", "none");
                        domStyle.set(registry.byId("resetScatter").domNode, "display", "inline-block");
                        this.scatterLayer();
                        registry.byId("markedAreasScatter").set("checked", false);
                    }));

                    registry.byId("resetScatter").on("click", lang.hitch(this, function () {
                        domStyle.set(registry.byId("resetScatter").domNode, "display", "none");
                        for (var k = this.map.graphics.graphics.length - 1; k >= 0; k--) {
                            if (this.map.graphics.graphics[k].geometry.type === "polygon") {
                                if (this.map.graphics.graphics[k].symbol.color.r === 200) {
                                    this.map.graphics.remove(this.map.graphics.graphics[k]);
                                }
                            }
                        }
                        this.polygons = null;
                        if (this.map.getLayer("resultLayer1")) {
                            this.scatterLayer();
                        }
                    }));
                    this.toolbarIdentify = new Draw(this.map);
                    dojo.connect(this.toolbarIdentify, "onDrawEnd", lang.hitch(this, this.addGraphic));
                    this.toolbarAreas = new Draw(this.map);
                    dojo.connect(this.toolbarAreas, "onDrawEnd", lang.hitch(this, this.addGraphic2));
                }
            },

            resizeIdentifyWidget: function () {
                if (window.innerWidth < 620) {

                    domStyle.set("chartNode1", "width", "180px");
                    domStyle.set("chartNode1", "height", "225px");
                    if (this.chart) {
                        this.chart.resize(180, 225);
                    }
                } else if (window.innerWidth < 850) {

                    domStyle.set("chartNode1", "width", "260px");
                    domStyle.set("chartNode1", "height", "225px");
                    if (this.chart) {
                        this.chart.resize(260, 225);
                    }
                } else {

                    domStyle.set("chartNode1", "width", "390px");
                    domStyle.set("chartNode1", "height", "270px");
                    if (this.chart) {
                        this.chart.resize(390, 270);
                    }
                }
            },

            addGraphic: function (geometry) {
                this.clear();
                for (var a in this.map.graphics.graphics) {
                    if (this.map.graphics.graphics[a].geometry.type === "point" && this.map.graphics.graphics[a].symbol && this.map.graphics.graphics[a].symbol.color.r === 255) {
                        this.map.graphics.remove(this.map.graphics.graphics[a]);
                        break;
                    }
                }
                var symbol = new esri.symbol.SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, 20,
                    new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                        new Color([255, 0, 0]), 1),
                    new Color([255, 0, 0, 0.35]));
                var graphic = new esri.Graphic(geometry, symbol);
                this.map.graphics.add(graphic);
                this.checkSecondaryAndPrimary(geometry);

            },

            onOpen: function () {
                this.scatterPlotFlag = 0;
                
                html.set(dom.byId("compDisplay"), "");
                this.primaryLayer = this.map.getLayer(registry.byId("layerSelectorView").value);



                this.scatterFlag = 0;
                new tooltip({
                    connectId: ["typical"],
                    label: "Spectral profile of different land covers.",
                    position: ['after']
                });
                connect.publish("identify", [{ idenstatus: "open" }]);
                domStyle.set("loadingLayerViewer", "display", "block");
                this.autoresize();
                ////this.primaryLayer = this.map.getLayer("primaryLayer");
                
                if (this.primaryLayer.url === this.config.urlSentinel) {
                    this.acquisitionDate = "acquisitiondate";
                    this.bestLayer = "best";
                    this.objectId = "objectid";
                    this.nameLayer = "name";
                    this.cloudcover = "cloudcover";
                    this.bandNames = ["Coastal", "Blue", "Green", "Red", "VRE", "VRE", "VRE", "NIR", "VRE", "Water_Vapor", "Cirrus", "SWIR_1", "SWIR_2"];
                    this.bandNames1 = ["Coastal", "Blue", "Green", "Red", "VRE", "VRE", "VRE", "NIR", "VRE", "Water Vapor", "Cirrus", "SWIR 1", "SWIR 2"];

                    if (registry.byId("xBand").options.length > 0) {
                        for (var i = 0; i < registry.byId("xBand").options.length; i++) {
                            registry.byId("xBand").removeOption(registry.byId("xBand").getOptions());
                        }
                    }
                    registry.byId("xBand").addOption({ label: "Coastal(1)", value: "0" });
                    registry.byId("xBand").addOption({ label: "Blue(2)", value: "1" });
                    registry.byId("xBand").addOption({ label: "Green(3)", value: "2" });
                    registry.byId("xBand").addOption({ label: "Red(4)", value: "3", selected: true });
                    registry.byId("xBand").addOption({ label: "VRE(5)", value: "4" });
                    registry.byId("xBand").addOption({ label: "VRE(6)", value: "5" });
                    registry.byId("xBand").addOption({ label: "VRE(7)", value: "6" });
                    registry.byId("xBand").addOption({ label: "NIR(8)", value: "7" });
                    registry.byId("xBand").addOption({ label: "NarrowNIR(8A)", value: "8" });
                    registry.byId("xBand").addOption({ label: "Water Vapor(9)", value: "9" });
                    registry.byId("xBand").addOption({ label: "Cirrus(10)", value: "10" });
                    registry.byId("xBand").addOption({ label: "SWIR(11)", value: "11" });
                    registry.byId("xBand").addOption({ label: "SWIR(12)", value: "12" });
                    registry.byId("xBand").set("value", "3");

                    if (registry.byId("yBand").options.length > 0) {
                        for (var i = 0; i < registry.byId("yBand").options.length; i++) {
                            registry.byId("yBand").removeOption(registry.byId("yBand").getOptions());
                        }
                    }
                    registry.byId("yBand").addOption({ label: "Coastal(1)", value: "0" });
                    registry.byId("yBand").addOption({ label: "Blue(2)", value: "1" });
                    registry.byId("yBand").addOption({ label: "Green(3)", value: "2" });
                    registry.byId("yBand").addOption({ label: "Red(4)", value: "3" });
                    registry.byId("yBand").addOption({ label: "VRE(5)", value: "4" });
                    registry.byId("yBand").addOption({ label: "VRE(6)", value: "5" });
                    registry.byId("yBand").addOption({ label: "VRE(7)", value: "6" });
                    registry.byId("yBand").addOption({ label: "NIR(8)", value: "7", selected: true });
                    registry.byId("yBand").addOption({ label: "NarrowNIR(8A)", value: "8" });
                    registry.byId("yBand").addOption({ label: "Water Vapor(9)", value: "9" });
                    registry.byId("yBand").addOption({ label: "Cirrus(10)", value: "10" });
                    registry.byId("yBand").addOption({ label: "SWIR(11)", value: "11" });
                    registry.byId("yBand").addOption({ label: "SWIR(12)", value: "12" });
                    registry.byId("yBand").set("value", "7");
                }
                else if (this.primaryLayer.url === this.config.urlLandsatMS) {
                    this.acquisitionDate = "AcquisitionDate";
                    this.bestLayer = "Best";
                    this.objectId = "OBJECTID";
                    this.nameLayer = "GroupName";
                    this.cloudcover = "CloudCover";
                    this.sunElevation = "SunElevation";
                    this.sunAzimuth = "SunAzimuth";
                    this.bandNames = ["Coastal", "Blue", "Green", "Red", "NIR", "SWIR_1", "SWIR_2", "Cirrus", "QA", "Thermal Infrared1", "Thermal Infrared2"];
                    this.bandNames1 = ["Coastal", "Blue", "Green", "Red", "NIR", "SWIR 1", "SWIR 2", "Cirrus", "QA", "Thermal Infrared1", "Thermal Infrared2"];
                    if (registry.byId("xBand").options.length > 0) {
                        for (var i = 0; i < registry.byId("xBand").options.length; i++) {
                            registry.byId("xBand").removeOption(registry.byId("xBand").getOptions());
                        }
                    }
                    registry.byId("xBand").addOption({ label: "Coastal(1)", value: "0" });
                    registry.byId("xBand").addOption({ label: "Blue(2)", value: "1" });
                    registry.byId("xBand").addOption({ label: "Green(3)", value: "2" });
                    registry.byId("xBand").addOption({ label: "Red(4)", value: "3", selected: true });
                    registry.byId("xBand").addOption({ label: "NIR(5)", value: "4" });
                    registry.byId("xBand").addOption({ label: "SWIR_1(6)", value: "5" });
                    registry.byId("xBand").addOption({ label: "SWIR_2(7)", value: "6" });
                    registry.byId("xBand").addOption({ label: "Cirrus(8)", value: "7" });
                    registry.byId("xBand").set("value", "3");

                    if (registry.byId("yBand").options.length > 0) {
                        for (var i = 0; i < registry.byId("yBand").options.length; i++) {
                            registry.byId("yBand").removeOption(registry.byId("yBand").getOptions());
                        }
                    }
                    registry.byId("yBand").addOption({ label: "Coastal(1)", value: "0" });
                    registry.byId("yBand").addOption({ label: "Blue(2)", value: "1" });
                    registry.byId("yBand").addOption({ label: "Green(3)", value: "2" });
                    registry.byId("yBand").addOption({ label: "Red(4)", value: "3" });
                    registry.byId("yBand").addOption({ label: "NIR(5)", value: "4", selected: true });
                    registry.byId("yBand").addOption({ label: "SWIR_1(6)", value: "5" });
                    registry.byId("yBand").addOption({ label: "SWIR_2(7)", value: "6" });
                    registry.byId("yBand").addOption({ label: "Cirrus(8)", value: "7" });
                    registry.byId("yBand").set("value", "4");
                } else if (this.primaryLayer.url === this.config.urlDEA) {
                    this.acquisitionDate = "acquisitiondate";
                    this.bestLayer = "best";
                    this.objectId = "objectid";
                    this.nameLayer = "name";
                    this.cloudcover = "cloudcover";
                    this.bandNames = ["Coastal", "Blue", "Green", "Red", "VRE", "VRE", "VRE", "NIR", "NarrowNIR", "Water_Vapor", "SWIR_1", "SWIR_2"];
                    this.bandNames1 = ["Coastal", "Blue", "Green", "Red", "VRE", "VRE", "VRE", "NIR", "NarrowNIR", "Water Vapor", "SWIR 1", "SWIR 2"];

                    if (registry.byId("xBand").options.length > 0) {
                        for (var i = 0; i < registry.byId("xBand").options.length; i++) {
                            registry.byId("xBand").removeOption(registry.byId("xBand").getOptions());
                        }
                    }
                    registry.byId("xBand").addOption({ label: "Coastal(1)", value: "0" });
                    registry.byId("xBand").addOption({ label: "Blue(2)", value: "1" });
                    registry.byId("xBand").addOption({ label: "Green(3)", value: "2" });
                    registry.byId("xBand").addOption({ label: "Red(4)", value: "3", selected: true });
                    registry.byId("xBand").addOption({ label: "VRE(5)", value: "4" });
                    registry.byId("xBand").addOption({ label: "VRE(6)", value: "5" });
                    registry.byId("xBand").addOption({ label: "VRE(7)", value: "6" });
                    registry.byId("xBand").addOption({ label: "NIR(8)", value: "7" });
                    registry.byId("xBand").addOption({ label: "NarrowNIR(8A)", value: "8" });
                    registry.byId("xBand").addOption({ label: "Water Vapor(9)", value: "9" });
                    registry.byId("xBand").addOption({ label: "SWIR(11)", value: "10" });
                    registry.byId("xBand").addOption({ label: "SWIR(12)", value: "11" });
                    registry.byId("xBand").set("value", "3");

                    if (registry.byId("yBand").options.length > 0) {
                        for (var i = 0; i < registry.byId("yBand").options.length; i++) {
                            registry.byId("yBand").removeOption(registry.byId("yBand").getOptions());
                        }
                    }
                    registry.byId("yBand").addOption({ label: "Coastal(1)", value: "0" });
                    registry.byId("yBand").addOption({ label: "Blue(2)", value: "1" });
                    registry.byId("yBand").addOption({ label: "Green(3)", value: "2" });
                    registry.byId("yBand").addOption({ label: "Red(4)", value: "3" });
                    registry.byId("yBand").addOption({ label: "VRE(5)", value: "4" });
                    registry.byId("yBand").addOption({ label: "VRE(6)", value: "5" });
                    registry.byId("yBand").addOption({ label: "VRE(7)", value: "6" });
                    registry.byId("yBand").addOption({ label: "NIR(8)", value: "7", selected: true });
                    registry.byId("yBand").addOption({ label: "NarrowNIR(8A)", value: "8" });
                    registry.byId("yBand").addOption({ label: "Water Vapor(9)", value: "9" });
                    registry.byId("yBand").addOption({ label: "SWIR(11)", value: "10" });
                    registry.byId("yBand").addOption({ label: "SWIR(12)", value: "11" });
                    registry.byId("yBand").set("value", "7");
                } else if (this.primaryLayer.url === this.config.urlNaip) {
                    this.acquisitionDate = "AcquisitionDate";
                    this.bestLayer = "Best";
                    this.objectId = "OBJECTID";
                    this.nameLayer = "Name";
                    this.bandNames = ["Red", "Green", "Blue", "NIR"];
                    this.bandNames1 = ["Red", "Green", "Blue", "NIR"];

                    if (registry.byId("xBand").options.length > 0) {
                        for (var i = 0; i < registry.byId("xBand").options.length; i++) {
                            registry.byId("xBand").removeOption(registry.byId("xBand").getOptions());
                        }
                    }
                    registry.byId("xBand").addOption({ label: "Red(1)", value: "0", selected: true });
                    registry.byId("xBand").addOption({ label: "Green(2)", value: "1" });
                    registry.byId("xBand").addOption({ label: "Blue(3)", value: "2" });
                    registry.byId("xBand").addOption({ label: "NIR(4)", value: "3" });
                    
                    registry.byId("xBand").set("value", "0");

                    if (registry.byId("yBand").options.length > 0) {
                        for (var i = 0; i < registry.byId("yBand").options.length; i++) {
                            registry.byId("yBand").removeOption(registry.byId("yBand").getOptions());
                        }
                    }
                    registry.byId("yBand").addOption({ label: "Red(1)", value: "0" });
                    registry.byId("yBand").addOption({ label: "Green(2)", value: "1" });
                    registry.byId("yBand").addOption({ label: "Blue(3)", value: "2" });
                    registry.byId("yBand").addOption({ label: "NIR(4)", value: "3", selected: true });
                    
                    registry.byId("yBand").set("value", "3");
                }
                           
                this.refreshData();
                this.centerFlag = true;
                this.checkSecondaryAndPrimary(this.map.extent.getCenter());
                this.toolbarIdentify.activate(Draw.POINT);
                if (this.primaryLayer.url === this.config.urlLandsatMS || this.primaryLayer.url === this.config.urlSentinel) {
                    
                    document.getElementById("onlyidentify").style.display = "block";
                } else {
                    //this.toolbarIdentify.deactivate();
                    document.getElementById("onlyidentify").style.display = "none";
                }
                

                for (var a in this.map.graphics.graphics) {
                    if (this.map.graphics.graphics[a].geometry.type === "point" && this.map.graphics.graphics[a].symbol && this.map.graphics.graphics[a].symbol.color.r === 255) {
                        this.map.graphics.remove(this.map.graphics.graphics[a]);
                        break;
                    }
                }
                
            },

            scatterPlotDraw: function () {
                this.scatterPlotFlag = 1;               
                this.scatterFlag = 1;
                for (var a in this.map.graphics.graphics) {
                    if (this.map.graphics.graphics[a].geometry.type === "point" && this.map.graphics.graphics[a].symbol && this.map.graphics.graphics[a].symbol.color.r === 255) {
                        this.map.graphics.remove(this.map.graphics.graphics[a]);
                        break;
                    }
                }

                html.set(dom.byId("identifytab"), "");
                html.set(this.noinfo, "");
                domStyle.set("onlyidentify", "display", "none");
                domStyle.set("identifysp", "display", "none");
                domStyle.set("scatterPlotContainer", "display", "block");
                this.toolbarIdentify.deactivate();
                this.mapClickHandler = on(dom.byId("map"), "click", lang.hitch(this, this.markDataInChart));

                this.extentChangeHandler = this.map.on("extent-change", lang.hitch(this, function (extent) {
                    if (registry.byId("imageryTool").get('value') === 'scatterplot') {
                    if (this.ctx && (extent.extent.xmin !== this.extentCheck.xmin || extent.extent.ymin !== this.extentCheck.ymin)) {
                        this.setMarkerDisplay = true;
                        this.ctx.clearRect(0, 0, 260, 260);
                        domStyle.set('markerPixel', 'display', 'none');
                    } else {
                        this.setMarkerDisplay = false;
                    }
                    this.extentCheck = extent.extent;

                    if (this.polygons && this.polygons.rings.length > 0) {
                        this.computeHistogram(this.rasterLayer.renderingRule.functionArguments.Raster.functionArguments.Raster);
                    }
                    else {
                        this.computeHistogram(this.rasterLayer.renderingRule.functionArguments.Raster);
                    }
                }
                }));
                this.scatterLayer();
            },

            autoresize: function () {

                this.h = this.map.height;
                this.h = (parseInt((this.h / 5.5))).toString();
            },

            onClose: function () {
                this.ctx.clearRect(0, 0, 260, 260);
                domStyle.set('markerPixel', 'display', 'none');
                if (this.map.getLayer("resultLayer1")) {

                    if (this.map.getLayer("resultLayer1").updating) {
                        this.map.getLayer("resultLayer1").suspend();
                    }
                    this.map.removeLayer(this.map.getLayer("resultLayer1"));
                }
                this.closeFlag = true;

                for (var a in this.map.graphics.graphics) {
                    if ((this.map.graphics.graphics[a].geometry.type === "point" && this.map.graphics.graphics[a].symbol && this.map.graphics.graphics[a].symbol.color.r === 255) || this.map.graphics.graphics[a].geometry.type === "polygon") {
                        this.map.graphics.remove(this.map.graphics.graphics[a]);
                        break;
                    }
                }

                registry.byId("markedAreasScatter").set("checked", false);

                this.toolbarIdentify.deactivate();
                this.clear();
                if (this.mapClickHandler) {
                    this.mapClickHandler.remove();
                    this.mapClickHandler = null;
                }
                if (this.extentChangeHandler) {
                    this.extentChangeHandler.remove();
                    this.extentChangeHandler = null;
                }

                html.set(dom.byId("identifytab"), "");
                domStyle.set("onlyidentify", "display", "block");
                domStyle.set("identifysp", "display", "none");
                domStyle.set("scatterPlotContainer", "display", "none");
                this.hideLoading();
                domStyle.set("loadingLayerViewer", "display", "none");
                connect.publish("identify", [{ idenstatus: "close" }]);
            },

            checkSecondaryAndPrimary: function (point) {
                if (domClass.contains(document.getElementsByClassName("icon-node")[1], "jimu-state-selected")) {
                    ////this.primaryLayer = this.map.getLayer("primaryLayer");
                    if (this.primaryLayer && this.primaryLayer.visible) {
                        //this.primaryLayer = this.map.getLayer("primaryLayer");
                        var swipeXPosition = this.primaryLayer.getNode().style.clip.split(" ")[3];
                        swipeXPosition = parseInt(swipeXPosition.split("px")[0]);
                        if (parseInt(this.map.toScreen(point).x) < swipeXPosition && this.map.getLayer("secondaryLayer")) {
                            this.primaryLayer = this.map.getLayer("secondaryLayer");
                        }
                        else {
                            //this.primaryLayer = this.map.getLayer("primaryLayer");
                        }
                    } else if (this.map.getLayer("secondaryLayer")) {
                        this.primaryLayer = this.map.getLayer("secondaryLayer");
                    }
                    else {
                        //this.primaryLayer = this.map.getLayer("primaryLayer");
                    }

                } else {
                    //this.primaryLayer = this.map.getLayer("primaryLayer");
                }
                this.identifypara(point);
            },

            identifypara: function (point) {
                domStyle.set("loadingLayerViewer", "display", "block");
                if (this.primaryLayer.url === this.config.urlLandsatMS || this.primaryLayer.url === this.config.urlSentinel) {
                    domStyle.set("onlyidentify", "display", "block");
                }
                
               // this.primaryLayer = this.map.primaryLayer;
                this.clear();
                if (!this.primaryLayer.mosaicRule) {
                    this.mosaic = null;
                    this.identifypara2(point);
                } else {
                    this.mosaic = this.map.mosaicRule ? JSON.stringify(this.map.mosaicRule.toJson()) : JSON.stringify(this.primaryLayer.mosaicRule.toJson());



                    this.identifypara2(point);
                }


            },

            identifypara2: function (point) {
                if (registry.byId("tooltipDialogIntro") && registry.byId("tooltipDialogIntro").state === "open") {
                    popup.close(registry.byId("tooltipDialogIntro"));
                }
                var request2 = esriRequest({
                    url: this.primaryLayer.url + "/getSamples",
                    content: {
                        geometry: JSON.stringify(point.toJson()),
                        geometryType: "esriGeometryPoint",
                        returnGeometry: false,
                        returnFirstValueOnly: true,
                        outFields: ["*"],
                        pixelSize: [this.primaryLayer.pixelSizeX, this.primaryLayer.pixelSizeY],
                        mosaicRule: this.mosaic,
                        f: "json"
                    },
                    handleAs: "json",
                    callbackParamName: "callback"
                });

                request2.then(lang.hitch(this, function (data) {
                    var props = data.samples[0].attributes;
                    if (this.primaryLayer.url === this.config.urlSentinel || this.primaryLayer.url === this.config.urlDEA) {
                        html.set(dom.byId("identifytab"), "Scene ID: <b>" + props[this.nameLayer] + "</b><br />Acquisition Date: <b>" + locale.format(new Date(props[this.acquisitionDate]), { selector: "date", formatLength: "long" }) + "</b><br />Cloud Cover: <b>" + (props[this.cloudcover] * 100).toFixed(1) + "%</b<hr>");
                    } else if (this.primaryLayer.url === this.config.urlLandsatMS) {
                        html.set(dom.byId("identifytab"), "Scene ID: <b>" + props[this.nameLayer] + "</b><br />Acquisition Date: <b>" + locale.format(new Date(props[this.acquisitionDate]), { selector: "date", formatLength: "long" }) + "</b><br />Cloud Cover: <b>" + (props[this.cloudcover] * 100).toFixed(1) + "</b><br />Sun Elevation: <b>" + (props[this.sunElevation].toFixed(1)) + "</b><br />Sun Azimuth: <b>" + (props[this.sunAzimuth].toFixed(1)) + "%</b<hr>");
                    } else if (this.primaryLayer.url === this.config.urlNaip) {
                        html.set(dom.byId("identifytab"), "Scene ID: <b>" + props[this.nameLayer] + "</b><br />Acquisition Date: <b>" + locale.format(new Date(props[this.acquisitionDate]), { selector: "date", formatLength: "long" }) + "</b<hr>");
                    }
                    if (!this.centerFlag) {
                        this.spectralprofiles(data, point);
                    }
                    else {
                        this.centerFlag = false;
                        domStyle.set("identifysp", "display", "none");
                        if (this.primaryLayer.url === this.config.urlLandsatMS || this.primaryLayer.url === this.config.urlSentinel) {
                            domStyle.set("onlyidentify", "display", "block");
                        }
                       // domStyle.set("onlyidentify", "display", "block");
                        html.set(this.noinfo, "");

                        domStyle.set("loadingLayerViewer", "display", "none");
                        domConstruct.destroy("chartDialog1_underlay");
                    }
                }), lang.hitch(this, function (error) {

                    html.set(dom.byId("identifytab"), "");
                    html.set(this.noinfo, "No Information available");
                    domStyle.set("identifysp", "display", "none");

                    domStyle.set("loadingLayerViewer", "display", "none");


                    domConstruct.destroy("chartDialog1_underlay");
                }));
            },

            spectralprofiles: function (data2, evt2) {
                var values = data2.samples[0].value.split(' ');

                for (var a in values) {
                    if (values[a]) {
                        values[a] = parseInt(values[a], 10);
                    } else {
                        values[a] = 0;
                    }
                }
                var normalizedValues = [];
                if (this.primaryLayer.url === this.config.urlSentinel) {
                for (a in values) {
                    normalizedValues[a] = (values[a] / 10000);
                }
            } else if (this.primaryLayer.url === this.config.urlLandsatMS) {
                for (a = 0; a<8; a++) {
                    normalizedValues[a] = (values[a]) / (10000);
                }
            } else if (this.primaryLayer.url === this.config.urlDEA) {
                for (a = 0; a<12; a++) {
                    normalizedValues[a] = (values[a]) / (10000);
                }
            }

                this.chartData = [];
                for (a in normalizedValues) {
                    this.chartData.push(
                        {
                            tooltip: normalizedValues[a].toFixed(3),
                            y: normalizedValues[a]
                        });
                }

                if (this.primaryLayer.url === this.config.urlSentinel) {
                    var normalizedValues1 = this.config.cloud;
                } else if (this.primaryLayer.url === this.config.urlDEA) {
                    var normalizedValues1 = this.config.cloudL2A;
                }
                else {
                    var normalizedValues1 = this.config.a;
                }
                this.chartData1 = [];
                for (b in normalizedValues1) {
                    this.chartData1.push(
                        {
                            tooltip: normalizedValues1[b].toFixed(3),
                            y: normalizedValues1[b]
                        }
                    );
                }


                if (this.primaryLayer.url === this.config.urlSentinel) {
                    var normalizedValues2 = this.config.snow;
                } else if (this.primaryLayer.url === this.config.urlDEA) {
                    var normalizedValues2= this.config.snowL2A;
                }
                else {
                    var normalizedValues2 = this.config.b;
                }
                this.chartData2 = [];
                for (b in normalizedValues2) {
                    this.chartData2.push(
                        {
                            tooltip: normalizedValues2[b].toFixed(3),
                            y: normalizedValues2[b]
                        }
                    );
                }

                if (this.primaryLayer.url === this.config.urlSentinel) {
                    var normalizedValues3 = this.config.desert;
                } else if (this.primaryLayer.url === this.config.urlDEA) {
                    var normalizedValues3 = this.config.desertL2A;
                } else {
                    var normalizedValues3 = this.config.c;
                }
                this.chartData3 = [];
                for (b in normalizedValues3) {
                    this.chartData3.push(
                        {
                            tooltip: normalizedValues3[b].toFixed(3),
                            y: normalizedValues3[b]
                        }
                    );
                }

                if (this.primaryLayer.url === this.config.urlSentinel) {
                    var normalizedValues4 = this.config.drygrass;
                } else if (this.primaryLayer.url === this.config.urlDEA) {
                    var normalizedValues4 = this.config.drygrassL2A;
                } else {
                    var normalizedValues4 = this.config.d;
                }
                this.chartData4 = [];
                for (b in normalizedValues4) {
                    this.chartData4.push(
                        {
                            tooltip: normalizedValues4[b].toFixed(3),
                            y: normalizedValues4[b]
                        }
                    );
                }

                if (this.primaryLayer.url === this.config.urlSentinel) {
                    var normalizedValues5 = this.config.concrete;
                } else if (this.primaryLayer.url === this.config.urlDEA) {
                    var normalizedValues5 = this.config.concreteL2A;
                } else {
                    var normalizedValues5 = this.config.e;
                }
                this.chartData5 = [];
                for (b in normalizedValues5) {
                    this.chartData5.push(
                        {
                            tooltip: normalizedValues5[b].toFixed(3),
                            y: normalizedValues5[b]
                        }
                    );
                }

                if (this.primaryLayer.url === this.config.urlSentinel) {
                    var normalizedValues6 = this.config.lushgrass;
                } else if (this.primaryLayer.url === this.config.urlDEA) {
                    var normalizedValues6 = this.config.lushgrassL2A;
                } else {
                    var normalizedValues6 = this.config.f;
                }
                this.chartData6 = [];
                for (b in normalizedValues6) {
                    this.chartData6.push(
                        {
                            tooltip: normalizedValues6[b].toFixed(3),
                            y: normalizedValues6[b]
                        }
                    );
                }

                if (this.primaryLayer.url === this.config.urlSentinel) {
                    var normalizedValues7 = this.config.urban;
                } else if (this.primaryLayer.url === this.config.urlDEA) {
                    var normalizedValues7 = this.config.urbanL2A;
                } else {
                    var normalizedValues7 = this.config.g;
                }
                this.chartData7 = [];
                for (b in normalizedValues7) {
                    this.chartData7.push(
                        {
                            tooltip: normalizedValues7[b].toFixed(3),
                            y: normalizedValues7[b]
                        }
                    );
                }

                if (this.primaryLayer.url === this.config.urlSentinel) {
                    var normalizedValues10 = this.config.water;
                } else if (this.primaryLayer.url === this.config.urlDEA) {
                    var normalizedValues10 = this.config.waterL2A;
                } else {
                    var normalizedValues10 = this.config.j;
                }
                this.chartData10 = [];
                for (b in normalizedValues10) {
                    this.chartData10.push(
                        {
                            tooltip: normalizedValues10[b].toFixed(3),
                            y: normalizedValues10[b]
                        }
                    );
                }

                if (this.primaryLayer.url === this.config.urlSentinel) {
                    var normalizedValues9 = this.config.forest;
                } else if (this.primaryLayer.url === this.config.urlDEA) {
                    var normalizedValues9 = this.config.forestL2A;
                } else {
                    var normalizedValues9 = this.config.h;
                }
                this.chartData9 = [];
                for (b in normalizedValues9) {
                    this.chartData9.push(
                        {
                            tooltip: normalizedValues9[b].toFixed(3),
                            y: normalizedValues9[b]
                        }
                    );
                }

                if (this.primaryLayer.url === this.config.urlSentinel) {
                    var normalizedValues8 = this.config.rock;
                } else if (this.primaryLayer.url === this.config.urlDEA) {
                    var normalizedValues8 = this.config.rockL2A;
                } else {
                    var normalizedValues8 = this.config.i;
                }
                this.chartData8 = [];
                for (b in normalizedValues8) {
                    this.chartData8.push(
                        {
                            tooltip: normalizedValues8[b].toFixed(3),
                            y: normalizedValues8[b]
                        }
                    );
                }

                var sum1 = this.sumofdif(normalizedValues, normalizedValues1);
                var sum2 = this.sumofdif(normalizedValues, normalizedValues2);
                var sum3 = this.sumofdif(normalizedValues, normalizedValues3);
                var sum4 = this.sumofdif(normalizedValues, normalizedValues4);
                var sum5 = this.sumofdif(normalizedValues, normalizedValues5);
                var sum6 = this.sumofdif(normalizedValues, normalizedValues6);
                var sum7 = this.sumofdif(normalizedValues, normalizedValues7);
                var sum8 = this.sumofdif(normalizedValues, normalizedValues8);
                var sum9 = this.sumofdif(normalizedValues, normalizedValues9);
                var sum10 = this.sumofdif(normalizedValues, normalizedValues10);
                var sums = [];
                sums.push(
                    {
                        id: 1,
                        value: sum1
                    });
                sums.push(
                    {
                        id: 2,
                        value: sum2
                    });
                sums.push(
                    {
                        id: 3,
                        value: sum3
                    });
                sums.push(
                    {
                        id: 4,
                        value: sum4
                    });
                sums.push(
                    {
                        id: 5,
                        value: sum5
                    });
                sums.push(
                    {
                        id: 6,
                        value: sum6
                    });
                sums.push(
                    {
                        id: 7,
                        value: sum7
                    });
                sums.push(
                    {
                        id: 8,
                        value: sum8
                    });
                sums.push(
                    {
                        id: 9,
                        value: sum9
                    });
                sums.push(
                    {
                        id: 10,
                        value: sum10
                    });

                var key1 = this.selectprofile(sums);



                this.axesParams = [];

                //var bandNames = ["Coastal", "Blue", "Green", "Red", "VRE", "VRE", "VRE", "NIR", "VRE", "Water Vapor", "Cirrus", "SWIR 1", "SWIR 2"];
                for (a in this.bandNames1) {
                    this.axesParams[a] = {
                        value: parseInt(a) + 1,
                        text: this.bandNames1[a]
                    };
                }

                if (this.primaryLayer.url === this.config.urlLandsatMS || this.primaryLayer.url === this.config.urlSentinel || this.primaryLayer.url === this.config.urlDEA) {
                    
                    domStyle.set("identifysp", "display", "block");
                
                }
                registry.byId("type").set("checked", "true");
                html.set(this.noinfo, "");           

                this.chart = new Chart("chartNode1");
                this.chart.addPlot("default", {
                    type: "Lines",
                    markers: true,
                    tension: "S",
                    shadows: { dx: 4, dy: 4 }
                });
                this.chart.setTheme(theme);
                this.chart.setWindow(1, 1, -1, 0);

                this.count = 1;

                this.chart.addAxis("y", { vertical: true, fixLower: "major", fixUpper: "major", title: "Data Values", titleOrientation: "axis" });


                this.chart.addAxis("x", { labels: this.axesParams, labelSizeChange: true, title: "Spectral Bands", titleOrientation: "away", minorTicks: false, majorTickStep: 1 });

                this.chart.addSeries("Selected Point", this.chartData);
                this.chart.addSeries("Cloud", this.chartData1, { stroke: { color: "#1E2457", width: 1.5 }, fill: "#1E2457", hidden: this.hiddentrue(1, key1) });
                this.chart.addSeries("Snow/Ice", this.chartData2, { stroke: { color: "#A5F2F3", width: 1.5 }, fill: "#A5F2F3", hidden: this.hiddentrue(2, key1) });
                this.chart.addSeries("Desert", this.chartData3, { stroke: { color: "#ECC5A8", width: 1.5 }, fill: "#ECC5A8", hidden: this.hiddentrue(3, key1) });
                this.chart.addSeries("Dry Grass", this.chartData4, { stroke: { color: "#DAA520", width: 1.5 }, fill: "#DAA520", hidden: this.hiddentrue(4, key1) });
                this.chart.addSeries("Concrete", this.chartData5, { stroke: { color: "gray", width: 1.5 }, fill: "gray", hidden: this.hiddentrue(5, key1) });
                this.chart.addSeries("Lush Grass", this.chartData6, { stroke: { color: "#7cfc00", width: 1.5 }, fill: "#7cfc00", hidden: this.hiddentrue(6, key1) });
                this.chart.addSeries("Urban", this.chartData7, { stroke: { color: "teal", width: 1.5 }, fill: "teal", hidden: this.hiddentrue(7, key1) });
                this.chart.addSeries("Rock", this.chartData8, { stroke: { color: "#5A4D41", width: 1.5 }, fill: "#5A4D41", hidden: this.hiddentrue(8, key1) });
                this.chart.addSeries("Forest", this.chartData9, { stroke: { color: "forestgreen", width: 1.5 }, fill: "forestgreen", hidden: this.hiddentrue(9, key1) });
                this.chart.addSeries("Water", this.chartData10, { stroke: { color: "#40a4df", width: 1.5 }, fill: "#40a4df", hidden: this.hiddentrue(10, key1) });

                this.toolTip = new Tooltip(this.chart, "default");
                this.magnify = new Magnify(this.chart, "default");
                this.chart.render();
                if (!this.legend) {
                    this.legend = new SelectableLegend({ chart: this.chart, horizontal: false, outline: false }, "legend1");
                }
                else {
                    this.legend.set("params", { chart: this.chart, horizontal: true, outline: false });
                    this.legend.set("chart", this.chart);
                    this.legend.refresh();
                }

                this.numberLegend = parseInt((this.legend._cbs[0].id).split("Box_")[1]);
                for (var a = this.numberLegend; a < (this.numberLegend + 11); a++) {
                    on(document.getElementById("dijit_form_CheckBox_" + a), "click", lang.hitch(this, function (e) {
                        if (e.ctrlKey) {

                            for (var b = this.numberLegend; b < (this.numberLegend + 11); b++) {
                                if (("dijit_form_CheckBox_" + b) !== e.target.id && document.getElementById("dijit_form_CheckBox_" + b).checked !== e.target.checked) {
                                    document.getElementById("dijit_form_CheckBox_" + b).click();
                                }
                            }
                        }
                    }));
                }
                domConstruct.destroy("chartDialog1_underlay");
                domStyle.set("loadingLayerViewer", "display", "none");
            },

            computeHistogram: function (raster) {
                var xdistance = this.map.extent.xmax - this.map.extent.xmin;
                var ydistance = this.map.extent.ymax - this.map.extent.ymin;
                this.pixelSizeX = xdistance / this.map.width;
                this.pixelSizeY = ydistance / this.map.height;
                if (this.polygons && this.polygons.rings.length > 0) {
                    var geometry = this.polygons;
                    var type = "esriGeometryPolygon";
                } else {
                    var geometry = this.map.extent;
                    var type = "esriGeometryEnvelope";
                }
                if (!this.primaryLayer.mosaicRule) {
                    this.mosaic = null;
                } else {
                    this.mosaic = this.map.mosaicRule ? JSON.stringify(this.map.mosaicRule.toJson()) : JSON.stringify(this.primaryLayer.mosaicRule.toJson());
                }
                var request = new esriRequest({
                    url: this.primaryLayer.url + "/computehistograms",
                    content: {
                        f: "json",
                        geometry: JSON.stringify(geometry.toJson()),
                        geometryType: type,
                        renderingRule: JSON.stringify(raster.toJson()),
                        pixelSize: '{"x":' + this.pixelSizeX + ', "y":' + this.pixelSizeY + '}',
                        mosaicRule: this.mosaic
                    },
                    handleAs: "json",
                    callbackParamName: "callback"
                });
                request.then(lang.hitch(this, function (result) {
                    this.xmin = result.histograms[0].min;
                    this.xmax = result.histograms[0].max;
                    this.ymin = result.histograms[1].min;
                    this.ymax = result.histograms[1].max;
                    document.getElementById("xmin").innerHTML = parseFloat(this.xmin / 10000).toFixed(2);
                    document.getElementById("xmax").innerHTML = parseFloat(this.xmax / 10000).toFixed(2);
                    document.getElementById("ymax").innerHTML = parseFloat(this.ymax / 10000).toFixed(2);
                    document.getElementById("ymin").innerHTML = parseFloat(this.ymin / 10000).toFixed(2);
                }));
            },

            eventsOnCanvas: function () {
                var canvas = document.getElementById("scatterPlotCanvas");
                this.ctx = canvas.getContext('2d');
                this.ctx.strokeStyle = this.myColor.colors.draw.toHex();
                this.ctx.lineJoin = "round";
                this.ctx.lineWidth = 3;
                this.ctx.fillStyle = "#fff";
                this.createGraph();
                canvas.addEventListener("mousedown", lang.hitch(this, function (e) {
                    this.paint = true;
                    if (this.clickX.length > 0) {

                        var pData = this.ctx.getImageData(4, 0, 256, 256);
                        pData.data.set(this.saveOriginalGraph);
                        this.ctx.clearRect(0, 0, 4, 260);
                        this.ctx.clearRect(0, 256, 260, 4);
                        this.ctx.putImageData(pData, 4, 0);
                    }
                    this.clickX = [];
                    this.clickY = [];
                    this.clickX.push(e.offsetX);
                    this.clickY.push(e.offsetY);
                    this.ctx.beginPath();
                }));

                canvas.addEventListener("mousemove", lang.hitch(this, function (e) {
                    if (this.paint) {
                        this.ctx.moveTo(this.clickX[this.clickX.length - 1], this.clickY[this.clickY.length - 1]);
                        this.ctx.lineTo(e.offsetX, e.offsetY);
                        this.ctx.stroke();
                        this.clickX.push(e.offsetX);
                        this.clickY.push(e.offsetY);
                    }
                }));
                canvas.addEventListener("mouseup", lang.hitch(this, function (e) {
                    this.paint = false;

                    this.clickX.push(e.offsetX);
                    this.clickY.push(e.offsetY);

                    this.ctx.beginPath();
                    this.ctx.moveTo(this.clickX[0], this.clickY[0]);
                    for (var i = 0; i < this.clickX.length; i++) {
                        this.ctx.lineTo(this.clickX[i], this.clickY[i]);
                    }
                    this.ctx.fill();
                    this.ctx.stroke();
                    this.ctx.moveTo(this.clickX[0], this.clickY[0]);
                    this.ctx.lineTo(e.offsetX, e.offsetY);
                    this.ctx.stroke();

                    if (this.clickX.length > 3) {
                        this._deselectPix();
                    } else {
                        this.clickX = [];
                        this.clickY = [];
                    }
                    this.newDrawing = true;
                    // if (this.map.getLayer("resultLayer1")) {
                    //     var layer = this.map.getLayer("resultLayer1");
                    //     // if (params.mosaicRule) {
                    //     //     layer.setMosaicRule(params.mosaicRule, true);
                    //     // }
                    //     // layer.setRenderingRule(params.renderingRule, false);
                    //     this.rasterLayer = layer;
                    // }
                    this.rasterLayer.redraw();
                    this.trueClickX = [];
                    this.trueClickY = [];

                    for (var g = 0; g < this.clickX.length; g++) {
                        this.trueClickX[g] = this.xmin + parseInt(this.clickX[g] * (this.xmax - this.xmin) / 255);
                        this.trueClickY[g] = this.ymin + parseInt((255 - this.clickY[g]) * (this.ymax - this.ymin) / 255);
                    }
                }));
            },

            _deselectPix: function () {
                var ramp = this.myColor.freqRamp;
                var drawClr = this.myColor.colors.draw;
                var pData = this.ctx.getImageData(4, 0, 256, 256);
                for (var i = 0; i < pData.height; i++) {
                    for (var j = 0; j < pData.width; j++) {
                        var idx = (i * pData.width + j) * 4;
                        if (pData.data[idx] === 255 && pData.data[idx + 1] === 255 && pData.data[idx + 2] === 255) {
                            pData.data[idx] = this.saveOriginalGraph[idx];
                            pData.data[idx + 1] = this.saveOriginalGraph[idx + 1];
                            pData.data[idx + 2] = this.saveOriginalGraph[idx + 2];
                            pData.data[idx + 3] = this.saveOriginalGraph[idx + 3];

                        } else if (ramp.cover(pData.data[idx], pData.data[idx + 1], pData.data[idx + 2])) {
                            pData.data[idx] = this.myColor.colors.disabled.r;
                            pData.data[idx + 1] = this.myColor.colors.disabled.g;
                            pData.data[idx + 2] = this.myColor.colors.disabled.b;
                            pData.data[idx + 3] = Math.round(this.myColor.colors.disabled.a * 255);
                        }
                    }

                }
                this.ctx.putImageData(pData, 4, 0);
            },

            scatterLayer: function () {
                this.ctx.clearRect(0, 0, 260, 260);
                domStyle.set('markerPixel', 'display', 'none');
                dom.byId("yBandName").innerHTML = this.bandNames[parseInt(registry.byId("yBand").get("value"))];
                dom.byId("xBandName").innerHTML = this.bandNames[parseInt(registry.byId("xBand").get("value"))];
                // var y = document.getElementsByClassName("icon-node");
                // if (domClass.contains(y[0], "jimu-state-selected")) {
                //     y[0].click();
                // }
                // else if (domClass.contains(y[1], "jimu-state-selected")) {
                //     y[1].click();
                // }
                if (this.scatterFlag === 1) {
                    if (this.map.getLayer("resultLayer")) {
                        this.map.removeLayer(this.map.getLayer("resultLayer"));
                    }
                }

                if (this.clickX.length > 0) {
                    this.clickX = [];
                    this.clickY = [];
                }

                var extractBand1 = new RasterFunction();
                extractBand1.functionName = "ExtractBand";
                var extractBandArg = {};
                extractBandArg.BandIds = [parseInt(registry.byId("xBand").get("value")), parseInt(registry.byId("yBand").get("value"))];

                extractBand1.functionArguments = extractBandArg;
                this.computeHistogram(extractBand1);

                var stretch = new RasterFunction();
                stretch.functionName = "Stretch";
                var stretchArg = {};
                stretchArg.StretchType = 6;
                stretchArg.DRA = true;
                stretchArg.Min = 0;
                stretchArg.Max = 255;
                stretchArg.MinPercent = 0.1;
                stretchArg.MaxPercent = 0.1;
                stretchArg.Raster = extractBand1;
                stretch.functionArguments = stretchArg;
                stretch.outputPixelType = "U8";

                if (this.polygons && this.polygons.rings.length > 0) {
                    var rasterClip = new RasterFunction();
                    rasterClip.functionName = "Clip";
                    var clipArguments = {};
                    clipArguments.ClippingGeometry = this.polygons;
                    clipArguments.ClippingType = 1;
                    clipArguments.Raster = extractBand1;
                    rasterClip.functionArguments = clipArguments;
                    stretch.functionArguments.Raster = rasterClip;
                }

                var raster = stretch;
                var params = new ImageServiceParameters();
                params.renderingRule = raster;
                params.format = "lerc";
                params.lercVersion = 1;
                params.compressionTolerance = 0.5;

                if (this.primaryLayer.mosaicRule) {
                    params.mosaicRule = this.primaryLayer.mosaicRule;
                }
                if (this.map.getLayer("resultLayer1")) {
                    var layer = this.map.getLayer("resultLayer1");
                    if (params.mosaicRule) {
                        layer.setMosaicRule(params.mosaicRule, true);
                    }
                    layer.setRenderingRule(params.renderingRule, false);
                    //this.rasterLayer = layer;
                } else {
                    this.rasterLayer = new RasterLayer(this.primaryLayer.url, {
                        id: "resultLayer1",
                        imageServiceParameters: params,
                        visible: true,
                        pixelFilter: lang.hitch(this, this.pixelFilter)
                    });
                    for (var a = this.map.layerIds.length - 1; a >= 0; a--) {
                        if (this.map.layerIds[a] === this.primaryLayer.id) {
                            this.map.addLayer(this.rasterLayer, a + 1);
                            break;
                        }
                    }
                }
                //this.eventsOnCanvas();
            },

            pixelFilter: function (pixelData) {
                if (!this.newDrawing) {
                    this.xBand = pixelData.pixelBlock.pixels[0];
                    this.yBand = pixelData.pixelBlock.pixels[1];

                    if (!pixelData.pixelBlock.mask) {
                        pixelData.pixelBlock.mask = new Uint8Array(this.xBand.length);
                    }


                    var x, y;
                    this.coordinates = [];

                    for (var a = 0; a < pixelData.pixelBlock.pixels[0].length; a++) {
                        if (this.xBand[a] === pixelData.pixelBlock.statistics[0].noDataValue || this.yBand[a] === pixelData.pixelBlock.statistics[1].noDataValue) {
                            x = -1;
                            y = -1;
                        } else {
                            x = this.xBand[a];
                            y = this.yBand[a];
                        }

                        this.coordinates[a] = x + "," + y;
                    }

                    this.counts = {};
                    for (var b = 0; b < this.coordinates.length; b++) {
                        if (this.coordinates[b] !== "-1, -1") {
                            var num = this.coordinates[b];
                            this.counts[num] = this.counts[num] ? this.counts[num] + 1 : 1;
                        }
                    }
                    for (var c in this.counts) {
                        this.counts[c] = this.myColor.freqRamp.colorAt(this.counts[c]);
                    }

                    this.createGraph();
                    if (this.clickX.length > 0) {
                        this.maintainDrawnFigure();
                    }
                } else {
                    this.newDrawing = false;
                    if (!pixelData.pixelBlock.mask) {
                        pixelData.pixelBlock.mask = new Uint8Array(pixelData.pixelBlock.width * pixelData.pixelBlock.height);
                    }
                }

                var pr = new Uint8Array(this.coordinates.length);
                var pg = new Uint8Array(this.coordinates.length);
                var pb = new Uint8Array(this.coordinates.length);


                if (this.clickX.length <= 3) {
                    this.clickX = [];
                    this.clickY = [];
                    for (var f = 0; f < this.coordinates.length; f++) {
                        pixelData.pixelBlock.mask[f] = 0;
                    }
                } else {
                    var imageData = this.ctx.getImageData(4, 0, 256, 256);
                    var drawClr = this.myColor.colors.draw;
                    for (var f = 0; f < this.coordinates.length; f++) {
                        var coordinates = this.coordinates[f].split(",");
                        var index = (parseInt(coordinates[0]) * 4) + ((255 - parseInt(coordinates[1])) * 1024);

                        if (imageData.data[index] && (this.cover(imageData.data[index], imageData.data[index + 1], imageData.data[index + 2]))) {
                            pr[f] = drawClr.r;
                            pg[f] = drawClr.g;
                            pb[f] = drawClr.b;
                            pixelData.pixelBlock.mask[f] = 1;
                        } else {
                            pixelData.pixelBlock.mask[f] = 0;
                        }
                    }
                    pixelData.pixelBlock.pixels = [pr, pg, pb];
                    pixelData.pixelBlock.pixelType = "U8";                    
                }
            },

            maintainDrawnFigure: function () {
                for (var g = 0; g < this.clickX.length; g++) {
                    this.clickX[g] = parseInt(((this.trueClickX[g] - this.xmin) / (this.xmax - this.xmin)) * 255);
                    this.clickY[g] = 255 - parseInt(((this.trueClickY[g] - this.ymin) / (this.ymax - this.ymin)) * 255);
                    if (this.clickX[g] > 255) {
                        this.clickX[g] = 259;
                    }
                    else if (this.clickX[g] < 4) {
                        this.clickX[g] = 0;
                    }
                    if (this.clickY[g] > 255) {
                        this.clickY[g] = 259;
                    }
                    else if (this.clickY[g] < 4) {
                        this.clickY[g] = 0;
                    }
                }

                this.ctx.beginPath();
                this.ctx.moveTo(this.clickX[0], this.clickY[0]);
                for (var i = 0; i < this.clickX.length; i++) {
                    this.ctx.lineTo(this.clickX[i], this.clickY[i]);
                }
                this.ctx.fill();
                this.ctx.stroke();
                this.ctx.moveTo(this.clickX[0], this.clickY[0]);
                this.ctx.lineTo(this.clickX[this.clickX.length - 1], this.clickY[this.clickY.length - 1]);
                this.ctx.stroke();
                if (this.clickX.length > 3) {
                    this._deselectPix();
                }
                this.newDrawing = true;
                this.rasterLayer.redraw();
            },

            cover: function (r, g, b) {
                if (r === this.myColor.colors.disabled.r && g === this.myColor.colors.disabled.g && b === this.myColor.colors.disabled.b) {
                    return false;
                }
                else if (r === this.myColor.colors.background.r && g === this.myColor.colors.background.g && b === this.myColor.colors.background.b) {
                    return false;
                }
                return true;
            },

            createGraph: function () {
                var canvas = document.getElementById("scatterPlotCanvas");
                var ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, 260, 260);
                var imageData = ctx.getImageData(4, 0, 256, 256);
                var pixels = imageData.data;
                for (var i in this.counts) {
                    var value = i.split(",");
                    var x = parseInt(value[0]);
                    var y = parseInt(value[1]);
                    var index = (255 - y) * 1024 + x * 4;
                    pixels[index] = this.counts[i].r;
                    pixels[index + 1] = this.counts[i].g;
                    pixels[index + 2] = this.counts[i].b;
                    pixels[index + 3] = Math.round(255 * this.counts[i].a);
                }
                this.saveOriginalGraph = pixels;
                ctx.putImageData(imageData, 4, 0);
            },

            refreshData: function () {

                if (this.map.layerIds) {
                    if (this.primaryLayer.url === this.config.urlSentinel) {
                        this.bandNames1 = ["Coastal", "Blue", "Green", "Red", "VRE", "VRE", "VRE", "NIR", "VRE", "Water Vapor", "Cirrus", "SWIR 1", "SWIR 2"];
                        this.bandNames = ["Coastal", "Blue", "Green", "Red", "VRE", "VRE", "VRE", "NIR", "VRE", "Water_Vapor", "Cirrus", "SWIR_1", "SWIR_2"];
                    } else if (this.primaryLayer.url === this.config.urlDEA) {
                        this.bandNames = ["Coastal", "Blue", "Green", "Red", "VRE", "VRE", "VRE", "NIR", "NarrowNIR", "Water_Vapor", "SWIR_1", "SWIR_2"];
                        this.bandNames1 = ["Coastal", "Blue", "Green", "Red", "VRE", "VRE", "VRE", "NIR", "NarrowNIR", "Water Vapor", "SWIR 1", "SWIR 2"];

                    }
                    else {
                        this.bandNames1 = ["Coastal", "Blue", "Green", "Red", "NIR", "SWIR 1", "SWIR 2", "Cirrus", "QA", "Thermal Infrared1", "Thermal Infrared2"];
                        this.bandNames = ["Coastal", "Blue", "Green", "Red", "NIR", "SWIR_1", "SWIR_2", "Cirrus", "QA", "Thermal Infrared1", "Thermal Infrared2"];
                    }
                }

            },


            addGraphic2: function (geometry) {
                registry.byId("clipScatter").set("disabled", false);
                var symbol = new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new Color([200, 0, 0]), 2);
                var graphic = new esri.Graphic(geometry, symbol);
                this.map.graphics.add(graphic);
                this.polygons.addRing(geometry.rings[0]);
            },

            markDataInChart: function (e) {
                if (!this.turnOffClick) {                    
                    var index = e.offsetX + (e.offsetY * this.map.width);
                    var x = this.xmin + parseInt((this.xBand[index] / 255) * (this.xmax - this.xmin));
                    var y = this.ymin + parseInt((this.yBand[index] / 255) * (this.ymax - this.ymin));
                    this.pointTooltip.set('label', x + ',' + y);
                    var coordinate = this.coordinates[index].split(",");
                    var top = document.getElementById("scatterPlotCanvas").offsetTop + 255 - parseInt(coordinate[1]) - 8;//subtract image height
                    var left = document.getElementById("scatterPlotCanvas").offsetLeft + 4 + parseInt(coordinate[0]) - 8;//subtract half the image width
                    domStyle.set('markerPixel', 'top', top + 'px');
                    domStyle.set('markerPixel', 'left', left + 'px');
                    if (!this.setMarkerDisplay) {
                        domStyle.set('markerPixel', 'display', 'block');
                    }
                    else {
                        this.setMarkerDisplay = false;
                    }
                }
            },

            displaysp: function () {
                if (registry.byId("type").checked) {
                    domStyle.set("chartshow1", "display", "block");
                    domStyle.set("typical", "display", "block");

                } else {
                    domStyle.set("chartshow1", "display", "none");
                    domStyle.set("typical", "display", "none");
                }
            },

            clear: function () {
                if (registry.byId("type").checked) {
                    registry.byId("type").set("checked", "false");
                }
                if (this.chart) {
                    dojo.empty("chartNode1");
                }
            },

            sumofdif: function (pointclick, prevprofile) {
                var sum = [];
                var summ = 0;
                for (a in pointclick) {
                    sum[a] = ((pointclick[a] - prevprofile[a]) * (pointclick[a] - prevprofile[a]));
                    summ = summ + sum[a];
                }
                return summ;
            },

            selectprofile: function (sums) {
                sums.sort(function (a, b) {
                    return (parseFloat(a.value) - parseFloat(b.value))
                });
                var key = sums[0].id;
                return (key);
            },

            hiddentrue: function (id1, id) {
                if (id1 === id) {
                    return false;
                } else {
                    return true;
                }
            },

            showLoading: function () {
                if (dom.byId("loadingLayerViewer")) {
                    domStyle.set("loadingLayerViewer", "display", "block");
                }
            },

            hideLoading: function () {
                if (dom.byId("loadingLayerViewer")) {
                    domStyle.set("loadingLayerViewer", "display", "none");
                }
            }
        });
        clazz.hasLocale = false;
        clazz.hasSettingPage = false;
        clazz.hasSettingUIFile = false;
        clazz.hasSettingLocale = false;
        clazz.hasSettingStyle = false;
        return clazz;
    });
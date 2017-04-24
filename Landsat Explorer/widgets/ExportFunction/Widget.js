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
    'dojo/text!./Widget.html',
    'jimu/BaseWidget',
    "dojo/on",
    "dijit/registry",
    "dojo/_base/lang",
    "dojo/dom",
    "esri/layers/RasterFunction",
    "dojo/html",
    "dijit/popup",
    'dojo/dom-class',
    "dojo/dom-construct",
    "dojo/dom-attr",
    "dojo/dom-style",
    "esri/toolbars/draw",
    "dojo/_base/connect",
    "esri/Color",
    "jimu/PanelManager",
],
        function (
                declare,
                _WidgetsInTemplateMixin,
                template,
                BaseWidget,
                on,
                registry,
                lang,
                dom,
                RasterFunction,
                html, popup, domClass,
                domConstruct, domAttr,
                domStyle, Draw, connect, Color,
                PanelManager) {
            var pm = PanelManager.getInstance();
            var clazz = declare([BaseWidget, _WidgetsInTemplateMixin], {
                templateString: template,
                name: 'ExportFunction',
                baseClass: 'jimu-widget-ExportFunction',
                primaryLayer: null,
                secondaryLayer: null,
                firstMosaic: null,
                secondMosaic: null,
                startup: function () {
                    this.inherited(arguments);
                    this.link = domConstruct.toDom('<a href="none" download id="linkDownload" style="display: none;">ExportImage</a>');
                    domConstruct.place(this.link, this.domNode);
                    domConstruct.place('<img id="loadingExport" style="position: absolute;top:0;bottom: 0;left: 0;right: 0;margin:auto;z-index:100;" src="' + require.toUrl('jimu') + '/images/loading.gif">', this.domNode);
                    this.resizeExportWidget();
                },
                resizeExportWidget: function () {
                    if (window.innerWidth < 620) {
                        domStyle.set("Export", "font-size", "7px");
                        domStyle.set("Export", "width", "220px");
                        domStyle.set("Export", "height", "190px");
                    } else if (window.innerWidth < 850) {
                        domStyle.set("Export", "font-size", "8px");
                        domStyle.set("Export", "width", "240px");
                        domStyle.set("Export", "height", "200px");
                    } else {
                        domStyle.set("Export", "font-size", "12px");
                        domStyle.set("Export", "width", "340px");
                        domStyle.set("Export", "height", "263px");
                    }
                },
                onOpen: function () {
                    this.tutorialExport();
                    window.addEventListener("resize", lang.hitch(this, function () {
                        if (registry.byId("tooltipDialogIntro") && registry.byId("tooltipDialogIntro").state === "open" && (registry.byId("tutorialStage").get("value") === "32")) {
                            popup.open({
                                popup: registry.byId("tooltipDialogIntro"),
                                orient: ["after-centered"],
                                around: document.getElementsByClassName("icon-node")[5]
                            });
                            domStyle.set(registry.byId("tooltipDialogIntro").connectorNode, "top", "0px");
                            var icon = document.getElementsByClassName("icon-node");
                            for (var a = 0; a < icon.length; a++) {
                                if (a !== 9 && a !== 5)
                                    icon[a].style.pointerEvents = "none";
                            }

                        } else if (registry.byId("tooltipDialogIntro") && registry.byId("tooltipDialogIntro").state === "open" && registry.byId("tutorialStage").get("value") === "39") {
                            var icon = document.getElementsByClassName("icon-node");
                            for (var a = 0; a < icon.length; a++) {
                                if (a !== 9 && a !== 8)
                                    icon[a].style.pointerEvents = "none";
                            }
                        } else if (registry.byId("tooltipDialogIntro") && registry.byId("tooltipDialogIntro").state === "open") {
                            var icon = document.getElementsByClassName("icon-node");
                            for (var a = 0; a < icon.length; a++) {
                                if (a !== 9)
                                    icon[a].style.pointerEvents = "none";
                            }
                        }
                    }));
                    if (registry.byId("bandCombinationDialog") && registry.byId("bandCombinationDialog").open)
                        registry.byId("bandCombinationDialog").hide();
                    if (registry.byId("maskDialog") && registry.byId("maskDialog").open)
                        registry.byId("maskDialog").hide();
                    if (registry.byId("changeDetectionDialog") && registry.byId("changeDetectionDialog").open)
                        registry.byId("changeDetectionDialog").hide();
                    if (registry.byId("timeDialog") && registry.byId("timeDialog").open)
                        registry.byId("timeDialog").hide();

                    this.hideLoading();
                    var widthMax = this.map.width;

                    var width = (this.map.extent.xmax - this.map.extent.xmin);
                    var height = (this.map.extent.ymax - this.map.extent.ymin);

                    var psx = width / widthMax;
                    var psy = height / widthMax;
                    var ps = Math.max(psx, psy, 30);
                    var ps = parseFloat(ps) + 0.001;
                    registry.byId("pixelSize").set("value", ps.toFixed(3) + " m");
                    var mapCenter = this.map.extent.getCenter();

                    var y = Math.pow(2.718281828, (mapCenter.y / 3189068.5));

                    var sinvalue = (y - 1) / (y + 1);
                    var y1 = Math.asin(sinvalue) / 0.017453292519943295;

                    var x = mapCenter.x / 6378137.0;
                    x = x / 0.017453292519943295;
                    var utm = parseInt((x + 180) / 6) + 1;
                    if (y1 > 0)
                        var wkid = 32600 + utm;
                    else
                        var wkid = 32500 + utm;
                    if (registry.byId("outputSp").getOptions())
                        registry.byId("outputSp").removeOption(registry.byId('outputSp').getOptions());
                    if (utm !== 1) {
                        registry.byId("outputSp").addOption({label: "WGS84 UTM Zone " + (utm - 1) + "", value: wkid - 1});
                    } else
                        registry.byId("outputSp").addOption({label: "WGS84 UTM Zone " + (utm + 59) + "", value: wkid + 59});
                    registry.byId("outputSp").addOption({label: "WGS84 UTM Zone " + utm + "", value: wkid});
                    if (utm !== 60)
                        registry.byId("outputSp").addOption({label: "WGS84 UTM Zone " + (utm + 1) + "", value: wkid + 1});
                    else
                        registry.byId("outputSp").addOption({label: "WGS84 UTM Zone " + utm - 59 + "", value: wkid - 59});
                    registry.byId("outputSp").set("value", wkid);
                    this.extentchangeHandler = this.map.on("extent-change", lang.hitch(this, this.updateValues));


                },
                tutorialExport: function () {
                    if (registry.byId("tooltipDialogIntro") && registry.byId("tooltipDialogIntro").state === "open" && (registry.byId("tutorialStage").get("value") === "29")) {
                        var tooltipTemp = registry.byId("tooltipDialogIntro");
                        popup.close(tooltipTemp);
                        tooltipTemp.set("content", "<p style='text-align:justify;'>You can specify the <span style='color:orange;font-weight:bolder;'>input pixel size</span> and <span style='color:orange;font-weight:bolder;'>output spatial reference.</span> If <span style='color:orange;font-weight:bolder;'>'Current Renderer'</span> is checked, then the rendering stretch is applied; otherwise the original data values are returned. You can also check <span style='color:orange;font-weight:bolder;'>Define Extent</span> and draw a polygon around what you'd like to export.</p>In this case, leave the defaults. <div id='continueComment' style='display:inline;color:orange;font-weight:bolder;cursor:pointer;'>Click here to continue.</div>");
                        popup.open({
                            parent: registry.byId("Export"),
                            popup: tooltipTemp,
                            orient: ["below"],
                            around: registry.byId("export").domNode,
                            onClose: lang.hitch(this, function () {
                                domStyle.set(tooltipTemp._popupWrapper, "display", "block");
                            })
                        });
                        document.getElementsByClassName("icon-node")[7].style.pointerEvents = "none";
                        domStyle.set(tooltipTemp.connectorNode, "top", "0px");
                        registry.byId("tutorialStage").set("value", "30");
                        on(dom.byId("continueComment"), "click", lang.hitch(this, function () {
                            tooltipTemp.set("content", "To download  the top map layer, check <span style='color:orange;font-weight:bolder;'>'Current Renderer'</span> and then click <span style='color:orange;font-weight:bolder;'>'Export'</span>.")
                            popup.open({
                                parent: registry.byId("Export"),
                                popup: tooltipTemp,
                                orient: ["below"],
                                around: registry.byId("export").domNode,
                                onClose: lang.hitch(this, function () {
                                    domStyle.set(tooltipTemp._popupWrapper, "display", "block");
                                })
                            });
                            domStyle.set(tooltipTemp.connectorNode, "top", "0px");
                            registry.byId("tutorialStage").set("value", "31");
                        }));
                    }
                },
                postCreate: function () {
                    window.addEventListener("resize", lang.hitch(this, this.resizeExportWidget));
                    registry.byId("export").on("click", lang.hitch(this, this.exportFunction));
                    registry.byId("extent").on("change", lang.hitch(this, this.activatePolygon));

                    registry.byId("outputSp").on("change", lang.hitch(this, this.tutorialExport));
                    if (this.map) {

                        this.toolbarForExport = new Draw(this.map);
                        dojo.connect(this.toolbarForExport, "onDrawEnd", lang.hitch(this, this.getExtent));


                    }

                },
                updateValues: function (info) {
                    if (info.levelChange) {
                        var widthMax = this.map.width;

                        var width = (this.map.extent.xmax - this.map.extent.xmin);
                        var height = (this.map.extent.ymax - this.map.extent.ymin);

                        var psx = width / widthMax;
                        var psy = height / widthMax;
                        var ps = Math.max(psx, psy, 30);
                        var ps = parseFloat(ps) + 0.001;
                        registry.byId("pixelSize").set("value", ps.toFixed(3) + " m");
                    }
                    var mapCenter = this.map.extent.getCenter();
                    var y = Math.pow(2.718281828, (mapCenter.y / 3189068.5));

                    var sinvalue = (y - 1) / (y + 1);
                    var y1 = Math.asin(sinvalue) / 0.017453292519943295;

                    var x = mapCenter.x / 6378137.0;
                    x = x / 0.017453292519943295;
                    var utm = parseInt((x + 180) / 6) + 1;
                    if (y1 > 0)
                        var wkid = 32600 + utm;
                    else
                        var wkid = 32500 + utm;
                    if (registry.byId("outputSp").getOptions())
                        registry.byId("outputSp").removeOption(registry.byId('outputSp').getOptions());
                    if (utm !== 1) {
                        registry.byId("outputSp").addOption({label: "WGS84 UTM Zone " + (utm - 1) + "", value: wkid - 1});
                    } else
                        registry.byId("outputSp").addOption({label: "WGS84 UTM Zone " + (utm + 59) + "", value: wkid + 59});
                    registry.byId("outputSp").addOption({label: "WGS84 UTM Zone " + utm + "", value: wkid});
                    if (utm !== 60)
                        registry.byId("outputSp").addOption({label: "WGS84 UTM Zone " + (utm + 1) + "", value: wkid + 1});
                    else
                        registry.byId("outputSp").addOption({label: "WGS84 UTM Zone " + utm - 59 + "", value: wkid - 59});
                    registry.byId("outputSp").set("value", wkid);
                },
                onClose: function () {
                    if (this.extentchangeHandler)
                    {
                        this.extentchangeHandler.remove();
                        this.extentchangeHandler = null;
                    }
                    if (this.refreshHandler)
                    {
                        this.refreshHandler.remove();
                        this.refreshHandler = null;
                    }
                    connect.publish("exportOpen", {"flag": "close"});
                    for (var k in this.map.graphics.graphics)
                    {
                        if (this.map.graphics.graphics[k].geometry.type === "polygon") {
                            if (this.map.graphics.graphics[k].symbol.color.r === 200)
                            {
                                this.map.graphics.remove(this.map.graphics.graphics[k]);
                                break;
                            }
                        }
                    }
                    registry.byId("extent").set("checked", false);
                    registry.byId("renderer").set("checked", false);
                },
                activatePolygon: function () {
                    if (registry.byId("extent").checked) {
                        this.toolbarForExport.activate(Draw.POLYGON);

                    } else {
                        this.toolbarForExport.deactivate();
                        for (var k in this.map.graphics.graphics)
                        {
                            if (this.map.graphics.graphics[k].geometry.type === "polygon") {
                                if (this.map.graphics.graphics[k].symbol.color.r === 200)
                                {
                                    this.map.graphics.remove(this.map.graphics.graphics[k]);
                                    break;
                                }
                            }
                        }
                    }
                },
                getExtent: function (geometry) {
                    for (var k in this.map.graphics.graphics)
                    {
                        if (this.map.graphics.graphics[k].geometry.type === "polygon") {
                            if (this.map.graphics.graphics[k].symbol.color.r === 200)
                            {
                                this.map.graphics.remove(this.map.graphics.graphics[k]);
                                break;
                            }
                        }
                    }
                    var symbol = new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new Color([200, 0, 0]), 2);
                    var graphic = new esri.Graphic(geometry, symbol);
                    this.map.graphics.add(graphic);
                    this.geometryClip = geometry;
                    this.geometry = geometry.getExtent();
                    var width = (this.geometry.xmax - this.geometry.xmin);
                    var height = (this.geometry.ymax - this.geometry.ymin);
                    var psx = width / this.map.width;
                    var psy = height / this.map.width;
                    var ps = Math.max(psx, psy);
                    var ps = parseFloat(ps) + 0.001;
                    registry.byId("pixelSize").set("value", ps.toFixed(3) + " m");
                },
                exportFunction: function () {

                    this.showLoading();
                    if (registry.byId("extent").checked)
                    {
                        var bbox = (this.geometry.xmin + ", " + this.geometry.ymin + ", " + this.geometry.xmax + ", " + this.geometry.ymax).toString();
                        var width = (this.geometry.xmax - this.geometry.xmin);
                        var height = (this.geometry.ymax - this.geometry.ymin);


                    } else
                    {
                        var bbox = (this.map.extent.xmin + ", " + this.map.extent.ymin + ", " + this.map.extent.xmax + ", " + this.map.extent.ymax).toString();
                        var width = (this.map.extent.xmax - this.map.extent.xmin);
                        var height = (this.map.extent.ymax - this.map.extent.ymin);
                    }
                    for (var i = this.map.layerIds.length - 1; i >= 0; i--) {

                        if ((this.map.getLayer(this.map.layerIds[i]).url).slice(7, 15) === "landsat2") {
                            var exportLayer = this.map.getLayer(this.map.layerIds[i]);

                            break;
                        }
                    }
                    var pixelsize = parseFloat((registry.byId("pixelSize").get("value")).split(" ")[0]);

                    var widthMax = this.map.width;
                    var heightMax = this.map.height;

                    var psx = width / widthMax;
                    var psy = height / widthMax;

                    if (pixelsize === "")
                        pixelsize = psx;
                    var ps = Math.max(psx, psy, pixelsize);

                    if ((width / pixelsize) > widthMax || (height / pixelsize) > widthMax) {
                        var size = "";
                        html.set(this.errorPixelSize, "PixelSize of export is restricted to " + ps.toFixed(3) + " for this extent.");
                        this.hideLoading();
                    } else {
                        var size = (parseInt(width / ps)).toString() + ", " + (parseInt(height / ps)).toString();
                        html.set(this.errorPixelSize, "");
                        if (exportLayer.renderingRule) {

                            if (exportLayer.id === "resultLayer") {

                                if (exportLayer.renderingRule.rasterFunction)
                                    var rendererTemp = exportLayer.renderingRule.rasterFunction;
                                else
                                    var rendererTemp = exportLayer.renderingRule.functionName;

                                if (registry.byId("changeMaskDetect").get("value") === "change") {
                                    var modeValue = registry.byId("changeMode").get("value");
                                    if (modeValue === "Image")
                                        var colormap = exportLayer.renderingRule;
                                    else if (modeValue === "difference") {
                                        if (registry.byId("renderer").checked) {
                                            var remap = new RasterFunction();
                                            remap.functionName = "Remap";
                                            var remapArg = {};
                                            remapArg.InputRanges = [-1, registry.byId("horiSliderDecrease").get("value"), registry.byId("horiSliderInclusion").get("value"), 1];
                                            remapArg.OutputValues = [0, 1];
                                            remapArg.AllowUnmatched = false;
                                            remapArg.Raster = exportLayer.renderingRule;
                                            remap.functionArguments = remapArg;
                                            remap.outputPixelType = "U8";
                                            var colormap = new RasterFunction();
                                            colormap.functionName = "Colormap";
                                            colormap.outputPixelType = "U8";
                                            var colormapArg = {};
                                            if (registry.byId("changeOptions").get("value") === "BurnIndex")
                                                colormapArg.Colormap = [[0, 255, 69, 0], [1, 0, 252, 0]];
                                            else
                                                colormapArg.Colormap = [[0, 255, 0, 255], [1, 0, 252, 0]];
                                            colormapArg.Raster = remap;
                                            colormap.functionArguments = colormapArg;
                                        } else
                                            var colormap = exportLayer.renderingRule;
                                    } else {
                                        if (rendererTemp === "CompositeBand") {
                                            var raster1 = exportLayer.renderingRule.functionArguments.Rasters[0];
                                            var raster2 = exportLayer.renderingRule.functionArguments.Rasters[1];
                                        } else
                                        {
                                            var raster1 = exportLayer.renderingRule.functionArguments.Raster.functionArguments.Rasters[0];
                                            var raster2 = exportLayer.renderingRule.functionArguments.Raster.functionArguments.Rasters[1];
                                        }

                                        var remap1 = new RasterFunction();
                                        remap1.functionName = "Remap";
                                        remap1.outputPixelType = "U8";
                                        var remapArg1 = {};
                                        remapArg1.InputRanges = [-1, parseFloat(registry.byId("horiSliderInclusion").get("value")), parseFloat(registry.byId("horiSliderInclusion").get("value")), 1];
                                        remapArg1.OutputValues = [0, 1];
                                        remapArg1.AllowUnmatched = false;
                                        remapArg1.Raster = raster1;
                                        remap1.functionArguments = remapArg1;

                                        var remap2 = new RasterFunction();
                                        remap2.functionName = "Remap";
                                        remap2.outputPixelType = "U8";
                                        var remapArg2 = {};
                                        remapArg2.InputRanges = [-1, parseFloat(registry.byId("horiSliderInclusion").get("value")), parseFloat(registry.byId("horiSliderInclusion").get("value")), 1];
                                        remapArg2.OutputValues = [0, 1];
                                        remapArg2.AllowUnmatched = false;
                                        remapArg2.Raster = raster2;
                                        remap2.functionArguments = remapArg2;

                                        var arithmetic1 = new RasterFunction();
                                        arithmetic1.functionName = "Arithmetic";
                                        arithmetic1.outputPixelType = "F32";
                                        var arithArg1 = {};
                                        arithArg1.Raster = remap2;
                                        arithArg1.Raster2 = remap1;
                                        arithArg1.Operation = 2;
                                        arithArg1.ExtentType = 1;
                                        arithArg1.CellsizeType = 0;
                                        arithmetic1.functionArguments = arithArg1;

                                        var remap5 = new RasterFunction();
                                        remap5.functionName = "Remap";
                                        remap5.outputPixelType = "F32";
                                        var remapArg5 = {};
                                        remapArg5.InputRanges = [-1.1, -0.01];
                                        remapArg5.OutputValues = [1];
                                        remapArg5.NoDataRanges = [0, 0];
                                        remapArg5.AllowUnmatched = true;
                                        remapArg5.Raster = arithmetic1;
                                        remap5.functionArguments = remapArg5;

                                        var arithmetic2 = new RasterFunction();
                                        arithmetic2.functionName = "Arithmetic";
                                        arithmetic2.outputPixelType = "F32";
                                        var arithArg2 = {};
                                        arithArg2.Raster = raster2;
                                        arithArg2.Raster2 = raster1;
                                        arithArg2.Operation = 2;
                                        arithArg2.ExtentType = 1;
                                        arithArg2.CellsizeType = 0;
                                        arithmetic2.functionArguments = arithArg2;


                                        var remap4 = new RasterFunction();
                                        remap4.functionName = "Remap";
                                        remap4.outputPixelType = "F32";
                                        var remapArg4 = {};
                                        remapArg4.NoDataRanges = [(-1 * registry.byId("horiSliderRight").get("value")), registry.byId("horiSliderRight").get("value")];
                                        remapArg4.AllowUnmatched = true;
                                        remapArg4.Raster = arithmetic2;
                                        remap4.functionArguments = remapArg4;

                                        var arithmetic3 = new RasterFunction();
                                        arithmetic3.functionName = "Arithmetic";
                                        arithmetic3.outputPixelType = "F32";
                                        var arith3 = {};
                                        arith3.Raster = remap5;
                                        arith3.Raster2 = remap4;
                                        arith3.Operation = 3;
                                        arith3.ExtentType = 1;
                                        arith3.CellsizeType = 0;
                                        arithmetic3.functionArguments = arith3;
                                        if (registry.byId("renderer").checked) {
                                            var remap3 = new RasterFunction();
                                            remap3.functionName = "Remap";
                                            remap3.outputPixelType = "U8";
                                            var remapArg3 = {};
                                            remapArg3.InputRanges = [-5, 0, 0, 5];
                                            remapArg3.OutputValues = [0, 1];
                                            remapArg3.AllowUnmatched = false;
                                            remapArg3.Raster = arithmetic3;
                                            remap3.functionArguments = remapArg3;
                                            var colormap = new RasterFunction();
                                            colormap.functionName = "Colormap";
                                            colormap.outputPixelType = "U8";
                                            var colormapArg = {};
                                            if (registry.byId("changeOptions").get("value") === "BurnIndex")
                                                colormapArg.Colormap = [[0, 255, 69, 0], [1, 0, 252, 0]];
                                            else
                                                colormapArg.Colormap = [[0, 255, 0, 255], [1, 0, 252, 0]];
                                            colormapArg.Raster = remap3;
                                            colormap.functionArguments = colormapArg;
                                        } else
                                            var colormap = arithmetic3;


                                    }
                                } else {

                                    var remap = new RasterFunction();
                                    remap.functionName = "Remap";
                                    var argsRemap = {};
                                    argsRemap.Raster = exportLayer.renderingRule;
                                    var maskSliderValue = registry.byId("maskSlider").get("value");
                                    argsRemap.InputRanges = [maskSliderValue, 1];
                                    argsRemap.OutputValues = [1];
                                    argsRemap.NoDataRanges = [-1, maskSliderValue];
                                    var color = registry.byId("savePropAccess").get("value").split(",");


                                    var colorMask = [[1, parseInt(color[0]), parseInt(color[1]), parseInt(color[2])]];


                                    remap.functionArguments = argsRemap;
                                    remap.outputPixelType = 'U8';
                                    if (registry.byId("renderer").checked) {
                                        var colormap = new RasterFunction();
                                        colormap.functionName = "Colormap";
                                        colormap.outputPixelType = "U8";
                                        var argsColor = {};
                                        argsColor.Colormap = colorMask;
                                        argsColor.Raster = remap;
                                        colormap.functionArguments = argsColor;



                                    } else
                                        var colormap = remap;
                                }
                            } else
                            if (registry.byId("renderer").checked) {
                                var colormap = exportLayer.renderingRule;
                            } else
                            {
                                var colormap = new RasterFunction({"rasterFunction": "None"});
                            }
                            if (registry.byId("extent").checked) {

                                var rasterClip = new RasterFunction();
                                rasterClip.functionName = "Clip";
                                var clipArguments = {};
                                clipArguments.ClippingGeometry = this.geometryClip;
                                clipArguments.ClippingType = 1;
                                clipArguments.Raster = colormap;
                                rasterClip.functionArguments = clipArguments;

                                var renderingRule = JSON.stringify(rasterClip.toJson());
                            } else
                                var renderingRule = JSON.stringify(colormap.toJson());
                        } else
                            var renderingRule = null;

                        var format = "tiff";
                        var compression = "LZ77";


                        if (exportLayer.mosaicRule !== null)
                            var mosaicRule = JSON.stringify(exportLayer.mosaicRule.toJson());
                        else
                            var mosaicRule = null;
                        if (exportLayer.bandIds)
                            var band = (exportLayer.bandIds).toString();
                        else
                            var band = exportLayer.bandIds;
                        var noData = "";

                        var layersRequest = esri.request({
                            url: exportLayer.url + "/exportImage",
                            content: {
                                f: "json",
                                bbox: bbox,
                                size: size,
                                compression: compression,
                                format: format,
                                interpolation: "RSP_NearestNeighbor",
                                renderingRule: renderingRule,
                                mosaicRule: mosaicRule,
                                bandIds: band,
                                imageSR: registry.byId("outputSp").get("value"),
                                noData: noData
                            },
                            handleAs: "json",
                            callbackParamName: "callback"
                        });

                        layersRequest.then(lang.hitch(this, function (data) {

                            domAttr.set("linkDownload", "href", data.href);

                            domAttr.set("linkDownload", "target", "_self");
                            (dom.byId("linkDownload")).click();
                            this.hideLoading();
                            if (registry.byId("tooltipDialogIntro") && registry.byId("tooltipDialogIntro").state === "open" && registry.byId("tutorialStage").get("value") === "31") {


                                var tooltipTemp = registry.byId("tooltipDialogIntro");
                                popup.close(tooltipTemp);
                                tooltipTemp.set("content", "<p style='text-align:justify;'>You can also add or remove data from ArcGIS Online using the Add Data tool. <span style='color:orange;font-weight:bolder;'>Click <img src='./widgets/AddData/images/icon.png' height='15'/></span> to open the Add Data tool.</p>");

                                popup.open({
                                    // parent: registry.byId("Export"),
                                    popup: tooltipTemp,
                                    orient: ["after-centered"],
                                    around: document.getElementsByClassName("icon-node")[5],
                                    onClose: lang.hitch(this, function () {
                                        domStyle.set(tooltipTemp._popupWrapper, "display", "block");
                                    })
                                });
                                domStyle.set(tooltipTemp.connectorNode, "top", "0px");
                                registry.byId("tutorialStage").set("value", "32");

                                var y = document.getElementsByClassName("icon-node");
                                y[7].style.pointerEvents = "none";
                                y[7].click();
                                if (domClass.contains(y[2], "jimu-state-selected"))
                                    y[2].click();
                                if (domClass.contains(y[0], "jimu-state-selected"))
                                    y[0].click();
                                y[5].style.pointerEvents = "auto";

                            }
                        }), lang.hitch(this, function (error) {
                            this.hideLoading();
                        }));
                    }
                },
                showLoading: function () {
                    if (dom.byId("loadingExport"))
                        domStyle.set("loadingExport", "display", "block");

                },
                hideLoading: function () {
                    if (dom.byId("loadingExport"))
                        domStyle.set("loadingExport", "display", "none");
                }
            });
            clazz.hasLocale = false;
            clazz.hasSettingPage = false;
            clazz.hasSettingUIFile = false;
            clazz.hasSettingLocale = false;
            clazz.hasSettingStyle = false;
            return clazz;
        });
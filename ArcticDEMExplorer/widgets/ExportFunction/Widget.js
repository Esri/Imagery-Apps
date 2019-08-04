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
    "dojo/on",
    "dijit/registry",
    "dojo/_base/lang",
    "dojo/dom",
    "esri/layers/RasterFunction",
    "dojo/html",
    "esri/layers/ArcGISImageServiceLayer",
    "esri/layers/ImageServiceParameters",
    "esri/tasks/query",
    "esri/tasks/QueryTask",
    "dojo/date/locale",
    "dojo/dom-construct",
    "dojo/dom-attr",
    "dojo/i18n!./nls/strings",
    "dojo/dom-style",
    "esri/toolbars/draw",
    "dojo/_base/connect",
    "esri/Color", "jimu/PanelManager",
    "dijit/form/Select",
    "dijit/form/Button",
    "dijit/form/NumberSpinner",
    "dijit/form/CheckBox",
    "dijit/form/TextBox",
    "dijit/form/DropDownButton",
    "dijit/TooltipDialog",
    "dijit/form/NumberTextBox"

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
                html,
                ArcGISImageServiceLayer,
                ImageServiceParameters, Query, QueryTask, locale,
                domConstruct, domAttr, strings, domStyle, Draw, connect, Color, PanelManager) {
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
                    //    this.hideLoading();
                },
                onOpen: function () {


                    if (registry.byId("buildDialog") && registry.byId("buildDialog").open)
                        registry.byId("buildDialog").hide();
                        if (registry.byId("changeDetectionDialog") && registry.byId("changeDetectionDialog").open)
                        registry.byId("changeDetectionDialog").hide();
                    if(registry.byId("timeDialog") && registry.byId("timeDialog").open)
                       registry.byId("timeDialog").hide();
                    if (registry.byId("contourDialog") && registry.byId("contourDialog").open)
                        registry.byId("contourDialog").hide();
                    connect.publish("exportOpen", {"flag": "open"});
                    
                     if(this.map.getLayer("contourLayer"))
                    var exportLayer = this.map.getLayer("contourLayer");
                else if(this.map.getLayer("resultLayer"))
                    var exportLayer = this.map.getLayer("resultLayer");
                else if(this.map.getLayer("primaryLayer"))
                    var exportLayer = this.map.getLayer("primaryLayer");
                else if(this.map.getLayer("landsatLayer"))
                    var exportLayer = this.map.getLayer("landsatLayer");   
                    domStyle.set("loadingExport", "display", "none");
                    if(exportLayer) {
                    if (exportLayer.url === this.config.urlElevationPGC) {
                        var widthMax = 4000;
                    } else
                        var widthMax = 2000;
                    if (registry.byId("extent").checked && this.geometry)
                    {
                        var width = (this.geometry.xmax - this.geometry.xmin);
                        var height = (this.geometry.ymax - this.geometry.ymin);
                    } else
                    {
                        var width = (this.map.extent.xmax - this.map.extent.xmin);
                        var height = (this.map.extent.ymax - this.map.extent.ymin);
                    }
                    var psx = width / this.map.width;
                    var psy = height / this.map.height;
                    var ps = Math.max(psx, psy);
                    ps = ps + 0.001;
                    registry.byId("pixelSize").set("value", ps.toFixed(3));
                }
                },
                postCreate: function () {


                    registry.byId("export").on("click", lang.hitch(this, this.exportFunction));
                    registry.byId("extent").on("change", lang.hitch(this, this.activatePolygon));
                    if (this.map) {
                        this.map.on("extent-change", lang.hitch(this, this.refreshPixelSize));
                        this.map.on("update-end", lang.hitch(this, function () {
                            connect.subscribe("layerOpen", lang.hitch(this, function (flag) {
                                if (flag.flag) {
                                    pm.closePanel('_26_panel');
                                    connect.publish("layerOpen", [{flag: false}]);
                                }
                            }));
                        }));
                        this.toolbarForExport = new Draw(this.map);
                        dojo.connect(this.toolbarForExport, "onDrawEnd", lang.hitch(this, this.getExtent));

                    }
                },
                refreshPixelSize: function (change) {
                    if (change.levelChange) {
                        if (!registry.byId("extent").checked) {
                            var width = (this.map.extent.xmax - this.map.extent.xmin);
                            var height = (this.map.extent.ymax - this.map.extent.ymin);
                            var psx = width / this.map.width;
                            var psy = height / this.map.height;
                            var ps = Math.max(psx, psy);
                            ps = ps + 0.001;
                            registry.byId("pixelSize").set("value", ps.toFixed(3));
                        }
                    }
                },
                onClose: function () {
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
                    var psy = height / this.map.height;
                    var ps = Math.max(psx, psy);
                    ps = ps + 0.001;
                    registry.byId("pixelSize").set("value", ps.toFixed(3));

                },
                exportFunction: function () {
                    domStyle.set("loadingExport", "display", "block");
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
                    if(this.map.getLayer("contourLayer"))
                    var exportLayer = this.map.getLayer("contourLayer");
                else if(this.map.getLayer("resultLayer"))
                    var exportLayer = this.map.getLayer("resultLayer");
                else if(this.map.getLayer("primaryLayer"))
                    var exportLayer = this.map.getLayer("primaryLayer");
                else if(this.map.getLayer("landsatLayer"))
                    var exportLayer = this.map.getLayer("landsatLayer");    
                   
                   if(exportLayer) {
                    var pixelsize = registry.byId("pixelSize").get("value");
                    if (exportLayer.url === this.config.urlElevationPGC) {
                        var widthMax = 4000;
                    } else
                        var widthMax = 2000;


                    var psx = width / this.map.width;
                    var psy = height / this.map.height;

                    if (pixelsize === "")
                        pixelsize = psx;
                    var ps = Math.max(psx, psy, pixelsize);
                    if ((width / pixelsize) > widthMax || (height / pixelsize) > widthMax) {
                        var size = "";
                        html.set(this.errorPixelSize, "PixelSize of export is restricted to " + ps.toFixed(3) + " for this extent.");
                    } else {
                        var size = (parseInt(width / ps)).toString() + ", " + (parseInt(height / ps)).toString();
                        html.set(this.errorPixelSize, "");
                         if (exportLayer.renderingRule) {
                                if (registry.byId("extent").checked) {
                                    var rasterClip = new RasterFunction();
                                    rasterClip.functionName = "Clip";
                                    var clipArguments = {};
                                    clipArguments.ClippingGeometry = this.geometryClip;
                                    clipArguments.ClippingType = 1;
                                    clipArguments.Raster = exportLayer.renderingRule;
                                    rasterClip.functionArguments = clipArguments;

                                    var renderingRule = JSON.stringify(rasterClip.toJson());
                                } else
                                    var renderingRule = JSON.stringify(exportLayer.renderingRule.toJson());
                            }else
                                var renderingRule = null;
                        if (!registry.byId("renderer").checked) {
                     
                            var renderingRule = '{"rasterFunction": "None"}';
                        }
                           var format = "tiff";
                            var compression = "LZ77";
                         
                        if (exportLayer.mosaicRule && exportLayer.visible)
                            var mosaicRule = JSON.stringify(exportLayer.mosaicRule.toJson());
                        else
                            var mosaicRule = null;
                        if (exportLayer.url === this.config.urlElevationPGC)
                        {
                            var band = 0;
                            var noData = -9999;
                        } else
                        {
                            var band = exportLayer.bandIds;
                            var noData = "";
                        }
                        var layersRequest = esri.request({
                            url: exportLayer.url + "/exportImage",
                            content: {
                                f: "json",
                                bbox: bbox,
                                size: size,
                                compression: compression,
                                format: format,
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

                             var request2 = esri.request({
                                    url: data.href,
                                    content: {
                                    },
                                    handleAs: "blob",
                                    callbackParamName: "callback"
                                });

                                request2.then(lang.hitch(this, function (response) {
                                    domAttr.set("linkDownload", "target", "_self");

                                    domAttr.set("linkDownload", "href", URL.createObjectURL(response));
                                    (document.getElementById("linkDownload")).click();

                                    domStyle.set("loadingExport", "display", "none");
                                }), lang.hitch(this, function (error) {
                                    console.log(error);
                                    
                                    domStyle.set("loadingExport", "display", "none");
                                }));
                        }), lang.hitch(this, function (error) {
                            domStyle.set("loadingExport", "display", "none");
                        }));
                    }
                }
                },
                showLoading: function () {
                    domStyle.set("loadingExport", "display", "block");

                },
                hideLoading: function () {
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
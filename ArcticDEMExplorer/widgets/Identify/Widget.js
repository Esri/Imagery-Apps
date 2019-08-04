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
    'esri/dijit/Legend',
    "esri/arcgis/utils",
    "dojo/on",
    "dijit/registry",
    "dojo/_base/lang",
    "dojo/dom", "dojo/dom-attr",
    "dojo/dom-construct",
    "dojo/dom-style",
    "esri/request",
    "esri/tasks/ImageServiceIdentifyTask",
    "esri/tasks/ImageServiceIdentifyParameters",
    "esri/geometry/Point",
    "dojox/charting/Chart",
    "dojox/charting/action2d/Tooltip",
    "dojox/charting/themes/PrimaryColors",
    "esri/SpatialReference",
    "dojox/charting/widget/SelectableLegend",
    "dojox/charting/action2d/Magnify",
    "dojo/date/locale",
    "dojo/html",
    "esri/layers/MosaicRule",
    "dojo/_base/connect",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/symbols/SimpleLineSymbol",
    "esri/Color",
    "jimu/PanelManager",
    "esri/tasks/query",
    "esri/tasks/QueryTask",
    "esri/toolbars/draw",
    "dijit/Dialog",
    "dojox/charting/plot2d/Lines",
    "dojox/charting/plot2d/Markers",
    "dojox/charting/axis2d/Default",
    "esri/graphic",
    "dijit/form/Select",
    "dijit/form/Button",
    "dijit/form/NumberSpinner",
    "dijit/form/CheckBox",
    "dijit/form/TextBox",
    "dijit/form/DropDownButton",
    "dijit/TooltipDialog",
    'jimu/dijit/DrawBox',
    "esri/SpatialReference",
    "dijit/layout/BorderContainer",
    "dijit/form/RadioButton"



],
        function (
                declare,
                _WidgetsInTemplateMixin,
                template,
                BaseWidget,
                Legend,
                arcgisUtils,
                on,
                registry,
                lang,
                dom, domAttr,
                domConstruct,
                domStyle, esriRequest, ImageServiceIdentifyTask, ImageServiceIdentifyParameters, Point, Chart, Tooltip, theme, SpatialReference, SelectableLegend, Magnify, locale, html, MosaicRule, connect, SimpleMarkerSymbol, SimpleLineSymbol, Color, PanelManager, Query, QueryTask, Draw) {
            var pm = PanelManager.getInstance();
            var clazz = declare([BaseWidget, _WidgetsInTemplateMixin], {
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
                wiopen: false,
                levelzoom: null,
                startup: function () {
                    this.inherited(arguments);

                    domConstruct.place('<img id="loadingIdentify" style="position: absolute;top:0;bottom: 0;left: 0;right: 0;margin:auto;z-index:100;" src="' + require.toUrl('jimu') + '/images/loading.gif">', this.map.container);
                    // domStyle.set("loadingsp","display","block");



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
                    connect.publish("identify", [{idenstatus: "open"}]);
                    this.autoresize();

                    this.refreshData();
                    domStyle.set("loadingIdentify", "display", "none");
                    var centerPoint = this.map.extent.getCenter();
                    this.centerFlag = true;
                    this.identifypara(centerPoint);
                    this.toolbarIdentify.activate(Draw.POINT);
                 
                },
                autoresize: function ()
                {
                    this.w = this.map.width;
                    this.h = this.map.height;
                    this.w = (parseInt((this.w / 2.5)));
                    this.w1 = parseInt((this.w / 1.345)).toString();
                    this.w2 = parseInt((this.w / 1.593)).toString();
                    this.h = (parseInt((this.h / 5.5))).toString();
                },
                onClose: function () {
                    for (var k = 0; k < this.map.graphics.graphics.length; k++) {
                        if (this.map.graphics.graphics[k].geometry.type === "polygon") {
                            if (this.map.graphics.graphics[k].symbol.color.g === 255)
                                this.map.graphics.remove(this.map.graphics.graphics[k]);
                            break;
                        }
                    }
                    for (var a in this.map.graphics.graphics) {
                        if (this.map.graphics.graphics[a].geometry.type === "point" && this.map.graphics.graphics[a].symbol && this.map.graphics.graphics[a].symbol.color.r === 255) {
                            this.map.graphics.remove(this.map.graphics.graphics[a]);
                            break;
                        }
                    }
                    this.clear();
                    registry.byId("chartDialog1").hide();
                    domStyle.set("loadingIdentify", "display", "none");
                    connect.publish("identify", [{idenstatus: "close"}]);
                   
                    this.toolbarIdentify.deactivate();
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

                    this.identifypara(geometry);
                },
                identifypara: function (evt2) {
                    if (registry.byId("footprintId").checked) {
                        registry.byId("footprintId").set("checked", false);

                    }

                    domStyle.set("loadingIdentify", "display", "block");
                    dojo.style(dojo.byId("onlyidentify"), "display", "none");

                    //  this.clear();
                    if (this.centerFlag) {
                        var point = evt2;

                    } else
                        var point = evt2;




                    if (this.map.getLayer("resultLayer")) {
                        var resultLayer = this.map.getLayer("resultLayer");
                        var layercheck = resultLayer.url;

                        this.mosaic = JSON.stringify((resultLayer.renderingRule.functionArguments.Raster.functionArguments.Raster).toJson());

                        var request2 = esriRequest({
                            url: layercheck + "/identify",
                            content: {
                                //geometry: '{"x":' + evt2.mapPoint.x + ',"y":' + evt2.mapPoint.y + ',"spatialReference":{"wkid":' + evt2.mapPoint.spatialReference.wkid + '}}',
                                geometry: JSON.stringify((point.toJson())),
                                geometryType: "esriGeometryPoint",
                                returnGeometry: false,
                                returnCatalogItems: false,
                                renderingRule: this.mosaic,
                                f: "json"
                            },
                            handleAs: "json",
                            callbackParamName: "callback"
                        });
                    } else if (this.map.getLayer("primaryLayer")) {
                        this.primaryLayer = this.map.getLayer("primaryLayer");
                        var layercheck = this.map.getLayer("primaryLayer").url;
                        if (this.primaryLayer.mosaicRule)
                            this.mosaic = JSON.stringify(this.primaryLayer.mosaicRule.toJson());
                        else
                            this.mosaic = null;

                        var request2 = esriRequest({
                            url: layercheck + "/identify",
                            content: {
                                geometry: JSON.stringify((point.toJson())),
                                geometryType: "esriGeometryPoint",
                                returnGeometry: false,
                                returnCatalogItems: false,
                                mosaicRule: this.mosaic,
                                renderingRules: '[{"rasterFunction": "None"},{"rasterFunction": "Slope Degrees"},{"rasterFunction": "Aspect Degrees"},{"rasterFunction": "Height Ellipsoidal"}]',
                                f: "json"
                            },
                            handleAs: "json",
                            callbackParamName: "callback"
                        });
                    } else if (this.map.getLayer("landsatLayer")) {
                        var layerCheck = this.map.getLayer("landsatLayer");
                        if (layerCheck.mosaicRule)
                            this.mosaic = JSON.stringify(layerCheck.mosaicRule.toJson());
                        else
                            this.mosaic = null;
                        if (layerCheck.url !== this.config.urlms && layerCheck.mosaicRule && layerCheck.mosaicRule.method === "esriMosaicLockRaster") {
                            var query = new Query();
                            query.where = "OBJECTID = " + layerCheck.mosaicRule.lockRasterIds[0];
                            query.outFields = ["GroupName"];
                            query.returnGeometry = false;
                            var queryTask = new QueryTask(layerCheck.url);
                            queryTask.execute(query, lang.hitch(this, function (queryResult) {
                                var query2 = new Query();
                                query2.where = "GroupName = '" + queryResult.features[0].attributes.GroupName + "'";
                                query2.outFields = ["OBJECTID"];
                                query2.returnGeometry = false;
                                var queryTask2 = new QueryTask(this.config.urlms);
                                queryTask2.execute(query2, lang.hitch(this, function (queryResult2) {
                                    var array = [queryResult2.features[0].attributes.OBJECTID];
                                    this.mosaic = {"mosaicMethod": "esriMosaicLockRaster", "ascending": true, "lockRasterIds": array, "mosaicOperation": "MT_FIRST"};
                                    this.mosaic = JSON.stringify(this.mosaic);


                                    var request5 = esriRequest({
                                        url: this.config.urlms + "/getSamples",
                                        content: {
                                            geometry: JSON.stringify((point.toJson())),
                                            geometryType: "esriGeometryPoint",
                                            returnGeometry: false,
                                            // returnCatalogItems: true,
                                            returnFirstValueOnly: true,
                                            outFields: 'AcquisitionDate,OBJECTID,GroupName,Category,ProductName,WRS_Path,WRS_Row,SunAzimuth,SunElevation,CloudCover,LowPS',
                                            // pixelSize: [this.primaryLayer.pixelSizeX, this.primaryLayer.pixelSizeY],
                                            mosaicRule: this.mosaic,
                                            f: "json"
                                        },
                                        handleAs: "json",
                                        callbackParamName: "callback"
                                    });
                                    request5.then(lang.hitch(this, function (data) {
                                        var props = data.samples[0].attributes;
                                        this.groupName = props.GroupName;
                                        html.set(this.identifytab, "<table style='border: 0px;'><tr><td>Current Scene ID: " + props.GroupName.substr(0, 21) + "</td><td>&nbsp;&nbsp;Product Name: " + props.ProductName + "</td></tr><tr><td>Acquisition Date: " + locale.format(new Date(props.AcquisitionDate), {selector: "date", formatLength: "long"}) + "</td><td>&nbsp;&nbsp;WRS Path/Row: " + props.WRS_Path + "/" + props.WRS_Row + "</td></tr><tr><td>Sun Azimuth: " + props.SunAzimuth.toFixed(1) + "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Sun Elevation: " + props.SunElevation.toFixed(1) + "</td><td>&nbsp;&nbsp;Cloud Cover: " + (props.CloudCover * 100).toFixed(1) + "%</td></tr></table>");
                                        domStyle.set(dom.byId("identifysp"), "display", "none");
                                        domStyle.set(dom.byId("onlyidentify"), "display", "block");
                                        html.set(this.noinfo, "");
                                        registry.byId("chartDialog1").show();
                                        domStyle.set("chartDialog1", "left", "160px");
                                        domStyle.set("chartDialog1", "top", "75px");
                                        domConstruct.destroy("chartDialog1_underlay");
                                        html.set(this.pointPickerText, "Pick point on the map for a spectral profile.");
                                        if (this.centerFlag) {
                                            this.centerFlag = false;
                                        } else
                                            this.spectralprofiles(data, evt2);

                                        domStyle.set("loadingIdentify", "display", "none");
                                    }), lang.hitch(this, function (error) {

                                        console.log("Error: ", error.message);
                                        html.set(this.identifytab, "");
                                        html.set(this.noinfo, "No Information available");
                                        domStyle.set(dom.byId("onlyidentify"), "display", "none");
                                        domStyle.set(dom.byId("identifysp"), "display", "none");
                                        domStyle.set("loadingIdentify", "display", "none");
                                        this.centerFlag = false;
                                        registry.byId("chartDialog1").show();
                                        domStyle.set("chartDialog1", "left", "160px");
                                        domStyle.set("chartDialog1", "top", "75px");
                                    }));
                                }));
                            }));
                        } else {
                            var request2 = esriRequest({
                                url: this.config.urlms + "/getSamples",
                                content: {
                                    geometry: JSON.stringify((point.toJson())),
                                    geometryType: "esriGeometryPoint",
                                    returnGeometry: false,
                                    // returnCatalogItems: true,
                                    returnFirstValueOnly: true,
                                    outFields: 'AcquisitionDate,OBJECTID,GroupName,Category,ProductName,WRS_Path,WRS_Row,SunAzimuth,SunElevation,CloudCover,LowPS',
                                    // pixelSize: [this.primaryLayer.pixelSizeX, this.primaryLayer.pixelSizeY],
                                    mosaicRule: this.mosaic,
                                    f: "json"
                                },
                                handleAs: "json",
                                callbackParamName: "callback"
                            });
                        }
                    }
                    //}
                    if (request2) {
                        request2.then(lang.hitch(this, function (data) {


                            if (this.map.getLayer("resultLayer")) {
                                var upperScene = parseInt(registry.byId("currentDate").get("value"));
                                var belowScene = parseInt(registry.byId("savedSceneDetails").get("value").split(",")[1]);
                               
                                if(locale.format(new Date(upperScene), {selector: "date", datePattern: "yyyy/MM/dd"}) < locale.format(new Date(belowScene), {selector: "date", datePattern: "yyyy/MM/dd"}))
                                html.set(this.identifytab, "Change in height: " + ( -1 * (parseFloat(data.value)).toFixed(2)));
                            else
                                html.set(this.identifytab, "Change in height: " + (parseFloat(data.value)).toFixed(2));
                                html.set(this.pointPickerText, "Pick point on the map to get change in height.");
                                domStyle.set("footprintIdentify", "display", "none");
                                 domStyle.set("onlyidentify", "display", "block");
                                if (this.centerFlag)
                                    this.centerFlag = false;
                            } else if (this.map.getLayer("primaryLayer"))
                            {
                                var heightValue = data.processedValues[0].split(" ");

                                var request3 = esriRequest({
                                    url: this.config.urlElevationPGC + "/getSamples",
                                    content: {
                                        geometry: JSON.stringify((point.toJson())),
                                        geometryType: "esriGeometryPoint",
                                        returnGeometry: false,
                                        // returnCatalogItems: true,
                                        returnFirstValueOnly: true,
                                        outFields: 'AcquisitionDate,GroupName,Category,LowPS,Source,dx,dy,dz,fileurl',
                                        mosaicRule: this.mosaic,
                                        f: "json"
                                    },
                                    handleAs: "json",
                                    callbackParamName: "callback"
                                });
                                request3.then(lang.hitch(this, function (metaData) {
                                    var props = metaData.samples[0].attributes;
                                    this.groupName = props.GroupName;
                                    var href1 = "https://browse.digitalglobe.com/imagefinder/showBrowseMetadata?catalogId=" + (props.GroupName).substr(14, 16);
                                    var href2 = "https://browse.digitalglobe.com/imagefinder/showBrowseMetadata?catalogId=" + (props.GroupName).substr(31, 16);
                                    this.sourceUrl = props.fileurl;
                                    html.set(this.identifytab, "<table style='border: 0px;'><tr><td>Current Scene ID: " + props.GroupName.substr(0, 21) + "&nbsp;&nbsp;Date: " + locale.format(new Date(props.AcquisitionDate), {selector: "date", formatLength: "long"}) + "</td></tr><tr><td>Source: " + props.Source + "&nbsp;&nbsp;&nbsp;&nbsp;PixelSize: " + props.LowPS + "m&nbsp;&nbsp;&nbsp;Aspect: " + parseInt(data.processedValues[2]) + " deg" + "&nbsp;&nbsp;&nbsp;&nbsp;Slope: " + parseInt(data.processedValues[1]) + " deg" + "</td></tr><tr><td>Correction shifts applied xyz: &nbsp;" + props.dx + ", " + props.dy + ", " + props.dz + " &nbsp;m</td></tr><tr><td>Orthometric height: " + (parseFloat(heightValue)).toFixed(2) + "m" + "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Ellipsoidal height: " + (parseFloat(data.processedValues[3])).toFixed(2) + "m" + "</td></tr><tr><td>Digital Globe Links: <a target='_blank' href=" + href1 + ">Link1</a>   <a target='_blank' href=" + href2 + ">Link2</a>&nbsp;&nbsp;&nbsp;<a id='downloadLink' href='javascript:;'>Download DEM</a></td></tr></table>");
                                    document.getElementById("downloadLink").addEventListener("click", lang.hitch(this, function () {
                                        registry.byId("downloadDialog").show();
                                    }));
                                    domStyle.set("footprintIdentify", "display", "block");
                                }), lang.hitch(this, function (error) {
                                    //    domStyle.set("loadingsp", "display", "none");
                                    html.set(this.identifytab, "");
                                    this.centerFlag = false;
                                    html.set(this.noinfo, "No Information available");
                                   domStyle.set(dom.byId("onlyidentify"), "display", "none");
                                    domStyle.set(dom.byId("identifysp"), "display", "none");
                                    domStyle.set("loadingIdentify", "display", "none");
                                    registry.byId("chartDialog1").show();
                                    domStyle.set("chartDialog1", "left", "160px");
                                    domStyle.set("chartDialog1", "top", "75px");
                                }));
                                domStyle.set(dom.byId("identifysp"), "display", "none");
                                domStyle.set(dom.byId("onlyidentify"), "display", "block");
                                html.set(this.noinfo, "");
                                //    dojo.style(dojo.byId("chartDialog1"), "top", (this.h + "px"));
                                html.set(this.pointPickerText, "Pick point on the map to get height.");
                                // registry.byId("chartDialog1").show();
                                //  domConstruct.destroy("chartDialog1_underlay");
                                domStyle.set("footprintIdentify", "display", "none");
                                if (this.centerFlag)
                                    this.centerFlag = false;
                            } else if (this.map.getLayer("landsatLayer")) {
                                var props = data.samples[0].attributes;
                                this.groupName = props.GroupName;
                                html.set(this.identifytab, "<table style='border: 0px;'><tr><td>Current Scene ID: " + props.GroupName.substr(0, 21) + "</td><td>&nbsp;&nbsp;Product Name: " + props.ProductName + "</td></tr><tr><td>Acquisition Date: " + locale.format(new Date(props.AcquisitionDate), {selector: "date", formatLength: "long"}) + "</td><td>&nbsp;&nbsp;WRS Path/Row: " + props.WRS_Path + "/" + props.WRS_Row + "</td></tr><tr><td>Sun Azimuth: " + props.SunAzimuth.toFixed(1) + "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Sun Elevation: " + props.SunElevation.toFixed(1) + "</td><td>&nbsp;&nbsp;Cloud Cover: " + (props.CloudCover * 100).toFixed(1) + "%</td></tr></table>");
                                html.set(this.pointPickerText, "Pick point on the map for a spectral profile.");

                                if (this.centerFlag) {
                                    this.centerFlag = false;
                                } else
                                    this.spectralprofiles(data, evt2);
                            }
                            domStyle.set("loadingIdentify", "display", "none");
                            registry.byId("chartDialog1").show();
                            domStyle.set("chartDialog1", "left", "160px");
                            domStyle.set("chartDialog1", "top", "75px");
                            domConstruct.destroy("chartDialog1_underlay");
                        }), lang.hitch(this, function (error) {
                            this.centerFlag = false;
                            console.log("Error: ", error.message);
                            html.set(this.identifytab, "");
                            html.set(this.noinfo, "No Information available");
                            domStyle.set(dom.byId("onlyidentify"), "display", "none");
                            domStyle.set(dom.byId("identifysp"), "display", "none");
                            domStyle.set("loadingIdentify", "display", "none");

                            registry.byId("chartDialog1").show();
                            domStyle.set("chartDialog1", "left", "160px");
                            domStyle.set("chartDialog1", "top", "75px");
                        }));
                    }
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
                    for (a in values) {
                        //normalizedValues[a] = (values[a] - this.minValue) / (this.maxValue - this.minValue);
                        normalizedValues[a] = (values[a] / 10000);
                    }

                    this.chartData = [];
                    for (a in normalizedValues) {
                        this.chartData.push(
                                {tooltip: normalizedValues[a].toFixed(3),
                                    y: normalizedValues[a]});
                    }

                    var normalizedValues1 = this.config.a;
                    this.chartData1 = [];
                    for (b in normalizedValues1)
                    {
                        this.chartData1.push(
                                {
                                    tooltip: normalizedValues1[b].toFixed(3),
                                    y: normalizedValues1[b]
                                }
                        );
                    }



                    var normalizedValues2 = this.config.b;
                    this.chartData2 = [];
                    for (b in normalizedValues2)
                    {
                        this.chartData2.push(
                                {
                                    tooltip: normalizedValues2[b].toFixed(3),
                                    y: normalizedValues2[b]
                                }
                        );
                    }

                    var normalizedValues3 = this.config.c;
                    this.chartData3 = [];
                    for (b in normalizedValues3)
                    {
                        this.chartData3.push(
                                {
                                    tooltip: normalizedValues3[b].toFixed(3),
                                    y: normalizedValues3[b]
                                }
                        );
                    }

                    var normalizedValues4 = this.config.d;
                    this.chartData4 = [];
                    for (b in normalizedValues4)
                    {
                        this.chartData4.push(
                                {
                                    tooltip: normalizedValues4[b].toFixed(3),
                                    y: normalizedValues4[b]
                                }
                        );
                    }

                    var normalizedValues5 = this.config.e;
                    this.chartData5 = [];
                    for (b in normalizedValues5)
                    {
                        this.chartData5.push(
                                {
                                    tooltip: normalizedValues5[b].toFixed(3),
                                    y: normalizedValues5[b]
                                }
                        );
                    }

                    var normalizedValues6 = this.config.f;
                    this.chartData6 = [];
                    for (b in normalizedValues6)
                    {
                        this.chartData6.push(
                                {
                                    tooltip: normalizedValues6[b].toFixed(3),
                                    y: normalizedValues6[b]
                                }
                        );
                    }

                    var normalizedValues7 = this.config.g;
                    this.chartData7 = [];
                    for (b in normalizedValues7)
                    {
                        this.chartData7.push(
                                {
                                    tooltip: normalizedValues7[b].toFixed(3),
                                    y: normalizedValues7[b]
                                }
                        );
                    }

                    var normalizedValues10 = this.config.j;
                    this.chartData10 = [];
                    for (b in normalizedValues10)
                    {
                        this.chartData10.push(
                                {
                                    tooltip: normalizedValues10[b].toFixed(3),
                                    y: normalizedValues10[b]
                                }
                        );
                    }

                    var normalizedValues9 = this.config.h;
                    this.chartData9 = [];
                    for (b in normalizedValues9)
                    {
                        this.chartData9.push(
                                {
                                    tooltip: normalizedValues9[b].toFixed(3),
                                    y: normalizedValues9[b]
                                }
                        );
                    }

                    var normalizedValues8 = this.config.i;
                    this.chartData8 = [];
                    for (b in normalizedValues8)
                    {
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
                    for (a in this.bandPropMean) {
                        this.axesParams[a] = {
                            value: parseInt(a) + 1,
                            text: this.bandNames1[a]
                        };
                    }

                    if (!this.chart) {
                        registry.byId("chartDialog1").show();
                        domStyle.set("chartDialog1", "left", "160px");
                        domStyle.set("chartDialog1", "top", "75px");
                        domStyle.set(dom.byId("identifysp"), "display", "block");
                        registry.byId("type").set("checked", "true");
                        html.set(this.noinfo, "");
                        //dojo.style(dojo.byId("chartDialog1"),"top","350px");
                        //dojo.style(dojo.byId("chartDialog1"), "top", (this.h + "px"));
                        // dojo.style(dojo.byId("chartDialog1"),"width",(this.w+"px"));
                        // dojo.style(dojo.byId("onlyidentify"), "display", "none");
                        this.chart = new Chart("chartNode1");
                        this.chart.addPlot("default", {
                            type: "Lines",
                            markers: true,
                            shadows: {dx: 4, dy: 4}
                        });
                        this.chart.setTheme(theme);
                        this.chart.setWindow(1, 1, -1, 0);

                        this.count = 1;

                        this.chart.addAxis("y", {vertical: true, fixLower: "major", fixUpper: "major", title: "Data Values", titleOrientation: "axis"});


                        this.chart.addAxis("x", {labels: this.axesParams, labelSizeChange: true, title: "Spectral Bands", titleOrientation: "away", minorTicks: false, majorTickStep: 1});

                        this.chart.addSeries("Selected Point", this.chartData);
                        this.chart.addSeries("Cloud", this.chartData1, {stroke: {color: "#1E2457", width: 1.5}, fill: "#1E2457", hidden: this.hiddentrue(1, key1)});
                        this.chart.addSeries("Snow/Ice", this.chartData2, {stroke: {color: "#A5F2F3", width: 1.5}, fill: "#A5F2F3", hidden: this.hiddentrue(2, key1)});
                        this.chart.addSeries("Desert", this.chartData3, {stroke: {color: "#ECC5A8", width: 1.5}, fill: "#ECC5A8", hidden: this.hiddentrue(3, key1)});
                        this.chart.addSeries("Dry Grass", this.chartData4, {stroke: {color: "#DAA520", width: 1.5}, fill: "#DAA520", hidden: this.hiddentrue(4, key1)});
                        this.chart.addSeries("Concrete", this.chartData5, {stroke: {color: "gray", width: 1.5}, fill: "gray", hidden: this.hiddentrue(5, key1)});
                        this.chart.addSeries("Lush Grass", this.chartData6, {stroke: {color: "#7cfc00", width: 1.5}, fill: "#7cfc00", hidden: this.hiddentrue(6, key1)});
                        this.chart.addSeries("Urban", this.chartData7, {stroke: {color: "teal", width: 1.5}, fill: "teal", hidden: this.hiddentrue(7, key1)});
                        this.chart.addSeries("Rock", this.chartData8, {stroke: {color: "#5A4D41", width: 1.5}, fill: "#5A4D41", hidden: this.hiddentrue(8, key1)});
                        this.chart.addSeries("Forest", this.chartData9, {stroke: {color: "forestgreen", width: 1.5}, fill: "forestgreen", hidden: this.hiddentrue(9, key1)});
                        this.chart.addSeries("Water", this.chartData10, {stroke: {color: "#40a4df", width: 1.5}, fill: "#40a4df", hidden: this.hiddentrue(10, key1)});

                        this.count++;

                        registry.byId("chartDialog1").show();
                        domStyle.set("chartDialog1", "left", "160px");
                        domStyle.set("chartDialog1", "top", "75px");
                        domStyle.set(dom.byId("identifysp"), "display", "block");
                        domStyle.set(dom.byId("onlyidentify"), "display", "none");
                        this.toolTip = new Tooltip(this.chart, "default");
                        this.magnify = new Magnify(this.chart, "default");
                        this.chart.render();
                        this.legend = new SelectableLegend({chart: this.chart, horizontal: false, outline: false}, "legend1");
                        domConstruct.destroy("chartDialog1_underlay");

                    } else {
                        registry.byId("chartDialog1").show();
                        domStyle.set("chartDialog1", "left", "160px");
                        domStyle.set("chartDialog1", "top", "75px");
                        html.set(this.noinfo, "");
                        domStyle.set(dom.byId("identifysp"), "display", "block");
                       

                        domStyle.set("onlyidentify", "display", "none");

                        if (!this.chart.getAxis("x")) {
                            this.chart.addAxis("x", {labels: this.axesParams, labelSizeChange: true, title: "Spectral Bands", titleOrientation: "away", minorTicks: false, majorTickStep: 1});
                        }

                        this.chart.addSeries("Selected Point", this.chartData);
                        this.chart.addSeries("Cloud", this.chartData1, {stroke: {color: "#1E2457", width: 1.5}, fill: "#1E2457", hidden: this.hiddentrue(1, key1)});
                        this.chart.addSeries("Snow/Ice", this.chartData2, {stroke: {color: "#A5F2F3", width: 1.5}, fill: "#A5F2F3", hidden: this.hiddentrue(2, key1)});
                        this.chart.addSeries("Desert", this.chartData3, {stroke: {color: "#ECC5A8", width: 1.5}, fill: "#ECC5A8", hidden: this.hiddentrue(3, key1)});
                        this.chart.addSeries("Dry Grass", this.chartData4, {stroke: {color: "#DAA520", width: 1.5}, fill: "#DAA520", hidden: this.hiddentrue(4, key1)});
                        this.chart.addSeries("Concrete", this.chartData5, {stroke: {color: "gray", width: 1.5}, fill: "gray", hidden: this.hiddentrue(5, key1)});
                        this.chart.addSeries("Lush Grass", this.chartData6, {stroke: {color: "#7cfc00", width: 1.5}, fill: "#7cfc00", hidden: this.hiddentrue(6, key1)});
                        this.chart.addSeries("Urban", this.chartData7, {stroke: {color: "teal", width: 1.5}, fill: "teal", hidden: this.hiddentrue(7, key1)});
                        this.chart.addSeries("Rock", this.chartData8, {stroke: {color: "#5A4D41", width: 1.5}, fill: "#5A4D41", hidden: this.hiddentrue(8, key1)});
                        this.chart.addSeries("Forest", this.chartData9, {stroke: {color: "forestgreen", width: 1.5}, fill: "forestgreen", hidden: this.hiddentrue(9, key1)});
                        this.chart.addSeries("Water", this.chartData10, {stroke: {color: "#40a4df", width: 1.5}, fill: "#40a4df", hidden: this.hiddentrue(10, key1)});
                        this.count++;
                        this.chart.render();
                        this.legend.refresh();
                    }

                },
                refreshData: function () {
                    connect.subscribe("layerOpen", lang.hitch(this, function (flag) {
                        if (flag.flag) {
                            pm.closePanel('widgets/Identify/Widget_14_panel');
                            connect.publish("layerOpen", [{flag: false}]);
                        }
                    }));

                    

                        this.primaryLayer = this.map.getLayer("primaryLayer");


                        try {
                            this.minValue = this.primaryLayer.minValues[0];

                            this.maxValue = this.primaryLayer.maxValues[0];
                            this.bandNames1 = ["Coastal", "Blue", "Green", "Red", "NIR", "SWIR 1", "SWIR 2", "Cirrus"];

                            this.bandPropMean = [440, 480, 560, 655, 865, 1610, 2200, 1370];
                            


                        } catch (e)
                        {

                        }

                    

                },
                postCreate: function () {
                    this.inherited(arguments);
                    registry.byId("ok").on("click", lang.hitch(this, function () {
                        registry.byId("downloadDialog").hide();
                        domAttr.set("linkDownload", "href", this.sourceUrl);

                        domAttr.set("linkDownload", "target", "_self");
                        (dom.byId("linkDownload")).click();
                    }));
                    registry.byId("type").on("change", lang.hitch(this, this.displaysp));
                    registry.byId("footprintId").on("change", lang.hitch(this, this.footprintDisplay));
                    if (this.map) {
                        this.map.on("update-end", lang.hitch(this, this.refreshData));
                        this.toolbarIdentify = new Draw(this.map);
                        dojo.connect(this.toolbarIdentify, "onDrawEnd", lang.hitch(this, this.addGraphic));
                    }

                },
                footprintDisplay: function () {
                    if (registry.byId("footprintId").checked) {
                        var query = new Query();
                        query.where = "(Category=1) AND (GroupName = '" + this.groupName + "')";
                        query.returnGeometry = true;
                        if (this.map.getLayer("primaryLayer"))
                            var url = this.config.urlElevationPGC;
                        else if (this.map.getLayer("landsatLayer"))
                            var url = this.config.urlms;
                        var queryTask = new QueryTask(url);
                        queryTask.execute(query, lang.hitch(this, function (result) {

                            var symbol = new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new Color([0, 255, 255]), 2);
                            var graphic = new esri.Graphic(result.features[0].geometry, symbol);
                            this.map.graphics.add(graphic);
                        }), lang.hitch(this, function (error) {
                            domStyle.set("loadingIdentify", "display", "none");
                        }));
                    } else {
                        for (var k = 0; k < this.map.graphics.graphics.length; k++) {
                            if (this.map.graphics.graphics[k].geometry.type === "polygon") {
                                if (this.map.graphics.graphics[k].symbol.color.g === 255)
                                    this.map.graphics.remove(this.map.graphics.graphics[k]);
                                break;
                            }
                        }
                    }
                },
                displaysp: function ()
                {
                    if (registry.byId("type").checked)
                    {
                        dojo.style(dojo.byId("chartshow1"), "display", "block");
                        dojo.style(dojo.byId("typical"), "display", "block");

                    } else
                    {
                        dojo.style(dojo.byId("chartshow1"), "display", "none");
                        dojo.style(dojo.byId("typical"), "display", "none");
                    }
                },
                clear: function () {
                    if (registry.byId("type").checked)
                    {
                        registry.byId("type").set("checked", "false");
                    }

                    registry.byId("chartDialog1").hide();

                    if (this.chart) {

                        var series = this.chart.getSeriesOrder("default");
                        for (var a in series) {
                            this.chart.removeSeries(series[a]);
                        }
                        this.chart.removeAxis("x");
                        this.count = 1;
                        this.legend.refresh();
                    }

                },
                sumofdif: function (pointclick, prevprofile)
                {

                    var sum = [];
                    var summ = 0;

                    for (a in pointclick)
                    {
                        sum[a] = ((pointclick[a] - prevprofile[a]) * (pointclick[a] - prevprofile[a]));

                        summ = summ + sum[a];

                    }
                    return summ;
                },
                selectprofile: function (sums)
                {

                    sums.sort(function (a, b) {
                        return (parseFloat(a.value) - parseFloat(b.value))
                    });
                    var key = sums[0].id;
                    return(key);


                },
                hiddentrue: function (id1, id)
                {
                    if (id1 === id)
                    {
                        return false;
                    } else
                    {
                        return true;
                    }
                },
                showLoading: function () {
                    domStyle.set("loadingIdenitfy", "display", "block");
                },
                hideLoading: function () {

                    domStyle.set("loadingIdentify", "display", "none");
                }
            });
            clazz.hasLocale = false;
            clazz.hasSettingPage = false;
            clazz.hasSettingUIFile = false;
            clazz.hasSettingLocale = false;
            clazz.hasSettingStyle = false;
            return clazz;
        });
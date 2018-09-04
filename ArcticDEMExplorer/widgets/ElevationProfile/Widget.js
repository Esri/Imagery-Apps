///////////////////////////////////////////////////////////////////////////
// Copyright (c) 2018 Esri. All Rights Reserved.
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
    "dojo/dom",
    "dojo/dom-construct",
    "dojo/dom-style",
    "esri/request",
    "esri/tasks/ImageServiceIdentifyTask",
    "esri/tasks/ImageServiceIdentifyParameters",
    "esri/geometry/Point",
    "dojox/charting/Chart",
    "dojox/charting/action2d/Tooltip",
    "dojox/charting/themes/PlotKit/blue",
    "esri/toolbars/draw",
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
                dom,
                domConstruct,
                domStyle, esriRequest, ImageServiceIdentifyTask, ImageServiceIdentifyParameters, Point, Chart, Tooltip, theme, Draw, SpatialReference, SelectableLegend, Magnify, locale, html, MosaicRule, connect, SimpleMarkerSymbol, SimpleLineSymbol, Color, PanelManager, Query, QueryTask) {
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
                i: 1,
                h: null,
                clickhandle14: null,
                wiopen: false,
                levelzoom: null,
                flagDialog: true,
                chart: null,
                legend: null,
                startup: function () {
                    this.inherited(arguments);
                    domConstruct.place('<img id="loadingElevationProfile" style="position: absolute;top:0;bottom: 0;left: 0;right: 0;margin:auto;z-index:100;" src="' + require.toUrl('jimu') + '/images/loading.gif">', this.map.container);
                    domConstruct.place('<img id="loadingMeasure" style="position: absolute;top:0;bottom: 0;left: 0;right: 0;margin:auto;z-index:100;" src="' + require.toUrl('jimu') + '/images/loading.gif">', "chartDialogElevation");
                },
                onOpen: function () {
                    if (registry.byId("buildDialog") && registry.byId("buildDialog").open)
                        registry.byId("buildDialog").hide();
                    if (registry.byId("changeDetectionDialog") && registry.byId("changeDetectionDialog").open)
                        registry.byId("changeDetectionDialog").hide();
                    if (registry.byId("contourDialog") && registry.byId("contourDialog").open)
                        registry.byId("contourDialog").hide();
                    if (registry.byId("timeDialog") && registry.byId("timeDialog").open)
                        registry.byId("timeDialog").hide();
                    connect.publish("elevationOpen", ({"flag": true}));
                    var layer = this.map.getLayer("primaryLayer");
                    if (layer && layer.url === this.config.urlElevation)
                    {
                        this.toolbar.activate(Draw.POLYLINE);
                        html.set(this.errorHandlerElevation, "Draw line/polyline on the map to get the elevation profile.");
                        registry.byId("DialogElevation").show();
                        domStyle.set("DialogElevation", "left", "160px");
                        domStyle.set("DialogElevation", "top", "75px");
                    } else {
                        html.set(this.errorHandlerElevation, "Elevation Profile not available for current Service.");
                        registry.byId("DialogElevation").show();
                        domStyle.set("DialogElevation", "left", "160px");
                        domStyle.set("DialogElevation", "top", "75px");

                    }
                    domConstruct.destroy("DialogElevation_underlay");
                    domStyle.set("chartNodeElevation", "display", "block");
                    domStyle.set("loadingElevationProfile", "display", "none");
                    domStyle.set("loadingMeasure", "display", "none");
                    setTimeout(lang.hitch(this, this.closeDialog), 3000);
                    dojo.connect(registry.byId("chartDialogElevation"), "hide", lang.hitch(this, function (e) {
                        if (this.flagDialog)
                            this.clear();
                    }));
                },
                closeDialog: function () {

                    registry.byId("DialogElevation").hide();
                },
                onClose: function () {
                    connect.publish("elevationOpen", ({"flag": false}));
                    registry.byId("mode").set("value", "profile");
                    this.toolbar.deactivate();
                    this.toolbarAreaDistance.deactivate();
                    this.clear();
                    domStyle.set("loadingElevationProfile", "display", "none");
                    domStyle.set("loadingMeasure", "display", "none");
                    if (this.elevationHandler) {
                        this.elevationHandler.remove();
                        this.elevationHandler = null;
                    }


                },
                clear: function () {
                    for (var k in this.map.graphics.graphics)
                    {
                        if (this.map.graphics.graphics[k].geometry.type === "polygon" || this.map.graphics.graphics[k].geometry.type === "polyline") {
                            if (this.map.graphics.graphics[k].symbol.color.r === 200)
                            {
                                this.map.graphics.remove(this.map.graphics.graphics[k]);
                                break;
                            }
                        }
                    }
                    if (this.chart !== null) {

                        this.flagDialog = false;

                        if (registry.byId("chartDialogElevation").open)
                            registry.byId("chartDialogElevation").hide();
                        this.flagDialog = true;

                        this.chart = null;
                        dojo.empty("chartNodeElevation");
                    } else {
                        if (registry.byId("chartDialogElevation").open)
                            registry.byId("chartDialogElevation").hide();
                    }
                },
                postCreate: function () {
                    this.inherited(arguments);

                    registry.byId("mode").on("change", lang.hitch(this, this.selectMode));
                    if (this.map) {
                        this.toolbar = new Draw(this.map);
                        dojo.connect(this.toolbar, "onDrawEnd", lang.hitch(this, this.elevationProfile));
                        this.elevationHandler = this.map.on("update-end", lang.hitch(this, this.refreshLayer));
                        this.toolbarAreaDistance = new Draw(this.map);
                        dojo.connect(this.toolbarAreaDistance, "onDrawEnd", lang.hitch(this, this.calculateAreaDistance));

                    }


                },
                refreshLayer: function () {
                    var layer = this.map.getLayer("primaryLayer");
                    if (layer.url !== this.config.urlElevation)
                    {
                        html.set(this.errorHandlerElevation, "Elevation Profile not available for current Service.");
                        registry.byId("DialogElevation").show();
                        domStyle.set("DialogElevation", "left", "160px");
                        domStyle.set("DialogElevation", "top", "75px");
                        setTimeout(lang.hitch(this, this.closeDialog), 3000);
                    }
                    connect.subscribe("layerOpen", lang.hitch(this, function (flag) {
                        if (flag.flag) {
                            pm.closePanel('widgets/ElevationProfile/Widget_18_panel');
                            connect.publish("layerOpen", [{flag: false}]);
                        }
                    }));

                },
                elevationProfile: function (geometry) {
                    domStyle.set("loadingElevationProfile", "display", "block");
                    domStyle.set("loadingMeasure", "display", "block");
                    this.clear();
                    var symbol = new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new Color([200, 0, 0]), 2);
                    var graphic = new esri.Graphic(geometry, symbol);
                    this.map.graphics.add(graphic);


                    this.getProfiles(geometry);

                },
                selectMode: function () {
                    if (registry.byId("mode").get("value") === "area")
                    {

                        if (this.chart) {
                            dojo.empty("chartNodeElevation");
                            this.chart = null;
                        }
                        this.toolbar.deactivate();
                        this.toolbarAreaDistance.activate(Draw.POLYGON);
                        domStyle.set("adUnit", "display", "inline-block");
                        domStyle.set("chartNodeElevation", "display", "none");
                    } else if (registry.byId("mode").get("value") === "distance")
                    {
                        if (this.chart) {
                            dojo.empty("chartNodeElevation");
                            this.chart = null;
                        }
                        this.toolbar.deactivate();
                        this.toolbarAreaDistance.activate(Draw.LINE);
                        domStyle.set("chartNodeElevation", "display", "none");
                        domStyle.set("adUnit", "display", "inline-block");
                    } else
                    {
                        this.toolbarAreaDistance.deactivate();
                        this.toolbar.activate(Draw.POLYLINE);
                        domStyle.set("adUnit", "display", "none");
                        html.set(this.areaDistance, "");
                        if (this.chart !== null)
                            domStyle.set("chartNodeElevation", "display", "block");
                    }
                },
                calculateAreaDistance: function (geometry) {
                    domStyle.set("loadingMeasure", "display", "block");
                    for (var k in this.map.graphics.graphics)
                    {
                        if (this.map.graphics.graphics[k].geometry.type === "polygon" || this.map.graphics.graphics[k].geometry.type === "polyline") {
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
                    if (geometry.type === "polyline")
                    {
                        var geometrytype = "esriGeometryPoint";
                        var lunit = registry.byId("measureUnits").get("value");
                        var aunit = "";
                        var point1 = new Point(geometry.paths[0][1][0], geometry.paths[0][1][1], geometry.spatialReference);
                        var togeometry = JSON.stringify(point1.toJson());
                        var point2 = new Point(geometry.paths[0][0][0], geometry.paths[0][0][1], geometry.spatialReference);
                        var fromgeometry = JSON.stringify(point2.toJson());
                        var operation = "esriMensurationDistanceAndAngle";
                    } else
                    {
                        var geometrytype = "esriGeometryPolygon";
                        var aunit = (registry.byId("measureUnits").get("value")).slice(0, 4) + "Square" + (registry.byId("measureUnits").get("value")).slice(4);
                        var lunit = "";
                        var togeometry = "";
                        var fromgeometry = JSON.stringify(geometry.toJson());
                        var operation = "esriMensurationAreaAndPerimeter";
                    }
                    var layersRequest1 = esri.request({
                        url: this.config.urlElevation + "/Measure",
                        content: {
                            fromGeometry: fromgeometry,
                            toGeometry: togeometry,
                            geometryType: geometrytype,
                            measureOperation: operation,
                            linearUnit: lunit,
                            areaUnit: aunit,
                            f: "json"
                        },
                        handleAs: "json",
                        callbackParamName: "callback"
                    });



                    layersRequest1.then(lang.hitch(this, function (data1) {
                        if (registry.byId("mode").get("value") === "area")
                            html.set(this.areaDistance, "Area: " + (data1.area.value).toFixed(2) + " Square " + (registry.byId("measureUnits").get("value")).slice(4));
                        else if (registry.byId("mode").get("value") === "distance")
                            html.set(this.areaDistance, "Distance: " + (data1.distance.value).toFixed(2) + " " + (registry.byId("measureUnits").get("value")).slice(4));
                        if (!registry.byId("chartDialogElevation").open) {
                            registry.byId("chartDialogElevation").show();
                            domStyle.set("chartDialogElevation", "left", "160px");
                            domStyle.set("chartDialogElevation", "top", "75px");
                        }
                        domConstruct.destroy("chartDialogElevation_underlay");
                        domStyle.set("loadingMeasure", "display", "none");
                    }), lang.hitch(this, function (error) {
                        domStyle.set("loadingMeasure", "display", "none");
                    }));
                },
                getProfiles: function (geometry) {
                    html.set(this.areaDistance, "");
                    var distance = 0;
                    for (var k = 0; k < geometry.paths[0].length; k++) {
                        if (k !== 0)
                            distance = distance + Math.pow(((Math.pow((geometry.paths[0][k][0] - geometry.paths[0][k - 1][0]), 2) + Math.pow((geometry.paths[0][k][1] - geometry.paths[0][k - 1][1]), 2))), 0.5);
                    }
                    var sampleDistance = distance / 30;

                    var getLayer = this.map.getLayer("primaryLayer");

                    if (getLayer.mosaicRule !== null) {
                        var mosaicFromLayer = JSON.stringify((getLayer.mosaicRule).toJson());
                    }
                    html.set(this.errorHandlerElevation, "");
                    registry.byId("chartDialogElevation").show();
                    domStyle.set("chartDialogElevation", "left", "160px");
                    domStyle.set("chartDialogElevation", "top", "75px");
                    var layersRequest = esri.request({
                        url: this.config.urlElevation + "/getSamples",
                        content: {
                            geometry: JSON.stringify(geometry.toJson()),
                            geometryType: "esriGeometryPolyline",
                            sampleDistance: sampleDistance,
                            returnFirstValueOnly: true,
                            mosaicRule: mosaicFromLayer,
                            f: "json"
                        },
                        handleAs: "json",
                        callbackParamName: "callback"
                    });

                    layersRequest.then(lang.hitch(this, function (data) {

                        var j = data.samples.length;
                        for (var i = 0; i < data.samples.length; i++) {
                            var val = data.samples[i].value.split(' ');
                            if (val[0] === "NoData") {
                                data.samples.slice(i, 1);
                                i--;
                                j = j - 1;

                            }
                        }
                        data.samples.sort(function (a, b) {
                            return a.locationId - b.locationId;
                        });


                        var tempDist = 0;
                        var arrayXAxis = [], arrayYAxis = [], minpixelvalue = 9999, maxpixelvalue = -9999;

                        this.location = [];
                        for (var i = 0; i < data.samples.length; i++) {
                            if (i === 0) {
                                tempDist = 0;
                            } else
                                tempDist = tempDist + Math.pow(((Math.pow((data.samples[i].location.x - data.samples[i - 1].location.x), 2) + Math.pow(data.samples[i].location.y - data.samples[i - 1].location.y, 2))), 0.5);

                            arrayXAxis.push({
                                value: i + 1,
                                text: (parseInt(tempDist)).toString()
                            });
                            this.location.push({
                                value: i + 1,
                                loc: data.samples[i].location
                            });
                            var values = data.samples[i].value.split(' ');
                            minpixelvalue = parseFloat(values[0]) < minpixelvalue ? parseFloat(values[0]) : minpixelvalue;
                            maxpixelvalue = parseFloat(values[0]) > maxpixelvalue ? parseFloat(values[0]) : maxpixelvalue;
                            arrayYAxis.push({
                                y: parseFloat(values[0]),
                                tooltip: (parseFloat(values[0])).toFixed(2)
                            });
                        }
                        registry.byId("chartDialogElevation").show();
                        domStyle.set("chartDialogElevation", "left", "160px");
                        domStyle.set("chartDialogElevation", "top", "75px");
                        this.chart = new Chart("chartNodeElevation");
                        this.chart.addPlot("default", {
                            type: "Lines",
                            tension: "S",
                            markers: true,
                            shadows: {dx: 4, dy: 4}
                        });
                        this.chart.setTheme(theme);
                        this.chart.title = "Distance-Elevation(m)";
                        var minval = parseInt(minpixelvalue) - 10;
                        var maxval = parseInt(maxpixelvalue) + 10;
                        this.chart.addAxis("y", {min: minval, max: maxval, vertical: true, fixLower: "None", fixUpper: "None", title: "Elevation Values", titleOrientation: "axis"});

                        //labels: arrayXAxislabels: arrayXAxis, labelSizeChange: true,
                        this.chart.addAxis("x", {labels: arrayXAxis, labelSizeChange: true, title: "Distance", titleOrientation: "away", minorTicks: false, majorTickStep: 1});
                        this.chart.addSeries("ElevationProfile", arrayYAxis);
                        this.toolTip = new Tooltip(this.chart, "default");
                        this.magnify = new Magnify(this.chart, "default");


                        this.chart.render();
                        if (this.legend !== null)
                        {
                            this.legend.set("params", {chart: null, horizontal: true, outline: false});
                            this.legend.set("chart", null);
                            this.legend.refresh();
                        }
                        this.chart.connectToPlot("default", lang.hitch(this, this.showPointOnMap));
                        domStyle.set("chartNodeElevation", "display", "block");
                        var height = this.map.height * 0.4;
                        var width = this.map.width * 0.5;
                        domStyle.set("chartNodeElevation", "height", (height * 0.75).toString() + "px");
                        domStyle.set("chartNodeElevation", "width", (width).toString() + "px");
                        height = height * 0.75;
                        this.chart.resize(width, height);
                        domConstruct.destroy("chartDialogElevation_underlay");
                        domStyle.set("loadingElevationProfile", "display", "none");
                        domStyle.set("loadingMeasure", "display", "none");

                    }), lang.hitch(this, function (error) {
                        if (this.map.graphics.graphics[1])
                            this.map.graphics.remove(this.map.graphics.graphics[1]);
                        domStyle.set("loadingElevationProfile", "display", "none");
                        domStyle.set("loadingMeasure", "display", "none");

                    }));
                },
                showPointOnMap: function (evt) {
                    if (evt.element === "marker") {
                        if (evt.type === "onmouseover") {
                            if (registry.byId("mode").get("value") === "profile") {
                                for (var j = 0; j < this.location.length; j++) {
                                    if (this.location[j].value === evt.x) {

                                        var symbol1 = new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_X, 15, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                                                new Color([0, 0, 0]), 2), new Color([0, 0, 0]));
                                        var point = new Point(this.location[j].loc.x, this.location[j].loc.y, new SpatialReference({wkid: this.location[j].loc.spatialReference.wkid}));
                                        var graphic1 = new esri.Graphic(point, symbol1);
                                        this.map.graphics.add(graphic1);
                                        break;

                                    }
                                }
                            }

                        } else if (evt.type === "onmouseout") {

                            this.map.graphics.remove(this.map.graphics.graphics[2]);
                        }
                    }
                },
                showLoading: function () {
                    domStyle.set("loadingep", "display", "block");
                },
                hideLoading: function () {

                    domStyle.set("loadingep", "display", "none");
                }
            });
            clazz.hasLocale = false;
            clazz.hasSettingPage = false;
            clazz.hasSettingUIFile = false;
            clazz.hasSettingLocale = false;
            clazz.hasSettingStyle = false;
            return clazz;
        });
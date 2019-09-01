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
    "dijit/registry",
    "dojo/_base/lang",
    "dojo/html",
    "dojo/dom",
    "esri/layers/MosaicRule",
    "esri/tasks/query",
    "esri/tasks/QueryTask",
    "esri/geometry/Extent",
    "dojo/date/locale",
    "dojox/charting/Chart",
    "dojox/charting/action2d/Tooltip",
    "dojox/charting/themes/PrimaryColors",
    "dojox/charting/widget/SelectableLegend",
    "dojox/charting/action2d/Magnify",
    "dojo/html",
    "dojo/dom-construct",
    "dijit/form/HorizontalSlider",
    "dijit/form/HorizontalRule",
    "dijit/form/HorizontalRuleLabels",
    "esri/symbols/SimpleLineSymbol",
    "esri/Color",
    "dojo/dom-style",
    "esri/request",
    "dojo/_base/connect", "esri/toolbars/draw",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/Color",
    "jimu/PanelManager",
    "esri/geometry/Polygon",
    "dijit/form/Select",
    "dijit/form/Button",
    "dijit/form/CheckBox",
    "dijit/Tooltip",
    "dijit/Dialog",
    "dojox/charting/plot2d/Lines",
    "dojox/charting/plot2d/Markers",
    "dojox/charting/axis2d/Default"
],
        function (
                declare,
                _WidgetsInTemplateMixin,
                template,
                BaseWidget,
                registry,
                lang,
                html,
                dom,
                MosaicRule,
                Query, QueryTask, Extent, locale, Chart, Tooltip, theme, SelectableLegend, Magnify, html, domConstruct, HorizontalSlider, HorizontalRule, HorizontalRuleLabels, SimpleLineSymbol, Color, domStyle, esriRequest, connect, Draw, SimpleMarkerSymbol, Color, PanelManager, Polygon) {

            var pm = PanelManager.getInstance();
            var clazz = declare([BaseWidget, _WidgetsInTemplateMixin], {
                templateString: template,
                name: 'ISTimeFilter',
                baseClass: 'jimu-widget-ISTimeFilter',
                primaryLayer: null,
                orderedDates: null,
                sliderRules: null,
                sliderLabels: null,
                slider: null,
                sliderValue: null,
                h: null,
                datesclick: null,
                item: false,
                flagvalue: true,
                y1: null,
                extentChangeHandler: null,
                refreshHandlerTime: null,
                lengthofsamples: null,
                noSceneFlag: false,
                previousDateOnTimeSlider: null,
                appScene: null,
                counterCheck: 1,
                startup: function () {
                    this.inherited(arguments);
                    domConstruct.place('<img id="loadingts" style="position: absolute;top:0;bottom: 0;left: 0;right: 0;margin:auto;z-index:100;" src="' + require.toUrl('jimu') + '/images/loading.gif">', "timeDialog");
                    this.resizeTimeWidget();
                },
                resizeTimeWidget: function () {
                    if (window.innerWidth >= 1200) {
                        domStyle.set("timeDialog", "font-size", "12px");
                        domStyle.set("timeDialog", "width", "440px");
                        domStyle.set("chartNode", "width", "390px");
                        domStyle.set("chartNode", "height", "270px");
                        domStyle.set("seasonBlock", "display", "inline");
                        domStyle.set("waitDialog", "font-size", "12px");
                        domStyle.set("legend", "font-size", "12px");
                        if (this.chart) {
                            this.chart.resize(390, 270);
                        }
                    } else if (window.innerWidth < 1200 && window.innerWidth >= 850) {
                        domStyle.set("timeDialog", "font-size", "9px");
                        domStyle.set("timeDialog", "width", "340px");
                        domStyle.set("chartNode", "width", "280px");
                        domStyle.set("chartNode", "height", "190px");
                        domStyle.set("seasonBlock", "display", "inline");
                        domStyle.set("waitDialog", "font-size", "9px");
                        domStyle.set("legend", "font-size", "7px");
                        if (this.chart) {
                            this.chart.resize(280, 190);
                        }
                    } else if (window.innerWidth < 850 && window.innerWidth >= 620) {
                        domStyle.set("timeDialog", "font-size", "8px");
                        domStyle.set("timeDialog", "width", "300px");
                        domStyle.set("chartNode", "width", "260px");
                        domStyle.set("chartNode", "height", "180px");
                        domStyle.set("seasonBlock", "display", "inline");
                        domStyle.set("waitDialog", "font-size", "8px");
                        domStyle.set("legend", "font-size", "6px");
                        if (this.chart) {
                            this.chart.resize(260, 180);
                        }
                    } else {
                        domStyle.set("timeDialog", "font-size", "7px");
                        domStyle.set("timeDialog", "width", "200px");
                        domStyle.set("chartNode", "width", "180px");
                        domStyle.set("chartNode", "height", "125px");
                        domStyle.set("seasonBlock", "display", "block");
                        domStyle.set("waitDialog", "font-size", "7px");

                        domStyle.set("legend", "font-size", "5px");
                        if (this.chart) {
                            this.chart.resize(180, 125);
                        }
                    }
                    if (registry.byId("timeDialog").open) {
                        domStyle.set("timeDialog", "top", "70px");
                        domStyle.set("timeDialog", "left", "160px");
                    }
                    if (registry.byId("waitDialog").open) {
                        domStyle.set("waitDialog", "top", "70px");
                        domStyle.set("waitDialog", "left", "160px");
                    }
                },
                postCreate: function () {
                    window.addEventListener("resize", lang.hitch(this, this.resizeTimeWidget));
                    domConstruct.place('<img id="loadingtt" style="position: absolute;top:0;bottom: 0;left: 0;right: 0;margin:auto;z-index:100;" src="' + require.toUrl('jimu') + '/images/loading.gif">', this.map.container);

                    registry.byId("refreshTimesliderBtn").on("click", lang.hitch(this, this.timeSliderRefresh));
                    registry.byId("cloudFilter").on("change", lang.hitch(this, this.timeSliderRefresh));
                    registry.byId("seasonSelect").on("change", lang.hitch(this, this.timeSliderRefresh));
                    if (this.map) {

                        this.map.on("update-start", lang.hitch(this, this.showLoading));
                        this.map.on("update-end", lang.hitch(this, this.hideLoading));
                        this.map.on("update-end", lang.hitch(this, this.timeUpdate));
                        this.toolbarTemporal = new Draw(this.map);
                        dojo.connect(this.toolbarTemporal, "onDrawComplete", lang.hitch(this, this.addGraphic));

                    }
                },
                timeUpdate: function () {
                    connect.subscribe("refreshTime", lang.hitch(this, function (flag) {
                        if (flag.flag) {
                            this.clear();
                            html.set(this.pointgraph, "");
                            this.timeSliderRefresh();
                            connect.publish("refreshTime", [{flag: false}]);
                        }
                    }));
                },
                onOpen: function () {

                    if (registry.byId("buildDialog") && registry.byId("buildDialog").open)
                        registry.byId("buildDialog").hide();
                    connect.publish("timeopen", [{time: "open"}]);
                    if (registry.byId("appSceneID").get("value")) {

                        var userDefinedVariables = (registry.byId("appSceneID").get("value")).split(" ");
                        this.appScene = userDefinedVariables[0];
                        registry.byId("cloudFilter").set("value", userDefinedVariables[1]);
                        registry.byId("seasonSelect").set("value", userDefinedVariables[2]);
                        registry.byId("appSceneID").set("value", null);

                    }
                    this.extentChangeHandler = this.map.on("extent-change", lang.hitch(this, this.extentChange));
                    this.autoresize();
                    registry.byId("timeDialog").connect(registry.byId("timeDialog"), "hide", lang.hitch(this, function (e) {
                        if (this.flagvalue) {
                            if (this.extentChangeHandler !== null)
                            {
                                this.extentChangeHandler.remove();
                                this.extentChangeHandler = null;

                            }
                            this.previousDateOnTimeSlider = null;

                            if (this.refreshHandlerTime !== null)
                            {
                                this.refreshHandlerTime.remove();
                                this.refreshHandlerTime = null;
                            }
                            domStyle.set(this.filterDiv, "display", "none");

                            if (this.mosaicBackup) {
                                var mr = new MosaicRule(this.mosaicBackup);
                            } else {
                                var mr = new MosaicRule({"mosaicMethod": "esriMosaicAttribute", "sortField": "Best", "sortValue": 0, "ascending": true, "mosaicOperation": "MT_FIRST"});
                            }
                            this.primaryLayer.setMosaicRule(mr);
                            pm.closePanel('_25_panel');

                        }

                    }));
                    if ((this.map.getLevel()) >= 10)
                    {
                        domStyle.set("access", "display", "none");

                        this.refreshData();
                        html.set(this.temporalpro, "Pick point on map to get temporal profile for that point");
                        if (!registry.byId("timeDialog").open)
                            registry.byId("timeDialog").show();
                        domStyle.set("timeDialog", "top", "70px");
                        domStyle.set("timeDialog", "left", "160px");
                        domConstruct.destroy("timeDialog_underlay");
                        if (!this.slider)
                            this.timeSliderShow();
                        domStyle.set(this.filterDiv, "display", "block");
                        if (!this.refreshHandlerTime) {
                            this.refreshHandlerTime = this.map.on("update-end", lang.hitch(this, this.refreshData));
                        }


                    } else
                    {
                        domStyle.set(this.filterDiv, "display", "none");
                        domStyle.set("access", "display", "block");
                        html.set(this.temporalpro, "");
                        if (!registry.byId("timeDialog").open) {
                            registry.byId("timeDialog").show();
                            domStyle.set("timeDialog", "top", "70px");
                            domStyle.set("timeDialog", "left", "160px");
                        }
                    }

                    if (this.y1 != null) {
                        if (this.y1[0].className == 'icon-node')
                        {
                            dojo.addClass(this.y1[0], "jimu-state-selected");
                        }
                    }
                    this.toolbarTemporal.activate(Draw.POINT);
                },
                autoresize: function ()
                {
                    this.h = this.map.height;
                    this.h = (parseInt((this.h / 5.5))).toString();
                },
                onClose: function ()
                {
                    this.toolbarTemporal.deactivate();
                    for (var a in this.map.graphics.graphics) {
                        if (this.map.graphics.graphics[a].geometry.type === "point" && this.map.graphics.graphics[a].symbol && this.map.graphics.graphics[a].symbol.color.r === 255) {
                            this.map.graphics.remove(this.map.graphics.graphics[a]);
                            break;
                        }
                    }

                    if (registry.byId("timeDialog").open)
                    {
                        this.flagvalue = false;
                        registry.byId("timeDialog").hide();
                        this.flagvalue = true;
                        html.set(this.pointgraph, "");
                        this.clear();
                        if (this.refreshHandlerTime !== null)
                        {
                            this.refreshHandlerTime.remove();
                            this.refreshHandlerTime = null;
                        }

                        connect.publish("timeopen", [{time: "close"}]);
                        this.item = false;

                        if (this.extentChangeHandler !== null)
                        {
                            this.extentChangeHandler.remove();
                            this.extentChangeHandler = null;

                        }

                    } else
                    {

                        html.set(this.pointgraph, "");
                        this.clear();


                        this.item = false;
                        connect.publish("timeopen", [{time: "close"}]);

                        this.timeSliderHide();
                    }
                    if (dom.byId("slider"))
                        domStyle.set("slider", "display", "block");
                    if (dom.byId("slider2"))
                        domStyle.set("slider2", "display", "block");
                    if (dom.byId("slider3"))
                        domStyle.set("slider3", "display", "block");
                    domStyle.set("loadingts", "display", "none");
                    // } 
                },
                clear: function () {

                    domStyle.set("chartshow", "display", "none");
                    domStyle.set(dom.byId("cloudSelect"), "display", "block");

                    if (this.chart) {
                        dojo.empty("chartNode");
                    }

                },
                extentChange: function (extentInfo) {
                    if (extentInfo.levelChange) {
                        if (this.map.getLevel() < 10) {
                            html.set(this.temporalpro, "");
                            domStyle.set("access", "display", "block");
                            domStyle.set(this.filterDiv, "display", "none");

                            if (this.mosaicBackup) {
                                var mr = new MosaicRule(this.mosaicBackup);
                            } else {
                                var mr = new MosaicRule({"mosaicMethod": "esriMosaicAttribute", "sortField": "Best", "sortValue": 0, "ascending": true, "mosaicOperation": "MT_FIRST"});
                            }
                            this.primaryLayer.setMosaicRule(mr);

                        } else {

                            domStyle.set(this.filterDiv, "display", "block");
                            domStyle.set("access", "display", "none");
                            if (!this.slider) {
                                this.timeSliderShow();
                            } else {
                                if (dom.byId("slider") && domStyle.get("slider", "display") !== "none")
                                    this.timeSliderRefresh();
                                else {
                                    if (this.primaryLayer && this.saveMosaicRuleChartMode)
                                        this.primaryLayer.setMosaicRule(this.saveMosaicRuleChartMode);
                                }
                            }
                        }
                    } else {
                        if (this.featureIDS && this.featureIDS.length < 2) {
                            for (var f in this.dateobj) {
                                if (this.dateobj[f].obj === this.featureIDS[0]) {
                                    var sceneExtent = this.dateobj[f].geo;
                                    break;
                                }
                            }
                        } else {
                            var twoSceneExtent = [];
                            for (var f in this.dateobj) {
                                if (this.dateobj[f].obj === this.featureIDS[0]) {
                                    twoSceneExtent.push(this.dateobj[f].geo);
                                    break;
                                }
                            }
                            for (var s in this.dateobj) {
                                if (this.dateobj[s].obj === this.featureIDS[1]) {
                                    twoSceneExtent.push(this.dateobj[s].geo);
                                    break;
                                }
                            }
                            var sceneExtent = {"xmin": twoSceneExtent[1].xmin, "ymin": twoSceneExtent[1].ymin, "xmax": twoSceneExtent[0].xmax, "ymax": twoSceneExtent[0].ymax};

                        }
                        var mapExtent = extentInfo.extent;



                        if (mapExtent.xmax < sceneExtent.xmin || mapExtent.xmin > sceneExtent.xmax || mapExtent.ymin > sceneExtent.ymax || mapExtent.ymax < sceneExtent.ymin) {

                            if (this.mosaicBackup) {
                                var mr = new MosaicRule(this.mosaicBackup);
                            } else {
                                var mr = new MosaicRule({"mosaicMethod": "esriMosaicAttribute", "sortField": "Best", "sortValue": 0, "ascending": true, "mosaicOperation": "MT_FIRST"});
                            }
                            this.primaryLayer.setMosaicRule(mr);
                            this.timeSliderHide();
                            pm.closePanel('_25_panel');

                        }


                    }
                },
                refreshData: function () {
                    connect.subscribe("layerOpen", lang.hitch(this, function (flag) {
                        if (flag.flag) {
                            pm.closePanel('_25_panel');
                            connect.publish("layerOpen", [{flag: false}]);
                        }
                    }));

                    this.primaryLayer = this.map.getLayer("primaryLayer");
                    this.mosaicBackup = this.primaryLayer.defaultMosaicRule;
                    this.dateField = "AcquisitionDate";

                },
                addGraphic: function (geoObj) {
                    var geometry = geoObj.geometry;
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
                    this.temporalprof(geometry);

                },
                limitvalue: function (num)
                {
                    if (num < (-1))
                    {
                        num = -1;
                    }
                    if (num > 1)
                    {
                        num = 1;
                    }
                    return num;
                },
                temporalprof: function (evt)
                {

                    if (!this.noSceneFlag) {
                        this.flagvalue = false;
                        registry.byId("timeDialog").hide();
                        this.flagvalue = true;
                        this.item = true;
                        this.primaryLayer = this.map.getLayer("primaryLayer");
                        var geoPoint = [];
                        var point = evt;
                        var query = new Query();
                        query.geometry = point;
                        query.outFields = [this.dateField, "OBJECTID", "CenterX", "CenterY", "GroupName", "Month", "WRS_Row"];

                        if (registry.byId("seasonSelect").get("value") === "0")
                            query.where = "(Category = 1) AND (CloudCover <=" + registry.byId("cloudFilter").get("value") + ")";
                        else if (registry.byId("seasonSelect").get("value") === "1" || registry.byId("seasonSelect").get("value") === "3")
                            query.where = "(Category = 1) AND (CloudCover <=" + registry.byId("cloudFilter").get("value") + ") AND (((Month >=3) AND (Month <=5)) OR ((Month >=9) AND (Month <=11)))";
                        else if (registry.byId("seasonSelect").get("value") === "2" || registry.byId("seasonSelect").get("value") === "4")
                            query.where = "(Category = 1) AND (CloudCover <=" + registry.byId("cloudFilter").get("value") + ") AND (((Month >=6) AND (Month <=8)) OR ((Month <=2) OR (Month >=12)))";

                        query.orderByFields = [this.dateField];
                        query.returnGeometry = false;
                        var array = [], arrayId = [];
                        var queryTask = new QueryTask(this.config.msurl);
                        var distance = [];
                        queryTask.execute(query, lang.hitch(this, function (result) {

                            var data = [];
                            switch (registry.byId("seasonSelect").get("value")) {
                                case "0":
                                {
                                    data = result.features;
                                    break;
                                }
                                case "1":
                                {
                                    for (var b in result.features) {
                                        if (result.features[b].attributes.WRS_Row <= 60) {
                                            if (result.features[b].attributes.Month <= 5)
                                                data.push(result.features[b]);
                                        } else {
                                            if (result.features[b].attributes.Month >= 9 && result.features[b].attributes.Month <= 11)
                                                data.push(result.features[b]);
                                        }
                                    }
                                    break;
                                }
                                case "2":
                                {
                                    for (var b in result.features) {
                                        if (result.features[b].attributes.WRS_Row <= 60) {
                                            if (result.features[b].attributes.Month >= 6 && result.features[b].attributes.Month <= 8)
                                                data.push(result.features[b]);
                                        } else {
                                            if (result.features[b].attributes.Month >= 12 || result.features[b].attributes.Month <= 2)
                                                data.push(result.features[b]);
                                        }
                                    }
                                    break;
                                }
                                case "3":
                                {
                                    for (var b in result.features) {
                                        if (result.features[b].attributes.WRS_Row <= 60) {
                                            if (result.features[b].attributes.Month >= 9 && result.features[b].attributes.Month <= 11)
                                                data.push(result.features[b]);
                                        } else {
                                            if (result.features[b].attributes.Month <= 5)
                                                data.push(result.features[b]);
                                        }
                                    }
                                    break;

                                }
                                case "4":
                                {
                                    for (var b in result.features) {
                                        if (result.features[b].attributes.WRS_Row <= 60) {
                                            if (result.features[b].attributes.Month >= 12 || result.features[b].attributes.Month <= 2)
                                                data.push(result.features[b]);
                                        } else {
                                            if (result.features[b].attributes.Month >= 6 && result.features[b].attributes.Month <= 8)
                                                data.push(result.features[b]);
                                        }
                                    }
                                    break;


                                }

                            }




                            html.set(this.queryScenes, "Querying " + data.length + " scenes to create profile. May take longer first time.");
                            registry.byId("waitDialog").show();
                            domStyle.set("waitDialog", "top", "70px");
                            domStyle.set("waitDialog", "left", "160px");
                            var prevIterationValue = 0;
                            this.lengthofsamples = data.length;
                            for (var i = 0; i < this.lengthofsamples; i++) {
                                if (data[i].attributes.GroupName.slice(0, 3) !== "LC8") {
                                    array.push({
                                        objectId: data[i].attributes.OBJECTID,
                                        acqDate: data[i].attributes.AcquisitionDate,
                                        name: data[i].attributes.GroupName
                                    });
                                    arrayId[i] = data[i].attributes.OBJECTID;


                                } else {
                                    distance.push({
                                        dist: Math.sqrt(Math.pow((data[i].attributes.CenterX - evt.x), 2) + Math.pow((data[i].attributes.CenterY - evt.y), 2)),
                                        objectId: data[i].attributes.OBJECTID,
                                        acqDate: data[i].attributes.AcquisitionDate,
                                        name: data[i].attributes.GroupName
                                    });

                                }
                            }
                            if (this.primaryLayer.url !== this.config.msurl) {
                                arrayId.splice(0, array.length);
                                array.splice(0, array.length);
                            }
                            var prevIterationValue = array.length;
                            distance.sort(function (a, b) {
                                return a.dist - b.dist;
                            });
                            var k = 0;
                            var range = 20 - prevIterationValue;
                            if (range <= distance.length) {
                                var limitSamples = 20;
                            } else
                            {
                                var limitSamples = data.length;
                            }

                            if (distance.length !== 0) {

                                for (var j = prevIterationValue; j < limitSamples; j++) {
                                    if (j !== 0 && distance[k].acqDate !== array[j - 1].acqDate) {
                                        array.push({
                                            objectId: distance[k].objectId,
                                            acqDate: distance[k].acqDate,
                                            name: distance[k].name

                                        });
                                        arrayId[j] = distance[k].objectId;
                                        k++;
                                    } else if (j === 0)
                                    {
                                        array.push({
                                            objectId: distance[k].objectId,
                                            acqDate: distance[k].acqDate,
                                            name: distance[k].name

                                        });
                                        arrayId[j] = distance[k].objectId;
                                        k++;
                                    }
                                }
                            }


                            var mosaicLock = new MosaicRule({"mosaicMethod": "esriMosaicLockRaster", "ascending": true, "mosaicOperation": "MT_FIRST", "lockRasterIds": arrayId});
                            mosaicLock = JSON.stringify(mosaicLock);


                            var normPoint = point.normalize();
                            var request1 = esriRequest({
                                url: this.config.msurl + "/getSamples",
                                content: {
                                    geometry: JSON.stringify(point.toJson()),
                                    geometryType: "esriGeometryPoint",
                                    mosaicRule: mosaicLock,
                                    returnGeometry: false,
                                    returnFirstValueOnly: false,
                                    f: "json"
                                },
                                handleAs: "json",
                                callbackParamName: "callback"
                            });
                            request1.then(lang.hitch(this, function (data) {

                                var items = data.samples;



                                var itemInfo = [];
                                for (var a in items) {
                                    var plot = items[a].value.split(' ');
                                    for (var k in plot) {
                                        if (plot[k]) {
                                            plot[k] = parseInt(plot[k], 10);
                                        } else {
                                            plot[k] = 0;
                                        }
                                    }

                                    var normalizedValues = [];
                                    var normalizedValues2 = [];
                                    var normalizedValues4 = [];

                                    var nir = plot[4];
                                    var red = plot[3];
                                    var calc = (nir - red) / (red + nir);
                                    var swir1 = plot[5];
                                    var ndmi = ((nir - swir1) / (nir + swir1));
                                    var urban = (((swir1 - nir) / (swir1 + nir)) - ((nir - red) / (red + nir))) / 2;
                                    ndmi = this.limitvalue(ndmi);

                                    calc = this.limitvalue(calc);
                                    urban = this.limitvalue(urban);
                                    normalizedValues.push(
                                            {y: calc,
                                                tooltip: calc.toFixed(3) + ", " + locale.format(new Date(array[a].acqDate), {selector: "date", datePattern: "dd/MM/yy"})});

                                    normalizedValues2.push(
                                            {y: ndmi,
                                                tooltip: ndmi.toFixed(3) + ", " + locale.format(new Date(array[a].acqDate), {selector: "date", datePattern: "dd/MM/yy"})});

                                    normalizedValues4.push(
                                            {y: urban,
                                                tooltip: urban.toFixed(3) + ", " + locale.format(new Date(array[a].acqDate), {selector: "date", datePattern: "dd/MM/yy"})});
                                    itemInfo.push({
                                        acqDate: array[a].acqDate,
                                        objid: array[a].objectId,
                                        values: normalizedValues,
                                        ndmiValues: normalizedValues2,
                                        urbanValues: normalizedValues4,
                                        name: array[a].name
                                    });

                                }


                                var byDate = itemInfo.slice(0);
                                byDate.sort(function (a, b) {
                                    return a.acqDate - b.acqDate;
                                });
                                this.NDVIData = byDate;
                                this.NDVIValues = [];
                                this.NDMIValues = [];
                                this.UrbanValues = [];
                                this.NDVIDates = [];

                                for (var a = 0; a < this.NDVIData.length; a++) {
                                    this.NDVIDates.push({
                                        text: locale.format(new Date(this.NDVIData[a].acqDate), {selector: "date", datePattern: "dd/MM/yy"}),
                                        value: parseInt(a) + 1,
                                    });

                                    this.NDVIValues.push({
                                        y: this.NDVIData[a].values[0].y,
                                        tooltip: this.NDVIData[a].values[0].tooltip
                                    });
                                    this.NDMIValues.push({
                                        y: this.NDVIData[a].ndmiValues[0].y,
                                        tooltip: this.NDVIData[a].ndmiValues[0].tooltip
                                    });
                                    this.UrbanValues.push({
                                        y: this.NDVIData[a].urbanValues[0].y,
                                        tooltip: this.NDVIData[a].urbanValues[0].tooltip
                                    });
                                }
                                html.set(this.temporalpro, "");
                                html.set(this.pointgraph, "Pick point on map to reset location.<br /> Pick point on graph to set image date");
                                domStyle.set("chartshow", "display", "block");
                                domStyle.set(dom.byId("cloudSelect"), "display", "none");

                                if (!registry.byId("timeDialog").open)
                                {
                                    registry.byId("waitDialog").hide();
                                    registry.byId("timeDialog").show();
                                    domStyle.set("timeDialog", "top", "70px");
                                    domStyle.set("timeDialog", "left", "160px");
                                }

                                this.chart = new Chart("chartNode");
                                this.chart.addPlot("default", {
                                    type: "Lines",
                                    markers: true,
                                    shadows: {dx: 4, dy: 4}
                                });
                                this.chart.setTheme(theme);


                                this.count = 1;

                                this.chart.addAxis("y", {vertical: true, fixLower: "major", fixUpper: "major", title: "Data Values", titleOrientation: "axis"});
                                this.chart.addAxis("x", {labels: this.NDVIDates, labelSizeChange: true, title: "Acquisition Date", titleOrientation: "away", majorTickStep: 1, minorTicks: false});

                                this.chart.addSeries("NDMI Moisture", this.NDMIValues, {stroke: {color: "#40a4df", width: 1.5}, fill: "#40a4df", hidden: true});
                                this.chart.addSeries("Urban", this.UrbanValues, {stroke: {color: "gray", width: 1.5}, fill: "gray", hidden: true});
                                this.chart.addSeries("NDVI Vegetation", this.NDVIValues, {stroke: {color: "forestgreen", width: 1.5}, fill: "forestgreen"});


                                this.toolTip = new Tooltip(this.chart, "default");
                                this.magnify = new Magnify(this.chart, "default");

                                this.chart.render();

                                if (!this.legend)
                                    this.legend = new SelectableLegend({chart: this.chart, horizontal: true, outline: false}, "legend");
                                else {
                                    this.legend.set("params", {chart: this.chart, horizontal: true, outline: false});
                                    this.legend.set("chart", this.chart);
                                    this.legend.refresh();
                                }
                                domConstruct.destroy("chartDialog_underlay");
                                domConstruct.destroy("timeDialog_underlay");
                                this.seclayer = this.primaryLayer.url;
                                this.chart.connectToPlot("default", lang.hitch(this, this.clickdata));

                                domStyle.set("slider", "display", "none");
                                domStyle.set("slider2", "display", "none");
                                domStyle.set("slider3", "display", "none");

                            }), lang.hitch(this, function (error)
                            {
                                domStyle.set(dom.byId("loadingts"), "display", "none");
                            }));

                        }), lang.hitch(this, function (error) {
                            domStyle.set("loadingts", "display", "none");
                        }));

                    }
                },
                clickdata: function (evt)
                {

                    var type2 = evt.type;
                    if (type2 === "onclick")
                    {
                        this.datesclick = (evt.x - 1);
                        for (var g = 0; g < this.orderedDates.length; g++)
                        {
                            if (locale.format(new Date(this.orderedDates[g]), {selector: "date", datePattern: "dd/MM/yy"}) === locale.format(new Date(this.NDVIData[this.datesclick].acqDate), {selector: "date", datePattern: "dd/MM/yy"}))
                            {
                                this.slider.set("value", g);
                                this.sliderChange();
                            }
                        }
                    }
                },
                timeSliderShow: function () {

                    this.primaryLayer = this.map.getLayer("primaryLayer");
                    var extent = new Extent(this.map.extent);
                    var xlength = (extent.xmax - extent.xmin) / 4;
                    var ylength = (extent.ymax - extent.ymin) / 4;
                    var xminnew = extent.xmin + xlength;
                    var xmaxnew = extent.xmax - xlength;
                    var yminnew = extent.ymin + ylength;
                    var ymaxnew = extent.ymax - ylength;
                    var extentnew = new Extent(xminnew, yminnew, xmaxnew, ymaxnew, extent.spatialReference);
                    var query = new Query();
                    query.geometry = extentnew;
                    query.outFields = [this.dateField, "GroupName", "Best", "CloudCover", "WRS_Row", "Month"];
                    if (registry.byId("seasonSelect").get("value") === "0")
                        query.where = "(Category = 1) AND (CloudCover <=" + registry.byId("cloudFilter").get("value") + ")";
                    else if (registry.byId("seasonSelect").get("value") === "1" || registry.byId("seasonSelect").get("value") === "3")
                        query.where = "(Category = 1) AND (CloudCover <=" + registry.byId("cloudFilter").get("value") + ") AND (((Month >=3) AND (Month <=5)) OR ((Month >=9) AND (Month <=11)))";
                    else if (registry.byId("seasonSelect").get("value") === "2" || registry.byId("seasonSelect").get("value") === "4")
                        query.where = "(Category = 1) AND (CloudCover <=" + registry.byId("cloudFilter").get("value") + ") AND (((Month >=6) AND (Month <=8)) OR ((Month <=2) OR (Month >=12)))";
                    query.orderByFields = [this.dateField];
                    query.returnGeometry = true;

                    var queryTask = new QueryTask(this.primaryLayer.url);


                    queryTask.execute(query, lang.hitch(this, function (result) {

                        if (result.features.length === 0) {
                            html.set(this.cloudFilterError, "No scene.Select other option.");
                            html.set(this.temporalpro, "");
                            this.noSceneFlag = true;

                        } else {
                            html.set(this.cloudFilterError, "");
                            html.set(this.temporalpro, "Pick point on map to get temporal profile for that point.");
                            this.noSceneFlag = false;
                        }

                        this.orderedFeatures = [];
                        switch (registry.byId("seasonSelect").get("value")) {
                            case "0":
                            {
                                this.orderedFeatures = result.features;
                                break;
                            }
                            case "1":
                            {
                                for (var b in result.features) {
                                    if (result.features[b].attributes.WRS_Row <= 60) {
                                        if (result.features[b].attributes.Month <= 5)
                                            this.orderedFeatures.push(result.features[b]);
                                    } else {
                                        if (result.features[b].attributes.Month >= 9 && result.features[b].attributes.Month <= 11)
                                            this.orderedFeatures.push(result.features[b]);
                                    }
                                }
                                break;
                            }
                            case "2":
                            {
                                for (var b in result.features) {
                                    if (result.features[b].attributes.WRS_Row <= 60) {
                                        if (result.features[b].attributes.Month >= 6 && result.features[b].attributes.Month <= 8)
                                            this.orderedFeatures.push(result.features[b]);
                                    } else {
                                        if (result.features[b].attributes.Month >= 12 || result.features[b].attributes.Month <= 2)
                                            this.orderedFeatures.push(result.features[b]);
                                    }
                                }
                                break;
                            }
                            case "3":
                            {
                                for (var b in result.features) {
                                    if (result.features[b].attributes.WRS_Row <= 60) {
                                        if (result.features[b].attributes.Month >= 9 && result.features[b].attributes.Month <= 11)
                                            this.orderedFeatures.push(result.features[b]);
                                    } else {
                                        if (result.features[b].attributes.Month <= 5)
                                            this.orderedFeatures.push(result.features[b]);
                                    }
                                }
                                break;

                            }
                            case "4":
                            {
                                for (var b in result.features) {
                                    if (result.features[b].attributes.WRS_Row <= 60) {
                                        if (result.features[b].attributes.Month >= 12 || result.features[b].attributes.Month <= 2)
                                            this.orderedFeatures.push(result.features[b]);
                                    } else {
                                        if (result.features[b].attributes.Month >= 6 && result.features[b].attributes.Month <= 8)
                                            this.orderedFeatures.push(result.features[b]);
                                    }
                                }
                                break;


                            }

                        }


                        this.dateobj = [];
                        for (var t = 0; t <= this.orderedFeatures.length - 1; t++)
                        {
                            this.dateobj.push({
                                date: locale.format(new Date(this.orderedFeatures[t].attributes.AcquisitionDate), {selector: "date", datePattern: "dd/MM/yy"}),
                                obj: this.orderedFeatures[t].attributes.OBJECTID,
                                geo: this.orderedFeatures[t].geometry.getExtent(),
                                Scene: this.orderedFeatures[t].attributes.GroupName
                            });
                        }
                        var k = 0;
                        this.orderedDates = [];
                        for (var g = 0; g < this.orderedFeatures.length; g++) {
                            if (g === 0)
                            {
                                this.orderedDates.push(this.orderedFeatures[g].attributes.AcquisitionDate);
                            } else {
                                if (locale.format(new Date(this.orderedFeatures[g].attributes.AcquisitionDate), {selector: "date", datePattern: "dd/MM/yy"}) !== locale.format(new Date(this.orderedDates[k]), {selector: "date", datePattern: "dd/MM/yy"})) {
                                    this.orderedDates.push(this.orderedFeatures[g].attributes.AcquisitionDate);
                                    k++;
                                }
                            }
                        }


                        this.featureLength = this.orderedDates.length;

                        var sliderNode = domConstruct.create("div", {}, this.timeSliderDiv, "first");
                        var rulesNode = domConstruct.create("div", {}, sliderNode, "first");
                        if (this.sliderRules === null) {
                            this.sliderRules = new HorizontalRule({
                                id: "slider",
                                container: "bottomDecoration",
                                count: this.featureLength,
                                style: "height:5px;"
                            }, rulesNode);
                        }
                        var labels = [];
                        for (var i = 0; i < this.orderedDates.length; i++) {
                            labels[i] = locale.format(new Date(this.orderedDates[i]), {selector: "date", datePattern: "dd/MM/yy"}); //formatLength: "short"});
                        }

                        var labelsNode = domConstruct.create("div", {}, sliderNode, "second");
                        if (this.sliderLabels === null) {
                            this.sliderLabels = new HorizontalRuleLabels({
                                id: "slider2",
                                container: "bottomDecoration",
                                labelStyle: "height:1em;font-size:75%;color:gray;",
                                labels: [labels[0], labels[this.orderedDates.length - 1]]
                            }, labelsNode);
                        }
                        if (this.slider === null) {
                            this.slider = new HorizontalSlider({
                                id: "slider3",
                                name: "slider",
                                value: 0,
                                minimum: 0,
                                maximum: this.featureLength - 1,
                                discreteValues: this.featureLength,
                                showButtons: true,
                                onChange: lang.hitch(this, this.sliderChange)
                            }, sliderNode);
                        }
                        this.slider.startup();
                        this.sliderRules.startup();
                        this.sliderLabels.startup();


                        if (this.appScene)
                        {
                            this.appScene = JSON.parse(this.appScene);
                            for (var f in this.dateobj) {

                                if ((this.appScene[0]) === this.dateobj[f].Scene)
                                {
                                    for (var j = 0; j < this.orderedDates.length; j++) {
                                        if (this.dateobj[f].date === locale.format(new Date(this.orderedDates[j]), {selector: "date", datePattern: "dd/MM/yy"}))
                                        {
                                            var ind = j;


                                            this.counterCheck++;
                                            if (this.counterCheck > 2)
                                            {
                                                this.appScene = null;
                                            }
                                            break;
                                        }
                                    }
                                }
                            }
                        } else {
                            this.best = [];
                            for (var r = 0; r < this.orderedFeatures.length; r++)
                            {
                                this.best.push(this.orderedFeatures[r].attributes.Best);
                            }
                            this.best.sort(function (a, b)
                            {
                                return(a - b);
                            });

                            var index = this.best[0];

                            for (var z in this.orderedFeatures)
                            {
                                if (this.orderedFeatures[z].attributes.Best === index)
                                {
                                    for (var a in this.orderedDates) {
                                        if (locale.format(new Date(this.orderedFeatures[z].attributes.AcquisitionDate), {selector: "date", datePattern: "dd/MM/yy"}) === locale.format(new Date(this.orderedDates[a]), {selector: "date", datePattern: "dd/MM/yy"}))
                                        {
                                            var ind = a;
                                            break;
                                        }
                                    }
                                    break;
                                }
                            }
                        }
                        if (this.previousDateOnTimeSlider !== null) {
                            for (var i in this.orderedDates) {
                                if (this.orderedDates[i] === this.previousDateOnTimeSlider) {
                                    ind = i;
                                }
                            }
                        }

                        this.slider.set("value", ind);
                        this.sliderChange();
                        html.set(this.dateRange, locale.format(new Date(this.orderedDates[ind]), {selector: "date", formatLength: "long"}));


                    }), lang.hitch(this, function (error)
                    {
                        domStyle.set("loadingts", "display", "none");
                        this.slider.set("value", 0);
                        this.sliderChange();
                    }));


                },
                timeSliderHide: function () {
                    if (this.sliderRules)
                        this.sliderRules.destroy();
                    if (this.sliderLabels)
                        this.sliderLabels.destroy();
                    if (this.slider)
                        this.slider.destroy();
                    this.sliderRules = null;
                    this.sliderLabels = null;
                    this.slider = null;
                },
                sliderChange: function () {

                    this.primaryLayer = this.map.getLayer("primaryLayer").url;
                    this.previousDateOnTimeSlider = this.orderedDates[this.slider.get("value")];
                    this.sliderValue = this.slider.get("value");
                    if (this.sliderValue !== null) {
                        var aqDate = this.orderedDates[this.slider.get("value")];

                        this.featureIDS = [];
                        var sceneIds = [];
                        for (var t = 0; t <= this.dateobj.length - 1; t++)
                        {
                            if (this.dateobj[t].date === locale.format(new Date(aqDate), {selector: "date", datePattern: "dd/MM/yy"})) {
                                this.featureIDS.push(this.dateobj[t].obj);
                                sceneIds.push(this.dateobj[t].Scene);
                            }
                        }
                        html.set(this.dateRange, locale.format(new Date(aqDate), {selector: "date", formatLength: "long"}));
                        registry.byId("lockedSceneName").set("value", JSON.stringify(sceneIds));
                        var mr = new MosaicRule();
                        mr.method = MosaicRule.METHOD_LOCKRASTER;
                        mr.ascending = true;
                        mr.operation = "MT_FIRST";
                        mr.lockRasterIds = this.featureIDS;
                        this.saveMosaicRuleChartMode = mr;
                        this.primaryLayer = this.map.getLayer("primaryLayer");
                        this.primaryLayer.setMosaicRule(mr);
                        if (this.appScene)
                            this.appScene = null;
                    }

                },
                timeSliderRefresh: function () {
                    if (this.slider) {
                        this.timeSliderHide();
                        this.timeSliderShow();
                    }
                },
                showLoading: function () {
                    esri.show(dom.byId("loadingts"));
                    esri.show(dom.byId("loadingtt"));
                },
                hideLoading: function () {
                    esri.hide(dom.byId("loadingtt"));
                    esri.hide(dom.byId("loadingts"));
                }
            });

            clazz.hasLocale = false;
            return clazz;
        });
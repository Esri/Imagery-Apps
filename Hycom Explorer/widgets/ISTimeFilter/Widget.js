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
    'jimu/BaseWidget', "./resourceLoad.js", "dijit/form/VerticalSlider", "dijit/form/VerticalRule",
    "dijit/form/VerticalRuleLabels", "esri/toolbars/draw", "esri/Color", "dojox/charting/Chart", "jimu/WidgetManager",
    "dojox/charting/action2d/Tooltip",
    "dojox/charting/themes/PrimaryColors",
    "dojox/charting/widget/SelectableLegend",
    "dojox/charting/action2d/Magnify",
    "dojox/charting/action2d/Highlight",
    "dojox/charting/plot2d/Lines",
    "dojox/charting/plot2d/Markers",
    "dojox/charting/axis2d/Default"
],
        function (
                declare,
                _WidgetsInTemplateMixin,
                template,
                BaseWidget, resourceLoad, VerticalSlider, VerticalRule, VerticalRuleLabels, Draw, Color, Chart, WidgetManager, Tooltip, theme, SelectableLegend, Magnify, Highlight
                ) {
            var resource = new resourceLoad({resource: "time"});
            var plugins = resource.load("time");
            var registry = plugins[1], on = plugins[0], lang = plugins[2], html = plugins[3],
                    dom = plugins[4],
                    MosaicRule = plugins[5],
                    Query = plugins[6], QueryTask = plugins[7], Extent = plugins[8], locale = plugins[9], domConstruct = plugins[10], HorizontalSlider = plugins[11], HorizontalRule = plugins[12], HorizontalRuleLabels = plugins[13], domStyle = plugins[14], ArcGISImageServiceLayer = plugins[15], ImageServiceParameters = plugins[16], esriRequest = plugins[17], connect = plugins[18], domClass = plugins[19], PanelManager = plugins[20];
            var pm = PanelManager.getInstance();
            var wm = WidgetManager.getInstance();
            var clazz = declare([BaseWidget, _WidgetsInTemplateMixin], {
                templateString: template,
                name: 'ISTimeFilter',
                baseClass: 'jimu-widget-ISTimeFilter',
                primaryLayer: null,
                orderedDates: null,
                sliderRules: null,
                sliderLabels: null,
                slider: null,
                orderedFeatures: [],
                sliderValue: null,
                datesclick: null,
                lockId: null,
                item: false,
                extentChangeHandler: null,
                refreshHandlerTime: null,
                lengthofsamples: null,
                noSceneFlag: false,
                previousDateOnTimeSlider: null,
                changeValue: false,
                saveValue: false,
                noMinimizeDisplay: true,
                startup: function () {
                    this.inherited(arguments);
                    var headerCustom = domConstruct.toDom('<div id="minimizeTimeButton" style="background-color: black; border-radius: 4px;height: 30px;width:30px;position: absolute;top:220px;left: 20px;display: none;cursor:pointer;"><a   id="timeMinimize" target="_blank"><img id="timeThumnail" src="widgets/ISLayers/images/time.png" style="height: 20px;margin:5px;" alt="Time" /></a></div>');
                    domConstruct.place(headerCustom, this.map.container);
                    domConstruct.place('<img id="loadingts" style="position: absolute;top:0;bottom: 0;left: 0;right: 0;margin:auto;z-index:100;" src="' + require.toUrl('jimu') + '/images/loading.gif">', "timeDialog");
                    domConstruct.place('<img id="loadingts1" style="position: absolute;top:0;bottom: 0;left: 0;right: 0;margin:auto;z-index:100;display:none;" src="' + require.toUrl('jimu') + '/images/loading.gif">', this.map.container);

                    on(dom.byId("timeMinimize"), "click", lang.hitch(this, lang.hitch(this, function () {
                        domStyle.set("minimizeTimeButton", "display", "none");

                        this.noMinimizeDisplay = true;
                        this.onOpen();
                    })));
                    this.resizeTimeWidget();
                },
                resizeTimeWidget: function () {
                    if (window.innerWidth > 1200) {
                        domStyle.set("timeDialog", "font-size", "12px");
                        domStyle.set("timeDialog", "width", "440px");
                        document.getElementById("savePushDownImage").height = "15";
                    } else if (window.innerWidth < 1200 && window.innerWidth > 500) {
                        domStyle.set("timeDialog", "font-size", "9px");
                        domStyle.set("timeDialog", "width", "300px");
                        document.getElementById("savePushDownImage").height = "15";
                    } else if (window.innerWidth < 500) {
                        domStyle.set("timeDialog", "font-size", "7px");
                        domStyle.set("timeDialog", "width", "200px");
                        document.getElementById("savePushDownImage").height = "10";
                    }
                },
                playFunction: function () {
                    if (this.playButtonTrue) {

                        if (this.num === this.featureLength)
                            this.num = 0;
                        this.slider.set("value", this.num);
                        this.num++;

                        setTimeout(lang.hitch(this, function () {
                            this.playFunction();
                        }), 2000);
                    }
                },
                postCreate: function () {

                    window.addEventListener("resize", lang.hitch(this, this.resizeTimeWidget));
                    registry.byId("refreshTimesliderBtn").on("click", lang.hitch(this, function () {
                        this.clear();
                        html.set(this.pointgraph, "");
                        this.timeSliderRefresh();
                    }));
                    registry.byId("playBtn").on("click", lang.hitch(this, function () {
                        if (this.slider && this.orderedFeatures1.length > 1) {
                            this.playButtonTrue = true;
                            domStyle.set(registry.byId("playBtn").domNode, "display", "none");
                            domStyle.set(registry.byId("pauseBtn").domNode, "display", "block");

                            //if(this.playValue <= 18)
                            if (this.num >= this.featureLength && this.previousNumValue) {
                                this.num = this.previousNumValue;

                            }
                            this.num = this.num + 1;

                            if (this.num === this.featureLength)
                                this.num = 0;
                            this.slider.set("value", this.num);
                            setTimeout(lang.hitch(this, function () {
                                this.playFunction();
                            }), 2000);
                        }
                    }));
                    registry.byId("pauseBtn").on("click", lang.hitch(this, function () {
                        this.playButtonTrue = false;
                        this.previousNumValue = this.num;
                        domStyle.set(registry.byId("pauseBtn").domNode, "display", "none");
                        domStyle.set(registry.byId("playBtn").domNode, "display", "block");
                    }));
                    registry.byId("saveSceneBtn").on("click", lang.hitch(this, this.saveScene));
                    registry.byId("timeSort").on("change", lang.hitch(this, this.timeSliderRefresh));
                    if (this.map) {

                        this.map.on("update-start", lang.hitch(this, this.showLoading));
                        this.map.on("update-end", lang.hitch(this, this.hideLoading));
                        this.map.on("update-end", lang.hitch(this, this.timeUpdate));
                        this.toolbarTemporal = new Draw(this.map);
                        dojo.connect(this.toolbarTemporal, "onDrawComplete", lang.hitch(this, this.addGraphic));
                    }
                },
                addGraphic: function (geometry) {
                    this.saveGeometryObject = geometry;

                    this.clear();
                    for (var a in this.map.graphics.graphics) {
                        if (this.map.graphics.graphics[a].geometry.type === "point" && this.map.graphics.graphics[a].symbol && this.map.graphics.graphics[a].symbol.color.r === 255) {
                            this.map.graphics.remove(this.map.graphics.graphics[a]);
                            break;
                        }
                    }
                    var symbol = new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE, 20,
                            new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID,
                                    new Color([255, 0, 0]), 1),
                            new Color([255, 0, 0, 0.35]));
                    var graphic = new esri.Graphic(geometry.geometry, symbol);
                    this.map.graphics.add(graphic);
                    this.temporalprof(geometry.geometry);

                },
                temporalprof: function (evt) {
                    domStyle.set("loadingts1", "display", "block");

                    this.noMinimizeDisplay = false;
                    registry.byId("timeDialog").hide();
                    this.noMinimizeDisplay = true;
                    this.item = true;
                    var point = evt;
                    var renderer = this.config[this.map.primaryRenderer];
                    if (this.map.stdZ)
                        var stdZ = "StdZ=" + this.map.stdZ;
                    else if (renderer === "Sea Surface Elevation (m)")
                        var stdZ = "StdZ IS NULL";
                    else
                        var stdZ = "StdZ=0";
                    if (registry.byId("timeSort").get("value") === "t000")
                        var query = "Variable = '" + renderer + "' AND " + stdZ + " AND (Name LIKE '%t000%' OR Name LIKE '%t024%' OR Name LIKE '%t048%' OR Name LIKE '%t072%' OR Name LIKE '%t096%' OR Name LIKE '%t120%' OR Name LIKE '%t144%' OR Name LIKE '%t168%')";
                    else
                        var query = "Variable = '" + renderer + "' AND " + stdZ;
                    this.array = [];
                    var mosaicLock = new MosaicRule({"mosaicMethod": "esriMosaicAttribute", "ascending": true, "mosaicOperation": "MT_FIRST", "sortField": "StdTime", "sortValue": "2050/01/01", "where": query});
                    mosaicLock = JSON.stringify(mosaicLock);
                    var request1 = esriRequest({
                        url: this.config.hycomUrl + "/identify",
                        content: {
                            geometry: JSON.stringify(point.toJson()),
                            geometryType: "esriGeometryPoint",
                            mosaicRule: mosaicLock,
                            returnGeometry: false,
                            returnCatalogItems: true,
                            f: "json"
                        },
                        handleAs: "json",
                        callbackParamName: "callback"
                    });
                    request1.then(lang.hitch(this, function (result) {
                        var data = result.catalogItems.features;
                        var dataValues = result.properties.Values;
                        this.lengthofsamples = data.length;
                        for (var i = 0; i < this.lengthofsamples; i++) {


                            this.array.push({
                                objectId: data[i].attributes.OBJECTID,
                                acqDate: data[i].attributes.StdTime,
                                name: data[i].attributes.Name,
                                Height: data[i].attributes.StdZ,
                                pixelValue: dataValues[i] === "NoData" ? this.config.min[this.map.primaryRenderer] : parseFloat(dataValues[i]) < this.config.min[this.map.primaryRenderer] ? this.config.min[this.map.primaryRenderer] : parseFloat(dataValues[i]) > this.config.max[this.map.primaryRenderer] ? this.config.max[this.map.primaryRenderer] : parseFloat(dataValues[i])
                            });



                        }
                        this.array.sort(function (a, b) {
                            return a.acqDate - b.acqDate;
                        });
                        this.temporalProfile2();
                    }), lang.hitch(this, function (error) {
                        registry.byId("timeDialog").show();
                        domStyle.set("loadingts1", "display", "none");
                        this.hideLoading();
                    }));



                },
                temporalProfile2: function () {
                    var itemInfo = [];
                    this.valueDates = [];
                    var dataValues = [];
                    var pixelValue = [];
                    for (var a in this.array) {
                        dataValues.push({
                            y: parseFloat(this.array[a].pixelValue),
                            tooltip: (parseFloat(this.array[a].pixelValue)).toFixed(3) + ", " + locale.format(new Date(this.array[a].acqDate), {selector: "date", datePattern: "MM/dd/yy"}) + " " + locale.format(new Date(this.array[a].acqDate), {selector: "time", timePattern: "HH:mm ZZZZ"})
                        });
                        itemInfo.push({
                            acqDate: this.array[a].acqDate,
                            objid: this.array[a].objectId,
                            name: this.array[a].name
                        });
                        pixelValue.push(this.array[a].pixelValue);
                    }
                    pixelValue.sort(function (a, b) {
                        return a - b;
                    });

                    var byDate = itemInfo.slice(0);
                    this.hycomData = byDate;
                    this.valueDates.push({
                        text: "",
                        value: 0
                    });
                    for (var a = 0; a < this.hycomData.length; a++) {
                        this.valueDates.push({
                            text: locale.format(new Date(this.hycomData[a].acqDate), {selector: "date", datePattern: "MM/dd/yy"}), //locale.format(new Date(this.HRRRData[a].acqDate), {selector: "time", timePattern: "HH:mm ZZZZ"}),
                            value: parseInt(a) + 1
                        });
                    }
                    this.valueDates.push({
                        text: "",
                        value: this.valueDates.length
                    });

                    html.set(this.temporalpro, "");

                    html.set(this.pointgraph, "Pick a point on the map to reset location.<br /> Pick a point on the graph to set image date.");
                    dojo.style(dojo.byId("chartshow"), "display", "block");


                    if (!registry.byId("timeDialog").open)
                    {
                        registry.byId("timeDialog").show();
                        domStyle.set("timeDialog", "top", "100px");
                        domStyle.set("timeDialog", "left", "160px");

                    }

                    this.chart = new Chart("chartNode");
                    this.chart.addPlot("default", {
                        type: "Lines",
                        markers: true,
                        tension: "S",
                        shadows: {dx: 4, dy: 4}
                    });
                    this.chart.setTheme(theme);



                    this.chart.addAxis("y", {min: pixelValue[0] - 0.1, max: pixelValue[pixelValue.length - 1] + 0.1, vertical: true, fixLower: "none", fixUpper: "none", title: "Data Values (" + this.config.units[this.map.primaryRenderer] + ")", titleOrientation: "axis"});
                    this.chart.addAxis("x", {min: 0, max: this.valueDates.length, labels: this.valueDates, labelSizeChange: true, title: "Time", titleOrientation: "away", majorTickStep: 1, minorTicks: false});

                    this.chart.addSeries(this.map.primaryRenderer, dataValues, {stroke: {color: "#40a4df", width: 1.5}, fill: "#40a4df"});


                    this.toolTip = new Tooltip(this.chart, "default");
                    this.magnify = new Magnify(this.chart, "default", {scale: 3});
                    this.highLight = new Highlight(this.chart, "default");
                    this.chart.render();

                    if (!v) {

                        for (var a in this.array) {
                            if (this.hycomData[a].name === this.orderedFeatures1[this.slider.get("value")].attributes.Name)
                            {
                                var v = a;
                                break;
                            }
                        }
                    }
                    this.prevMarker = v;
                    this.chart.fireEvent(this.map.primaryRenderer, "onmouseover", v);
                    this.chart.connectToPlot("default", lang.hitch(this, this.highlightcurrent));

                    domConstruct.destroy("chartDialog_underlay");
                    domConstruct.destroy("timeDialog_underlay");

                    this.seclayer = this.primaryLayer.url;

                    this.chart.connectToPlot("default", lang.hitch(this, this.clickdata));

                    domStyle.set("slider", "display", "none");
                    domStyle.set("slider2", "display", "none");
                    domStyle.set("slider3", "display", "none");
                    domStyle.set(this.timeSortDiv, "display", "none");
                    domStyle.set("loadingts1", "display", "none");
                },
                highlightcurrent: function (evt) {
                    if (evt.element === "marker" && evt.type === "onmouseout") {

                        if (this.orderedFeatures1[this.slider.get("value")].attributes.Name === this.hycomData[evt.index].name) {
                            this.chart.fireEvent(this.map.primaryRenderer, "onmouseover", evt.index);
                            this.chart.fireEvent(this.map.primaryRenderer, "onplotreset", evt.index);
                        }
                    }


                },
                clickdata: function (evt)
                {

                    var type2 = evt.type;
                    if (type2 === "onclick")
                    {
                        this.datesclick = (evt.x - 1);
                        for (var g = 0; g < this.orderedFeatures1.length; g++)
                        {
                            if (locale.format(new Date(this.orderedFeatures1[g].attributes.StdTime), {selector: "date", datePattern: "MM/dd/yy"}) === locale.format(new Date(this.hycomData[this.datesclick].acqDate), {selector: "date", datePattern: "MM/dd/yy"}) && this.hycomData[this.datesclick].name === this.orderedFeatures1[g].attributes.Name)
                            {

                                this.slider.set("value", g);
                                this.sliderChange();
                                if (this.prevMarker) {


                                    this.chart.fireEvent(this.map.primaryRenderer, "onmouseout", this.prevMarker);
                                }

                                this.chart.fireEvent(this.map.primaryRenderer, "onmouseout", this.datesclick);
                                this.prevMarker = evt.x - 1;

                            }
                        }
                    }
                },
                saveScene: function () {

                    if (this.map.getLayer("secondaryLayer")) {
                        if (this.map.getLayer("secondaryLayer").updating) {
                            this.map.getLayer("secondaryLayer").suspend();
                        }
                        this.map.removeLayer(this.map.getLayer("secondaryLayer"));
                    }
                    var layer = this.map.getLayer("primaryLayer");


                    var params = new ImageServiceParameters();
                    params.mosaicRule = layer.mosaicRule;
                    params.renderingRule = layer.renderingRule;
                    // params.format = "jpgpng";

                    var secondLayer = new ArcGISImageServiceLayer(layer.url, {
                        imageServiceParameters: params,
                        visible: domClass.contains(document.getElementsByClassName("icon-node")[1], "jimu-state-selected"),
                        id: "secondaryLayer"
                    });
                    this.map.addLayer(secondLayer, 1);

                    registry.byId("secondOBJECTID").set("value", registry.byId("currentOBJECTID").get("value"));
                    registry.byId("secondarySceneId").set("value", registry.byId("primarySceneId").get("value"));
                    var aqDate = parseInt(registry.byId("secondOBJECTID").get("value"));



                    domStyle.set(this.secondaryRange, "display", "none");

                    html.set(this.secondaryRange, "Comparison Date: <b>" + locale.format(new Date(aqDate), {selector: "date", formatLength: "long"}) + "</b>&nbsp;&nbsp;Time: <b>" + locale.format(new Date(aqDate), {selector: "time", timePattern: "HH:mm ZZZZ"}) + "</b>&nbsp;&nbsp;&nbsp;");

                    dom.byId("dateSecondary").innerHTML = "&nbsp;&nbsp;Comparison Date:&nbsp;" + locale.format(new Date(aqDate), {selector: "date", formatLength: "long"}) + "  Time: " + locale.format(new Date(aqDate), {selector: "time", timePattern: "HH:mm ZZZZ"});
                    ;



                },
                timeUpdate: function () {
                    connect.subscribe("refreshTime", lang.hitch(this, function (flag) {

                        if (flag.flag) {

                            this.timeSliderRefresh();
                            connect.publish("refreshTime", [{flag: false}]);
                        }
                    }));




                },
                onOpen: function () {

                    if (registry.byId("oceanCurrentsDialog").open)
                        registry.byId("oceanCurrentsDialog").hide();
                    if (registry.byId("overlayLayerDialog").open)
                        registry.byId("overlayLayerDialog").hide();
                    if (registry.byId("maskDialog") && registry.byId("maskDialog").open)
                        registry.byId("maskDialog").hide();

                    var z = document.getElementsByClassName("icon-node");


                    if (domClass.contains(z[4], "jimu-state-selected"))
                        z[4].click();
                    else if (domClass.contains(z[6], "jimu-state-selected"))
                        z[6].click();


                    dojo.connect(registry.byId("timeDialog"), "hide", lang.hitch(this, function (e) {

                        if (this.noMinimizeDisplay) {
                            if (domStyle.get("minimizeTimeButton", "display") === "none")
                                domStyle.set("minimizeTimeButton", "display", "block");

                            if (this.refreshHandlerTime !== null)
                            {
                                this.refreshHandlerTime.remove();
                                this.refreshHandlerTime = null;
                            }
                            html.set(this.pointgraph, "");
                            this.clear();
                            this.toolbarTemporal.deactivate();
                            if (this.slider) {
                                domStyle.set("slider", "display", "block");
                                domStyle.set("slider3", "display", "block");
                                domStyle.set(this.timeSortDiv, "display", "block");
                            }

                            this.hideLoading();
                        }


                    }));



                    html.set(this.temporalpro, "Pick a point on the map to get the temporal profile for that point.");

                    this.refreshData();
                    if (!registry.byId("timeDialog").open)
                        registry.byId("timeDialog").show();

                    registry.byId("timeDialog").closeButtonNode.title = "Minimize";
                    domStyle.set("timeDialog", "top", "100px");
                    domStyle.set("timeDialog", "left", "160px");
                    domConstruct.destroy("timeDialog_underlay");

                    if (!this.slider) {

                        this.timeSliderShow();
                    }
                    if (this.map.getLayer("topLayer"))
                        this.queryTopLayer();
                    domStyle.set(this.filterDiv, "display", "block");
                    if (!this.refreshHandlerTime)
                    {
                        this.refreshHandlerTime = this.map.on("update-end", lang.hitch(this, this.refreshData));
                    }


                    this.toolbarTemporal.activate(Draw.POINT);

                },
                clear: function () {
                    dojo.style(dojo.byId("chartshow"), "display", "none");


                    if (this.chart) {
                        dojo.empty("chartNode");
                        this.chart = null;
                    }
                },
                onClose: function ()
                {
                    for (var a in this.map.graphics.graphics) {
                        if (this.map.graphics.graphics[a].geometry.type === "point" && this.map.graphics.graphics[a].symbol && this.map.graphics.graphics[a].symbol.color.r === 255) {
                            this.map.graphics.remove(this.map.graphics.graphics[a]);
                            break;
                        }
                    }
                    this.map.stdTime = null;
                    this.clear();
                    if (this.map.getLayer("secondaryLayer")) {
                        if (this.map.getLayer("secondaryLayer").updating) {
                            this.map.getLayer("secondaryLayer").suspend();
                        }
                        this.map.removeLayer(this.map.getLayer("secondaryLayer"));
                        html.set(this.secondaryRange, "");
                        domStyle.set(this.dateRange, "font-size", "");
                    }
                    if (this.refreshHandlerTime !== null)
                    {
                        this.refreshHandlerTime.remove();
                        this.refreshHandlerTime = null;
                    }

                    if (registry.byId("timeDialog").open) {
                        this.noMinimizeDisplay = false;

                        registry.byId("timeDialog").hide();
                        this.noMinimizeDisplay = true;
                    }
                    html.set(this.pointgraph, "");
                    if (domStyle.get("minimizeTimeButton", "display") === "block")
                        domStyle.set("minimizeTimeButton", "display", "none");
                    domStyle.set(this.filterDiv, "display", "none");
                    /* if (this.map.getLayer("topLayer") && this.map.getLayer("topLayer").defaultMosaicRule)
                     this.map.getLayer("topLayer").setMosaicRule(new MosaicRule(this.map.getLayer("topLayer").defaultMosaicRule));*/
                    registry.byId("currentOBJECTID").set("value", null);
                    //   if (this.map.stdZ === 0) {

                    // }


                    this.timeSliderHide();
                    this.noMinimizeDisplay = true;
                    if (this.slider) {
                        domStyle.set("slider", "display", "block");
                        domStyle.set("slider2", "display", "block");
                        domStyle.set("slider3", "display", "block");

                    }
                    domStyle.set(this.timeSortDiv, "display", "block");
                    this.toolbarTemporal.deactivate();

                    this.hideLoading();
                    if (wm.getWidgetById("widgets_Depth_Widget_15") && domClass.contains(document.getElementsByClassName("icon-node")[1], "jimu-state-selected"))
                        wm.getWidgetById("widgets_Depth_Widget_15").depthSliderRefresh();
                    else {
                        var mr = new MosaicRule({"mosaicMethod": "esriMosaicAttribute", "sortField": "StdTime", "sortValue": "2050/01/01", "ascending": true, "mosaicOperation": "MT_FIRST", "multidimensionalDefinition": [{"variableName": "", "dimensionName": "StdTime", "values": [], "isSlice": true}]});
                        this.primaryLayer.setMosaicRule(mr);
                        if (this.map.getLayer("topLayer") && this.map.getLayer("topLayer").defaultMosaicRule)
                            this.map.getLayer("topLayer").setMosaicRule(mr);
                    }

                },
                refreshData: function () {


                    this.primaryLayer = this.map.getLayer("primaryLayer");
                    this.mosaicBackup = this.primaryLayer.defaultMosaicRule;
                    this.dateField = "StdTime";

                },
                queryTopLayer: function () {
                    this.topLayer = this.map.getLayer("topLayer");
                    if (this.topLayer.title === "HYCOM_Contour")
                        var renderer = registry.byId("contourList").get("value");
                    else
                        var renderer = "Ocean Current Velocity (UV)";
                    var query = new Query();


                    query.outFields = ["StdTime", "Name", "Variable", "GroupName", "Dimensions", "StdZ"];
                    if (this.map.stdZ)
                        var stdZ = this.map.stdZ;
                    else
                        var stdZ = 0;
                    if (registry.byId("timeSort").get("value") === "t000")
                        query.where = "Variable = '" + this.config[renderer] + "' AND StdZ=" + stdZ + " AND (Name LIKE '%t000%' OR Name LIKE '%t024%' OR Name LIKE '%t048%' OR Name LIKE '%t072%' OR Name LIKE '%t096%' OR Name LIKE '%t120%' OR Name LIKE '%t144%' OR Name LIKE '%t168%')";
                    else
                        query.where = "Variable = '" + this.config[renderer] + "' AND StdZ=" + stdZ;
                    query.orderByFields = ["StdTime"];
                    query.returnGeometry = false;
                    var queryTask = new QueryTask(this.topLayer.url);
                    queryTask.execute(query, lang.hitch(this, function (result) {
                        this.topFeatures = result.features;
                        this.sliderChangeTop();
                    }));
                },
                filterTimeSliderTop: function (value) {
                    this.topFeatures1 = [];
                    for (var a in this.topFeatures) {
                        if (this.topFeatures[a].attributes[this.dimensionsTop[0]] === this.verticalTopLabels.labels[this.verticalTopSlider.get("value")])
                            this.topFeatures1.push(this.topFeatures[a]);
                    }
                    this.sliderChangeTop();
                },
                sliderChangeTop: function () {
                    if (this.slider && this.topFeatures && this.topFeatures.length > 0) {
                        var mr = new MosaicRule();
                        mr.method = MosaicRule.METHOD_LOCKRASTER;
                        mr.ascending = true;
                        mr.operation = "MT_FIRST";
                        mr.lockRasterIds = [this.topFeatures[this.slider.get("value")].attributes.OBJECTID];
                        mr.multidimensionalDefinition = [];
                        this.topLayer.setMosaicRule(mr);
                    }
                },
                timeSliderShow: function () {
                    this.primaryLayer = this.map.getLayer("primaryLayer");
                    this.item = false;
                    var query = new Query();
                    var renderer = this.config[this.map.primaryRenderer];

                    query.outFields = ["StdTime", "Name", "Variable", "GroupName", "Dimensions"];
                    if (this.map.stdZ)
                        var stdZ = "StdZ=" + this.map.stdZ;
                    else if (renderer === "Sea Surface Elevation (m)")
                        var stdZ = "StdZ IS NULL";
                    else
                        var stdZ = "StdZ=0";
                    if (registry.byId("timeSort").get("value") === "t000")
                        query.where = "Variable = '" + renderer + "' AND " + stdZ + " AND (Name LIKE '%t000%' OR Name LIKE '%t024%' OR Name LIKE '%t048%' OR Name LIKE '%t072%' OR Name LIKE '%t096%' OR Name LIKE '%t120%' OR Name LIKE '%t144%' OR Name LIKE '%t168%')";
                    else
                        query.where = "Variable = '" + renderer + "' AND " + stdZ;
                    query.orderByFields = ["StdTime"];
                    query.returnGeometry = false;
                    html.set(this.pointgraph, "");

                    html.set(this.temporalpro, "Pick a point on the map to get the temporal profile for that point.");
                    var queryTask = new QueryTask(this.primaryLayer.url);
                    queryTask.execute(query, lang.hitch(this, function (result) {

                        this.orderedFeatures = result.features;
                        this.dimensions = result.features[0].attributes.Dimensions.split(",");
                        this.orderedFeatures1 = this.orderedFeatures;
                        this.timeSliderFunction();

                    }), lang.hitch(this, function (error)
                    {
                        try {

                            this.hideLoading();
                            this.slider.set("value", 0);
                            html.set(this.dateRange, "Image Date: <b>" + locale.format(new Date(this.orderedDates[0]), {selector: "date", formatLength: "long"}) + "</b>");
                        } catch (e) {

                            this.hideLoading();
                            this.slider.set("value", 0);
                        }

                    }));


                },
                timeSliderFunction: function () {

                    this.orderedDates = [];
                    for (var a in this.orderedFeatures1) {
                        this.orderedDates.push(this.orderedFeatures1[a].attributes["StdTime"]);
                    }


                    this.featureLength = this.orderedFeatures1.length;

                    var sliderNode = domConstruct.create("div", {}, this.timeSliderDiv, "first");
                    var rulesNode = domConstruct.create("div", {}, sliderNode, "first");
                    if (!this.sliderRules) {
                        this.sliderRules = new HorizontalRule({
                            id: "slider",
                            container: "bottomDecoration",
                            count: this.featureLength,
                            style: "height:5px;"
                        }, rulesNode);
                    }
                    var labels = [];
                    for (var i = 0; i < this.orderedDates.length; i++) {
                        labels[i] = locale.format(new Date(this.orderedDates[i]), {selector: "date", datePattern: "MM/dd/yy"});//+" "+locale.format(new Date(this.orderedDates[i]), {selector: "time", timePattern: "HH:mm ZZZZ"}); //formatLength: "short"});
                    }

                    var labelsNode = domConstruct.create("div", {}, sliderNode, "second");
                    if (!this.sliderLabels) {
                        this.sliderLabels = new HorizontalRuleLabels({
                            id: "slider2",
                            container: "bottomDecoration",
                            labelStyle: "height:1em;font-size:75%;color:gray;",
                            labels: [labels[0], labels[this.orderedDates.length - 1]]
                        }, labelsNode);
                    }
                    if (!this.slider) {
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





                    if (this.previousDateOnTimeSlider !== null) {
                        for (var i in this.orderedFeatures1) {
                            if (this.orderedFeatures1[i].attributes.StdTime === this.previousDateOnTimeSlider) {
                                var ind = i;

                            }
                        }
                    } else
                        var ind = 0;

                    this.slider.set("value", ind);
                    this.sliderChange();
                    html.set(this.dateRange, "Image Date: <b>" + locale.format(new Date(this.orderedDates[ind]), {selector: "date", formatLength: "long"}) + "</b> Time: <b>" + locale.format(new Date(this.orderedDates[ind]), {selector: "time", timePattern: "HH:mm ZZZZ"}));
                },
                filterTimeSlider: function (value) {
                    this.orderedFeatures1 = [];
                    for (var a in this.orderedFeatures) {
                        if (this.orderedFeatures[a].attributes[this.dimensions[0]] === this.verticalLabels.labels[this.verticalSlider.get("value")])
                            this.orderedFeatures1.push(this.orderedFeatures[a]);
                    }

                    if (this.slider) {
                        this.sliderRules.destroy();
                        this.sliderLabels.destroy();
                        this.slider.destroy();
                    }
                    this.sliderRules = null;
                    this.sliderLabels = null;
                    this.slider = null;
                    this.timeSliderFunction();
                    if (this.chart) {
                        this.clear();
                        this.temporalProfile2();
                    }

                },
                timeSliderHide: function () {
                    if (this.slider) {
                        this.sliderRules.destroy();
                        this.sliderLabels.destroy();
                        this.slider.destroy();
                    }
                    this.sliderRules = null;
                    this.sliderLabels = null;
                    this.slider = null;
                },
                sliderChange: function () {

                    this.primaryLayer = this.map.getLayer("primaryLayer");

                    this.previousDateOnTimeSlider = this.orderedFeatures1[this.slider.get("value")].attributes.StdTime;
                    this.map.stdTime = this.previousDateOnTimeSlider;

                    this.sliderValue = this.slider.get("value");
                    if (this.chart) {
                        if (this.prevMarker)
                            this.chart.fireEvent(this.map.primaryRenderer, "onmouseout", this.prevMarker);
                        this.chart.fireEvent(this.map.primaryRenderer, "onmouseout", this.sliderValue);
                        this.prevMarker = this.sliderValue;
                    }
                    if (this.sliderValue !== null) {

                        var aqDate = this.orderedFeatures1[this.slider.get("value")].attributes["StdTime"];

                        html.set(this.dateRange, "Image Date: <b>" + locale.format(new Date(aqDate), {selector: "date", formatLength: "long"}) + "</b> Time: <b>" + locale.format(new Date(aqDate), {selector: "time", timePattern: "HH:mm ZZZZ"}));


                        if (this.secondaryRange.innerHTML.includes("<b>") && (this.dateRange.innerHTML.split("<b>")[1].split("</b>")[0] !== this.secondaryRange.innerHTML.split("<b>")[1].split("</b>")[0] || this.dateRange.innerHTML.split("Time: <b>")[1].split("</b>")[0] !== this.secondaryRange.innerHTML.split("Time: <b>")[1].split("</b>")[0])) {
                            domStyle.set(this.secondaryRange, "display", "inline-block");
                            domStyle.set(this.dateRange, "font-size", "11px");

                        } else {

                            domStyle.set(this.secondaryRange, "display", "none");
                            domStyle.set(this.dateRange, "font-size", "");
                        }
                        this.lockId = this.orderedFeatures1[this.slider.get("value")].attributes.OBJECTID;
                        var mr = new MosaicRule();
                        mr.method = MosaicRule.METHOD_LOCKRASTER;
                        mr.ascending = true;
                        mr.operation = "MT_FIRST";

                        var tempLock = [this.orderedFeatures1[this.sliderValue].attributes.OBJECTID];
                        mr.lockRasterIds = tempLock;
                        registry.byId("currentOBJECTID").set("value", this.orderedFeatures1[this.sliderValue].attributes.StdTime);
                        registry.byId("primarySceneId").set("value", this.orderedFeatures1[this.sliderValue].attributes.Name);
                        this.num = parseInt(this.slider.get("value"));
                        this.primaryLayer.setMosaicRule(mr);
                        dom.byId("dateDisplay").innerHTML = "&nbsp;&nbsp;&nbsp;Date:&nbsp;" + locale.format(new Date(aqDate), {selector: "date", formatLength: "long"}) + "&nbsp;&nbsp;&nbsp;Time: &nbsp;" + locale.format(new Date(aqDate), {selector: "time", timePattern: "HH:mm ZZZZ"});
                        if (this.map.getLayer("topLayer"))
                            this.sliderChangeTop();


                    }

                },
                timeSliderRefresh: function () {
                    if (this.slider) {
                        this.timeSliderHide();
                        this.timeSliderShow();
                    }
                    if (this.map.getLayer("topLayer")) {
                        this.queryTopLayer();
                    }
                },
                showLoading: function () {
                    if (dom.byId("loadingts"))
                        domStyle.set("loadingts", "display", "block");
                },
                hideLoading: function () {
                    if (dom.byId("loadingts"))
                        domStyle.set("loadingts", "display", "none");
                }
            });

            clazz.hasLocale = false;
            return clazz;
        });
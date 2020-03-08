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
    'jimu/BaseWidget', "./resourceLoad.js", "dijit/form/VerticalSlider", "dijit/form/VerticalRule", "esri/TimeExtent", "jimu/WidgetManager",
    "dijit/form/VerticalRuleLabels", "esri/toolbars/draw", "esri/Color", "dojox/charting/Chart",
    "dojox/charting/action2d/Tooltip",
    "dojox/charting/themes/PrimaryColors",
    "dojox/charting/widget/SelectableLegend",
    "dojox/charting/action2d/Magnify",
    "dojox/charting/action2d/Highlight", "dijit/form/Button",
    "dojox/charting/plot2d/Lines",
    "dojox/charting/plot2d/Markers",
    "dojox/charting/axis2d/Default"
],
        function (
                declare,
                _WidgetsInTemplateMixin,
                template,
                BaseWidget, resourceLoad, VerticalSlider, VerticalRule, TimeExtent, WidgetManager, VerticalRuleLabels, Draw, Color, Chart, Tooltip, theme, SelectableLegend, Magnify, Highlight, Button
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
                seclayer: null,
                orderedDates: null,
                sliderRules: null,
                sliderLabels: null,
                slider: null,
                orderedFeatures: [],
                sliderValue: null,
                visibleValue: false,
                w: null,
                h: null,
                datesclick: null,
                lockId: null,
                item: false,
                extentChangeHandler: null,
                flagvalue: false,
                refreshHandlerTime: null,
                y1: null,
                lengthofsamples: null,
                noSceneFlag: false,
                previousDateOnTimeSlider: null,
                appScene: null,
                appScene2: null,
                changeValue: false,
                saveValue: false,
                noMinimizeDisplay: true,
                startup: function () {
                    this.inherited(arguments);
                    domConstruct.place('<img id="loadingDepth" style="position: absolute;top:0;bottom: 0;left: 0;right: 0;margin:auto;z-index:100;" src="' + require.toUrl('jimu') + '/images/loading.gif">', this.map.container);
                    this.hideLoading();
                    this.resizeDepthDialog();
                },
                resizeDepthDialog: function () {
                    if (window.innerWidth > 1200) {
                        domStyle.set("depthDialog", "font-size", "12px");
                        //domStyle.set("depthDialog", "width", "300px");

                    } else if (window.innerWidth < 1200 && window.innerWidth > 500) {
                        domStyle.set("depthDialog", "font-size", "9px");
                        //domStyle.set("depthDialog", "width", "300px");

                    } else if (window.innerWidth < 500) {
                        domStyle.set("depthDialog", "font-size", "7px");
                        //domStyle.set("depthDialog", "width", "200px");

                    }
                },
                playFunction: function () {
                    if (this.playButtonTrue) {

                        if (this.num === this.featureLength)
                            this.num = 0;
                        this.verticalSlider.set("value", this.num);
                        this.num++;

                        setTimeout(lang.hitch(this, function () {
                            this.playFunction();
                        }), 2000);
                    }
                },
                postCreate: function () {

                    window.addEventListener("resize", lang.hitch(this, this.resizeDepthDialog));
                    domConstruct.place("<div id='verticalSliderDiv' style='display:block;right: 60px;bottom: 70px;position: absolute;width: 100px;background: white; border-radius: 10px;border: 2px solid;'><div id='dimensionName' style='padding-top: 5px;padding-left: 25px; font-weight: bold;'>StdZ (m)</div><div id='stdZValue' style='font-weight:bold;text-align: center;'>0</div><div id='verticalDiv' style='margin-left: 35%;padding-bottom: 10px;'></div><div id='playBtnDepth'></div><div id='pauseBtnDepth' style='display:none;'></div></div>", this.map.container);
                    var playBtn = new Button({
                        "label": "<img src='images/play.png' height='20'/>",
                        "style": "margin-left: 34%;"
                    }, "playBtnDepth").startup();
                    var pauseBtn = new Button({
                        "label": '<img src="images/Stop.png" height="20"/>',
                        "style": "display:none;margin-left:34%;"
                    }, "pauseBtnDepth").startup();
                    registry.byId("playBtnDepth").on("click", lang.hitch(this, function () {
                        if (this.verticalSlider && this.orderedFeatures.length > 1) {
                            this.playButtonTrue = true;
                            domStyle.set(registry.byId("playBtnDepth").domNode, "display", "none");
                            domStyle.set(registry.byId("pauseBtnDepth").domNode, "display", "block");

                            //if(this.playValue <= 18)
                            if (this.num >= this.featureLength && this.previousNumValue) {
                                this.num = this.previousNumValue;

                            }
                            this.num = this.num + 1;

                            if (this.num === this.featureLength)
                                this.num = 0;
                            this.verticalSlider.set("value", this.num);
                            setTimeout(lang.hitch(this, function () {
                                this.playFunction();
                            }), 2000);
                        }
                    }));
                    registry.byId("pauseBtnDepth").on("click", lang.hitch(this, function () {
                        this.playButtonTrue = false;
                        this.previousNumValue = this.num;
                        domStyle.set(registry.byId("pauseBtnDepth").domNode, "display", "none");
                        domStyle.set(registry.byId("playBtnDepth").domNode, "display", "block");
                    }));

                    if (this.map) {

                        this.map.on("update-start", lang.hitch(this, this.showLoading));
                        this.map.on("update-end", lang.hitch(this, this.hideLoading));
                        this.toolbarTemporal = new Draw(this.map);
                        dojo.connect(this.toolbarTemporal, "onDrawComplete", lang.hitch(this, this.addGraphic));
                    }
                },
                addGraphic: function (geometry) {
                    this.clear();
                    for (var a in this.map.graphics.graphics) {
                        if (this.map.graphics.graphics[a].geometry.type === "point" && this.map.graphics.graphics[a].symbol && this.map.graphics.graphics[a].symbol.color.r === 255) {
                            this.map.graphics.remove(this.map.graphics.graphics[a]);
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
                    domStyle.set("loadingDepth", "display", "block");
                    registry.byId("depthDialog").hide();
                    this.item = true;
                    var tempLayer = this.map.getLayer("primaryLayer");
                    var point = evt;

                    if (this.map.stdTime) {
                        var query = "Variable = '" + this.config[this.map.primaryRenderer] + "'";
                        var timeExtent = this.map.stdTime;
                    } else {
                        var query = "Variable = '" + this.config[this.map.primaryRenderer] + "' AND (Name LIKE '%t000%' OR Name LIKE '%t024%' OR Name LIKE '%t048%' OR Name LIKE '%t072%' OR Name LIKE '%t096%' OR Name LIKE '%t120%' OR Name LIKE '%t144%' OR Name LIKE '%t168%')";
                        if (this.latestTime)
                            var timeExtent = this.latestTime;
                        else
                            var timeExtent = "";
                    }
                    this.array = [], this.arrayId = [];
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
                            f: "json",
                            time: timeExtent
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
                                z: data[i].attributes.StdZ,
                                pixelValue: dataValues[i] === "NoData" ? this.config.min[this.map.primaryRenderer] : parseFloat(dataValues[i]) < this.config.min[this.map.primaryRenderer] ? this.config.min[this.map.primaryRenderer] : parseFloat(dataValues[i]) > this.config.max[this.map.primaryRenderer] ? this.config.max[this.map.primaryRenderer] : parseFloat(dataValues[i])
                            });

                        }
                        this.array.sort(function (a, b) {
                            return a.z - b.z;
                        });
                        this.temporalProfile2();

                    }), lang.hitch(this, function (error) {
                        registry.byId("depthDialog").show();
                        domStyle.set("loadingDepth", "display", "none");
                        this.hideLoading();
                    }));
                },
                temporalProfile2: function () {
                    var itemInfo = [];
                    this.valueDates = [];
                    var dataValues = [];


                    for (var a in this.array) {

                        dataValues.push({
                            y: parseInt(a) + 1,
                            x: this.array[a].pixelValue,
                            tooltip: (parseFloat(this.array[a].pixelValue)).toFixed(3) + ", " + this.array[a].z
                        });


                        itemInfo.push({
                            objid: this.array[a].objectId,
                            z: this.array[a].z,
                            name: this.array[a].name
                        });
                    }

                    var byDate = itemInfo.slice(0);
                    this.hycomData = byDate;
                     this.valueDates.push({
                            text: "",
                            value: 0
                        });
                    for (var a = 0; a < this.hycomData.length; a++) {
                        this.valueDates.push({
                            text: this.hycomData[a].z,
                            value: parseInt(a) + 1
                        });
                    }

                    this.valueDates.push({
                            text: "",
                            value: 41
                        });

                    html.set(this.pointgraph, "Pick a point on the map to reset location.<br /> Pick a point on the graph to set image depth.");


                    if (!registry.byId("depthDialog").open)
                    {

                        registry.byId("depthDialog").show();
                        domStyle.set("depthDialog", "top", "70px");
                        domStyle.set("depthDialog", "left", (window.innerWidth - 320) + "px");
                        domConstruct.destroy("depthDialog_underlay");
                    }

                    this.chart = new Chart("chartNodeDepth");
                    this.chart.addPlot("default", {
                        type: "Lines",
                        markers: true,
                        tension: "S",
                        shadows: {dx: 4, dy: 4}
                    });
                    this.chart.setTheme(theme);



                    this.chart.addAxis("y", {min: 0,max: 41,labels: this.valueDates, labelSizeChange: true, vertical: true, fixLower: "none", fixUpper: "none", title: "StdZ", titleOrientation: "axis"});
                    this.chart.addAxis("x", {min: this.config.min[this.map.primaryRenderer] - 1,max:this.config.max[this.map.primaryRenderer],title: "Data Values (" + this.config.units[this.map.primaryRenderer] + ")", titleOrientation: "away", majorTickStep: 1, minorTicks: false});
                    this.chart.addSeries(this.map.primaryRenderer, dataValues, {stroke: {color: "forestgreen", width: 1.5}, fill: "forestgreen"});


                    this.toolTip = new Tooltip(this.chart, "default");
                    this.magnify = new Magnify(this.chart, "default", {scale: 3});
                    this.highLight = new Highlight(this.chart, "default");
                    this.chart.render();

                    if (!v) {

                        for (var a in this.array) {
                            if (this.hycomData[a].name === this.orderedFeatures[this.verticalSlider.get("value")].attributes.Name)
                            {
                                var v = a;
                                break;
                            }
                        }
                    }
                    this.prevMarker = v;
                    this.chart.fireEvent(this.map.primaryRenderer, "onmouseover", v);
                    this.chart.connectToPlot("default", lang.hitch(this, this.highlightcurrent));

                    domConstruct.destroy("depthDialog_underlay");



                    this.chart.connectToPlot("default", lang.hitch(this, this.clickdata));


                    domStyle.set("loadingDepth", "display", "none");
                },
                highlightcurrent: function (evt) {
                    if (evt.element === "marker" && evt.type === "onmouseout") {

                        if (this.orderedFeatures[this.verticalSlider.get("value")].attributes.Name === this.hycomData[evt.index].name) {
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
                        this.datesclick = (evt.y - 1);

                        for (var g = 0; g < this.orderedFeatures.length; g++)
                        {
                            if (this.orderedFeatures[g].attributes.StdZ === this.hycomData[this.datesclick].z && this.hycomData[this.datesclick].name === this.orderedFeatures[g].attributes.Name)
                            {

                                this.verticalSlider.set("value", g);

                                if (this.prevMarker) {


                                    this.chart.fireEvent(this.map.primaryRenderer, "onmouseout", this.prevMarker);
                                }

                                this.chart.fireEvent(this.map.primaryRenderer, "onmouseout", this.datesclick);
                                this.prevMarker = evt.y - 1;

                            }
                        }
                    }
                },
                onOpen: function () {
                    this.refreshData();
                     if(this.map.primaryRenderer !== "Sea Surface Elevation Meters"){
                    if (!this.verticalSlider) {
                        this.depthSliderShow();
                    }
                     if (this.map.getLayer("topLayer") && !this.map.stdTime)
                        this.queryTopLayer();
                    if (!this.refreshHandlerTime)
                    {
                        this.refreshHandlerTime = this.map.on("update-end", lang.hitch(this, this.refreshData));
                    }
                    this.toolbarTemporal.activate(Draw.POINT);
                     }
                },
                clear: function () {
                    if (this.chart) {
                        dojo.empty("chartNodeDepth");
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
                    this.map.stdZ = 0;
                    this.clear();
                    document.getElementById("depthDisplay").innerHTML = "&nbsp;&nbsp;Depth:&nbsp;0 m";
                    if (this.refreshHandlerTime !== null)
                    {
                        this.refreshHandlerTime.remove();
                        this.refreshHandlerTime = null;
                    }
                    html.set(this.pointgraph, "");

                  /*  if (this.mosaicBackup && !this.map.stdTime) {
                        var mr = new MosaicRule({"mosaicMethod": "esriMosaicAttribute", "sortField": "StdTime", "sortValue": "2050/01/01", "ascending": true, "mosaicOperation": "MT_FIRST", "multidimensionalDefinition": [{"variableName": "", "dimensionName": "StdTime", "values": [], "isSlice": true}]});
                        this.primaryLayer.setMosaicRule(mr);
                    }*/
                    this.depthSliderHide();

                    if (this.veticalSlider) {
                        domStyle.set("sliderVertical", "display", "block");
                        domStyle.set("sliderV2", "display", "block");
                        domStyle.set("sliderV", "display", "block");
                    }
                    domStyle.set("verticalSliderDiv", "display", "none");
                    this.hideLoading();
                    this.toolbarTemporal.deactivate();
                    registry.byId("depthDialog").hide();
                    if (wm.getWidgetById("widgets_ISTimeFilter_Widget_15") && domClass.contains(document.getElementsByClassName("icon-node")[0], "jimu-state-selected"))
                        wm.getWidgetById("widgets_ISTimeFilter_Widget_15").timeSliderRefresh();
                    else
                    {
                           var mr = new MosaicRule({"mosaicMethod": "esriMosaicAttribute", "sortField": "StdTime", "sortValue": "2050/01/01", "ascending": true, "mosaicOperation": "MT_FIRST", "multidimensionalDefinition": [{"variableName": "", "dimensionName": "StdTime", "values": [], "isSlice": true}]});
                        this.primaryLayer.setMosaicRule(mr);
                        if (this.map.getLayer("topLayer") && this.map.getLayer("topLayer").defaultMosaicRule)
                        this.map.getLayer("topLayer").setMosaicRule(mr);
                    }
                },
                 queryTopLayer: function () {
                    this.topLayer = this.map.getLayer("topLayer");
                    if(this.topLayer.title === "HYCOM_Contour")
                    var renderer = registry.byId("contourList").get("value");
                    else
                    var renderer = "Ocean Current Velocity (UV)";    
                    var query = new Query();
                    
              
                    query.outFields = ["StdTime", "Name", "Variable", "GroupName", "Dimensions", "StdZ"];
                    if (this.map.stdTime) {
                        query.where = "Variable = '" + this.config[renderer]+"'";
                        query.timeExtent = new TimeExtent(new Date(this.map.stdTime), new Date(this.map.stdTime));
                    } else
                        query.where = "Variable = '" + this.config[renderer]+"' AND (Name LIKE '%t000%' OR Name LIKE '%t024%' OR Name LIKE '%t048%' OR Name LIKE '%t072%' OR Name LIKE '%t096%' OR Name LIKE '%t120%' OR Name LIKE '%t144%' OR Name LIKE '%t168%')";
                    query.orderByFields = ["StdZ", "StdTime"];
                   
                    query.returnGeometry = false;
                    var queryTask = new QueryTask(this.topLayer.url);
                    queryTask.execute(query, lang.hitch(this, function (result) {
                        this.topFeatures = result.features;
                        if (this.map.stdTime)
                            this.topFeatures = result.features;
                        else {
                            var latestTime = result.features[result.features.length - 1].attributes.StdTime;
                            this.topFeatures = [];
                            for (var a in result.features) {
                                if (latestTime === result.features[a].attributes.StdTime)
                                    this.topFeatures.push(result.features[a]);
                            }

                        }
                        this.sliderChangeTop();
                    }));
                },
                 sliderChangeTop: function () {
                    if (this.verticalSlider && this.topFeatures && this.topFeatures.length > 0) {
                        var mr = new MosaicRule();
                        mr.method = MosaicRule.METHOD_LOCKRASTER;
                        mr.ascending = true;
                        mr.operation = "MT_FIRST";
                        mr.lockRasterIds = [this.topFeatures[this.verticalSlider.get("value")].attributes.OBJECTID];
                        mr.multidimensionalDefinition = [];

                        this.topLayer.setMosaicRule(mr);
                    }
                },
                refreshData: function () {
                    this.primaryLayer = this.map.getLayer("primaryLayer");
                    this.mosaicBackup = this.primaryLayer.defaultMosaicRule;
                    if(this.map.primaryRenderer === "Sea Surface Elevation Meters" && this.verticalSlider)
                        this.depthSliderHide();
                    
                },
                depthSliderShow: function () {
                    this.primaryLayer = this.map.getLayer("primaryLayer");
                    var query = new Query();
                    var renderer = this.config[this.map.primaryRenderer];
                    query.outFields = ["StdTime", "Name", "Variable", "GroupName", "Dimensions", "StdZ"];
                    if (this.map.stdTime) {
                        query.where = "Variable = '" + renderer + "'";
                        query.timeExtent = new TimeExtent(new Date(this.map.stdTime), new Date(this.map.stdTime));
                    } else
                        query.where = "Variable = '" + renderer + "' AND (Name LIKE '%t000%' OR Name LIKE '%t024%' OR Name LIKE '%t048%' OR Name LIKE '%t072%' OR Name LIKE '%t096%' OR Name LIKE '%t120%' OR Name LIKE '%t144%' OR Name LIKE '%t168%')";
                    query.orderByFields = ["StdZ", "StdTime"];
                    query.returnGeometry = false;
                    var queryTask = new QueryTask(this.primaryLayer.url);
                    queryTask.execute(query, lang.hitch(this, function (result) {
                        if (this.map.stdTime)
                            this.orderedFeatures = result.features;
                        else {
                            this.latestTime = result.features[result.features.length - 1].attributes.StdTime;
                            this.orderedFeatures = [];
                            for (var a in result.features) {
                                if (this.latestTime === result.features[a].attributes.StdTime)
                                    this.orderedFeatures.push(result.features[a]);
                            }

                        }
                        dom.byId("dateDisplay").innerHTML = "&nbsp;&nbsp;&nbsp;Date:&nbsp;" + locale.format(new Date(this.latestTime), {selector: "date", formatLength: "long"}) + "&nbsp;&nbsp;&nbsp;Time: &nbsp;" + locale.format(new Date(this.latestTime), {selector: "time", timePattern: "HH:mm ZZZZ"});
                        this.depthSliderFunction();
                    }), lang.hitch(this, function (error)
                    {
                        try {

                            this.hideLoading();
                            this.verticalSlider.set("value", 0);
                        } catch (e) {

                            this.hideLoading();
                            this.verticalSlider.set("value", 0);
                        }

                    }));


                },
                depthSliderFunction: function () {

                    this.orderedDates = [];
                    for (var a in this.orderedFeatures) {
                        if (a === 0)
                            this.orderedDates.push(this.orderedFeatures[a].attributes["StdZ"]);
                        else {
                            if (this.orderedDates[this.orderedDates.length - 1] !== this.orderedFeatures[a].attributes["StdZ"])
                                this.orderedDates.push(this.orderedFeatures[a].attributes["StdZ"]);
                        }
                    }

                    this.featureLength = this.orderedDates.length;
                    var sliderVNode = domConstruct.create("div", {}, "verticalDiv", "first");
                    var rulesVNode = domConstruct.create("div", {}, sliderVNode, "first");
                    if (!this.verticalRules) {
                        this.verticalRules = new VerticalRule({
                            id: "sliderV",
                            count: this.featureLength,
                            style: "width:5px;"
                        }, rulesVNode);
                    }

                    var labelsNode = domConstruct.create("div", {}, sliderVNode, "second");
                    var labels = [];
                    for (var a = 0; a < this.orderedDates.length; a = a + 3) {
                        labels.push(this.orderedDates[a]);
                    }

                    if (!this.verticalLabels) {
                        this.verticalLabels = new VerticalRuleLabels({
                            id: "sliderV2",
                            labelStyle: "height:1em;font-size:75%;color:gray;",
                            labels: labels
                        }, labelsNode);
                    }

                    if (!this.verticalSlider) {
                        this.verticalSlider = new VerticalSlider({
                            id: "sliderVertical",
                            name: "sliderV",
                            style: "height: 270px;",
                            value: 0,
                            minimum: 0,
                            maximum: this.featureLength - 1,
                            discreteValues: this.featureLength,
                            showButtons: true,
                            onChange: lang.hitch(this, this.filterTimeSlider)

                        }, sliderVNode);
                    }
                    this.verticalSlider.startup();
                    this.verticalRules.startup();
                    this.verticalLabels.startup();


                    domStyle.set("verticalSliderDiv", "display", "block");

                    if (this.previousValueOnDepthSlider) {
                        for (var i in this.orderedFeatures) {
                            if (this.orderedFeatures[i].attributes.StdZ === this.previousValueOnDepthSlider) {
                                var ind = i;

                            }
                        }
                    } else
                        var ind = this.featureLength - 1;


                    this.verticalSlider.set("value", ind);


                },
                filterTimeSlider: function (value) {
                    this.num = parseInt(this.verticalSlider.get("value"));
                    this.previousValueOnDepthSlider = this.orderedFeatures[value].attributes.StdZ;
                    this.map.stdZ = this.orderedDates[value];
                    if(this.chart){
                    if(this.prevMarker)
                    this.chart.fireEvent(this.map.primaryRenderer, "onmouseout", this.prevMarker);
                    this.chart.fireEvent(this.map.primaryRenderer, "onmouseout", value);
                    this.prevMarker = value;
                    }
                    document.getElementById("depthDisplay").innerHTML = "&nbsp;&nbsp;Depth:&nbsp;"+Math.abs(this.map.stdZ)+"&nbsp;m";
                    document.getElementById("stdZValue").innerHTML = this.map.stdZ;
                    if (!this.map.stdTime) {
                        var layer = this.map.getLayer("primaryLayer");
                        if (layer) {
                            var mr = new MosaicRule();
                            mr.method = MosaicRule.METHOD_LOCKRASTER;
                            mr.ascending = true;
                            mr.operation = "MT_FIRST";
                            mr.lockRasterIds = [this.orderedFeatures[value].attributes.OBJECTID];
                            layer.setMosaicRule(mr);
                            if (this.map.getLayer("topLayer"))
                            this.sliderChangeTop();
                        }
                    } else {
                        if (wm.getWidgetById("widgets_ISTimeFilter_Widget_15") && domClass.contains(document.getElementsByClassName("icon-node")[0], "jimu-state-selected")) {
                        wm.getWidgetById("widgets_ISTimeFilter_Widget_15").timeSliderRefresh();
                        if(domStyle.get("minimizeTimeButton","display") === "none" && domStyle.get("chartshow","display") === "block")
                        wm.getWidgetById("widgets_ISTimeFilter_Widget_15").addGraphic(wm.getWidgetById("widgets_ISTimeFilter_Widget_15").saveGeometryObject);
                    }
                        
                        
                    }
                    /*if (this.chart) {
                        this.clear();
                        this.temporalProfile2();
                    }*/

                },
                depthSliderHide: function () {

                    if (this.verticalSlider) {
                        this.verticalRules.destroy();
                        this.verticalLabels.destroy();
                        this.verticalSlider.destroy();
                    }

                    this.verticalRules = null;
                    this.verticalLabels = null;
                    this.verticalSlider = null;


                },
                depthSliderRefresh: function () {

                    
                        this.depthSliderHide();
                        this.depthSliderShow();
                    
                      if(this.map.getLayer("topLayer") && !this.map.stdTime){
                     
                     this.queryTopLayer();
                     }
                },
                showLoading: function () {
                    if (dom.byId("loadingDepth"))
                        domStyle.set("loadingDepth", "display", "block");
                },
                hideLoading: function () {
                    if (dom.byId("loadingDepth"))
                        domStyle.set("loadingDepth", "display", "none");
                }
            });

            clazz.hasLocale = false;
            return clazz;
        });
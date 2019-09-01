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
    "dojo/dom-construct",
    "dojo/dom-style",
    "esri/request",
     "dojox/charting/Chart",
    "dojox/charting/action2d/Tooltip",
    "dojox/charting/themes/PrimaryColors",
    "dojox/charting/widget/SelectableLegend",
    "dojox/charting/action2d/Magnify",
    "dojo/date/locale",
    "dojo/html",
    "dojo/_base/connect",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/symbols/SimpleLineSymbol",
    "esri/Color",
    "jimu/PanelManager",
    "esri/tasks/query",
    "esri/tasks/QueryTask",
    "esri/toolbars/draw",
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
                
                domConstruct,
                domStyle, esriRequest, Chart, Tooltip, theme, SelectableLegend, Magnify, locale, html, connect, SimpleMarkerSymbol, SimpleLineSymbol, Color, PanelManager, Query, QueryTask,Draw) {
            var pm = PanelManager.getInstance();
            var clazz = declare([BaseWidget, _WidgetsInTemplateMixin], {
                templateString: template,
                name: 'Identify',
                baseClass: 'jimu-widget-Identify',
                primaryLayer: null,
                layerSwipe: null,
                layerList: null,
                bandNames1: [],
                
                h: null,
              wiopen: false,
                levelzoom: null,
                startup: function () {
                    this.inherited(arguments);

                    domConstruct.place('<img id="loadingsp" style="position: absolute;top:0;bottom: 0;left: 0;right: 0;margin:auto;z-index:100;" src="' + require.toUrl('jimu') + '/images/loading.gif">', this.map.container);
                    // domStyle.set("loadingsp","display","block");
        
                    this.resizeIdentifyWidget();

                },
                resizeIdentifyWidget: function(){
                    if(window.innerWidth < 620){
                        domStyle.set("chartDialog1","font-size","7px");
                        domStyle.set("chartNode1","width","180px");
                        domStyle.set("chartNode1","height","225px");
                        if(this.chart)
                            this.chart.resize(180,225);
                    }else if(window.innerWidth <850){
                        domStyle.set("chartDialog1","font-size","8px");
                        domStyle.set("chartNode1","width","260px");
                        domStyle.set("chartNode1","height","225px");
                        if(this.chart)
                            this.chart.resize(260,225);
                    }else if(window.innerWidth < 1200){
                        domStyle.set("chartDialog1","font-size","9px");
                        domStyle.set("chartNode1","width","290px");
                        domStyle.set("chartNode1","height","235px");
                        if(this.chart)
                            this.chart.resize(290,235);
                    }else{
                        domStyle.set("chartDialog1","font-size","12px");
                        domStyle.set("chartNode1","width","390px");
                        domStyle.set("chartNode1","height","270px");
                        if(this.chart)
                            this.chart.resize(390,270);
                    }
                    if(registry.byId("chartDialog1").open){
                        domStyle.set("chartDialog1","top","70px");
                        domStyle.set("chartDialog1","left","160px");
                        
                    }
                },
                addGraphic: function(geoObj){
                    var geometry = geoObj.geometry;
                    this.clear();
                    for(var a in this.map.graphics.graphics){
                        if(this.map.graphics.graphics[a].geometry.type==="point" && this.map.graphics.graphics[a].symbol && this.map.graphics.graphics[a].symbol.color.r===255){
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
                
                identifypara: function(point){
                    domStyle.set("loadingsp", "display", "block");
                  domStyle.set("onlyidentify", "display", "none");

                    this.clear();
                    if (!this.primaryLayer.mosaicRule)
                    {
                        this.mosaic = null;
                        this.identifypara2(point);
                    }
                    else
                    {
                        this.mosaic = JSON.stringify(this.primaryLayer.mosaicRule.toJson());
                    
                    
                    if(this.primaryLayer.mosaicRule.method === "esriMosaicLockRaster" && (this.primaryLayer.url === this.config.urlLandsatPS || this.primaryLayer.url === this.config.urlLandsatPan)){
                        if(this.primaryLayer.url === this.config.urlLandsatPS)
                            var urlForQuery = this.config.urlLandsatPS;
                        else
                            var urlForQuery =  this.config.urlLandsatPan;
                        
                        var query = new Query();
                        if(this.primaryLayer.mosaicRule.lockRasterIds.length <2)
                        query.where = "OBJECTID = "+this.primaryLayer.mosaicRule.lockRasterIds[0];
                        else
                        query.where = "OBJECTID = "+this.primaryLayer.mosaicRule.lockRasterIds[0]+ "OR OBJECTID ="+this.primaryLayer.mosaicRule.lockRasterIds[1];
                            query.outFields = ["GroupName"];
                        query.returnGeometry = false;
                     
                        var queryTask = new QueryTask(urlForQuery);
                      
                        queryTask.execute(query,lang.hitch(this, function(queryResult){
                            if(queryResult.features.length > 0)
                            {
                                var query2 = new Query();
                                if(queryResult.features.length < 2)
                                query2.where = "GroupName = '"+queryResult.features[0].attributes.GroupName+"'";
                                else
                                 query2.where = "GroupName = '"+queryResult.features[0].attributes.GroupName+"' OR GroupName = '"+queryResult.features[1].attributes.GroupName+"'";   
                                query2.outFields = ["OBJECTID"];
                                query2.returnGeometry = false;
                            
                            var queryTask2 = new QueryTask(this.config.urlms);
                            queryTask2.execute(query2, lang.hitch(this, function(queryResult2){
                                var array = [];
                                for(var a in queryResult2.features){
                                    array[a] = queryResult2.features[a].attributes.OBJECTID;
                                }
                                this.mosaic = {"mosaicMethod":"esriMosaicLockRaster","ascending":true,"lockRasterIds":array,"mosaicOperation":"MT_FIRST"};
                                this.mosaic = JSON.stringify(this.mosaic);
                                this.identifypara2(point);
                            }));
                            }
                        }));
                    }else
                        this.identifypara2(point);
                }
                   
                   
                },
                onOpen: function () {
                    connect.publish("identify", [{idenstatus: "open"}]);
                    domStyle.set("loadingsp", "display", "block");
                    this.autoresize();
                    this.refreshData();
                    this.centerFlag = true;
                    this.identifypara(this.map.extent.getCenter());

                    this.toolbarIdentify = new Draw(this.map);
                    dojo.connect(this.toolbarIdentify,"onDrawComplete",lang.hitch(this,this.addGraphic));
                    this.toolbarIdentify.activate(Draw.POINT);  
                },
                autoresize: function ()
                {
                    this.h = this.map.height;
                   this.h = (parseInt((this.h / 5.5))).toString();
                },
               
                onClose: function () {
                    for(var a in this.map.graphics.graphics){
                        if(this.map.graphics.graphics[a].geometry.type==="point" && this.map.graphics.graphics[a].symbol && this.map.graphics.graphics[a].symbol.color.r===255){
                            this.map.graphics.remove(this.map.graphics.graphics[a]);
                            break;
                        }
                    }
                    this.clear();
                    this.toolbarIdentify.deactivate();
                    registry.byId("chartDialog1").hide();
                    domStyle.set("loadingsp", "display", "none");
                    connect.publish("identify", [{idenstatus: "close"}]);
                 },
                identifypara2: function (point) {
                      var request2 = esriRequest({
                        url: this.config.urlms + "/getSamples",
                        content: {
                            geometry:JSON.stringify(point.toJson()),
                            geometryType: "esriGeometryPoint",
                            returnGeometry: false,
                             returnFirstValueOnly: true,
                            outFields: 'AcquisitionDate,OBJECTID,GroupName,Category,ProductName,WRS_Path,WRS_Row,SunAzimuth,SunElevation,CloudCover',
                            mosaicRule: this.mosaic,
                            f: "json"
                        },
                        handleAs: "json",
                        callbackParamName: "callback"
                    });
                    request2.then(lang.hitch(this, function (data) {

                        var props = data.samples[0].attributes;
                     
                        html.set(this.identifytab, "<table style='border: 0px;width:100%;'><tr><td>Current Scene ID: " + props.GroupName.substr(0, 21) + "</td><td>&nbsp;&nbsp;Product Name: " + props.ProductName + "</td></tr><tr><td>Acquisition Date: " + locale.format(new Date(props.AcquisitionDate), {selector: "date", formatLength: "long"}) + "</td><td>&nbsp;&nbsp;WRS Path/Row: " + props.WRS_Path + "/" + props.WRS_Row + "</td></tr><tr><td>Sun Azimuth: " + props.SunAzimuth.toFixed(1) + "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Sun Elevation: " + props.SunElevation.toFixed(1) + "</td><td>&nbsp;&nbsp;Cloud Cover: " + (props.CloudCover * 100).toFixed(1) + "%</td></tr></table>");
                       if(!this.centerFlag)
                        this.spectralprofiles(data, point);
                    else{
                        this.centerFlag = false;
                          domStyle.set("identifysp", "display", "none");
                        domStyle.set("onlyidentify", "display", "block");
                        html.set(this.noinfo, "");
                        registry.byId("chartDialog1").show();
                       domStyle.set("chartDialog1","top","70px");
                       domStyle.set("chartDialog1","left","160px");
                        domStyle.set("loadingsp", "display", "none");
                        domConstruct.destroy("chartDialog1_underlay");
                    }
                    }), lang.hitch(this, function (error) {
                        html.set(this.identifytab, "");
                        html.set(this.noinfo, "No Information available");
                         domStyle.set("identifysp", "display", "none");
                        domStyle.set("onlyidentify", "display", "none");
                        domStyle.set("loadingsp", "display", "none");

                        registry.byId("chartDialog1").show();
                        domStyle.set("chartDialog1","top","70px");
                       domStyle.set("chartDialog1","left","160px");
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
                    for (var a=0;a<values.length - 1;a++) {
                        normalizedValues[a] = (values[a]) / (10000);
                    }
                    this.chartData = [];
                    for (var a in normalizedValues) {
                        this.chartData.push(
                                {tooltip: normalizedValues[a].toFixed(3),
                                    y: normalizedValues[a]});
                    }

                    var normalizedValues1 = this.config.a;
                    this.chartData1 = [];
                    for (var b in normalizedValues1)
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
                    for (var b in normalizedValues2)
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
                    for (var b in normalizedValues3)
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
                    for (var b in normalizedValues4)
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
                    for (var b in normalizedValues5)
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
                    for (var b in normalizedValues6)
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
                    for (var b in normalizedValues7)
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
                    for (var b in normalizedValues10)
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
                    for (var b in normalizedValues9)
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
                    for (var b in normalizedValues8)
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
                    for (a in this.bandNames1) {
                        this.axesParams[a] = {
                            value: parseInt(a) + 1,
                            text: this.bandNames1[a]
                        };
                    }

                 
                        registry.byId("chartDialog1").show();
                    domStyle.set("chartDialog1","top","70px");
                       domStyle.set("chartDialog1","left","160px");  
                    domStyle.set("identifysp", "display", "block");
                          domStyle.set("onlyidentify", "display", "none");
                        registry.byId("type").set("checked", "true");
                        html.set(this.noinfo, "");
                      
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
                        this.chart.addSeries("Cloud", this.chartData1, {stroke: {color: "#1E2457",width: 1.5},fill: "#1E2457",hidden: this.hiddentrue(1, key1)});
                        this.chart.addSeries("Snow/Ice", this.chartData2, {stroke: {color: "#A5F2F3",width: 1.5},fill: "#A5F2F3",hidden: this.hiddentrue(2, key1)});
                        this.chart.addSeries("Desert", this.chartData3, {stroke: {color: "#ECC5A8",width: 1.5},fill: "#ECC5A8",hidden: this.hiddentrue(3, key1)});
                        this.chart.addSeries("Dry Grass", this.chartData4, {stroke: {color: "#DAA520",width: 1.5},fill: "#DAA520",hidden: this.hiddentrue(4, key1)});
                        this.chart.addSeries("Concrete", this.chartData5, {stroke: {color: "gray",width: 1.5},fill: "gray",hidden: this.hiddentrue(5, key1)});
                        this.chart.addSeries("Lush Grass", this.chartData6, {stroke: {color: "#7cfc00",width: 1.5},fill: "#7cfc00",hidden: this.hiddentrue(6, key1)});
                        this.chart.addSeries("Urban", this.chartData7, {stroke: {color: "teal",width: 1.5},fill: "teal",hidden: this.hiddentrue(7, key1)});
                        this.chart.addSeries("Rock", this.chartData8, {stroke: {color: "#5A4D41",width: 1.5},fill: "#5A4D41",hidden: this.hiddentrue(8, key1)});
                        this.chart.addSeries("Forest", this.chartData9, {stroke: {color: "forestgreen",width: 1.5},fill: "forestgreen",hidden: this.hiddentrue(9, key1)});
                        this.chart.addSeries("Water", this.chartData10, {stroke: {color: "#40a4df",width: 1.5},fill: "#40a4df",hidden: this.hiddentrue(10, key1)});

                        this.toolTip = new Tooltip(this.chart, "default");
                        this.magnify = new Magnify(this.chart, "default");
                        this.chart.render();
                       if(!this.legend)
                        this.legend = new SelectableLegend({chart: this.chart, horizontal: false, outline: false}, "legend1");
                            else{
                                     this.legend.set("params", {chart: this.chart, horizontal: true, outline: false});
                                        this.legend.set("chart", this.chart);
                                        this.legend.refresh();
                                    }domConstruct.destroy("chartDialog1_underlay");

                   
                    domStyle.set("loadingsp", "display", "none");
                },
                refreshData: function () {
                    connect.subscribe("layerOpen", lang.hitch(this, function (flag) {
                        if (flag.flag){
                          pm.closePanel('widgets/Identify/Widget_14_panel');
                      connect.publish("layerOpen",[{flag:false}]);
                        }   }));
                     if (this.map.layerIds) {
                     this.primaryLayer = this.map.getLayer("primaryLayer");
                        this.minValue = this.primaryLayer.minValues[0];

                            this.maxValue = this.primaryLayer.maxValues[0];
                            this.bandNames1 = ["Coastal", "Blue", "Green", "Red", "NIR", "SWIR 1", "SWIR 2", "Cirrus", "QA", "Thermal Infrared1", "Thermal Infrared2"];

                            
                     }

                },
                postCreate: function () {
                    this.inherited(arguments);
window.addEventListener("resize", lang.hitch(this, this.resizeIdentifyWidget));
                    registry.byId("type").on("change", lang.hitch(this, this.displaysp));
                    if (this.map) {


                        this.map.on("update-end", lang.hitch(this, this.refreshData));

                    }

                },
                displaysp: function ()
                {
                    if (registry.byId("type").checked)
                    {
                        domStyle.set("chartshow1", "display", "block");
                        domStyle.set("typical", "display", "block");

                    }
                    else
                    {
                       domStyle.set("chartshow1", "display", "none");
                        domStyle.set("typical", "display", "none");
                    }
                },
                clear: function () {
                    if (registry.byId("type").checked)
                    {
                        registry.byId("type").set("checked", "false");
                    }

                    registry.byId("chartDialog1").hide();
                   
                    if (this.chart) {
                    
                      dojo.empty("chartNode1");
                   
                    
                    }

                },
                sumofdif: function (pointclick, prevprofile)
                {

                    var sum = [];
                    var summ = 0;

                    for (var a in pointclick)
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
                    }
                    else
                    {
                        return true;
                    }
                },
                showLoading: function () {
                    domStyle.set("loadingsp", "display", "block");
                },
                hideLoading: function () {

                    domStyle.set("loadingsp", "display", "none");
                }
            });
            clazz.hasLocale = false;
            clazz.hasSettingPage = false;
            clazz.hasSettingUIFile = false;
            clazz.hasSettingLocale = false;
            clazz.hasSettingStyle = false;
            return clazz;
        });
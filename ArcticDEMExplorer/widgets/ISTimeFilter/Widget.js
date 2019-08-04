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
    "dijit/registry","dojo/dom-class",
    "dojo/_base/lang",
    "dojo/html",
    "dojo/dom",
    "esri/layers/MosaicRule",
    "esri/tasks/query",
    "esri/tasks/QueryTask",
    "esri/geometry/Extent",
    "dojo/date/locale",
    "esri/geometry/Point",
    "dojox/charting/Chart",
    "dojox/charting/action2d/Tooltip",
    "dojox/charting/themes/PrimaryColors",
    "esri/SpatialReference",
    "dojox/charting/widget/SelectableLegend",
    "dojox/charting/action2d/Magnify",
    "dojo/html",
    "dojo/dom-construct",
    "dijit/form/HorizontalSlider",
    "dijit/form/HorizontalRule",
    "dijit/form/HorizontalRuleLabels",
    "dojo/_base/array",
    "esri/graphic",
    "esri/symbols/SimpleLineSymbol",
    "esri/symbols/SimpleFillSymbol",
    "esri/toolbars/draw",
    "esri/Color",
    "esri/InfoTemplate",
    "dojo/dom-style",
    "esri/tasks/ImageServiceIdentifyTask",
    "esri/tasks/ImageServiceIdentifyParameters",
    "esri/geometry/Polygon",
    "esri/geometry/Point",
    "esri/request",
    "dojo/_base/connect",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/Color",
    "esri/arcgis/Portal",
    "esri/toolbars/edit",
    "jimu/PanelManager",
    "dijit/form/Select",
    "dijit/form/Button",
    "dijit/form/NumberSpinner",
    "dijit/form/CheckBox",
    "dijit/form/TextBox",
    "dijit/form/DropDownButton",
    "dijit/TooltipDialog",
    "dijit/Tooltip",
    "dijit/Dialog",
    "dojox/charting/plot2d/Lines",
    "dojox/charting/plot2d/Markers",
    "dojox/charting/axis2d/Default",
    "esri/graphic"
],
        function (
                declare,
                _WidgetsInTemplateMixin,
                template,
                BaseWidget,
                on,
                registry,domClass,
                lang,
                html,
                dom,
                MosaicRule,
                Query, QueryTask, Extent, locale, Point, Chart, Tooltip, theme, SpatialReference, SelectableLegend, Magnify, html, domConstruct, HorizontalSlider, HorizontalRule, HorizontalRuleLabels, array, Graphic, SimpleLineSymbol, SimpleFillSymbol, Draw, Color, InfoTemplate, domStyle, ImageServiceIdentifyTask, ImageServiceIdentifyParameters, Polygon, Point, esriRequest, connect, SimpleMarkerSymbol, Color, arcgisPortal, Edit, PanelManager) {

            var pm = PanelManager.getInstance();
            var clazz = declare([BaseWidget, _WidgetsInTemplateMixin], {
                templateString: template,
                name: 'ISTimeFilter',
                baseClass: 'jimu-widget-ISTimeFilter',
                primaryLayer: null,
                sliderRules: null,
                sliderLabels: null,
                slider: null,
                sliderValue: null,
                h: null,
                datesclick: null,
                item: false,
                flagvalue: true,
                y1: null,
                appScene: null,
                appScene1: null,
                lengthofsamples: null,
                contourFlag: false,
                arcticFlag: null,
                extentChangeHandler: null,
                refreshHandlerTime: null,
                noMinimizeDisplay:true,
                startup: function () {
                    this.inherited(arguments);
                    var headerCustom = domConstruct.toDom('<div id="minimizeTimeButton" style="background-color: black; border-radius: 4px;height: 30px;width:30px;position: absolute;top:180px;left: 20px;display: none;cursor:pointer;"><a   id="timeMinimize" target="_blank"><img id="timeThumnail" src="widgets/ISTimeFilter/images/icon.png" style="height: 20px;margin:5px;" alt="Time" /></a></div>');
                    domConstruct.place(headerCustom, this.map.container);
                    domConstruct.place('<img id="loadingtime" style="position: absolute;top:0;bottom: 0;left: 0;right: 0;margin:auto;z-index:100;" src="' + require.toUrl('jimu') + '/images/loading.gif">', "timeDialog");
                    on(dom.byId("timeMinimize"), "click", lang.hitch(this, lang.hitch(this,function(){
                      domStyle.set("minimizeTimeButton","display","none");
                    
                      this.noMinimizeDisplay = true;
                      this.onOpen();
                  })));
                },
                postCreate: function () {
 connect.subscribe("refreshTime", lang.hitch(this, function (flag) {
                        if (flag.flag) {
                            this.clear();
                            html.set(this.pointgraph, "");
                            this.timeSliderRefresh();
                            connect.publish("refreshTime", [{flag: false}]);
                        }
                    }));
                    registry.byId("refreshTimesliderBtn").on("click", lang.hitch(this,function(){
                        this.clear();
                        html.set(this.pointgraph,"");
                        this.timeSliderRefresh();
                    }));
                    registry.byId("cloudFilter").on("change", lang.hitch(this, this.timeSliderRefresh));
                    registry.byId("saveSceneBtn").on("click", lang.hitch(this, this.saveScene));
                    registry.byId("footprint").on("change", lang.hitch(this, this.footprintDisplay));
                    registry.byId("allfootprint").on("change", lang.hitch(this, this.allfootprintDisplay));
                    if (this.map) {
                        this.toolbarTemporal = new Draw(this.map);
                        dojo.connect(this.toolbarTemporal, "onDrawEnd", lang.hitch(this, this.addGraphic));

                        this.map.on("update-start", lang.hitch(this, this.showLoading));
                        this.map.on("update-end", lang.hitch(this, this.hideLoading));

                    }
                },
                allfootprintDisplay: function () {
                    registry.byId("footprint").set("disabled", true);

                    if (registry.byId("allfootprint").checked) {
                        for (var i in this.dateobj) {
                            var symbol = new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new Color([0, 255, 255]), 2);
                            var graphic = new esri.Graphic(this.dateobj[i].geo1, symbol);
                            this.map.graphics.add(graphic);
                        }
                    } else {
                        registry.byId("footprint").set("disabled", false);
                        registry.byId("footprint").set("checked", false);
                        for (var n = this.map.graphics.graphics.length - 1; n >= 0; n--) {
                            if (this.map.graphics.graphics[n].geometry.type === "polygon" && this.map.graphics.graphics[n].symbol.color.g === 255)
                                this.map.graphics.remove(this.map.graphics.graphics[n]);
                        }
                    }
                },
                footprintDisplay: function () {
                    if (registry.byId("footprint").checked) {

                        if (this.map.getLayer("primaryLayer"))
                            var getLayer = this.map.getLayer("primaryLayer");
                        else if (this.map.getLayer("landsatLayer"))
                            var getLayer = this.map.getLayer("landsatLayer");
                        if (getLayer.mosaicRule !== null && getLayer.mosaicRule.method === "esriMosaicLockRaster") {
                            for (var j in getLayer.mosaicRule.lockRasterIds) {
                                for (var i in this.dateobj) {

                                    if (this.dateobj[i].obj === getLayer.mosaicRule.lockRasterIds[j])
                                    {
                                        var symbol = new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new Color([0, 255, 255]), 2);
                                        var graphic = new esri.Graphic(this.dateobj[i].geo1, symbol);
                                        this.map.graphics.add(graphic);

                                        this.savegraphic = graphic;

                                        break;
                                    }
                                }
                            }
                        }


                    } else {

                        var length = this.map.graphics.graphics.length;

                        for (var k = 0; k < length; k++) {
                            if (this.map.graphics.graphics[k].geometry.type === "polygon") {
                                if (this.map.graphics.graphics[k].symbol.color.g === 255)
                                {
                                    this.map.graphics.remove(this.map.graphics.graphics[k]);
                                    k--;
                                    length = length - 1;
                                }
                            }
                        }


                    }
                },
                saveScene: function () {
                    if (domStyle.get("chartshow", "display") === "none")
                        html.set(this.temporalpro, "Saved");
                    else {
                        html.set(this.pointgraph, "Saved.<br/>Pick point on graph to set image date");
                    }
                    setTimeout(lang.hitch(this, this.saveBroadcast), 3000);

                    var layer = this.map.getLayer("primaryLayer");
                    connect.publish("saveScene", [{sceneid: layer.mosaicRule.lockRasterIds[0], url: layer.url, date: this.orderedFeatures1[this.slider.get("value")].attributes["AcquisitionDate"]}]);
                    registry.byId("savedSceneDetails").set("value", layer.mosaicRule.lockRasterIds[0] + "," + this.orderedFeatures1[this.slider.get("value")].attributes["AcquisitionDate"]);
                    registry.byId("savedSceneID").set("value", this.orderedFeatures1[this.slider.get("value")].attributes["Name"]);
                },
                saveBroadcast: function () {
                    if (domStyle.get("chartshow", "display") === "none") {
                        html.set(this.temporalpro, "Pick point on map to get temporal profile for that point.");
                        html.set(this.pointgraph, "");
                    } else {
                        html.set(this.pointgraph, "Pick point on map to reset location.<br /> Pick point on graph to set image date");
                        html.set(this.temporalpro, "");
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
                    if (this.map.getLayer("primaryLayer"))
                        this.temporalprof(geometry);
                    else if (this.map.getLayer("landsatLayer"))
                        this.temporalprofLandsat(geometry);
                },
               
                onOpen: function () {
                    if (registry.byId("buildDialog") && registry.byId("buildDialog").open)
                        registry.byId("buildDialog").hide();
                    if (registry.byId("changeDetectionDialog") && registry.byId("changeDetectionDialog").open)
                        registry.byId("changeDetectionDialog").hide();
                    if (registry.byId("contourDialog") && registry.byId("contourDialog").open)
                        registry.byId("contourDialog").hide();
                    var x = document.getElementsByClassName("icon-node");
                    if(domClass.contains(x[2],"jimu-state-selected"))
                    x[2].click();
                    else if(domClass.contains(x[3],"jimu-state-selected"))
                    x[3].click();
                    else if(domClass.contains(x[4],"jimu-state-selected"))
                    x[4].click();
                    else if(domClass.contains(x[5],"jimu-state-selected"))
                    x[5].click();
                    else if(domClass.contains(x[6],"jimu-state-selected"))
                    x[6].click();
                    
                    connect.publish("timeopen", [{time: "open"}]);
                    if (registry.byId("appSceneID").get("value")) {
                        var userDefinedVariables = (registry.byId("appSceneID").get("value")).split(";");
                       

                        if (userDefinedVariables[1] === "true")
                        {
                            this.contourFlag = true;
                        } else
                            this.contourFlag = false;
                        if (userDefinedVariables[0] !== "null") {
                            this.appScene = userDefinedVariables[0];
                            if (userDefinedVariables[2] !== "null") {
                                this.arcticFlag = userDefinedVariables[2];
                                if (userDefinedVariables[3] !== "null")
                                    this.appScene1 = userDefinedVariables[3];
                            } else
                                this.arcticFlag = null;

                            registry.byId("cloudFilter").set("value", parseFloat(userDefinedVariables[4]));
                        } else {

                            this.appScene = userDefinedVariables[3];
                           /* var x = document.getElementsByClassName("icon-node jimu-state-selected");
                            x[0].click();*/
                        }
                        // registry.byId("cloudFilter").set("value", userDefinedVariables[1]); 
                        registry.byId("appSceneID").set("value", null);
                    }
                    this.extentChangeHandler = this.map.on("extent-change", lang.hitch(this, this.extentChange));

                    this.autoresize();
                    dojo.connect(registry.byId("timeDialog"), "hide", lang.hitch(this, function (e) {
                         if(this.noMinimizeDisplay){  
                        if(domStyle.get("minimizeTimeButton","display") === "none")
                           domStyle.set("minimizeTimeButton", "display","block");
                    this.toolbarTemporal.deactivate();
                       
                            if (this.refreshHandlerTime)
                            {
                                this.refreshHandlerTime.remove();
                                this.refreshHandlerTime = null;
                            }
                            html.set(this.pointgraph, "");
                        this.clear();

                        this.item = false;
                        if(this.slider){
                        domStyle.set("slider", "display", "block");
                        domStyle.set("slider2", "display", "block");
                        domStyle.set("slider3", "display", "block");
                    }
                           
                        }
                    }));

                    if ((this.map.getLevel()) > 10)
                    {
                        domStyle.set("access", "display", "none");
                        html.set(this.temporalpro, "Pick point on map to get temporal profile for that point");

                        this.refreshData();


                        if (!registry.byId("timeDialog").open)
                        {
                            registry.byId("timeDialog").show();
                            domStyle.set("timeDialog", "left", "160px");
                            domStyle.set("timeDialog", "top", "75px");
                        }
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
                        if (!registry.byId("timeDialog").open)
                        {
                            registry.byId("timeDialog").show();
                            domStyle.set("timeDialog", "left", "160px");
                            domStyle.set("timeDialog", "top", "75px");
                            domConstruct.destroy("timeDialog_underlay");
                        }
                    }
                    domStyle.set("loadingtime", "display", "none");

                    if (this.y1 != null) {
                        if (this.y1[0].className === 'icon-node')
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
               
                onClose: function() {
                    this.toolbarTemporal.deactivate();
                    for (var a in this.map.graphics.graphics) {
                        if (this.map.graphics.graphics[a].geometry.type === "point" && this.map.graphics.graphics[a].symbol && this.map.graphics.graphics[a].symbol.color.r === 255) {
                            this.map.graphics.remove(this.map.graphics.graphics[a]);
                            break;
                        }
                    }
                    html.set(this.pointgraph, "");
                        this.clear();

                        connect.publish("timeopen", [{time: "close"}]);
                        this.item = false;
                    domStyle.set("loadingtime", "display", "none");
                    if (this.extentChangeHandler)
                            {
                                this.extentChangeHandler.remove();
                                this.extentChangeHandler = null;

                            }
                            this.previousDateOnTimeSlider = null;
                            this.previousDateOnTimeSliderLandsat = null;
                            if (this.refreshHandlerTime)
                            {
                                this.refreshHandlerTime.remove();
                                this.refreshHandlerTime = null;
                            }
                              if(registry.byId("timeDialog").open){
                         this.noMinimizeDisplay = false;
                       
                            registry.byId("timeDialog").hide();
                            this.noMinimizeDisplay = true;
                        }
                         if(domStyle.get("minimizeTimeButton","display")=== "block")
                            domStyle.set("minimizeTimeButton","display","none");
                            domStyle.set(this.filterDiv, "display", "none");

                            if (this.mosaicBackup) {
                                var mr = new MosaicRule(this.mosaicBackup);
                            } else {
                                var mr = new MosaicRule({"mosaicMethod": "esriMosaicAttribute", "sortField": "Best", "sortValue": 0, "ascending": true, "mosaicOperation": "MT_FIRST"});
                            }
                            
                            this.timeSliderHide();
                    this.noMinimizeDisplay = true;        
                    if (this.map.getLayer("primaryLayer"))
                            {
                                this.primaryLayer = this.map.getLayer("primaryLayer");
                                this.primaryLayer.setMosaicRule(mr);
                            }
                            if (this.map.getLayer("landsatLayer")) {
                                this.primaryLayer = this.map.getLayer("landsatLayer");
                                this.primaryLayer.setMosaicRule(mr);
                            }
                           if (dom.byId("slider"))
                        domStyle.set("slider", "display", "block");
                    if (dom.byId("slider2"))
                        domStyle.set("slider2", "display", "block");
                    if (dom.byId("slider3"))
                        domStyle.set("slider3", "display", "block");

                    var length = this.map.graphics.graphics.length;
                    for (var k = 1; k < length; k++) {
                        if (this.map.graphics.graphics[k].symbol.color.g === 255)
                        {
                            this.map.graphics.remove(this.map.graphics.graphics[k]);
                            k--;
                            length = length - 1;
                        }
                    }

                },
                clear: function () {

                    domStyle.set("chartshow", "display", "none");
                    if (this.chart) {
                        dojo.empty("chartNode");
                        this.chart = null;
                    }

                }, extentChange: function (extentInfo) {
                    if (extentInfo.levelChange) {
                        if (this.map.getLevel() <= 10) {
                            this.primaryLayer = this.map.getLayer("primaryLayer");
                            html.set(this.temporalpro, "");
                            domStyle.set("access", "display", "block");
                            domStyle.set(this.filterDiv, "display", "none");

                            if (this.mosaicBackup) {
                                var mr = new MosaicRule(this.mosaicBackup);
                            } else {
                                var mr = new MosaicRule({"mosaicMethod": "esriMosaicAttribute", "sortField": "Best", "sortValue": 0, "ascending": true, "mosaicOperation": "MT_FIRST"});
                            }
                            if(this.primaryLayer)
                            this.primaryLayer.setMosaicRule(mr);

                        } else {
                            if(this.extentChangeHandler) {
                            domStyle.set(this.filterDiv, "display", "block");
                            domStyle.set("access", "display", "none");
                            if(this.chart){
                            this.clear();
                        }  html.set(this.pointgraph, "");
                            if (!this.slider) {
                                this.timeSliderShow();
                            } else {
                                this.timeSliderRefresh();
                            }
                        }
                        }
                    } else {
                        if (this.object) {
                            for (var f in this.dateobj) {
                                if (this.dateobj[f].obj === this.object[0]) {
                                    var sceneExtent = this.dateobj[f].geo;
                                    break;
                                }
                            }
                        }
                        var mapExtent = extentInfo.extent;


                        if(sceneExtent) {
                        if (mapExtent.xmax < sceneExtent.xmin || mapExtent.xmin > sceneExtent.xmax || mapExtent.ymin > sceneExtent.ymax || mapExtent.ymax < sceneExtent.ymin) {

                            if (this.mosaicBackup) {
                                var mr = new MosaicRule(this.mosaicBackup);
                            } else {
                                var mr = new MosaicRule({"mosaicMethod": "esriMosaicAttribute", "sortField": "Best", "sortValue": 0, "ascending": true, "mosaicOperation": "MT_FIRST"});
                            }
                            this.primaryLayer.setMosaicRule(mr);
                            this.timeSliderHide();
                            pm.closePanel('_32_panel');

                        }
                    }

                    }
                },
                refreshData: function () {
                    connect.subscribe("layerOpen", lang.hitch(this, function (flag) {
                       
                        if (flag.flag) {
                         //  if(registry.byId("timeDialog") && registry.byId("timeDialog").open)
                      // registry.byId("timeDialog").hide();
                            flag.flag = false;
                        }
                    }));
                   
                    if (this.map.getLayer("primaryLayer"))
                        this.primaryLayer = this.map.getLayer("primaryLayer");
                    else if (this.map.getLayer("landsatLayer"))
                        this.primaryLayer = this.map.getLayer("landsatLayer");
                    if (this.primaryLayer)
                        this.mosaicBackup = this.primaryLayer.defaultMosaicRule;
                    this.dateField = "AcquisitionDate";
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

                    
                    this.noMinimizeDisplay = false;
                    registry.byId("timeDialog").hide();
this.noMinimizeDisplay = true;
                    
                    this.item = true;
                    this.primaryLayer = this.map.getLayer("primaryLayer");
                    
                    var point = evt;

                    var query = new Query();
                    query.geometry = point;
                    query.outFields = ["AcquisitionDate", "OBJECTID", "GroupName", "Category", "CenterX", "CenterY", "LowPS"];
                    query.where = "Category=1";
                    var queryTask = new QueryTask(this.config.urlElevationPGC);
                    query.orderByFields = ["AcquisitionDate"];
                    query.returnGeometry = false;
                    queryTask.execute(query, lang.hitch(this, function (result) {
                        if(result.features.length >0) {
                        html.set(this.queryScenes, "Querying " + result.features.length + " scenes to create profile. May take longer first time.");
                        registry.byId("waitDialog").show();
                        var arrayIds = [];
                        var data = [], distance = [];
                        for (var a = 0; a < result.features.length; a++) {
                            if (a === 0)
                            {
                                data.push(result.features[a]);
                                var k = 0;
                            } else {
                                if (locale.format(new Date(data[k].attributes.AcquisitionDate), {selector: "date", datePattern: "dd/MM/yy"}) === locale.format(new Date(result.features[a].attributes.AcquisitionDate), {selector: "date", datePattern: "dd/MM/yy"}) && data[k].attributes.LowPS !== result.features[a].attributes.LowPS) {
                                    if (result.features[a].attributes.LowPS < data[k].attributes.LowPS) {
                                        data[k] = result.features[a];
                                    }
                                } else {
                                    data.push(result.features[a]);
                                    k++;
                                }
                            }
                        }


                        this.lengthofsamples = data.length;
                        for (var i = 0; i < this.lengthofsamples; i++) {

                            distance.push({
                                dist: Math.sqrt(Math.pow((data[i].attributes.CenterX - evt.x), 2) + Math.pow((data[i].attributes.CenterY - evt.y), 2)),
                                objectId: data[i].attributes.OBJECTID,
                                acqDate: data[i].attributes.AcquisitionDate,
                                name: data[i].attributes.GroupName
                            });

                        }
                        distance.sort(function (a, b) {
                            return a.dist - b.dist;
                        });
                        if (distance.length > 20) {
                            for (var a = 0; a < 20; a++) {
                                arrayIds[a] = distance[a].objectId;

                            }
                        } else {
                            for (var a = 0; a < distance.length; a++) {
                                arrayIds[a] = distance[a].objectId;
                            }
                        }


                        var mosaic = {"mosaicMethod": "esriMosaicLockRaster", "ascending": true, "mosaicOperation": "MT_FIRST", "lockRasterIds": arrayIds};

                        var request = esriRequest({
                            url: this.config.urlElevationPGC + "/getSamples",
                            content: {
                                geometry: JSON.stringify(point),
                                geometryType: "esriGeometryPoint",
                                returnGeometry: false,
                                returnFirstValueOnly: false,
                                outFields: 'AcquisitionDate,Name,GroupName,Category,OBJECTID',
                                mosaicRule: JSON.stringify(mosaic),
                                f: "json"
                            },
                            handleAs: "json",
                            callbackParamName: "callback"
                        });
                        request.then(lang.hitch(this, function (data) {
                            if(data.samples.length > 1) {
                            var items = data.samples;
                            var normalizedValues = [], normalizedValues1 = [];
                            var itemInfo = [];
                            for (var a in items) {
                                normalizedValues.push(
                                        {y: parseFloat(items[a].value),
                                            tooltip: (parseFloat(items[a].value)).toFixed(3) + ", " + locale.format(new Date(items[a].attributes.AcquisitionDate), {selector: "date", datePattern: "dd/MM/yy"})});
                                normalizedValues1[a] = parseFloat(items[a].value);
                                itemInfo.push({
                                    acqDate: items[a].attributes.AcquisitionDate,
                                    objid: items[a].attributes.OBJECTID,
                                    values: normalizedValues[a],
                                    name: items[a].attributes.GroupName
                                });
                            }

                            var byDate = itemInfo.slice(0);

                            byDate.sort(function (a, b) {
                                return a.acqDate - b.acqDate;
                            });
                            this.ElevationData = byDate;
                            this.ElevationDates = [];
                            this.ElevationValues = [];
                            for (var a = 0; a < this.ElevationData.length; a++) {
                                this.ElevationDates.push({
                                    text: locale.format(new Date(this.ElevationData[a].acqDate), {selector: "date", datePattern: "dd/MM/yy"}),
                                    value: parseInt(a) + 1
                                });

                                this.ElevationValues.push({
                                    y: this.ElevationData[a].values.y,
                                    tooltip: this.ElevationData[a].values.tooltip
                                });

                            }
                            normalizedValues1.sort(function (a, b) {
                                return a - b;
                            });
                            html.set(this.temporalpro, "");
                            html.set(this.pointgraph, "Pick point on map to reset location.<br /> Pick point on graph to set image date");
                            domStyle.set("chartshow", "display", "block");


                            if (!registry.byId("timeDialog").open)
                            {
                                registry.byId("timeDialog").show();
                                domStyle.set("timeDialog", "left", "160px");
                                domStyle.set("timeDialog", "top", "75px");
                                registry.byId("waitDialog").hide();
                            }
                            // domStyle.set("timeDialog", "top", (this.h + "px"));
                            this.chart = new Chart("chartNode");
                            this.chart.addPlot("default", {
                                type: "Lines",
                                tension: "S",
                                markers: true,
                                shadows: {dx: 4, dy: 4}
                            });
                            this.chart.addPlot("other", {type: "Lines", vAxis: "other y"});
                            this.chart.setTheme(theme);


                            this.count = 1;

                            this.chart.addAxis("y", {vertical: true, fixLower: "major", fixUpper: "major", title: "Elevation Values", titleOrientation: "axis"});
                            this.chart.addAxis("x", {labels: this.ElevationDates, labelSizeChange: true, title: "Acquisition Date", titleOrientation: "away", majorTickStep: 1, minorTicks: false});
                            this.chart.addAxis("other y", {vertical: true, leftBottom: false, min: 0, max: (normalizedValues1[normalizedValues1.length - 1] - normalizedValues1[0])});

                            this.chart.addSeries("Height Index", this.ElevationValues);



                            this.toolTip = new Tooltip(this.chart, "default");
                            this.magnify = new Magnify(this.chart, "default");

                            this.chart.render();

                           
                            domConstruct.destroy("timeDialog_underlay");


                            this.chart.connectToPlot("default", lang.hitch(this, this.clickdata));

                            }else {
                                if(data.samples.length === 1){
                      
                                html.set(this.pointgraph,"Elevation: <b>"+parseFloat((data.samples[0].value).split(" ")[0]).toFixed(1)+"m</b><br />Acquisition Date: <b>"+locale.format(new Date(data.samples[0].attributes.AcquisitionDate), {selector: "date", formatLength: "long"})+"</b>");
                                
                            }else
                                html.set(this.pointgraph,"No elevation data available for this location.");
                             html.set(this.temporalpro, "");
                              if (!registry.byId("timeDialog").open){
                                registry.byId("timeDialog").show();
                                domStyle.set("timeDialog", "left", "160px");
                                domStyle.set("timeDialog", "top", "75px");
                            }
                            registry.byId("waitDialog").hide();
                               domConstruct.destroy("timeDialog_underlay");
                            }
                             domStyle.set("slider", "display", "none");
                            domStyle.set("slider2", "display", "none");
                            domStyle.set("slider3", "display", "none");
                            domStyle.set("loadingtime", "display", "none");
                        }), lang.hitch(this, function (error) {
                            domStyle.set("loadingtime", "display", "none");
                             html.set(this.pointgraph,"No elevation data available for this location.");
                             html.set(this.temporalpro, "");
                              if (!registry.byId("timeDialog").open){
                                registry.byId("timeDialog").show();
                                domStyle.set("timeDialog", "left", "160px");
                                domStyle.set("timeDialog", "top", "75px");
                            }
                            registry.byId("waitDialog").hide();
                               domConstruct.destroy("timeDialog_underlay");
                        }));

                        }else{
                               domStyle.set("slider", "display", "none");
                            domStyle.set("slider2", "display", "none");
                            domStyle.set("slider3", "display", "none");
                            domStyle.set("loadingtime", "display", "none");
                         html.set(this.pointgraph,"No elevation data available for this location.");
                             html.set(this.temporalpro, "");
                              if (!registry.byId("timeDialog").open){
                                registry.byId("timeDialog").show();
                                domStyle.set("timeDialog", "left", "160px");
                                domStyle.set("timeDialog", "top", "75px");
                            }
                            registry.byId("waitDialog").hide();
                               domConstruct.destroy("timeDialog_underlay");
                        }
                    }), lang.hitch(this, function (error) {
                        domStyle.set("loadingtime", "display", "none");
                         html.set(this.pointgraph,"No elevation data available for this location.");
                             html.set(this.temporalpro, "");
                              if (!registry.byId("timeDialog").open){
                                registry.byId("timeDialog").show();
                                domStyle.set("timeDialog", "left", "160px");
                                domStyle.set("timeDialog", "top", "75px");
                            }
                            registry.byId("waitDialog").hide();
                               domConstruct.destroy("timeDialog_underlay");
                    }));
                   

                },
                temporalprofLandsat: function (evt)
                {


                    
                    this.noMinimizeDisplay = false;
                    registry.byId("timeDialog").hide();
this.noMinimizeDisplay = true;
                    
                    this.item = true;


                    this.primaryLayer = this.map.getLayer("landsatLayer");
                   
                    var point = evt;
                    var query = new Query();
                    query.geometry = point;
                    query.outFields = ["AcquisitionDate", "OBJECTID", "CenterX", "CenterY", "GroupName"];
                    query.where = "(Category = 1) AND (CloudCover <=" + registry.byId("cloudFilter").get("value") + ")";


                    query.orderByFields = ["AcquisitionDate"];
                    query.returnGeometry = false;
                    var array = [], arrayId = [];
                    var queryTask = new QueryTask(this.config.msurl);
                    var distance = [];
                    queryTask.execute(query, lang.hitch(this, function (result) {

                        var data = result.features;


                        html.set(this.queryScenes, "Querying " + data.length + " scenes to create profile. May take longer first time.");
                        registry.byId("waitDialog").show();
                        var prevIterationValue = 0;
                        this.lengthofsamples = data.length;
                        for (var i = 0; i < this.lengthofsamples; i++) {
                            //   if((locale.format(new Date(data[i].attributes.AcquisitionDate), {selector: "date", datePattern: "yyyy/MM/dd"}) > this.config.OldestDate) &&(locale.format(new Date(data[i].attributes.AcquisitionDate), {selector: "date", datePattern: "yyyy/MM/dd"}) < this.config.LatestDate)){
                            if (data[i].attributes.GroupName.slice(0, 3) !== "LC8") {
                                array.push({
                                    objectId: data[i].attributes.OBJECTID,
                                    acqDate: data[i].attributes.AcquisitionDate,
                                    name: data[i].attributes.GroupName
                                });
                                arrayId.push(data[i].attributes.OBJECTID);


                            } else {
                                distance.push({
                                    dist: Math.sqrt(Math.pow((data[i].attributes.CenterX - evt.x), 2) + Math.pow((data[i].attributes.CenterY - evt.y), 2)),
                                    objectId: data[i].attributes.OBJECTID,
                                    acqDate: data[i].attributes.AcquisitionDate,
                                    name: data[i].attributes.GroupName
                                });

                            }
                            //  }
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
                            var limitSamples = distance.length;
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
                                var green = plot[2]
                                var calc = (nir - red) / (red + nir);
                                var swir1 = plot[5];
                                var ndmi = ((nir - swir1) / (nir + swir1));
                                var snow = ((green - swir1) / (green + swir1));
                                snow = this.limitvalue(snow);

                                calc = this.limitvalue(calc);
                                ndmi = this.limitvalue(ndmi);
                                normalizedValues.push(
                                        {y: calc,
                                            tooltip: calc.toFixed(3) + ", " + locale.format(new Date(array[a].acqDate), {selector: "date", datePattern: "dd/MM/yy"})});

                                normalizedValues2.push(
                                        {y: ndmi,
                                            tooltip: ndmi.toFixed(3) + ", " + locale.format(new Date(array[a].acqDate), {selector: "date", datePattern: "dd/MM/yy"})});

                                normalizedValues4.push(
                                        {y: snow,
                                            tooltip: snow.toFixed(3) + ", " + locale.format(new Date(array[a].acqDate), {selector: "date", datePattern: "dd/MM/yy"})});
                                itemInfo.push({
                                    acqDate: array[a].acqDate,
                                    objid: array[a].objectId,
                                    values: normalizedValues,
                                    ndmiValues: normalizedValues2,
                                    snowValues: normalizedValues4,
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
                            this.SnowValues = [];
                            this.NDVIDates = [];
                            this.ElevationData = byDate;
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
                                this.SnowValues.push({
                                    y: this.NDVIData[a].snowValues[0].y,
                                    tooltip: this.NDVIData[a].snowValues[0].tooltip
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
                                domStyle.set("timeDialog", "left", "160px");
                                domStyle.set("timeDialog", "top", "75px");
                            }
                            //  domStyle.set("timeDialog", "top", (this.h + "px"));
                            this.chart = new Chart("chartNode");
                            this.chart.addPlot("default", {
                                type: "Lines",
                                markers: true,
                                tension: "S",
                                shadows: {dx: 4, dy: 4}
                            });
                            this.chart.setTheme(theme);


                            this.count = 1;

                            this.chart.addAxis("y", {vertical: true, fixLower: "major", fixUpper: "major", title: "Data Values", titleOrientation: "axis"});
                            this.chart.addAxis("x", {labels: this.NDVIDates, labelSizeChange: true, title: "Acquisition Date", titleOrientation: "away", majorTickStep: 1, minorTicks: false});

                            this.chart.addSeries("NDMI Moisture", this.NDMIValues, {stroke: {color: "#40a4df", width: 1.5}, fill: "#40a4df", hidden: true});
                            this.chart.addSeries("Snow Index", this.SnowValues, {stroke: {color: "#A5F2F3", width: 1.5}, fill: "#A5F2F3", hidden: true});
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

                            this.chart.connectToPlot("default", lang.hitch(this, this.clickdata));

                            domStyle.set("slider", "display", "none");
                            domStyle.set("slider2", "display", "none");
                            domStyle.set("slider3", "display", "none");

                        }), lang.hitch(this, function (error)
                        {
                            domStyle.set(dom.byId("loadingtime"), "display", "none");
                        }));

                    }), lang.hitch(this, function (error) {
                        domStyle.set("loadingtime", "display", "none");
                    }));

                    
                },
                clickdata: function (evt)
                {

                    var type2 = evt.type;
                    if (type2 === "onclick")
                    {

                        this.datesclick = (evt.x - 1);

                        for (var g = 0; g < this.orderedFeatures1.length; g++)
                        {

                            if (locale.format(new Date(this.orderedFeatures1[g].attributes.AcquisitionDate), {selector: "date", datePattern: "dd/MM/yy"}) === locale.format(new Date(this.ElevationData[this.datesclick].acqDate), {selector: "date", datePattern: "dd/MM/yy"}) && this.orderedFeatures1[g].attributes.GroupName === this.ElevationData[this.datesclick].name)
                            {

                                this.slider.set("value", g);

                                this.sliderChange();


                            }

                        }

                    }
                },
                timeSliderShow: function () {
                    if (this.map.getLayer("primaryLayer"))
                        this.primaryLayer = this.map.getLayer("primaryLayer");
                    else if (this.map.getLayer("landsatLayer"))
                        this.primaryLayer = this.map.getLayer("landsatLayer");
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
                    query.outFields = ["AcquisitionDate", "GroupName", "Best", "LowPS", "Name"];
                    if (this.primaryLayer.url === this.config.urlElevationPGC) {
                        query.where = "Category = 1";
                        domStyle.set("cloudSelect", "display", "none");
                    } else {
                        query.where = "(Category = 1) AND (CloudCover <=" + registry.byId("cloudFilter").get("value") + ")";
                        domStyle.set("cloudSelect", "display", "inline-block");
                    }
                    query.orderByFields = ["AcquisitionDate"];
                    query.returnGeometry = true;


                    var queryTask = new QueryTask(this.primaryLayer.url);

                    queryTask.execute(query, lang.hitch(this, function (result) {


                        this.dateobj = [];
                        this.orderedFeatures1 = [];
                        //  this.orderedFeatures1 =result.features;
                        for (var a = 0; a < result.features.length; a++) {
                            //   if((locale.format(new Date(result.features[a].attributes.AcquisitionDate), {selector: "date", datePattern: "yyyy/MM/dd"}) > this.config.OldestDate) && (locale.format(new Date(result.features[a].attributes.AcquisitionDate), {selector: "date", datePattern: "yyyy/MM/dd"}) < this.config.LatestDate)){
                            if (this.orderedFeatures1.length === 0)
                            {
                                this.orderedFeatures1.push(result.features[a]);
                                var k = 0;
                            } else {
                                if (locale.format(new Date(this.orderedFeatures1[k].attributes.AcquisitionDate), {selector: "date", datePattern: "dd/MM/yy"}) === locale.format(new Date(result.features[a].attributes.AcquisitionDate), {selector: "date", datePattern: "dd/MM/yy"}) && this.orderedFeatures1[k].attributes.LowPS !== result.features[a].attributes.LowPS) {
                                    if (result.features[a].attributes.LowPS < this.orderedFeatures1[k].attributes.LowPS) {
                                        this.orderedFeatures1[k] = result.features[a];
                                    }
                                } else {
                                    this.orderedFeatures1.push(result.features[a]);
                                    k++;
                                }
                            }
                            //  }
                        }
                        for (var t = 0; t <= this.orderedFeatures1.length - 1; t++){
                            this.dateobj.push({
                                date: locale.format(new Date(this.orderedFeatures1[t].attributes.AcquisitionDate), {selector: "date", datePattern: "dd/MM/yy"}),
                                obj: this.orderedFeatures1[t].attributes.OBJECTID,
                                geo: this.orderedFeatures1[t].geometry.getExtent(),
                                geo1: this.orderedFeatures1[t].geometry,
                                Scene: this.orderedFeatures1[t].attributes.Name,
                                pixel: this.orderedFeatures1[t].attributes.LowPS
                            });

                        }

                        this.orderedDates = [];
                        for (var a = 0; a < this.orderedFeatures1.length; a++) {
                            this.orderedDates.push(this.orderedFeatures1[a].attributes["AcquisitionDate"]);
                        }


                        this.featureLength = this.orderedFeatures1.length;

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
                        if (this.appScene) {
                            for (var f in this.dateobj) {

                                if ((this.appScene) === this.dateobj[f].Scene)
                                {
                                    for (var j = 0; j < this.orderedDates.length; j++) {
                                        if (this.dateobj[f].date === locale.format(new Date(this.orderedDates[j]), {selector: "date", datePattern: "dd/MM/yy"}))
                                        {

                                            var ind = j;
                                            break;
                                        }
                                    }
                                    break;
                                }
                            }
                            this.appScene = null;
                        } else {
                            this.best = [];
                            for (var r = 0; r < this.orderedFeatures1.length; r++)
                            {
                                this.best.push(this.orderedFeatures1[r].attributes.Best);
                            }
                            this.best.sort(function (a, b)
                            {
                                return(a - b);
                            });

                            var index = this.best[0];

                            for (var z in this.orderedFeatures1)
                            {
                                if (this.orderedFeatures1[z].attributes.Best === index)
                                {

                                    var ind = z;
                                    break;
                                }
                            }
                        }
                        if (this.map.getLayer("primaryLayer")) {
                            if (this.previousDateOnTimeSlider !== null) {
                                for (var i in this.orderedDates) {
                                    if (this.orderedDates[i] === this.previousDateOnTimeSlider) {
                                        ind = i;
                                    }
                                }
                            }
                        } else {
                            if (this.previousDateOnTimeSliderLandsat !== null) {
                                for (var i in this.orderedDates) {
                                    if (this.orderedDates[i] === this.previousDateOnTimeSliderLandsat) {
                                        ind = i;
                                    }
                                }
                            }
                        }
                        this.slider.set("value", ind);

                        // this.sliderChange();
                        html.set(this.dateRange, locale.format(new Date(this.orderedDates[ind]), {selector: "date", formatLength: "long"}) + "        Pixel Size: " + Math.round(this.orderedFeatures1[ind].attributes.LowPS) + "m");
                        html.set(this.temporalpro, "Pick point on map to get temporal profile for that point");
                        //domStyle.set("loadingtime", "display", "none");
                    }), lang.hitch(this, function (error)
                    {
                        domStyle.set("loadingtime", "display", "none");

                        this.slider.set("value", 0);
                        this.sliderChange();
                    }
                    ));


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


                    if (this.map.getLayer("primaryLayer")) {
                        this.primaryLayer = this.map.getLayer("primaryLayer");
                        this.previousDateOnTimeSlider = this.orderedDates[this.slider.get("value")];
                        registry.byId("arcticSceneID").set("value", this.orderedFeatures1[this.slider.get("value")].attributes["Name"]);
                    } else if (this.map.getLayer("landsatLayer")) {
                        this.primaryLayer = this.map.getLayer("landsatLayer");
                        this.previousDateOnTimeSliderLandsat = this.orderedDates[this.slider.get("value")];
                        registry.byId("landsatSceneID").set("value", this.orderedFeatures1[this.slider.get("value")].attributes["Name"]);
                    }
                    this.sliderValue = this.slider.get("value");

                    if (this.sliderValue !== null) {
                        var aqDate = this.orderedFeatures1[this.slider.get("value")].attributes["AcquisitionDate"];

                        this.object = [this.orderedFeatures1[this.slider.get("value")].attributes.OBJECTID];
                        registry.byId("currentDate").set("value", aqDate);
                        html.set(this.dateRange, locale.format(new Date(aqDate), {selector: "date", formatLength: "long"}) + "        Pixel Size: " + Math.round(this.orderedFeatures1[this.slider.get("value")].attributes.LowPS) + "m");

                        var mr = new MosaicRule();
                        mr.method = MosaicRule.METHOD_LOCKRASTER;
                        mr.ascending = true;
                        mr.operation = "MT_FIRST";
                        mr.lockRasterIds = this.object;
                        //   this.primaryLayer = this.map.getLayer("primaryLayer");
                        this.primaryLayer.setMosaicRule(mr);
                       /* if(this.this.map.getLayer("cacheLayer").visible)
                        this.map.getLayer("cacheLayer").hide();
                    if(!this.map.getLayer("primaryLayer").visible)
                        this.map.getLayer("primaryLayer").show();*/
                        if (this.arcticFlag) {
                            this.appScene = this.appScene1;
                            this.appScene1 = null;
                          /*  var x = document.getElementsByClassName("icon-node jimu-state-selected");
                            x[0].click();
                            */dom.byId(this.arcticFlag).click();
                            this.arcticFlag = null;
                        } else if (this.contourFlag) {

                            dom.byId("Contour 25").click();
                            this.contourFlag = null;
                        }
                        if (registry.byId("footprint").checked) {
                            var length = this.map.graphics.graphics.length;

                            for (var k = 0; k < length; k++) {
                                if (this.map.graphics.graphics[k].geometry.type === "polygon") {
                                    if (this.map.graphics.graphics[k].symbol.color.g === 255)
                                    {
                                        this.map.graphics.remove(this.map.graphics.graphics[k]);
                                        k--;
                                        length = length - 1;
                                    }
                                }
                            }
                            this.footprintDisplay();
                        }
                    }

                },
                timeSliderRefresh: function () {
                    if (this.slider) {
                        this.timeSliderHide();
                        this.timeSliderShow();
                    }
                },
                showLoading: function () {
                    domStyle.set("loadingtime", "display", "block");
                },
                hideLoading: function () {
                    domStyle.set("loadingtime", "display", "none");
                }
            });

            clazz.hasLocale = false;
            return clazz;
        });
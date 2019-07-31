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
    'jimu/BaseWidget', "./resourceLoad.js", "dojo/Evented", 'dijit/_TemplatedMixin', "dojo/_base/array"
],
    function (
        declare,
        _WidgetsInTemplateMixin,
        template,
        BaseWidget, resourceLoad, Evented, _TemplatedMixin, arrayDojo
    ) {
        var resource = new resourceLoad({ resource: "time" });
        var plugins = resource.load("time");
        var registry = plugins[1], on = plugins[0], lang = plugins[2], html = plugins[3],
            dom = plugins[4],
            MosaicRule = plugins[5],
            Query = plugins[6], QueryTask = plugins[7], Extent = plugins[8], locale = plugins[9], Chart = plugins[10], Tooltip = plugins[11], theme = plugins[12], SelectableLegend = plugins[13], Magnify = plugins[14], Highlight = plugins[15], domConstruct = plugins[16], HorizontalSlider = plugins[17], HorizontalRule = plugins[18], HorizontalRuleLabels = plugins[19], SimpleLineSymbol = plugins[20], Color = plugins[21], popup = plugins[22], geometryEngine = plugins[23], domStyle = plugins[24], ArcGISImageServiceLayer = plugins[25], ImageServiceParameters = plugins[26], Draw = plugins[27], esriRequest = plugins[28], connect = plugins[29], domClass = plugins[30], SimpleMarkerSymbol = plugins[31], PanelManager = plugins[32];
        var pm = PanelManager.getInstance();
        var clazz = declare([BaseWidget, Evented, _TemplatedMixin], {
            constructor: function (parameters) {
                var defaults = {
                    map: null,
                    config: null,
                    layers: null,
                    nls: null,
                    mainConfig: null,
                };
                lang.mixin(this, defaults, parameters);
            },
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
                //this.resizeTimeWidget();
            },

            resizeTimeWidget: function () {
                if (window.innerWidth > 1200) {
                    domStyle.set("timeDialog", "font-size", "12px");
                    domStyle.set("timeDialog", "width", "440px");
                    domStyle.set("chartNodeTempo", "width", "390px");
                    domStyle.set("chartNodeTempo", "height", "270px");
                    domStyle.set("waitDialog", "width", "440px");
                    domStyle.set("waitDialog", "font-size", "12px");
                    domStyle.set(registry.byId("cloudFilterView").domNode, "width", "50px");
                    domStyle.set("legendTempo", "font-size", "12px");
                    if (this.chart) {
                        this.chart.resize(390, 270);
                    }
                    document.getElementById("savePushDownImage").height = "15";
                } else if (window.innerWidth < 1200 && window.innerWidth > 500) {
                    domStyle.set("timeDialog", "font-size", "9px");
                    domStyle.set("timeDialog", "width", "300px");
                    domStyle.set("chartNodeTempo", "width", "260px");
                    domStyle.set("chartNodeTempo", "height", "180px");
                    domStyle.set("waitDialog", "width", "300px");
                    domStyle.set("waitDialog", "font-size", "9px");
                    domStyle.set(registry.byId("cloudFilterView").domNode, "width", "34px");
                    domStyle.set("legendTempo", "font-size", "6px");
                    if (this.chart) {
                        this.chart.resize(260, 180);
                    }
                    document.getElementById("savePushDownImage").height = "15";
                } else if (window.innerWidth < 500) {
                    domStyle.set("timeDialog", "font-size", "7px");
                    domStyle.set("timeDialog", "width", "200px");
                    domStyle.set("chartNodeTempo", "width", "180px");
                    domStyle.set("chartNodeTempo", "height", "125px");
                    domStyle.set("waitDialog", "width", "200px");
                    domStyle.set("waitDialog", "font-size", "7px");
                    domStyle.set(registry.byId("cloudFilterView").domNode, "width", "23px");
                    domStyle.set("legendTempo", "font-size", "5px");
                    if (this.chart) {
                        this.chart.resize(180, 125);
                    }
                    document.getElementById("savePushDownImage").height = "10";
                }
            },

            postCreate: function () {
                //window.addEventListener("resize", lang.hitch(this, this.resizeTimeWidget));
                if (this.map) {
                    this.toolbarTemporal = new Draw(this.map);
                    dojo.connect(this.toolbarTemporal, "onDrawEnd", lang.hitch(this, this.addGraphic));
                }

            },

            onOpen: function () {
                // if (!registry.byId("imageViewer").get("checked")) {
                //     //domAttr.remove("temporalid", "disabled");
                //     html.set(dom.byId("queryScenes"), "Please select an individual image first");
                //     domStyle.set("mainPlot", "display", "none");
                // } else {
                //registry.byId("imageryTool").getOptions("temporal").disabled = "disabled";
                html.set(dom.byId("queryScenes"), "Pick a point on the map to get the temporal profile for that point.");
                domStyle.set("mainPlot", "display", "block");
                this.primaryLayer = this.map.getLayer(registry.byId("layerSelectorView").value);
                this.autoresize();

                if ((this.map.getLevel()) >= 10) {
                    this.refreshDataTempo();

                    html.set(this.temporalproTempo, "Pick a point on the map to get the temporal profile for that point.");
                    // if (!this.mainConfig.slider) {

                    //     this.timeSliderShow();
                    // }
                    // domStyle.set(this.filterDiv, "display", "block");
                    if (!this.refreshHandlerTime) {
                        this.refreshHandlerTime = this.map.on("update-end", lang.hitch(this, this.refreshDataTempo));
                    }

                } else {

                    html.set(this.temporalproTempo, "");
                    this.hideLoading();
                }

                if (this.y1 !== null) {
                    if (this.y1[0].className === 'icon-node') {
                        dojo.addClass(this.y1[0], "jimu-state-selected");
                    }
                }
                this.toolbarTemporal.activate(Draw.POINT);
                //}
            },

            autoresize: function () {
                this.h = this.map.height;
                this.h = (parseInt((this.h / 5.5))).toString();
            },

            onClose: function () {
                // if (this.map.getLayer("secondaryLayer")) {
                //     if (this.map.getLayer("secondaryLayer").updating) {
                //         this.map.getLayer("secondaryLayer").suspend();
                //     }
                //     this.map.removeLayer(this.map.getLayer("secondaryLayer"));
                //     html.set(this.secondaryRange, "");
                //     domStyle.set(this.dateRange, "font-size", "");
                // }
                this.toolbarTemporal.deactivate();
                for (var a in this.map.graphics.graphics) {
                    if (this.map.graphics.graphics[a].geometry.type === "point" && this.map.graphics.graphics[a].symbol && this.map.graphics.graphics[a].symbol.color.r === 255) {
                        this.map.graphics.remove(this.map.graphics.graphics[a]);
                        break;
                    }
                }

                if (this.extentChangeHandler !== null) {
                    this.extentChangeHandler.remove();
                    this.extentChangeHandler = null;

                }
                if (this.refreshHandlerTime !== null) {
                    this.refreshHandlerTime.remove();
                    this.refreshHandlerTime = null;
                }


                if (this.mosaicBackup) {
                    var mr = new MosaicRule(this.mosaicBackup);
                } else {
                    var mr = new MosaicRule({ "mosaicMethod": "esriMosaicAttribute", "sortField": "best", "sortValue": 0, "ascending": true, "mosaicOperation": "MT_FIRST", "where": "(datatype_format = 'Cloned') OR (datatype_format IS NULL)" });
                }
                //this.primaryLayer.setMosaicRule(mr);
                //this.timeSliderHide();
                this.noMinimizeDisplay = true;

                html.set(this.pointgraphTempo, "");
                this.clear();

                this.item = false;
                // if (this.mainConfig.slider) {
                //     domStyle.set("slider", "display", "block");
                //     domStyle.set("slider2", "display", "block");
                //     domStyle.set("slider3", "display", "block");
                // }
                this.hideLoading();
            },

            clear: function () {
                dojo.style(dojo.byId("chartshowTempo"), "display", "none");
                //domStyle.set(dom.byId("cloudSelect"), "display", "inline-block");
                //domStyle.set("dateSelectorContainer", "display", "inline-block");
                if (this.chart) {
                    dojo.empty("chartNodeTempo");
                    this.chart = null;
                }
            },

            extentChange: function (extentInfo) {

                if (extentInfo.levelChange) {
                    if (this.map.getLevel() < 10) {
                        html.set(this.temporalproTempo, "");


                        if (this.mosaicBackup) {
                            var mr = new MosaicRule(this.mosaicBackup);
                        } else {
                            var mr = new MosaicRule({ "mosaicMethod": "esriMosaicAttribute", "sortField": "best", "sortValue": 0, "ascending": true, "mosaicOperation": "MT_FIRST", "where": "(datatype_format = 'Cloned') OR (datatype_format IS NULL)" });
                        }
                        //this.primaryLayer.setMosaicRule(mr);

                    } else {
                        if (this.extentChangeHandler) {

                            if (this.chart) {
                                this.clear();
                            }
                            html.set(this.pointgraphTempo, "");

                        }
                    }
                } else {

                    if (this.lockId) {
                        var sceneExtent = this.lockId.getExtent();//this.dateobj[f].geo;
                        var mapExtent = extentInfo.extent;
                        if (mapExtent.xmax < sceneExtent.xmin || mapExtent.xmin > sceneExtent.xmax || mapExtent.ymin > sceneExtent.ymax || mapExtent.ymax < sceneExtent.ymin) {

                            if (this.mosaicBackup) {
                                var mr = new MosaicRule(this.mosaicBackup);
                            } else {
                                var mr = new MosaicRule({ "mosaicMethod": "esriMosaicAttribute", "sortField": "best", "sortValue": 0, "ascending": true, "mosaicOperation": "MT_FIRST", "where": "(datatype_format = 'Cloned') OR (datatype_format IS NULL)" });
                            }
                            registry.byId("currentOBJECTID").set("value", null);
                            //this.primaryLayer.setMosaicRule(mr);
                            this.timeSliderHide();
                            pm.closePanel('_32_panel');

                        }
                    }

                }
            },

            refreshDataTempo: function () {
                //this.primaryLayer = this.map.getLayer("primaryLayer");
                this.mosaicBackup = this.primaryLayer.defaultMosaicRule;
                //this.mosaicBackup.where = "(datatype_format = 'Cloned') OR (datatype_format IS NULL)";
                if (this.primaryLayer.id === "MS_696") {
                    this.dateFieldTempo = "AcquisitionDate";
                    this.categoryTempo = "Category";
                    this.cloudTempo = "CloudCover";
                } else {
                    this.dateFieldTempo = "acquisitiondate";
                    this.categoryTempo = "category";
                    this.cloudTempo = "cloudcover";
                }
            },

            limitvalue: function (num) {
                if (num < (-1)) {
                    num = -1;
                }
                if (num > 1) {
                    num = 1;
                }
                return num;
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
                this.pointGeometry = geometry;
                this.temporalprof(geometry);


            },

            temporalprof: function (evt) {
                this.showLoading();
                domStyle.set("loadingLayerViewer", "display", "block");
                if (!this.noSceneFlag) {
                    this.noMinimizeDisplay = false;
                    //registry.byId("timeDialog").hide();
                    this.noMinimizeDisplay = true;
                    this.item = true;

                    var tempLayer = this.primaryLayer;


                    var point = evt;
                    var query = new Query();
                    query.geometry = point;
                    query.outFields = ["*"];
                    query.where = this.categoryTempo + " = 1 AND " + this.cloudTempo + "<=" + registry.byId("cloudFilterView").get("value");


                    query.orderByFields = [this.dateFieldTempo];
                    query.returnGeometry = false;
                    var array = [], arrayId = [];
                    var queryTask = new QueryTask(this.primaryLayer.url);
                    var distance = [];
                    queryTask.execute(query, lang.hitch(this, function (result) {
                        var data = result.features;

                        if (this.primaryLayer.url === this.config.urlSentinel) {
                            if (data.length > 10) {
                                html.set(dom.byId("queryScenes"), "Please wait. Querying best 10 out of " + data.length + " scenes to create profile.<br>May take longer the first time.");
                            }
                            else {
                                html.set(dom.byId("queryScenes"), "Please wait. Querying " + data.length + " scenes to create profile.<br>May take longer the first time.");
                            }
                        } else {
                            if (data.length > 20) {
                                html.set(dom.byId("queryScenes"), "Please wait. Querying best 20 out of " + data.length + " scenes to create profile.<br>May take longer the first time.");
                            }
                            else {
                                html.set(dom.byId("queryScenes"), "Please wait. Querying " + data.length + " scenes to create profile.<br>May take longer the first time.");
                            }
                        }
                        //registry.byId("waitDialog").show();
                        var prevIterationValue = 0;
                        this.lengthofsamples = data.length;

                        if (this.primaryLayer.url === this.config.urlSentinel) {
                            for (var i = 0; i < this.lengthofsamples; i++) {
                                if (i === 0) {
                                    distance.push({
                                        objectId: data[i].attributes.objectid,
                                        acqDate: data[i].attributes.acquisitiondate,
                                        name: data[i].attributes.name
                                    });
                                } else {
                                    if (locale.format(new Date(distance[distance.length - 1].acqDate), { selector: "date", datePattern: "dd/MM/yy" }) !== locale.format(new Date(data[i].attributes.acquisitiondate), { selector: "date", datePattern: "dd/MM/yy" })) {
                                        distance.push({
                                            objectId: data[i].attributes.objectid,
                                            acqDate: data[i].attributes.acquisitiondate,
                                            name: data[i].attributes.name
                                        });
                                    }

                                }
                            }
                            if (distance.length > 10) {
                                var limitSamples = distance.length - 10;
                            } else {
                                var limitSamples = 0;
                            }

                            if (distance.length !== 0) {
                                if (!registry.byId("imageViewer").checked) {
                                    for (var j = limitSamples; j < distance.length; j++) {

                                        array.push({
                                            objectId: distance[j].objectId,
                                            acqDate: distance[j].acqDate,
                                            name: distance[j].name

                                        });
                                        arrayId.push(distance[j].objectId);


                                    }
                                } else {
                                    var count = 0;
                                    for (var i = 0; i < distance.length; i++) {
                                        if (distance[i].acqDate === this.mainConfig.orderedFeatures[this.mainConfig.valueSelected].attributes.acquisitiondate) {
                                            count++;
                                        }
                                    }
                                    if (count === 0) {
                                        distance.push({
                                            objectId: this.mainConfig.orderedFeatures[this.mainConfig.valueSelected].attributes.objectid,
                                            acqDate: this.mainConfig.orderedFeatures[this.mainConfig.valueSelected].attributes.acquisitiondate,
                                            name: this.mainConfig.orderedFeatures[this.mainConfig.valueSelected].attributes.name
                                        });
                                    }

                                    distance.sort(function (a, b) {
                                        return b.acqDate - a.acqDate;
                                    });
                                    arrayDojo.map(distance, lang.hitch(this, function (item, index) {
                                        if (item.acqDate === this.mainConfig.orderedFeatures[this.mainConfig.valueSelected].attributes.acquisitiondate) {
                                            this.objectIndex = index;
                                        }
                                    }));
                                    if (distance.length > 10) {                                     //condition if samples are more than 10
                                        if (this.objectIndex - 5 >= 0 && this.objectIndex + 5 <= distance.length) {
                                            for (var j = this.objectIndex - 5; j < this.objectIndex + 5; j++) {
                                                array.push({
                                                    objectId: distance[j].objectId,
                                                    acqDate: distance[j].acqDate,
                                                    name: distance[j].name
                                                });
                                                arrayId.push(distance[j].objectId);
                                            }
                                        } else if (this.objectIndex - 5 < 0) {
                                            for (var j = this.objectIndex; j < this.objectIndex + 10; j++) {
                                                array.push({
                                                    objectId: distance[j].objectId,
                                                    acqDate: distance[j].acqDate,
                                                    name: distance[j].name
                                                });
                                                arrayId.push(distance[j].objectId);
                                            }
                                        } else if (this.objectIndex + 5 > distance.length) {
                                            for (var j = this.objectIndex - 10; j < this.objectIndex; j++) {
                                                array.push({
                                                    objectId: distance[j].objectId,
                                                    acqDate: distance[j].acqDate,
                                                    name: distance[j].name
                                                });
                                                arrayId.push(distance[j].objectId);
                                            }
                                        }
                                    } else {                                                        //condition if samples are less than 10
                                        for (var j = 0; j < distance.length; j++) {
                                            array.push({
                                                objectId: distance[j].objectId,
                                                acqDate: distance[j].acqDate,
                                                name: distance[j].name
                                            });
                                            arrayId.push(distance[j].objectId);
                                        }
                                    }
                                }
                            }
                            var noCurrentScene = null;

                        } else if (this.primaryLayer.url === this.config.urlLandsatMS) {
                            var l = 0;
                            for (var i = 0; i < this.lengthofsamples; i++) {
                                if (data[i].attributes.GroupName.slice(0, 3) !== "LC8" && this.primaryLayer.url === this.config.urlLandsatMS && data.length > 20) {
                                    if (l < 5) {
                                        array.push({
                                            objectId: data[i].attributes.OBJECTID,
                                            acqDate: data[i].attributes.AcquisitionDate,
                                            name: data[i].attributes.GroupName
                                        });
                                        arrayId[i] = data[i].attributes.OBJECTID;
                                        //prevIterationValue = i;
                                    }
                                    l++;

                                } else {
                                    distance.push({
                                        dist: Math.sqrt(Math.pow((data[i].attributes.CenterX - evt.x), 2) + Math.pow((data[i].attributes.CenterY - evt.y), 2)),
                                        objectId: data[i].attributes.OBJECTID,
                                        acqDate: data[i].attributes.AcquisitionDate,
                                        name: data[i].attributes.GroupName
                                    });

                                }
                            }

                            var prevIterationValue = array.length;
                            distance.sort(function (a, b) {
                                //       return a.dist - b.dist;
                                return b.acqDate - a.acqDate;
                            });
                            var k = 0;
                            var range = 20 - prevIterationValue;
                            if (range <= distance.length) {
                                var limitSamples = 20;
                            } else {
                                var limitSamples = prevIterationValue + distance.length;
                            }

                            if (distance.length !== 0) {
                                if (!registry.byId("imageViewer").checked) {
                                    for (var j = prevIterationValue; j < limitSamples; j++) {

                                        array.push({
                                            objectId: distance[k].objectId,
                                            acqDate: distance[k].acqDate,
                                            name: distance[k].name

                                        });
                                        arrayId[j] = distance[k].objectId;
                                        k++;

                                    }
                                } else {
                                    var count = 0;
                                    for (var i = 0; i < distance.length; i++) {
                                        if (distance[i].acqDate === this.mainConfig.orderedFeatures[this.mainConfig.valueSelected].attributes.AcquisitionDate) {
                                            count++;
                                        }
                                    }
                                    if (count === 0) {
                                        distance.push({
                                            dist: Math.sqrt(Math.pow((this.mainConfig.orderedFeatures[this.mainConfig.valueSelected].attributes.CenterX - evt.x), 2) + Math.pow((this.mainConfig.orderedFeatures[this.mainConfig.valueSelected].attributes.CenterY - evt.y), 2)),
                                            objectId: this.mainConfig.orderedFeatures[this.mainConfig.valueSelected].attributes.OBJECTID,
                                            acqDate: this.mainConfig.orderedFeatures[this.mainConfig.valueSelected].attributes.AcquisitionDate,
                                            name: this.mainConfig.orderedFeatures[this.mainConfig.valueSelected].attributes.GroupName
                                        });
                                    }

                                    distance.sort(function (a, b) {
                                        return b.acqDate - a.acqDate;
                                    });
                                    arrayDojo.map(distance, lang.hitch(this, function (item, index) {
                                        if (item.acqDate === this.mainConfig.orderedFeatures[this.mainConfig.valueSelected].attributes.AcquisitionDate) {
                                            this.objectIndex = index;
                                        }
                                    }));

                                    if (distance.length > 20) {                               //condition for if samples are more than 20
                                        if (this.objectIndex - 10 >= 0 && this.objectIndex + 10 <= distance.length) {
                                            for (var j = this.objectIndex - 10; j < this.objectIndex + 10; j++) {
                                                array.push({
                                                    objectId: distance[j].objectId,
                                                    acqDate: distance[j].acqDate,
                                                    name: distance[j].name
                                                });
                                                arrayId.push(distance[j].objectId);
                                            }
                                        } else if (this.objectIndex - 10 < 0) {
                                            for (var j = this.objectIndex; j < this.objectIndex + 20; j++) {
                                                array.push({
                                                    objectId: distance[j].objectId,
                                                    acqDate: distance[j].acqDate,
                                                    name: distance[j].name
                                                });
                                                arrayId.push(distance[j].objectId);
                                            }
                                        } else if (this.objectIndex + 10 > distance.length) {
                                            for (var j = this.objectIndex - 20; j < this.objectIndex; j++) {
                                                array.push({
                                                    objectId: distance[j].objectId,
                                                    acqDate: distance[j].acqDate,
                                                    name: distance[j].name
                                                });
                                                arrayId.push(distance[j].objectId);
                                            }
                                        }
                                    } else {                                            //condition for if samples are less than 20
                                        for (var j = 0; j < distance.length; j++) {
                                            array.push({
                                                objectId: distance[j].objectId,
                                                acqDate: distance[j].acqDate,
                                                name: distance[j].name
                                            });
                                            arrayId.push(distance[j].objectId);
                                        }
                                    }
                                }
                            }
                            var noCurrentScene = null;
                        }

                        var mosaicLock = new MosaicRule({ "mosaicMethod": "esriMosaicLockRaster", "ascending": true, "mosaicOperation": "MT_FIRST", "lockRasterIds": arrayId });
                        mosaicLock = JSON.stringify(mosaicLock.toJson());

                        var request1 = esriRequest({
                            url: this.primaryLayer.url + "/getSamples",
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

                                if (this.primaryLayer.url === this.config.urlSentinel) {
                                    var nir = plot[7];
                                    var red = plot[3];
                                    var swir1 = plot[11];
                                } else if (this.primaryLayer.url === this.config.urlLandsatMS) {
                                    var nir = plot[4];
                                    var red = plot[3];
                                    var swir1 = plot[5];
                                }

                                var calc = (nir - red) / (red + nir);
                                var ndmi = ((nir - swir1) / (nir + swir1));
                                var urban = ((swir1 - nir) / (swir1 + nir)) - ((nir - red) / (red + nir));

                                ndmi = this.limitvalue(ndmi);

                                calc = this.limitvalue(calc);
                                urban = this.limitvalue(urban);
                                normalizedValues.push(
                                    {
                                        y: calc,
                                        tooltip: calc.toFixed(3) + ", " + locale.format(new Date(array[a].acqDate), { selector: "date", datePattern: "dd/MM/yy" })
                                    });

                                normalizedValues2.push(
                                    {
                                        y: ndmi,
                                        tooltip: ndmi.toFixed(3) + ", " + locale.format(new Date(array[a].acqDate), { selector: "date", datePattern: "dd/MM/yy" })
                                    });

                                normalizedValues4.push(
                                    {
                                        y: urban,
                                        tooltip: urban.toFixed(3) + ", " + locale.format(new Date(array[a].acqDate), { selector: "date", datePattern: "dd/MM/yy" })
                                    });
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
                                    text: locale.format(new Date(this.NDVIData[a].acqDate), { selector: "date", datePattern: "dd/MM/yy" }),
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
                            html.set(this.temporalproTempo, "");
                            this.clear();

                            html.set(this.pointgraphTempo, "Pick a point on the map to reset location.<br /> Pick a point on the graph to set image date.");
                            dojo.style(dojo.byId("chartshowTempo"), "display", "block");
                            //domStyle.set(dom.byId("cloudSelect"), "display", "none");

                            if (items.length === 1) {
                                document.getElementById("chartValuesTempo").innerHTML = "<table><tr><td>NDVI (Vegetation): </td><td><b>" + (this.NDVIValues[0].y).toFixed(2) + "</b></td></tr><tr><td>Urban: </td><td><b>" + (this.UrbanValues[0].y).toFixed(2) + "</b></td></tr><tr><td>NDMI (Moisture): </td><td><b>" + (this.NDMIValues[0].y).toFixed(2) + "</b></td></tr></table>";
                                domStyle.set("chartNodeTempo", "display", "none");
                                domStyle.set("legendTempo", "display", "none");
                            } else {
                                domStyle.set("chartNodeTempo", "display", "block");
                                domStyle.set("legendTempo", "display", "block");
                                document.getElementById("chartValuesTempo").innerHTML = "";



                                this.chart = new Chart("chartNodeTempo");
                                this.chart.addPlot("default", {
                                    type: "Lines",
                                    markers: true,
                                    tension: "S",
                                    shadows: { dx: 4, dy: 4 }
                                });
                                this.chart.setTheme(theme);


                                this.chart.addAxis("y", { vertical: true, fixLower: "major", fixUpper: "major", title: "Data Values", titleOrientation: "axis" });
                                this.chart.addAxis("x", { labels: this.NDVIDates, labelSizeChange: true, title: "Acquisition Date", titleOrientation: "away", majorTickStep: 1, minorTicks: false });

                                this.chart.addSeries("NDMI (Moisture)", this.NDMIValues, { stroke: { color: "#40a4df", width: 1.5 }, fill: "#40a4df", hidden: true });
                                this.chart.addSeries("Urban", this.UrbanValues, { stroke: { color: "indianred", width: 1.5 }, fill: "indianred", hidden: true });
                                this.chart.addSeries("NDVI (Vegetation)", this.NDVIValues, { stroke: { color: "forestgreen", width: 1.5 }, fill: "forestgreen" });

                                this.toolTip = new Tooltip(this.chart, "default");
                                this.magnify = new Magnify(this.chart, "default", { scale: 3 });
                                this.highLight = new Highlight(this.chart, "default");
                                this.chart.render();
                                if (!this.legendTempo) {
                                    this.legendTempo = new SelectableLegend({ chart: this.chart, horizontal: true, outline: false }, "legendTempo");
                                }
                                else {
                                    this.legendTempo.set("params", { chart: this.chart, horizontal: true, outline: false });
                                    this.legendTempo.set("chart", this.chart);
                                    this.legendTempo.refresh();
                                }
                                this.legendNumber = parseInt((this.legendTempo._cbs[0].id).split("Box_")[1]);

                                for (var d = this.legendNumber; d < (this.legendNumber + 3); d++) {
                                    on(document.getElementById("dijit_form_CheckBox_" + d), "click", lang.hitch(this, function (e) {

                                        if (document.getElementById("dijit_form_CheckBox_" + this.legendNumber).checked) {
                                            this.chart.fireEvent("NDMI Moisture", "onmouseover", this.prevMarker);
                                        }
                                        if (document.getElementById("dijit_form_CheckBox_" + (this.legendNumber + 1)).checked) {
                                            this.chart.fireEvent("Urban", "onmouseover", this.prevMarker);
                                        }
                                        if (document.getElementById("dijit_form_CheckBox_" + (this.legendNumber + 2)).checked) {
                                            this.chart.fireEvent("NDVI Vegetation", "onmouseover", this.prevMarker);
                                        }

                                    }));
                                }


                                this.chart.connectToPlot("default", lang.hitch(this, this.clickdata));
                            }
                            domConstruct.destroy("chartDialog_underlay");
                            domConstruct.destroy("timeDialog_underlay");

                            this.seclayer = this.primaryLayer.url;
                            html.set(dom.byId("queryScenes"), "Pick a point on the map to reset location. <br />Pick a point on the graph to set image date.");
                            domStyle.set("loadingLayerViewer", "display", "none");
                        }), lang.hitch(this, function (error) {
                            //registry.byId("timeDialog").show();
                            domStyle.set("loadingLayerViewer", "display", "none");
                            this.hideLoading();
                        }));

                    }), lang.hitch(this, function (error) {
                        //registry.byId("timeDialog").show();
                        domStyle.set("loadingLayerViewer", "display", "none");
                        this.hideLoading();
                    }));
                }
            },

            clickdata: function (evt) {
                var type2 = evt.type;
                if (type2 === "onclick") {
                    this.datesclick = (evt.x - 1);

                    this.moveImage(this.NDVIData[this.datesclick].objid);
                    if (this.mainConfig.slider) {
                        for (var g = 0; g < this.mainConfig.orderedDates.length; g++) {
                            if (locale.format(new Date(this.mainConfig.orderedDates[g].value), { selector: "date", datePattern: "dd/MM/yy" }) === locale.format(new Date(this.NDVIData[this.datesclick].acqDate), { selector: "date", datePattern: "dd/MM/yy" })) {
                                registry.byId("imageDropDownView").set("value", g);
                                this.mainConfig.slider.set("value", g);
                            }
                        }
                    }
                    if (this.prevMarker) {
                        if (document.getElementById("dijit_form_CheckBox_" + this.legendNumber).checked) {
                            this.chart.fireEvent("NDMI Moisture", "onmouseout", this.prevMarker);
                        }
                        if (document.getElementById("dijit_form_CheckBox_" + (this.legendNumber + 1)).checked) {
                            this.chart.fireEvent("Urban", "onmouseout", this.prevMarker);
                        }
                        if (document.getElementById("dijit_form_CheckBox_" + (this.legendNumber + 2)).checked) {
                            this.chart.fireEvent("NDVI Vegetation", "onmouseout", this.prevMarker);
                        }
                    }
                    if (document.getElementById("dijit_form_CheckBox_" + this.legendNumber).checked) {
                        this.chart.fireEvent("NDMI Moisture", "onmouseout", this.datesclick);
                    }
                    if (document.getElementById("dijit_form_CheckBox_" + (this.legendNumber + 1)).checked) {
                        this.chart.fireEvent("Urban", "onmouseout", this.datesclick);
                    }
                    if (document.getElementById("dijit_form_CheckBox_" + (this.legendNumber + 2)).checked) {
                        this.chart.fireEvent("NDVI Vegetation", "onmouseout", this.datesclick);
                    }
                    this.prevMarker = evt.x - 1;
                }
            },

            moveImage: function (featureIds) {
                var mr = new MosaicRule();
                mr.method = MosaicRule.METHOD_LOCKRASTER;
                mr.ascending = true;
                mr.operation = "MT_FIRST";
                mr.lockRasterIds = [featureIds];
                this.primaryLayer.setMosaicRule(mr);
                var temporalLayer = this.map.getLayer(registry.byId("layerSelectorView").value);
                if (temporalLayer.id === "MS_696") {
                    this.acDate = "AcquisitionDate";
                    this.titleSensor = "LANDSAT";
                } else if (temporalLayer.id === "Sentinel2_2553") {
                    this.acDate = "acquisitiondate";
                    this.titleSensor = "SENTINEL";
                }
                if (temporalLayer && (temporalLayer.mosaicRule || temporalLayer.mosaicRule.method === "esriMosaicLockRaster")) {
                    var getDate = new esriRequest({
                        url: temporalLayer.url + "/getSamples",
                        content: {
                            geometry: JSON.stringify(this.map.extent.getCenter()),
                            geometryType: "esriGeometryPoint",
                            returnGeometry: false,
                            mosaicRule: JSON.stringify(temporalLayer.mosaicRule.toJson()),
                            outFields: [this.acDate],
                            f: "json"
                        },
                        handleAs: "json",
                        callbackParamName: "callback"
                    });
                    getDate.then(lang.hitch(this, function (result) {
                        if (result.samples && result.samples[0].attributes[this.acDate]) {
                            dom.byId("dateDisplay").innerHTML = this.titleSensor + " - &nbsp;&nbsp;" + locale.format(new Date(result.samples[0].attributes[this.acDate]), { selector: "date", formatLength: "long" });
                            //dom.byId("compDisplay").innerHTML = "&nbsp;&nbsp; Compared with - "+ this.title;
                        }
                    }), lang.hitch(this, function () {
                        this.hideLoading();
                    }));
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
        return clazz;
    });
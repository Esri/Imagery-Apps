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
    'jimu/BaseWidget', "./resourceLoad.js",
],
        function (
                declare,
                _WidgetsInTemplateMixin,
                template,
                BaseWidget, resourceLoad
                ) {
            var resource = new resourceLoad({resource: "mask"});
            var plugins = resource.load("mask");
            var popup = plugins[0], on = plugins[1],
                    lang = plugins[2],
                    domClass = plugins[3],
                    RasterFunction = plugins[4], ColorPicker = plugins[5],
                    ImageServiceParameters = plugins[6],
                    domConstruct = plugins[7],
                    dom = plugins[8], html = plugins[9], domStyle = plugins[10], connect = plugins[11], Color = plugins[12], Query = plugins[13],
                    QueryTask = plugins[14], Chart = plugins[15], Tooltip = plugins[16], theme = plugins[17], Magnify = plugins[18],
                    Draw = plugins[19], esriRequest = plugins[20], Polygon = plugins[21], SpatialReference = plugins[22],
                    registry = plugins[23], RasterLayer = plugins[24], PanelManager = plugins[25];
            var pm = PanelManager.getInstance();
            var clazz = declare([BaseWidget, _WidgetsInTemplateMixin], {
                templateString: template,
                name: 'Mask',
                baseClass: 'jimu-widget-Mask',
                flagValue: true,
                shareColor: {"Urban": [0, 128, 128], "NBR": [255, 109, 49], "NDWI": [64, 164, 223], "SAVI": [218, 165, 32], "NDVI": [124, 252, 0], "NDMI": [165, 242, 243], "Custom": [255, 102, 102]},
                extentChangeHandler: null,
                startup: function () {
                    this.inherited(arguments);
                    var headerCustom = domConstruct.toDom('<div id="minimizeButton" style="background-color: black; border-radius: 4px;height: 30px;width:30px;position: absolute;top:220px;left: 20px;display: none;"><a   id="maskMinimize" target="_blank"><img id="maskThumnail" src="widgets/Mask/images/change.gif" style="height: 20px;margin:5px;" alt="M" /></a></div>');
                    domConstruct.place(headerCustom, this.map.container);
                    domConstruct.place('<img id="loadingMask" style="position: absolute;top:0;bottom: 0;left: 0;right: 0;margin:auto;z-index:100;" src="' + require.toUrl('jimu') + '/images/loading.gif">', "maskDialog");
                    on(dom.byId("maskMinimize"), "click", lang.hitch(this, lang.hitch(this, function () {
                        domStyle.set("minimizeButton", "display", "none");
                        this.skipMaskFlag = true;
                        this.onOpen();
                        this.createHistogram(this.map.getLayer("resultLayer").renderingRule);
                    })));
                    this.hideLoading();
                    this.resizeMaskWidget();
                },
                resizeMaskWidget: function () {
                    if (window.innerWidth < 620) {
                        domStyle.set("maskDialog", "font-size", "7px");
                        domStyle.set("maskHistogram", "width", "180px");
                        domStyle.set("maskHistogram", "height", "92px");
                        domStyle.set("maskSlider", "width", "180px");
                        domStyle.set("resultOpacity", "width", "129px");
                    } else if (window.innerWidth < 850) {
                        domStyle.set("maskDialog", "font-size", "8px");
                        domStyle.set("maskHistogram", "width", "200px");
                        domStyle.set("maskHistogram", "height", "102px");
                        domStyle.set("maskSlider", "width", "200px");
                        domStyle.set("resultOpacity", "width", "142px");
                    } else {
                        domStyle.set("maskDialog", "font-size", "12px");
                        domStyle.set("maskHistogram", "width", "270px");
                        domStyle.set("maskHistogram", "height", "140px");
                        domStyle.set("maskSlider", "width", "270px");
                        domStyle.set("resultOpacity", "width", "180px");
                    }
                },
                postCreate: function () {
                    window.addEventListener("resize", lang.hitch(this, this.resizeMaskWidget));
                    registry.byId("indexList").on("change", lang.hitch(this, function (value) {

                        if (!this.shareMaskRange)
                            this.maskFunction(value);
                    }));
                    registry.byId("maskSlider").on("change", lang.hitch(this, this.redrawFunction));
                    registry.byId("resultOpacity").on("change", lang.hitch(this, function () {
                        this.maskLayer.setOpacity(1 - registry.byId("resultOpacity").get("value"));
                        if (registry.byId("resultOpacity").get("value") === 1)
                            this.maskLayer.hide();
                        else {
                            if (!this.maskLayer.visible)
                                this.maskLayer.show();
                        }
                    }));
                    registry.byId("maskDialog").on("hide", lang.hitch(this, function () {
                        if (registry.byId("markedAreas").checked)
                            this.toolbarAreas.deactivate();
                        if (!this.noMinimizeDisplay)
                            domStyle.set("minimizeButton", "display", "block");
                        else
                            this.noMinimizeDisplay = false;
                    }));
                    registry.byId("markedAreas").on("change", lang.hitch(this, function (value) {
                        if (value) {
                            this.polygons = new Polygon(new SpatialReference({wkid: 102100}));
                            this.toolbarAreas.activate(Draw.POLYGON);
                            if (document.getElementsByClassName("tooltip")) {

                                domStyle.set(document.getElementsByClassName("tooltip")[0], "visibility", "visible");
                            }
                            domStyle.set(registry.byId("clipMask").domNode, "display", "inline-block");
                            registry.byId("clipMask").set("disabled", true);
                        } else {
                            this.toolbarAreas.deactivate();
                            domStyle.set(registry.byId("clipMask").domNode, "display", "none");
                            for (var k = this.map.graphics.graphics.length - 1; k >= 0; k--)
                            {
                                if (this.map.graphics.graphics[k].geometry.type === "polygon") {
                                    if (this.map.graphics.graphics[k].symbol.color.r === 200)
                                    {
                                        this.map.graphics.remove(this.map.graphics.graphics[k]);

                                    }
                                }
                            }
                            this.polygons = null;
                            if (this.map.getLayer("resultLayer")) {
                                this.shareMaskRange = registry.byId("maskSlider").get("value");
                                this.maskFunction(registry.byId("indexList").get("value"));
                            }
                        }
                    }));
                    registry.byId("clipMask").on("click", lang.hitch(this, function (value) {
                        if (registry.byId("tooltipDialogIntro") && registry.byId("tooltipDialogIntro").state === "open" && registry.byId("tutorialStage").get("value") === "26") {

                            var y = document.getElementsByClassName("icon-node");
                            var tooltipTemp = registry.byId("tooltipDialogIntro");
                            popup.close(tooltipTemp);
                            tooltipTemp.set("content", "<p style='text-align:justify;'>The top layer can be saved on ArcGIS Online to reference later.<br /><span style='font-weight: bolder;color: orange;'>Click on <img src='./widgets/Save/images/icon.png' height='15' /></span> to save your mask layer.</p>");
                            popup.open({
                                popup: tooltipTemp,
                                orient: ["after-centered"],
                                around: y[6],
                            });
                            domStyle.set(tooltipTemp.connectorNode, "top", "0px");
                            y[6].style.pointerEvents = "auto";
                            y[2].style.pointerEvents = "none";
                            registry.byId("tutorialStage").set("value", "27");
                        }
                        registry.byId("clipMask").set("disabled", true);
                        this.shareMaskRange = registry.byId("maskSlider").get("value");
                        this.maskFunction(registry.byId("indexList").get("value"));
                    }));

                    this.map.on("update-start", lang.hitch(this, this.showLoading));
                    this.map.on("update-end", lang.hitch(this, this.hideLoading));

                    if (this.map.getLayer("primaryLayer")) {
                        this.map.getLayer("primaryLayer").on("update-end", lang.hitch(this, this.mosaicRuleApplied));
                    }
                    this.map.on("layer-add-result", lang.hitch(this, function (layer) {
                        if (!this.stateClosed) {
                            if (layer.layer.id === "resultLayer") {
                                this.maskLayer = this.map.getLayer("resultLayer");
                                this.maskLayer.setOpacity(1 - registry.byId("resultOpacity").get("value"));
                                if (registry.byId("resultOpacity").get("value") === 1)
                                    this.maskLayer.hide();
                                else {
                                    if (!this.maskLayer.visible)
                                        this.maskLayer.show();
                                }
                            } else if (layer.layer.id === "primaryLayer")
                                this.map.getLayer("primaryLayer").on("update-end", lang.hitch(this, this.mosaicRuleApplied));
                        }
                    }));
                    registry.byId("colorPalette").on("change", lang.hitch(this, function (value) {

                        this.color = (new Color(value)).toRgb();
                        if (this.chart)
                        {
                            this.chart.series[0].fill = this.color;
                            this.chart.series[0].stroke.color = this.color;
                            this.chart.updateSeries("Mask", this.dataIncrease);
                            this.chart.render();
                        }
                        registry.byId("savePropAccess").set("value", this.color);
                        if (this.map.getLayer("resultLayer"))
                            (this.map.getLayer("resultLayer")).redraw();
                        popup.close(registry.byId("colorDialog"));
                    }));

                    this.map.on("extent-change", lang.hitch(this, function (zoom) {
                        if (!this.stateClosed) {
                            var latitude = ((this.map.extent.getCenter()).getLatitude() * Math.PI) / 180;
                            this.scale = Math.pow((1 / Math.cos(latitude)), 2);

                            if (zoom.levelChange) {
                                var xdistance = this.map.extent.xmax - this.map.extent.xmin;
                                var ydistance = this.map.extent.ymax - this.map.extent.ymin;
                                this.pixelSizeX = xdistance / this.map.width;
                                this.pixelSizeY = ydistance / this.map.height;
                            }
                            if (this.map.getLayer("resultLayer")) {
                                this.createHistogram(this.map.getLayer("resultLayer").renderingRule);
                            }
                        }
                    }));
                    this.toolbarAreas = new Draw(this.map);
                    dojo.connect(this.toolbarAreas, "onDrawEnd", lang.hitch(this, this.addGraphic));
                },
                createHistogram: function (raster) {

                    if (this.chart) {
                        dojo.empty("maskHistogram");
                        this.chart = null;
                    }
                    if (this.polygons && this.polygons.rings.length > 0) {
                        var geometry = this.polygons;
                        var type = "esriGeometryPolygon";
                    } else {
                        var geometry = this.map.extent;
                        var type = "esriGeometryEnvelope";
                    }

                    var request = new esriRequest({
                        url: this.config.urlLandsatMS + "/computehistograms",
                        content: {
                            f: "json",
                            geometry: JSON.stringify(geometry.toJson()),
                            geometryType: type,
                            renderingRule: JSON.stringify(raster.toJson()),
                            pixelSize: '{"x":' + this.pixelSizeX + ', "y":' + this.pixelSizeY + '}'
                        },
                        handleAs: "json",
                        callbackParamName: "callback"
                    });
                    request.then(lang.hitch(this, function (result) {
                        if (result && result.histograms[0]) {
                            this.min = result.histograms[0].min;
                            this.max = result.histograms[0].max;
                            var chartData = result.histograms[0].counts;
                            this.value = [];
                            for (var a = 0; a < 256; a++) {
                                this.value.push({
                                    x: a,
                                    y: chartData[a]
                                });

                            }
                            var threshold = registry.byId("maskSlider").get("value");
                            var increaseLimit = parseInt(((threshold - this.min) / (this.max - this.min)) * 255);

                            this.dataIncrease = this.value.slice(increaseLimit, this.value.length);
                            if (!this.chart) {
                                this.chart = new Chart("maskHistogram");
                                this.chart.addPlot("default", {
                                    type: "Areas",
                                    markers: false,
                                    areas: true,
                                    tension: "S",
                                    color: "black",
                                    shadows: {dx: 4, dy: 4}
                                });

                                this.chart.setTheme(theme);

                                this.chart.addAxis("y", {vertical: true, fixLower: "none", fixUpper: "none", titleOrientation: "axis", minorLabels: false, microTicks: false, majorLabels: false, minorTicks: false, majorTicks: false, stroke: "white", majorTick: {color: "white"}});
                                this.chart.addAxis("x", {titleOrientation: "away", fixLower: "none", fixUpper: "none", minorLabels: false, microTicks: false, majorLabels: false, minorTicks: false, majorTicks: false, majorTick: {color: "white"}, stroke: "white"});
                                this.chart.addSeries("Mask", this.dataIncrease, {stroke: {color: this.color, width: 0.5}, fill: this.color});
                                //  this.chart.addSeries("Grey", [],{stroke: {color: "grey",width: 0.5},fill: "grey"});

                                this.magnify = new Magnify(this.chart, "default");
                                this.chart.render();
                            }
                        }
                    }));

                },
                mosaicRuleApplied: function (layer) {
                    if (!this.stateClosed) {
                        if (this.newLayer && layer.target.url === this.config.urlLandsatMS) {
                            if ((layer.target.mosaicRule !== this.newLayer.mosaicRule) || (layer.target.mosaicRule && this.newLayer.mosaicRule && layer.target.mosaicRule.method === this.newLayer.mosaicRule.method && this.newLayer.mosaicRule.method === "esriMosaicLockRaster" && layer.target.mosaicRule.lockRasterIds[0] !== this.newLayer.mosaicRule.lockRasterIds[0]))
                                this.newLayer.setMosaicRule(layer.target.mosaicRule);
                        } else {

                            if (layer.target.mosaicRule && this.newLayer && layer.target.mosaicRule.method === "esriMosaicLockRaster" && layer.target.mosaicRule.lockRasterIds[0] !== this.newLayer.mosaicRule.lockRasterIds[0])
                            {

                                var query2 = new Query();

                                query2.where = "GroupName = '" + registry.byId("primarySceneId").get("value") + "'";
                                query2.outFields = ["OBJECTID"];
                                query2.returnGeometry = false;

                                var queryTask2 = new QueryTask(this.config.urlLandsatMS);
                                queryTask2.execute(query2, lang.hitch(this, function (queryResult2) {
                                    var array = [];
                                    for (var a in queryResult2.features) {
                                        array[a] = queryResult2.features[a].attributes.OBJECTID;
                                    }
                                    this.mosaic = this.newLayer.mosaicRule;
                                    this.mosaic.lockRasterIds = array;
                                    this.newLayer.setMosaicRule(this.mosaic);
                                }));

                            }
                        }
                    }
                },
                addGraphic: function (geometry) {
                    registry.byId("clipMask").set("disabled", false);
                    var symbol = new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new Color([200, 0, 0]), 2);
                    var graphic = new esri.Graphic(geometry, symbol);
                    this.map.graphics.add(graphic);
                    this.polygons.addRing(geometry.rings[0]);
                },
                onOpen: function () {
                    this.stateClosed = false;

                    if (registry.byId("changeProp").get("value")) {
                        var propMask = registry.byId("changeProp").get("value").split(",");
                        this.shareMaskRange = parseFloat(propMask[1]);
                        registry.byId("indexList").set("value", propMask[0]);
                        //     registry.byId("maskSlider").set("value",parseFloat(propMask[1]));
                        registry.byId("changeProp").set("value", "");
                        this.color = this.shareColor[propMask[0]];
                    }
                    var x = document.getElementsByClassName("icon-node");
                    if (domClass.contains(x[3], "jimu-state-selected"))
                        x[3].click();
                    if (registry.byId("timeDialog") && registry.byId("timeDialog").open)
                        registry.byId("timeDialog").hide();
                    if (registry.byId("saveDialog") && registry.byId("saveDialog").open)
                        pm.closePanel("_20_panel");
                    if (domClass.contains(x[7], "jimu-state-selected"))
                        pm.closePanel("_19_panel");
                    if (registry.byId("chartDialog1") && registry.byId("chartDialog1").open)
                        pm.closePanel("widgets_Identify_Widget_14_panel");
                    if (domClass.contains(dom.byId("bandCombination"), "selected"))
                        dom.byId("bandCombination").click();
                    if (pm.getPanelById("_70_panel") && pm.getPanelById("_70_panel").state === "opened")
                        pm.closePanel("_70_panel");
                    if (pm.getPanelById("_22_panel") && pm.getPanelById("_22_panel").state === "opened")
                        pm.closePanel("_22_panel");
                    if (pm.getPanelById("_19_panel") && pm.getPanelById("_19_panel").state === "opened")
                        pm.closePanel("_19_panel");

                    registry.byId("maskDialog").show();
                    registry.byId("maskDialog").closeButtonNode.title = "Minimize";
                    domStyle.set("maskDialog", "top", "100px");
                    domStyle.set("maskDialog", "left", "160px");
                    domConstruct.destroy("maskDialog_underlay");
                    if (registry.byId("tooltipDialogIntro") && registry.byId("tooltipDialogIntro").state === "open" && registry.byId("tutorialStage").get("value") === "24") {
                        var y = document.getElementsByClassName("icon-node");
                        if (domClass.contains(y[1], "jimu-state-selected"))
                            y[1].click();
                        var tooltipTemp = registry.byId("tooltipDialogIntro");
                        popup.close(tooltipTemp);
                        tooltipTemp.set("content", "<p style='text-align:justify;'>You can use the mask slider to set the mask value (anything above the selected value will be masked). You can change the mask color by clicking <img src='./widgets/Mask/images/ColorPicker.png' height='15' />.</p><p style='text-align:justify;'>Try changing the mask and transparency sliders.</p><p style='text-align:justify;display:inline;'>When you're ready, <div id='continueComment' style='color:orange;display:inline;font-weight:bolder;cursor:pointer;'>click here to continue.</div></p>");  //
                        popup.open({
                            parent: registry.byId("maskDialog"),
                            popup: tooltipTemp,
                            orient: ["after-centered", "after"],
                            around: dom.byId("maskDialog"),
                            onClose: lang.hitch(this, function () {
                                domStyle.set(tooltipTemp._popupWrapper, "display", "block");
                            })
                        });
                        y[2].style.pointerEvents = "none";
                        domStyle.set(tooltipTemp.connectorNode, "top", "0px");
                        registry.byId("tutorialStage").set("value", "25");
                        on(dom.byId("continueComment"), "click", lang.hitch(this, function () {
                            tooltipTemp.set("content", "<p style='text-align:justify;'><span style='font-weight: bolder;color: orange;'>Check the box next to 'Define Areas Of Interest' and click on the map to draw a polygon.</span> Click <span style='color:orange;font-weight: bolder;'>Apply</span> to mask the area inside the polygon.</p>");
                            popup.open({
                                parent: registry.byId("maskDialog"),
                                popup: tooltipTemp,
                                orient: ["below"],
                                around: registry.byId("markedAreas").domNode,
                                onClose: lang.hitch(this, function () {
                                    domStyle.set(tooltipTemp._popupWrapper, "display", "block");
                                })

                            });
                            domStyle.set(tooltipTemp.connectorNode, "top", "0px");
                            registry.byId("tutorialStage").set("value", "26");
                        }));
                    }
                    if (!this.skipMaskFlag) {
                        var value = registry.byId("bandComboList").get("value");
                        if (this.shareMaskRange)
                            var mask = propMask[0];
                        else if (value === "Index")
                            var mask = "Custom";
                        else if (value === "Normalized Difference Moisture Index Colorized")
                            var mask = "NDMI";
                        else
                            var mask = "NDVI";
                        if (this.map.getLayer("primaryLayer").url === this.config.urlLandsatMS || (this.map.getLayer("primaryLayer").mosaicRule && this.map.getLayer("primaryLayer").mosaicRule.method !== "esriMosaicLockRaster")) {
                            setTimeout(lang.hitch(this, function () {
                                if (registry.byId("indexList").get("value") === mask)
                                    this.maskFunction(mask);
                                else
                                    this.maskFunction(registry.byId("indexList").get("value"));
                            }), 1000);
                        } else {

                            var query2 = new Query();
                            query2.where = "GroupName = '" + registry.byId("primarySceneId").get("value") + "'";
                            query2.outFields = ["OBJECTID"];
                            query2.returnGeometry = false;

                            var queryTask2 = new QueryTask(this.config.urlLandsatMS);
                            queryTask2.execute(query2, lang.hitch(this, function (queryResult2) {
                                this.array = [];
                                for (var a in queryResult2.features) {
                                    this.array[a] = queryResult2.features[a].attributes.OBJECTID;
                                }

                                setTimeout(lang.hitch(this, function () {
                                    if (registry.byId("indexList").get("value") === mask)
                                        this.maskFunction(mask);
                                    else
                                        this.maskFunction(registry.byId("indexList").get("value"));
                                }), 1000);
                            }));

                        }
                    } else
                        this.skipMaskFlag = false;
                    if (registry.byId("markedAreas").checked) {
                        this.toolbarAreas.activate(Draw.POLYGON);
                        if (document.getElementsByClassName("tooltip")) {

                            domStyle.set(document.getElementsByClassName("tooltip")[0], "visibility", "visible");
                        }
                    }
                },
                onClose: function () {
                    this.stateClosed = true;
                    if (this.chart) {
                        dojo.empty("maskHistogram");
                        this.chart = null;
                    }

                    registry.byId("markedAreas").set("checked", false);
                    if (registry.byId("maskDialog").open) {
                        this.noMinimizeDisplay = true;
                        registry.byId("maskDialog").hide("hide");
                    }
                    domStyle.set("minimizeButton", "display", "none");
                    if (this.extentChangeHandler) {
                        this.extentChangeHandler.remove();
                        this.extentChangeHandler = null;
                    }
                    if (this.map.getLayer("resultLayer")) {
                        if (this.map.getLayer("resultLayer").updating) {
                            this.map.getLayer("resultLayer").suspend();
                        }
                        this.map.removeLayer(this.map.getLayer("resultLayer"));
                    }
                    registry.byId("changeMaskDetect").set("value", "");
                    this.hideLoading();

                },
                redrawFunction: function (value) {
                    html.set(this.maskSliderValue, "[" + value.toFixed(2) + " to 1.00]");
                    if (this.chart) {
                        var threshold = registry.byId("maskSlider").get("value");
                        var increaseLimit = parseInt(((threshold - this.min) / (this.max - this.min)) * 255);
                        if (increaseLimit < 0)
                            this.dataIncrease = this.value;
                        else
                            this.dataIncrease = this.value.slice(increaseLimit, this.value.length);

                        // if(threshold <= this.max && threshold >= this.min)
                        this.chart.updateSeries("Mask", this.dataIncrease);
                        this.chart.render();
                    }
                    if (this.sliderErrorFlag)
                        this.newLayer.redraw();
                    else
                        this.sliderErrorFlag = true;
                },
                maskFunction: function (value) {
                    this.sliderErrorFlag = false;
                    if (value === "Custom") {
                        var A = "B" + (parseInt(registry.byId("bandA").get("value"))).toString();
                        var B = "B" + (parseInt(registry.byId("bandB").get("value"))).toString();

                        if (this.shareMaskRange) {
                            registry.byId("maskSlider").set("value", this.shareMaskRange);
                            this.shareMaskRange = null;
                        } else {
                            registry.byId("maskSlider").set("value", 0);
                            this.color = [255, 102, 102];
                        }
                    } else if (value === "NDMI") {
                        var A = "B5";
                        var B = "B6";

                        if (this.shareMaskRange) {
                            registry.byId("maskSlider").set("value", this.shareMaskRange);
                            this.shareMaskRange = null;
                        } else {
                            this.color = [165, 242, 243];
                            registry.byId("maskSlider").set("value", 0.5);
                        }
                    } else if (value === "NDVI") {
                        var A = "B5";
                        var B = "B4";

                        if (this.shareMaskRange) {
                            registry.byId("maskSlider").set("value", this.shareMaskRange);
                            this.shareMaskRange = null;
                        } else {
                            this.color = [124, 252, 0];
                            registry.byId("maskSlider").set("value", 0.5);
                        }
                    } else if (value === "SAVI") {
                        var A = "B5";
                        var B = "B4";

                        if (this.shareMaskRange) {
                            registry.byId("maskSlider").set("value", this.shareMaskRange);
                            this.shareMaskRange = null;
                        } else {
                            this.color = [218, 165, 32];
                            registry.byId("maskSlider").set("value", 0.5);
                        }
                    } else if (value === "NDWI") {
                        var A = "B3";
                        var B = "B6";

                        if (this.shareMaskRange) {
                            registry.byId("maskSlider").set("value", this.shareMaskRange);
                            this.shareMaskRange = null;
                        } else {
                            this.color = [64, 164, 223];
                            registry.byId("maskSlider").set("value", 0.5);
                        }
                    } else if (value === "NBR") {
                        var A = "B7";
                        var B = "B5";

                        if (this.shareMaskRange) {
                            registry.byId("maskSlider").set("value", this.shareMaskRange);
                            this.shareMaskRange = null;
                        } else {
                            this.color = [255, 109, 49];
                            registry.byId("maskSlider").set("value", 0);
                        }
                    } else if (value === "Urban") {
                        var A = "B6";
                        var B = "B5";

                        if (this.shareMaskRange) {
                            registry.byId("maskSlider").set("value", this.shareMaskRange);
                            this.shareMaskRange = null;
                        } else {
                            this.color = [0, 128, 128];
                            registry.byId("maskSlider").set("value", -0.3);
                        }
                    }

                    registry.byId("savePropAccess").set("value", this.color);
                    if (registry.byId("Scale").get("value") && value === "Custom")
                        var S = parseInt(registry.byId("Scale").get("value"));
                    else
                        var S = 1;
                    if (registry.byId("OffsetValue").get("value") && value === "Custom")
                        var O = parseInt(registry.byId("OffsetValue").get("value"));
                    else
                        var O = 0;

                    var raster = new RasterFunction();
                    raster.functionName = "BandArithmetic";
                    raster.outputPixelType = "F32";
                    var args = {};
                    args.Method = 0;
                    if (value === "SAVI")
                        args.BandIndexes = O + "+" + "(" + S + "*" + "(1.5*((" + A + "-" + B + ")/(" + A + "+" + B + " +5000))))";
                    else
                        args.BandIndexes = O + "+" + "(" + S + "*" + "((" + A + "-" + B + ")/(" + A + "+" + B + ")))";
                    raster.functionArguments = args;


                    if (value === "Urban") {
                        var rasterNDVI = new RasterFunction();
                        rasterNDVI.functionName = "BandArithmetic";
                        rasterNDVI.outputPixelType = "F32";
                        var argNDVI = {};
                        argNDVI.BandIndexes = "(B5 - B4)/(B5 + B4)";
                        argNDVI.Method = 0;
                        rasterNDVI.functionArguments = argNDVI;

                        var rasterNDWI = new RasterFunction();
                        rasterNDWI.functionName = "BandArithmetic";
                        rasterNDWI.outputPixelType = "F32";
                        var argNDWI = {};
                        argNDWI.BandIndexes = "(B3 - B6)/(B3 + B6)";
                        argNDWI.Method = 0;
                        rasterNDWI.functionArguments = argNDWI;

                        var maskNDVI = new RasterFunction();
                        maskNDVI.functionName = "Remap";
                        maskNDVI.outputPixelType = "F32";
                        var argMask1 = {};
                        argMask1.InputRanges = [-1, 0.5];
                        argMask1.OutputValues = [1];
                        argMask1.NoDataRanges = [0.5, 1];
                        argMask1.AllowUnmatched = true;
                        argMask1.Raster = rasterNDVI;
                        maskNDVI.functionArguments = argMask1;

                        var maskNDWI = new RasterFunction();
                        maskNDWI.functionName = "Remap";
                        maskNDWI.outputPixelType = "F32";
                        var argMask2 = {};
                        argMask2.InputRanges = [-1, 0.1];
                        argMask2.OutputValues = [1];
                        argMask2.NoDataRanges = [0.1, 1];
                        argMask2.AllowUnmatched = true;
                        argMask2.Raster = rasterNDWI;
                        maskNDWI.functionArguments = argMask2;

                        var maskUrban = new RasterFunction();
                        maskUrban.functionName = "Remap";
                        maskUrban.outputPixelType = "F32";
                        var argMaskUrban = {};
                        argMaskUrban.NoDataRanges = [0.04, 1];
                        argMaskUrban.AllowUnmatched = true;
                        argMaskUrban.Raster = raster;
                        maskUrban.functionArguments = argMaskUrban;

                        var arithmetic = new RasterFunction();
                        arithmetic.functionName = "Arithmetic";
                        arithmetic.outputPixelType = "F32";
                        var arith = {};
                        arith.Raster = maskNDVI;
                        arith.Raster2 = maskNDWI;
                        arith.Operation = 3;
                        arith.ExtentType = 1;
                        arith.CellsizeType = 0;
                        arithmetic.functionArguments = arith;
                        var arithmetic1 = new RasterFunction();
                        arithmetic1.functionName = "Arithmetic";
                        arithmetic1.outputPixelType = "F32";
                        var arith1 = {};
                        arith1.Raster = maskUrban;
                        arith1.Raster2 = arithmetic;
                        arith1.Operation = 3;
                        arith1.ExtentType = 1;
                        arith1.CellsizeType = 0;
                        arithmetic1.functionArguments = arith1;
                    }
                    if (registry.byId("markedAreas").checked && this.polygons && this.polygons.rings.length > 0) {
                        var rasterClip = new RasterFunction();
                        rasterClip.functionName = "Clip";
                        rasterClip.outputPixelType = "F32";
                        var clipArguments = {};
                        clipArguments.ClippingGeometry = this.polygons;
                        clipArguments.ClippingType = 1;
                        if (value === "Urban")
                            clipArguments.Raster = arithmetic1;
                        else
                            clipArguments.Raster = raster;
                        rasterClip.functionArguments = clipArguments;
                        raster = rasterClip;
                    }
                    var xdistance = this.map.extent.xmax - this.map.extent.xmin;
                    var ydistance = this.map.extent.ymax - this.map.extent.ymin;
                    this.pixelSizeX = xdistance / this.map.width;
                    this.pixelSizeY = ydistance / this.map.height;
                    var latitude = ((this.map.extent.getCenter()).getLatitude() * Math.PI) / 180;
                    this.scale = Math.pow((1 / Math.cos(latitude)), 2);

                    var params = new ImageServiceParameters();
                    params.renderingRule = raster;
                    if (this.map.getLayer("resultLayer") && registry.byId("changeMaskDetect").get("value") === "mask") {
                        this.map.getLayer("resultLayer").setRenderingRule(params.renderingRule);
                    } else {
                        var layer = this.map.getLayer("primaryLayer");
                        if (layer && layer.mosaicRule) {
                            params.mosaicRule = layer.mosaicRule;

                            if (this.config.urlLandsatMS !== layer.url && layer.mosaicRule.method === "esriMosaicLockRaster")
                                params.mosaicRule.lockRasterIds = this.array;

                        }
                        params.format = "lerc";

                        this.newLayer = new RasterLayer(this.config.urlLandsatMS, {
                            imageServiceParameters: params,
                            visible: true,
                            id: "resultLayer",
                            pixelFilter: lang.hitch(this, this.maskPixels)
                        });

                        this.newLayer.on("load", lang.hitch(this, function () {
                            this.newLayer.pixelType = "F32";
                        }));
                        if (this.map.getLayer("resultLayer")) {
                            this.map.getLayer("resultLayer").suspend();
                            this.map.removeLayer(this.map.getLayer("resultLayer"));
                        }
                        if (this.map.getLayer("secondaryLayer"))
                            this.map.addLayer(this.newLayer, 3);
                        else
                            this.map.addLayer(this.newLayer, 2);
                    }
                    registry.byId("changeMaskDetect").set("value", "mask");
                    this.createHistogram(params.renderingRule);
                },
                maskPixels: function (pixelData) {

                    if (pixelData === null || pixelData.pixelBlock === null) {

                        return;
                    }
                    if (pixelData && pixelData.pixelBlock && pixelData.pixelBlock.pixels === null)
                        return;
                    var p1 = pixelData.pixelBlock.pixels[0];
                    if (!pixelData.pixelBlock.mask) {
                        pixelData.pixelBlock.mask = new Uint8Array(p1.length);
                    }

                    var pr = new Uint8Array(p1.length);
                    var pg = new Uint8Array(p1.length);
                    var pb = new Uint8Array(p1.length);

                    var area = 0;
                    var numPixels = pixelData.pixelBlock.width * pixelData.pixelBlock.height;

                    var maskRangeValue = registry.byId("maskSlider").get("value");
                    for (var i = 0; i < numPixels; i++) {
                        if (p1[i] >= parseFloat(maskRangeValue))
                        {
                            pixelData.pixelBlock.mask[i] = 1;
                            pr[i] = this.color[0];
                            pg[i] = this.color[1];
                            pb[i] = this.color[2];
                            area++;
                        } else
                            pixelData.pixelBlock.mask[i] = 0;
                    }
                    pixelData.pixelBlock.pixels = [pr, pg, pb];

                    pixelData.pixelBlock.pixelType = "U8";
                    dom.byId("maskArea").innerHTML = "&nbsp;&nbsp;" + ((area * this.pixelSizeX * this.pixelSizeY) / (1000000 * this.scale)).toFixed(3) + " sq. km";

                },
                showLoading: function () {
                    if (dom.byId("loadingMask"))
                        domStyle.set("loadingMask", "display", "block");

                },
                hideLoading: function () {
                    if (dom.byId("loadingMask"))
                        domStyle.set("loadingMask", "display", "none");
                }
            });
            clazz.hasLocale = false;
            return clazz;
        });
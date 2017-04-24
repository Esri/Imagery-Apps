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
    'jimu/BaseWidget',
    "./resourceLoad.js",
],
        function (
                declare,
                _WidgetsInTemplateMixin,
                template,
                BaseWidget, resourceLoad

                ) {
            var resource = new resourceLoad({resource: "change"});
            var plugins = resource.load("change");
            var on = plugins[0],
                    lang = plugins[1],
                    domClass = plugins[2],
                    RasterFunction = plugins[3],
                    ArcGISImageServiceLayer = plugins[4],
                    ImageServiceParameters = plugins[5],
                    Tooltip = plugins[6], locale = plugins[7],
                    domConstruct = plugins[8],
                    dom = plugins[9], html = plugins[10], domStyle = plugins[11], connect = plugins[12], SpatialReference = plugins[13],
                    HorizontalRule = plugins[14], HorizontalRuleLabels = plugins[15], esriRequest = plugins[16], popup = plugins[17], Query = plugins[18],
                    QueryTask = plugins[19], Draw = plugins[20], Polygon = plugins[21], Chart = plugins[22], theme = plugins[23], Magnify = plugins[24], registry = plugins[25],
                    Color = plugins[26], RasterLayer = plugins[27], PanelManager = plugins[28];
            var pm = PanelManager.getInstance();
            var clazz = declare([BaseWidget, _WidgetsInTemplateMixin], {
                templateString: template,
                name: 'ChangeDetection',
                baseClass: 'jimu-widget-ChangeDetection',
                rasterfn: null,
                url: null,
                _selectedRadio: null,
                time: null,
                layerflag: true,
                featuresid: null,
                ids: [],
                mr: null,
                saveprevlayer: null,
                appExtent: null,
                appRenderer: null,
                appMosaicRule: null,
                flagvalue: true,
                changeDetectionLayer: null,
                primaryLayer: null,
                previousChangeValue: null,
                changeIndexFlag: false,
                polygons: null,
                primaryScene: null,
                secondaryScene: null,
                startup: function () {
                    this.inherited(arguments);
                    var headerCustom = domConstruct.toDom('<div id="minimizeChange" style="background-color: black;height:30px;width:30px;border-radius: 4px;position: absolute;top:220px;left: 20px;display: none;"><a   id="changeMinimize" target="_blank"><img id="changeThumnail" src="widgets/ChangeDetection/images/change.gif" style="height: 20px;margin:5px;margin-top:4px;" alt="C" /></a></div>');
                    domConstruct.place(headerCustom, this.map.container);
                    domConstruct.place('<img id="loadingChange" style="position: absolute;top:0;bottom: 0;left: 0;right: 0;margin:auto;z-index:100;" src="' + require.toUrl('jimu') + '/images/loading.gif">', "changeDetectionDialog");
                    on(dom.byId("changeMinimize"), "click", lang.hitch(this, lang.hitch(this, function () {
                        domStyle.set("minimizeChange", "display", "none");
                        this.skipChangeFlag = true;
                        this.onOpen();
                        this.createHistogram(this.map.getLayer("resultLayer").renderingRule);
                    })));
                    this.hideLoading();
                    this.resizeChangeWidget();
                },
                resizeChangeWidget: function () {
                    if (window.innerWidth < 620) {
                        domStyle.set("changeDetectionDialog", "font-size", "7px");
                        domStyle.set("histogram", "width", "180px");
                        domStyle.set("histogram", "height", "92px");
                        domStyle.set("horiSliderInclusion", "width", "160px");
                        domStyle.set("horiSliderDecrease", "width", "160px");
                        domStyle.set("horiSliderRight", "width", "160px");
                        domStyle.set("primaryOpacity", "width", "142px");
                    } else if (window.innerWidth < 850) {
                        domStyle.set("changeDetectionDialog", "font-size", "8px");
                        domStyle.set("histogram", "width", "200px");
                        domStyle.set("histogram", "height", "102px");
                        domStyle.set("horiSliderInclusion", "width", "170px");
                        domStyle.set("horiSliderDecrease", "width", "170px");
                        domStyle.set("horiSliderRight", "width", "170px");
                        domStyle.set("primaryOpacity", "width", "152px");
                    } else if (window.innerWidth < 1200) {
                        domStyle.set("changeDetectionDialog", "font-size", "9px");
                    } else {
                        domStyle.set("changeDetectionDialog", "font-size", "12px");
                        domStyle.set("histogram", "width", "275px");
                        domStyle.set("histogram", "height", "140px");
                        domStyle.set("horiSliderInclusion", "width", "180px");
                        domStyle.set("horiSliderDecrease", "width", "180px");
                        domStyle.set("horiSliderRight", "width", "180px");
                        domStyle.set("primaryOpacity", "width", "180px");
                    }
                },
                postCreate: function () {
                    window.addEventListener("resize", lang.hitch(this, this.resizeChangeWidget));
                    registry.byId("changeMode").on("change", lang.hitch(this, function (value) {
                        var g = document.querySelectorAll("#horiSliderInclusion .dijitSliderRemainingBarH");
                        if (value !== "Image") {


                            if (value === "threshold") {
                                g[0].style.borderColor = "#b5bcc7";
                                g[0].style.backgroundColor = "#fff";
                                html.set(this.changeLabel, "Threshold");
                                domStyle.set(dom.byId("differenceMode"), "display", "none");
                                domStyle.set(dom.byId("thresholdMode"), "display", "block");

                            } else {
                                g[0].style.borderColor = "lightskyblue";
                                g[0].style.backgroundColor = "#0080C0";
                                html.set(this.changeLabel, "Positive");
                                domStyle.set(dom.byId("differenceMode"), "display", "block");
                                domStyle.set(dom.byId("thresholdMode"), "display", "none");
                            }
                            domStyle.set("modeDisplay", "display", "block");
                        } else {
                            domStyle.set("modeDisplay", "display", "none");
                        }
                        if (registry.byId("tooltipDialogIntro") && registry.byId("tooltipDialogIntro").state === "open") {
                            var tutorialStage = registry.byId("tutorialStage").get("value");
                            var tooltipTemp = registry.byId("tooltipDialogIntro");

                            popup.close(tooltipTemp);
                            if (tutorialStage === "21" && value === "threshold") {
                                tooltipTemp.set("content", "<p style='text-align:justify;'>In <span style='color:orange;font-weight:bolder;'>Threshold Mask</span> mode, the user sets a threshold for what counts as change. The app will only identify change from below the user-set threshold to above the threshold, or vice versa. You can also set the minimum magnitude of the change you want to detect (for example, detect only changes in NDVI bigger than 0.1).<br />Try selecting the <span style='font-weight: bolder;color: orange;'>Water Index</span> from the <span style='color:orange;font-weight:bolder;'>'Change in'</span> dropdown list.</p>");
                                registry.byId("tutorialStage").set("value", "22");
                            } else if (tutorialStage === "19" && value === "difference")
                            {
                                tooltipTemp.set("content", "<p style='text-align:justify;'>The <span style='color:orange;font-weight:bolder;'>Difference Mask</span> mode also calculates the difference between the two images. However, you can use the <span style='color:orange;font-weight:bolder;'>difference sliders</span> to adjust how big the change between two images has to be in order to show up in green or magenta. The <span style='color:orange;font-weight:bolder;'>transparency slider</span> sets the opacity of the change layer. And <span style='color:orange;font-weight:bolder;'>Define Area Of Interest</span> allows the user to draw and calculate change for a custom area of interest.</p><p style='text-align:justify;'>Try changing the <span style='font-weight: bolder;color: orange;'>Difference Mask parameters.</span></p>When you're done, <div id='continueComment' style='display:inline;color:orange;font-weight:bolder;cursor:pointer;'>click here to continue.</div>");
                                registry.byId("tutorialStage").set("value", "20");
                                on(dom.byId("continueComment"), "click", lang.hitch(this, this.continueTutorial, "20"));
                            }
                            if (tutorialStage === "20" || "22") {
                                popup.open({
                                    parent: registry.byId("changeDetectionDialog"),
                                    popup: tooltipTemp,
                                    orient: ["after-centered", "after"],
                                    around: dom.byId("changeMode"),
                                    onClose: lang.hitch(this, function () {
                                        domStyle.set(tooltipTemp._popupWrapper, "display", "block");
                                    })
                                });

                                domStyle.set(tooltipTemp.connectorNode, "top", "0px");
                            }

                        }
                        if (!this.changeIndexFlag) {

                            this.changeModeFlag = true;
                            this.refreshChange();
                        }
                    }));
                    registry.byId("changeDetectionDialog").on("hide", lang.hitch(this, function () {
                        if (!this.noMinimizeDisplay)
                            domStyle.set("minimizeChange", "display", "block");
                        else
                            this.noMinimizeDisplay = false;
                    }));
                    registry.byId("primaryOpacity").on("change", lang.hitch(this, function () {
                        this.compareLayer.setOpacity(1 - registry.byId("primaryOpacity").get("value"));
                        if (registry.byId("primaryOpacity").get("value") === 1)
                            this.compareLayer.hide();
                        else {
                            if (!this.compareLayer.visible)
                                this.compareLayer.show();
                        }
                    }));
                    registry.byId("changeOptions").on("change", lang.hitch(this, function (value) {

                        if (!this.changeIndexFlag) {
                            if (registry.byId("tooltipDialogIntro") && registry.byId("tooltipDialogIntro").state === "open" && value === "NDWI") {

                                var y = document.getElementsByClassName("icon-node");
                                var tooltipTemp = registry.byId("tooltipDialogIntro");
                                popup.close(tooltipTemp);
                                var tutorialStage = registry.byId("tutorialStage").get("value");
                                if (tutorialStage === "22") {

                                    tooltipTemp.set("content", "<p style='text-align:justify;'>Try changing the <span style='color:orange;font-weight:bolder;'>Threshold Mask parameters.</span></p>When you're done, <div id='continueComment' style='display:inline;cursor:pointer;color:orange;font-weight:bolder;'>click here to continue.</div>");
                                    popup.open({
                                        parent: registry.byId("changeDetectionDialog"),
                                        popup: tooltipTemp,
                                        orient: ["after-centered"],
                                        around: registry.byId("changeMode").domNode,
                                        onClose: lang.hitch(this, function () {
                                            domStyle.set(tooltipTemp._popupWrapper, "display", "block");
                                        })
                                    });

                                    registry.byId("tutorialStage").set("value", "23");
                                    on(dom.byId("continueComment"), "click", lang.hitch(this, this.continueTutorial, "23"));

                                }

                                domStyle.set(tooltipTemp.connectorNode, "top", "0px");
                            }
                            this.changeModeFlag = true;
                            this.refreshChange();
                        }
                    }));
                    registry.byId("horiSliderInclusion").on("change", lang.hitch(this, function (value) {
                        if (this.chart) {
                            var threshold = registry.byId("horiSliderInclusion").get("value");
                            var thresholdDecrease = registry.byId("horiSliderDecrease").get("value");
                            var increaseLimit = parseInt(((threshold - this.min) / (this.max - this.min)) * 255);
                            var decreaseLimit = parseInt(((thresholdDecrease - this.min) / (this.max - this.min)) * 255);
                            increaseLimit = increaseLimit > 255 ? 255 : increaseLimit;
                            decreaseLimit = decreaseLimit < 0 ? 0 : decreaseLimit;
                            var xData = lang.clone(this.value);
                            var dataDecrease = xData.slice(0, decreaseLimit + 1);
                            var dataIncrease = xData.slice(increaseLimit, this.value.length);
                            var greyData = xData.slice(decreaseLimit + 1, increaseLimit);
                            var datasort = lang.clone(dataDecrease);
                            datasort.sort(function (a, b) {
                                return b.y - a.y;
                            });
                            var datasort2 = lang.clone(dataIncrease);
                            datasort2.sort(function (a, b) {
                                return b.y - a.y;
                            });
                            if (datasort[0].y > datasort2[0].y)
                            {
                                for (var a in greyData) {
                                    if (greyData[a].y > datasort[0].y)
                                        greyData[a].y = datasort[0].y;
                                }
                            } else {
                                for (var a in greyData) {
                                    if (greyData[a].y > datasort2[0].y)
                                        greyData[a].y = datasort2[0].y;
                                }
                            }

                            // if (threshold <= this.max) {
                            this.chart.updateSeries("Increase", dataIncrease);
                            this.chart.updateSeries("Grey", greyData);
                            //  }
                            this.chart.render();
                        }

                        html.set(this.inclusionThreshold, " <b style='color: #0080C0;'>[" + parseFloat(value).toFixed(2) + "]</b>");

                        if (this.changeDetectionLayer && !this.skipRedrawLayer) {
                            this.changeDetectionLayer.redraw();
                        } else
                            this.skipRedrawLayer = false;

                    }));
                    registry.byId("horiSliderRight").on("change", lang.hitch(this, function (value) {
                        html.set(this.changeTolerance, "[<b>" + parseFloat(value).toFixed(2) + "</b>]");
                        if (this.changeDetectionLayer && !this.skipRedrawLayer) {
                            this.changeDetectionLayer.redraw();
                        }


                    }));
                    registry.byId("horiSliderDecrease").on("change", lang.hitch(this, function (value) {
                        if (this.chart) {
                            var threshold = registry.byId("horiSliderInclusion").get("value");
                            var thresholdDecrease = registry.byId("horiSliderDecrease").get("value");
                            var decreaseLimit = parseInt(((thresholdDecrease - this.min) / (this.max - this.min)) * 255);
                            var increaseLimit = parseInt(((threshold - this.min) / (this.max - this.min)) * 255);
                            increaseLimit = increaseLimit > 255 ? 255 : increaseLimit;
                            decreaseLimit = decreaseLimit < 0 ? 0 : decreaseLimit;
                            var xData = lang.clone(this.value);
                            var dataDecrease = xData.slice(0, decreaseLimit + 1);
                            var dataIncrease = xData.slice(increaseLimit, this.value.length);
                            var greyData = xData.slice(decreaseLimit + 1, increaseLimit);
                            var datasort = lang.clone(dataDecrease);
                            datasort.sort(function (a, b) {
                                return b.y - a.y;
                            });
                            var datasort2 = lang.clone(dataIncrease);
                            datasort2.sort(function (a, b) {
                                return b.y - a.y;
                            });
                            if (datasort[0].y > datasort2[0].y)
                            {
                                for (var a in greyData) {
                                    if (greyData[a].y > datasort[0].y)
                                        greyData[a].y = datasort[0].y;
                                }
                            } else {
                                for (var a in greyData) {
                                    if (greyData[a].y > datasort2[0].y)
                                        greyData[a].y = datasort2[0].y;
                                }
                            }


                            //if (thresholdDecrease >= this.min) {
                            this.chart.updateSeries("Decrease", dataDecrease);
                            this.chart.updateSeries("Grey", greyData);
                            // }

                            this.chart.render();
                        }

                        html.set(this.negativeDiff, "[<b>" + parseFloat(value).toFixed(2) + "</b>]");
                        if (this.changeDetectionLayer && !this.skipRedrawLayer) {
                            this.changeDetectionLayer.redraw();
                        }
                    }));
                    registry.byId("markedChangeAreas").on("change", lang.hitch(this, function (value) {
                        if (value) {
                            this.polygons = new Polygon(new SpatialReference({wkid: 102100}));
                            this.toolbarChangeAreas.activate(Draw.POLYGON);
                            domStyle.set(registry.byId("clipChange").domNode, "display", "inline-block");
                            registry.byId("clipChange").set("disabled", true);
                        } else {
                            this.toolbarChangeAreas.deactivate();
                            domStyle.set(registry.byId("clipChange").domNode, "display", "none");
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
                                this.changeIndexFlag = true;
                                this.doChange();
                            }
                        }
                    }));
                    registry.byId("clipChange").on("click", lang.hitch(this, function () {
                        if (this.map.getLayer("resultLayer")) {
                            var rasterClip = new RasterFunction();
                            rasterClip.functionName = "Clip";
                            if (registry.byId("changeMode").get("value") !== "Image")
                                rasterClip.outputPixelType = "F32";
                            else
                                rasterClip.outputPixelType = "U8";
                            var clipArguments = {};
                            clipArguments.ClippingGeometry = this.polygons;
                            clipArguments.ClippingType = 1;
                            var renderLayer = this.map.getLayer("resultLayer").renderingRule;

                            clipArguments.Raster = renderLayer.functionName === "Clip" ? renderLayer.functionArguments.Raster : renderLayer;
                            rasterClip.functionArguments = clipArguments;
                            this.map.getLayer("resultLayer").setRenderingRule(rasterClip);
                        } else {
                            this.changeModeFlag = true;
                            this.refreshChange();
                        }
                        registry.byId("clipChange").set("disabled", true);
                    }));

                    this.map.on("update-start", lang.hitch(this, this.showLoading));
                    this.map.on("update-end", lang.hitch(this, this.hideLoading));

                    this.map.on("layer-add-result", lang.hitch(this, function (layer) {
                        if (!this.stateClosed) {
                            if (layer.layer.id === "resultLayer") {
                                this.compareLayer = this.map.getLayer("resultLayer");
                                this.compareLayer.setOpacity(1 - registry.byId("primaryOpacity").get("value"));
                                if (registry.byId("primaryOpacity").get("value") === 1)
                                    this.compareLayer.hide();
                                else {
                                    if (!this.compareLayer.visible)
                                        this.compareLayer.show();
                                }
                            }
                        }
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
                    this.toolbarChangeAreas = new Draw(this.map);
                    dojo.connect(this.toolbarChangeAreas, "onDrawEnd", lang.hitch(this, this.addGraphic));

                }, addGraphic: function (geometry) {
                    registry.byId("clipChange").set("disabled", false);
                    var symbol = new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new Color([200, 0, 0]), 2);
                    var graphic = new esri.Graphic(geometry, symbol);
                    this.map.graphics.add(graphic);
                    this.polygons.addRing(geometry.rings[0]);
                },
                continueTutorial: function (value) {
                    var tooltipTemp = registry.byId("tooltipDialogIntro");
                    var tutorialStage = registry.byId("tutorialStage");
                    if (value === "23") {
                        var y = document.getElementsByClassName("icon-node");
                        tooltipTemp.set("content", "<p style='text-align:justify;'>The <span style='color:orange;font-weight:bolder;'>Mask</span> tool creates a masked layer based on the index selected.<br/><span style='font-weight: bolder;color: orange;'>Click on <img src='./widgets/Mask/images/change.gif' height='15'/></span> to build a mask.</p>");
                        tutorialStage.set("value", "24");
                        y[2].style.pointerEvents = "auto";
                        y[3].style.pointerEvents = "none";

                    } else if (value === "18") {
                        tooltipTemp.set("content", "<p style='text-align:justify;'><span style='color:orange;font-weight:bolder;'>Difference Image</span> mode illustrates all the changes in the selected index between the two dates-increases are shown in green, and decreases are shown in magenta. <br/> Now select the<span style='font-weight: bolder;color: orange;'>'Difference Mask'</span> option from the mode list.</p>");
                        tutorialStage.set("value", "19");
                    } else if (value === "20") {
                        tooltipTemp.set("content", "<p style='text-align:justify;'>Select the <span style='color:orange;font-weight:bolder;'>'Threshold Mask'</span> option from the mode list.</p>");
                        tutorialStage.set("value", "21");
                    }
                    popup.open({
                        parent: (tutorialStage.get("value") === "24") ? "" : registry.byId("changeDetectionDialog"),
                        popup: tooltipTemp,
                        orient: ["after-centered"],
                        around: (tutorialStage.get("value") === "24") ? y[2] : dom.byId("changeMode"),
                        onClose: lang.hitch(this, function () {
                            domStyle.set(tooltipTemp._popupWrapper, "display", "block");
                        })
                    });

                    domStyle.set(tooltipTemp.connectorNode, "top", "0px");
                },
                onOpen: function () {
                    this.stateClosed = false;

                    var x = document.getElementsByClassName("icon-node");
                    if (registry.byId("saveDialog") && registry.byId("saveDialog").open)
                        pm.closePanel("_20_panel");
                    if (registry.byId("timeDialog") && registry.byId("timeDialog").open)
                        registry.byId("timeDialog").hide();
                    if (this.exportOpenFlag === "open")
                        pm.closePanel("_19_panel");
                    if (domClass.contains(x[4], "jimu-state-selected")) {

                        pm.closePanel("widgets_Identify_Widget_14_panel");
                    }
                    if (domClass.contains(dom.byId("bandCombination"), "selected"))
                        dom.byId("bandCombination").click();
                    if (pm.getPanelById("_70_panel") && pm.getPanelById("_70_panel").state === "opened")
                        pm.closePanel("_70_panel");
                    if (pm.getPanelById("_22_panel") && pm.getPanelById("_22_panel").state === "opened")
                        pm.closePanel("_22_panel");
                    if (pm.getPanelById("_16_panel") && pm.getPanelById("_16_panel").state === "opened")
                        pm.closePanel("_16_panel");
                    if (pm.getPanelById("_19_panel") && pm.getPanelById("_19_panel").state === "opened")
                        pm.closePanel("_19_panel");

                    if (domClass.contains(x[2], "jimu-state-selected"))
                        x[2].click();
                    if (registry.byId("changeProp").get("value")) {
                        this.changeIndexFlag = true;
                        this.skipRedrawLayer = true;
                        var temp = registry.byId("changeProp").get("value").split(",");
                        registry.byId("changeMode").set("value", temp[2]);
                        registry.byId("changeOptions").set("value", temp[0]);

                        registry.byId("horiSliderRight").set("value", parseFloat(temp[4]));

                        registry.byId("horiSliderDecrease").set("value", parseFloat(temp[3]));
                        registry.byId("horiSliderInclusion").set("value", parseFloat(temp[1]));
                        registry.byId("changeProp").set("value", "");
                    }
                    if (!this.skipChangeFlag)
                        this.refreshChange();
                    else
                        this.skipChangeFlag = false;
                    this.changeHandler = this.map.on("update-end", lang.hitch(this, this.refreshChange));
                    registry.byId("changeDetectionDialog").show();
                    registry.byId("changeDetectionDialog").closeButtonNode.title = "Minimize";
                    domStyle.set("changeDetectionDialog", "top", "100px");
                    domStyle.set("changeDetectionDialog", "left", "160px");
                    domConstruct.destroy("changeDetectionDialog_underlay");
                    if (registry.byId("tooltipDialogIntro") && registry.byId("tooltipDialogIntro").state === "open" && registry.byId("tutorialStage").get("value") === "17") {
                        var tooltipTemp = registry.byId("tooltipDialogIntro");
                        popup.close(tooltipTemp);
                        tooltipTemp.set("content", "<p style='text-align:justify;'>The <span style='color:orange;font-weight:bolder;'>Change Detection</span> tool has three modes for detecting change: Difference Image, Difference Mask and Threshold Mask.<div id='continueComment' style='color:orange;cursor:pointer;font-weight:bolder;'>Click here to continue.</div></p>");
                        popup.open({
                            parent: registry.byId("changeDetectionDialog"),
                            popup: tooltipTemp,
                            orient: ["after-centered"],
                            around: dom.byId("changeMode"),
                            onClose: lang.hitch(this, function () {
                                domStyle.set(tooltipTemp._popupWrapper, "display", "block");
                            })
                        });
                        on(dom.byId("continueComment"), "click", lang.hitch(this, this.continueTutorial, "18"));

                        document.getElementsByClassName("icon-node")[3].style.pointerEvents = "none";
                        dom.byId("minimizeTimeButton").style.pointerEvents = "none";
                        domStyle.set(tooltipTemp.connectorNode, "top", "0px");
                        registry.byId("tutorialStage").set("value", "18");
                    }
                    if (registry.byId("bandCombinationDialog").open)
                        dom.byId("bandCombination").click();
                    //connect.publish("layerOpen", [{flag: true}]);

                },
                refreshChange: function () {
                    if (!this.stateClosed) {
                        var layer = this.map.getLayer("primaryLayer");
                        var layer2 = this.map.getLayer("secondaryLayer");
                        if (layer && layer.mosaicRule && layer.mosaicRule.method === "esriMosaicLockRaster" && layer2 && layer2.mosaicRule && layer2.mosaicRule.method === "esriMosaicLockRaster" && registry.byId("primarySceneId").get("value") !== registry.byId("secondarySceneId").get("value")) {
                            if (this.primaryScene !== registry.byId('primarySceneId').get("value") || this.secondaryScene !== registry.byId('secondarySceneId').get("value") || this.changeModeFlag) {
                                this.changeModeFlag = false;


                                domStyle.set(dom.byId("dateSecondary"), "display", "inline-block");
                                html.set(this.errorHandler, "");
                                domStyle.set("changeDisplay", "display", "block");
                                setTimeout(lang.hitch(this, function () {
                                    if (layer.url === this.config.urlLandsatMS && layer2.url === this.config.urlLandsatMS) {

                                        this.doChange();
                                    } else {
                                        if (layer.url !== this.config.urlLandsatMS && layer2.url !== this.config.urlLandsatMS) {
                                            var query3 = new Query();
                                            query3.where = "GroupName = '" + registry.byId("primarySceneId").get("value") + "' OR GroupName = '" + registry.byId("secondarySceneId").get("value") + "'";
                                            query3.outFields = ["OBJECTID", "GroupName"];
                                            query3.returnGeometry = false;

                                            var queryTask3 = new QueryTask(this.config.urlLandsatMS);
                                            queryTask3.execute(query3, lang.hitch(this, function (queryResult3) {
                                                this.array = [];

                                                if (registry.byId("primarySceneId").get("value") === queryResult3.features[0].attributes.GroupName)
                                                    this.array = [queryResult3.features[0].attributes.OBJECTID, queryResult3.features[1].attributes.OBJECTID];
                                                else
                                                    this.array = [queryResult3.features[1].attributes.OBJECTID, queryResult3.features[0].attributes.OBJECTID];
                                                this.doChange();
                                            }));
                                        } else {
                                            var query2 = new Query();
                                            if (layer.url === this.config.urlLandsatMS && layer2.url !== this.config.urlLandsatMS) {
                                                query2.where = "GroupName = '" + registry.byId("secondarySceneId").get("value") + "'";
                                            } else if (layer2.url === this.config.urlLandsatMS && layer.url !== this.config.urlLandsatMS) {
                                                query2.where = "GroupName = '" + registry.byId("primarySceneId").get("value") + "'";
                                            }
                                            query2.outFields = ["OBJECTID"];
                                            query2.returnGeometry = false;

                                            var queryTask2 = new QueryTask(this.config.urlLandsatMS);
                                            queryTask2.execute(query2, lang.hitch(this, function (queryResult2) {
                                                this.array = [];
                                                for (var a in queryResult2.features) {
                                                    this.array[a] = queryResult2.features[a].attributes.OBJECTID;
                                                }
                                                this.doChange();
                                            }));

                                        }
                                    }
                                }), 1000);
                            }
                        } else {
                            if (this.map.getLayer("resultLayer")) {
                                if (this.map.getLayer("resultLayer").updating) {
                                    this.map.getLayer("resultLayer").suspend();
                                }
                                this.map.removeLayer(this.map.getLayer("resultLayer"));
                            }
                            domStyle.set("changeDisplay", "display", "none");
                            html.set(this.errorHandler, "<p style='text-align:justify;'>Before you can compute change, you will need<br />to select Primary and Secondary Dates. Use<br />the Time Slider to select an earlier date and<br />click the Set as Secondary Layer button. Then<br />select a later date and return to the Change<br />Detection tool to compare them.</p>");
                        }
                    }

                },
                onClose: function () {
                    this.stateClosed = true;
                    if (this.chart) {
                        dojo.empty("histogram");
                        this.chart = null;
                    }
                    if (registry.byId("changeDetectionDialog").open) {
                        this.noMinimizeDisplay = true;
                        registry.byId("changeDetectionDialog").hide();
                    }

                    if (this.map.getLayer("resultLayer")) {
                        if (this.map.getLayer("resultLayer").updating) {
                            this.map.getLayer("resultLayer").suspend();
                        }
                        this.map.removeLayer(this.map.getLayer("resultLayer"));
                    }
                    registry.byId("changeMaskDetect").set("value", "");
                    this.hideLoading();//domStyle.set("loadingChange", "display", "none");
                    if (this.changeHandler)
                    {
                        this.changeHandler.remove();
                        this.changeHandler = null;
                    }
                    domStyle.set("minimizeChange", "display", "none");
                    domStyle.set(dom.byId("dateSecondary"), "display", "none");
                    this.previousChangeValue = null;
                    registry.byId("markedChangeAreas").set("checked", false);
                    this.primaryScene = null;
                    this.secondaryScene = null;
                },
                setPixelFilter: function (value) {
                    // html.set(this.changeTolerance, "[<b>" + value.toFixed(2) + "</b>]");
                    if (this.changeDetectionLayer) {
                        this.changeDetectionLayer.redraw();
                    }
                },
                changeInVeg: function () {

                    if (registry.byId("changeOptions").get("value") === "NDVI") {
                        var method = 0;
                        var bandIndexes = "(B5 - B4)/(B5 + B4 - 10000)";
                    } else {
                        var method = 0;
                        var bandIndexes = "(1.5 * (B5 - B4))/(B5 + B4 +15000)";
                    }
                    var layer = this.map.getLayer("primaryLayer");
                    var layer2 = this.map.getLayer("secondaryLayer");

                    var args1 = {}, args2 = {}, args = {}, raster1, raster2;
                    raster1 = new RasterFunction();
                    raster1.functionName = "BandArithmetic";
                    if (layer.url === this.config.urlLandsatMS)
                        args1.Raster = "$" + layer.mosaicRule.lockRasterIds[0];
                    else
                        args1.Raster = "$" + this.array[0];
                    args1.Method = method;
                    args1.BandIndexes = bandIndexes;
                    raster1.outputPixelType = "F32";
                    raster1.functionArguments = args1;

                    raster2 = new RasterFunction();
                    raster2.functionName = "BandArithmetic";
                    if (layer2.url === this.config.urlLandsatMS)
                        args2.Raster = "$" + layer2.mosaicRule.lockRasterIds[0];
                    else if (layer.url === this.config.urlLandsatMS)
                        args2.Raster = "$" + this.array[0];
                    else
                        args2.Raster = "$" + this.array[1];
                    args2.Method = method;
                    args2.BandIndexes = bandIndexes;
                    raster2.functionArguments = args2;
                    raster2.outputPixelType = "F32";


                    var composite = new RasterFunction();
                    var compositeArg = {};

                    if (registry.byId("changeMode").get("value") !== "difference") {
                        composite.functionName = "CompositeBand";
                        if (registry.byId("changeMode").get("value") === "Image") {
                            if (this.primaryDate < this.secondaryDate)
                                compositeArg.Rasters = [raster1, raster2, raster1];
                            else
                                compositeArg.Rasters = [raster2, raster1, raster2];
                        } else {
                            if (this.primaryDate < this.secondaryDate)
                                compositeArg.Rasters = [raster1, raster2];
                            else
                                compositeArg.Rasters = [raster2, raster1];
                        }
                    } else {
                        composite.functionName = "Arithmetic";
                        if (this.primaryDate > this.secondaryDate) {
                            compositeArg.Raster = raster1;
                            compositeArg.Raster2 = raster2;
                        } else
                        {
                            compositeArg.Raster = raster2;
                            compositeArg.Raster2 = raster1;
                        }
                        compositeArg.Operation = 2;
                        compositeArg.ExtentType = 1;
                        compositeArg.CellsizeType = 0;

                    }
                    composite.outputPixelType = "F32";
                    composite.functionArguments = compositeArg;
                    this.primaryScene = registry.byId("primarySceneId").get("value");
                    this.secondaryScene = registry.byId("secondarySceneId").get("value");
                    this.addChangeLayer(composite);

                },
                changeInWater: function () {

                    var layer = this.map.getLayer("primaryLayer");
                    var layer2 = this.map.getLayer("secondaryLayer");
                    var args1 = {}, args2 = {}, args = {}, raster1, raster2;
                    raster1 = new RasterFunction();
                    raster1.functionName = "BandArithmetic";
                    if (layer.url === this.config.urlLandsatMS)
                        args1.Raster = "$" + layer.mosaicRule.lockRasterIds[0];
                    else
                        args1.Raster = "$" + this.array[0];
                    args1.Method = 0;
                    args1.BandIndexes = "(B3-B6)/(B3+B6-10000)";
                    raster1.outputPixelType = "F32";
                    raster1.functionArguments = args1;

                    raster2 = new RasterFunction();
                    raster2.functionName = "BandArithmetic";
                    if (layer2.url === this.config.urlLandsatMS)
                        args2.Raster = "$" + layer2.mosaicRule.lockRasterIds[0];
                    else if (layer.url === this.config.urlLandsatMS)
                        args2.Raster = "$" + this.array[0];
                    else
                        args2.Raster = "$" + this.array[1];
                    args2.Method = 0;
                    args2.BandIndexes = "(B3-B6)/(B3+B6-10000)";
                    raster2.functionArguments = args2;
                    raster2.outputPixelType = "F32";


                    var composite = new RasterFunction();
                    var compositeArg = {};

                    if (registry.byId("changeMode").get("value") !== "difference") {
                        composite.functionName = "CompositeBand";
                        if (registry.byId("changeMode").get("value") === "Image") {
                            if (this.primaryDate < this.secondaryDate)
                                compositeArg.Rasters = [raster1, raster2, raster1];
                            else
                                compositeArg.Rasters = [raster2, raster1, raster2];
                        } else {
                            if (this.primaryDate < this.secondaryDate)
                                compositeArg.Rasters = [raster1, raster2];
                            else
                                compositeArg.Rasters = [raster2, raster1];
                        }
                    } else {
                        composite.functionName = "Arithmetic";
                        if (this.primaryDate > this.secondaryDate) {
                            compositeArg.Raster = raster1;
                            compositeArg.Raster2 = raster2;
                        } else
                        {
                            compositeArg.Raster = raster2;
                            compositeArg.Raster2 = raster1;
                        }
                        compositeArg.Operation = 2;
                        compositeArg.ExtentType = 1;
                        compositeArg.CellsizeType = 0;

                    }
                    composite.outputPixelType = "F32";
                    composite.functionArguments = compositeArg;

                    this.primaryScene = registry.byId("primarySceneId").get("value");
                    this.secondaryScene = registry.byId("secondarySceneId").get("value");
                    this.addChangeLayer(composite);
                },
                changeInBurn: function () {

                    var layer = this.map.getLayer("primaryLayer");
                    var layer2 = this.map.getLayer("secondaryLayer");
                    var args1 = {}, args2 = {}, args = {}, raster1, raster2;
                    raster1 = new RasterFunction();
                    raster1.functionName = "BandArithmetic";
                    if (layer.url === this.config.urlLandsatMS)
                        args1.Raster = "$" + layer.mosaicRule.lockRasterIds[0];
                    else
                        args1.Raster = "$" + this.array[0];
                    args1.Method = 0;
                    args1.BandIndexes = "(B5 -B7)/(B5+B7 - 10000)";
                    raster1.outputPixelType = "F32";
                    raster1.functionArguments = args1;

                    var raster12 = new RasterFunction();
                    raster12.functionName = "BandArithmetic";
                    var args12 = {};
                    if (layer.url === this.config.urlLandsatMS)
                        args12.Raster = "$" + layer.mosaicRule.lockRasterIds[0];
                    else
                        args12.Raster = "$" + this.array[0];
                    args12.Method = 0;
                    args12.BandIndexes = "(B3-B6)/(B3+B6-10000)";
                    raster12.outputPixelType = "F32";
                    raster12.functionArguments = args12;

                    var remapNDWI = new RasterFunction();
                    remapNDWI.functionName = "Remap";
                    var argsNDWI = {};
                    argsNDWI.InputRanges = [-1, 0.1, 0.1, 1];
                    argsNDWI.OutputValues = [1, 0];
                    argsNDWI.AllowUnmatched = true;
                    argsNDWI.Raster = raster12;
                    remapNDWI.functionArguments = argsNDWI;
                    remapNDWI.outputPixelType = "F32";

                    var reBurn = new RasterFunction();
                    reBurn.functionName = "Arithmetic";
                    reBurn.outputPixelType = "F32";
                    var argsRe = {};
                    argsRe.Raster = raster1;
                    argsRe.Raster2 = remapNDWI;
                    argsRe.Operation = 3;
                    argsRe.ExtentType = 1;
                    argsRe.CellsizeType = 0;
                    reBurn.functionArguments = argsRe;

                    raster2 = new RasterFunction();
                    raster2.functionName = "BandArithmetic";
                    if (layer2.url === this.config.urlLandsatMS)
                        args2.Raster = "$" + layer2.mosaicRule.lockRasterIds[0];
                    else if (layer.url === this.config.urlLandsatMS)
                        args2.Raster = "$" + this.array[0];
                    else
                        args2.Raster = "$" + this.array[1];
                    args2.Method = 0;
                    args2.BandIndexes = "(B5 -B7)/(B5+B7 - 10000)";
                    raster2.functionArguments = args2;
                    raster2.outputPixelType = "F32";

                    var raster22 = new RasterFunction();
                    raster22.functionName = "BandArithmetic";
                    var args22 = {};
                    if (layer2.url === this.config.urlLandsatMS)
                        args22.Raster = "$" + layer2.mosaicRule.lockRasterIds[0];
                    else if (layer.url === this.config.urlLandsatMS)
                        args22.Raster = "$" + this.array[0];
                    else
                        args22.Raster = "$" + this.array[1];
                    args22.Method = 0;
                    args22.BandIndexes = "(B3-B6)/(B3+B6-10000)";
                    raster22.outputPixelType = "F32";
                    raster22.functionArguments = args22;

                    var remapNDWI2 = new RasterFunction();
                    remapNDWI2.functionName = "Remap";
                    var argsNDWI2 = {};
                    argsNDWI2.InputRanges = [-1, 0.1, 0.1, 1];
                    argsNDWI2.OutputValues = [1, 0];
                    argsNDWI2.AllowUnmatched = true;
                    argsNDWI2.Raster = raster22;
                    remapNDWI2.functionArguments = argsNDWI2;
                    remapNDWI2.outputPixelType = "F32";

                    var reBurn2 = new RasterFunction();
                    reBurn2.functionName = "Arithmetic";
                    reBurn2.outputPixelType = "F32";
                    var argsRe2 = {};
                    argsRe2.Raster = raster2;
                    argsRe2.Raster2 = remapNDWI2;
                    argsRe2.Operation = 3;
                    argsRe2.ExtentType = 1;
                    argsRe2.CellsizeType = 0;
                    reBurn2.functionArguments = argsRe2;

                    var composite = new RasterFunction();
                    var compositeArg = {};

                    if (registry.byId("changeMode").get("value") !== "difference") {
                        composite.functionName = "CompositeBand";
                        if (registry.byId("changeMode").get("value") === "Image") {
                            if (this.primaryDate < this.secondaryDate)
                                compositeArg.Rasters = [reBurn, reBurn2, reBurn];
                            else
                                compositeArg.Rasters = [reBurn2, reBurn, reBurn2];
                        } else {
                            if (this.primaryDate < this.secondaryDate)
                                compositeArg.Rasters = [reBurn, reBurn2];
                            else
                                compositeArg.Rasters = [reBurn2, reBurn];
                        }
                    } else {
                        composite.functionName = "Arithmetic";
                        if (this.primaryDate > this.secondaryDate) {
                            compositeArg.Raster = reBurn;
                            compositeArg.Raster2 = reBurn2;
                        } else
                        {
                            compositeArg.Raster = reBurn2;
                            compositeArg.Raster2 = reBurn;
                        }
                        compositeArg.Operation = 2;
                        compositeArg.ExtentType = 1;
                        compositeArg.CellsizeType = 0;

                    }
                    composite.outputPixelType = "F32";
                    composite.functionArguments = compositeArg;


                    this.primaryScene = registry.byId("primarySceneId").get("value");
                    this.secondaryScene = registry.byId("secondarySceneId").get("value");
                    this.addChangeLayer(composite);

                },
                changeInUrban: function () {

                    var layer = this.map.getLayer("primaryLayer");
                    var layer2 = this.map.getLayer("secondaryLayer");
                    var args1 = {}, args2 = {}, args = {}, raster1, raster2;
                    raster1 = new RasterFunction();
                    raster1.functionName = "BandArithmetic";
                    if (layer.url === this.config.urlLandsatMS)
                        args1.Raster = "$" + layer.mosaicRule.lockRasterIds[0];
                    else
                        args1.Raster = "$" + this.array[0];
                    args1.Method = 0;
                    args1.BandIndexes = "(((B6 - B5)/(B6 + B5 - 10000)) + ((B4 - B5)/(B5 + B4 - 10000)))";
                    raster1.outputPixelType = "F32";
                    raster1.functionArguments = args1;


                    raster2 = new RasterFunction();
                    raster2.functionName = "BandArithmetic";
                    if (layer2.url === this.config.urlLandsatMS)
                        args2.Raster = "$" + layer2.mosaicRule.lockRasterIds[0];
                    else if (layer.url === this.config.urlLandsatMS)
                        args2.Raster = "$" + this.array[0];
                    else
                        args2.Raster = "$" + this.array[1];
                    args2.Method = 0;
                    args2.BandIndexes = "(((B6 - B5)/(B6 + B5 - 10000)) + ((B4 - B5)/(B5 + B4 - 10000)))";
                    raster2.functionArguments = args2;
                    raster2.outputPixelType = "F32";

                    var composite = new RasterFunction();
                    var compositeArg = {};

                    if (registry.byId("changeMode").get("value") !== "difference") {
                        composite.functionName = "CompositeBand";
                        if (registry.byId("changeMode").get("value") === "Image") {
                            if (this.primaryDate < this.secondaryDate)
                                compositeArg.Rasters = [raster1, raster2, raster1];
                            else
                                compositeArg.Rasters = [raster2, raster1, raster2];
                            composite.outputPixelType = "U8";
                        } else {
                            if (this.primaryDate < this.secondaryDate)
                                compositeArg.Rasters = [raster1, raster2];
                            else
                                compositeArg.Rasters = [raster2, raster1];
                        }
                    } else {
                        composite.functionName = "Arithmetic";
                        if (this.primaryDate > this.secondaryDate) {
                            compositeArg.Raster = raster1;
                            compositeArg.Raster2 = raster2;
                        } else
                        {
                            compositeArg.Raster = raster2;
                            compositeArg.Raster2 = raster1;
                        }
                        compositeArg.Operation = 2;
                        compositeArg.ExtentType = 1;
                        compositeArg.CellsizeType = 0;

                    }
                    composite.outputPixelType = "F32";
                    composite.functionArguments = compositeArg;

                    this.primaryScene = registry.byId("primarySceneId").get("value");
                    this.secondaryScene = registry.byId("secondarySceneId").get("value");
                    this.addChangeLayer(composite);
                },
                addChangeLayer: function (raster) {
                    if (this.chart) {
                        dojo.empty("histogram");
                        this.chart = null;
                    }
                    if (registry.byId("changeMode").get("value") === "Image") {

                        var stretch = new RasterFunction();
                        stretch.functionName = "Stretch";
                        var stretchArg = {};
                        stretchArg.StretchType = 3;
                        stretchArg.NumberOfStandardDeviations = 3;
                        stretchArg.DRA = true;
                        stretchArg.Min = 0;
                        stretchArg.Max = 255;
                        stretchArg.Raster = raster;
                        stretch.functionArguments = stretchArg;
                        raster = stretch;
                        stretch.outputPixelType = "U8";
                    }

                    if (registry.byId("markedChangeAreas").checked && this.polygons && this.polygons.rings.length > 0) {
                        var rasterClip = new RasterFunction();
                        rasterClip.functionName = "Clip";
                        if (registry.byId("changeMode").get("value") === "Image")
                            rasterClip.outputPixelType = "U8";
                        else
                            rasterClip.outputPixelType = "F32";

                        var clipArguments = {};
                        clipArguments.ClippingGeometry = this.polygons;
                        clipArguments.ClippingType = 1;
                        clipArguments.Raster = raster;
                        rasterClip.functionArguments = clipArguments;
                        raster = rasterClip;
                    } else {
                        var rasterClip = new RasterFunction();
                        rasterClip.functionName = "Clip";
                        if (registry.byId("changeMode").get("value") === "Image")
                            rasterClip.outputPixelType = "U8";
                        else
                            rasterClip.outputPixelType = "F32";
                        var clipArguments = {};
                        clipArguments.ClippingGeometry = JSON.parse(registry.byId("intersectingPolygon").get("value"));
                        clipArguments.ClippingType = 1;
                        clipArguments.Raster = raster;
                        rasterClip.functionArguments = clipArguments;
                        raster = rasterClip;
                    }
                    var params = new ImageServiceParameters();
                    params.renderingRule = raster;
                    if (registry.byId("changeMode").get("value") !== "Image") {


                        params.format = "lerc";

                        var xdistance = this.map.extent.xmax - this.map.extent.xmin;
                        var ydistance = this.map.extent.ymax - this.map.extent.ymin;
                        this.pixelSizeX = xdistance / this.map.width;
                        this.pixelSizeY = ydistance / this.map.height;
                        var latitude = ((this.map.extent.getCenter()).getLatitude() * Math.PI) / 180;
                        this.scale = Math.pow((1 / Math.cos(latitude)), 2);
                    }
                    if (this.map.getLayer("resultLayer") && registry.byId("changeMaskDetect").get("value") === "change") {
                        this.map.getLayer("resultLayer").setRenderingRule(params.renderingRule);
                    } else {
                        this.changeDetectionLayer = new RasterLayer(
                                this.config.urlLandsatMS,
                                {
                                    id: "resultLayer",
                                    imageServiceParameters: params,
                                    pixelFilter: lang.hitch(this, this.maskPixels)
                                });

                        this.changeDetectionLayer.on("load", lang.hitch(this, function () {
                            this.changeDetectionLayer.pixelType = "F32";
                        }));



                        if (this.map.getLayer("resultLayer")) {
                            this.map.getLayer("resultLayer").suspend();
                            this.map.removeLayer(this.map.getLayer("resultLayer"));
                        }
                        for (var a = this.map.layerIds.length - 1; a >= 0; a--) {
                            if (this.map.layerIds[a] === "primaryLayer") {

                                this.map.addLayer(this.changeDetectionLayer, a + 1);
                                break;
                            }
                        }
                    }

                    registry.byId("changeMaskDetect").set("value", "change");
                    this.createHistogram(raster);
                    domConstruct.destroy("changeDetectionDialog_underlay");
                },
                createHistogram: function (raster) {
                    if (registry.byId("changeMode").get("value") === "difference") {
                        if (this.chart) {
                            dojo.empty("histogram");
                            this.chart = null;
                        }
                        domStyle.set("histogram", "display", "block");

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
                            var xData = lang.clone(this.value);
                            var threshold = registry.byId("horiSliderInclusion").get("value");
                            var thresholdDecrease = registry.byId("horiSliderDecrease").get("value");
                            var increaseLimit = parseInt(((threshold - this.min) / (this.max - this.min)) * 255);
                            var decreaseLimit = parseInt(((thresholdDecrease - this.min) / (this.max - this.min)) * 255);

                            var dataDecrease = xData.slice(0, decreaseLimit + 1);
                            var dataIncrease = xData.slice(increaseLimit, this.value.length);
                            var greyData = xData.slice(decreaseLimit + 1, increaseLimit);
                            var datasort = lang.clone(dataDecrease);
                            datasort.sort(function (a, b) {
                                return b.y - a.y;
                            });
                            var datasort2 = lang.clone(dataIncrease);
                            datasort2.sort(function (a, b) {
                                return b.y - a.y;
                            });
                            if (datasort[0].y > datasort2[0].y)
                            {
                                for (var a in greyData) {
                                    if (greyData[a].y > datasort[0].y)
                                        greyData[a].y = datasort[0].y;
                                }
                            } else {
                                for (var a in greyData) {
                                    if (greyData[a].y > datasort2[0].y)
                                        greyData[a].y = datasort2[0].y;
                                }
                            }
                            if (!this.chart) {
                                this.chart = new Chart("histogram");
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
                                if (registry.byId("changeOptions").get("value") === "BurnIndex")
                                    this.chart.addSeries("Decrease", dataDecrease, {stroke: {color: "#fc6d31", width: 0.5}, fill: "#fc6d31"});
                                else
                                    this.chart.addSeries("Decrease", dataDecrease, {stroke: {color: "#ff00ff", width: 0.5}, fill: "#ff00ff"});
                                this.chart.addSeries("Increase", dataIncrease, {stroke: {color: "green", width: 0.5}, fill: "green"});
                                this.chart.addSeries("Grey", greyData, {stroke: {color: "grey", width: 0.5}, fill: "grey"});
                                this.magnify = new Magnify(this.chart, "default");
                                this.chart.render();
                            }
                        }));
                    } else
                        domStyle.set("histogram", "display", "none");
                },
                doChange: function () {
                    var changeOption = registry.byId("changeOptions").get("value");

                    if (!this.changeIndexFlag) {
                        this.skipRedrawLayer = true;

                        if (changeOption === "BurnIndex") {

                            registry.byId("horiSliderDecrease").set("value", -0.1);
                            registry.byId("horiSliderRight").set("value", 0);
                            registry.byId("horiSliderInclusion").set("value", 0.1);
                        } else if (changeOption === "Urban")
                        {

                            registry.byId("horiSliderDecrease").set("value", 0);
                            registry.byId("horiSliderRight").set("value", 0);
                            registry.byId("horiSliderInclusion").set("value", 0);
                        } else if (changeOption === "NDWI")
                        {

                            registry.byId("horiSliderDecrease").set("value", -0.5);
                            registry.byId("horiSliderRight").set("value", 0);
                            registry.byId("horiSliderInclusion").set("value", 0.100);
                        } else
                        {

                            registry.byId("horiSliderDecrease").set("value", -0.3);
                            registry.byId("horiSliderRight").set("value", 0);
                            registry.byId("horiSliderInclusion").set("value", 0.3);
                        }
                    } else {
                        this.changeIndexFlag = false;
                        this.skipRedrawLayer = false;
                    }

                    this.primaryDate = locale.format(new Date(parseInt(registry.byId("currentOBJECTID").get("value"))), {selector: "date", datePattern: "yyyy/MM/dd"});
                    this.secondaryDate = locale.format(new Date(parseInt(registry.byId("secondOBJECTID").get("value"))), {selector: "date", datePattern: "yyyy/MM/dd"});
                    if (this.primaryDate > this.secondaryDate)
                        registry.byId("dateCompareFlag").set("value", true);
                    else
                        registry.byId("dateCompareFlag").set("value", false);

                    if (changeOption === "BurnIndex")
                    {
                        html.set(this.sliderValueLeft, "Burnt / Post Fire Regrowth Area:");
                        domStyle.set(this.areaValueLeft, "color", "#fc6d31");
                    } else {
                        domStyle.set(this.areaValueLeft, "color", "magenta");
                        html.set(this.sliderValueLeft, "Area Decrease / Increase:");

                    }
                    if (changeOption === "BurnIndex")
                        this.changeInBurn();
                    else if (changeOption === "Urban")
                        this.changeInUrban();
                    else if (changeOption === "NDWI")
                        this.changeInWater();
                    else
                        this.changeInVeg();

                },
                maskPixels: function (pixelData) {

                    if (registry.byId("changeMode").get("value") !== "Image") {
                        if (pixelData === null || pixelData.pixelBlock === null)
                            return;
                        var numPixels = pixelData.pixelBlock.width * pixelData.pixelBlock.height;
                        if (!pixelData.pixelBlock.mask) {
                            pixelData.pixelBlock.mask = new Uint8Array(numPixels);
                        }

                        if (pixelData.pixelBlock.pixels === null)
                            return;
                        var pr = new Uint8Array(numPixels);
                        var pg = new Uint8Array(numPixels);
                        var pb = new Uint8Array(numPixels);
                        var threshold = registry.byId("horiSliderInclusion").get("value");
                        var areaLeft = 0, areaRight = 0;
                        if (registry.byId("changeMode").get("value") === "difference") {
                            var pixelScene = pixelData.pixelBlock.pixels[0];
                            var nodata = pixelData.pixelBlock.statistics[0].noDataValue;
                            var negativeDif = registry.byId("horiSliderDecrease").get("value");
                            for (var i = 0; i < numPixels; i++) {

                                if (pixelScene[i] === nodata) {
                                    pixelData.pixelBlock.mask[i] = 0;
                                } else if (pixelScene[i] < negativeDif) { //&& pixelScene[i] < -0.1
                                    if (registry.byId("changeOptions").get("value") === "BurnIndex") {
                                        pr[i] = 255;
                                        pg[i] = 69;
                                        pb[i] = 0;
                                    } else {
                                        pr[i] = 255;
                                        pg[i] = 0;
                                        pb[i] = 255;
                                    }
                                    pixelData.pixelBlock.mask[i] = 1;
                                    areaLeft++;
                                } else if (pixelScene[i] > threshold) {
                                    pr[i] = 0//124;
                                    pg[i] = 252;
                                    pb[i] = 0;
                                    pixelData.pixelBlock.mask[i] = 1;
                                    areaRight++;
                                } else
                                    pixelData.pixelBlock.mask[i] = 0;
                            }
                        } else {
                            var pixelScene1 = pixelData.pixelBlock.pixels[0];
                            var pixelScene2 = pixelData.pixelBlock.pixels[1];

                            var differenceThreshold = registry.byId("horiSliderRight").get("value");

                            var areaLeft = 0, areaRight = 0;
                            for (var i = 0; i < numPixels; i++) {
                                if (pixelScene1[i] === 0 || pixelScene2[i] === 0) {
                                    pixelData.pixelBlock.mask[i] = 0;
                                } else {
                                    if (pixelScene1[i] > 10)
                                        pixelScene1[i] = 0;
                                    if (pixelScene2[i] > 10)
                                        pixelScene2[i] = 0;
                                    if (pixelScene1[i] < threshold && pixelScene2[i] > threshold && (pixelScene2[i] - pixelScene1[i]) > differenceThreshold) {
                                        pixelData.pixelBlock.mask[i] = 1;
                                        pr[i] = 0; //65;
                                        pg[i] = 252; //105;
                                        pb[i] = 0; //255;
                                        areaRight++;
                                    } else if (pixelScene1[i] > threshold && pixelScene2[i] < threshold && (pixelScene1[i] - pixelScene2[i]) > differenceThreshold) {
                                        pixelData.pixelBlock.mask[i] = 1;
                                        if (registry.byId("changeOptions").get("value") === "BurnIndex") {
                                            pr[i] = 255;
                                            pg[i] = 69;
                                            pb[i] = 0;
                                        } else {
                                            pr[i] = 255;
                                            pg[i] = 0;
                                            pb[i] = 255;
                                        }
                                        areaLeft++;
                                    } else
                                        pixelData.pixelBlock.mask[i] = 0;
                                }
                            }
                        }

                        html.set(this.areaValueLeft, ((areaLeft * this.pixelSizeX * this.pixelSizeY) / (1000000 * this.scale)).toFixed(3) + " km<sup>2</sup> <span style='color:black;'>/</span> <span style='color:green;'>" + ((areaRight * this.pixelSizeX * this.pixelSizeY) / (1000000 * this.scale)).toFixed(3) + " km<sup>2</sup></span>");
                        pixelData.pixelBlock.pixels = [pr, pg, pb];
                        pixelData.pixelBlock.pixelType = "U8";
                    }
                },
                showLoading: function () {
                    if (dom.byId("loadingChange"))
                        domStyle.set("loadingChange", "display", "block");
                },
                hideLoading: function () {
                    if (dom.byId("loadingChange"))
                        domStyle.set("loadingChange", "display", "none");
                }
            });
            clazz.hasLocale = false;
            return clazz;
        });
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
    'jimu/BaseWidget', "./resourceLoad.js", "jimu/PanelManager"
],
    function (
        declare,
        _WidgetsInTemplateMixin,
        template,
        BaseWidget, resourceLoad, PanelManager
    ) {
        var resource = new resourceLoad({ resource: "time" });
        var plugins = resource.load("time");
        var registry = plugins[1], on = plugins[0], lang = plugins[2], html = plugins[3],
            dom = plugins[4],
            MosaicRule = plugins[5],
            Query = plugins[6], QueryTask = plugins[7], Extent = plugins[8], locale = plugins[9], Chart = plugins[10], Tooltip = plugins[11], theme = plugins[12], SelectableLegend = plugins[13], Magnify = plugins[14], Highlight = plugins[15], domConstruct = plugins[16], HorizontalSlider = plugins[17], HorizontalRule = plugins[18], HorizontalRuleLabels = plugins[19], SimpleLineSymbol = plugins[20], Color = plugins[21], popup = plugins[22], geometryEngine = plugins[23], domStyle = plugins[24], ArcGISImageServiceLayer = plugins[25], ImageServiceParameters = plugins[26], Draw = plugins[27], esriRequest = plugins[28], connect = plugins[29], domClass = plugins[30], SimpleMarkerSymbol = plugins[31], PanelManager = plugins[32];
        var pm = PanelManager.getInstance();
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
                var headerCustom = domConstruct.toDom('<div id="minimizeTimeButton" style="background-color: black; border-radius: 4px;height: 30px;width:30px;position: absolute;top:180px;left: 20px;display: none;"><a   id="timeMinimize" target="_blank"><img id="timeThumnail" src="widgets/ISLayers/images/svg/time24.svg" style="height: 20px;margin:5px;" alt="Time" /></a></div>');
                domConstruct.place(headerCustom, this.map.container);
                domConstruct.place('<img id="loadingts" style="position: absolute;top:0;bottom: 0;left: 0;right: 0;margin:auto;z-index:100;" src="' + require.toUrl('jimu') + '/images/loading.gif">', "timeDialog");
                domConstruct.place('<img id="loadingts1" style="position: absolute;top:0;bottom: 0;left: 0;right: 0;margin:auto;z-index:100;" src="' + require.toUrl('jimu') + '/images/loading.gif">', "waitDialog");
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
                    domStyle.set("chartNode", "width", "390px");
                    domStyle.set("chartNode", "height", "270px");
                    domStyle.set("waitDialog", "width", "440px");
                    domStyle.set("waitDialog", "font-size", "12px");
                    domStyle.set(registry.byId("cloudFilter").domNode, "width", "50px");
                    domStyle.set("legend", "font-size", "12px");
                    if (this.chart) {
                        this.chart.resize(390, 270);
                    }
                    document.getElementById("savePushDownImage").height = "15";
                } else if (window.innerWidth < 1200 && window.innerWidth > 500) {
                    domStyle.set("timeDialog", "font-size", "9px");
                    domStyle.set("timeDialog", "width", "300px");
                    domStyle.set("chartNode", "width", "260px");
                    domStyle.set("chartNode", "height", "180px");
                    domStyle.set("waitDialog", "width", "300px");
                    domStyle.set("waitDialog", "font-size", "9px");
                    domStyle.set(registry.byId("cloudFilter").domNode, "width", "34px");
                    domStyle.set("legend", "font-size", "6px");
                    if (this.chart) {
                        this.chart.resize(260, 180);
                    }
                    document.getElementById("savePushDownImage").height = "15";
                } else if (window.innerWidth < 500) {
                    domStyle.set("timeDialog", "font-size", "7px");
                    domStyle.set("timeDialog", "width", "200px");
                    domStyle.set("chartNode", "width", "180px");
                    domStyle.set("chartNode", "height", "125px");
                    domStyle.set("waitDialog", "width", "200px");
                    domStyle.set("waitDialog", "font-size", "7px");
                    domStyle.set(registry.byId("cloudFilter").domNode, "width", "23px");
                    domStyle.set("legend", "font-size", "5px");
                    if (this.chart) {
                        this.chart.resize(180, 125);
                    }
                    document.getElementById("savePushDownImage").height = "10";
                }
            },
            postCreate: function () {

                window.addEventListener("resize", lang.hitch(this, this.resizeTimeWidget));
                registry.byId("refreshTimesliderBtn").on("click", lang.hitch(this, function () {
                    this.clear();
                    html.set(this.pointgraph, "");
                    this.timeSliderRefresh();
                }));
                registry.byId("dropDownDateList").on("click", lang.hitch(this, this.timeDisplayFormat));
                registry.byId("imageDateSelector").on("change", lang.hitch(this, this.selectorChange));
                registry.byId("cloudFilter").on("change", lang.hitch(this, this.timeSliderRefresh));
                registry.byId("saveSceneBtn").on("click", lang.hitch(this, this.saveScene));
                // registry.byId("fullAccessBtn").on("click", lang.hitch(this, function () {
                //     if (!this.map.useSecureService && this.map.signOut) {
                //         // var request = new esriRequest({
                //         //     url: "https://sentinel.arcgis.com/arcgis/rest/services/Sentinel2/ImageServer",
                //         //     content: {
                //         //         "f": "json"
                //         //     },
                //         //     handleAs: "json",
                //         //     callbackParamName: "callback"
                //         // });
                //         // request.then(lang.hitch(this, function () {
                //             document.getElementById("userSignIn").click();
                //             this.clear();
                //             this.config.urlSentinel = "https://sentinel.arcgis.com/arcgis/rest/services/Sentinel2/ImageServer";

                //             html.set(this.pointgraph, "");
                //             this.timeSliderRefresh();
                //         //}));
                //     } else {
                //         this.timeSliderRefresh();
                //     }
                // }));
                if (this.map) {

                    this.map.on("update-start", lang.hitch(this, this.showLoading));
                    this.map.on("update-end", lang.hitch(this, this.hideLoading));
                    this.map.on("update-end", lang.hitch(this, this.timeUpdate));
                    this.toolbarTemporal = new Draw(this.map);
                    dojo.connect(this.toolbarTemporal, "onDrawEnd", lang.hitch(this, this.addGraphic));
                }
                // if (this.map.useSecureService) {
                //     domStyle.set("fullAccess", "display", "none");
                // }
            },
            timeDisplayFormat: function () {
                if (domClass.contains(registry.byId("dropDownDateList").domNode, "dropDownSelected")) {

                    domClass.remove(registry.byId("dropDownDateList").domNode, "dropDownSelected");
                    document.getElementById("switchDateDisplayTooltip").innerHTML = "Show dates in drop down list.";
                    document.getElementById("switchDateDisplayImage").src = "./widgets/ISTimeFilter/images/dropdownlist.png";
                } else {
                    domClass.add(registry.byId("dropDownDateList").domNode, "dropDownSelected");
                    document.getElementById("switchDateDisplayTooltip").innerHTML = "Show dates on slider.";
                    document.getElementById("switchDateDisplayImage").src = "./widgets/ISTimeFilter/images/slider.png";
                }
                this.timeDisplayFormat2();
            },
            saveScene: function () {
                if (registry.byId("tooltipDialogIntro") && registry.byId("tooltipDialogIntro").state === "open") {

                    var tooltipTemp = registry.byId("tooltipDialogIntro");
                    var tutorialStage = registry.byId("tutorialStage").get("value");
                    if (tutorialStage === "13") {
                        popup.close(tooltipTemp);
                        tooltipTemp.set("content", "<p style='display:inline;text-align:justify;'><span style='font-weight: bolder;color: orange;'>Move the slider</span> to choose a 'primary' image from a later date.<br />When you've found a date, <div id='continueComment' style='font-weight: bolder; color:orange;cursor:pointer;display:inline;'>click here to continue.</div></p>");
                        on(dom.byId("continueComment"), "click", lang.hitch(this, function () {
                            var y = document.getElementsByClassName("icon-node");
                            var tooltipTemp = registry.byId("tooltipDialogIntro");
                            var tutorialStage = registry.byId("tutorialStage").get("value");
                            if (tutorialStage === "14") {
                                tooltipTemp.set("content", "<p style='text-align:justify;'>To compare the two images you selected, <span style='color:orange;font-weight: bolder;'>click</span> <img src='./widgets/ISCompare/images/icon.png' height='15' /> to turn on the <span style='font-weight: bolder;color: orange;'>Swipe</span> tool.</p>");
                                popup.open({
                                    popup: tooltipTemp,
                                    orient: ["after-centered"],
                                    around: y[1],
                                    onClose: lang.hitch(this, function () {
                                        domStyle.set(tooltipTemp._popupWrapper, "display", "block");
                                    })
                                });

                                registry.byId("tutorialStage").set("value", "15");

                                y[0].style.pointerEvents = "none";
                                y[1].style.pointerEvents = "auto";
                                domStyle.set(tooltipTemp.connectorNode, "top", "0px");
                            }
                        }));
                        popup.open({
                            popup: tooltipTemp,
                            parent: registry.byId("timeDialog"),
                            orient: ["below-centered"],
                            around: this.slider.domNode,
                            onClose: lang.hitch(this, function () {
                                domStyle.set(tooltipTemp._popupWrapper, "display", "block");
                            })
                        });
                        registry.byId("tutorialStage").set("value", "14");
                    } else {
                        popup.open({
                            popup: tooltipTemp,
                            orient: ["after-centered"],
                            around: document.getElementsByClassName("icon-node")[1],
                            onClose: lang.hitch(this, function () {
                                domStyle.set(tooltipTemp._popupWrapper, "display", "block");
                            })
                        });
                    }
                    domStyle.set(tooltipTemp.connectorNode, "top", "0px");
                }
                if (this.map.getLayer("secondaryLayer")) {
                    if (this.map.getLayer("secondaryLayer").updating) {
                        this.map.getLayer("secondaryLayer").suspend();
                    }
                    this.map.removeLayer(this.map.getLayer("secondaryLayer"));
                }
                var layer = this.map.getLayer("primaryLayer");
                if (this.item) {
                    html.set(this.pointgraph, "Saved.<br /> Pick a point on the graph to set image date.");
                    setTimeout(lang.hitch(this, function () {
                        html.set(this.pointgraph, "Pick a point on the map to reset location.<br /> Pick a point on the graph to set image date.");
                    }), 3000);

                } else {
                    html.set(this.temporalpro, "Saved");
                    setTimeout(lang.hitch(this, function () {
                        html.set(this.temporalpro, "Pick a point on the map to get the temporal profile for that point.");
                    }), 3000);
                }
                var params = new ImageServiceParameters();
                params.mosaicRule = layer.mosaicRule;
                params.renderingRule = layer.renderingRule;
                params.bandIds = layer.bandIds;
                params.format = "jpgpng";

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

                html.set(this.secondaryRange, "Comparison Date: <b>" + locale.format(new Date(aqDate), { selector: "date", formatLength: "long" }) + "</b>&nbsp;&nbsp;&nbsp;");
                this.intersectGeometry = this.lockId;//this.orderedFeatures[this.slider.get("value")].geometry;
                dom.byId("dateSecondary").innerHTML = "&nbsp;&nbsp;Comparison Date:&nbsp;" + locale.format(new Date(aqDate), { selector: "date", formatLength: "long" });



            },
            timeUpdate: function () {
                connect.subscribe("refreshTime", lang.hitch(this, function (flag) {
                    if (flag.flag) {
                        this.timeSliderRefresh();
                        connect.publish("refreshTime", [{ flag: false }]);
                    }
                }));

                if (this.changeOn) {
                    this.changeOn = false;
                    var x = document.getElementsByClassName("icon-node");
                    x[3].click();
                }
                if (this.changeValue === "mask") {
                    this.changeValue = null;
                    var x = document.getElementsByClassName("icon-node");
                    x[2].click();
                }
                if (this.saveValue) {
                    this.saveValue = false;
                    registry.byId("saveSceneBtn").onClick();
                    if (this.appScene2) {

                        for (var f in this.orderedDates) {

                            if (parseInt(this.appScene2) === this.orderedDates[f]) {

                                var ind = f;
                                this.appScene2 = null;
                                this.slider.set("value", ind);

                                if (this.changeValue === "change")
                                    this.changeOn = true;
                                break;
                            }
                        }
                    }

                }



            },
            onOpen: function () {
                if (!this.map.useSecureService && this.map.signOut) {
                    
                        
                        document.getElementById("userSignIn").click();
                        this.clear();
                        

                        html.set(this.pointgraph, "");
                        
                        
                  
                } else {
                    this.config.urlSentinel = "https://sentinel.arcgis.com/arcgis/rest/services/Sentinel2/ImageServer";
                    this.timeSliderRefresh();
                
                    
                if (registry.byId("bandCombinationDialog").open)
                    dom.byId("bandCombination").click();
                if (registry.byId("maskDialog") && registry.byId("maskDialog").open)
                    registry.byId("maskDialog").hide();
                if (registry.byId("changeDetectionDialog") && registry.byId("changeDetectionDialog").open)
                    registry.byId("changeDetectionDialog").hide();
                var z = document.getElementsByClassName("icon-node");
                if (domClass.contains(z[4], "jimu-state-selected"))
                    z[4].click();
                else if (domClass.contains(z[5], "jimu-state-selected"))
                    z[5].click();
                else if (domClass.contains(z[6], "jimu-state-selected"))
                    z[6].click();
                else if (domClass.contains(z[7], "jimu-state-selected"))
                    z[7].click();
                else if (pm.getPanelById("_16_panel") && pm.getPanelById("_16_panel").state === "opened")
                    pm.closePanel("_16_panel");
                else if (pm.getPanelById("_22_panel") && pm.getPanelById("_22_panel").state === "opened")
                    pm.closePanel("_22_panel");

                if (!this.extentChangeHandler)
                    this.extentChangeHandler = this.map.on("extent-change", lang.hitch(this, this.extentChange));
                if (registry.byId("appSceneID").get("value")) {
                    var userDefinedVariables = (registry.byId("appSceneID").get("value")).split(",");
                    if (userDefinedVariables[2] === "true") {
                        this.appScene = userDefinedVariables[4];
                        this.appScene2 = userDefinedVariables[0];
                        this.saveValue = userDefinedVariables[2];
                    } else
                        this.appScene = userDefinedVariables[0];
                    this.changeValue = userDefinedVariables[3];
                    registry.byId("cloudFilter").set("value", userDefinedVariables[1]);
                    registry.byId("appSceneID").set("value", null);

                }
                html.set(this.pointgraph, "");
                this.autoresize();

                
                dojo.connect(registry.byId("timeDialog"), "hide", lang.hitch(this, function (e) {

                    if (this.noMinimizeDisplay) {
                        if (domStyle.get("minimizeTimeButton", "display") === "none")
                            domStyle.set("minimizeTimeButton", "display", "block");
                        this.toolbarTemporal.deactivate();
                        for (var a in this.map.graphics.graphics) {
                            if (this.map.graphics.graphics[a].geometry.type === "point" && this.map.graphics.graphics[a].symbol && this.map.graphics.graphics[a].symbol.color.r === 255) {
                                this.map.graphics.remove(this.map.graphics.graphics[a]);
                                break;
                            }
                        }


                        if (this.refreshHandlerTime !== null) {
                            this.refreshHandlerTime.remove();
                            this.refreshHandlerTime = null;
                        }
                        html.set(this.pointgraph, "");
                        this.clear();

                        this.item = false;
                        domStyle.set("dateSelectorContainer", "display", "inline-block");
                        if (!domClass.contains(registry.byId("dropDownDateList").domNode, "dropDownSelected")) {
                            if (this.slider) {
                                domStyle.set("slider", "display", "block");
                                domStyle.set("slider2", "display", "block");
                                domStyle.set("slider3", "display", "block");
                            }
                        } else
                            domStyle.set("dropDownOption", "display", "inline-block");
                        this.hideLoading();
                    }


                }));

                if ((this.map.getLevel()) >= 10) {
                    dojo.style(dojo.byId("access"), "display", "none");


                    this.refreshData();
                    if (!registry.byId("timeDialog").open)
                        registry.byId("timeDialog").show();

                    registry.byId("timeDialog").closeButtonNode.title = "Minimize";
                    domStyle.set("timeDialog", "top", "100px");
                    domStyle.set("timeDialog", "left", "160px");
                    domConstruct.destroy("timeDialog_underlay");
                    if (registry.byId("tooltipDialogIntro") && registry.byId("tooltipDialogIntro").state === "open" && registry.byId("tutorialStage").get("value") === "11") {
                        var tooltipTemp = registry.byId("tooltipDialogIntro");
                        popup.close(tooltipTemp);
                        tooltipTemp.set("content", "<p style='text-align:justify;'>The <span style='color:orange;font-weight:bolder;'>Time Selector</span> tool contains cloud filter. You can use the filters to limit the images available to select-you could only use days with 0% cloud cover, for example. (If you want to refresh the time selector at any point, click <img src='./widgets/ISTimeFilter/images/refresh.png' height='15'/>.)<br /><div id='continueComment' style='font-weight: bolder; color:orange;cursor:pointer;'>Click here to continue.</div></p>");
                        on(dom.byId("continueComment"), "click", lang.hitch((this, function () {
                            if (registry.byId("tutorialStage").get("value") === "12") {
                                var tooltipTemp = registry.byId("tooltipDialogIntro");
                                registry.byId("tooltipDialogIntro").set("content", "<p style='text-align:justify;'>Scroll to find an early image that you want to compare to a later image.<br /><span style='font-weight: bolder;color: orange;'>Click on</span> <img src='./widgets/ISTimeFilter/images/down.png' height='15'/>  to set your chosen image as the earlier, 'secondary' image.</p>");
                                popup.open({
                                    popup: tooltipTemp,
                                    parent: registry.byId("timeDialog"),
                                    orient: ["after-centered"],
                                    around: registry.byId("saveSceneBtn").domNode,
                                    onClose: lang.hitch(this, function () {
                                        domStyle.set(tooltipTemp._popupWrapper, "display", "block");
                                    })
                                });
                                domStyle.set(tooltipTemp.connectorNode, "top", "0px");
                                registry.byId("tutorialStage").set("value", "13");
                            }
                        })));
                        popup.open({
                            popup: tooltipTemp,
                            parent: registry.byId("timeDialog"),
                            orient: ["after-centered"],
                            around: registry.byId("timeDialog").domNode,
                            onClose: lang.hitch(this, function () {
                                domStyle.set(tooltipTemp._popupWrapper, "display", "block");
                            })
                        });
                        document.getElementsByClassName("icon-node")[0].style.pointerEvents = "none";

                        registry.byId("tutorialStage").set("value", "12");
                    }
                    html.set(this.temporalpro, "Pick a point on the map to get the temporal profile for that point.");
                    if (!this.slider) {

                        this.timeSliderShow();
                    }
                    domStyle.set(this.filterDiv, "display", "block");
                    if (!this.refreshHandlerTime) {
                        this.refreshHandlerTime = this.map.on("update-end", lang.hitch(this, this.refreshData));
                    }

                } else {
                    domStyle.set(this.filterDiv, "display", "none");
                    dojo.style(dojo.byId("access"), "display", "block");
                    html.set(this.temporalpro, "");
                    this.hideLoading();
                    if (!registry.byId("timeDialog").open)
                        registry.byId("timeDialog").show();
                    registry.byId("timeDialog").closeButtonNode.title = "Minimize";
                    domStyle.set("timeDialog", "top", "100px");
                    domStyle.set("timeDialog", "left", "160px");
                    domConstruct.destroy("timeDialog_underlay");
                }

                if (this.y1 !== null) {
                    if (this.y1[0].className === 'icon-node') {
                        dojo.addClass(this.y1[0], "jimu-state-selected");
                    }
                }
                this.toolbarTemporal.activate(Draw.POINT);
            }
            },
            autoresize: function () {
                this.h = this.map.height;
                this.h = (parseInt((this.h / 5.5))).toString();
            },
            onClose: function () {
                if (this.map.getLayer("secondaryLayer")) {
                    if (this.map.getLayer("secondaryLayer").updating) {
                        this.map.getLayer("secondaryLayer").suspend();
                    }
                    this.map.removeLayer(this.map.getLayer("secondaryLayer"));
                    html.set(this.secondaryRange, "");
                    domStyle.set(this.dateRange, "font-size", "");
                }
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

                if (registry.byId("timeDialog").open) {
                    this.noMinimizeDisplay = false;

                    registry.byId("timeDialog").hide();
                    this.noMinimizeDisplay = true;
                }
                if (domStyle.get("minimizeTimeButton", "display") === "block")
                    domStyle.set("minimizeTimeButton", "display", "none");
                domStyle.set(this.filterDiv, "display", "none");

                if (this.primaryLayer) {
               // if (this.mosaicBackup) {
                //    var mr = new MosaicRule(this.mosaicBackup);
                //} else {
                    var mr = new MosaicRule({ "mosaicMethod": "esriMosaicAttribute", "sortField": "best", "sortValue": 0, "ascending": true, "mosaicOperation": "MT_FIRST"});
                //}

                
                this.primaryLayer.setMosaicRule(mr);
            }
            registry.byId("currentOBJECTID").set("value", null);
                this.timeSliderHide();
                this.noMinimizeDisplay = true;

                html.set(this.pointgraph, "");
                this.clear();

                this.item = false;
                if (this.slider) {
                    domStyle.set("slider", "display", "block");
                    domStyle.set("slider2", "display", "block");
                    domStyle.set("slider3", "display", "block");
                }


                this.hideLoading();



            },
            clear: function () {
                dojo.style(dojo.byId("chartshow"), "display", "none");
                domStyle.set(dom.byId("cloudSelect"), "display", "inline-block");
                domStyle.set("dateSelectorContainer", "display", "inline-block");
                if (this.chart) {
                    dojo.empty("chartNode");
                    this.chart = null;
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
                            var mr = new MosaicRule({ "mosaicMethod": "esriMosaicAttribute", "sortField": "best", "sortValue": 0, "ascending": true, "mosaicOperation": "MT_FIRST", "where": "(datatype_format = 'Cloned') OR (datatype_format IS NULL)" });
                        }
                        this.primaryLayer.setMosaicRule(mr);
                        registry.byId("currentOBJECTID").set("value", null);
                    } else {
                        if (this.extentChangeHandler) {
                            domStyle.set(this.filterDiv, "display", "block");
                            domStyle.set("access", "display", "none");
                            if (this.chart) {
                                this.clear();
                            }
                            html.set(this.pointgraph, "");
                            if (!this.slider) {
                                this.timeSliderShow();
                            } else {
                                this.timeSliderRefresh();
                            }
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
                            this.primaryLayer.setMosaicRule(mr);
                            this.timeSliderHide();
                            pm.closePanel('_32_panel');

                        }
                    }

                }
            },
            refreshData: function () {


                this.primaryLayer = this.map.getLayer("primaryLayer");
                this.mosaicBackup = this.primaryLayer.mosaicRule? this.primaryLayer.mosaicRule : this.primaryLayer.defaultMosaicRule;
                //this.mosaicBackup.where = "(datatype_format = 'Cloned') OR (datatype_format IS NULL)";
                this.dateField = "acquisitiondate";

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
                this.temporalprof(geometry);

            },
            temporalprof: function (evt) {
                domStyle.set("loadingts1", "display", "block");
                if (!this.noSceneFlag) {
                    this.noMinimizeDisplay = false;
                    registry.byId("timeDialog").hide();
                    this.noMinimizeDisplay = true;
                    this.item = true;

                    var tempLayer = this.map.getLayer("primaryLayer");


                    var point = evt;
                    var query = new Query();
                    query.geometry = point;
                    query.outFields = ["acquisitiondate", "objectid", "name", "best"];
                    if (this.map.useSecureService)
                        query.where = "(category = 1) AND (cloudcover <=" + registry.byId("cloudFilter").get("value") + ")";
                    else
                        query.where = "(category = 1) AND (cloudcover <=" + registry.byId("cloudFilter").get("value") + ") AND (datatype_format = 'Cloned')";

                    query.orderByFields = ["acquisitiondate"];
                    query.returnGeometry = false;
                    var array = [], arrayId = [];
                    var queryTask = new QueryTask(this.config.urlSentinel);
                    var distance = [];
                    queryTask.execute(query, lang.hitch(this, function (result) {
                        var data = result.features;


                        if (data.length > 10)
                            html.set(this.queryScenes, "Please wait. Querying best 10 out of " + data.length + " scenes to create profile. May take longer the first time.");
                        else
                            html.set(this.queryScenes, "Please wait. Querying " + data.length + " scenes to create profile. May take longer the first time.");
                        registry.byId("waitDialog").show();
                        var prevIterationValue = 0;
                        this.lengthofsamples = data.length;
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

                            for (var j = limitSamples; j < distance.length; j++) {

                                array.push({
                                    objectId: distance[j].objectId,
                                    acqDate: distance[j].acqDate,
                                    name: distance[j].name

                                });
                                arrayId.push(distance[j].objectId);


                            }
                        }
                        var noCurrentScene = null;

                        for (var a = 0; a < array.length; a++) {
                            if (array[a].acqDate === this.orderedDates[this.slider.get("value")]) {
                                noCurrentScene = false;
                                break;
                            } else
                                noCurrentScene = true;
                        }


                        var mosaicLock = new MosaicRule({ "mosaicMethod": "esriMosaicLockRaster", "ascending": true, "mosaicOperation": "MT_FIRST", "lockRasterIds": arrayId });
                        mosaicLock = JSON.stringify(mosaicLock.toJson());



                        var request1 = esriRequest({
                            url: this.config.urlSentinel + "/getSamples",
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

                                var nir = plot[7];
                                var red = plot[3];
                                var calc = (nir - red) / (red + nir);
                                var swir1 = plot[11];

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
                            html.set(this.temporalpro, "");
                            this.clear();
                            html.set(this.pointgraph, "Pick a point on the map to reset location.<br /> Pick a point on the graph to set image date.");
                            dojo.style(dojo.byId("chartshow"), "display", "block");
                            domStyle.set(dom.byId("cloudSelect"), "display", "none");

                            if (!registry.byId("timeDialog").open) {
                                registry.byId("waitDialog").hide();
                                registry.byId("timeDialog").show();
                                domStyle.set("timeDialog", "top", "100px");
                                domStyle.set("timeDialog", "left", "160px");

                            }
                            if (items.length === 1) {
                                document.getElementById("chartValues").innerHTML = "<table><tr><td>NDVI (Vegetation): </td><td><b>" + (this.NDVIValues[0].y).toFixed(2) + "</b></td></tr><tr><td>Urban: </td><td><b>" + (this.UrbanValues[0].y).toFixed(2) + "</b></td></tr><tr><td>NDMI (Moisture): </td><td><b>" + (this.NDMIValues[0].y).toFixed(2) + "</b></td></tr></table>";
                                domStyle.set("chartNode", "display", "none");
                                domStyle.set("legend", "display", "none");
                            } else {
                                domStyle.set("chartNode", "display", "block");
                                domStyle.set("legend", "display", "block");
                                document.getElementById("chartValues").innerHTML = "";
                                this.chart = new Chart("chartNode");
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
                                if (!this.legend)
                                    this.legend = new SelectableLegend({ chart: this.chart, horizontal: true, outline: false }, "legend");
                                else {
                                    this.legend.set("params", { chart: this.chart, horizontal: true, outline: false });
                                    this.legend.set("chart", this.chart);
                                    this.legend.refresh();
                                }
                                this.legendNumber = parseInt((this.legend._cbs[0].id).split("Box_")[1]);

                                for (var d = this.legendNumber; d < (this.legendNumber + 3); d++) {
                                    on(document.getElementById("dijit_form_CheckBox_" + d), "click", lang.hitch(this, function (e) {

                                        if (document.getElementById("dijit_form_CheckBox_" + this.legendNumber).checked)
                                            this.chart.fireEvent("NDMI Moisture", "onmouseover", this.prevMarker);
                                        if (document.getElementById("dijit_form_CheckBox_" + (this.legendNumber + 1)).checked)
                                            this.chart.fireEvent("Urban", "onmouseover", this.prevMarker);
                                        if (document.getElementById("dijit_form_CheckBox_" + (this.legendNumber + 2)).checked)
                                            this.chart.fireEvent("NDVI Vegetation", "onmouseover", this.prevMarker);

                                    }));
                                }
                                if (!v) {

                                    for (var a in this.NDVIData) {
                                        if (this.NDVIData[a].acqDate === this.orderedDates[this.slider.get("value")]) {
                                            var v = a;
                                            ;
                                            break;
                                        }
                                    }
                                }
                                this.prevMarker = v;
                                this.chart.fireEvent("NDVI Vegetation", "onmouseover", v);
                                this.chart.connectToPlot("default", lang.hitch(this, this.highlightcurrent));



                                this.chart.connectToPlot("default", lang.hitch(this, this.clickdata));
                            }
                            domConstruct.destroy("chartDialog_underlay");
                            domConstruct.destroy("timeDialog_underlay");

                            this.seclayer = this.primaryLayer.url;
                            domStyle.set("dropDownOption", "display", "none");
                            domStyle.set("dateSelectorContainer", "display", "none");
                            domStyle.set("slider", "display", "none");
                            domStyle.set("slider2", "display", "none");
                            domStyle.set("slider3", "display", "none");

                            domStyle.set("loadingts1", "display", "none");
                        }), lang.hitch(this, function (error) {
                            registry.byId("timeDialog").show();
                            domStyle.set("loadingts1", "display", "none");
                            this.hideLoading();
                        }));

                    }), lang.hitch(this, function (error) {
                        registry.byId("timeDialog").show();
                        domStyle.set("loadingts1", "display", "none");
                        this.hideLoading();
                    }));


                }
            },
            highlightcurrent: function (evt) {
                if (evt.element === "marker" && evt.type === "onmouseout") {

                    if (this.orderedDates[this.slider.get("value")] === this.NDVIData[evt.index].acqDate) {
                        if (document.getElementById("dijit_form_CheckBox_" + this.legendNumber).checked) {
                            this.chart.fireEvent("NDMI Moisture", "onmouseover", evt.index);
                            this.chart.fireEvent("NDMI Moisture", "onplotreset", evt.index);
                        }
                        if (document.getElementById("dijit_form_CheckBox_" + (this.legendNumber + 1)).checked) {
                            this.chart.fireEvent("Urban", "onmouseover", evt.index);
                            this.chart.fireEvent("Urban", "onplotreset", evt.index);
                        }
                        if (document.getElementById("dijit_form_CheckBox_" + (this.legendNumber + 2)).checked) {
                            this.chart.fireEvent("NDVI Vegetation", "onmouseover", evt.index);
                            this.chart.fireEvent("NDVI Vegetation", "onplotreset", evt.index);
                        }
                    }
                }

            },
            clickdata: function (evt) {

                var type2 = evt.type;
                if (type2 === "onclick") {
                    this.datesclick = (evt.x - 1);
                    for (var g = 0; g < this.orderedDates.length; g++) {
                        if (locale.format(new Date(this.orderedDates[g]), { selector: "date", datePattern: "dd/MM/yy" }) === locale.format(new Date(this.NDVIData[this.datesclick].acqDate), { selector: "date", datePattern: "dd/MM/yy" })) {
                            registry.byId("imageDateSelector").set("value", g);
                            this.slider.set("value", g);
                            this.sliderChange();
                            if (this.prevMarker) {
                                if (document.getElementById("dijit_form_CheckBox_" + this.legendNumber).checked)
                                    this.chart.fireEvent("NDMI Moisture", "onmouseout", this.prevMarker);
                                if (document.getElementById("dijit_form_CheckBox_" + (this.legendNumber + 1)).checked)
                                    this.chart.fireEvent("Urban", "onmouseout", this.prevMarker);
                                if (document.getElementById("dijit_form_CheckBox_" + (this.legendNumber + 2)).checked)
                                    this.chart.fireEvent("NDVI Vegetation", "onmouseout", this.prevMarker);
                            }
                            if (document.getElementById("dijit_form_CheckBox_" + this.legendNumber).checked)
                                this.chart.fireEvent("NDMI Moisture", "onmouseout", this.datesclick);
                            if (document.getElementById("dijit_form_CheckBox_" + (this.legendNumber + 1)).checked)
                                this.chart.fireEvent("Urban", "onmouseout", this.datesclick);
                            if (document.getElementById("dijit_form_CheckBox_" + (this.legendNumber + 2)).checked)
                                this.chart.fireEvent("NDVI Vegetation", "onmouseout", this.datesclick);
                            this.prevMarker = evt.x - 1;

                        }
                    }
                }
            },
            timeSliderShow: function () {



                this.primaryLayer = this.map.getLayer("primaryLayer");

                this.item = false;
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
                query.outFields = ["acquisitiondate", "groupname", "best", "cloudcover", "name"];
                if (this.map.useSecureService)
                    query.where = "(category = 1) AND (cloudCover <=" + registry.byId("cloudFilter").get("value") + ")";
                else
                    query.where = "(category = 1) AND (cloudCover <=" + registry.byId("cloudFilter").get("value") + ") AND (datatype_format = 'Cloned')";
                query.orderByFields = ["acquisitiondate"];
                query.returnGeometry = true;


                var queryTask = new QueryTask(this.primaryLayer.url);
                queryTask.execute(query, lang.hitch(this, function (result) {

                    if (result.features.length === 0) {
                        html.set(this.cloudFilterError, "No scene.Select other option.");
                        html.set(this.temporalpro, "");
                        this.noSceneFlag = true;
                    } else {
                        html.set(this.cloudFilterError, "");
                        html.set(this.temporalpro, "Pick a point on the map to get the temporal profile for that point.");
                        this.noSceneFlag = false;
                    }
                    this.orderedFeatures = result.features;
                    this.orderedDates = [];
                    for (var a in this.orderedFeatures) {
                        if (parseInt(a) < 1)
                            this.orderedDates.push(this.orderedFeatures[a].attributes["acquisitiondate"]);
                        else {
                            var tempValue = locale.format(new Date(this.orderedDates[this.orderedDates.length - 1]), { selector: "date", formatLength: "short" });
                            var tempCurrentValue = locale.format(new Date(this.orderedFeatures[a].attributes["acquisitiondate"]), { selector: "date", formatLength: "short" });
                            if (tempValue !== tempCurrentValue)
                                this.orderedDates.push(this.orderedFeatures[a].attributes["acquisitiondate"]);

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
                        labels[i] = locale.format(new Date(this.orderedDates[i]), { selector: "date", datePattern: "dd/MM/yy" }); //formatLength: "short"});
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

                    registry.byId("imageDateSelector").removeOption(registry.byId("imageDateSelector").getOptions());
                    for (var v = this.orderedDates.length - 1; v >= 0; v--) {
                        registry.byId("imageDateSelector").addOption({ label: locale.format(new Date(this.orderedDates[v]), { selector: "date", formatLength: "long" }), value: "" + v + "" });

                    }

                    if (this.appScene) {
                        if (this.saveValue) {

                            for (var f in this.orderedDates) {

                                if (parseInt(this.appScene) === this.orderedDates[f]) {

                                    var ind = f;
                                    this.appScene = null;
                                    break;
                                }
                            }
                        } else {
                            for (var f in this.orderedDates) {

                                if (parseInt(this.appScene) === this.orderedDates[f]) {
                                    var ind = f;
                                    this.appScene = null;
                                    break;
                                }
                            }
                        }
                        if (!ind) {
                            this.saveValue = false;
                            this.changeOn = false;
                            this.changeValue = false;
                            html.set(this.errorDiv, "Access Denied. Please log in to ArcGIS Online to view the image.");
                            setTimeout(lang.hitch(this, function () {
                                html.set(this.errorDiv, "");
                            }), 5000);
                        }
                    } else {
                        this.best = [];
                        for (var r = 0; r < this.orderedFeatures.length; r++) {
                            this.best.push(this.orderedFeatures[r].attributes.best);
                        }
                        this.best.sort(function (a, b) {
                            return (a - b);
                        });

                        var index = this.best[0];

                        for (var z in this.orderedFeatures) {
                            if (this.orderedFeatures[z].attributes.best === index) {
                                for (var x in this.orderedDates) {
                                    if (this.orderedDates[x] === this.orderedFeatures[z].attributes.acquisitiondate) {
                                        var ind = x;
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
                                var ind = i;
                            }
                        }
                    }
                    if (!ind)
                        ind = this.orderedDates.length - 1;
                    this.timeDisplayFormat2();
                    if (this.orderedDates[ind]) {
                        registry.byId("imageDateSelector").set("value", ind);
                        this.slider.set("value", ind);
                        this.sliderChange();
                        html.set(this.dateRange, "Image Date: <b>" + locale.format(new Date(this.orderedDates[ind]), { selector: "date", formatLength: "long" }) + "</b>");
                    } else
                        html.set(this.dateRange, "");
                }), lang.hitch(this, function (error) {

                    try {
                        this.best = [];
                        for (var r = 0; r < this.orderedFeatures.length; r++) {
                            this.best.push(this.orderedFeatures[r].attributes.best);
                        }
                        this.best.sort(function (a, b) {
                            return (a - b);
                        });
                        var index = this.best[0];
                        for (var z in this.orderedFeatures) {
                            if (this.orderedFeatures[z].attributes.best === index) {
                                for (var x in this.orderedDates) {
                                    if (this.orderedDates[x] === this.orderedFeatures[z].attributes.acquisitiondate) {
                                        var ind = x;
                                        break;
                                    }
                                }

                                break;
                            }

                        }
                        this.timeDisplayFormat2();
                        this.hideLoading();
                        this.slider.set("value", ind);
                        registry.byId("imageDateSelector").set("value", ind);
                        this.sliderChange();
                        html.set(this.dateRange, "Image Date: <b>" + locale.format(new Date(this.orderedDates[ind]), { selector: "date", formatLength: "long" }) + "</b>");
                    } catch (e) {

                        this.timeDisplayFormat2();
                        this.hideLoading();
                        this.slider.set("value", 0);
                        registry.byId("imageDateSelector").set("value", 0);
                        this.sliderChange();
                    }

                }));


            },
            timeDisplayFormat2: function () {
                if (!domClass.contains(registry.byId("dropDownDateList").domNode, "dropDownSelected")) {
                    domStyle.set(this.dateRange, "display", "inline-block");
                    domStyle.set("dropDownOption", "display", "none");
                    if (this.orderedFeatures.length <= 1) {
                        domStyle.set("slider", "display", "none");
                        domStyle.set("slider2", "display", "none");
                        domStyle.set("slider3", "display", "none");
                    } else {

                        domStyle.set("slider", "display", "block");
                        domStyle.set("slider2", "display", "block");
                        domStyle.set("slider3", "display", "block");

                    }
                } else {
                    domStyle.set(this.dateRange, "display", "none");

                    domStyle.set("slider", "display", "none");
                    domStyle.set("slider2", "display", "none");
                    domStyle.set("slider3", "display", "none");

                    domStyle.set("dropDownOption", "display", "inline-block");
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
                // if (!domClass.contains(registry.byId("dropDownDateList").domNode, "dropDownSelected")) {
                this.primaryLayer = this.map.getLayer("primaryLayer");

                this.previousDateOnTimeSlider = this.orderedDates[this.slider.get("value")];

                var featureSelect = [];
                this.featureIds = [];
                this.sliderValue = this.slider.get("value");
                if (this.sliderValue !== null) {
                    if (!domClass.contains(registry.byId("dropDownDateList").domNode, "dropDownSelected"))
                        registry.byId("imageDateSelector").set("value", this.sliderValue);
                    var aqDate = this.orderedDates[this.slider.get("value")];
                    if (aqDate)
                        html.set(this.dateRange, "Image Date: <b>" + locale.format(new Date(aqDate), { selector: "date", formatLength: "long" }) + "</b>");
                    if (this.secondaryRange.innerHTML.includes("<b>") && this.dateRange.innerHTML.split("<b>")[1].split("</b>")[0] !== this.secondaryRange.innerHTML.split("<b>")[1].split("</b>")[0]) {
                        domStyle.set(this.secondaryRange, "display", "inline-block");
                        domStyle.set(this.dateRange, "font-size", "11px");
                    } else {
                        domStyle.set(this.secondaryRange, "display", "none");
                        domStyle.set(this.dateRange, "font-size", "");
                    }
                    for (var c in this.orderedFeatures) {

                        var tempValue = locale.format(new Date(this.orderedDates[this.sliderValue]), { selector: "date", formatLength: "short" });
                        var tempCurrentValue = locale.format(new Date(this.orderedFeatures[c].attributes["acquisitiondate"]), { selector: "date", formatLength: "short" });

                        if (tempValue === tempCurrentValue) {
                            featureSelect.push(this.orderedFeatures[c]);
                            this.featureIds.push(this.orderedFeatures[c].attributes.objectid);

                        }

                    }
                    var geometry = [];
                    for (var a in featureSelect) {
                        geometry.push(featureSelect[a].geometry);
                    }
                    var combinedGeometry = geometryEngine.union(geometry);
                    this.lockId = combinedGeometry;//this.orderedFeatures[this.slider.get("value")].attributes.OBJECTID;
                    var mr = new MosaicRule();
                    mr.method = MosaicRule.METHOD_LOCKRASTER;
                    mr.ascending = true;
                    mr.operation = "MT_FIRST";
                    mr.lockRasterIds = this.featureIds;//[this.orderedFeatures[this.sliderValue].attributes.OBJECTID];
                    registry.byId("currentOBJECTID").set("value", this.orderedDates[this.sliderValue]);
                    registry.byId("primarySceneId").set("value", this.orderedDates[this.sliderValue]);//this.orderedFeatures[this.sliderValue].attributes.Name);
                    this.primaryLayer.setMosaicRule(mr);
                    this.mosaicBackup = this.primaryLayer.mosaicRule;
                    dom.byId("dateDisplay").innerHTML = "&nbsp;&nbsp;Imagery Date:&nbsp;" + locale.format(new Date(aqDate), { selector: "date", formatLength: "long" });
                    if (this.map.getLayer("secondaryLayer")) {
                        registry.byId("intersectingPolygon").set("value", JSON.stringify(geometryEngine.intersect(this.intersectGeometry, combinedGeometry)));
                        var valuePolygn = JSON.parse(registry.byId("intersectingPolygon").get("value"));
                        valuePolygn.cache = undefined;
                        registry.byId("intersectingPolygon").set("value", JSON.stringify(valuePolygn));
                    }



                }
                //}
            },
            selectorChange: function () {
                if (domClass.contains(registry.byId("dropDownDateList").domNode, "dropDownSelected")) {
                    this.primaryLayer = this.map.getLayer("primaryLayer");
                    var selector = registry.byId("imageDateSelector");
                    this.previousDateOnTimeSlider = this.orderedDates[selector.get("value")];


                    this.selectorValue = selector.get("value");
                    if (this.selectorValue !== null) {
                        this.slider.set("value", this.selectorValue);
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
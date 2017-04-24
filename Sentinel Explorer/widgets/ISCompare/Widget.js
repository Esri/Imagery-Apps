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
    'jimu/BaseWidget', "./resourceLoad.js"

],
        function (
                declare,
                _WidgetsInTemplateMixin,
                template,
                BaseWidget, resourceLoad
                ) {
            var resource = new resourceLoad({resource: "compare"});
            var plugins = resource.load("compare");
            var popup = plugins[0],
                    registry = plugins[1],
                    lang = plugins[2],
                    dom = plugins[3], on = plugins[4],
                    domConstruct = plugins[5],
                    LayerSwipe = plugins[6], WidgetManager = plugins[7], domClass = plugins[8], domStyle = plugins[9];
            var wm = WidgetManager.getInstance();
            var clazz = declare([BaseWidget, _WidgetsInTemplateMixin], {
                templateString: template,
                name: 'ISCompare',
                baseClass: 'jimu-widget-ISCompare',
                primaryLayer: null,
                secondaryLayer: null,
                startup: function () {
                    this.inherited(arguments);
                },
                postCreate: function () {

                },
                onOpen: function () {

                    if (registry.byId("tooltipDialogIntro") && registry.byId("tooltipDialogIntro").state === "open" && registry.byId("tutorialStage").get("value") === "15") {
                        var y = document.getElementsByClassName("icon-node");
                        var tooltipTemp = registry.byId("tooltipDialogIntro");
                        popup.close(tooltipTemp);
                        y[1].style.pointerEvents = "none";
                        tooltipTemp.set("content", "<p style='text-align: justify;'><span style='color:orange;font-weight:bolder;'>Move the blue swipe back and forth</span> to find differences in the two images.<div id='continueComment' style='color:orange;font-weight:bolder;cursor: pointer;'>Click here to continue.</div></p>");
                        on(dom.byId("continueComment"), "click", lang.hitch(this, function () {
                            var tooltipTemp = registry.byId("tooltipDialogIntro");
                            if (registry.byId("tutorialStage").get("value") === "16") {
                                tooltipTemp.set("content", "<p style='text-align: justify;'>The <span style='color:orange;font-weight:bolder;'>Change Detection tool</span> can calculate changes in vegetation health (NDVI or SAVI), burned area (Burn Index), water content (Water Index), and urban area (Urban Index).<br/><span style='font-weight: bolder;color: orange;'>Click </span><img src='./widgets/ChangeDetection/images/change.gif' height='15'/> to compute change between your two images.</p>");
                                popup.open({
                                    popup: tooltipTemp,
                                    orient: ["after-centered"],
                                    around: y[3],
                                    onClose: lang.hitch(this, function () {
                                        domStyle.set(tooltipTemp._popupWrapper, "display", "block");
                                    })
                                });
                                domStyle.set(tooltipTemp.connectorNode, "top", "0px");
                                registry.byId("tutorialStage").set("value", "17");
                                y[1].style.pointerEvents = "none";
                                y[3].style.pointerEvents = "auto";
                            }
                        }));


                        popup.open({
                            popup: tooltipTemp,
                            orient: ["after-centered"],
                            around: y[1],
                            onClose: lang.hitch(this, function () {
                                domStyle.set(tooltipTemp._popupWrapper, "display", "block");
                            })
                        });
                        domStyle.set(tooltipTemp.connectorNode, "top", "0px");
                        registry.byId("tutorialStage").set("value", "16");

                    }
                    this.secondaryLayerHandler = this.map.on("update-end", lang.hitch(this, this.refreshData));
                    if (this.map.getLayer("secondaryLayer") && this.map.getLayer("secondaryLayer").mosaicRule !== this.map.getLayer("primaryLayer").mosaicRule)
                        this.map.getLayer("secondaryLayer").show();
                    domConstruct.place('<div id="swipeDiv"></div>', "map", "first");

                    this.layerForSwipe = (registry.byId("layerIdAdd") && this.map.getLayer(registry.byId("layerIdAdd").get("value"))) ? this.map.getLayer(registry.byId("layerIdAdd").get("value")) : this.map.getLayer("primaryLayer");
                    this.layerSwipe = new LayerSwipe({
                        layers: [this.layerForSwipe],
                        type: "vertical",
                        map: this.map,
                        left: 200,
                        invertPlacement: true
                    }, "swipeDiv");
                    this.layerSwipe.startup();

                    this.refreshData();

                },
                refreshData: function () {
                    var getLayerProperties = (registry.byId("layerIdAdd") && this.map.getLayer(registry.byId("layerIdAdd").get("value"))) ? this.map.getLayer(registry.byId("layerIdAdd").get("value")) : this.map.getLayer("primaryLayer");

                    this.layerSwipe.layers[0] = getLayerProperties;
                    if (this.map.getLayer("secondaryLayer")) {
                        if ((getLayerProperties.mosaicRule.method === "esriMosaicLockRaster" && getLayerProperties.mosaicRule.lockRasterIds[0] !== this.map.getLayer("secondaryLayer").mosaicRule.lockRasterIds[0]) || wm.getWidgetById("_8").storyModeOn)
                            this.map.getLayer("secondaryLayer").show();
                        else {
                            this.map.getLayer("secondaryLayer").hide();
                        }

                    }
                    if (dom.byId("dateDisplay").innerHTML.split(":&nbsp;")[1] !== dom.byId("dateSecondary").innerHTML.split(":&nbsp;")[1])
                        domStyle.set(dom.byId("dateSecondary"), "display", "inline-block");
                    else
                        domStyle.set(dom.byId("dateSecondary"), "display", "none");
                },
                onClose: function () {
                    if (this.layerSwipe)
                        this.layerSwipe.destroy();
                    this.layerSwipe = null;
                    if (this.map.getLayer("secondaryLayer"))
                        this.map.getLayer("secondaryLayer").hide();
                    if (this.secondaryLayerHandler)
                    {
                        this.secondaryLayerHandler.remove();
                        this.secondaryLayerHandler = null;
                    }
                    domStyle.set(dom.byId("dateSecondary"), "display", "none");
                }


            });

            clazz.hasLocale = false;
            clazz.hasSettingPage = false;
            clazz.hasSettingUIFile = false;
            clazz.hasSettingLocale = false;
            clazz.hasSettingStyle = false;
            return clazz;
        });
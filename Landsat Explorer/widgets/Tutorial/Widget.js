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
    "dojo/on",
    "dojo/_base/lang",
    'dojo/dom-class',
    "dojo/dom-construct",
    "dojo/dom",
    "dojo/html",
    "dojo/dom-style",
    "dijit/popup",
    "dijit/registry",
    "jimu/PanelManager", "dijit/TooltipDialog",
],
        function (
                declare,
                _WidgetsInTemplateMixin,
                template,
                BaseWidget,
                on,
                lang,
                domClass,
                domConstruct,
                dom, html, domStyle,
                popup, registry, PanelManager, TooltipDialog
                ) {
            var pm = PanelManager.getInstance();
            var clazz = declare([BaseWidget, _WidgetsInTemplateMixin], {
                templateString: template,
                name: 'Tour',
                baseClass: 'jimu-widget-Tour',
                hideFlag: true,
                startup: function () {
                    this.inherited(arguments);
                },
                postCreate: function () {
                    window.addEventListener("resize", lang.hitch(this, this.resizeDialog));
                    this.resizeDialog();
                    this.myTooltipDialog = new TooltipDialog({
                        id: "tooltipDialogIntro",
                        style: "width: 300px;display:inline-block;outline:transparent;z-index:999;",
                        content: "Click on Renderer to select different renderers"
                    });

                    registry.byId("startButton").on("click", lang.hitch(this, function () {
                        this.hideFlag = false;
                        var x = document.getElementsByClassName("icon-node");
                        for (var a = 0; a < x.length; a++) {
                            if (a !== 9) {
                                x[a].style.pointerEvents = 'none';
                            }

                        }
                        var chapterValue = parseInt(registry.byId("chapterSelect").get("value"));
                        if (chapterValue === 0) {
                            var tutorialStageValue = 0;
                            var content = "<p style='text-align:justify;'>Each viewing option will incorporate different satellite bands to highlight different land cover features.<br /><span style='font-weight: bolder;color: orange;'>Click on <img src='./widgets/ISLayers/images/svg/buildYourOwn24.svg' height='15' /></span> to select different renderers.</p>";
                            var aroundNode = dom.byId('bandCombination');
                            dom.byId("bandCombination").style.pointerEvents = "auto";
                        } else if (chapterValue === 1) {
                            var tutorialStageValue = 8;
                            var content = "<p style='text-align: justify;'>The <span style='color:orange;font-weight:bolder;'>Identify</span> tool displays current image attributes, like Scene ID, Acquisition Date, and Cloud Cover.<br /><span style='font-weight: bolder;color: orange;'>Click on</span> <img src='./widgets/ISLayers/images/svg/identify24.svg' height='15' /> for the Identify tool.</p>";
                            var aroundNode = x[4];
                            dom.byId("bandCombination").style.pointerEvents = "none";
                            x[4].style.pointerEvents = "auto";
                        } else if (chapterValue === 2) {
                            var tutorialStageValue = 11;
                            var content = "<p style='text-align:justify;'>You can also see how an area of interest changes over time.<br/><span style='font-weight: bolder;color: orange;'>Click on <img src='./widgets/ISLayers/images/svg/time24.svg' height='15' /> to turn on Time Selector.</span></p>";
                            var aroundNode = x[0];
                            x[0].style.pointerEvents = "auto";
                            dom.byId("bandCombination").style.pointerEvents = "none";
                        } else if (chapterValue === 3) {
                            var tutorialStageValue = 24;
                            var content = "<p style='text-align:justify;'>The <span style='color:orange;font-weight:bolder;'>Mask</span> tool creates a masked layer based on the index selected.<br/><span style='font-weight: bolder;color: orange;'>Click on <img src='./widgets/Mask/images/change.gif' height='15'/></span> to build a mask.</p>";
                            var aroundNode = x[2];
                            x[2].style.pointerEvents = "auto";
                            dom.byId("bandCombination").style.pointerEvents = "none";
                        } else if (chapterValue === 4) {
                            var tutorialStageValue = 27;
                            var content = "<p style='text-align:justify;'>The top layer can be saved on ArcGIS Online to reference later.<br /><span style='font-weight: bolder;color: orange;'>Click on <img src='./widgets/Save/images/icon.png' height='15' /></span> to save your mask layer.</p>";
                            var aroundNode = x[6];
                            x[6].style.pointerEvents = "auto";
                            dom.byId("bandCombination").style.pointerEvents = "none";
                        } else if (chapterValue === 5) {
                            var tutorialStageValue = 29;
                            var content = "<p style='text-align:justify;'>The <span style='color:orange;font-weight:bolder;'>Export tool</span> allows you to extract the map as a local file. By default, the exported map is clipped to what is visible in the app. <br /><span style='font-weight: bolder;color: orange;'>Click on <img src='./widgets/ExportFunction/images/icon.png' height='15' /></span> to download the top layer of your current map.</p>";
                            var aroundNode = x[7];
                            x[7].style.pointerEvents = "auto";
                            dom.byId("bandCombination").style.pointerEvents = "none";
                        } else if (chapterValue === 6) {
                            var tutorialStageValue = 32;
                            var content = "<p style='text-align:justify;'>You can also add or remove data from ArcGIS Online using the Add Data tool. <span style='color:orange;font-weight:bolder;'>Click <img src='./widgets/AddData/images/icon.png' height='15'/></span> to open the Add Data tool.</p>";
                            var aroundNode = x[5];
                            dom.byId("bandCombination").style.pointerEvents = "none";
                            x[5].style.pointerEvents = "auto";
                        }

                        this.myTooltipDialog.set("content", content);
                        registry.byId("tourDialog").hide();
                        popup.open({
                            popup: this.myTooltipDialog,
                            orient: ["after-centered"],
                            around: aroundNode,
                            onClose: lang.hitch(this, function () {
                                domStyle.set(this.myTooltipDialog._popupWrapper, "display", "block");
                            })
                        });
                        this.myTooltipDialog.state = "open";
                        domStyle.set(this.myTooltipDialog.connectorNode, "top", "0px");
                        registry.byId("tutorialStage").set("value", tutorialStageValue);
                    }));
                    dojo.connect(registry.byId("tourDialog"), "hide", lang.hitch(this, function () {
                        if (this.hideFlag)
                            pm.closePanel("_50_panel");
                    }));
                },
                resizeDialog: function () {
                    if (window.innerWidth < 620) {
                        domStyle.set("tourDialog", "width", "204px");
                        domStyle.set("tourDialog", "font-size", "7px");
                        domStyle.set(registry.byId("chapterSelect").domNode, "height", "10px");
                    } else if (window.innerWidth < 850) {
                        domStyle.set("tourDialog", "width", "300px");
                        domStyle.set("tourDialog", "font-size", "9px");
                        domStyle.set(registry.byId("chapterSelect").domNode, "height", "12px");
                    } else {
                        domStyle.set("tourDialog", "width", "390px");
                        domStyle.set("tourDialog", "font-size", "12px");
                        domStyle.set(registry.byId("chapterSelect").domNode, "height", "16px");
                    }
                },
                onOpen: function () {

                    var x = document.getElementsByClassName("icon-node");
                    if (domClass.contains(x[5], "jimu-state-selected"))
                        pm.closePanel("_70_panel");
                    else if (domClass.contains(x[10], "jimu-state-selected"))
                        pm.closePanel("_22_panel");
                    else if (domClass.contains(x[7], "jimu-state-selected"))
                        pm.closePanel("_19_panel");
                    else if (registry.byId("saveDialog") && registry.byId("saveDialog").open)
                        pm.closePanel("_20_panel");
                    else if (domClass.contains(x[4], "jimu-state-selected"))
                        pm.closePanel("widgets_Identify_Widget_14_panel");
                    if (domClass.contains(x[1], "jimu-state-selected"))
                        x[1].click(); // pm.closePanel("_30_panel");
                    if (domClass.contains(x[2], "jimu-state-selected") || (registry.byId("maskDialog") && registry.byId("maskDialog").open) || (dom.byId("minimizeButton") && domStyle.get("minimizeButton", "display") === "block"))
                        x[2].click();//pm.closePanel("_40_panel");
                    else if (domClass.contains(x[3], "jimu-state-selected") || registry.byId("changeDetectionDialog") && registry.byId("changeDetectionDialog").open || (dom.byId("minimizeChange") && domStyle.get("minimizeChange", "display") === "block"))
                        x[3].click(); //pm.closePanel("_28_panel");
                    if (domClass.contains(x[0], "jimu-state-selected") || (this.map.getLayer("primaryLayer") && this.map.getLayer("primaryLayer").mosaicRule && this.map.getLayer("primaryLayer").mosaicRule.method === "esriMosaicLockRaster"))
                        x[0].click();
                    if (this.map.getLayer("secondaryLayer")) {
                        if (this.map.getLayer("secondaryLayer").updating) {
                            this.map.getLayer("secondaryLayer").suspend();
                        }
                        this.map.removeLayer(this.map.getLayer("secondaryLayer"));
                        html.set(dom.byId("dateSecondary"), "");
                    }
                    if (registry.byId("bandCombinationDialog").open) {
                        registry.byId("bandCombinationDialog").hide();
                    }
                    if (registry.byId("bandComboList").get("value") !== "Agriculture with DRA")
                        registry.byId("bandComboList").set("value", "Agriculture with DRA");
                    if (registry.byId("changeMode"))
                        registry.byId("changeMode").set("value", "Image");
                    registry.byId("tourDialog").show();
                    domConstruct.destroy("tourDialog_underlay");
                },
                onClose: function () {
                    registry.byId("tutorialStage").set("value", "");
                    var tooltipTemp = registry.byId("tooltipDialogIntro");
                    tooltipTemp.set("content", "");
                    tooltipTemp.state = "closed";
                    domStyle.set("startTour", "display", "block");

                    var x = document.getElementsByClassName("icon-node");
                    for (var a = 0; a < x.length; a++) {
                        if (a !== 9) {
                            x[a].style.pointerEvents = 'auto';
                        }

                    }
                    dom.byId("bandCombination").style.pointerEvents = "auto";
                    if (domClass.contains(x[5], "jimu-state-selected"))
                        pm.closePanel("_70_panel");
                    else if (domClass.contains(x[10], "jimu-state-selected"))
                        pm.closePanel("_22_panel");
                    else if (domClass.contains(x[7], "jimu-state-selected"))
                        pm.closePanel("_19_panel");
                    else if (registry.byId("saveDialog") && registry.byId("saveDialog").open)
                        pm.closePanel("_20_panel");
                    else if (domClass.contains(x[4], "jimu-state-selected"))
                        pm.closePanel("widgets_Identify_Widget_14_panel");
                    if (domClass.contains(x[1], "jimu-state-selected"))
                        x[1].click();   // pm.closePanel("_30_panel");
                    if (domClass.contains(x[2], "jimu-state-selected") || (registry.byId("maskDialog") && registry.byId("maskDialog").open) || (dom.byId("minimizeButton") && domStyle.get("minimizeButton", "display") === "block"))
                        x[2].click();//pm.closePanel("_40_panel");
                    else if (domClass.contains(x[3], "jimu-state-selected") || registry.byId("changeDetectionDialog") && registry.byId("changeDetectionDialog").open || (dom.byId("minimizeChange") && domStyle.get("minimizeChange", "display") === "block"))
                        x[3].click();//pm.closePanel("_28_panel");
                    if (dom.byId("minimizeTimeButton"))
                        dom.byId("minimizeTimeButton").style.pointerEvents = "auto";
                    if (dom.byId("minimizeButton"))
                        dom.byId("minimizeButton").style.pointerEvents = "auto";
                    if (registry.byId("markedAreas"))
                        registry.byId("markedAreas").set("checked", false);
                    if (domClass.contains(x[0], "jimu-state-selected") || (this.map.getLayer("primaryLayer") && this.map.getLayer("primaryLayer").mosaicRule && this.map.getLayer("primaryLayer").mosaicRule.method === "esriMosaicLockRaster"))
                        x[0].click();
                    if (this.map.getLayer("secondaryLayer")) {
                        if (this.map.getLayer("secondaryLayer").updating) {
                            this.map.getLayer("secondaryLayer").suspend();
                        }
                        this.map.removeLayer(this.map.getLayer("secondaryLayer"));
                        html.set(dom.byId("dateSecondary"), "");
                    }
                    if (registry.byId("bandCombinationDialog").open) {
                        registry.byId("bandCombinationDialog").hide();
                    }
                    if (registry.byId("bandComboList").get("value") !== "Agriculture with DRA")
                        registry.byId("bandComboList").set("value", "Agriculture with DRA");
                    if (registry.byId("changeMode"))
                        registry.byId("changeMode").set("value", "Image");
                    popup.close(tooltipTemp);

                    if (registry.byId("tourDialog").open)
                        registry.byId("tourDialog").hide();
                    if (tooltipTemp._popupWrapper)
                        domStyle.set(tooltipTemp._popupWrapper, "display", "none");
                }
            });
            clazz.hasLocale = false;
            return clazz;
        });
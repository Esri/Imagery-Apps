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
    "dijit/registry",
    "dojo/_base/lang",
    "dojo/dom",
    "esri/layers/RasterFunction",
    "dojo/html",
    'dojo/dom-class',
    "dojo/date/locale", "dijit/popup",
    "dojo/dom-construct",
    "esri/arcgis/Portal", "dojo/i18n!esri/nls/jsapi",
    "dojo/dom-style",
    "dojo/_base/connect",
    "jimu/PanelManager",
    "esri/request",
    "dijit/form/SimpleTextarea",
],
        function (
                declare,
                _WidgetsInTemplateMixin,
                template,
                BaseWidget,
                registry,
                lang,
                dom,
                RasterFunction,
                html,
                domClass, locale, popup,
                domConstruct, arcgisPortal, bundle,
                domStyle,
                connect, PanelManager, esriRequest,
                SimpleTextarea
                ) {
            var pm = PanelManager.getInstance();
            var clazz = declare([BaseWidget, _WidgetsInTemplateMixin], {
                templateString: template,
                name: 'Save',
                baseClass: 'jimu-widget-Save',
                primaryLayer: null,
                secondaryLayer: null,
                firstMosaic: null,
                secondMosaic: null,
                startup: function () {
                    this.inherited(arguments);
                    domConstruct.place('<img id="loadingSave" style="position: absolute;top:0;bottom: 0;left: 0;right: 0;margin:auto;z-index:100;" src="' + require.toUrl('jimu') + '/images/loading.gif">', this.domNode);
                    this.hideLoading();
                },
                onOpen: function () {

                    if (domClass.contains(dom.byId("bandCombination"), "selected"))
                        dom.byId("bandCombination").click();
                    if (registry.byId("maskDialog") && registry.byId("maskDialog").open)
                        registry.byId("maskDialog").hide();
                    if (registry.byId("changeDetectionDialog") && registry.byId("changeDetectionDialog").open)
                        registry.byId("changeDetectionDialog").hide();
                    if (registry.byId("timeDialog") && registry.byId("timeDialog").open)
                        registry.byId("timeDialog").hide();
                    var x = document.getElementsByClassName("icon-node");
                    html.set(this.successNotification, "");
                    for (var a = this.map.layerIds.length - 1; a >= 0; a--) {
                        if (this.map.getLayer(this.map.layerIds[a]).url.indexOf("ImageServer") !== -1) {
                            var resultLayerProperties = this.map.getLayer(this.map.layerIds[a]);
                            break;
                        }
                    }

                    var renderer = dom.byId("rendererInformation").innerHTML.split(":&nbsp;")[1];
                    if (resultLayerProperties.id === "resultLayer") {

                        if (domClass.contains(x[3], "jimu-state-selected")) {
                            if (locale.format(new Date(dom.byId("dateDisplay").innerHTML.split(":&nbsp;")[1]), {selector: "date", datePattern: "yyyy/MM/dd"}) > locale.format(new Date(dom.byId("dateSecondary").innerHTML.split(":&nbsp;")[1]), {selector: "date", datePattern: "yyyy/MM/dd"}))
                                renderer = "Change in " + registry.byId("changeOptions").get("value") + " from " + dom.byId("dateSecondary").innerHTML.split(":&nbsp;")[1] + " to " + dom.byId("dateDisplay").innerHTML.split(":&nbsp;")[1] + " in " + registry.byId("changeMode").get("value") + " mode";
                            else
                                renderer = "Change in " + registry.byId("changeOptions").get("value") + " from " + dom.byId("dateDisplay").innerHTML.split(":&nbsp;")[1] + " to " + dom.byId("dateSecondary").innerHTML.split(":&nbsp;")[1] + " in " + registry.byId("changeMode").get("value") + " mode";

                        } else
                            renderer = registry.byId("indexList").get("value") + " Mask";
                    }
                    registry.byId("itemTitle").set("value", "Sentinel layer - " + locale.format(new Date(), {selector: "date", datePattern: "yyyy/MM/dd"}) + " - " + renderer);
                    registry.byId("itemDescription").set("value", "Sentinel layer with " + renderer + " applied on it.");

                    registry.byId("saveDialog").show();

                    domStyle.set("saveDialog", "top", "100px");
                    domStyle.set("saveDialog", "left", "160px");
                    domConstruct.destroy("saveDialog_underlay");
                    if (registry.byId("tooltipDialogIntro") && registry.byId("tooltipDialogIntro").state === "open" && registry.byId("tutorialStage").get("value") === "27")
                    {
                        popup.close(registry.byId("tooltipDialogIntro"));
                        if (dom.byId("minimizeButton"))
                            dom.byId("minimizeButton").style.pointerEvents = "none";
                        var tooltipTemp = registry.byId("tooltipDialogIntro");
                        tooltipTemp.set("content", "Complete the dialog and click <span style='color:orange;font-weight:bolder;'>'Submit.'</span>");
                        popup.open({
                            parent: registry.byId("saveDialog"),
                            popup: tooltipTemp,
                            orient: ["below"],
                            around: registry.byId("submitBtn").domNode
                        });
                        domStyle.set(tooltipTemp.connectorNode, "top", "0px");
                        registry.byId("tutorialStage").set("value", "28");
                    }
                    registry.byId("saveDialog").connect(registry.byId("saveDialog"), "hide", lang.hitch(this, function (e) {
                        pm.closePanel("_20_panel");
                    }));
                    connect.subscribe("dateDetectionColor", lang.hitch(this, function (flag) {
                        this.flag = flag.flag;
                    }));
                },
                postCreate: function () {

                    registry.byId("submitBtn").on("click", lang.hitch(this, this.saveResultToArcGIS));
                },
                onClose: function () {
                    if (registry.byId("saveDialog").open)
                        registry.byId("saveDialog").hide();

                },
                saveResultToArcGIS: function () {
                    if (registry.byId("tooltipDialogIntro") && registry.byId("tooltipDialogIntro").state === "open" && registry.byId("tutorialStage").get("value") === "28") {

                        var y = document.getElementsByClassName("icon-node");
                        var tooltipTemp = registry.byId("tooltipDialogIntro");

                        popup.close(tooltipTemp);
                        tooltipTemp.set("content", "<p style='text-align:justify;'>The <span style='color:orange;font-weight:bolder;'>Export tool</span> allows you to extract the map as a local file. By default, the exported map is clipped to what is visible in the app. <br /><span style='font-weight: bolder;color: orange;'>Click on <img src='./widgets/ExportFunction/images/icon.png' height='15' /></span> to download the top layer of your current map.</p>");
                        popup.open({
                            popup: tooltipTemp,
                            orient: ["after-centered"],
                            around: y[7],
                            onClose: lang.hitch(this, function () {
                                domStyle.set(tooltipTemp._popupWrapper, "display", "block");
                            })
                        });
                        domStyle.set(tooltipTemp.connectorNode, "top", "0px");
                        y[7].style.pointerEvents = "auto";
                        y[6].style.pointerEvents = "none";
                        registry.byId("tutorialStage").set("value", "29");
                    }
                    this.showLoading();
                    for (var a = this.map.layerIds.length - 1; a >= 0; a--) {
                        if (this.map.getLayer(this.map.layerIds[a]).url.indexOf("ImageServer") !== -1) {
                            var resultLayerProperties = this.map.getLayer(this.map.layerIds[a]);
                            break;
                        }
                    }
                    var extent = this.map.geographicExtent.xmin + "," + this.map.geographicExtent.ymin + "," + this.map.geographicExtent.xmax + "," + this.map.geographicExtent.ymax;
                    var spatialReference = this.map.extent.spatialReference.wkid;
                    var mosaicRule = resultLayerProperties.mosaicRule;
                    if (mosaicRule)
                        mosaicRule = mosaicRule.toJson();
                    if (resultLayerProperties.bandIds)
                        var bandIds = [resultLayerProperties.bandIds];
                    else
                        var bandIds = [];
                    if (resultLayerProperties.id === "resultLayer") {

                        if (resultLayerProperties.renderingRule.rasterFunction)
                            var rendererTemp = resultLayerProperties.renderingRule.rasterFunction;
                        else
                            var rendererTemp = resultLayerProperties.renderingRule.functionName;

                        if (registry.byId("changeMaskDetect").get("value") === "change") {
                            var modeValue = registry.byId("changeMode").get("value");
                            if (modeValue === "Image")
                                var renderingRule = resultLayerProperties.renderingRule.toJson();
                            else if (modeValue === "difference") {
                                var remap = new RasterFunction();
                                remap.functionName = "Remap";
                                var remapArg = {};
                                remapArg.InputRanges = [-1, registry.byId("horiSliderDecrease").get("value"), registry.byId("horiSliderInclusion").get("value"), 1];
                                remapArg.OutputValues = [0, 1];
                                remapArg.AllowUnmatched = false;
                                remapArg.Raster = resultLayerProperties.renderingRule;
                                remap.functionArguments = remapArg;
                                remap.outputPixelType = "U8";
                                var colormap = new RasterFunction();
                                colormap.functionName = "Colormap";
                                colormap.outputPixelType = "U8";
                                var colormapArg = {};
                                if (registry.byId("changeOptions").get("value") === "BurnIndex")
                                    colormapArg.Colormap = [[0, 255, 69, 0], [1, 0, 252, 0]];
                                else
                                    colormapArg.Colormap = [[0, 255, 0, 255], [1, 0, 252, 0]];
                                colormapArg.Raster = remap;
                                colormap.functionArguments = colormapArg;
                                var renderingRule = colormap.toJson();
                            } else {
                                if (rendererTemp === "CompositeBand") {
                                    var raster1 = resultLayerProperties.renderingRule.functionArguments.Rasters[0];
                                    var raster2 = resultLayerProperties.renderingRule.functionArguments.Rasters[1];
                                } else
                                {
                                    var raster1 = resultLayerProperties.renderingRule.functionArguments.Raster.functionArguments.Rasters[0];
                                    var raster2 = resultLayerProperties.renderingRule.functionArguments.Raster.functionArguments.Rasters[1];
                                }

                                var remap1 = new RasterFunction();
                                remap1.functionName = "Remap";
                                remap1.outputPixelType = "U8";
                                var remapArg1 = {};
                                remapArg1.InputRanges = [-1, parseFloat(registry.byId("horiSliderInclusion").get("value")), parseFloat(registry.byId("horiSliderInclusion").get("value")), 1];
                                remapArg1.OutputValues = [0, 1];
                                remapArg1.AllowUnmatched = false;
                                remapArg1.Raster = raster1;
                                remap1.functionArguments = remapArg1;

                                var remap2 = new RasterFunction();
                                remap2.functionName = "Remap";
                                remap2.outputPixelType = "U8";
                                var remapArg2 = {};
                                remapArg2.InputRanges = [-1, parseFloat(registry.byId("horiSliderInclusion").get("value")), parseFloat(registry.byId("horiSliderInclusion").get("value")), 1];
                                remapArg2.OutputValues = [0, 1];
                                remapArg2.AllowUnmatched = false;
                                remapArg2.Raster = raster2;
                                remap2.functionArguments = remapArg2;

                                var arithmetic1 = new RasterFunction();
                                arithmetic1.functionName = "Arithmetic";
                                arithmetic1.outputPixelType = "F32";
                                var arithArg1 = {};
                                arithArg1.Raster = remap2;
                                arithArg1.Raster2 = remap1;
                                arithArg1.Operation = 2;
                                arithArg1.ExtentType = 1;
                                arithArg1.CellsizeType = 0;
                                arithmetic1.functionArguments = arithArg1;

                                var remap5 = new RasterFunction();
                                remap5.functionName = "Remap";
                                remap5.outputPixelType = "F32";
                                var remapArg5 = {};
                                remapArg5.InputRanges = [-1.1, -0.01];
                                remapArg5.OutputValues = [1];
                                remapArg5.NoDataRanges = [0, 0];
                                remapArg5.AllowUnmatched = true;
                                remapArg5.Raster = arithmetic1;
                                remap5.functionArguments = remapArg5;

                                var arithmetic2 = new RasterFunction();
                                arithmetic2.functionName = "Arithmetic";
                                arithmetic2.outputPixelType = "F32";
                                var arithArg2 = {};
                                arithArg2.Raster = raster2;
                                arithArg2.Raster2 = raster1;
                                arithArg2.Operation = 2;
                                arithArg2.ExtentType = 1;
                                arithArg2.CellsizeType = 0;
                                arithmetic2.functionArguments = arithArg2;


                                var remap4 = new RasterFunction();
                                remap4.functionName = "Remap";
                                remap4.outputPixelType = "F32";
                                var remapArg4 = {};
                                remapArg4.NoDataRanges = [(-1 * parseFloat(registry.byId("horiSliderRight").get("value"))), parseFloat(registry.byId("horiSliderRight").get("value"))];
                                remapArg4.AllowUnmatched = true;
                                remapArg4.Raster = arithmetic2;
                                remap4.functionArguments = remapArg4;

                                var arithmetic3 = new RasterFunction();
                                arithmetic3.functionName = "Arithmetic";
                                arithmetic3.outputPixelType = "F32";
                                var arith3 = {};
                                arith3.Raster = remap5;
                                arith3.Raster2 = remap4;
                                arith3.Operation = 3;
                                arith3.ExtentType = 1;
                                arith3.CellsizeType = 0;
                                arithmetic3.functionArguments = arith3;

                                var remap3 = new RasterFunction();
                                remap3.functionName = "Remap";
                                remap3.outputPixelType = "U8";
                                var remapArg3 = {};
                                remapArg3.InputRanges = [-5, 0, 0, 5];
                                remapArg3.OutputValues = [0, 1];
                                remapArg3.AllowUnmatched = false;
                                remapArg3.Raster = arithmetic3;
                                remap3.functionArguments = remapArg3;
                                var colormap = new RasterFunction();
                                colormap.functionName = "Colormap";
                                colormap.outputPixelType = "U8";
                                var colormapArg = {};
                                if (registry.byId("changeOptions").get("value") === "BurnIndex")
                                    colormapArg.Colormap = [[0, 255, 69, 0], [1, 0, 252, 0]];
                                else
                                    colormapArg.Colormap = [[0, 255, 0, 255], [1, 0, 252, 0]];
                                colormapArg.Raster = remap3;
                                colormap.functionArguments = colormapArg;
                                var renderingRule = colormap.toJson();

                            }
                        } else {
                            var remap = new RasterFunction();
                            remap.functionName = "Remap";
                            var argsRemap = {};
                            argsRemap.Raster = resultLayerProperties.renderingRule;
                            var maskSliderValue = registry.byId("maskSlider").get("value");
                            argsRemap.InputRanges = [maskSliderValue, 1];
                            argsRemap.OutputValues = [1];
                            argsRemap.NoDataRanges = [-1, maskSliderValue];
                            var color = registry.byId("savePropAccess").get("value").split(",");


                            var colorMask = [[1, parseInt(color[0]), parseInt(color[1]), parseInt(color[2])]];


                            remap.functionArguments = argsRemap;
                            remap.outputPixelType = 'U8';
                            var colormap = new RasterFunction();
                            colormap.functionName = "Colormap";
                            colormap.outputPixelType = "U8";
                            var argsColor = {};
                            argsColor.Colormap = colorMask;
                            argsColor.Raster = remap;
                            colormap.functionArguments = argsColor;

                            var renderingRule = colormap.toJson();
                        }
                    } else
                        var renderingRule = resultLayerProperties.renderingRule.toJson();

                    var itemData = {"id": resultLayerProperties.id, "visibility": true, "bandIds": bandIds, "opacity": 1, "title": registry.byId("itemTitle").get("value"), "timeAnimation": false, "renderingRule": renderingRule, "mosaicRule": mosaicRule};

                    var portal = new arcgisPortal.Portal("http://www.arcgis.com");
                    bundle.identity.lblItem = "Account";
                    var tempText = (bundle.identity.info).split("access the item on");
                    bundle.identity.info = tempText[0] + tempText[1];

                    portal.signIn().then(lang.hitch(this, function (loggedInUser) {

                        var url = loggedInUser.userContentUrl;
                        var addItemRequest = esriRequest({
                            url: url + "/addItem",
                            content: {f: "json",
                                title: registry.byId("itemTitle").get("value"),
                                type: "Image Service",
                                url: resultLayerProperties.url,
                                description: registry.byId("itemDescription").get("value"),
                                tags: registry.byId("itemTags").get("value"),
                                extent: extent,
                                spatialReference: spatialReference,
                                text: JSON.stringify(itemData)
                            },
                            handleAs: "json",
                            callbackParamName: "callback"
                        }, {usePost: true});
                        addItemRequest.then(lang.hitch(this, function (result) {
                            html.set(this.successNotification, "<br />Layer saved.");
                            setTimeout(lang.hitch(this, function () {
                                if (registry.byId("saveDialog").open)
                                    registry.byId("saveDialog").hide();
                                this.showLoading();
                            }), 2000);
                        }), lang.hitch(this, function (error) {
                            html.set(this.successNotification, "Error!");
                            this.hideLoading();
                        }));
                    }));
                },
                showLoading: function () {
                    if (dom.byId("loadingSave"))
                        domStyle.set("loadingSave", "display", "block");

                },
                hideLoading: function () {
                    if (dom.byId("loadingSave"))
                        domStyle.set("loadingSave", "display", "none");
                }
            });
            clazz.hasLocale = false;
            clazz.hasSettingPage = false;
            clazz.hasSettingUIFile = false;
            clazz.hasSettingLocale = false;
            clazz.hasSettingStyle = false;
            return clazz;
        });
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
    'dojo/parser',
    'dijit/_WidgetsInTemplateMixin',
    'dojo/text!./Widget.html',
    'jimu/BaseWidget',
    "dojo/on", "esri/request",
    "dojo/_base/lang",
    'dojo/dom-class', "esri/tasks/query",
    "esri/tasks/QueryTask",
    "esri/layers/RasterFunction",
    "esri/layers/ArcGISImageServiceLayer",
    "esri/layers/ArcGISTiledMapServiceLayer",
    "esri/layers/ArcGISDynamicMapServiceLayer",
    "esri/layers/ImageServiceParameters",
    "dijit/Tooltip",
    "dojo/dom-construct",
    "dojo/dom", "dojo/html",
    "dojo/dom-style",
    "dojo/_base/connect",
    "esri/layers/MosaicRule",
    "esri/geometry/Extent",
    "dijit/registry",
    "jimu/PanelManager",
    "dojo/dom-attr",
    "dijit/Dialog",
    "dijit/form/HorizontalSlider",
    "dijit/form/HorizontalRule",
    "dijit/form/HorizontalRuleLabels",
    "dijit/form/Select",
    "dijit/form/Button",
    "dijit/form/NumberSpinner",
    "dijit/form/CheckBox",
    "dijit/form/TextBox",
    "dijit/form/DropDownButton",
    "dijit/TooltipDialog",
    "dijit/form/NumberTextBox"
],
        function (
                declare, parser,
                _WidgetsInTemplateMixin,
                template,
                BaseWidget,
                on, esriRequest,
                lang,
                domClass, Query, QueryTask,
                RasterFunction,
                ArcGISImageServiceLayer, ArcGISTiledMapServiceLayer,
                ArcGISDynamicMapServiceLayer,
                ImageServiceParameters,
                Tooltip,
                domConstruct,
                dom, html, domStyle, connect, MosaicRule, Extent, registry, PanelManager, domAttr) {
            var pm = PanelManager.getInstance();
            var clazz = declare([BaseWidget, _WidgetsInTemplateMixin], {
                templateString: template,
                name: 'ISLayers',
                baseClass: 'jimu-widget-ISLayers',
                rasterfn: null,
                url: null,
                _selectedRadio: null,
                time: null,
                layerflag: true,
                featuresid: null,
                ids: [],
                mr: null,
                primaryLayer: null,
                previousradiooptions: null,
                loadhandle: null,
                currentService: "Landsat",
                previousRadiooption: null,
                objectIdOfFirstScene: null,
                saveMosaicRule: null,
                toolbaractivationFlag: false,
                prevradio: null,
                changeFlag: false,
                stretchRange: 15,
                savedFirstId: null,
                savedSecondId: null,
                appExtent: null,
                appRenderer: null,
                appMosaicRule: null,
                contourMosaicRule: null,
                landsatMosaicRule: null,
                contourDomClick: null,
                landsatDomClick: null,
                buildFlag: false,
                cloudFilter: null,
                startup: function () {
                    this.inherited(arguments);
                    this.socialLink = domConstruct.toDom('<div style="position: absolute;top:20px;right: 5px;display: block;"><a   id="facebook" target="_blank"><img id="facebookThumnail" src="http://arcticdemapp.s3-website-us-west-2.amazonaws.com/explorer/widgets/ISLayers/images/facebook.png" style="height: 30px;width:30px;" alt="Facebook" /></a><br /><a  id="twitter" target="_blank"><img id="twitterThumbnail" src="http://arcticdemapp.s3-website-us-west-2.amazonaws.com/explorer/widgets/ISLayers/images/twitter.png" style="height: 30px;width:30px;" alt="Twitter" /></a><br /><a   id="link" target="_self"><img id="linkThumbnail" src=" http://arcticdemapp.s3-website-us-west-2.amazonaws.com/explorer/widgets/ISLayers/images/link.png" style="height: 30px;width:30px;" alt="Link" /></a></div>');
                    domConstruct.place(this.socialLink, this.map.container);

                    domConstruct.place('<img id="loadingLayer" style="position: absolute;top:0;bottom: 0;left: 0;right: 0;margin:auto;z-index:100;" src="' + require.toUrl('jimu') + '/images/loading.gif">', this.map.container);
                    domConstruct.place('<img id="loadingBuild" style="position: absolute;top:0;bottom: 0;left: 0;right: 0;margin:auto;z-index:100;" src="' + require.toUrl('jimu') + '/images/loading.gif">', "buildDialog");
                    domConstruct.place('<img id="loadingContour" style="position: absolute;top:0;bottom: 0;left: 0;right: 0;margin:auto;z-index:100;" src="' + require.toUrl('jimu') + '/images/loading.gif">', "contourDialog");
                    on(dom.byId("facebook"), "click", lang.hitch(this, this.shareClicked, "facebook"));
                    on(dom.byId("twitter"), "click", lang.hitch(this, this.shareClicked, "twitter"));
                    on(dom.byId("link"), "click", lang.hitch(this, this.shareClicked, "link"));
                    domStyle.set("loadingLayer", "display", "none");

                    domStyle.set("loadingBuild", "display", "none");
                    domStyle.set("loadingContour", "display", "none");


                },
                closeOtherDialogs: function () {

                    if (registry.byId("changeDetectionDialog") && registry.byId("changeDetectionDialog").open)
                        registry.byId("changeDetectionDialog").hide();
                    if (registry.byId("timeDialog") && registry.byId("timeDialog").open)
                        registry.byId("timeDialog").hide();
                    var x = document.getElementsByClassName("icon-node");
                    if (domClass.contains(x[2], "jimu-state-selected"))
                        x[2].click();
                    else if (domClass.contains(x[3], "jimu-state-selected"))
                        x[3].click();
                    else if (domClass.contains(x[4], "jimu-state-selected"))
                        x[4].click();
                    else if (domClass.contains(x[5], "jimu-state-selected"))
                        x[5].click();
                    else if (domClass.contains(x[6], "jimu-state-selected"))
                        x[6].click();
                },
                postCreate: function () {
                    this.createZFactorSlider();
                    var raster = new RasterFunction();
                    raster.functionName = this.config.rasterFunctions.hillshade;
                    this.greyHillshadeStretched = new RasterFunction();
                    this.greyHillshadeStretched.functionName = "Stretch";
                    var stretchArg = {};
                    stretchArg.StretchType = 3;
                    stretchArg.NumberOfStandardDeviations = 4;
                    stretchArg.DRA = true;
                    stretchArg.UseGamma = true;
                    stretchArg.Gamma = [1.5, 1.5, 1.5];
                    stretchArg.Raster = raster;
                    this.greyHillshadeStretched.functionArguments = stretchArg;
                    this.own(
                            on(this.multiERadio, "click", lang.hitch(this, this.domSelection, this.config.rasterFunctions.aspect, this.multiERadio)),
                            on(this.multiBRadio, "click", lang.hitch(this, this.domSelection, this.config.rasterFunctions.hillshade, this.multiBRadio)),
                            on(this.slopeRadio, "click", lang.hitch(this, this.domSelection, this.config.rasterFunctions.slope, this.slopeRadio)),
                            on(this.multiDRadio, "click", lang.hitch(this, this.populateLandsatService, this.config.rasterFunctions.landsatPansharpened, this.multiDRadio)),
                            on(this.multiFRadio, "click", lang.hitch(this, this.domSelection, this.config.rasterFunctions.multiDirectionalHillshade, this.multiFRadio)),
                            on(this.multiARadio, "click", lang.hitch(this, this.domSelection, "GreyHillshadeStretched", this.multiARadio)),
                            on(this.contourRadio, "click", lang.hitch(this, function () {

                                if (domClass.contains(this.contourRadio, "selected")) {
                                    domClass.remove(this.contourRadio, "selected");
                                    if (this.map.getLayer("contourLayer")) {
                                        if (this.map.getLayer("contourLayer").updating)
                                            this.map.getLayer("contourLayer").suspend();
                                        this.map.removeLayer(this.map.getLayer("contourLayer"));
                                    }
                                    if (registry.byId("contourDialog").open)
                                        registry.byId("contourDialog").hide();
                                } else {
                                    domClass.add(this.contourRadio, "selected");
                                    if (registry.byId("buildDialog").open)
                                        registry.byId("buildDialog").hide();
                                    this.closeOtherDialogs();
                                    connect.publish("layerOpen", [{flag: true}]);
                                    registry.byId("contourDialog").show();
                                    domStyle.set("contourDialog", "left", "160px");
                                    domStyle.set("contourDialog", "top", "75px");
                                    domConstruct.destroy("contourDialog_underlay");
                                    if (registry.byId("smoothContour").checked)
                                        this.addContourLayer(this.config.rasterFunctions.smoothContour);
                                    else
                                        this.addContourLayer(this.config.rasterFunctions.contour);
                                }
                            })),
                            on(this.multiCRadio, "click", lang.hitch(this, this.domSelection, this.config.rasterFunctions.tintedHillshade, this.multiCRadio)),
                            on(this.buildRadio, "click", lang.hitch(this, function () {
                                if (this.layerflag) {
                                    if (!this.buildFlag) {
                                        registry.byId("bnd1").set("value", "4");
                                        registry.byId("bnd2").set("value", "3");
                                        registry.byId("stretchoptions").set("value", "clip");
                                        registry.byId("bnd3").set("value", "2");
                                        registry.byId("gammaoptions").set("value", "4");
                                    } else
                                        this.buildFlag = false;

                                    dom.byId("apply").click();
                                } else {
                                    registry.byId("bnd1").set("value", this.band1);
                                    registry.byId("bnd2").set("value", this.band2);
                                    registry.byId("stretchoptions").set("value", this.type);
                                    registry.byId("bnd3").set("value", this.band3);
                                    registry.byId("gammaoptions").set("value", this.gamma);
                                }
                                this.populateLandsatService("Build", this.buildRadio);
                            }))
                            );

                    registry.byId('apply').on("click", lang.hitch(this, this.stretchfn));

                    registry.byId("smoothContour").on("change", lang.hitch(this, function () {
                        if (registry.byId("smoothContour").checked)
                            this.addContourLayer(this.config.rasterFunctions.smoothContour);
                        else
                            this.addContourLayer(this.config.rasterFunctions.contour);
                    }));
                    registry.byId("contourIntervalOptions").on("change", lang.hitch(this, function () {
                        if (registry.byId("smoothContour").checked)
                            this.addContourLayer(this.config.rasterFunctions.smoothContour);
                        else
                            this.addContourLayer(this.config.rasterFunctions.contour);
                    }));

                    registry.byId('reset').on("click", lang.hitch(this, this.reset1));
                    this.map.on("update-start", lang.hitch(this, this.showLoading));
                    this.map.on("update-end", lang.hitch(this, this.hideLoading));
                    this.map.on("update-end", lang.hitch(this, this.timebook));
                    this.map.on("layer-add-result", lang.hitch(this, this.timeClicked));

                    new Tooltip({
                        connectId: [this.domNode],
                        selector: ".layer-item",
                        position: ['after'],
                        getContent: function (matchedNode) {
                            return matchedNode.getAttribute("data-tooltip");
                        }
                    });

                },
                createZFactorSlider: function () {
                    var node = domConstruct.toDom('<div id="zfactorDiv">Shading Factor:<span style="font-weight:bold; color:black;margin-left:3px;" id="zfactorValue">1.0</span><button data-dojo-type="dijit/form/Button"  id="zfactorBtn" type="button">Apply</button><br />' +
                            '<div id="zfactorSlider" style="width:180px;display: inline-block;" data-dojo-type="dijit/form/HorizontalSlider" data-dojo-props="value:1.0,minimum: 0.0,maximum:10.0,discreteValues:11,intermediateChanges:false,showButtons:true">' +
                            '<div data-dojo-type="dijit/form/HorizontalRule" container="bottomDecoration" style="height:5px;" data-dojo-props="count:11"></div>' +
                            '<ol data-dojo-type="dijit/form/HorizontalRuleLabels" container="bottomDecoration" style="height:1em;font-size:75%;color:gray;">' +
                            '<li>0</li>' +
                            '<li>2</li>' +
                            '<li>4</li>' +
                            '<li>6</li>' +
                            '<li>8</li>' +
                            '<li>10</li>' +
                            '</ol>' +
                            '</div></div>');
                    domConstruct.place(node, this.map.container);
                    parser.parse(node).then(lang.hitch(this, function () {
                        registry.byId("zfactorSlider").on("change", lang.hitch(this, function (value) {
                            document.getElementById("zfactorValue").innerHTML = parseFloat(value).toFixed(1);
                        }));
                        registry.byId("zfactorBtn").on("click", lang.hitch(this, function (value) {
                            var factor = registry.byId("zfactorSlider") ? parseFloat(registry.byId("zfactorSlider").get("value")) : 1.0;
                            factor = Math.pow(1.5, factor) - 0.5;
                            var rasterFunction = new RasterFunction();
                            rasterFunction.functionName = this.selectedRadio.id;
                            var args = {};
                            if (this.selectedRadio.id === "Hillshade Gray") {
                                args[this.config.rasterFunctionArgumentsVariableNames.hillshadeZFactor] = factor;
                                rasterFunction.functionArguments = args;
                            } else if (this.selectedRadio.id === "Hillshade Multidirectional") {
                                args[this.config.rasterFunctionArgumentsVariableNames.multiDirectionalHillshadeZFactor] = factor;
                            }
                            rasterFunction.functionArguments = args;
                            if (this.map.getLayer("primaryLayer"))
                                this.map.getLayer("primaryLayer").setRenderingRule(rasterFunction, false);
                        }));
                    }));
                },
                onOpen: function () {

                    var checkUrl = window.location.href;
                    var parameters = window.location.href.split("?");
                    if (parameters[1])
                    {
                        parameters[1] = atob(parameters[1]);
                        parameters[1] = parameters[1].replace(/%22/gi, '"');

                        var values = parameters[1].split("&");

                        for (var a = 0; a < 2; a++) {
                            if (values[a])
                                values[a] = JSON.parse(values[a]);
                        }

                        this.appExtent = values[0];
                        if (values[4])
                            this.appRenderer = values[4];
                        if (this.appRenderer === "Stretch")
                            this.appRenderer = "GreyHillshadeStretched";

                        if (values[2])
                            this.appMosaicRule = values[2];
                        if (values[1])
                            this.contourMosaicRule = values[1];
                        if (values[3])
                            this.landsatMosaicRule = values[3];
                        if (values[14])
                            this.cloudFilter = values[14];
                        if (values[15])
                            this.changeDetectionClick = values[15];
                        registry.byId("zfactorSlider").set("value", values[16]);
                        if (values[5]) {
                            if (values[5] !== "Natural Color with DRA") {
                                this.buildFlag = true;
                                registry.byId("bnd1").set("value", values[6]);
                                registry.byId("bnd2").set("value", values[7]);
                                registry.byId("bnd3").set("value", values[8]);

                                registry.byId("stretchoptions").set("value", values[9]);
                                registry.byId("gammaoptions").set("value", values[10]);
                            }
                            this.landsatDomClick = values[5];
                        }
                        if (values[11]) {
                            this.contourDomClick = values[11];
                            registry.byId("smoothContour").set("checked", JSON.parse(values[13]));
                            registry.byId("contourIntervalOptions").set("value", parseFloat(values[12]));
                        }


                        if (typeof (history.pushState) != "undefined") {
                            var changeUrl = parameters[0].split("index.html")[0];
                            var obj = {Page: "ArcticDEM Explorer", Url: changeUrl};
                            history.pushState(obj, obj.Page, obj.Url);
                        }
                        this.map.setExtent(new Extent(this.appExtent));

                        if (this.landsatDomClick)
                            (dom.byId(this.landsatDomClick)).click();
                        else if (this.appRenderer)
                            (dom.byId(this.appRenderer)).click();
                        else if (this.contourDomClick)
                            (dom.byId(this.contourDomClick)).click();
                        else if (this.changeDetectionClick)
                            this.getObjectIdForChange();

                    } else
                        this.multiBRadio.click();

                },
                getObjectIdForChange: function () {
                    var query = new Query();
                    query.where = "Name = '" + this.changeDetectionClick + "' OR Name = '" + this.appMosaicRule + "'";
                    query.outFields = ["Name"];
                    query.returnGeometry = false;

                    var queryTask = new QueryTask(this.config.urlElevation);
                    queryTask.execute(query, lang.hitch(this, function (result) {
                        for (var a in result.features) {
                            if (result.features[a].attributes.Name === this.changeDetectionClick)
                                var secondScene = result.features[a].attributes.OBJECTID;
                            else
                                var firstScene = result.features[a].attributes.OBJECTID;
                        }
                        registry.byId("savedSceneID").set("value", secondScene + "," + firstScene);
                        document.getElementsByClassName("icon-node")[1].click();
                    }));

                },
                shareClicked: function (socialMedium) {
                    if (this.map.getLayer("primaryLayer")) {
                        var shareLayer = this.map.getLayer("primaryLayer");

                        if (shareLayer.mosaicRule && shareLayer.mosaicRule.method === "esriMosaicLockRaster")
                            var mosaicRule = registry.byId("arcticSceneID").get("value");//var mosaicRule = JSON.stringify(shareLayer.mosaicRule.toJson());
                        else
                            var mosaicRule = "";
                        if (shareLayer.renderingRule) {
                            var renderingRule = shareLayer.renderingRule.functionName;
                        } else
                            var renderingRule = "";
                    } else {
                        var renderingRule = "";
                        var mosaicRule = "";
                    }
                    var mapextent = JSON.stringify(this.map.extent.toJson());

                    var appUrl = window.location.href;
                    if (appUrl[appUrl.length - 1] === "/")
                        appUrl = appUrl.slice(0, appUrl.length - 1);
                    if (!appUrl.includes("/index.html"))
                        appUrl = appUrl + "/index.html";
                    if (this.map.getLayer("landsatLayer")) {
                        var landsatLayer = this.map.getLayer("landsatLayer");
                        if (landsatLayer.mosaicRule && landsatLayer.mosaicRule.method === "esriMosaicLockRaster") {
                            var mosaicRuleLandsat = registry.byId("landsatSceneID").get("value");
                            var cloudFilter = registry.byId("cloudFilter").get("value");
                        } else {
                            var mosaicRuleLandsat = "";
                            var cloudFilter = "";
                        }
                        if (landsatLayer.renderingRule) {
                            if (landsatLayer.renderingRule.functionName === this.config.rasterFunctions.landsatPansharpened) {
                                var domLandsatClick = "Natural Color with DRA";
                                var band1 = "";
                                var band2 = "";
                                var band3 = "";
                                var stretch = "";
                                var gamma = "";
                            } else {
                                var domLandsatClick = "Build";
                                var band1 = registry.byId("bnd1").get("value");
                                var band2 = registry.byId("bnd2").get("value");
                                var band3 = registry.byId("bnd3").get("value");
                                var stretch = registry.byId("stretchoptions").get("value");
                                var gamma = registry.byId("gammaoptions").get("value");
                            }
                        }

                    } else {
                        var mosaicRuleLandsat = "";
                        var cloudFilter = "";
                        var domLandsatClick = "";
                        var band1 = "";
                        var band2 = "";
                        var band3 = "";
                        var stretch = "";
                        var gamma = "";

                    }
                    if (this.map.getLayer("contourLayer")) {
                        var domClickContour = "Contour 25";
                        var contourInterval = registry.byId("contourIntervalOptions").get("value");
                        var smoothContour = registry.byId("smoothContour").checked;
                        if (this.map.getLayer("contourLayer").mosaicRule) {
                            var contourMosaicRule = JSON.stringify((this.map.getLayer("contourLayer")).mosaicRule.toJson());
                        } else
                            var contourMosaicRule = "";
                    } else {
                        var domClickContour = "";
                        var contourInterval = "";
                        var smoothContour = registry.byId("smoothContour").checked;
                        var contourMosaicRule = "";
                    }

                    if (this.map.getLayer("resultLayer")) {
                        var mosaicRule = registry.byId("arcticSceneID").get("value");
                        var savedMosaicRule = registry.byId("savedSceneID").get("value");
                    } else
                        var savedMosaicRule = "";
                    var zfactor = registry.byId("zfactorSlider").get("value");
                    var shareUrl = appUrl + "?" + btoa(mapextent + "&" + contourMosaicRule + "&" + mosaicRule + "&" + mosaicRuleLandsat + "&" + renderingRule + "&" + domLandsatClick + "&" + band1 + "&" + band2 + "&" + band3 + "&" + stretch + "&" + gamma + "&" + domClickContour + "&" + contourInterval + "&" + smoothContour + "&" + cloudFilter + "&" + savedMosaicRule + "&" + zfactor);
                    if (socialMedium === "facebook")
                        var share = "http://www.arcgis.com/home/socialnetwork.html?n=fb&t=" + "&u=" + shareUrl;
                    else if (socialMedium === "twitter")
                        var share = "http://www.arcgis.com/home/socialnetwork.html?n=tw&t=ArcticDEM Explorer" + "&u=" + shareUrl;
                    else
                        var share = "https://arcg.is/prod/shorten";
                    if (socialMedium !== "link") {
                        domAttr.set(socialMedium, "href", share);
                    } else {

                        var shortUrlRequest = esriRequest({
                            url: share,
                            content: {
                                longUrl: shareUrl,
                                format: "json"
                            },
                            handleAs: "json",
                            callbackParamName: "callback"
                        });
                        shortUrlRequest.then(lang.hitch(this, function (response) {
                            if (response && response.data && response.data.url) {
                                registry.byId("linkValue").set("value", response.data.url);
                                if (!registry.byId("linkDialog").open)
                                    registry.byId("linkDialog").show();
                                domStyle.set("linkDialog", "right", "20px");
                                domStyle.set("linkDialog", "top", "130px");
                                domStyle.set("linkDialog", "left", "auto");
                                domConstruct.destroy("linkDialog_underlay");
                            }
                        }));
                    }


                },
                timeClicked: function () {

                    if (this.landsatDomClick) {

                        this.landsatDomClick = null;
                        if (this.landsatMosaicRule) {
                            if (this.contourDomClick)
                                var contourFlag = true;
                            else
                                var contourFlag = false;

                            registry.byId("appSceneID").set("value", this.landsatMosaicRule + ";" + contourFlag + ";" + this.appRenderer + ";" + this.appMosaicRule + ";" + this.cloudFilter);
                            var x = document.getElementsByClassName("icon-node");
                            x[0].click();
                            this.lansatMosaicRule = null;
                            this.appRenderer = null;
                            this.appMosaicRule = null;
                            this.contourDomClick = null;
                        } else {
                            if (this.appRenderer)
                                dom.byId(this.appRenderer).click();
                            else if (this.contourDomClick)
                                dom.byId(this.contourDomClick).click();

                        }

                    } else if (this.appRenderer) {
                        this.appRenderer = null;

                        if (this.appMosaicRule) {
                            if (this.contourDomClick)
                                var contourFlag = true;
                            else
                                var contourFlag = false;
                            registry.byId("appSceneID").set("value", this.landsatMosaicRule + ";" + contourFlag + ";" + null + ";" + this.appMosaicRule + ";" + this.cloudFilter);
                            var x = document.getElementsByClassName("icon-node");
                            x[0].click();

                            this.appMosaicRule = null;
                            this.contourDomClick = null;
                        } else {
                            if (this.contourDomClick)
                                dom.byId(this.contourDomClick).click();
                        }

                    } else if (this.contourDomClick) {
                        this.contourDomClick = null;
                    }

                },
                domSelection: function (renderer, radio) {

                    if (domClass.contains(radio, "selected")) {
                        domClass.remove(radio, "selected");

                        if (this.map.getLayer("primaryLayer")) {
                            if (this.map.getLayer("primaryLayer").updating)
                                this.map.getLayer("primaryLayer").suspend();
                            this.map.removeLayer(this.map.getLayer("primaryLayer"));
                        }
                        this.selectedRadio = null;

                        if (this.map.getLayer("landsatLayer")) {
                            connect.publish("refreshTime", [{flag: true}]);
                        }
                    } else {
                        if (this.selectedRadio)
                            domClass.remove(this.selectedRadio, "selected");
                        registry.byId("savedScene").set("value", radio.id);
                        domClass.add(radio, "selected");
                        var x = document.getElementsByClassName("icon-node");
                        if (domClass.contains(x[1], "jimu-state-selected"))
                            x[1].click();


                        this.elevationServices(renderer);
                        this.selectedRadio = radio;
                    }
                },
                addContourLayer: function (renderer) {
                    var rasterFunction = new RasterFunction();
                    rasterFunction.functionName = renderer;
                    var arguments = {};
                    if (registry.byId("contourIntervalOptions").get("value") !== "0")
                    {
                        arguments[this.config.rasterFunctionArgumentsVariableNames.contourInterval] = parseFloat(registry.byId("contourIntervalOptions").get("value"));
                        arguments[this.config.rasterFunctionArgumentsVariableNames.contourIntervalSelector] = 1;
                    }
                    rasterFunction.functionArguments = arguments;
                    if (this.map.getLayer("contourLayer")) {
                        this.map.getLayer("contourLayer").setRenderingRule(rasterFunction, false);
                    } else {
                        var params = new ImageServiceParameters();
                        params.renderingRule = rasterFunction;
                        if (this.map.getLayer("primaryLayer")) {
                            params.mosaicRule = this.map.getLayer("primaryLayer").mosaicRule;
                        } else if (this.contourMosaicRule) {
                            // params.mosaicRule = this.contourMosaicRule;

                            var mr = new MosaicRule();
                            mr.method = MosaicRule.METHOD_LOCKRASTER;
                            mr.ascending = true;
                            mr.operation = "MT_FIRST";
                            mr.lockRasterIds = [this.contourMosaicRule.lockRasterIds[0]];
                            params.mosaicRule = mr;

                            this.contourMosaicRule = null;
                        }

                        params.format = "jpgpng";
                        var contourLayer = new ArcGISImageServiceLayer(this.config.urlElevation, {
                            id: "contourLayer",
                            imageServiceParameters: params,
                            visible: true
                        });

                        if (this.map.getLayer("landsatLayer") && this.map.getLayer("primaryLayer"))
                            this.map.addLayer(contourLayer, 3);
                        else if (this.map.getLayer("primaryLayer"))
                            this.map.addLayer(contourLayer, 2);
                        else if (this.map.getLayer("landsatLayer"))
                            this.map.addLayer(contourLayer, 1);
                        else
                            this.map.addLayer(contourLayer, 1);
                    }
                },
                gammacompute: function ()
                {

                    if (this.gammaval === "0")
                    {
                        this.gvalue = false;
                    } else {
                        this.gvalue = true;
                    }
                    switch (this.gammaval)
                    {

                        case '1' :
                        {
                            this.values = 0.3;
                            break;
                        }
                        case '2' :
                        {
                            this.values = 0.5;
                            break;
                        }
                        case '3' :
                        {
                            this.values = 0.8;
                            break;
                        }
                        case '4' :
                        {
                            this.values = 1;
                            break;
                        }
                        case '5' :
                        {
                            this.values = 1.2;
                            break;
                        }
                        case '6' :
                        {
                            this.values = 2;
                            break;
                        }
                        case '7' :
                        {
                            this.values = 4;
                            break;
                        }
                    }

                },
                stretchfn: function ()
                {

                    this.gammaval = registry.byId("gammaoptions").get("value");


                    this.gammacompute();
                    var abc = new RasterFunction();
                    abc.functionName = 'Stretch';
                    var args = {};
                    var type = registry.byId("stretchoptions").get("value");



                    switch (type)
                    {
                        case 'none' :
                        {
                            args.StretchType = 0;
                            args.UseGamma = this.gvalue;
                            if (this.gvalue)
                            {
                                args.Gamma = [parseFloat((this.values).toFixed(2)), parseFloat((this.values).toFixed(2)), parseFloat((this.values).toFixed(2))];
                            }
                            break;
                        }
                        case 'minmax' :
                        {
                            args.StretchType = 5;
                            args.Min = 0;
                            args.Max = 255;
                            args.UseGamma = this.gvalue;
                            if (this.gvalue)
                            {

                                args.Gamma = [parseFloat(this.values.toFixed(2)), parseFloat(this.values.toFixed(2)), parseFloat(this.values.toFixed(2))];
                            }
                            args.DRA = true;
                            break;
                        }
                        case 'standard' :
                        {
                            args.StretchType = 3;
                            args.NumberofStandardDeviations = 2;
                            args.DRA = true;
                            args.UseGamma = this.gvalue;
                            if (this.gvalue)
                            {
                                args.Gamma = [parseFloat(this.values.toFixed(2)), parseFloat(this.values.toFixed(2)), parseFloat(this.values.toFixed(2))];
                            }
                            break;
                        }
                        case 'standard1' :
                        {
                            args.StretchType = 3;
                            args.NumberofStandardDeviations = 3.0;
                            args.DRA = true;
                            args.UseGamma = this.gvalue;
                            if (this.gvalue)
                            {
                                args.Gamma = [parseFloat(this.values.toFixed(2)), parseFloat(this.values.toFixed(2)), parseFloat(this.values.toFixed(2))];
                            }
                            break;
                        }
                        case 'clip' :
                        {
                            args.StretchType = 6;
                            args.MinPercent = 2.0;
                            args.MaxPercent = 2.0;
                            args.UseGamma = this.gvalue;
                            if (this.gvalue)
                            {
                                args.Gamma = [parseFloat(this.values.toFixed(2)), parseFloat(this.values.toFixed(2)), parseFloat(this.values.toFixed(2))];
                            }
                            args.DRA = true;
                            break;
                        }
                        case 'clip1' :
                        {
                            args.StretchType = 6;
                            args.MinPercent = 0.5;
                            args.MaxPercent = 0.5;
                            args.UseGamma = this.gvalue;
                            if (this.gvalue)
                            {
                                args.Gamma = [parseFloat(this.values.toFixed(2)), parseFloat(this.values.toFixed(2)), parseFloat(this.values.toFixed(2))];
                            }
                            args.DRA = true;
                            break;
                        }
                        case 'clip2' :
                        {
                            args.StretchType = 6;
                            args.MinPercent = 0.1;
                            args.MaxPercent = 0.1;
                            args.UseGamma = this.gvalue;
                            if (this.gvalue)
                            {
                                args.Gamma = [parseFloat(this.values.toFixed(2)), parseFloat(this.values.toFixed(2)), parseFloat(this.values.toFixed(2))];
                            }
                            args.DRA = true;
                            break;
                        }
                        case 'dark' :
                        {
                            args.StretchType = 5;

                            args.Min = 0.0;
                            args.Max = 255.0;
                            args.Statistics = [[5000, 25000, 10000, 1], [5000, 15000, 10000, 1], [5000, 15000, 10000, 1]];
                            args.UseGamma = this.gvalue;
                            if (this.gvalue)
                            {

                                args.Gamma = [parseFloat(this.values.toFixed(2)), parseFloat(this.values.toFixed(2)), parseFloat(this.values.toFixed(2))];
                            }
                            args.DRA = false;
                            break;
                        }
                        case 'vdark' :
                        {
                            args.StretchType = 5;

                            args.Min = 0.0;
                            args.Max = 255.0;
                            args.Statistics = [[5000, 10000, 7500, 1], [5000, 10000, 7500, 1], [5000, 10000, 7500, 1]];
                            args.UseGamma = this.gvalue;
                            if (this.gvalue)
                            {

                                args.Gamma = [parseFloat(this.values.toFixed(2)), parseFloat(this.values.toFixed(2)), parseFloat(this.values.toFixed(2))];
                            }
                            args.DRA = false;
                            break;
                        }
                        case 'light' :
                        {
                            args.StretchType = 5;

                            args.Min = 0.0;
                            args.Max = 255.0;
                            args.UseGamma = this.gvalue;
                            args.Statistics = [[45000, 55000, 50000, 1], [45000, 55000, 50000, 1], [45000, 55000, 50000, 1]];
                            if (this.gvalue)
                            {

                                args.Gamma = [parseFloat(this.values.toFixed(2)), parseFloat(this.values.toFixed(2)), parseFloat(this.values.toFixed(2))];
                            }
                            args.DRA = false;
                            break;
                        }
                        case 'vlight' :
                        {
                            args.StretchType = 5;

                            args.Min = 0.0;
                            args.Max = 255.0;
                            args.UseGamma = this.gvalue;
                            args.Statistics = [[50000, 55000, 52500, 1], [50000, 55000, 52500, 1], [50000, 55000, 52500, 1]];
                            if (this.gvalue)
                            {

                                args.Gamma = [parseFloat(this.values.toFixed(2)), parseFloat(this.values.toFixed(2)), parseFloat(this.values.toFixed(2))];
                            }
                            args.DRA = false;
                            break;
                        }
                        case 'full' :
                        {
                            args.StretchType = 5;

                            args.Min = 0.0;
                            args.Max = 255.0;
                            args.UseGamma = this.gvalue;
                            args.Statistics = [[5000, 55000, 30000, 1], [5000, 55000, 30000, 1], [5000, 55000, 30000, 1]];
                            if (this.gvalue)
                            {

                                args.Gamma = [parseFloat(this.values.toFixed(2)), parseFloat(this.values.toFixed(2)), parseFloat(this.values.toFixed(2))];
                            }
                            args.DRA = false;
                            break;
                        }
                    }
                    abc.functionArguments = args;
                    abc.variableName = "Raster";
                    if (this.map.getLayer("landsatLayer")) {
                        this.primaryLayer = this.map.getLayer("landsatLayer");
                        this.primaryLayer.setBandIds([parseInt(registry.byId("bnd1").get("value")) - 1, parseInt(registry.byId("bnd2").get("value")) - 1, parseInt(registry.byId("bnd3").get("value")) - 1], false);

                        this.primaryLayer.setRenderingRule(abc, false);

                    }
                    this.type = registry.byId("stretchoptions").get("value");
                    this.band1 = registry.byId("bnd1").get("value");
                    this.band2 = registry.byId("bnd2").get("value");
                    this.band3 = registry.byId("bnd3").get("value");
                    this.gamma = this.gammaval;
                    this.saveRenderingRule = abc;
                    //this.primaryLayer.refresh();
                    this.layerflag = false;

                },
                reset1: function ()
                {


                    this.primaryLayer = this.map.getLayer("landsatLayer");
                    var abc1 = new RasterFunction();
                    abc1.functionName = "";
                    var args1 = {};
                    this.primaryLayer.setBandIds([], true);
                    abc1.functionArguments = args1;
                    abc1.variableName = "Raster";
                    this.primaryLayer.setRenderingRule(abc1, false);

                    registry.byId("bnd1").set("value", "4");
                    registry.byId("bnd2").set("value", "3");
                    registry.byId("stretchoptions").set("value", "clip");

                    registry.byId("bnd3").set("value", "2");

                    registry.byId("gammaoptions").set("value", "4");

                },
                timebook: function ()
                {
                    if (this.map.getLayer("contourLayer")) {
                        if (this.map.getLayer("primaryLayer") && this.map.getLayer("primaryLayer").mosaicRule !== this.map.getLayer("contourLayer").mosaicRule) {
                            this.map.getLayer("contourLayer").setMosaicRule(this.map.getLayer("primaryLayer").mosaicRule);
                        }
                    }


                },
                elevationServices: function (renderer) {
                    domStyle.set("zfactorDiv", "display", "none");
                    if (renderer !== "GreyHillshadeStretched") {

                        var rasterFunction = new RasterFunction();
                        rasterFunction.functionName = renderer;
                        if (renderer === "Hillshade Gray") {
                            domStyle.set("zfactorDiv", "display", "block");
                            var args = {};
                            var factor = registry.byId("zfactorSlider") ? parseFloat(registry.byId("zfactorSlider").get("value")) : 1.0;
                            factor = Math.pow(1.5, factor) - 0.5;
                            args[this.config.rasterFunctionArgumentsVariableNames.hillshadeZFactor] = factor;
                            rasterFunction.functionArguments = args;
                        } else if (renderer === "Hillshade Multidirectional") {
                            var factor = registry.byId("zfactorSlider") ? parseFloat(registry.byId("zfactorSlider").get("value")) : 1.0;
                            factor = Math.pow(1.5, factor) - 0.5;
                            domStyle.set("zfactorDiv", "display", "block");
                            var args = {};
                            args[this.config.rasterFunctionArgumentsVariableNames.multiDirectionalHillshadeZFactor] = factor;
                            rasterFunction.functionArguments = args;
                        }

                    } else {
                        var rasterFunction = this.greyHillshadeStretched;

                    }

                    if (this.map.getLayer("primaryLayer")) {
                        this.map.getLayer("primaryLayer").setRenderingRule(rasterFunction, false);

                    } else {
                        var params = new ImageServiceParameters();
                        params.renderingRule = rasterFunction;
                        params.format = "jpgpng";

                        var elevationLayer = new ArcGISImageServiceLayer(this.config.urlElevation, {
                            id: "primaryLayer",
                            visible: true,
                            imageServiceParameters: params
                        });
                        if (this.map.getLayer("landsatLayer"))
                            this.map.addLayer(elevationLayer, 2);
                        else
                            this.map.addLayer(elevationLayer, 1);

                        connect.publish("refreshTime", [{flag: true}]);
                    }
                },
                populateLandsatService: function (renderer, radio) {

                    if (domClass.contains(radio, "selected")) {
                        domClass.remove(radio, "selected");
                        if (this.map.getLayer("landsatLayer")) {
                            if (this.map.getLayer("landsatLayer").updating)
                                this.map.getLayer("landsatLayer").suspend();
                            this.map.removeLayer(this.map.getLayer("landsatLayer"));
                        }
                        this.landsatRadio = null;
                        if (registry.byId("buildDialog").open)
                            registry.byId("buildDialog").hide();

                    } else {

                        if (this.landsatRadio)
                            domClass.remove(this.landsatRadio, "selected");
                        domClass.add(radio, "selected");
                        this.landsatRadio = radio;
                        if (this.map.getLayer("landsatLayer")) {
                            if (this.map.getLayer("landsatLayer").updating)
                                this.map.getLayer("landsatLayer").suspend();
                            this.map.removeLayer(this.map.getLayer("landsatLayer"));
                        }

                        var params = new ImageServiceParameters();
                        var rasterFunction = new RasterFunction();
                        if (renderer === this.config.rasterFunctions.landsatPansharpened) {
                            rasterFunction.functionName = renderer;
                            if (registry.byId("buildDialog").open)
                                registry.byId("buildDialog").hide();
                            params.renderingRule = rasterFunction;
                            params.format = "jpgpng";
                            var PSLayer = new ArcGISImageServiceLayer(this.config.urlLandsatPS, {
                                id: "landsatLayer",
                                visible: true,
                                imageServiceParameters: params
                            });
                            this.map.addLayer(PSLayer, 1);
                            connect.publish("refreshTime", [{flag: true}]);
                        } else {

                            if (registry.byId("contourDialog") && registry.byId("contourDialog").open)
                                registry.byId("contourDialog").hide();
                            this.closeOtherDialogs();
                            connect.publish("layerOpen", [{flag: true}]);
                            registry.byId("buildDialog").show();
                            domStyle.set("buildDialog", "left", "160px");
                            domStyle.set("buildDialog", "top", "75px");
                            domConstruct.destroy("buildDialog_underlay");

                            params.renderingRule = this.saveRenderingRule;
                            params.bandIds = [this.band1 - 1, this.band2 - 1, this.band3 - 1];
                            params.format = "jpgpng";

                            var MSLayer = new ArcGISImageServiceLayer(this.config.urlLandsatMS, {
                                id: "landsatLayer",
                                visible: true,
                                imageServiceParameters: params
                            });
                            this.map.addLayer(MSLayer, 1);
                            connect.publish("refreshTime", [{flag: true}]);

                        }

                    }
                },
                showLoading: function () {
                    if (dom.byId("loadingLayer")) {
                        domStyle.set("loadingLayer", "display", "block");
                        domStyle.set("loadingContour", "display", "block");
                        domStyle.set("loadingBuild", "display", "block");
                    }
                },
                hideLoading: function () {
                    if (dom.byId("loadingLayer")) {
                        domStyle.set("loadingContour", "display", "none");
                        domStyle.set("loadingLayer", "display", "none");
                        domStyle.set("loadingBuild", "display", "none");
                    }
                }
            });
            clazz.hasLocale = false;
            return clazz;
        });
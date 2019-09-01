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
    "dojo/_base/lang",
    'dojo/dom-class',
    "esri/layers/RasterFunction",
    "esri/layers/ArcGISImageServiceLayer",
    "esri/layers/ImageServiceParameters",
    "dijit/Tooltip",
    "dojo/dom-construct",
    "dojo/dom",
    "dojo/dom-style",
    "dojo/_base/connect",
    "esri/tasks/query",
    "esri/tasks/QueryTask",
    "esri/geometry/Extent",
    "dijit/registry", "dijit/focus",
    "jimu/PanelManager",
    "dojo/dom-attr", "dijit/Dialog",
    "dijit/form/Select",
    "dijit/form/Button"
],
        function (
                declare,
                _WidgetsInTemplateMixin,
                template,
                BaseWidget,
                on,
                lang,
                domClass,
                RasterFunction,
                ArcGISImageServiceLayer,
                ImageServiceParameters,
                Tooltip,
                domConstruct,
                dom, domStyle, connect, Query, QueryTask, Extent, registry, dijitFocus, PanelManager, domAttr) {
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
                saveprevlayer: null,
                appExtent: null,
                appRenderer: null,
                appMosaicRule: null,
                primaryLayer: null,
                startup: function () {
                    this.inherited(arguments);
                    this.socialLink = domConstruct.toDom('<div style="position: absolute;top:20px;right: 5px;display: block;"><a   id="facebook" target="_blank"><img id="facebookThumnail" src="./widgets/ISLayers/images/facebook.png" style="height: 30px;width:30px;" alt="Facebook" /></a><br /><a  id="twitter" target="_blank"><img id="twitterThumbnail" src="./widgets/ISLayers/images/twitter.png" style="height: 30px;width:30px;" alt="Twitter" /><br /></div>');
                    domConstruct.place(this.socialLink, this.map.container);

                    domConstruct.place('<img id="loadingLayer" style="position: absolute;top:0;bottom: 0;left: 0;right: 0;margin:auto;z-index:100;" src="' + require.toUrl('jimu') + '/images/loading.gif">', this.map.container);
                    domConstruct.place('<img id="loadingLayer1" style="position: absolute;top:0;bottom: 0;left: 0;right: 0;margin:auto;z-index:100;" src="' + require.toUrl('jimu') + '/images/loading.gif">', "buildDialog");
                    on(dom.byId("facebook"), "click", lang.hitch(this, this.shareClicked, "facebook"));
                    on(dom.byId("twitter"), "click", lang.hitch(this, this.shareClicked, "twitter"));



                    if (this.appRenderer)
                        (dom.byId(this.appRenderer)).click();
                    this.hideLoading();
                    this.resizeLayersWidget();
                },
                resizeLayersWidget: function () {
                    if (window.innerWidth < 620) {
                        domStyle.set("buildDialog", "font-size", "7px");
                    } else if (window.innerWidth < 850) {
                        domStyle.set("buildDialog", "font-size", "8px");
                    } else if (window.innerWidth < 1200) {
                        domStyle.set("buildDialog", "font-size", "9px");
                    } else {
                        domStyle.set("buildDialog", "font-size", "12px");
                    }

                    if (registry.byId("buildDialog").open) {
                        domStyle.set("buildDialog", "top", "70px");
                        domStyle.set("buildDialog", "left", "160px");
                    }
                },
                postCreate: function () {
                    window.addEventListener("resize", lang.hitch(this, this.resizeLayersWidget));
                    this.own(
                            on(this.multiARadio, "click", lang.hitch(this, this.removeLayersFromMap, "Agriculture with DRA", this.multiARadio)),
                            on(this.multiBRadio, "click", lang.hitch(this, this.removeLayersFromMap, "Color Infrared with DRA", this.multiBRadio)),
                            on(this.multiCRadio, "click", lang.hitch(this, this.removeLayersFromMap, "Short-wave Infrared with DRA", this.multiCRadio)),
                            on(this.multiDRadio, "click", lang.hitch(this, function () {
                                if (this.map.getLayer("primaryLayer")) {
                                    if (this.map.getLayer("primaryLayer").updating)
                                        this.map.getLayer("primaryLayer").suspend();
                                    this.map.removeLayer(this.map.getLayer("primaryLayer"));
                                }
                                this.populateServices("Pansharpened Enhanced with DRA", this.multiDRadio);

                            })),
                            on(this.multiERadio, "click", lang.hitch(this, this.removeLayersFromMap, "Bathymetric with DRA", this.multiERadio)),
                            on(this.multiFRadio, "click", lang.hitch(this, this.removeLayersFromMap, "NDVI Colorized", this.multiFRadio)),
                            on(this.pancRadio, "click", lang.hitch(this, function () {

                                if (this.map.getLayer("primaryLayer")) {
                                    if (this.map.getLayer("primaryLayer").updating)
                                        this.map.getLayer("primaryLayer").suspend();
                                    this.map.removeLayer(this.map.getLayer("primaryLayer"));
                                }
                                this.populateServices("Panchromatic with DRA", this.pancRadio);

                            })),
                            on(this.geoRadio, "click", lang.hitch(this, this.removeLayersFromMap, "Geology with DRA", this.geoRadio)),
                            on(this.moiRadio, "click", lang.hitch(this, this.removeLayersFromMap, "Normalized Difference Moisture Index Colorized", this.moiRadio)),
                            on(this.buildRadio, "click", lang.hitch(this, function () {
                                if (!this.appRenderer) {
                                    if (this.saveRenderer) {
                                        registry.byId("bnd1").set("value", this.band1);
                                        registry.byId("bnd2").set("value", this.band2);
                                        registry.byId("bnd3").set("value", this.band3);
                                        registry.byId("stretchoptions").set("value", this.type);
                                        registry.byId("gammaoptions").set("value", this.gamma);
                                    } else {
                                        registry.byId("bnd1").set("value", "6");
                                        registry.byId("bnd2").set("value", "5");
                                        registry.byId("bnd3").set("value", "2");
                                        registry.byId("stretchoptions").set("value", "clip2");
                                        registry.byId("gammaoptions").set("value", "4");
                                    }
                                }
                                this.removeLayersFromMap("Build", this.buildRadio);
                            }))
                            );
                    registry.byId('apply').on("click", lang.hitch(this, this.stretchfn));

                    registry.byId('reset').on("click", lang.hitch(this, this.reset1));
                    this.map.on("update-start", lang.hitch(this, this.showLoading));
                    this.map.on("update-end", lang.hitch(this, this.hideLoading));
                    this.map.on("update-end", lang.hitch(this, this.timebook));
                    this.map.on("layer-add-result", lang.hitch(this, this.timeClicked));

                    // Add tooltip to icon nodes

                    new Tooltip({
                        connectId: [this.domNode],
                        selector: ".layer-item",
                        position: ['after'],
                        getContent: function (matchedNode) {
                            return matchedNode.getAttribute("data-tooltip");
                        }
                    });
                },
                onOpen: function () {
                    var checkUrl = window.location.href;
                    var parameters = window.location.href.split("?");
                    if (parameters[1])
                    {
                        parameters[1] = atob(parameters[1]);
                        parameters[1] = parameters[1].replace(/%22/gi, '"');
                        var values = parameters[1].split("&");

                        for (var a = 0; a < 3; a++) {
                            values[a] = JSON.parse(values[a]);
                        }
                        this.appExtent = values[0];
                        this.appRenderer = values[1].rasterFunction;
                        if (values[2] !== null)
                            this.appMosaicRule = values[2];//values[2].lockRasterIds[0];
                        else
                            this.appMosaicRule = null;

                        this.appCloudFilter = values[3];
                        this.appSeasonFilter = values[4];
                        if (this.appRenderer === "Build")
                        {
                            registry.byId("bnd1").set("value", values[5]);
                            registry.byId("bnd2").set("value", values[6]);
                            registry.byId("bnd3").set("value", values[7]);

                            registry.byId("stretchoptions").set("value", values[8]);
                            registry.byId("gammaoptions").set("value", values[9]);
                        }
                        if (typeof (history.pushState) != "undefined") {
                            var changeUrl = parameters[0].split("/index.html")[0];
                            var obj = {Page: "Landsat Aws App", Url: changeUrl};
                            history.pushState(obj, obj.Page, obj.Url);
                        }
                        this.map.setExtent(new Extent(this.appExtent));
                        (dom.byId(this.appRenderer)).click();

                    } else
                        this.multiARadio.click();

                },
                shareClicked: function (socialMedium) {
                    var shareLayer = this.map.getLayer("primaryLayer");

                    if (shareLayer.mosaicRule !== null && shareLayer.mosaicRule.method === "esriMosaicLockRaster")
                        var mosaicRule = registry.byId("lockedSceneName").get("value");//JSON.stringify(shareLayer.mosaicRule.toJson());
                    else
                        var mosaicRule = null;
                    if (shareLayer.renderingRule) {
                        if (shareLayer.renderingRule.functionName !== "Stretch")
                            var renderingRule = JSON.stringify(shareLayer.renderingRule.toJson());
                        else
                            var renderingRule = '{"rasterFunction": "Build"}';
                    } else
                        var renderingRule = null;
                    var mapextent = JSON.stringify(this.map.extent.toJson());

                    if (registry.byId("cloudFilter"))
                        var cloudFilter = registry.byId("cloudFilter").get("value");
                    else
                        var cloudFilter = 0.10;
                    if (registry.byId("seasonSelect"))
                        var seasonFilter = registry.byId("seasonSelect").get("value");
                    else
                        var seasonFilter = 0;
                    var appUrl = window.location.href;
                    if (appUrl[appUrl.length - 1] === "/")
                        appUrl = appUrl.slice(0, appUrl.length - 1);
                    if (appUrl !== "http://www.esri.com/landing-pages/software/landsat/unlock-earths-secrets" || appUrl !== "https://www.esri.com/landing-pages/software/landsat/unlock-earths-secrets") {
                        var appUrl1 = appUrl.split("/index.html")[0];
                        appUrl = appUrl1 + "/index.html";
                    }
                    if (renderingRule !== '{"rasterFunction": "Build"}')
                        var shareUrl = appUrl + "?" + btoa(mapextent + "&" + renderingRule + "&" + mosaicRule + "&" + cloudFilter + "&" + seasonFilter);
                    else
                        var shareUrl = appUrl + "?" + btoa(mapextent + "&" + renderingRule + "&" + mosaicRule + "&" + cloudFilter + "&" + seasonFilter + "&" + registry.byId("bnd1").get("value") + "&" + registry.byId("bnd2").get("value") + "&" + registry.byId("bnd3").get("value") + "&" + registry.byId("stretchoptions").get("value") + "&" + registry.byId("gammaoptions").get("value"));
                    if (socialMedium === "facebook")
                        var share = "http://www.arcgis.com/home/socialnetwork.html?n=fb&t=" + "&u=" + shareUrl;
                    else
                        var share = "http://www.arcgis.com/home/socialnetwork.html?n=tw&t=Landsat on AWS App" + "&u=" + shareUrl;
                    domAttr.set(socialMedium, "href", share);


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

                    this.primaryLayer = this.map.getLayer("primaryLayer");

                    this.gammaval = registry.byId("gammaoptions").get("value");


                    this.gammacompute();
                    var abc = new RasterFunction();
                    abc.functionName = 'Stretch';
                    var args = {};
                    var type = registry.byId("stretchoptions").get("value");


                    this.primaryLayer.setBandIds([parseInt(registry.byId("bnd1").get("value")) - 1, parseInt(registry.byId("bnd2").get("value")) - 1, parseInt(registry.byId("bnd3").get("value")) - 1], false);
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
                            args.Statistics = [[0, 4000, 1000, 1], [0, 2000, 1000, 1], [0, 2000, 1000, 1]];
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
                            args.Statistics = [[0, 1000, 500, 1], [0, 1000, 500, 1], [0, 1000, 500, 1]];
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
                            args.Statistics = [[8000, 10000, 9000, 1], [8000, 10000, 9000, 1], [8000, 10000, 9000, 1]];
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
                            args.Statistics = [[9000, 10000, 9500, 1], [9000, 10000, 9500, 1], [9000, 10000, 9500, 1]];
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
                            args.Statistics = [[0, 10000, 5000, 1], [0, 10000, 5000, 1], [0, 10000, 5000, 1]];
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

                    this.primaryLayer.setRenderingRule(abc, false);
                    this.type = registry.byId("stretchoptions").get("value");
                    this.band1 = registry.byId("bnd1").get("value");
                    this.band2 = registry.byId("bnd2").get("value");
                    this.band3 = registry.byId("bnd3").get("value");
                    this.gamma = this.gammaval;
                    this.saveRenderer = abc;
                    ;
                    //this.primaryLayer.refresh();
                    this.layerflag = false;

                },
                reset1: function ()
                {

                    this.primaryLayer = this.map.getLayer("primaryLayer");
                    var abc1 = new RasterFunction();
                    abc1.functionName = "";
                    var args1 = {};
                    this.primaryLayer.setBandIds([], true);
                    abc1.functionArguments = args1;
                    abc1.variableName = "Raster";
                    this.primaryLayer.setRenderingRule(abc1, false);
                    registry.byId("bnd1").set("value", "6");
                    registry.byId("bnd2").set("value", "5");
                    registry.byId("bnd3").set("value", "2");
                    // }
                    registry.byId("stretchoptions").set("value", "clip2");
                    registry.byId("gammaoptions").set("value", "4");

                },
                timebook: function ()
                {
                    connect.subscribe("timeopen", lang.hitch(this, function (ti)
                    {
                        this.time = ti.time;
                        if (this.time === "open")
                        {

                            if (registry.byId("buildDialog").open)
                                registry.byId("buildDialog").hide();
                        }

                    }));
                    connect.subscribe("bookmarkopen", lang.hitch(this, function (book)
                    {
                        this.book = book.status;
                        if (this.book === "open")
                        {

                            if (registry.byId("buildDialog").open)
                                registry.byId("buildDialog").hide();
                        }

                    }));

                    connect.subscribe("identify", lang.hitch(this, function (idenop)
                    {
                        this.idopen = idenop.idenstatus;

                        if (this.idopen === "open")
                        {
                            if (registry.byId("buildDialog").open)
                                registry.byId("buildDialog").hide();
                        }


                    }));
                },
                timeClicked: function () {
                    if (this.appRenderer === "Build") {
                        dom.byId("apply").click();
                        this.appRenderer = null;
                    }
                    if (this.appMosaicRule !== null) {
                        registry.byId("appSceneID").set("value", JSON.stringify(this.appMosaicRule) + " " + this.appCloudFilter + " " + this.appSeasonFilter);
                        var x = document.getElementsByClassName("icon-node");
                        x[0].click();
                        this.appMosaicRule = null;
                    }


                },
                removeLayersFromMap: function (radiooptions, radio) {
                    if (this.map.getLayer("primaryLayer")) {
                        var layerInfo = this.map.getLayer("primaryLayer");
                        if (layerInfo.url !== this.config.urlLandsatMS) {
                            if (this.map.getLayer("primaryLayer").updating)
                                this.map.getLayer("primaryLayer").suspend();
                            this.map.removeLayer(this.map.getLayer("primaryLayer"));

                        }
                    }
                    this.populateServices(radiooptions, radio);

                },
                populateServices: function (radiooptions, radio) {
                    if (registry.byId("buildDialog").open)
                        registry.byId("buildDialog").hide();
                    if (this.selectedRadio)
                        domClass.remove(this.selectedRadio, "selected");
                    domClass.add(radio, "selected");
                    this.selectedRadio = radio;

                    var rasterFunction = new RasterFunction();
                    if (this.map.getLayer("primaryLayer")) {
                        this.primaryLayer = this.map.getLayer("primaryLayer");
                        if (radiooptions === "Build") {
                            if (this.saveRenderer) {
                                this.primaryLayer.setBandIds([this.band1 - 1, this.band2 - 1, this.band3 - 1, ], true);
                                this.primaryLayer.setRenderingRule(this.saveRenderer);
                            } else {
                                rasterFunction.functionName = "Agriculture with DRA";
                                this.primaryLayer.setBandIds([], true);
                                this.primaryLayer.setRenderingRule(rasterFunction);
                            }
                            if (!registry.byId("buildDialog").open)
                                registry.byId("buildDialog").show();
                            dijitFocus.curNode && dijitFocus.curNode.blur();
                            domStyle.set("buildDialog", "top", "70px");
                            domStyle.set("buildDialog", "left", "160px");
                            domConstruct.destroy("buildDialog_underlay");
                            connect.publish("layerOpen", [{flag: true}]);
                        } else {
                            rasterFunction.functionName = radiooptions;
                            this.primaryLayer.setBandIds([], true);

                            if (registry.byId("buildDialog").open)
                                registry.byId("buildDialog").hide();
                            this.primaryLayer.setRenderingRule(rasterFunction);
                        }
                    } else {
                        var params = new ImageServiceParameters();
                        if (radiooptions === "Pansharpened Enhanced with DRA")
                            var urlForLayer = this.config.urlLandsatPS;
                        else if (radiooptions === "Panchromatic with DRA")
                            var urlForLayer = this.config.urlLandsatPan;
                        else
                            var urlForLayer = this.config.urlLandsatMS;

                        if (radiooptions === "Build") {
                            if (this.saveRenderer) {
                                params.renderingRule = this.saveRenderer;
                                params.bandIds = [this.band1 - 1, this.band2 - 1, this.band3 - 1];
                            } else {
                                rasterFunction.functionName = "Agriculture with DRA";
                                params.bandIds = [];
                                params.renderingRule = rasterFunction;
                            }
                            if (!registry.byId("buildDialog").open)
                                registry.byId("buildDialog").show();
                            dijitFocus.curNode && dijitFocus.curNode.blur();
                            domStyle.set("buildDialog", "top", "70px");
                            domStyle.set("buildDialog", "left", "160px");
                            domConstruct.destroy("buildDialog_underlay");
                            connect.publish("layerOpen", [{flag: true}]);
                        } else {
                            rasterFunction.functionName = radiooptions;
                            params.renderingRule = rasterFunction;

                            if (registry.byId("buildDialog").open)
                                registry.byId("buildDialog").hide();
                        }

                        params.format = "jpgpng";
                        var newLayer = new ArcGISImageServiceLayer(urlForLayer, {
                            imageServiceParameters: params,
                            visible: true,
                            id: "primaryLayer"
                        });

                        this.map.addLayer(newLayer, 1);
                        connect.publish("refreshTime", [{flag: true}]);
                    }
                },
                showLoading: function () {

                    esri.show(dom.byId("loadingLayer"));

                    esri.show(dom.byId("loadingLayer1"));

                },
                hideLoading: function () {

                    esri.hide(dom.byId("loadingLayer"));
                    esri.hide(dom.byId("loadingLayer1"));
                }
            });
            clazz.hasLocale = false;
            return clazz;
        });
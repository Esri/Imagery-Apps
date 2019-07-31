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
    'dijit/_WidgetsInTemplateMixin', "esri/IdentityManager", "esri/layers/MosaicRule",
    'dojo/text!./Widget.html', "esri/layers/ArcGISTiledMapServiceLayer",
    'jimu/BaseWidget', "./resourceLoad.js", "dijit/TooltipDialog", "esri/layers/ImageServiceParameters", "dojo/on", "dojo/domReady!"
],
    function (
        declare,
        _WidgetsInTemplateMixin, IdentityManager, MosaicRule,
        template, ArcGISTiledMapServiceLayer,
        BaseWidget, resourceLoad, TooltipDialog, ImageServiceParameters
    ) {
        var resource = new resourceLoad({ resource: "layer" });
        var plugins = resource.load("layer");
        var on = plugins[0],
            lang = plugins[1],
            domClass = plugins[2],
            RasterFunction = plugins[3],
            ArcGISImageServiceLayer = plugins[4],
            ImageServiceParameters = plugins[5],
            Tooltip = plugins[6], locale = plugins[7],
            domConstruct = plugins[8],
            dom = plugins[9], html = plugins[10], domStyle = plugins[11], connect = plugins[12], esriRequest = plugins[13], arcgisPortal = plugins[14],
            popup = plugins[15],
            Extent = plugins[16], bundle = plugins[17], registry = plugins[18],
            PanelManager = plugins[19],
            domAttr = plugins[20];

        var pm = PanelManager.getInstance();
        var clazz = declare([BaseWidget, _WidgetsInTemplateMixin], {
            templateString: template,
            name: 'ISHeader',
            baseClass: 'jimu-widget-ISHeader',
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
            customProp: [3, 12, "Precipitation", 0, 5],
            updateStartFlag: true,
            storyModeOn: false,
            storyLoadingIconFlag: true,
            primaryLayer: null,

            startup: function () {
                //esri.config.defaults.io.proxyUrl = "/DotNet/proxy.ashx";
                this.inherited(arguments);
                if (window.innerWidth < 1150) {
                    var fontsize = (22 / window.innerWidth) * (window.innerWidth - 170);
                    var fontsize2 = 0.636 * fontsize;
                } else {
                    var fontsize = 22;
                    var fontsize2 = 14;
                }
                if (window.innerWidth < 620) {
                    domStyle.set("bandCombinationDialog", "font-size", "7px");
                    var headerCustom = domConstruct.toDom('<table id="headerTable" style="border: 0px;height: 40px;display: -webkit-inline-box;margin-left: 20px;">' +
                        '<tr style="height: 40px;"><td><div id="appName" style="font-size: ' + fontsize + 'px; position: relative; bottom: 3px; color: white; font-weight: bold;background-color: transparent;">Earth Observation Explorer</div></td><td><div id="rendererInformation" style="font-size: ' + fontsize2 + 'px;color: white; font-weight: bold;background-color: transparent;display:none;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Rendering:&nbsp;Sentinel&nbsp;Natural Color</div>' +
                        '<div style=" font-size: ' + fontsize2 + 'px;color: white; font-weight: bold;background-color: transparent;" id="dateSecondary">&nbsp;&nbsp;Imagery:&nbsp;</div><div style=" font-size: ' + fontsize2 + 'px;color: white; font-weight: bold;background-color: transparent;" id="dateDisplay"></div></td><td><div style=" font-size: ' + fontsize2 + 'px;color: white; font-weight: bold;background-color: transparent;" id="compDisplay"></div></td></tr></table>' +
                        '<div id="socialShortLinks" style="position: absolute;top:0px;right: 8px;display: block;margin-top: 8px;"><a id="userSignIn" target="_self" style="display:inline-block;height:22px;"><img id="signInThumbnail" src="./widgets/ISHeader/images/signIn.png" style="height: 16px;cursor:pointer;" alt="Sign In" /><span id="userName" style="color:white;cursor:pointer;font-size:' + fontsize2 + 'px;font-weight:400;font-family:sans-serif;vertical-align:super;">   Sign In</span></a>&nbsp;&nbsp;&nbsp;<a id="facebook" target="_blank"><img id="facebookThumnail" src="./widgets/ISHeader/images/facebook.png" style="height: 18px;cursor:pointer;" alt="Facebook" /></a>&nbsp;&nbsp;<a  id="twitter" target="_blank"><img id="twitterThumbnail" src="./widgets/ISHeader/images/twitter.png" style="height: 18px;cursor:pointer;" alt="Twitter" /></a>&nbsp;&nbsp;<a  id="link" target="_self"><img id="linkThumbnail" src="./widgets/ISHeader/images/link.png" style="height: 18px;cursor:pointer;" alt="Link" /></a></div>');

                } else if (window.innerWidth < 850) {
                    domStyle.set("bandCombinationDialog", "font-size", "8px");
                    var headerCustom = domConstruct.toDom('<table id="headerTable" style="border: 0px;height: 40px;display: -webkit-inline-box;margin-left: 20px;">' +
                        '<tr style="height: 40px;"><td><div id="appName" style="font-size: ' + fontsize + 'px; position: relative; bottom: 3px; color: white; font-weight: bold;background-color: transparent;">Earth Observation Explorer</div></td><td><div id="rendererInformation" style="font-size: ' + fontsize2 + 'px;color: white; font-weight: bold;background-color: transparent;display:none;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Rendering:&nbsp;Sentinel&nbsp;Natural Color</div></td>' +
                        '<td><div style=" font-size: ' + fontsize2 + 'px;color: white; font-weight: bold;background-color: transparent;" id="dateSecondary">&nbsp;&nbsp;Imagery:&nbsp;</div><div style=" font-size: ' + fontsize2 + 'px;color: white; font-weight: bold;background-color: transparent;" id="dateDisplay"></div></td><td><div style=" font-size: ' + fontsize2 + 'px;color: white; font-weight: bold;background-color: transparent;" id="compDisplay"></div></td></tr></table>' +
                        '<div id="socialShortLinks" style="position: absolute;top:0px;right: 8px;display: block;margin-top: 8px;"><a id="userSignIn" target="_self" style="display:inline-block;height:22px;"><img id="signInThumbnail" src="./widgets/ISHeader/images/signIn.png" style="height: 19px;cursor:pointer;" alt="Sign In" /><span id="userName" style="color:white;cursor:pointer;font-size:' + fontsize2 + 'px;font-weight:400;font-family:sans-serif;vertical-align:super;">   Sign In</span></a>&nbsp;&nbsp;&nbsp;<a id="facebook" target="_blank"><img id="facebookThumnail" src="./widgets/ISHeader/images/facebook.png" style="height: 22px;cursor:pointer;" alt="Facebook" /></a>&nbsp;&nbsp;<a  id="twitter" target="_blank"><img id="twitterThumbnail" src="./widgets/ISHeader/images/twitter.png" style="height: 22px;cursor:pointer;" alt="Twitter" /></a>&nbsp;&nbsp;<a  id="link" target="_self"><img id="linkThumbnail" src="./widgets/ISHeader/images/link.png" style="height: 22px;cursor:pointer;" alt="Link" /></a></div>');

                } else {
                    domStyle.set("bandCombinationDialog", "font-size", "12px");
                    var headerCustom = domConstruct.toDom('<table id="headerTable" style="border: 0px;height: 40px;display: -webkit-inline-box;margin-left: 20px;">' +
                        '<tr style="height: 40px;"><td><div id="appName" style="font-size: ' + fontsize + 'px; position: relative; bottom: 3px; color: white; font-weight: bold;background-color: transparent;">Earth Observation Explorer</div></td><td><div id="rendererInformation" style="font-size: ' + fontsize2 + 'px;color: white; font-weight: bold;background-color: transparent;display:none;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Rendering:&nbsp;Sentinel&nbsp;Natural Color</div></td>' +
                        '<td><div style=" font-size: ' + fontsize2 + 'px;color: white; font-weight: bold;background-color: transparent;" id="dateSecondary">&nbsp;&nbsp;Imagery:&nbsp;</div></td><td><div style=" font-size: ' + fontsize2 + 'px;color: white; font-weight: bold;background-color: transparent;" id="dateDisplay"></div></td><td><div style=" font-size: ' + fontsize2 + 'px;color: white; font-weight: bold;background-color: transparent;" id="compDisplay"></div></td></tr></table>' +
                        '<div id="socialShortLinks" style="position: absolute;top:0px;right: 8px;display: block;margin-top: 8px;"><a id="userSignIn" target="_self" style="display:inline-block;height:22px;"><img id="signInThumbnail" src="./widgets/ISHeader/images/signIn.png" style="height: 22px;cursor:pointer;" alt="Sign In" /><span id="userName" style="color:white;cursor:pointer;font-size:' + fontsize2 + 'px;font-weight:400;font-family:sans-serif;vertical-align:super;">   Sign In</span></a>&nbsp;&nbsp;&nbsp;<a id="facebook" target="_blank"><img id="facebookThumnail" src="./widgets/ISHeader/images/facebook.png" style="height: 25px;cursor:pointer;" alt="Facebook" /></a>&nbsp;&nbsp;<a  id="twitter" target="_blank"><img id="twitterThumbnail" src="./widgets/ISHeader/images/twitter.png" style="height: 25px;cursor:pointer;" alt="Twitter" /></a>&nbsp;&nbsp;<a  id="link" target="_self"><img id="linkThumbnail" src="./widgets/ISHeader/images/link.png" style="height: 25px;cursor:pointer;" alt="Link" /></a></div>');

                }
                domConstruct.place(headerCustom, "jimu-layout-manager", "after");
                domConstruct.place('<img id="loadingLayer" style="position: absolute;top:0;bottom: 0;left: 0;right: 0;margin:auto;z-index:100;display:none;" src="' + require.toUrl('jimu') + '/images/loading.gif">', this.map.container);
                domConstruct.place('<img id="loadingLayer1" style="position: absolute;top:0;bottom: 0;left: 0;right: 0;margin:auto;z-index:100;" src="' + require.toUrl('jimu') + '/images/loading.gif">', "bandCombinationDialog");

                on(dom.byId("facebook"), "click", lang.hitch(this, this.shareClicked, "facebook"));
                on(dom.byId("twitter"), "click", lang.hitch(this, this.shareClicked, "twitter"));
                on(dom.byId("link"), "click", lang.hitch(this, this.shareClicked, "link"));
                on(dom.byId("userSignIn"), "click", lang.hitch(this, this.userSignIn));

                new Tooltip({
                    connectId: ["appName"],
                    label: "Explore Sentinel/Landsat Imagery with ArcGIS.",
                    position: ['below']
                });
                var params = new ImageServiceParameters();
                params.format = "jpgpng";
                //params.mosaicRule = new MosaicRule({"mosaicMethod":"esriMosaicAttribute", "sortField":"Best", "sortValue":"0", "ascending":true, "mosaicOperation":"MT_FIRST"});
                var landsat = new ArcGISImageServiceLayer("https://landsat2.arcgis.com/arcgis/rest/services/Landsat/MS/ImageServer", {
                    id: "MS_696",
                    title: "Landsat",
                    imageServiceParameters: params                  
                });
                landsat.setRenderingRule(new RasterFunction({ "rasterFunction": "Natural Color with DRA" }));
                //this.map.addLayer(landsat);
                var sentinel = new ArcGISImageServiceLayer("https://utility.arcgis.com/usrsvcs/servers/d70ebb358d28463a99e574d56265dd95/rest/services/Sentinel2/ImageServer", {
                    id: "Sentinel2_2553",
                    visible: false,
                    title: "Sentinel 2",
                    imageServiceParameters: params
                });
                sentinel.hide();

                this.map.addLayers([landsat, sentinel]);


                this.acquisitionDate = "AcquisitionDate";
                landsat.on("update-end", lang.hitch(this, this.timebook, landsat));

                //this.timebook(landsat);
                this.map.primaryLayer = landsat;
                this.map.primaryLayer.serviceDataType = "esriImageService";
                // this.map.on("extent-change", lang.hitch(this, function () {
                //     if (this.map.getLayer("MS_696").visible) {
                //         var mosaic = new MosaicRule({ "method": "esriMosaicAttribute", "sortField": "Best", "sortValue": "0", "ascending": true, "mosaicOperation": "MT_FIRST" });
                //         this.map.getLayer("MS_696").setMosaicRule(mosaic);
                //         dom.byId("dateDisplay").innerHTML = "Landsat";
                //     } else if (this.map.getLayer("Sentinel2_2553").visible) {
                //         var mosaic = new MosaicRule({ "method": "esriMosaicAttribute", "sortField": "Best", "sortValue": "0", "ascending": true, "mosaicOperation": "MT_FIRST" });
                //         this.map.getLayer("Sentinel2_2553").setMosaicRule(mosaic);
                //         dom.byId("dateDisplay").innerHTML = "Sentinel 2";
                //     }
                // }));
                

                this.resizeLayersWidget();
            },

            resizeLayersWidget: function () {
                if (window.innerWidth < 1150) {
                    var fontsize = (22 / window.innerWidth) * (window.innerWidth - 170);
                    var fontsize2 = 0.636 * fontsize;
                } else {
                    var fontsize = 22;
                    var fontsize2 = 14;
                }
                document.getElementById("userName").style.fontSize = fontsize2 + "px";
                var appName = document.getElementById("appName")
                var rendererDom = document.getElementById("rendererInformation");
                var secondaryDom = document.getElementById("dateSecondary");
                var primaryDom = document.getElementById("dateDisplay");
                var compareDom = document.getElementById("compDisplay");
                var x = document.getElementsByClassName("dijitCheckBox");

                domStyle.set(appName, "font-size", fontsize + "px");
                domStyle.set(rendererDom, "font-size", fontsize2 + "px");
                domStyle.set(secondaryDom, "font-size", fontsize2 + "px");
                domStyle.set(primaryDom, "font-size", fontsize2 + "px");
                domStyle.set(compareDom, "font-size", fontsize2 + "px");
                domStyle.set("facebookThumnail", "height", (fontsize2 + 10) + "px");
                domStyle.set("signInThumbnail", "height", (fontsize2 + 10) + "px");
                domStyle.set("twitterThumbnail", "height", (fontsize2 + 10) + "px");
                domStyle.set("linkThumbnail", "height", (fontsize2 + 10) + "px");
                var table = document.getElementById("headerTable");
                table.deleteRow(0);
                var row = table.insertRow(0);
                row.style = "height:40px";
                var cell = row.insertCell(0);
                cell.innerHTML = appName.outerHTML;
                var cell1 = row.insertCell(1);
                //domStyle.set("rendererInfoDialog", "top", "110px");
                //domStyle.set("rendererInfoDialog", "left", 170 + document.getElementById("bandCombinationDialog").offsetWidth + "px");
                if (window.innerWidth < 620) {
                    //domStyle.set("bandCombinationDialog", "font-size", "7px");
                    //domStyle.set("rendererInfoDialog", "font-size", "7px");
                    cell1.innerHTML = rendererDom.outerHTML + secondaryDom.outerHTML + primaryDom.outerHTML + compareDom.outerHTML;
                    for (var a = 0; a < x.length; a++) {
                        domStyle.set(x[a], "height", "9px");
                        domStyle.set(x[a], "width", "9px");
                    }
                    //appName.style.display = "none";
                } else if (window.innerWidth < 850) {
                    //domStyle.set("bandCombinationDialog", "font-size", "8px");
                    //domStyle.set("rendererInfoDialog", "font-size", "8px");
                    cell1.innerHTML = rendererDom.outerHTML;
                    var cell2 = row.insertCell(2);
                    cell2.innerHTML = secondaryDom.outerHTML + primaryDom.outerHTML + compareDom.outerHTML;
                    for (var a = 0; a < x.length; a++) {
                        domStyle.set(x[a], "height", "11px");
                        domStyle.set(x[a], "width", "11px");
                    }
                } else {
                    //domStyle.set("bandCombinationDialog", "font-size", "12px");
                    //domStyle.set("rendererInfoDialog", "font-size", "12px");
                    cell1.innerHTML = rendererDom.outerHTML;
                    var cell2 = row.insertCell(2);
                    cell2.innerHTML = secondaryDom.outerHTML;
                    var cell3 = row.insertCell(3);
                    cell3.innerHTML = primaryDom.outerHTML;
                    var cell4 = row.insertCell(4);
                    cell4.innerHTML = compareDom.outerHTML;
                    for (var a = 0; a < x.length; a++) {
                        domStyle.set(x[a], "height", "14px");
                        domStyle.set(x[a], "width", "14px");
                    }
                }

            },

            postCreate: function () {
                //domStyle.set(document.getElementsByClassName('icon-node')[2], 'display', 'none');
                window.addEventListener("resize", lang.hitch(this, function () {

                    if (registry.byId("Explore Imagery") && registry.byId("Explore Imagery").open) {
                        var tempDialog = "Explore Imagery";
                    }

                    else if (registry.byId("Compare Imagery") && registry.byId("Compare Imagery").open) {
                        var tempDialog = "Compare Imagery";
                        this.primaryLayer = this.map.getLayer(registry.byId("leftLayerSelector").value);
                    }

                    else if (registry.byId("Image Export") && registry.byId("Image Export").open) {
                        var tempDialog = "Image Export";
                    }

                    else if (registry.byId("Add Data from ArcGIS Online") && registry.byId("Add Data from ArcGIS Online").open) {
                        var tempDialog = "Add Data from ArcGIS Online";
                    }

                    else if (registry.byId("Bookmarks") && registry.byId("Bookmarks").open) {
                        var tempDialog = "Bookmarks";
                    }

                    else if (registry.byId("About") && registry.byId("About").open) {
                        var tempDialog = "About";
                    }

                    if (tempDialog) {
                        domStyle.set(tempDialog, "left", "160px");
                        domStyle.set(tempDialog, "top", "100px");
                    }
                    if (registry.byId("linkDialog").open) {
                        domStyle.set("linkDialog", "right", "20px");
                        domStyle.set("linkDialog", "top", "60px");
                        domStyle.set("linkDialog", "left", "auto");
                    }
                    // domStyle.set("_8_panel", "top", "40px");
                    // domStyle.set("_8_panel", "position", "absolute");
                    // domStyle.set("_8_panel", "width", "95px");
                    // domStyle.set("_8_panel", "height", "60px");
                    this.resizeLayersWidget();
                }));

            },

            onOpen: function () {
                this.inherited(arguments);
                console.log("open");
                var checkUrl = window.location.href;
                var parameters = window.location.href.split("?");
                if (parameters[1]) {
                    /*if (parameters[1].includes("story="))
                    {

                        domStyle.set(dom.byId("bandCombination"), "display", "none");
                    } else {*/

                    parameters[1] = atob(parameters[1]);
                    parameters[1] = parameters[1].replace(/%22/gi, '"');
                    var values = parameters[1].split("&");
                    if (values) {
                        for (var a = 0; a < 3; a++) {
                            values[a] = JSON.parse(values[a]);
                        }
                        this.appExtent = values[0];
                        this.appRenderer = values[1].rasterFunction;
                        if (this.appRenderer === "Build") {
                            registry.byId("redBuild").set("value", values[14]);
                            registry.byId("blueBuild").set("value", values[15]);
                            registry.byId("greenBuild").set("value", values[16]);
                            registry.byId("stretchBuild").set("value", values[17]);
                            registry.byId("gammaBuild").set("value", values[18]);
                        } else if (this.appRenderer === "Index") {
                            registry.byId("bandAIndex").set("value", values[14]);
                            registry.byId("bandBIndex").set("value", values[15]);
                            registry.byId("offsetIndex").set("value", values[16]);
                            registry.byId("scaleIndex").set("value", values[17]);
                            registry.byId("renderIndex").set("value", values[18]);
                        } else if (!this.appRenderer) {
                            this.map.appRenderer = values[1];
                        }
                        if (values[2]) {
                            this.secondaryAppRend = values[2].rasterFunction;

                            if (this.secondaryAppRend === "Build") {
                                registry.byId("redBuildSec").set("value", values[19]);
                                registry.byId("blueBuildSec").set("value", values[20]);
                                registry.byId("greenBuildSec").set("value", values[21]);
                                registry.byId("stretchBuildSec").set("value", values[22]);
                                registry.byId("gammaBuildSec").set("value", values[23]);
                            } else if (this.secondaryAppRend === "Index") {
                                registry.byId("bandAIndexSec").set("value", values[19]);
                                registry.byId("bandBIndexSec").set("value", values[20]);
                                registry.byId("offsetIndexSec").set("value", values[21]);
                                registry.byId("scaleIndexSec").set("value", values[22]);
                                registry.byId("renderIndexSec").set("value", values[23]);
                            } else if (!this.secondaryAppRend) {
                                this.map.secondaryAppRend = values[2];
                            }
                        }
                        this.appSensor = values[3];
                        this.secondaryAppSensor = values[4];

                        if (values[5] !== "null") {
                            this.appMosaicRule = values[5];
                        }
                        else {
                            this.appMosaicRule = null;
                        }

                        if (values[6] !== "null") {
                            this.secondaryMosaicRule = values[6];
                        }
                        else {
                            this.secondaryMosaicRule = null;
                        }

                        this.appCloudFilter = values[7];


                        //this.secondaryLayerObject = values[5];
                        this.changeOrMask = values[13];
                        // if (this.changeOrMask === "change" || this.changeOrMask === "mask") {
                        //     registry.byId("changeProp").set("value", values[6] + "," + values[7] + "," + values[8] + "," + values[9] + "," + values[10]);
                        // }
                        if (this.changeOrMask === "mask") {
                            registry.byId("maskSliderReceiveValue").set("value", values[9]);
                            registry.byId("methodValue").set("value", values[8]);
                        } else if (this.changeOrMask === "change") {
                            registry.byId("methodValue").set("value", values[8]);
                            registry.byId("modeValue").set("value", values[10]);
                        }
                        this.map.setExtent(new Extent(this.appExtent));

                        //  }
                    }
                    if (typeof (history.pushState) !== "undefined") {
                        var changeUrl = parameters[0].split("index.html")[0];
                        var obj = { Page: "Earth Observation Explorer", Url: changeUrl };
                        history.pushState(obj, obj.Page, obj.Url);
                    }


                }

                IdentityManager.on("credential-create", lang.hitch(this, function (e) {

                    if (e.credential.server.indexOf("arcgis.com") !== -1) {
                        if (document.getElementById("userName").innerHTML === "   Sign In") {
                            this.portal = new arcgisPortal.Portal("http://www.arcgis.com");
                            bundle.identity.lblItem = "Account";
                            var tempText = (bundle.identity.info).split("access the item on");
                            bundle.identity.info = tempText[0] + tempText[1];

                            this.portal.signIn().then(lang.hitch(this, function (user) {

                                document.getElementById("signInThumbnail").src = "./widgets/ISHeader/images/user.png";
                                document.getElementById("userName").innerHTML = "   Sign Out";
                            }));
                        }
                        this.map.useSecureService = true;
                    }
                }));
                IdentityManager.on("credentials-destroy", lang.hitch(this, function (e) {
                    this.map.useSecureService = false;
                }));

                if (this.changeOrMask !== "null") {
                    if (this.changeOrMask === "mask") {
                        registry.byId("sensorNAME").set("value", this.appSensor);
                        registry.byId("renderNAME").set("value", this.appRenderer);
                        if (this.appMosaicRule) {
                            registry.byId("currentOBJECTID").set("value", this.appMosaicRule);
                        }
                        x = document.getElementsByClassName("icon-node");
                        registry.byId("changeMaskDetect").set("value", "mask");
                        setTimeout(function () {
                            x[0].click();
                        }, 3000);
                    } else if (this.changeOrMask === "change") {
                        registry.byId("sensorNAME").set("value", this.appSensor);
                        registry.byId("secondarySensorNAME").set("value", this.secondaryAppSensor);
                        registry.byId("renderNAME").set("value", this.appRenderer);
                        registry.byId("secondaryRenderNAME").set("value", this.secondaryAppRend);
                        if (this.appMosaicRule) {
                            registry.byId("currentOBJECTID").set("value", this.appMosaicRule);
                        }
                        if (this.secondaryMosaicRule) {
                            registry.byId("secondOBJECTID").set("value", this.secondaryMosaicRule);
                        }
                        x = document.getElementsByClassName("icon-node");
                        registry.byId("changeMaskDetect").set("value", "change");
                        setTimeout(function () {
                            x[1].click();
                        }, 3000);
                    }

                }
                else if (this.appSensor && this.secondaryAppSensor === "null") {
                    registry.byId("sensorNAME").set("value", this.appSensor);
                    registry.byId("renderNAME").set("value", this.appRenderer);
                    if (this.appMosaicRule) {
                        registry.byId("currentOBJECTID").set("value", this.appMosaicRule);
                    }
                    x = document.getElementsByClassName("icon-node");
                    setTimeout(function () {
                        x[0].click();
                    }, 3000);

                } else if (this.appSensor && this.secondaryAppSensor !== "null") {
                    registry.byId("sensorNAME").set("value", this.appSensor);
                    registry.byId("secondarySensorNAME").set("value", this.secondaryAppSensor);
                    registry.byId("renderNAME").set("value", this.appRenderer);
                    registry.byId("secondaryRenderNAME").set("value", this.secondaryAppRend);
                    if (this.appMosaicRule) {
                        registry.byId("currentOBJECTID").set("value", this.appMosaicRule);
                    }
                    if (this.secondaryMosaicRule) {
                        registry.byId("secondOBJECTID").set("value", this.secondaryMosaicRule);
                    }
                    x = document.getElementsByClassName("icon-node");
                    setTimeout(function () {
                        x[1].click();
                    }, 3000);
                }
            },

            onclose: function () {
                console.log("close");
            },

            timebook: function (value) {
                if (!this.storyModeOn) {
                    var getLayerProperties = this.map.getLayer(value.id);
                    if (getLayerProperties && (!getLayerProperties.mosaicRule || getLayerProperties.mosaicRule.method !== "esriMosaicLockRaster")) {

                        dom.byId("dateDisplay").innerHTML = "Landsat";

                    }
                }
            },

            shareClicked: function (socialMedium) {
                if (!this.storyModeOn) {
                    var shareLayer = this.map.primaryLayer;
                    if (shareLayer.id === "MS_696") {
                        var sensorName = "MS_696";
                    } else if (shareLayer.id === "Sentinel2_2553") {
                        var sensorName = "Sentinel2_2553";
                    }
                    if (shareLayer.mosaicRule && shareLayer.mosaicRule.method === "esriMosaicLockRaster") {
                        var mosaicRule = registry.byId("primarySceneId").get("value");
                    }
                    else {
                        var mosaicRule = null;
                    }
                    if (shareLayer.renderingRule) {
                        if (shareLayer.renderingRule.functionName === "Stretch") {
                            var renderingRule = '{"rasterFunction": "Build"}';
                        }
                        else if (shareLayer.renderingRule.functionName === "Colormap") {
                            var renderingRule = '{"rasterFunction": "Index"}';
                        }
                        else {
                            var renderingRule = JSON.stringify(shareLayer.renderingRule.toJson());
                        }
                    } else {
                        var renderingRule = null;
                    }
                    var mapextent = JSON.stringify(this.map.extent.toJson());

                    if (registry.byId("cloudFilter")) {
                        var cloudFilter = registry.byId("cloudFilter").get("value");
                    }
                    else {
                        var cloudFilter = 0.10;
                    }
                    if (registry.byId("cloudFilterLeft")) {
                        var cloudFilterLeft = registry.byId("cloudFilterLeft").get("value");
                    } else {
                        var cloudFilterLeft = 0.10;
                    }
                    if (registry.byId("cloudFilterRight")) {
                        var cloudFilterRight = registry.byId("cloudFilterRight").get("value");
                    } else {
                        var cloudFilterRight = 0.10;
                    }

                    var appUrl = window.location.href;
                    if (appUrl[appUrl.length - 1] === "/") {
                        appUrl = appUrl.slice(0, appUrl.length - 1);
                    }
                    if (!appUrl.includes("/index.html")) {
                        appUrl = appUrl + "/index.html";
                    }

                    var x = document.getElementsByClassName("icon-node");
                    if (this.map.secondaryLayer) {
                        if (this.map.secondaryLayer.id === "MS_696_Right") {
                            var secondarySensor = "MS_696";
                        } else if (this.map.secondaryLayer.id === "Sentinel2_2553_Right") {
                            var secondarySensor = "Sentinel2_2553";
                        }
                        if (this.map.secondaryLayer.mosaicRule && this.map.secondaryLayer.mosaicRule.method === "esriMosaicLockRaster") {
                            var secondaryMosaic = registry.byId(("secondarySceneId")).get("value");
                        } else {
                            var secondaryMosaic = null;
                        }
                        if (this.map.secondaryLayer.renderingRule) {
                            if (this.map.secondaryLayer.renderingRule.functionName === "Stretch") {
                                var renderingRuleSec = '{"rasterFunction": "Build"}';
                            }
                            else if (this.map.secondaryLayer.renderingRule.functionName === "Colormap") {
                                var renderingRuleSec = '{"rasterFunction": "Index"}';
                            }
                            else {
                                var renderingRuleSec = JSON.stringify(this.map.secondaryLayer.renderingRule.toJson());
                            }
                        } else {
                            var renderingRuleSec = null
                        }

                    } else {
                        var secondarySensor = null;
                        var secondaryMosaic = null;
                        var renderingRuleSec = null
                    }


                    if (this.map.getLayer("resultLayer")) {
                        if (registry.byId("changeMaskDetect").get("value") === "change") {
                            var thresholdValue = registry.byId("thresholdValue").get("value");
                            var differenceRange = registry.byId("differenceValue").get("value");
                            var negativeRange = registry.byId("negativeRange").get("value");
                            var changeMode = registry.byId("changeModeList").get("value");
                            var changeIndex = registry.byId("methodChange").get("value");
                            var changeMaskFlag = "change";
                        } else if (registry.byId("changeMaskDetect").get("value") === "mask") {
                            var changeIndex = registry.byId("methodMask").get("value");
                            var thresholdValue = registry.byId("maskSliderValue").get("value");
                            var differenceRange = null;
                            var negativeRange = null;
                            var changeMode = null;
                            var changeMaskFlag = "mask";
                        }
                    } else {
                        var changeMaskFlag = null;
                        var thresholdValue = null;
                        var differenceRange = null;
                        var negativeRange = null;
                        var changeMode = null;
                        var changeIndex = null;
                    }

                    if (renderingRule !== '{"rasterFunction": "Build"}' && renderingRule !== '{"rasterFunction": "Index"}' && renderingRuleSec !== '{"rasterFunction": "Build"}' && renderingRuleSec !== '{"rasterFunction": "Index"}') {
                        var shareUrl = appUrl + "?" + btoa(mapextent + "&" + renderingRule + "&" + renderingRuleSec + "&" + sensorName + "&" + secondarySensor + "&" + mosaicRule + "&" + secondaryMosaic + "&" + cloudFilter + "&" + changeIndex + "&" + thresholdValue + "&" + changeMode + "&" + negativeRange + "&" + differenceRange + "&" + changeMaskFlag);
                    }
                    else if (renderingRule === '{"rasterFunction": "Build"}' && renderingRuleSec === '{"rasterFunction": "Build"}') {
                        var shareUrl = appUrl + "?" + btoa(mapextent + "&" + renderingRule + "&" + renderingRuleSec + "&" + sensorName + "&" + secondarySensor + "&" + mosaicRule + "&" + secondaryMosaic + "&" + cloudFilter + "&" + changeIndex + "&" + thresholdValue + "&" + changeMode + "&" + negativeRange + "&" + differenceRange + "&" + changeMaskFlag + "&" + registry.byId("redBuild").get("value") + "&" + registry.byId("blueBuild").get("value") + "&" + registry.byId("greenBuild").get("value") + "&" + registry.byId("stretchBuild").get("value") + "&" + registry.byId("gammaBuild").get("value") + "&" + registry.byId("redBuildSec").get("value") + "&" + registry.byId("blueBuildSec").get("value") + "&" + registry.byId("greenBuildSec").get("value") + "&" + registry.byId("stretchBuildSec").get("value") + "&" + registry.byId("gammaBuildSec").get("value"));
                    }
                    else if (renderingRule === '{"rasterFunction": "Index"}' && renderingRuleSec === '{"rasterFunction": "Index"}') {
                        var shareUrl = appUrl + "?" + btoa(mapextent + "&" + renderingRule + "&" + renderingRuleSec + "&" + sensorName + "&" + secondarySensor + "&" + mosaicRule + "&" + secondaryMosaic + "&" + cloudFilter + "&" + changeIndex + "&" + thresholdValue + "&" + changeMode + "&" + negativeRange + "&" + differenceRange + "&" + changeMaskFlag + "&" + registry.byId("bandAIndex").get("value") + "&" + registry.byId("bandBIndex").get("value") + "&" + registry.byId("offsetIndex").get("value") + "&" + registry.byId("scaleIndex").get("value") + "&" + registry.byId("renderIndex").get("value") + "&" + registry.byId("bandAIndexSec").get("value") + "&" + registry.byId("bandBIndexSec").get("value") + "&" + registry.byId("offsetIndexSec").get("value") + "&" + registry.byId("scaleIndexSec").get("value") + "&" + registry.byId("renderIndexSec").get("value"));
                    }
                    else if (renderingRule === '{"rasterFunction": "Index"}' && renderingRuleSec === '{"rasterFunction": "Build"}') {
                        var shareUrl = appUrl + "?" + btoa(mapextent + "&" + renderingRule + "&" + renderingRuleSec + "&" + sensorName + "&" + secondarySensor + "&" + mosaicRule + "&" + secondaryMosaic + "&" + cloudFilter + "&" + changeIndex + "&" + thresholdValue + "&" + changeMode + "&" + negativeRange + "&" + differenceRange + "&" + changeMaskFlag + "&" + registry.byId("bandAIndex").get("value") + "&" + registry.byId("bandBIndex").get("value") + "&" + registry.byId("offsetIndex").get("value") + "&" + registry.byId("scaleIndex").get("value") + "&" + registry.byId("renderIndex").get("value") + "&" + registry.byId("redBuildSec").get("value") + "&" + registry.byId("blueBuildSec").get("value") + "&" + registry.byId("greenBuildSec").get("value") + "&" + registry.byId("stretchBuildSec").get("value") + "&" + registry.byId("gammaBuildSec").get("value"));
                    }
                    else if (renderingRule === '{"rasterFunction": "Build"}' && renderingRuleSec === '{"rasterFunction": "Index"}') {
                        var shareUrl = appUrl + "?" + btoa(mapextent + "&" + renderingRule + "&" + renderingRuleSec + "&" + sensorName + "&" + secondarySensor + "&" + mosaicRule + "&" + secondaryMosaic + "&" + cloudFilter + "&" + changeIndex + "&" + thresholdValue + "&" + changeMode + "&" + negativeRange + "&" + differenceRange + "&" + changeMaskFlag + "&" + registry.byId("redBuild").get("value") + "&" + registry.byId("blueBuild").get("value") + "&" + registry.byId("greenBuild").get("value") + "&" + registry.byId("stretchBuild").get("value") + "&" + registry.byId("gammaBuild").get("value") + "&" + registry.byId("bandAIndexSec").get("value") + "&" + registry.byId("bandBIndexSec").get("value") + "&" + registry.byId("offsetIndexSec").get("value") + "&" + registry.byId("scaleIndexSec").get("value") + "&" + registry.byId("renderIndexSec").get("value"));
                    }
                    else if (renderingRule === '{"rasterFunction": "Build"}' && renderingRuleSec !== '{"rasterFunction": "Build"}' && renderingRuleSec !== '{"rasterFunction": "Index"}') {
                        var shareUrl = appUrl + "?" + btoa(mapextent + "&" + renderingRule + "&" + renderingRuleSec + "&" + sensorName + "&" + secondarySensor + "&" + mosaicRule + "&" + secondaryMosaic + "&" + cloudFilter + "&" + changeIndex + "&" + thresholdValue + "&" + changeMode + "&" + negativeRange + "&" + differenceRange + "&" + changeMaskFlag + "&" + registry.byId("redBuild").get("value") + "&" + registry.byId("blueBuild").get("value") + "&" + registry.byId("greenBuild").get("value") + "&" + registry.byId("stretchBuild").get("value") + "&" + registry.byId("gammaBuild").get("value"));
                    }
                    else if (renderingRule === '{"rasterFunction": "Index"}' && renderingRuleSec !== '{"rasterFunction": "Build"}' && renderingRuleSec !== '{"rasterFunction": "Index"}') {
                        var shareUrl = appUrl + "?" + btoa(mapextent + "&" + renderingRule + "&" + renderingRuleSec + "&" + sensorName + "&" + secondarySensor + "&" + mosaicRule + "&" + secondaryMosaic + "&" + cloudFilter + "&" + changeIndex + "&" + thresholdValue + "&" + changeMode + "&" + negativeRange + "&" + differenceRange + "&" + changeMaskFlag + "&" + registry.byId("bandAIndex").get("value") + "&" + registry.byId("bandBIndex").get("value") + "&" + registry.byId("offsetIndex").get("value") + "&" + registry.byId("scaleIndex").get("value") + "&" + registry.byId("renderIndex").get("value"));
                    }
                    else if (renderingRule !== '{"rasterFunction": "Build"}' && renderingRule !== '{"rasterFunction": "Index"}' && renderingRuleSec === '{"rasterFunction": "Build"}') {
                        var shareUrl = appUrl + "?" + btoa(mapextent + "&" + renderingRule + "&" + renderingRuleSec + "&" + sensorName + "&" + secondarySensor + "&" + mosaicRule + "&" + secondaryMosaic + "&" + cloudFilter + "&" + changeIndex + "&" + thresholdValue + "&" + changeMode + "&" + negativeRange + "&" + differenceRange + "&" + changeMaskFlag + "&" + null + "&" + null + "&" + null + "&" + null + "&" + null + "&" + registry.byId("redBuildSec").get("value") + "&" + registry.byId("blueBuildSec").get("value") + "&" + registry.byId("greenBuildSec").get("value") + "&" + registry.byId("stretchBuildSec").get("value") + "&" + registry.byId("gammaBuildSec").get("value"));
                    }
                    else if (renderingRule !== '{"rasterFunction": "Build"}' && renderingRule !== '{"rasterFunction": "Index"}' && renderingRuleSec === '{"rasterFunction": "Index"}') {
                        var shareUrl = appUrl + "?" + btoa(mapextent + "&" + renderingRule + "&" + renderingRuleSec + "&" + sensorName + "&" + secondarySensor + "&" + mosaicRule + "&" + secondaryMosaic + "&" + cloudFilter + "&" + changeIndex + "&" + thresholdValue + "&" + changeMode + "&" + negativeRange + "&" + differenceRange + "&" + changeMaskFlag + "&" + null + "&" + null + "&" + null + "&" + null + "&" + null + "&" + registry.byId("bandAIndexSec").get("value") + "&" + registry.byId("bandBIndexSec").get("value") + "&" + registry.byId("offsetIndexSec").get("value") + "&" + registry.byId("scaleIndexSec").get("value") + "&" + registry.byId("renderIndexSec").get("value"));
                    }
                } else {
                    var shareUrl = "http://landsatexplorer.esri.com/index.html?story=" + this.storyId;
                }

                if (socialMedium === "facebook") {
                    var share = "http://www.arcgis.com/home/socialnetwork.html?n=fb&t=Earth Observation Explorer" + "&u=" + shareUrl;
                }
                else if (socialMedium === "twitter") {
                    var share = "http://www.arcgis.com/home/socialnetwork.html?n=tw&t=Earth Observation Explorer" + "&u=" + shareUrl;
                }
                else {
                    var share = "https://arcg.is/prod/shorten";
                }
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
                            domStyle.set(registry.byId('linkValue').domNode, 'display', 'block');
                            registry.byId("linkValue").set("value", response.data.url);
                            domStyle.set('linkerror', 'display', 'none');
                            if (!registry.byId("linkDialog").open) {
                                registry.byId("linkDialog").show();
                            }
                            domStyle.set("linkDialog", "right", "20px");
                            domStyle.set("linkDialog", "top", "60px");
                            domStyle.set("linkDialog", "left", "auto");
                            domConstruct.destroy("linkDialog_underlay");
                        }
                    }), lang.hitch(this, function (error) {
                        //console.log(error);

                        //registry.byId("linkValue").set("value", "");
                        domStyle.set(registry.byId('linkValue').domNode, 'display', 'none');
                        domStyle.set('linkerror', 'display', 'block');
                            if (!registry.byId("linkDialog").open) {
                                registry.byId("linkDialog").show();
                            }
                            domStyle.set("linkDialog", "right", "20px");
                            domStyle.set("linkDialog", "top", "60px");
                            domStyle.set("linkDialog", "left", "auto");
                            domConstruct.destroy("linkDialog_underlay");
                    }));
                }


            },

            userSignIn: function () {
                var x = document.getElementsByClassName("icon-node");
                for (var i = 0; i < x.length; i++) {

                    if (domClass.contains(x[i], "jimu-state-selected")) {
                        x[i].click();
                    }

                }
                if (document.getElementById("userName").innerHTML === "   Sign In") {
                    this.portal = new arcgisPortal.Portal("http://www.arcgis.com");
                    bundle.identity.lblItem = "Account";
                    var tempText = (bundle.identity.info).split("access the item on");
                    bundle.identity.info = tempText[0] + tempText[1];
                    IdentityManager.useSignInPage = false;
                    this.portal.signIn().then(lang.hitch(this, function (user) {

                        document.getElementById("signInThumbnail").src = "./widgets/ISHeader/images/user.png";
                        document.getElementById("userName").innerHTML = "   Sign Out";
                        this.map.secureService = true;
                        var params = new ImageServiceParameters();
                        params.format = "jpgpng";
                        var newSentinel = new ArcGISImageServiceLayer("https://sentinel.arcgis.com/arcgis/rest/services/Sentinel2/ImageServer", {
                            id: "Sentinel2_2553",
                            imageServiceParameters: params,
                            title: "Sentinel 2"
                        });
                        newSentinel.defaultBandIds = this.map.getLayer("Sentinel2_2553").defaultBandIds;
                        newSentinel.defaultMosaicRule = this.map.getLayer("Sentinel2_2553").defaultMosaicRule;
                        newSentinel.defaultRenderer = this.map.getLayer("Sentinel2_2553").defaultRenderer;
                        newSentinel.defaultRenderingRule = this.map.getLayer("Sentinel2_2553").defaultRenderingRule;
                        newSentinel.setRenderingRule(this.map.getLayer("Sentinel2_2553").renderingRule);
                        newSentinel.extent = this.map.getLayer("Sentinel2_2553").extent;
                        if (this.map.getLayer("Sentinel2_2553").visible) {
                            newSentinel.setVisibility(true);
                        } else {
                            newSentinel.setVisibility(false);
                        }


                        this.config.Sentinel2_2553.url = "https://sentinel.arcgis.com/arcgis/rest/services/Sentinel2/ImageServer";
                        this.map.removeLayer(this.map.getLayer("Sentinel2_2553"));
                        this.map.addLayer(newSentinel);
                    }));

                } else {
                    this.portal.signOut();
                    IdentityManager.destroyCredentials();
                    this.map.secondaryLayer = null;

                    if (this.map.getLayer("Sentinel2_2553")) {
                        var params = new ImageServiceParameters();
                        params.format = "jpgpng";
                        var proxySentinel = new ArcGISImageServiceLayer("https://utility.arcgis.com/usrsvcs/servers/d70ebb358d28463a99e574d56265dd95/rest/services/Sentinel2/ImageServer", {
                            id: "Sentinel2_2553",
                            title: "Sentinel 2",
                            imageServiceParameters: params
                        });
                        proxySentinel.defaultBandIds = this.map.getLayer("Sentinel2_2553").defaultBandIds;
                        proxySentinel.defaultMosaicRule = this.map.getLayer("Sentinel2_2553").defaultMosaicRule;
                        proxySentinel.defaultRenderer = this.map.getLayer("Sentinel2_2553").defaultRenderer;
                        proxySentinel.defaultRenderingRule = this.map.getLayer("Sentinel2_2553").defaultRenderingRule;
                        proxySentinel.setRenderingRule(this.map.getLayer("Sentinel2_2553").renderingRule);
                        proxySentinel.extent = this.map.getLayer("Sentinel2_2553").extent;
                        if (this.map.getLayer("Sentinel2_2553").visible) {
                            proxySentinel.setVisibility(true);
                        } else {
                            proxySentinel.setVisibility(false);
                        }
                        this.map.removeLayer(this.map.getLayer("Sentinel2_2553"));
                        this.map.addLayer(proxySentinel);

                    }
                    if (this.map.getLayer("Sentinel2_2553_Right")) {
                        var params = new ImageServiceParameters();
                        params.format = "jpgpng";
                        var proxySentinel = new ArcGISImageServiceLayer("https://utility.arcgis.com/usrsvcs/servers/d70ebb358d28463a99e574d56265dd95/rest/services/Sentinel2/ImageServer", {
                            id: "Sentinel2_2553_Right",
                            title: "Sentinel 2",
                            imageServiceParameters: params
                        });
                        proxySentinel.defaultBandIds = this.map.getLayer("Sentinel2_2553_Right").defaultBandIds;
                        proxySentinel.defaultMosaicRule = this.map.getLayer("Sentinel2_2553_Right").defaultMosaicRule;
                        proxySentinel.defaultRenderer = this.map.getLayer("Sentinel2_2553_Right").defaultRenderer;
                        proxySentinel.defaultRenderingRule = this.map.getLayer("Sentinel2_2553_Right").defaultRenderingRule;
                        proxySentinel.setRenderingRule(this.map.getLayer("Sentinel2_2553_Right").renderingRule);
                        proxySentinel.extent = this.map.getLayer("Sentinel2_2553_Right").extent;
                        if (this.map.getLayer("Sentinel2_2553_Right").visible) {
                            proxySentinel.setVisibility(true);
                        } else {
                            proxySentinel.setVisibility(false);
                        }
                        this.map.removeLayer(this.map.getLayer("Sentinel2_2553_Right"));
                        this.map.addLayer(proxySentinel, 1);
                        this.map.secondaryLayer = proxySentinel;
                    }
                    document.getElementById("signInThumbnail").src = "./widgets/ISHeader/images/signIn.png";
                    document.getElementById("userName").innerHTML = "   Sign In";
                    this.map.secureService = false;
                }
            },

        });

        clazz.hasLocale = false;
        return clazz;
    });
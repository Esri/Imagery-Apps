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
    'jimu/BaseWidget', "./resourceLoad.js", "dijit/TooltipDialog", "esri/IdentityManager"
],
    function (
        declare,
        _WidgetsInTemplateMixin,
        template,
        BaseWidget, resourceLoad, TooltipDialog, IdentityManager
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
            customProp: [3, 7, "Precipitation", 0, 5],
            updateStartFlag: true,
            storyModeOn: false,
            storyLoadingIconFlag: true,
            primaryLayer: null,
            startup: function () {
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
                        '<tr style="height: 40px;"><td><div id="appName" style="font-size: ' + fontsize + 'px; position: relative; bottom: 3px; color: white; font-weight: bold;background-color: transparent;">Landsat Explorer</div></td><td><div id="rendererInformation" style="font-size: ' + fontsize2 + 'px;color: white; font-weight: bold;background-color: transparent;display:none;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Rendering:&nbsp;Agriculture</div>' +
                        '<div style=" font-size: ' + fontsize2 + 'px;color: white; font-weight: bold;background-color: transparent;display:none;" id="dateSecondary"></div><div style=" font-size: ' + fontsize2 + 'px;color: white; font-weight: bold;background-color: transparent;" id="dateDisplay"></div></td></tr></table>' +
                        '<div id="socialShortLinks" style="position: absolute;top:0px;right: 8px;display: block;margin-top: 8px;"><a id="userSignIn" target="_self" style="display:inline-block;height:22px;"><img id="signInThumbnail" src="./widgets/ISLayers/images/signIn.png" style="height: 22px;cursor:pointer;" alt="Sign In" /><span id="userName" style="color:white;cursor:pointer;font-size:' + fontsize2 + 'px;font-weight:400;font-family:sans-serif;vertical-align:super;">   Sign In</span></a>&nbsp;&nbsp;&nbsp;<a   id="facebook" target="_blank"><img id="facebookThumnail" src="./widgets/ISLayers/images/facebook.png" style="height: 25px;cursor:pointer;" alt="Facebook" /></a>&nbsp;&nbsp;<a  id="twitter" target="_blank"><img id="twitterThumbnail" src="./widgets/ISLayers/images/twitter.png" style="height: 25px;cursor:pointer;" alt="Twitter" /></a>&nbsp;&nbsp;<a  id="link" target="_self"><img id="linkThumbnail" src="./widgets/ISLayers/images/link.png" style="height: 25px;cursor:pointer;" alt="Link" /></a></div>');

                } else if (window.innerWidth < 850) {
                    domStyle.set("bandCombinationDialog", "font-size", "8px");
                    var headerCustom = domConstruct.toDom('<table id="headerTable" style="border: 0px;height: 40px;display: -webkit-inline-box;margin-left: 20px;">' +
                        '<tr style="height: 40px;"><td><div id="appName" style="font-size: ' + fontsize + 'px; position: relative; bottom: 3px; color: white; font-weight: bold;background-color: transparent;">Landsat Explorer</div></td><td><div id="rendererInformation" style="font-size: ' + fontsize2 + 'px;color: white; font-weight: bold;background-color: transparent;display:none;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Rendering:&nbsp;Agriculture</div></td>' +
                        '<td><div style=" font-size: ' + fontsize2 + 'px;color: white; font-weight: bold;background-color: transparent;display:none;" id="dateSecondary"></div><div style=" font-size: ' + fontsize2 + 'px;color: white; font-weight: bold;background-color: transparent;" id="dateDisplay"></div></td></tr></table>' +
                        '<div id="socialShortLinks" style="position: absolute;top:0px;right: 8px;display: block;margin-top: 8px;"><a id="userSignIn" target="_self" style="display:inline-block;height:22px;"><img id="signInThumbnail" src="./widgets/ISLayers/images/signIn.png" style="height: 22px;cursor:pointer;" alt="Sign In" /><span id="userName" style="color:white;cursor:pointer;font-size:' + fontsize2 + 'px;font-weight:400;font-family:sans-serif;vertical-align:super;">   Sign In</span></a>&nbsp;&nbsp;&nbsp;<a   id="facebook" target="_blank"><img id="facebookThumnail" src="./widgets/ISLayers/images/facebook.png" style="height: 25px;cursor:pointer;" alt="Facebook" /></a>&nbsp;&nbsp;<a  id="twitter" target="_blank"><img id="twitterThumbnail" src="./widgets/ISLayers/images/twitter.png" style="height: 25px;cursor:pointer;" alt="Twitter" /></a>&nbsp;&nbsp;<a  id="link" target="_self"><img id="linkThumbnail" src="./widgets/ISLayers/images/link.png" style="height: 25px;cursor:pointer;" alt="Link" /></a></div>');

                } else {
                    domStyle.set("bandCombinationDialog", "font-size", "12px");
                    var headerCustom = domConstruct.toDom('<table id="headerTable" style="border: 0px;height: 40px;display: -webkit-inline-box;margin-left: 20px;">' +
                        '<tr style="height: 40px;"><td><div id="appName" style="font-size: ' + fontsize + 'px; position: relative; bottom: 3px; color: white; font-weight: bold;background-color: transparent;">Landsat Explorer</div></td><td><div id="rendererInformation" style="font-size: ' + fontsize2 + 'px;color: white; font-weight: bold;background-color: transparent;display:none;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Rendering:&nbsp;Agriculture</div></td>' +
                        '<td><div style=" font-size: ' + fontsize2 + 'px;color: white; font-weight: bold;background-color: transparent;display:none;" id="dateSecondary"></div></td><td><div style=" font-size: ' + fontsize2 + 'px;color: white; font-weight: bold;background-color: transparent;" id="dateDisplay"></div></td></tr></table>' +
                        '<div id="socialShortLinks" style="position: absolute;top:0px;right: 8px;display: block;margin-top: 8px;"><a id="userSignIn" target="_self" style="display:inline-block;height:22px;"><img id="signInThumbnail" src="./widgets/ISLayers/images/signIn.png" style="height: 22px;cursor:pointer;" alt="Sign In" /><span id="userName" style="color:white;cursor:pointer;font-size:' + fontsize2 + 'px;font-weight:400;font-family:sans-serif;vertical-align:super;">   Sign In</span></a>&nbsp;&nbsp;&nbsp;<a   id="facebook" target="_blank"><img id="facebookThumnail" src="./widgets/ISLayers/images/facebook.png" style="height: 25px;cursor:pointer;" alt="Facebook" /></a>&nbsp;&nbsp;<a  id="twitter" target="_blank"><img id="twitterThumbnail" src="./widgets/ISLayers/images/twitter.png" style="height: 25px;cursor:pointer;" alt="Twitter" /></a>&nbsp;&nbsp;<a  id="link" target="_self"><img id="linkThumbnail" src="./widgets/ISLayers/images/link.png" style="height: 25px;cursor:pointer;" alt="Link" /></a></div>');
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
                    label: "Explore Landsat Imagery with ArcGIS.",
                    position: ['below']
                });
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

                appName.style.fontSize = fontsize + "px";
                rendererDom.style.fontSize = fontsize2 + "px";
                secondaryDom.style.fontSize = fontsize2 + "px";
                primaryDom.style.fontSize = fontsize2 + "px";
                var table = document.getElementById("headerTable");
                table.deleteRow(0);
                var row = table.insertRow(0);
                row.style = "height:40px";
                var cell = row.insertCell(0);
                cell.innerHTML = appName.outerHTML;
                var cell1 = row.insertCell(1);
                domStyle.set("rendererInfoDialog", "top", "110px");
                domStyle.set("rendererInfoDialog", "left", 170 + document.getElementById("bandCombinationDialog").offsetWidth + "px");
                if (window.innerWidth < 620) {
                    domStyle.set("bandCombinationDialog", "font-size", "7px");
                    domStyle.set("rendererInfoDialog", "font-size", "7px");
                    cell1.innerHTML = rendererDom.outerHTML + secondaryDom.outerHTML + primaryDom.outerHTML;
                } else if (window.innerWidth < 850) {
                    domStyle.set("bandCombinationDialog", "font-size", "8px");
                    domStyle.set("rendererInfoDialog", "font-size", "8px");
                    cell1.innerHTML = rendererDom.outerHTML;
                    var cell2 = row.insertCell(2);
                    cell2.innerHTML = secondaryDom.outerHTML + primaryDom.outerHTML;
                } else {
                    domStyle.set("bandCombinationDialog", "font-size", "12px");
                    domStyle.set("rendererInfoDialog", "font-size", "12px");
                    cell1.innerHTML = rendererDom.outerHTML;
                    var cell2 = row.insertCell(2);
                    cell2.innerHTML = secondaryDom.outerHTML;
                    var cell3 = row.insertCell(3);
                    cell3.innerHTML = primaryDom.outerHTML;
                }

            },
            postCreate: function () {
                window.addEventListener("resize", lang.hitch(this, function () {

                    if (registry.byId("bandCombinationDialog").open)
                        var tempDialog = "bandCombinationDialog";
                    else if (registry.byId("timeDialog") && registry.byId("timeDialog").open)
                        var tempDialog = "timeDialog";
                    else if (registry.byId("maskDialog") && registry.byId("maskDialog").open)
                        var tempDialog = "maskDialog";
                    else if (registry.byId("changeDetectionDialog") && registry.byId("changeDetectionDialog").open)
                        var tempDialog = "changeDetectionDialog";
                    else if (registry.byId("saveDialog") && registry.byId("saveDialog").open)
                        var tempDialog = "saveDialog";
                    else if (registry.byId("chartDialog1") && registry.byId("chartDialog1").open)
                        var tempDialog = "chartDialog1";
                    else if (registry.byId("Add Data from ArcGIS Online") && registry.byId("Add Data from ArcGIS Online").open)
                        var tempDialog = "Add Data from ArcGIS Online";
                    else if (pm.getPanelById("_19_panel") && pm.getPanelById("_19_panel").state === "opened")
                        var tempDialog = "Export";
                    else if (pm.getPanelById("_16_panel") && pm.getPanelById("_16_panel").state === "opened")
                        var tempDialog = "Bookmarks";
                    else if (pm.getPanelById("_22_panel") && pm.getPanelById("_22_panel").state === "opened")
                        var tempDialog = "About";
                    if (tempDialog) {
                        domStyle.set(tempDialog, "left", "160px");
                        domStyle.set(tempDialog, "top", "100px");
                    }
                    if (registry.byId("linkDialog").open) {
                        domStyle.set("linkDialog", "right", "20px");
                        domStyle.set("linkDialog", "top", "60px");
                        domStyle.set("linkDialog", "left", "auto");
                    }
                    domStyle.set("_8_panel", "top", "40px");
                    domStyle.set("_8_panel", "position", "absolute");
                    domStyle.set("_8_panel", "width", "95px");
                    domStyle.set("_8_panel", "height", "60px");
                    this.resizeLayersWidget();
                }));
                document.getElementsByClassName("icon-node")[8].addEventListener("click", lang.hitch(this, function () {

                    if (this.storyLoadingIconFlag) {

                        domStyle.set("loadingStory1", "display", "block");
                        this.storyLoadingIconFlag = false;
                    }
                }));
                this.own(
                    on(this.multiARadio, "click", lang.hitch(this, function () {

                        if (domClass.contains(this.multiARadio, "selected")) {
                            domClass.remove(this.multiARadio, "selected");
                            this.hideFlag = false;
                            if (registry.byId("bandCombinationDialog").open)
                                registry.byId("bandCombinationDialog").hide();
                        } else {
                            this.hideFlag = true;
                            var x = document.getElementsByClassName("icon-node");

                            if (domClass.contains(x[0], "jimu-state-selected")) {
                                if (registry.byId("timeDialog") && registry.byId("timeDialog").open) {
                                    registry.byId("timeDialog").hide();
                                }
                            }
                            if (registry.byId("saveDialog") && registry.byId("saveDialog").open)
                                pm.closePanel("_20_panel");

                            if (domClass.contains(x[10], "jimu-state-selected"))
                                pm.closePanel("_22_panel");
                            if (domClass.contains(x[5], "jimu-state-selected"))
                                pm.closePanel("_70_panel");
                            if (domClass.contains(x[7], "jimu-state-selected"))
                                pm.closePanel("_19_panel");
                            if (registry.byId("chartDialog1") && registry.byId("chartDialog1").open)
                                pm.closePanel("widgets_Identify_Widget_14_panel");
                            if (registry.byId("maskDialog") && registry.byId("maskDialog").open)
                                registry.byId("maskDialog").hide();
                            if (registry.byId("changeDetectionDialog") && registry.byId("changeDetectionDialog").open)
                                registry.byId("changeDetectionDialog").hide();
                            domClass.add(this.multiARadio, "selected");
                            registry.byId("bandCombinationDialog").show();
                            domStyle.set("bandCombinationDialog", "top", "100px");
                            domStyle.set("bandCombinationDialog", "left", "160px");
                            domConstruct.destroy("bandCombinationDialog_underlay");
                            if (registry.byId("tooltipDialogIntro") && registry.byId("tooltipDialogIntro").state === "open" && registry.byId("tutorialStage").get("value") === "0") {
                                var tooltipTemp = registry.byId("tooltipDialogIntro");

                                tooltipTemp.set("content", "<p style='text-align:justify'>The dropdown contains a list of predefined indexes and band combinations.<br/>Select the<span style='font-weight: bolder;color: orange;'>'Color Infrared'</span> option from the drop down list.</p>");
                                popup.open({
                                    parent: registry.byId("bandCombinationDialog"),
                                    popup: tooltipTemp,
                                    orient: ["after-centered"],
                                    around: registry.byId("bandCombinationDialog").domNode,
                                    onClose: lang.hitch(this, function () {
                                        domStyle.set(tooltipTemp._popupWrapper, "display", "block");
                                    })
                                });
                                registry.byId("tutorialStage").set("value", "1");
                                dom.byId("bandCombination").style.pointerEvents = "none";
                            }
                            var selectValue = registry.byId("bandComboList").get("value");
                            if (selectValue === "Index" || selectValue === "NDVI" || selectValue === "SAVI" || selectValue === "NBR" || selectValue === "NDMI" || selectValue === "Urban" || selectValue === "NDWI") {
                                this.indexShareOpen = true;
                                domStyle.set("formula", "display", "inline-block");
                                domStyle.set("indexExtension", "display", "block");
                                domStyle.set("buildExtension", "display", "none");
                            } else if (registry.byId("bandComboList").get("value") === "Build") {
                                domStyle.set("indexExtension", "display", "none");

                                domStyle.set("buildExtension", "display", "block");

                                domStyle.set("formula", "display", "none");
                            }
                            this.applyBandCombination();
                        }
                    }))


                );
                registry.byId("colorRamp").on("change", lang.hitch(this, function (value) {
                    if (value !== "custom" && value !== "moisture") {
                        registry.byId("Scale").set("value", 5);
                        registry.byId("OffsetValue").set("value", 0);
                    } else {
                        registry.byId("Scale").set("value", 100);
                        registry.byId("OffsetValue").set("value", 100);
                    }
                }));
                registry.byId('apply').on("click", lang.hitch(this, this.stretchfn));
                document.getElementById("renderingInfo").addEventListener("click", lang.hitch(this, function () {
                    if (!registry.byId("rendererInfoDialog").open) {
                        registry.byId("rendererInfoDialog").show();
                        domStyle.set("rendererInfoDialog", "top", "110px");

                        domStyle.set("rendererInfoDialog", "left", 170 + document.getElementById("bandCombinationDialog").offsetWidth + "px");
                    }
                }));
                registry.byId("applyIndex").on("click", lang.hitch(this, function () {
                    //     this.indexFunction(registry.byId("indexList1").get("value"));
                    this.indexFunction();
                }));
                registry.byId("bandComboList").on("change", lang.hitch(this, this.applyBandCombination));

                registry.byId('reset').on("click", lang.hitch(this, this.reset1));
                this.map.on("update-start", lang.hitch(this, this.showLoading));
                this.map.on("update-end", lang.hitch(this, this.hideLoading));
                this.map.on("extent-change", lang.hitch(this, this.timebook));
                this.appStageHandler = this.map.on("layer-add-result", lang.hitch(this, this.timeClicked));

                new Tooltip({
                    connectId: [this.domNode],
                    selector: ".layer-item",
                    position: ['after'],
                    getContent: function (matchedNode) {
                        return matchedNode.getAttribute("data-tooltip");
                    }
                });
                domConstruct.place('<img id="loadingStory1" style="position: absolute;top:0;bottom: 0;left: 0;right: 0;margin:auto;z-index:100;display: none;" src="' + require.toUrl('jimu') + '/images/loading.gif">', this.map.container);

                var checkUrl = window.location.href;
                var parameters = window.location.href.split("?");
                if (parameters[1] && parameters[1].includes("story=")) {
                    this.storyModeOn = true;
                    this.storyId = parameters[1].split("=")[1];

                    document.getElementsByClassName("icon-node")[8].click();
                }
                if (!this.storyModeOn) {
                    var params = new ImageServiceParameters();
                    params.format = "jpgpng";
                    var loadlayer = new ArcGISImageServiceLayer(this.config.layers["Agriculture with DRA"].url, {
                        imageServiceParameters: params,
                        id: "primaryLayer",
                        visible: true
                    });

                    this.map.addLayer(loadlayer, 1);
                    this.timebook();
                }

                registry.byId("bandCombinationDialog").connect(registry.byId("bandCombinationDialog"), "hide", lang.hitch(this, function (e) {
                    if (this.hideFlag)
                        this.multiARadio.click();
                }));
            },
            onOpen: function () {

                var checkUrl = window.location.href;
                var parameters = window.location.href.split("?");
                if (parameters[1]) {
                    if (parameters[1].includes("story=")) {

                        domStyle.set(dom.byId("bandCombination"), "display", "none");
                    } else {

                        domStyle.set(dom.byId("rendererInformation"), "display", "block");

                        parameters[1] = atob(parameters[1]);
                        parameters[1] = parameters[1].replace(/%22/gi, '"');
                        var values = parameters[1].split("&");
                        if (values) {
                            for (var a = 0; a < 2; a++) {
                                values[a] = JSON.parse(values[a]);
                            }
                            this.appExtent = values[0];
                            this.appRenderer = values[1].rasterFunction;
                            if (values[2])
                                this.appMosaicRule = values[2];
                            else
                                this.appMosaicRule = null;

                            this.appCloudFilter = values[3];
                            this.appSeasonFilter = values[4];

                            if (this.appRenderer === "Build") {

                                registry.byId("bnd1").set("value", values[12]);
                                registry.byId("bnd2").set("value", values[13]);
                                registry.byId("bnd3").set("value", values[14]);
                                registry.byId("stretchoptions").set("value", values[15]);
                                registry.byId("gammaoptions").set("value", values[16]);

                            } else if (this.appRenderer === "Index") {
                                //registry.byId("bandComboList").set("value", values[17]);
                                this.indexShareOpen = true;
                                this.appRenderer = values[17];
                                registry.byId("bandA").set("value", values[12]);
                                registry.byId("bandB").set("value", values[13]);
                                registry.byId("OffsetValue").set("value", values[14]);

                                registry.byId("Scale").set("value", values[15]);
                                registry.byId("colorRamp").set("value", values[16]);
                            }

                            this.secondaryLayerObject = values[5];
                            this.changeOrMask = values[11];
                            if (this.changeOrMask === "change" || this.changeOrMask === "mask")
                                registry.byId("changeProp").set("value", values[6] + "," + values[7] + "," + values[8] + "," + values[9] + "," + values[10]);
                            this.map.setExtent(new Extent(this.appExtent));

                        }
                    }
                    if (typeof (history.pushState) !== "undefined") {
                        var changeUrl = parameters[0].split("index.html")[0];
                        var obj = { Page: "Landsat Explorer", Url: changeUrl };
                        history.pushState(obj, obj.Page, obj.Url);
                    }


                } else {
                    domStyle.set(dom.byId("rendererInformation"), "display", "block");

                }
                IdentityManager.useSignInPage = false;
                IdentityManager.on("credential-create", lang.hitch(this, function (e) {
                    if (e.credential.server.indexOf("arcgis.com") !== -1) {
                        if (document.getElementById("userName").innerHTML === "   Sign In") {
                            this.portal = new arcgisPortal.Portal("http://www.arcgis.com");
                            bundle.identity.lblItem = "Account";
                            var tempText = (bundle.identity.info).split("access the item on");
                            bundle.identity.info = tempText[0] + tempText[1];

                            this.portal.signIn().then(lang.hitch(this, function (user) {

                                document.getElementById("signInThumbnail").src = "./widgets/ISLayers/images/user.png";
                                document.getElementById("userName").innerHTML = "   Sign Out";
                            }));
                        } else {
                            this.portal.signOut();
                            IdentityManager.destroyCredentials();
                            document.getElementById("signInThumbnail").src = "./widgets/ISLayers/images/signIn.png";
                            document.getElementById("userName").innerHTML = "   Sign In";
                        }
                    }
                }));
            },
            shareClicked: function (socialMedium) {
                if (!this.storyModeOn) {
                    var shareLayer = this.map.getLayer("primaryLayer");

                    if (shareLayer.mosaicRule && shareLayer.mosaicRule.method === "esriMosaicLockRaster")
                        var mosaicRule = registry.byId("primarySceneId").get("value");
                    else
                        var mosaicRule = null;
                    if (shareLayer.renderingRule) {
                        if (shareLayer.renderingRule.functionName === "Stretch")
                            var renderingRule = '{"rasterFunction": "Build"}';
                        else if (shareLayer.renderingRule.functionName === "Colormap")
                            var renderingRule = '{"rasterFunction": "Index"}';
                        else
                            var renderingRule = JSON.stringify(shareLayer.renderingRule.toJson());
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
                    if (!appUrl.includes("/index.html"))
                        appUrl = appUrl + "/index.html";

                    var x = document.getElementsByClassName("icon-node");
                    if (this.map.getLayer("secondaryLayer"))
                        var secondaryLayer = registry.byId(("secondarySceneId")).get("value");
                    else
                        secondaryLayer = null;

                    if (this.map.getLayer("resultLayer")) {
                        if (secondaryLayer && registry.byId("changeDetectionDialog") && registry.byId("changeMaskDetect").get("value") === "change") {
                            var thresholdValue = registry.byId("horiSliderInclusion").get("value");
                            var differenceRange = registry.byId("horiSliderRight").get("value");
                            var negativeRange = registry.byId("horiSliderDecrease").get("value");
                            var changeMode = registry.byId("changeMode").get("value");
                            var changeIndex = registry.byId("changeOptions").get("value");
                            var changeMaskFlag = "change";
                        } else if (registry.byId("maskDialog") && registry.byId("changeMaskDetect").get("value") === "mask") {
                            var changeIndex = registry.byId("indexList").get("value");
                            var secondaryLayer = null;
                            var thresholdValue = registry.byId("maskSlider").get("value");
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

                    if (renderingRule !== '{"rasterFunction": "Build"}' && renderingRule !== '{"rasterFunction": "Index"}')
                        var shareUrl = appUrl + "?" + btoa(mapextent + "&" + renderingRule + "&" + mosaicRule + "&" + cloudFilter + "&" + seasonFilter + "&" + secondaryLayer + "&" + changeIndex + "&" + thresholdValue + "&" + changeMode + "&" + negativeRange + "&" + differenceRange + "&" + changeMaskFlag);
                    else if (renderingRule === '{"rasterFunction": "Build"}')
                        var shareUrl = appUrl + "?" + btoa(mapextent + "&" + renderingRule + "&" + mosaicRule + "&" + cloudFilter + "&" + seasonFilter + "&" + secondaryLayer + "&" + changeIndex + "&" + thresholdValue + "&" + changeMode + "&" + negativeRange + "&" + differenceRange + "&" + changeMaskFlag + "&" + registry.byId("bnd1").get("value") + "&" + registry.byId("bnd2").get("value") + "&" + registry.byId("bnd3").get("value") + "&" + registry.byId("stretchoptions").get("value") + "&" + registry.byId("gammaoptions").get("value"));
                    else
                        var shareUrl = appUrl + "?" + btoa(mapextent + "&" + renderingRule + "&" + mosaicRule + "&" + cloudFilter + "&" + seasonFilter + "&" + secondaryLayer + "&" + changeIndex + "&" + thresholdValue + "&" + changeMode + "&" + negativeRange + "&" + differenceRange + "&" + changeMaskFlag + "&" + registry.byId("bandA").get("value") + "&" + registry.byId("bandB").get("value") + "&" + registry.byId("OffsetValue").get("value") + "&" + registry.byId("Scale").get("value") + "&" + registry.byId("colorRamp").get("value") + "&" + registry.byId("bandComboList").get("value"));
                } else {
                    var shareUrl = window.location.href + "?story=" + this.storyId;
                }

                if (socialMedium === "facebook")
                    var share = "http://www.arcgis.com/home/socialnetwork.html?n=fb&t=" + "&u=" + shareUrl;
                else if (socialMedium === "twitter")
                    var share = "http://www.arcgis.com/home/socialnetwork.html?n=tw&t=Landsat Explorer" + "&u=" + shareUrl;
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
                            domStyle.set("linkDialog", "top", "60px");
                            domStyle.set("linkDialog", "left", "auto");
                            domConstruct.destroy("linkDialog_underlay");
                        }
                    }));
                }


            },
            userSignIn: function () {

                if (document.getElementById("userName").innerHTML === "   Sign In") {
                    this.portal = new arcgisPortal.Portal("http://www.arcgis.com");
                    bundle.identity.lblItem = "Account";
                    var tempText = (bundle.identity.info).split("access the item on");
                    bundle.identity.info = tempText[0] + tempText[1];
                    IdentityManager.useSignInPage = false;
                    this.portal.signIn().then(lang.hitch(this, function (user) {

                        document.getElementById("signInThumbnail").src = "./widgets/ISLayers/images/user.png";
                        document.getElementById("userName").innerHTML = "   Sign Out";
                    }));
                } else {

                    this.portal.signOut();
                    IdentityManager.destroyCredentials();
                    document.getElementById("signInThumbnail").src = "./widgets/ISLayers/images/signIn.png";
                    document.getElementById("userName").innerHTML = "   Sign In";

                }
            },
            indexFunction: function (value) {


                var A = "B" + registry.byId("bandA").get("value");
                var B = "B" + registry.byId("bandB").get("value");
                if (registry.byId("Scale").get("value"))
                    var S = parseInt(registry.byId("Scale").get("value"));
                else
                    var S = 1;
                if (registry.byId("OffsetValue").get("value"))
                    var O = parseInt(registry.byId("OffsetValue").get("value"));
                else
                    var O = 0;
                if (value === "Custom")
                    this.customProp = [registry.byId("bandA").get("value"), registry.byId("bandB").get("value"), registry.byId("colorRamp").get("value"), O, S];
                var raster = new RasterFunction();
                raster.functionName = "BandArithmetic";
                if (registry.byId("colorRamp").get("value") === "custom" || registry.byId("colorRamp").get("value") === "moisture")
                    raster.outputPixelType = "U8";
                else
                    raster.outputPixelType = "F32";
                var args = {};
                args.Method = 0;
                if (value === "SAVI")
                    args.BandIndexes = O + "+" + "(" + S + "*" + "(1.5*((" + A + "-" + B + ")/(" + A + "+" + B + " +5000))))";
                else
                    args.BandIndexes = O + "+" + "(" + S + "*" + "((" + A + "-" + B + ")/(" + A + "+" + B + ")))";
                raster.functionArguments = args;

                if (registry.byId("colorRamp").get("value") !== "custom" && registry.byId("colorRamp").get("value") !== "moisture") {
                    var raster2 = new RasterFunction();
                    raster2.functionName = "Stretch";
                    raster2.outputPixelType = "U8";
                    var args2 = {};
                    args2.StretchType = 5;
                    args2.Min = 0;
                    args2.Max = 255;
                    args2.DRA = false;
                    args2.UseGamma = false;
                    args2.Statistics = [[-1, 1, 0, 0]];
                    args2.Raster = raster;
                    raster2.functionArguments = args2;
                }

                var raster3 = new RasterFunction();
                raster3.functionName = "Colormap";
                raster3.outputPixelType = "U8";
                var args1 = {};
                if (registry.byId("colorRamp").get("value") === "custom") {
                    args1.Colormap = this.config.colormap;
                    args1.Raster = raster;
                } else if (registry.byId("colorRamp").get("value") === "moisture") {
                    args1.Colormap = this.config.moisture;
                    args1.Raster = raster;
                } else {
                    args1.ColorRamp = registry.byId("colorRamp").get("value");
                    args1.Raster = raster2;
                }
                raster3.functionArguments = args1;
                var layer = this.map.getLayer("primaryLayer");

                if (layer.url === this.config.layers["Index"].url && layer.format !== "lerc") {
                    layer.setBandIds([], true);
                    layer.setRenderingRule(raster3, false);
                } else {
                    if (layer) {
                        if (layer.updating) {
                            layer.suspend();
                        }
                        this.map.removeLayer(layer);
                    }
                    var params = new ImageServiceParameters();
                    params.renderingRule = raster3;
                    params.format = "jpgpng";

                    var newLayer = new ArcGISImageServiceLayer(this.config.layers["Index"].url, {
                        imageServiceParameters: params,
                        visible: true,
                        id: "primaryLayer"
                    });

                    if (this.map.getLayer("secondaryLayer"))
                        this.map.addLayer(newLayer, 2);
                    else
                        this.map.addLayer(newLayer, 1);
                    connect.publish("refreshTime", [{ flag: true }]);
                }
            },
            gammacompute: function () {

                if (this.gammaval === "0") {
                    this.gvalue = false;
                } else {
                    this.gvalue = true;
                }
                switch (this.gammaval) {

                    case '1':
                        {
                            this.values = 0.3;
                            break;
                        }
                    case '2':
                        {
                            this.values = 0.5;
                            break;
                        }
                    case '3':
                        {
                            this.values = 0.8;
                            break;
                        }
                    case '4':
                        {
                            this.values = 1;
                            break;
                        }
                    case '5':
                        {
                            this.values = 1.2;
                            break;
                        }
                    case '6':
                        {
                            this.values = 2;
                            break;
                        }
                    case '7':
                        {
                            this.values = 4;
                            break;
                        }
                }

            },
            stretchfn: function () {

                this.primaryLayer = this.map.getLayer("primaryLayer");

                this.gammaval = registry.byId("gammaoptions").get("value");


                this.gammacompute();
                var abc = new RasterFunction();
                abc.functionName = 'Stretch';
                var args = {};
                var type = registry.byId("stretchoptions").get("value");


                this.primaryLayer.setBandIds([parseInt(registry.byId("bnd1").get("value")) - 1, parseInt(registry.byId("bnd2").get("value")) - 1, parseInt(registry.byId("bnd3").get("value")) - 1], false);
                switch (type) {
                    case 'none':
                        {
                            args.StretchType = 0;
                            args.UseGamma = this.gvalue;
                            if (this.gvalue) {
                                args.Gamma = [parseFloat((this.values).toFixed(2)), parseFloat((this.values).toFixed(2)), parseFloat((this.values).toFixed(2))];
                            }
                            break;
                        }
                    case 'minmax':
                        {
                            args.StretchType = 5;
                            args.Min = 0;
                            args.Max = 255;
                            args.UseGamma = this.gvalue;
                            if (this.gvalue) {

                                args.Gamma = [parseFloat(this.values.toFixed(2)), parseFloat(this.values.toFixed(2)), parseFloat(this.values.toFixed(2))];
                            }
                            args.DRA = true;
                            break;
                        }
                    case 'standard':
                        {
                            args.StretchType = 3;
                            args.NumberofStandardDeviations = 2;
                            args.DRA = true;
                            args.UseGamma = this.gvalue;
                            if (this.gvalue) {
                                args.Gamma = [parseFloat(this.values.toFixed(2)), parseFloat(this.values.toFixed(2)), parseFloat(this.values.toFixed(2))];
                            }
                            break;
                        }
                    case 'standard1':
                        {
                            args.StretchType = 3;
                            args.NumberofStandardDeviations = 3.0;
                            args.DRA = true;
                            args.UseGamma = this.gvalue;
                            if (this.gvalue) {
                                args.Gamma = [parseFloat(this.values.toFixed(2)), parseFloat(this.values.toFixed(2)), parseFloat(this.values.toFixed(2))];
                            }
                            break;
                        }
                    case 'clip':
                        {
                            args.StretchType = 6;
                            args.MinPercent = 2.0;
                            args.MaxPercent = 2.0;
                            args.UseGamma = this.gvalue;
                            if (this.gvalue) {
                                args.Gamma = [parseFloat(this.values.toFixed(2)), parseFloat(this.values.toFixed(2)), parseFloat(this.values.toFixed(2))];
                            }
                            args.DRA = true;
                            break;
                        }
                    case 'clip1':
                        {
                            args.StretchType = 6;
                            args.MinPercent = 0.5;
                            args.MaxPercent = 0.5;
                            args.UseGamma = this.gvalue;
                            if (this.gvalue) {
                                args.Gamma = [parseFloat(this.values.toFixed(2)), parseFloat(this.values.toFixed(2)), parseFloat(this.values.toFixed(2))];
                            }
                            args.DRA = true;
                            break;
                        }
                    case 'clip2':
                        {
                            args.StretchType = 6;
                            args.MinPercent = 0.1;
                            args.MaxPercent = 0.1;
                            args.UseGamma = this.gvalue;
                            if (this.gvalue) {
                                args.Gamma = [parseFloat(this.values.toFixed(2)), parseFloat(this.values.toFixed(2)), parseFloat(this.values.toFixed(2))];
                            }
                            args.DRA = true;
                            break;
                        }
                    case 'dark':
                        {
                            args.StretchType = 5;

                            args.Min = 0.0;
                            args.Max = 255.0;
                            args.Statistics = [[0, 4000, 1000, 1], [0, 2000, 1000, 1], [0, 2000, 1000, 1]];
                            args.UseGamma = this.gvalue;
                            if (this.gvalue) {

                                args.Gamma = [parseFloat(this.values.toFixed(2)), parseFloat(this.values.toFixed(2)), parseFloat(this.values.toFixed(2))];
                            }
                            args.DRA = false;
                            break;
                        }
                    case 'vdark':
                        {
                            args.StretchType = 5;

                            args.Min = 0.0;
                            args.Max = 255.0;
                            args.Statistics = [[0, 1000, 500, 1], [0, 1000, 500, 1], [0, 1000, 500, 1]];
                            args.UseGamma = this.gvalue;
                            if (this.gvalue) {

                                args.Gamma = [parseFloat(this.values.toFixed(2)), parseFloat(this.values.toFixed(2)), parseFloat(this.values.toFixed(2))];
                            }
                            args.DRA = false;
                            break;
                        }
                    case 'light':
                        {
                            args.StretchType = 5;

                            args.Min = 0.0;
                            args.Max = 255.0;
                            args.UseGamma = this.gvalue;
                            args.Statistics = [[8000, 10000, 9000, 1], [8000, 10000, 9000, 1], [8000, 10000, 9000, 1]];
                            if (this.gvalue) {

                                args.Gamma = [parseFloat(this.values.toFixed(2)), parseFloat(this.values.toFixed(2)), parseFloat(this.values.toFixed(2))];
                            }
                            args.DRA = false;
                            break;
                        }
                    case 'vlight':
                        {
                            args.StretchType = 5;

                            args.Min = 0.0;
                            args.Max = 255.0;
                            args.UseGamma = this.gvalue;
                            args.Statistics = [[9000, 10000, 9500, 1], [9000, 10000, 9500, 1], [9000, 10000, 9500, 1]];
                            if (this.gvalue) {

                                args.Gamma = [parseFloat(this.values.toFixed(2)), parseFloat(this.values.toFixed(2)), parseFloat(this.values.toFixed(2))];
                            }
                            args.DRA = false;
                            break;
                        }
                    case 'full':
                        {
                            args.StretchType = 5;

                            args.Min = 0.0;
                            args.Max = 255.0;
                            args.UseGamma = this.gvalue;
                            args.Statistics = [[0, 10000, 5000, 1], [0, 10000, 5000, 1], [0, 10000, 5000, 1]];
                            if (this.gvalue) {

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
                this.layerflag = false;
                html.set(dom.byId("rendererInformation"), "&nbsp;&nbsp;Rendering:&nbsp;" + "Stretch with Bands - " + this.band1 + "," + this.band2 + "," + this.band3);
                if (registry.byId("tooltipDialogIntro") && registry.byId("tooltipDialogIntro").state === "open" && registry.byId("tutorialStage").get("value") === "6") {
                    var tooltipTemp = registry.byId("tooltipDialogIntro");

                    tooltipTemp.set("content", "<p style='text-align: justify;'>This is a true-color image (similar to a photograph), created using the red, green, and blue satellite bands. Notice how much easier it was to find healthy vegetation using the color infrared view we saw a moment ago, compared to the true-color image here.<div id='continueComment' style='font-weight: bolder;color: orange;cursor:pointer;'>Click here to continue.</div></p>")
                    popup.open({
                        parent: registry.byId("bandCombinationDialog"),
                        popup: tooltipTemp,
                        orient: ["below"],
                        around: registry.byId("bandCombinationDialog").domNode,
                        onClose: lang.hitch(this, function () {
                            domStyle.set(tooltipTemp._popupWrapper, "display", "block");
                        })
                    });
                    domStyle.set(tooltipTemp.connectorNode, "top", "0px");
                    registry.byId("tutorialStage").set("value", "7");
                    on(dom.byId("continueComment"), "click", lang.hitch(this, this.continueTutorial));
                }

            },
            reset1: function () {

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
                registry.byId("stretchoptions").set("value", "clip2");
                registry.byId("gammaoptions").set("value", "4");

            },
            timebook: function () {
                if (!this.storyModeOn) {
                    var getLayerProperties = this.map.getLayer("primaryLayer");

                    if (getLayerProperties && (!getLayerProperties.mosaicRule || getLayerProperties.mosaicRule.method !== "esriMosaicLockRaster")) {
                        var getDate = new esriRequest({
                            url: getLayerProperties.url + "/getSamples",
                            content: {
                                geometry: JSON.stringify(this.map.extent.getCenter()),
                                geometryType: "esriGeometryPoint",
                                returnGeometry: false,
                                sampleCount: 1,
                                //returnFirstValueOnly: true,
                                outFields: "AcquisitionDate",
                                f: "json"
                            },
                            handleAs: "json",
                            callbackParamName: "callback"
                        });

                        getDate.then(lang.hitch(this, function (result) {
                            if (result.samples && result.samples[0].attributes.AcquisitionDate) {
                                dom.byId("dateDisplay").innerHTML = "&nbsp;&nbsp;&nbsp;Imagery Date:&nbsp;" + locale.format(new Date(result.samples[0].attributes.AcquisitionDate), { selector: "date", formatLength: "long" });
                            }
                        }), lang.hitch(this, function () {
                            this.hideLoading();
                        }));

                    }
                }

            },
            timeClicked: function (layer) {
                document.getElementsByClassName("icon-node")[8].addEventListener("click", lang.hitch(this, function (e) {
                    if (e.ctrlKey) {
                        this.allowUserToCreateStories = true;
                    } else
                        this.allowUserToCreateStories = false;

                }));
                if (this.appRenderer) {

                    this.multiARadio.click();

                    registry.byId("bandComboList").set("value", this.appRenderer);
                    if (this.appRenderer === "Build") {
                        dom.byId("apply").click();

                    } else if (this.appRenderer === "Index") {
                        dom.byId("applyIndex").click();

                    }

                    if (this.appMosaicRule !== "null" && this.appMosaicRule) {
                        if (this.secondaryLayerObject !== "null")
                            registry.byId("appSceneID").set("value", this.appMosaicRule + "," + this.appCloudFilter + "," + this.appSeasonFilter + "," + true + "," + this.changeOrMask + "," + this.secondaryLayerObject);
                        else
                            registry.byId("appSceneID").set("value", this.appMosaicRule + "," + this.appCloudFilter + "," + this.appSeasonFilter + "," + false + "," + this.changeOrMask);
                        var x = document.getElementsByClassName("icon-node");
                        x[0].click();
                        this.appRenderer = null;
                        this.appMosaicRule = null;
                        if (this.appStageHandler)
                            this.appStageHandler.remove();
                        this.appStageHandler = null;
                        // }));
                    } else if (this.changeOrMask === "mask") {
                        this.changeOrMask = null;
                        var x = document.getElementsByClassName("icon-node");
                        x[2].click();
                        if (this.appStageHandler)
                            this.appStageHandler.remove();
                        this.appStageHandler = null;
                    }
                    this.appRenderer = null;
                }

            },
            continueTutorial: function () {
                var tooltipTemp = registry.byId("tooltipDialogIntro");
                var tutorialStage = registry.byId("tutorialStage").get("value");
                if (tutorialStage === "2") {
                    tooltipTemp.set("content", "<p style='text-align: justify;'>An <span style='color:orange;font-weight:bolder;'>index</span> combines two or more wavelengths to indicate the relative abundance of different land cover features, like vegetation or moisture.<br/>Select the <span style='color:orange;font-weight:bolder;'>'Vegetation Index'</span> option from the drop down list.</p>");
                    registry.byId("tutorialStage").set("value", "3");
                } else if (tutorialStage === "4") {
                    tooltipTemp.set("content", "<p style='text-align: justify;'>You can also create your own indexes and band combinations.<br/>Select the <span style='color:orange;font-weight:bolder;'>'Custom Bands'</span> option from the drop down list.</p>");
                    registry.byId("tutorialStage").set("value", "5");
                } else if (tutorialStage === "7") {
                    tooltipTemp.set("content", "<p style='text-align: justify;'>The <span style='color:orange;font-weight:bolder;'>Identify</span> tool displays current image attributes, like Scene ID, Acquisition Date, and Cloud Cover.<br /><span style='font-weight: bolder;color: orange;'>Click on</span> <img src='./widgets/ISLayers/images/svg/identify24.svg' height='15' /> for the Identify tool.</p>");
                    registry.byId("tutorialStage").set("value", "8");
                    document.getElementsByClassName("icon-node")[4].style.pointerEvents = "auto";
                    dom.byId("bandCombination").style.pointerEvents = "none";
                }
                if (registry.byId("tutorialStage").get("value") !== "8") {
                    popup.open({
                        parent: registry.byId("bandCombinationDialog"),
                        popup: tooltipTemp,
                        orient: ["after-centered"],
                        around: registry.byId("bandCombinationDialog").domNode, //dom.byId('bandComboList'),
                        onClose: lang.hitch(this, function () {
                            domStyle.set(tooltipTemp._popupWrapper, "display", "block");
                        })
                    });
                } else {
                    popup.open({
                        popup: tooltipTemp,
                        orient: ["after-centered"],
                        around: document.getElementsByClassName("icon-node")[4],
                        onClose: lang.hitch(this, function () {
                            domStyle.set(tooltipTemp._popupWrapper, "display", "block");
                        })
                    });
                }
                domStyle.set(tooltipTemp.connectorNode, "top", "0px");

            },
            applyBandCombination: function () {
                if (dom.byId("bandCombinationDialog_dropdown"))
                    domStyle.set("bandCombinationDialog_dropdown", "z-index", "1");
                //  html.set(this.descriptionRenderer, "");
                domStyle.set("renderingInfo", "display", "none");
                registry.byId("rendererInfoDialog").hide();
                var renderer = registry.byId("bandComboList").get("value");
                if (registry.byId("tooltipDialogIntro") && registry.byId("tooltipDialogIntro").state === "open") {
                    var tooltipTemp = registry.byId("tooltipDialogIntro");
                    var tutorialStage = registry.byId("tutorialStage").get("value");
                    if (renderer === "Color Infrared with DRA" && tutorialStage === "1") {

                        tooltipTemp.set("content", "<p style='text-align: justify;'>A <span style='color:orange;font-weight:bolder;'>true-color image</span> uses red, green and blue satellite bands to create an image that looks like a photograph. The <span style='color:orange;font-weight:bolder;'>color infrared</span> view, on the other hand, uses the near infrared, red and green satellite bands to create an image. As a result, vegetation appears bright red.<br /><div id='continueComment' style='font-weight:bolder;color: orange;cursor: pointer;'>Click here to continue.</div></p>");
                        popup.open({
                            parent: registry.byId("bandCombinationDialog"),
                            popup: tooltipTemp,
                            // style:"z-index:1",
                            orient: ["after-centered"],
                            around: dom.byId("bandCombinationDialog"), //dom.byId('bandComboList'), 
                            onClose: lang.hitch(this, function () {
                                domStyle.set(tooltipTemp._popupWrapper, "display", "block");
                            })
                        });
                        dom.byId("bandCombination").style.pointerEvents = "none";
                        domStyle.set(tooltipTemp.connectorNode, "top", "0px");
                        registry.byId("tutorialStage").set("value", "2");

                        on(dom.byId("continueComment"), "click", lang.hitch(this, this.continueTutorial));
                    } else if (renderer === "NDVI Colorized" && tutorialStage === "3") {

                        tooltipTemp.set("content", "<p style='text-align: justify;'>NDVI is an index that indicates the presence of healthy, green vegetation (seen in green).<br /><div id='continueComment' style='font-weight: bolder; color:orange;cursor:pointer;'>Click here to continue.</div></p>");
                        popup.open({
                            parent: registry.byId("bandCombinationDialog"),
                            popup: tooltipTemp,
                            orient: ["below"],
                            around: dom.byId("bandComboList"),
                            onClose: lang.hitch(this, function () {
                                domStyle.set(tooltipTemp._popupWrapper, "display", "block");
                            })
                        });
                        domStyle.set(tooltipTemp.connectorNode, "top", "0px");
                        registry.byId("tutorialStage").set("value", "4");
                        on(dom.byId("continueComment"), "click", lang.hitch(this, this.continueTutorial));
                    } else if (renderer !== "Build") {
                        if (tutorialStage === "8") {
                            var z = document.getElementsByClassName("icon-node");
                            popup.open({
                                popup: tooltipTemp,
                                orient: ["after-centered"],
                                around: z[4],
                                onClose: lang.hitch(this, function () {
                                    domStyle.set(tooltipTemp._popupWrapper, "display", "block");
                                })
                            });
                        }
                        domStyle.set(tooltipTemp.connectorNode, "top", "0px");
                    }
                }
                if (renderer === "None") {
                    if (this.map.getLayer("primaryLayer"))
                        this.map.getLayer("primaryLayer").hide();
                    domStyle.set("indexExtension", "display", "none");
                    domStyle.set("buildExtension", "display", "none");
                    domStyle.set("formula", "display", "none");
                } else {

                    var layer = this.map.getLayer("primaryLayer");
                    if (!layer.visible)
                        layer.show();
                    if (renderer !== "Build") {

                        html.set(dom.byId("rendererInformation"), "&nbsp;&nbsp;Rendering:&nbsp;" + this.config.layers[renderer].name);
                        if (renderer !== "Index" && renderer !== "NDVI" && renderer !== "SAVI" && renderer !== "NBR" && renderer !== "NDWI" && renderer !== "NDMI" && renderer !== "Urban") {
                            domStyle.set("renderingInfo", "display", "inline-block");
                            html.set(this.descriptionRenderer, this.config.layers[renderer].description);
                            var rasterFunction = new RasterFunction();
                            rasterFunction.functionName = renderer;
                            if (layer && layer.url === this.config.layers[renderer].url && layer.format !== "lerc") {
                                layer.setBandIds([], true);
                                layer.setRenderingRule(rasterFunction);
                            } else {
                                if (layer) {
                                    if (layer.updating) {
                                        layer.suspend();
                                    }
                                    this.map.removeLayer(this.map.getLayer("primaryLayer"));
                                }
                                var params = new ImageServiceParameters();
                                params.renderingRule = rasterFunction;
                                params.format = "jpgpng";

                                var loadLayer = new ArcGISImageServiceLayer(this.config.layers[renderer].url, {
                                    imageServiceParameters: params,
                                    id: "primaryLayer",
                                    visible: true
                                });

                                if (this.map.getLayer("secondaryLayer"))
                                    this.map.addLayer(loadLayer, 2);
                                else
                                    this.map.addLayer(loadLayer, 1);
                                connect.publish("refreshTime", [{ flag: true }]);
                            }
                            domStyle.set("indexExtension", "display", "none");
                            domStyle.set("buildExtension", "display", "none");
                            domStyle.set("formula", "display", "none");
                        } else {
                            if (!this.indexShareOpen) {
                                if (renderer === "NDVI") {
                                    registry.byId("bandA").set("value", 5);
                                    registry.byId("bandB").set("value", 4);
                                    registry.byId("colorRamp").set("value", "custom");
                                    dom.byId("formula").innerHTML = "Offset + Scale * ((NIR-Red)/(NIR+Red))";
                                } else if (renderer === "SAVI") {
                                    registry.byId("bandA").set("value", 5);
                                    registry.byId("bandB").set("value", 4);
                                    registry.byId("colorRamp").set("value", "Precipitation");
                                    dom.byId("formula").innerHTML = "Offset + Scale * (1.5 *((NIR-Red)/(NIR+Red+0.5)))";
                                } else if (renderer === "NDWI") {
                                    registry.byId("bandA").set("value", 3);
                                    registry.byId("bandB").set("value", 6);
                                    registry.byId("colorRamp").set("value", "moisture");
                                    dom.byId("formula").innerHTML = "Offset + Scale * ((Green-SWIR_1)/(Green+SWIR_1))";
                                } else if (renderer === "NBR") {
                                    registry.byId("bandA").set("value", 5);
                                    registry.byId("bandB").set("value", 7);
                                    registry.byId("colorRamp").set("value", "custom");
                                    dom.byId("formula").innerHTML = "Offset + Scale * ((NIR-SWIR_2)/(NIR + SWIR_2))";
                                } else if (renderer === "Urban") {
                                    registry.byId("bandA").set("value", 5);
                                    registry.byId("bandB").set("value", 6);
                                    registry.byId("colorRamp").set("value", "Precipitation");
                                    dom.byId("formula").innerHTML = "Offset + Scale * ((NIR-SWIR_1)/(NIR+SWIR_1))";

                                } else if (renderer === "NDMI") {
                                    registry.byId("bandA").set("value", 5);
                                    registry.byId("bandB").set("value", 6);
                                    registry.byId("colorRamp").set("value", "moisture");
                                    dom.byId("formula").innerHTML = "Offset + Scale * ((NIR-SWIR_1)/(NIR+SWIR_1))";
                                } else {
                                    registry.byId("bandA").set("value", this.customProp[0]);
                                    registry.byId("bandB").set("value", this.customProp[1]);
                                    registry.byId("colorRamp").set("value", this.customProp[2]);
                                    registry.byId("Scale").set("value", this.customProp[4]);
                                    registry.byId("OffsetValue").set("value", this.customProp[3]);
                                    dom.byId("formula").innerHTML = "Offset + Scale * ((A-B)/(A+B))";
                                }
                                if (registry.byId("colorRamp").get("value") === "custom" || registry.byId("colorRamp").get("value") === "moisture") {
                                    registry.byId("Scale").set("value", 100);
                                    registry.byId("OffsetValue").set("value", 100);
                                } else if (registry.byId("colorRamp").get("value") !== "Custom") {
                                    registry.byId("Scale").set("value", 5);
                                    registry.byId("OffsetValue").set("value", 0);
                                }
                            } else {
                                this.indexShareOpen = false;
                            }// this.indexFunction(registry.byId("indexList1").get("value"));
                            this.indexFunction();
                            if (renderer === "Index")
                                domStyle.set("indexBands", "display", "block");
                            else
                                domStyle.set("indexBands", "display", "none");
                            domStyle.set("indexExtension", "display", "block");
                            domStyle.set("formula", "display", "inline-block");
                            domStyle.set("buildExtension", "display", "none");

                            domConstruct.destroy("indexDialog_underlay");
                        }
                    } else {

                        if (this.layerflag) {
                            registry.byId("bnd1").set("value", "6");
                            registry.byId("bnd2").set("value", "5");
                            registry.byId("bnd3").set("value", "2");
                            registry.byId("stretchoptions").set("value", "clip2");
                            registry.byId("gammaoptions").set("value", "4");
                            if (layer && layer.url === this.config.layers["Agriculture with DRA"].url && layer.format !== "lerc") {
                                var rasterFunction = new RasterFunction();
                                rasterFunction.functionName = "Agriculture with DRA";
                                layer.setRenderingRule(rasterFunction);
                            } else {
                                if (layer) {
                                    if (layer.updating) {
                                        layer.suspend();
                                    }
                                    this.map.removeLayer(this.map.getLayer("primaryLayer"));
                                }
                                var params = new ImageServiceParameters();
                                params.format = "jpgpng";
                                var loadLayer = new ArcGISImageServiceLayer(this.config.layers["Agriculture with DRA"].url, {
                                    imageServiceParameters: params,
                                    id: "primaryLayer",
                                    visible: true
                                });

                                if (this.map.getLayer("secondaryLayer"))
                                    this.map.addLayer(loadLayer, 2);
                                else
                                    this.map.addLayer(loadLayer, 1);
                                connect.publish("refreshTime", [{ flag: true }]);
                            }
                        } else {
                            registry.byId("bnd1").set("value", this.band1);
                            registry.byId("bnd2").set("value", this.band2);
                            registry.byId("bnd3").set("value", this.band3);
                            registry.byId("stretchoptions").set("value", this.type);
                            registry.byId("gammaoptions").set("value", this.gamma);
                            if (layer && layer.url === this.config.layers["Agriculture with DRA"].url && layer.format !== "lerc") {
                                layer.setBandIds([this.band1 - 1, this.band2 - 1, this.band3 - 1], false);
                                layer.setRenderingRule(this.saveRenderer);
                                html.set(dom.byId("rendererInformation"), "&nbsp;&nbsp;Rendering:&nbsp;" + "Stretch with Bands - " + this.band1 + "," + this.band2 + "," + this.band3);

                            } else {
                                if (layer) {
                                    if (layer.updating) {
                                        layer.suspend();
                                    }
                                    this.map.removeLayer(this.map.getLayer("primaryLayer"));
                                }
                                var params = new ImageServiceParameters();
                                params.renderingRule = this.saveRenderer;
                                params.bandIds = [this.band1 - 1, this.band2 - 1, this.band3 - 1];
                                params.format = "jpgpng";
                                var loadLayer = new ArcGISImageServiceLayer(this.config.layers["Agriculture with DRA"].url, {
                                    imageServiceParameters: params,
                                    visible: true,
                                    id: "primaryLayer"
                                });

                                if (this.map.getLayer("secondaryLayer"))
                                    this.map.addLayer(loadLayer, 2);
                                else
                                    this.map.addLayer(loadLayer, 1);
                                connect.publish("refreshTime", [{ flag: true }]);
                            }
                        }
                        domStyle.set("formula", "display", "none");
                        domStyle.set("indexExtension", "display", "none");
                        domStyle.set("buildExtension", "display", "block");

                        if (registry.byId("tooltipDialogIntro") && registry.byId("tooltipDialogIntro").state === "open") {
                            var tooltipTemp = registry.byId("tooltipDialogIntro");
                            if (tutorialStage === "5") {
                                tooltipTemp.set("content", "<p style='text-align: justify;'>Here you can create your own band combinations. You can also specify stretch and gamma values to adjust the image contrast.<br />Set the RGB Composite to <span style='font-weight: bolder;color: orange;'>Red(4), Green(3), Blue(2)</span> and click <span style='font-weight: bolder;color: orange;'>'Apply'</span>.</p>");
                                popup.open({
                                    parent: registry.byId("bandCombinationDialog"),
                                    popup: tooltipTemp,
                                    orient: ["below"],
                                    around: dom.byId("apply"),
                                    onClose: lang.hitch(this, function () {
                                        domStyle.set(tooltipTemp._popupWrapper, "display", "block");
                                    })
                                });
                                registry.byId("tutorialStage").set("value", "6");
                            }
                        }
                    }
                }
            },
            showLoading: function () {

                if (dom.byId("loadingLayer"))
                    domStyle.set("loadingLayer", "display", "block");
                if (dom.byId("loadingLayer1"))
                    domStyle.set("loadingLayer1", "display", "block");

            },
            hideLoading: function (value) {
                if (dom.byId("loadingLayer"))
                    domStyle.set("loadingLayer", "display", "none");
                if (dom.byId("loadingLayer1"))
                    domStyle.set("loadingLayer1", "display", "none");
            }
        });
        clazz.hasLocale = false;
        return clazz;
    });
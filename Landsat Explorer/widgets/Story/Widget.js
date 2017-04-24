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
    'dojo/text!./Widget.html', "esri/IdentityManager",
    'jimu/BaseWidget', "./resourceLoad.js",
    "dijit/Editor", "dijit/_editor/plugins/AlwaysShowToolbar",
    'dijit/_editor/plugins/FullScreen',
    'dijit/_editor/plugins/LinkDialog',
    'dijit/_editor/plugins/ViewSource',
    'dijit/_editor/plugins/FontChoice',
    'dijit/_editor/plugins/ToggleDir',
    'dojox/editor/plugins/Preview',
    'dijit/_editor/plugins/TextColor',
    'dojox/editor/plugins/ToolbarLineBreak',
    'dijit/ToolbarSeparator',
    'dojox/editor/plugins/InsertEntity',
    'dojox/editor/plugins/Smiley',
    'dojox/editor/plugins/FindReplace',
    'dojox/editor/plugins/PasteFromWord',
    'dojox/editor/plugins/InsertAnchor',
    'dojox/editor/plugins/UploadImage',
    'dojox/editor/plugins/LocalImage'

],
        function (
                declare,
                _WidgetsInTemplateMixin,
                template, IdentityManager,
                BaseWidget, resourceLoad
                ) {
            var resource = new resourceLoad({resource: "story"});
            var plugins = resource.load("story");
            var on = plugins[0],
                    lang = plugins[1],
                    domClass = plugins[2],
                    RasterFunction = plugins[3],
                    ArcGISImageServiceLayer = plugins[4],
                    ImageServiceParameters = plugins[5],
                    locale = plugins[6],
                    domConstruct = plugins[7],
                    dom = plugins[8], html = plugins[9], domStyle = plugins[10], WidgetManager = plugins[11], MosaicRule = plugins[12],
                    esriRequest = plugins[13], HorizontalSlider = plugins[14], arcgisPortal = plugins[15], Query = plugins[16],
                    QueryTask = plugins[17], Extent = plugins[18], registry = plugins[19], popup = plugins[20], RasterLayer = plugins[21], PanelManager = plugins[22], bundle = plugins[23];
            var pm = PanelManager.getInstance();
            var wm = WidgetManager.getInstance();
            var clazz = declare([BaseWidget, _WidgetsInTemplateMixin], {
                templateString: template,
                name: 'Story',
                baseClass: 'jimu-widget-Story',
                hideFlag: true,
                arrayLinks: [],
                arrayList: [],
                flagCloseWidget: true,
                startup: function () {
                    this.inherited(arguments);
                    domConstruct.place('<img id="loadingStory" style="position: absolute;top:0;bottom: 0;left: 0;right: 0;margin:auto;z-index:100;display: none;" src="' + require.toUrl('jimu') + '/images/loading.gif">', "storyDialog");

                },
                postCreate: function () {

                    on(dom.byId("createStory"), "click", lang.hitch(this, function () {
                        var portal = new arcgisPortal.Portal("http://www.arcgis.com");
                        bundle.identity.lblItem = "Account";
                        var tempText = (bundle.identity.info).split("access the item on");
                        bundle.identity.info = tempText[0] + tempText[1];
                        portal.signIn().then(lang.hitch(this, function (loggedInUser) {
                            this.showLoading();
                            this.userLogInInfo = loggedInUser;
                            var url = loggedInUser.userContentUrl;
                            var addItemRequest = esriRequest({
                                url: url,
                                content: {f: "json"},
                                handleAs: "json",
                                callbackParamName: "callback"
                            });
                            addItemRequest.then(lang.hitch(this, function (result) {
                                for (var a = 0; a < result.folders.length; a++) {
                                    if (result.folders[a].title === "StoryApp") {
                                        this.folderId = result.folders[a].id;
                                        this.folderPresent = true;
                                        break;
                                    } else
                                        this.folderPresent = false;
                                }
                                domStyle.set("firstStage", "display", "none");
                                domStyle.set("storyTitle", "display", "block");

                                this.hideLoading();
                            }));
                        }));
                    }));
                    on(dom.byId("updateStory"), "click", lang.hitch(this, function () {
                        var portal = new arcgisPortal.Portal("http://www.arcgis.com");
                        bundle.identity.lblItem = "Account";
                        var tempText = (bundle.identity.info).split("access the item on");
                        bundle.identity.info = tempText[0] + tempText[1];

                        portal.signIn().then(lang.hitch(this, function (loggedInUser) {


                            this.showLoading();
                            this.userLogInInfo = loggedInUser;
                            var url = loggedInUser.userContentUrl;
                            var addItemRequest = esriRequest({
                                url: url,
                                content: {f: "json"},
                                handleAs: "json",
                                callbackParamName: "callback"
                            });
                            addItemRequest.then(lang.hitch(this, function (result) {
                                for (var a = 0; a < result.folders.length; a++) {
                                    if (result.folders[a].title === "StoryApp") {
                                        this.folderId = result.folders[a].id;
                                        this.folderPresent = true;
                                        break;
                                    } else
                                        this.folderPresent = false;
                                }
                                if (this.folderPresent && this.folderId) {
                                    var portal = new arcgisPortal.Portal("http://www.arcgis.com");
                                    portal.signIn().then(lang.hitch(this, function (loggedInUser) {
                                        var url = loggedInUser.userContentUrl;
                                        var getFolderRequest = esriRequest({
                                            url: url + "/" + this.folderId,
                                            content: {f: "json"},
                                            handleAs: "json",
                                            callbackParamName: "callback"
                                        });
                                        getFolderRequest.then(lang.hitch(this, function (result) {
                                            if (result.items.length > 0) {
                                                var width = parseInt(window.innerWidth * 0.156);
                                                var height = parseInt(window.innerWidth * 0.02);
                                                var font = parseInt(window.innerWidth * 0.008);
                                                if (window.innerHeight < 400) {
                                                    var containerHeight = "100px";
                                                } else if (window.innerHeight < 550)
                                                    var containerHeight = "150px";
                                                else
                                                    var containerHeight = "200px";
                                                domStyle.set("updateStoryLink", "height", containerHeight);
                                                for (var a = 0; a < result.items.length; a++) {
                                                    if (result.items[a].type === "GeoJson") {
                                                        domConstruct.place("<button class='buttonCss' data-dojo-type='dijit/form/Button' style='font-size:" + font + "px;width:" + width + "px;height:" + height + "px;display: block;' id='item_" + a + "'>" + result.items[a].title + "</button>", "updateStoryLink", a + 1);
                                                        on(dom.byId("item_" + a), "click", lang.hitch(this, this.getStoryForUpdate, result.items[a].id));
                                                        var item = true;
                                                    }
                                                }
                                                if (!item) {
                                                    html.set(this.itemListContainer, "No stories found.");
                                                }
                                            } else {
                                                html.set(this.itemListContainer, "No stories found.");
                                            }

                                            domStyle.set("firstStage", "display", "none");
                                            domStyle.set("updateStoryLink", "display", "block");

                                        }));
                                    }));
                                } else {
                                    html.set(this.itemListContainer, "No stories found.");
                                }
                                this.hideLoading();
                            }));
                        }));
                    }));

                    registry.byId("titleStage").on("change", lang.hitch(this, function (value) {
                        registry.byId("titleStage").set("value", value);
                        if (value)
                            domStyle.set("titleNext", "background-position", "0 30px");
                        else
                            domStyle.set("titleNext", "background-position", "0 0px");
                    }));

                    on(dom.byId("titleNext"), "click", lang.hitch(this, function () {
                        this.updateMode = null;
                        if (registry.byId("titleStage").get("value")) {
                            registry.byId("titleStep").set("value", registry.byId("titleStage").get("value"));

                            registry.byId("addUpdateDialog").show();
                            domStyle.set("addUpdateDialog", "top", "110px");
                            registry.byId("addUpdateDialog").set("title", "Add Section");
                            domStyle.set("storyTitle", "display", "none");
                            domStyle.set(registry.byId("titleStep").domNode, "display", "none");
                            domStyle.set("updateDeleteStep", "display", "none");
                            domStyle.set("addStep", "display", "block");
                        } else {
                            domStyle.set("defineSteps", "display", "none");
                            domStyle.set("storyTitle", "display", "block");
                        }

                    }));


                    registry.byId("addStep").on("click", lang.hitch(this, function () {

                        if (registry.byId("textEditor").get("value") && registry.byId("textEditor").get("value") !== "<p>Add your description here.</p>" && registry.byId("titleStep").get("value")) {
                            this.saveStage("add");
                            domStyle.set("defineSteps", "display", "none");
                            registry.byId("addUpdateDialog").hide();
                            domStyle.set("addOrganize", "display", "inline-block");
                            domStyle.set("firstStage", "display", "none");

                        }

                    }));
                    on(dom.byId("addSection"), "click", lang.hitch(this, function () {
                        domStyle.set("editSection", "background-color", "");
                        domStyle.set("editSection", "color", "");
                        domStyle.set("organize", "background-color", "");
                        domStyle.set("organize", "color", "");
                        domStyle.set("editSectionList", "display", "none");
                        domStyle.set("editSectionList", "height", "0px");
                        domStyle.set("organizeList", "display", "none");
                        domStyle.set("organizeList", "height", "0px");
                        registry.byId("titleStep").set("value", "");
                        registry.byId("textEditor").set("value", "<p>Add your description here.</p>");
                        domStyle.set(registry.byId("titleStep").domNode, "display", "block");
                        domStyle.set(registry.byId("addStep").domNode, "display", "block");
                        domStyle.set(dom.byId("updateDeleteStep"), "display", "none");

                        registry.byId("addUpdateDialog").show();
                        domStyle.set("addUpdateDialog", "top", "110px");
                        registry.byId("addUpdateDialog").set("title", "Add Section");

                    }));
                    on(dom.byId("editSection"), "click", lang.hitch(this, this.editSections));
                    on(dom.byId("finish"), "click", lang.hitch(this, function () {
                        if (this.folderPresent)
                            this.createJsonFile();
                        else {
                            var portal = new arcgisPortal.Portal("http://www.arcgis.com");
                            portal.signIn().then(lang.hitch(this, function (loggedInUser) {
                                var url = loggedInUser.userContentUrl;
                                var createFolderRequest = esriRequest({
                                    url: url + "/createFolder",
                                    content: {f: "json", title: "StoryApp"},
                                    handleAs: "json",
                                    callbackParamName: "callback"
                                }, {usePost: true});
                                createFolderRequest.then(lang.hitch(this, function (result) {
                                    this.folderId = result.folder.id;
                                    this.createJsonFile();
                                }));
                            }));
                        }

                    }));
                    on(dom.byId("organize"), "click", lang.hitch(this, this.organizeList));
                    registry.byId("updateStep").on("click", lang.hitch(this, this.updateStepButton));
                    registry.byId("deleteStep").on("click", lang.hitch(this, this.deleteStepButton));

                    dojo.connect(registry.byId("storyDialog"), "hide", lang.hitch(this, function () {
                        if (this.flagCloseWidget) {

                            pm.closePanel("_60_panel");
                        } else
                            this.flagCloseWidget = true;
                    }));
                    dojo.connect(registry.byId("addUpdateDialog"), "hide", lang.hitch(this, function () {
                        if (!this.widgetClose) {
                            if (!registry.byId("storyDialog").open)
                            {
                                registry.byId("storyDialog").show();


                                domStyle.set("storyDialog", "right", "15px");
                                domStyle.set("storyDialog", "left", "auto");
                                domStyle.set("storyDialog", "top", "110px");
                                if (domStyle.get("addOrganize", "display") === "none")
                                    domStyle.set("firstStage", "display", "block");


                            }
                        }
                    }));
                    dojo.connect(registry.byId("addUpdateDialog"), "show", lang.hitch(this, function () {
                        if (registry.byId("storyDialog").open) {
                            this.flagCloseWidget = false;
                            registry.byId("storyDialog").hide();
                        }
                    }));
                    domStyle.set(registry.byId("textEditor").domNode, "width", (0.32 * window.innerWidth) + "px");
                    domStyle.set(registry.byId("titleStep").domNode, "width", (0.32 * window.innerWidth) + "px");
                },
                loadAppStories: function (id) {

                    window.open("http://landsatexplorer.esri.com/index.html?story=" + id, "_blank");
                },
                getStoryForUpdate: function (id) {
                    this.updateMode = id;
                    this.showLoading();//domStyle.set("loadingStory","display","block");
                    var getItemRequest = esriRequest({
                        url: "http://www.arcgis.com/sharing/rest/content/items/" + id + "/data",
                        handleAs: "json",
                        callbackParamName: "callback"
                    });
                    getItemRequest.then(lang.hitch(this, function (value) {
                        this.arrayLinks = [];

                        for (var a = 0; a < value.length; a++) {

                            this.arrayLinks.push(value[a].Info);
                        }

                        domStyle.set("updateStoryLink", "display", "none");
                        domStyle.set("updateStoryLink", "height", "0px");
                        this.hideLoading();
                        domStyle.set("addOrganize", "display", "inline-block");
                        domStyle.set(registry.byId("titleStep").domNode, "display", "block");
                        this.editSections();
                        this.hideLoading();
                    }));
                },
                organizeList: function () {
                    domConstruct.empty("organizeList");

                    var width = parseInt(window.innerWidth * 0.156);
                    var height = parseInt(window.innerWidth * 0.02);
                    var font = parseInt(window.innerWidth * 0.008);
                    domStyle.set("organizeList", "height", "330px");
                    domConstruct.place("<div style='text-align:jusitfy;width:" + width + "px;font-weight:bolder;font-size:" + font + "px;'>Drag and drop sections to organize your story. The home section cannot be moved.<br /><br /></div>", "organizeList", 0);
                    for (var a = 0; a < this.arrayLinks.length; a++) {
                        if (a === 0) {
                            domConstruct.place("<button class='button3d' data-dojo-type='dijit/form/Button'   style='font-size: " + font + "px;width:" + width + "px;height:" + height + "px;display: block;' id='list_" + a + "'>Home - " + this.arrayLinks[a].title + "</button>", "organizeList", a + 1);
                        } else {
                            domConstruct.place("<button class='button3d' data-dojo-type='dijit/form/Button'  draggable= 'true'  style='font-size: " + font + "px;width:" + width + "px;height:" + height + "px;display: block;' id='list_" + a + "'>" + this.arrayLinks[a].title + "</button>", "organizeList", a + 1);
                        }
                        if (a !== 0) {
                            on(dom.byId("list_" + a), "dragstart", lang.hitch(this, function (event) {
                                event.dataTransfer.setData("text", event.target.id);
                            }));
                            on(dom.byId("list_" + a), "drop", lang.hitch(this, this.drop));
                            on(dom.byId("list_" + a), "dropover", lang.hitch(this, function (event) {
                                event.preventDefault();
                            }));
                            on(dom.byId("list_" + a), "dragover", lang.hitch(this, function (event) {
                                event.preventDefault();
                            }));
                        }
                    }


                    domConstruct.place("<br />", "organizeList", a + 1);
                    domStyle.set("organize", "background-color", "#485566");
                    domStyle.set("organize", "color", "white");
                    domStyle.set("editSection", "background-color", "");
                    domStyle.set("editSection", "color", "");
                    domStyle.set("editSectionList", "display", "none");
                    domStyle.set("editSectionList", "height", "0px");
                    domStyle.set("organizeList", "display", "inline-block");

                },
                drop: function (event) {
                    event.preventDefault();
                    var data = event.dataTransfer.getData("text");
                    dom.byId("organizeList").insertBefore(dom.byId(data), dom.byId(event.target.id));
                    var firstNode = parseInt(data.split("_")[1]);
                    var secondNode = parseInt(event.target.id.split("_")[1]);
                    var temp = this.arrayLinks[firstNode];
                    this.arrayLinks.splice(firstNode, 1);
                    if (firstNode < secondNode)
                        this.arrayLinks.splice(secondNode - 1, 0, temp);
                    else
                        this.arrayLinks.splice(secondNode, 0, temp);

                    this.organizeList();
                },
                createJsonFile: function () {
                    this.showLoading();
                    var arrayJson = [];
                    for (var a = 0; a < this.arrayLinks.length; a++) {
                        if (a === 0) {
                            arrayJson.push({
                                app: {appName: dom.byId("appName").innerHTML, appUrl: window.location.href},
                                stage: "Home",
                                Info: this.arrayLinks[a]
                            });
                        } else {
                            arrayJson.push({
                                stage: "Section " + a,
                                Info: this.arrayLinks[a]
                            });
                        }
                    }

                    var formBlob = new Blob([JSON.stringify(arrayJson)], {type: 'text/json'});

                    var file = new File([formBlob], this.arrayLinks[0].title + ".json");
                    var formData = new FormData();


                    formData.append("file", file);
                    var portal = new arcgisPortal.Portal("http://www.arcgis.com");

                    portal.signIn().then(lang.hitch(this, function (loggedInUser) {

                        if (this.updateMode) {

                            var updateItemRequest = esriRequest({
                                url: loggedInUser.userContentUrl + "/" + this.folderId + "/items/" + this.updateMode + "/update",
                                content: {f: "json",
                                    title: this.arrayLinks[0].title,
                                    type: "GeoJson",
                                    async: true,
                                    itemType: "file"
                                },
                                form: formData,
                                handleAs: "json",
                                callbackParamName: "callback"
                            }, {usePost: true});
                            updateItemRequest.then(lang.hitch(this, function (result) {
                                html.set(this.sharingPublicDescription, "Item with id <b>" + this.updateMode + "</b> has been updated on your ArcGIS Online account.");

                                this.createShortLink(this.updateMode);
                            }));
                        } else {
                            var url = loggedInUser.userContentUrl;
                            var addItemRequest = esriRequest({
                                url: url + "/" + this.folderId + "/addItem",
                                content: {f: "json",
                                    title: this.arrayLinks[0].title,
                                    type: "GeoJson", //"Web Map",
                                    description: "Json file for configuring Landsat Explorer story",
                                    tags: "Imagery Story App, Landsat Explorer, Story",
                                    async: true,
                                    itemType: "file",
                                    overwrite: false
                                },
                                form: formData,
                                handleAs: "json",
                                callbackParamName: "callback"
                            }, {usePost: true});
                            addItemRequest.then(lang.hitch(this, function (result) {

                                html.set(this.sharingPublicDescription, "Item with title <b>" + this.arrayLinks[0].title + "</b> has been created on your ArcGIS Online account. Please make the item public before sharing the story publically. You can also share the item with groups or within your organization. Story access depends on the item access.");
                                this.createShortLink(result.id);
                            }));
                        }
                    }
                    ));
                },
                createShortLink: function (id) {
                    var request = new XMLHttpRequest();
                    request.responseType = "json";
                    request.onreadystatechange = lang.hitch(this, function () {

                        if (request.readyState === 4 && request.status === 200) {
                            registry.byId("storyLink").set("value", request.response.data.url);
                            domStyle.set("editSectionList", "display", "none");
                            domStyle.set("editSectionList", "height", "0px");
                            domStyle.set("organizeList", "display", "none");
                            domStyle.set("organizeList", "height", "0px");
                            domStyle.set("finalStoryLink", "display", "block");
                            domStyle.set("addOrganize", "display", "none");
                            this.hideLoading();
                        }
                    });
                    var appUrl = window.location.href;
                    if (appUrl[appUrl.length - 1] === "/")
                        appUrl = appUrl.slice(0, appUrl.length - 1);
                    if (!appUrl.includes("/index.html"))
                        appUrl = appUrl + "/index.html";
                    if (appUrl.includes("?"))
                        appUrl = appUrl.replace(/"?"/g, "");
                    var shortUrl = appUrl + "?story=" + id;
                    request.open("Get", "https://api-ssl.bitly.com/v3/shorten?login=&apiKey=&longUrl=" + shortUrl, true); //pass login and apikey for bitly
                    request.send();
                },
                editSections: function () {
                    domStyle.set("editSection", "background-color", "#485566");
                    domStyle.set("editSection", "color", "white");
                    domStyle.set("organize", "background-color", "");
                    domStyle.set("organize", "color", "");
                    domStyle.set("organizeList", "display", "none");
                    domStyle.set("organizeList", "height", "0px");
                    domConstruct.empty("editSectionList");
                    var width = parseInt(window.innerWidth * 0.156);
                    var height = parseInt(window.innerWidth * 0.02);
                    var font = parseInt(window.innerWidth * 0.008);
                    domStyle.set("editSectionList", "height", "330px");
                    domConstruct.place("<div style='text-align:jusitfy;width:" + width + "px;font-weight: bolder;font-size:" + font + "px;'>Click on sections listed below to edit.<br /><br /></div>", "editSectionList", 0);
                    for (var a = 0; a < this.arrayLinks.length; a++) {
                        if (a === 0) {
                            domConstruct.place("<button class='buttonCss1' data-dojo-type='dijit/form/Button'   style='font-size:" + font + "px;width:" + width + "px;height:" + height + "px;display: block;' id='button_" + a + "'>Home - " + this.arrayLinks[a].title + "</button>", "editSectionList", a + 1);
                        } else {
                            domConstruct.place("<button class='buttonCss1' data-dojo-type='dijit/form/Button' style='font-size:" + font + "px;width:" + width + "px;height:" + height + "px;display: block;' id='button_" + a + "'>Section " + a + " - " + this.arrayLinks[a].title + "</button>", "editSectionList", a + 1);
                        }
                        on(dom.byId("button_" + a), "click", lang.hitch(this, this.fillEdit, a));

                    }
                    domConstruct.place("<br />", "editSectionList", a + 1);
                    domStyle.set("editSectionList", "display", "inline-block");

                },
                fillEdit: function (a) {
                    this.closeWidgets(false);
                    this.setPropertiesOnLayer(this.arrayLinks[a].state);
                    domStyle.set(registry.byId("titleStep").domNode, "display", "block");
                    registry.byId("titleStep").set("value", this.arrayLinks[a].title);
                    registry.byId("textEditor").set("value", this.arrayLinks[a].description);
                    this.updateSectionIndex = a;

                    registry.byId("addUpdateDialog").show();
                    domStyle.set("addUpdateDialog", "top", "110px");
                    registry.byId("addUpdateDialog").set("title", "Edit Section");

                    domStyle.set(registry.byId("addStep").domNode, "display", "none");
                    domStyle.set(dom.byId("updateDeleteStep"), "display", "block");

                },
                updateStepButton: function () {
                    this.saveStage("update");
                    domStyle.set("editSectionList", "display", "inline-block");

                    registry.byId("addUpdateDialog").hide();
                    this.editSections();
                },
                deleteStepButton: function () {
                    this.arrayLinks.splice(this.updateSectionIndex, 1);
                    domStyle.set("editSectionList", "display", "inline-block");

                    registry.byId("addUpdateDialog").hide();
                    this.editSections();
                },
                setPropertiesOnLayer: function (state) {
                    if (dom.byId("sliderTransparency"))
                        domStyle.set(dom.byId("sliderTransparency"), "display", "none");
                    var s = document.getElementsByClassName("icon-node");
                    if (!state.swipe) {
                        if (domClass.contains(s[1], "jimu-state-selected"))
                            s[1].click();
                    }
                    this.savedState = state;
                    if (this.map.getLayer("resultLayer") && !state.result.renderingRule) {

                        this.map.getLayer("resultLayer").hide();



                    }
                    if (this.map.getLayer("secondaryLayer") && this.map.getLayer("secondaryLayer").url !== this.config[state.secondary.service]) {

                        this.map.getLayer("secondaryLayer").suspend();
                        this.map.removeLayer(this.map.getLayer("secondaryLayer"));
                    }
                    if (this.map.getLayer("primaryLayer") && this.map.getLayer("primaryLayer").url !== this.config[state.primary.service])
                    {

                        this.map.getLayer("primaryLayer").suspend();
                        this.map.removeLayer(this.map.getLayer("primaryLayer"));

                    }
                    this.map.setExtent(new Extent(JSON.parse(state.extent))).then(lang.hitch(this, function () {
                        if (dom.byId("sliderTransparency"))
                            registry.byId("sliderTransparency").set("value", 0);

                        if (state.secondary.mosaicRule) {
                            var currentSecondaryLayer = this.map.getLayer("secondaryLayer");
                            if (currentSecondaryLayer && currentSecondaryLayer.url === this.config[state.secondary.service]) {
                                currentSecondaryLayer.setRenderingRule(new RasterFunction(JSON.parse(state.secondary.renderingRule)), true);
                                if (state.secondary.service === "urlLandsatMS") {
                                    if (state.secondary.bandIds)
                                        currentSecondaryLayer.setBandIds(state.secondary.bandIds, true);
                                    else
                                        currentSecondaryLayer.setBandIds([], true);
                                }
                                currentSecondaryLayer.setVisibility(state.secondary.visible);
                                currentSecondaryLayer.setMosaicRule(new MosaicRule({"mosaicMethod": "esriMosaicAttribute", "sortField": "Best", "sortValue": 0, "ascending": true, "where": "GroupName = '" + state.secondary.mosaicRule + "'", "mosaicOperation": "MT_FIRST"}), false);
                            } else {

                                var paramsSecondary = new ImageServiceParameters();
                                paramsSecondary.format = "jpgpng";
                                paramsSecondary.bandIds = state.secondary.bandIds;
                                paramsSecondary.renderingRule = new RasterFunction(JSON.parse(state.secondary.renderingRule));
                                paramsSecondary.mosaicRule = state.secondary.mosaicRule ? new MosaicRule({"mosaicMethod": "esriMosaicAttribute", "sortField": "Best", "sortValue": 0, "ascending": true, "where": "GroupName = '" + state.secondary.mosaicRule + "'", "mosaicOperation": "MT_FIRST"}) : null;
                                var secondaryLayer = new ArcGISImageServiceLayer(this.config[state.secondary.service], {
                                    id: "secondaryLayer",
                                    visible: state.secondary.visible,
                                    imageServiceParameters: paramsSecondary
                                });

                                this.map.addLayer(secondaryLayer, 1);

                            }
                        }
                        if (state.primary.renderingRule) {
                            var currentPrimaryLayer = this.map.getLayer("primaryLayer");
                            if (currentPrimaryLayer && currentPrimaryLayer.url === this.config[state.primary.service]) {
                                if (state.primary.mosaicRule) {
                                    currentPrimaryLayer.setMosaicRule(new MosaicRule({"mosaicMethod": "esriMosaicAttribute", "sortField": "Best", "sortValue": 0, "ascending": true, "where": "GroupName = '" + state.primary.mosaicRule + "'", "mosaicOperation": "MT_FIRST"}), true);
                                } else
                                    currentPrimaryLayer.setMosaicRule(currentPrimaryLayer.defaultMosaicRule, true);
                                if (state.primary.service === "urlLandsatMS") {
                                    if (state.primary.bandIds)
                                        currentPrimaryLayer.setBandIds(state.primary.bandIds, true);
                                    else
                                        currentPrimaryLayer.setBandIds([], true);
                                }
                                currentPrimaryLayer.setVisibility(state.primary.visible);
                                currentPrimaryLayer.setRenderingRule(new RasterFunction(JSON.parse(state.primary.renderingRule)), false);

                            } else {

                                var paramsPrimary = new ImageServiceParameters();
                                paramsPrimary.format = "jpgpng";
                                paramsPrimary.bandIds = state.primary.bandIds;
                                paramsPrimary.renderingRule = new RasterFunction(JSON.parse(state.primary.renderingRule));
                                paramsPrimary.mosaicRule = state.primary.mosaicRule ? new MosaicRule({"mosaicMethod": "esriMosaicAttribute", "sortField": "Best", "sortValue": 0, "ascending": true, "where": "GroupName = '" + state.primary.mosaicRule + "'", "mosaicOperation": "MT_FIRST"}) : null;
                                var primaryLayer = new ArcGISImageServiceLayer(this.config[state.primary.service], {
                                    id: "primaryLayer",
                                    visible: state.primary.visible,
                                    imageServiceParameters: paramsPrimary
                                });
                                if (state.secondary.mosaicRule)
                                    this.map.addLayer(primaryLayer, 2);
                                else
                                    this.map.addLayer(primaryLayer, 1);
                            }
                        }

                        if (state.swipe)
                        {
                            if (!domClass.contains(s[1], "jimu-state-selected"))
                                s[1].click();
                        }
                        if (state.result.renderingRule) {

                            if (dom.byId("sliderTransparency"))
                                domStyle.set(dom.byId("sliderTransparency"), "display", "block");
                            if (state.result.changeMask === "change") {
                                var query = new Query();
                                query.where = "GroupName = '" + state.secondary.mosaicRule + "' OR GroupName = '" + state.primary.mosaicRule + "'";
                                query.returnGeometry = false;
                                query.outFields = ["OBJECTID", "GroupName", "AcquisitionDate"];
                                var queryTask = new QueryTask(this.config.urlLandsatMS);
                                queryTask.execute(query, lang.hitch(this, function (value) {
                                    var rendererJson = JSON.parse(state.result.renderingRule);
                                    if (value.features[0].attributes.GroupName === state.secondary.mosaicRule)
                                    {
                                        var second = value.features[0];
                                        var prim = value.features[1];
                                    } else {
                                        var second = value.features[1];
                                        var prim = value.features[0];
                                    }
                                    if (locale.format(new Date(second.attributes.AcquisitionDate), {selector: "date", datePattern: "yyyy/MM/dd"}) < locale.format(new Date(prim.attributes.AcquisitionDate), {selector: "date", datePattern: "yyyy/MM/dd"}))
                                    {
                                        var latest = prim.attributes.OBJECTID;
                                        var old = second.attributes.OBJECTID;
                                    } else {
                                        var latest = second.attributes.OBJECTID;
                                        var old = prim.attributes.OBJECTID;
                                    }
                                    if (state.result.changeMode === "threshold") {
                                        if (state.result.changeIndex !== "BurnIndex") {

                                            rendererJson.rasterFunctionArguments.Raster.rasterFunctionArguments.Rasters[0].rasterFunctionArguments.Raster = "$" + old;
                                            rendererJson.rasterFunctionArguments.Raster.rasterFunctionArguments.Rasters[1].rasterFunctionArguments.Raster = "$" + latest;
                                        } else {
                                            rendererJson.rasterFunctionArguments.Raster.rasterFunctionArguments.Rasters[0].rasterFunctionArguments.Raster.rasterFunctionArguments.Raster = "$" + old;
                                            rendererJson.rasterFunctionArguments.Raster.rasterFunctionArguments.Rasters[1].rasterFunctionArguments.Raster.rasterFunctionArguments.Raster = "$" + latest;
                                            rendererJson.rasterFunctionArguments.Raster.rasterFunctionArguments.Rasters[0].rasterFunctionArguments.Raster2.rasterFunctionArguments.Raster.rasterFunctionArguments.Raster = "$" + old;
                                            rendererJson.rasterFunctionArguments.Raster.rasterFunctionArguments.Rasters[1].rasterFunctionArguments.Raster2.rasterFunctionArguments.Raster.rasterFunctionArguments.Raster = "$" + latest;
                                        }
                                    } else if (state.result.changeMode === "difference") {

                                        if (state.result.changeIndex !== "BurnIndex") {
                                            rendererJson.rasterFunctionArguments.Raster.rasterFunctionArguments.Raster.rasterFunctionArguments.Raster = "$" + latest;
                                            rendererJson.rasterFunctionArguments.Raster.rasterFunctionArguments.Raster2.rasterFunctionArguments.Raster = "$" + old;
                                        } else {
                                            rendererJson.rasterFunctionArguments.Raster.rasterFunctionArguments.Raster.rasterFunctionArguments.Raster.rasterFunctionArguments.Raster = "$" + latest;
                                            rendererJson.rasterFunctionArguments.Raster.rasterFunctionArguments.Raster2.rasterFunctionArguments.Raster.rasterFunctionArguments.Raster = "$" + old;
                                            rendererJson.rasterFunctionArguments.Raster.rasterFunctionArguments.Raster.rasterFunctionArguments.Raster2.rasterFunctionArguments.Raster.rasterFunctionArguments.Raster = "$" + latest;
                                            rendererJson.rasterFunctionArguments.Raster.rasterFunctionArguments.Raster2.rasterFunctionArguments.Raster2.rasterFunctionArguments.Raster.rasterFunctionArguments.Raster = "$" + old;
                                        }
                                    } else if (state.result.changeMode === "Image") {
                                        if (state.result.changeIndex !== "BurnIndex") {
                                            rendererJson.rasterFunctionArguments.Raster.rasterFunctionArguments.Raster.rasterFunctionArguments.Rasters[0].rasterFunctionArguments.Raster = "$" + old;
                                            rendererJson.rasterFunctionArguments.Raster.rasterFunctionArguments.Raster.rasterFunctionArguments.Rasters[1].rasterFunctionArguments.Raster = "$" + latest;
                                            rendererJson.rasterFunctionArguments.Raster.rasterFunctionArguments.Raster.rasterFunctionArguments.Rasters[2].rasterFunctionArguments.Raster = "$" + old;
                                        } else {

                                            rendererJson.rasterFunctionArguments.Raster.rasterFunctionArguments.Raster.rasterFunctionArguments.Rasters[0].rasterFunctionArguments.Raster.rasterFunctionArguments.Raster = "$" + old;
                                            rendererJson.rasterFunctionArguments.Raster.rasterFunctionArguments.Raster.rasterFunctionArguments.Rasters[1].rasterFunctionArguments.Raster.rasterFunctionArguments.Raster = "$" + latest;
                                            rendererJson.rasterFunctionArguments.Raster.rasterFunctionArguments.Raster.rasterFunctionArguments.Rasters[2].rasterFunctionArguments.Raster.rasterFunctionArguments.Raster = "$" + old;
                                            rendererJson.rasterFunctionArguments.Raster.rasterFunctionArguments.Raster.rasterFunctionArguments.Rasters[0].rasterFunctionArguments.Raster2.rasterFunctionArguments.Raster.rasterFunctionArguments.Raster = "$" + old;
                                            rendererJson.rasterFunctionArguments.Raster.rasterFunctionArguments.Raster.rasterFunctionArguments.Rasters[1].rasterFunctionArguments.Raster2.rasterFunctionArguments.Raster.rasterFunctionArguments.Raster = "$" + latest;
                                            rendererJson.rasterFunctionArguments.Raster.rasterFunctionArguments.Raster.rasterFunctionArguments.Rasters[2].rasterFunctionArguments.Raster2.rasterFunctionArguments.Raster.rasterFunctionArguments.Raster = "$" + old;
                                        }
                                    }
                                    this.loadResultLayer(rendererJson, state);
                                }));
                            } else {
                                var rendererJson = JSON.parse(state.result.renderingRule);
                                this.loadResultLayer(rendererJson, state);
                            }


                        }
                    }));
                },
                loadResultLayer: function (rendererJson, state) {
                    if (!this.map.getLayer("resultLayer")) {
                        if (!state.result.renderingRule) {

                            this.map.getLayer("resultLayer").suspend();
                            this.map.removeLayer(this.map.getLayer("resultLayer"));
                        }
                        var paramsResult = new ImageServiceParameters();
                        paramsResult.format = "lerc";
                        paramsResult.renderingRule = new RasterFunction(rendererJson);
                        paramsResult.mosaicRule = state.result.mosaicRule ? new MosaicRule({"mosaicMethod": "esriMosaicAttribute", "sortField": "Best", "sortValue": 0, "ascending": true, "where": "GroupName = '" + state.primary.mosaicRule + "'", "mosaicOperation": "MT_FIRST"}) : null;
                        this.stateSaved = state.result;

                        var resultLayer = new RasterLayer(this.config.urlLandsatMS, {
                            id: "resultLayer",
                            visible: true,
                            imageServiceParameters: paramsResult,
                            pixelFilter: lang.hitch(this, this.maskChangeFilter)
                        });
                        resultLayer.on("load", lang.hitch(this, function (layer) {
                            resultLayer.pixelType = "F32";

                        }));
                        this.map.addLayer(resultLayer);
                    } else {
                        this.map.getLayer("resultLayer").show();
                        var newResultLayer = this.map.getLayer("resultLayer");
                        if (state.result.mosaicRule)
                            newResultLayer.setMosaicRule(new MosaicRule({"mosaicMethod": "esriMosaicAttribute", "sortField": "Best", "sortValue": 0, "ascending": true, "where": "GroupName = '" + state.primary.mosaicRule + "'", "mosaicOperation": "MT_FIRST"}), true);
                        newResultLayer.setRenderingRule(new RasterFunction(rendererJson));

                        this.stateSaved = state.result;
                    }
                },
                maskChangeFilter: function (pixelData) {


                    if (pixelData === null || pixelData.pixelBlock === null) {

                        return;
                    }
                    if (pixelData && pixelData.pixelBlock && pixelData.pixelBlock.pixels === null)
                        return;
                    if (this.stateSaved.changeMode !== "Image") {
                        var p1 = pixelData.pixelBlock.pixels[0];
                        if (!pixelData.pixelBlock.mask) {
                            pixelData.pixelBlock.mask = new Uint8Array(p1.length);
                        }

                        var pr = new Uint8Array(p1.length);
                        var pg = new Uint8Array(p1.length);
                        var pb = new Uint8Array(p1.length);


                        var numPixels = pixelData.pixelBlock.width * pixelData.pixelBlock.height;
                        if (this.stateSaved.changeMask === "mask") {
                            var maskRangeValue = this.stateSaved.maskSlider;

                            for (var i = 0; i < numPixels; i++) {
                                if (p1[i] >= parseFloat(maskRangeValue))
                                {
                                    pixelData.pixelBlock.mask[i] = 1;
                                    pr[i] = this.stateSaved.maskColor[0];
                                    pg[i] = this.stateSaved.maskColor[1];
                                    pb[i] = this.stateSaved.maskColor[2];
                                } else
                                    pixelData.pixelBlock.mask[i] = 0;
                            }
                        } else {

                            var threshold = this.stateSaved.threshold;//registry.byId("horiSliderInclusion").get("value");

                            if (this.stateSaved.changeMode === "difference") {
                                var pixelScene = pixelData.pixelBlock.pixels[0];
                                var negativeDif = this.stateSaved.negativeSlider;
                                for (var i = 0; i < numPixels; i++) {

                                    if (pixelScene[i] === -3.4027999387901484e+38) {
                                        pixelData.pixelBlock.mask[i] = 0;
                                    } else if (pixelScene[i] < negativeDif) { //&& pixelScene[i] < -0.1
                                        if (this.stateSaved.changeIndex === "BurnIndex") {
                                            pr[i] = 255;
                                            pg[i] = 69;
                                            pb[i] = 0;
                                        } else {
                                            pr[i] = 255;
                                            pg[i] = 0;
                                            pb[i] = 255;
                                        }
                                        pixelData.pixelBlock.mask[i] = 1;

                                    } else if (pixelScene[i] > threshold) {
                                        pr[i] = 0//124;
                                        pg[i] = 252;
                                        pb[i] = 0;
                                        pixelData.pixelBlock.mask[i] = 1;

                                    } else
                                        pixelData.pixelBlock.mask[i] = 0;
                                }
                            } else {
                                var pixelScene1 = pixelData.pixelBlock.pixels[0];
                                var pixelScene2 = pixelData.pixelBlock.pixels[1];

                                var differenceThreshold = this.stateSaved.differenceSlider;


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

                                        } else if (pixelScene1[i] > threshold && pixelScene2[i] < threshold && (pixelScene1[i] - pixelScene2[i]) > differenceThreshold) {
                                            pixelData.pixelBlock.mask[i] = 1;
                                            if (this.stateSaved.changeIndex === "BurnIndex") {
                                                pr[i] = 255;
                                                pg[i] = 69;
                                                pb[i] = 0;
                                            } else {
                                                pr[i] = 255;
                                                pg[i] = 0;
                                                pb[i] = 255;
                                            }

                                        } else
                                            pixelData.pixelBlock.mask[i] = 0;
                                    }
                                }
                            }
                        }
                        pixelData.pixelBlock.pixels = [pr, pg, pb];

                        pixelData.pixelBlock.pixelType = "U8";
                    }

                },
                saveStage: function (mode) {
                    var shareLayer = this.map.getLayer("primaryLayer");
                    if (shareLayer.url === this.config.urlLandsatMS)
                        var layerPrimary = "urlLandsatMS";
                    else if (shareLayer.url === this.config.urlLandsatPS)
                        var layerPrimary = "urlLandsatPS";
                    else
                        var layerPrimary = "urlLandsatPan";
                    if (shareLayer.mosaicRule && shareLayer.mosaicRule.method === "esriMosaicLockRaster") {
                        if (mode === "update")
                            var mosaicRulePrimary = registry.byId("primarySceneId") ? registry.byId("primarySceneId").get("value") : this.savedState.primary.mosaicRule; //JSON.stringify(shareLayer.mosaicRule.toJson());
                        else
                            var mosaicRulePrimary = registry.byId("primarySceneId").get("value");
                    } else
                        var mosaicRulePrimary = "";

                    if (shareLayer.renderingRule) {
                        var renderingRulePrimary = JSON.stringify(shareLayer.renderingRule.toJson());
                    } else
                        var renderingRulePrimary = "";

                    var primaryProperties = {service: layerPrimary, renderingRule: renderingRulePrimary, mosaicRule: mosaicRulePrimary, visible: shareLayer.visible, bandIds: shareLayer.bandIds};
                    var mapextent = JSON.stringify(this.map.extent.toJson());

                    var swipe = domClass.contains(document.getElementsByClassName("icon-node")[1], "jimu-state-selected");

                    if (this.map.getLayer("secondaryLayer") && ((registry.byId("changeDetectionDialog") && registry.byId("changeMaskDetect").get("value") === "change") || swipe)) {
                        var secondaryLayer = this.map.getLayer("secondaryLayer");
                        if (secondaryLayer.url === this.config.urlLandsatMS)
                            var layerSecondary = "urlLandsatMS";
                        else if (secondaryLayer.url === this.config.urlLandsatPS)
                            var layerSecondary = "urlLandsatPS";
                        else
                            var layerSecondary = "urlLandsatPan";
                        if (secondaryLayer.mosaicRule && secondaryLayer.mosaicRule.method === "esriMosaicLockRaster") {
                            if (mode === "update")
                                var mosaicRuleSecondary = registry.byId("secondarySceneId") ? registry.byId("secondarySceneId").get("value") : this.savedState.secondary.mosaicRule;
                            else
                                var mosaicRuleSecondary = registry.byId("secondarySceneId").get("value");//JSON.stringify(secondaryLayer.mosaicRule.toJson());
                        } else
                            var mosaicRuleSecondary = "";
                        if (secondaryLayer.renderingRule) {
                            var renderingRuleSecondary = JSON.stringify(secondaryLayer.renderingRule.toJson());
                        } else
                            var renderingRuleSecondary = "";
                        var secondaryProperties = {service: layerSecondary, renderingRule: renderingRuleSecondary, mosaicRule: mosaicRuleSecondary, visible: secondaryLayer.visible, bandIds: secondaryLayer.bandIds};
                    } else {
                        var secondaryProperties = {service: null, renderingRule: null, mosaicRule: null, visible: null, bandIds: null};
                    }

                    if (this.map.getLayer("resultLayer")) {
                        var resultLayer = this.map.getLayer("resultLayer");

                        if (mode === "update") {

                            if (registry.byId("changeMaskDetect")) {
                                this.setChangeMaskParameters();
                            } else
                                this.resultProperties = this.stateSaved;
                        } else
                            this.setChangeMaskParameters();

                        var resultProperties = this.resultProperties;
                    } else {
                        var resultProperties = "";
                    }
                    if (this.arrayLinks.length < 1) {
                        var title = registry.byId("titleStage").get("value");

                    } else {
                        var title = registry.byId("titleStep").get("value");

                    }
                    var descriptionStep = registry.byId("textEditor").get("value");
                    var sectionInfo = {primary: primaryProperties, secondary: secondaryProperties, result: resultProperties, extent: mapextent, swipe: swipe};

                    if (mode === "add")
                        this.arrayLinks.push({title: title, state: sectionInfo, description: descriptionStep});
                    else {
                        this.arrayLinks[this.updateSectionIndex].title = title;
                        this.arrayLinks[this.updateSectionIndex].state = sectionInfo;
                        this.arrayLinks[this.updateSectionIndex].description = descriptionStep;
                        domStyle.set(registry.byId("addStep").domNode, "display", "block");
                        domStyle.set(dom.byId("updateDeleteStep"), "display", "none");
                    }
                    registry.byId("titleStep").set("value", "");
                    registry.byId("titleStage").set("value", "");
                    registry.byId("textEditor").set("value", "<p>Add your description here.</p>");

                },
                setChangeMaskParameters: function () {
                    if (registry.byId("maskDialog") && registry.byId("changeMaskDetect").get("value") === "mask") {
                        var changeMask = "mask";
                        var modeValue = null;
                        var changeIndex = null;
                        var negativeSlider = null;
                        var threshold = null;
                        var differenceSlider = null;
                        var maskColor = wm.getWidgetById("widgets_Mask_Widget_40").color;
                        var maskSlider = registry.byId("maskSlider").get("value");
                    } else if (registry.byId("changeDetectionDialog") && registry.byId("changeMaskDetect").get("value") === "change") {
                        var changeMask = "change";
                        var modeValue = registry.byId("changeMode").get("value");
                        var changeIndex = registry.byId("changeOptions").get("value");
                        var negativeSlider = registry.byId("horiSliderDecrease").get("value");
                        var threshold = registry.byId("horiSliderInclusion").get("value");
                        var differenceSlider = registry.byId("horiSliderRight").get("value");
                        var maskColor = null;
                        var maskSlider = null;
                    }
                    var mosaicRuleResult = (this.map.getLayer("resultLayer")).mosaicRule ? registry.byId("primarySceneId").get("value") : "";
                    this.resultProperties = {renderingRule: JSON.stringify(this.map.getLayer("resultLayer").renderingRule.toJson()), mosaicRule: mosaicRuleResult, changeMask: changeMask, changeMode: modeValue, changeIndex: changeIndex, negativeSlider: negativeSlider, threshold: threshold, differenceSlider: differenceSlider, maskColor: maskColor, maskSlider: maskSlider};
                },
                onOpen: function () {
                    this.widgetClose = false;
                    domConstruct.empty(this.listAppStories);


                    if (wm.getWidgetById("_8").storyModeOn) {
                        domStyle.set("rendererInformation", "display", "none");
                        domStyle.set("dateSecondary", "display", "none");
                        domStyle.set("dateDisplay", "display", "none");

                        if (wm.getWidgetById("_8").storyId === "c2b0d6a116fb476b90afd8d92cc0174e")
                        {
                            this.map.removeLayer(this.map.getLayer(this.map.layerIds[0]));
                            this.map.setBasemap("hybrid");
                        }

                        var getItemRequest = esriRequest({
                            url: "http://www.arcgis.com/sharing/rest/content/items/" + wm.getWidgetById("_8").storyId + "/data",
                            handleAs: "json",
                            callbackParamName: "callback"
                        });
                        getItemRequest.then(lang.hitch(this, function (value) {
                            this.getItemData(value);
                            if (dom.byId("loadingStory1"))
                                domStyle.set("loadingStory1", "display", "none");
                        }), lang.hitch(this, function () {
                            var portal = new arcgisPortal.Portal("http://www.arcgis.com");
                            portal.signIn().then(lang.hitch(this, function (loggedInUser) {
                                var getItemRequest = esriRequest({
                                    url: "http://www.arcgis.com/sharing/rest/content/items/" + wm.getWidgetById("_8").storyId + "/data",
                                    handleAs: "json",
                                    callbackParamName: "callback"
                                });
                                getItemRequest.then(lang.hitch(this, function (value) {
                                    this.getItemData(value);
                                    if (dom.byId("loadingStory1"))
                                        domStyle.set("loadingStory1", "display", "none");
                                }));
                            }));

                        }));

                    } else {
                        if (wm.getWidgetById("_8").allowUserToCreateStories) {
                            domStyle.set("createStory", "display", "inline-block");
                            domStyle.set("updateStory", "display", "inline-block");
                        } else {
                            domStyle.set("createStory", "display", "none");
                            domStyle.set("updateStory", "display", "none");
                        }
                        document.getElementById("textEditor_iframe").style.height = (0.12 * window.innerWidth) + "px";

                        var getGroupRequest = esriRequest({
                            url: "http://www.arcgis.com/sharing/rest/search",
                            content: {q: "group:f09ff913ab7f4422b9cae09ade905cf7", sortField: "title", sortOrder: "asc", num: 100, f: "json"},
                            handleAs: "json",
                            callbackParamName: "callback"
                        });
                        getGroupRequest.then(lang.hitch(this, function (result) {


                            domConstruct.empty(this.listAppStories);
                            var width = parseInt(window.innerWidth * 0.156);
                            var height = parseInt(window.innerWidth * 0.02);
                            var font = parseInt(window.innerWidth * 0.008);

                            for (var a in result.results) {

                                domConstruct.place("<button class='buttonCss' data-dojo-type='dijit/form/Button' style='font-size:" + font + "px;width:" + width + "px;height:" + height + "px;display: block;' id='stories_" + a + "'>" + result.results[a].title + "</button>", this.listAppStories, a + 1);
                                on(dom.byId("stories_" + a), "click", lang.hitch(this, this.loadAppStories, result.results[a].id));

                            }
                            if (dom.byId("loadingStory1"))
                                domStyle.set("loadingStory1", "display", "none");
                            registry.byId("storyDialog").show();
                            domStyle.set("createStory", "font-size", parseInt(0.04 * width) + "px");
                            domStyle.set("updateStory", "font-size", parseInt(0.04 * width) + "px");

                            var left = (.38 * window.innerWidth);
                            domStyle.set("storyDialog", "left", left + "px");
                            domStyle.set("storyDialog", "right", "auto");
                            domStyle.set("storyDialog", "top", "110px");
                            domConstruct.destroy("storyDialog_underlay");


                        }));


                    }
                },
                getItemData: function (value) {

                    domConstruct.place("<div id='scrollPrev' data-dojo-type='dojox.layout.FloatingPane' style='top: 30px;left:0px;width: 25.5%;position: absolute;outline: none;background-color: transparent;display:none;'><div id='prevImage' style='height:50px;cursor:pointer;background: url(widgets/Story/images/prev.png);width:100%;background-position: 50% center;background-repeat: no-repeat;'></div></div>" +
                            "<div data-dojo-type='dojox.layout.FloatingPane' id = 'storyDisplay' data-dojo-props='resizable:true, dockable:true' style='top:65px;position:absolute;color: white;left: 10px;width: 25.5%;height:auto;bottom:60px;overflow-x:hidden;overflow-y:auto;'><div id ='storyPlayTitle' data-dojo-attach-point='storyPlayTitle' style='color:whitesmoke;font-size:22px;font-weight: bolder;'></div><div data-dojo-attach-point='storyPlayTitle' style='color:whitesmoke;font-size: 22px;font-weight: bolder;'>" +
                            "</div><hr><div id='storyPlaySectionTitle' data-dojo-attach-point='storyPlaySectionTitle' style='color:whitesmoke;font-size: 18px;font-weight: bolder;display:none;'>" +
                            "</div><div id='storyPlayDescription' data-dojo-attach-point='storyPlaySectionTitle'></div></div><div id='scrollNext' style='bottom:10px;left:0px;width: 25.5%;position: absolute;outline: none;background-color: transparent'>" +
                            "<div id= 'nextImage' style='height:50px;background: url(widgets/Story/images/next.png);width:100%;cursor:pointer;background-position: 50% center;background-repeat: no-repeat;'></div></div> ", "jimu-layout-manager", "after");
                    domConstruct.place('<div id="sliderStories"></div>', "jimu-layout-manager", "after");

                    var slider = new HorizontalSlider({
                        id: "sliderTransparency",
                        name: "slider",
                        value: 0,
                        minimum: 0,
                        maximum: 1,
                        intermediateChanges: true,
                        showButtons: true,
                        style: "width: 9%;right:15px;top:70px;display:none;position:absolute;",
                        onChange: lang.hitch(this, function (value) {
                            if (this.map.getLayer("resultLayer"))
                                (this.map.getLayer("resultLayer")).setOpacity(1 - registry.byId("sliderTransparency").get("value"));
                        })
                    }, "sliderStories");
                    slider.startup();
                    on(dom.byId("scrollNext"), "click", lang.hitch(this, this.moveToNextSection));
                    on(dom.byId("scrollPrev"), "click", lang.hitch(this, this.moveToPrevSection));

                    this.storyData = value;
                    dom.byId("storyPlayTitle").innerHTML = value[0].Info.title;
                    dom.byId("storyPlayDescription").innerHTML = value[0].Info.description;
                    this.setPropertiesOnLayer(value[0].Info.state);
                    this.storyIndex = 0;

                },
                moveToPrevSection: function () {

                    if (this.storyIndex > 0) {
                        this.storyIndex--;
                        domStyle.set(dom.byId("nextImage"), "background", "url(widgets/Story/images/next.png)");
                        domStyle.set(dom.byId("nextImage"), "background-repeat", "no-repeat");
                        domStyle.set(dom.byId("nextImage"), "background-position", "50%");
                        dom.byId("storyPlaySectionTitle").innerHTML = this.storyData[this.storyIndex].Info.title + "<br /><br />";

                        dom.byId("storyPlayDescription").innerHTML = this.storyData[this.storyIndex].Info.description;
                        this.setPropertiesOnLayer(this.storyData[this.storyIndex].Info.state);
                        if (this.storyIndex === 0) {
                            domStyle.set(dom.byId("scrollPrev"), "display", "none");
                            domStyle.set(dom.byId("storyPlaySectionTitle"), "display", "none");
                        } else {
                            domStyle.set(dom.byId("scrollPrev"), "display", "block");
                        }

                    }
                },
                moveToNextSection: function () {
                    if (this.storyIndex < this.storyData.length - 1) {
                        this.storyIndex++;
                        domStyle.set(dom.byId("scrollPrev"), "display", "block");
                        domStyle.set(dom.byId("storyPlaySectionTitle"), "display", "block");
                        dom.byId("storyPlaySectionTitle").innerHTML = this.storyData[this.storyIndex].Info.title + "<br /><br />";

                        dom.byId("storyPlayDescription").innerHTML = this.storyData[this.storyIndex].Info.description;
                        this.setPropertiesOnLayer(this.storyData[this.storyIndex].Info.state);
                        if (this.storyIndex === this.storyData.length - 1)
                            domStyle.set(dom.byId("nextImage"), "background", "url(widgets/Story/images/exit.png)");
                        else
                            domStyle.set(dom.byId("nextImage"), "background", "url(widgets/Story/images/next.png)");
                        domStyle.set(dom.byId("nextImage"), "background-repeat", "no-repeat");
                        domStyle.set(dom.byId("nextImage"), "background-position", "50%");
                    } else {
                        domConstruct.destroy(dom.byId("storyDisplay"));
                        domConstruct.destroy(dom.byId("scrollPrev"));
                        domConstruct.destroy(dom.byId("scrollNext"));
                        domStyle.set(document.getElementById("map"), "left", "95px");
                        domStyle.set(document.getElementById("themes_LandsatTheme_widgets_HeaderController_Widget_71"), "display", "block");
                        domStyle.set("bandCombination", "display", "block");
                        document.getElementsByClassName("icon-node")[8].click();
                        wm.getWidgetById("_8").storyModeOn = false;
                        if (wm.getWidgetById("_8").storyId === "c2b0d6a116fb476b90afd8d92cc0174e")
                        {
                            this.map.removeLayer(this.map.getLayer(this.map.layerIds[0]));
                            this.map.setBasemap("gray");
                        }

                        if (this.map.getLayer("secondaryLayer")) {
                            if (this.map.getLayer("secondaryLayer").updating) {
                                this.map.getLayer("secondaryLayer").suspend();
                            }
                            this.map.removeLayer(this.map.getLayer("secondaryLayer"));
                        }
                        if (this.map.getLayer("resultLayer")) {
                            if (this.map.getLayer("resultLayer").updating) {
                                this.map.getLayer("resultLayer").suspend();
                            }
                            this.map.removeLayer(this.map.getLayer("resultLayer"));
                        }
                        var primaryLayer = this.map.getLayer("primaryLayer");
                        primaryLayer.setBandIds([], true);
                        primaryLayer.setMosaicRule(new MosaicRule({"mosaicMethod": "esriMosaicAttribute", "sortField": "Best", "sortValue": 0, "ascending": true, "mosaicOperation": "MT_FIRST"}), true);
                        primaryLayer.setRenderingRule(new RasterFunction({"rasterFunction": "Agriculture with DRA"}), false);
                        domStyle.set("rendererInformation", "display", "block");
                        domStyle.set("dateSecondary", "display", "block");
                        domStyle.set("dateDisplay", "display", "block");
                    }
                },
                closeWidgets: function (value) {
                    var x = document.getElementsByClassName("icon-node");
                    if (domClass.contains(x[10], "jimu-state-selected"))
                        pm.closePanel("_22_panel");
                    else if (domClass.contains(x[5], "jimu-state-selected"))
                        pm.closePanel("_70_panel");
                    else if (domClass.contains(x[9], "jimu-state-selected"))
                        pm.closePanel("_50_panel");
                    else if (domClass.contains(x[7], "jimu-state-selected"))
                        pm.closePanel("_19_panel");
                    else if (registry.byId("saveDialog") && registry.byId("saveDialog").open)
                        pm.closePanel("_20_panel");
                    else if (domClass.contains(x[4], "jimu-state-selected"))
                        pm.closePanel("widgets_Identify_Widget_14_panel");
                    if (domClass.contains(x[1], "jimu-state-selected"))
                        x[1].click();
                    if (domClass.contains(x[2], "jimu-state-selected") || (registry.byId("maskDialog") && registry.byId("maskDialog").open) || (dom.byId("minimizeButton") && domStyle.get("minimizeButton", "display") === "block"))
                        x[2].click();
                    else if (domClass.contains(x[3], "jimu-state-selected") || registry.byId("changeDetectionDialog") && registry.byId("changeDetectionDialog").open || (dom.byId("minimizeChange") && domStyle.get("minimizeChange", "display") === "block"))
                        x[3].click();
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
                    if (value) {
                        if (registry.byId("bandComboList").get("value") !== "Agriculture with DRA")
                            registry.byId("bandComboList").set("value", "Agriculture with DRA");
                        if (registry.byId("changeMode"))
                            registry.byId("changeMode").set("value", "Image");
                    }
                },
                timebook: function ()
                {
                    if (wm.getWidgetById("_8").storyModeOn) {
                        var getLayerProperties = this.map.getLayer("primaryLayer");
                        var getLayerProperties2 = this.map.getLayer("secondaryLayer");
                        if (getLayerProperties) {
                            var getDate = new esriRequest({
                                url: getLayerProperties.url + "/getSamples",
                                content: {
                                    geometry: JSON.stringify(this.map.extent.getCenter()),
                                    geometryType: "esriGeometryPoint",
                                    returnGeometry: false,
                                    sampleCount: 1,
                                    mosaicRule: getLayerProperties.mosaicRule ? JSON.stringify(getLayerProperties.mosaicRule.toJson()) : "",
                                    outFields: "AcquisitionDate",
                                    f: "json"
                                },
                                handleAs: "json",
                                callbackParamName: "callback"
                            });

                            getDate.then(lang.hitch(this, function (result) {
                                if (result.samples && result.samples[0].attributes.AcquisitionDate) {
                                    dom.byId("dateDisplay").innerHTML = "&nbsp;&nbsp;&nbsp;Imagery Date:&nbsp;" + locale.format(new Date(result.samples[0].attributes.AcquisitionDate), {selector: "date", formatLength: "long"});
                                }
                            }), lang.hitch(this, function () {

                            }));

                        }
                        if (getLayerProperties2) {
                            var getDate = new esriRequest({
                                url: getLayerProperties2.url + "/getSamples",
                                content: {
                                    geometry: JSON.stringify(this.map.extent.getCenter()),
                                    geometryType: "esriGeometryPoint",
                                    returnGeometry: false,
                                    sampleCount: 1,
                                    mosaicRule: JSON.stringify(getLayerProperties2.mosaicRule.toJson()),
                                    outFields: "AcquisitionDate",
                                    f: "json"
                                },
                                handleAs: "json",
                                callbackParamName: "callback"
                            });

                            getDate.then(lang.hitch(this, function (result1) {
                                if (result1.samples && result1.samples[0].attributes.AcquisitionDate) {
                                    dom.byId("dateSecondary").innerHTML = "&nbsp;&nbsp;Comparison Date:&nbsp;" + locale.format(new Date(result1.samples[0].attributes.AcquisitionDate), {selector: "date", formatLength: "long"});
                                }
                            }), lang.hitch(this, function () {

                            }));

                        }
                    }

                },
                onClose: function () {
                    this.widgetClose = true;
                    if (registry.byId("addUpdateDialog").open)
                        ;
                    registry.byId("addUpdateDialog").hide();
                    if (registry.byId("storyDialog").open)
                        registry.byId("storyDialog").hide();
                    domStyle.set("firstStage", "display", "block");
                    domStyle.set("defineSteps", "display", "none");
                    domStyle.set("storyTitle", "display", "none");
                    domStyle.set("addOrganize", "display", "none");
                    domStyle.set("finalStoryLink", "display", "none");
                    domStyle.set("editSectionList", "display", "none");
                    this.closeWidgets(true);
                    this.arrayLinks = [];
                    registry.byId("titleStep").set("value", "");
                    registry.byId("titleStage").set("value", "");
                    registry.byId("textEditor").set("value", "<p>Add your description here.</p>");

                    domConstruct.empty("editSectionList");
                    domConstruct.empty("organizeList");
                    domConstruct.empty("updateStoryLink");

                    domStyle.set("updateStoryLink", "height", "0px");
                    domStyle.set("organizeList", "height", "0px");
                    domStyle.set("editSectionList", "height", "0px");

                    if (dom.byId("sliderTransparency"))
                        domStyle.set(dom.byId("sliderTransparency"), "display", "none");

                    if (domStyle.get("createStory", "display") !== "none") {
                        domStyle.set("storyDialog", "left", (0.38 * 1920) + "px");
                        domStyle.set("storyDialog", "right", "auto");
                        domStyle.set("storyDialog", "top", "110px");
                    }
                },
                showLoading: function () {
                    if (dom.byId("loadingStory"))
                        domStyle.set("loadingStory", "display", "block");
                },
                hideLoading: function () {
                    if (dom.byId("loadingStory"))
                        domStyle.set("loadingStory", "display", "none");
                }


            });
            clazz.hasLocale = false;
            return clazz;
        });
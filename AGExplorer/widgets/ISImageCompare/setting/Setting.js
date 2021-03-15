///////////////////////////////////////////////////////////////////////////
// Copyright © 2016 Esri. All Rights Reserved.
//
// Licensed under the Apache License Version 2.0 (the "License");
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
    'dojo/dom',
    'dojo/dom-construct',
    'dojo/dom-style',
    'dijit/registry',
    'jimu/BaseWidgetSetting',
    'dijit/_WidgetsInTemplateMixin',
    'dijit/form/Select',
    "dijit/form/NumberSpinner",
    "dijit/form/CheckBox",
    "dojo/_base/lang",
    "dojo/on",
    'dojo/html',
],
    function (
        declare,
        dom,
        domConstruct,
        domStyle,
        registry,
        BaseWidgetSetting,
        _WidgetsInTemplateMixin,
        Select,
        NumberSpinner,
        CheckBox,
        lang,
        on,
        html) {
        return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {
            baseClass: 'jimu-widget-ISImageViewer-setting',
            ISLayers: [],
            bandNames: [],
            selectedLayers: [],
            requestFlag: true,
            worldImagery: "https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer",

            startup: function () {
                this.inherited(arguments);
                domConstruct.place('<img id="loadingImageSelectorSetting" style="position: absolute;top:0;bottom: 0;left: 0;right: 0;margin:auto;z-index:100;" src="' + require.toUrl('jimu') + '/images/loading.gif">', this.domNode);
                domStyle.set("loadingImageSelectorSetting", 'display', 'none');
                this.populatePage();
                this.setConfig(this.config);
            },

            postCreate: function () {
                this.inherited(arguments);
                var i = 0, j = 0;
                for (var a in this.map.itemInfo.itemData.operationalLayers) {
                    if (this.map.itemInfo.itemData.operationalLayers[a].layerType === 'ArcGISImageServiceLayer' ||
                        this.map.itemInfo.itemData.operationalLayers[a].layerType === 'ArcGISTiledImageServiceLayer' ||
                        (this.map.getLayer(this.map.itemInfo.itemData.operationalLayers[a].id).serviceDataType &&
                            this.map.getLayer(this.map.itemInfo.itemData.operationalLayers[a].id).serviceDataType.substr(0, 16) === "esriImageService") ||
                        this.map.itemInfo.itemData.operationalLayers[a].url.toLowerCase() === this.worldImagery.toLowerCase()) {
                        var title = this.map.itemInfo.itemData.operationalLayers[a].title ? this.map.itemInfo.itemData.operationalLayers[a].title : "";
                        if ((title.charAt(title.length - 1)) !== "_") {//if(!((title.toLowerCase()).includes("_result"))){
                            this.ISLayers[i] = this.map.getLayer(this.map.itemInfo.itemData.operationalLayers[a].id);
                            // while (this.map.itemInfo.itemData.operationalLayers[j] && this.map.itemInfo.itemData.operationalLayers[j].url !== this.ISLayers[i].url) {
                            //     j++;
                            // }
                            if (title !== "") {
                                this.ISLayers[i].title = title;
                            }
                            else if (this.map.getLayer(this.map.itemInfo.itemData.operationalLayers[a].id).name) {
                                this.ISLayers[i].title = this.map.getLayer(this.map.itemInfo.itemData.operationalLayers[a].id).name;
                            } else if (this.map.getLayer(this.map.itemInfo.itemData.operationalLayers[a].id).id) {
                                this.ISLayers[i].title = this.map.getLayer(this.map.itemInfo.itemData.operationalLayers[a].id).id;
                            } else {
                                this.ISLayers[i].title = "Layer" + i;
                            }
                            i++;
                        }
                    }
                }
                if (registry.byId("defaultLayer").options.length > 0) {
                    for (var i = 0; i < registry.byId("defaultLayer").options.length; i++) {
                        registry.byId("defaultLayer").removeOption(registry.byId("defaultLayer").getOptions());
                    }
                }
                if (registry.byId("secondaryLayer").options.length > 0) {
                    for (var i = 0; i < registry.byId("secondaryLayer").options.length; i++) {
                        registry.byId("secondaryLayer").removeOption(registry.byId("secondaryLayer").getOptions());
                    }
                }
                registry.byId("defaultLayer").addOption({ label: "Basemap", value: "none" });
                registry.byId("secondaryLayer").addOption({ label: "Basemap", value: "none" });
                for (var i in this.ISLayers) {
                    registry.byId("defaultLayer").addOption({ label: this.ISLayers[i].title, value: this.ISLayers[i].id });
                    registry.byId("secondaryLayer").addOption({ label: this.ISLayers[i].title, value: this.ISLayers[i].id });
                }

                this.doubleViewerSelector.on("click", lang.hitch(this, function () {
                    domStyle.set(dom.byId("doubleSelective"), "display", "");
                    html.set(dom.byId("defLayer"), this.nls.leftLayer + ":");
                }));
                this.singleViewerSelector.on("click", lang.hitch(this, function () {
                    domStyle.set(dom.byId("doubleSelective"), "display", "none");
                    html.set(dom.byId("defLayer"), this.nls.defaultLayer + ":");
                }));
            },

            populatePage: function () {
                for (var a in this.ISLayers) {
                    if (this.ISLayers[a].id !== "World_Imagery_9153") {
                        var layerSetting = domConstruct.create("tbody", {
                            innerHTML: '<tr><td colspan="3" style="padding-left: 100px; padding-top: 20px;"><input type="checkbox" id="layerCheck_' + a + '">' + this.ISLayers[a].title + ' - </td></tr>' +
                                '<tr style="display:none;"><td class="first" style="width: 70px!important; padding-left: 50px!important;">Object ID</td><td class="second">' +
                                '<select id="objectID_' + a + '"></select>' +
                                '</td></tr>' + '<tr><td class="first" style="width: 70px!important; padding-left: 50px!important;">Select using</td><td class="second">' +
                                '<select id="imageField_' + a + '"></select>' +
                                '</td></tr>' + '<tr style="display:none;"><td class="first" style="width: 70px!important; padding-left: 50px!important;">Category</td><td class="second">' +
                                '<select id="category_' + a + '"></select>' +
                                '</td></tr>'
                        });
                        domConstruct.place(layerSetting, dom.byId("setting-table"));
                        var imageField = new Select({
                            style: "margin:10px;",
                            disabled: true
                        }, "imageField_" + a).startup();
                        var objectID = new Select({
                            style: "margin:10px;"
                        }, "objectID_" + a).startup();
                        var category = new Select({
                            style: "margin:10px;"
                        }, "category_" + a).startup();
                        var layerCheck = new CheckBox({
                            value: this.ISLayers[a].title,
                            onChange: lang.hitch(this, function (value) {
                                for (a in this.ISLayers) {
                                    if (this.ISLayers[a].id !== "World_Imagery_9153") {
                                        if (registry.byId("layerCheck_" + a).checked) {
                                            registry.byId("imageField_" + a).set("disabled", false);
                                        } else if (!registry.byId("layerCheck_" + a).checked) {
                                            registry.byId("imageField_" + a).set("disabled", true);
                                        }
                                    }
                                }
                            })
                        }, "layerCheck_" + a).startup();
                    }
                }
                this.setValues();
            },

            setValues: function () {

                for (var a = 0; a < this.ISLayers.length; a++) {
                    if (this.ISLayers[a].id !== "World_Imagery_9153") {
                        this._populateDropDown(registry.byId("imageField_" + a), this.ISLayers[a].fields, "", new RegExp(/acq[a-z]*[_]?Date/i));
                        this._populateDropDown(registry.byId("objectID_" + a), this.ISLayers[a].fields, "esriFieldTypeOID", new RegExp(/O[a-z]*[_]?ID/i));
                        this._populateDropDown(registry.byId("category_" + a), this.ISLayers[a].fields, "esriFieldTypeInteger", new RegExp(/C[a-z]*/i));
                    }
                }
            },

            _populateDropDown: function (node, fields, dataType, regExpr) {
                var options = [{ "label": "Select field", "value": "" }];
                var j = 1;
                var initialVal = "";
                if (fields) {
                    for (var i in fields) {
                        if (fields[i].type === dataType || !dataType) {
                            options[j] = { "label": fields[i].name, "value": fields[i].name };
                            var str = fields[i].name;
                            if (initialVal === "" && regExpr.test(str)) {
                                initialVal = str;
                            }
                            j++;
                        }
                    }
                }
                node.addOption(options);
                node.set('value', initialVal);
            },

            setConfig: function (config) {
                this.config = config;
                registry.byId("userInterfaceOption").set("value", this.config.display);
                this.selectorZoomLevelInput.set("value", this.config.zoomLevel);
                this.selectorSearchExtentInput.set("value", this.config.searchExtent);
                this.listImagesSeparate.set("checked", !this.config.distinctImages);
                this.selectorAutoRefresh.set("checked", this.config.autoRefresh);
                this.selectorShowFootprint.set("checked", this.config.showFootprint);
                this.selectorShowRange.set("checked", this.config.showRange);
                this.selectorShowRendering.set("checked", this.config.showRendering);
                registry.byId("defaultLayer").set("checked", this.config.defaultLayer);

                if (this.config.viewerType === "single") {
                    this.singleViewerSelector.set("checked", true);
                    this.doubleViewerSelector.set("checked", false);
                    domStyle.set(dom.byId("doubleSelective"), "display", "none");
                    html.set(dom.byId("defLayer"), this.nls.defaultLayer + ":");
                }
                else if (this.config.viewerType === "double") {
                    this.doubleViewerSelector.set("checked", true);
                    this.singleViewerSelector.set("checked", false);
                    registry.byId("secondaryLayer").value = this.config.comparisonLayer;
                    domStyle.set(dom.byId("doubleSelective"), "display", "");
                    html.set(dom.byId("defLayer"), this.nls.leftLayer + ":");
                }

                for (var a in this.ISLayers) {
                    if (this.ISLayers[a].id !== "World_Imagery_9153") {                        
                        if (config.operationalLayers.length > 0) {
                            if (config.operationalLayers[a].id !== "World_Imagery_9153") {
                                if (config.operationalLayers[a].imageSelector) {
                                    registry.byId("imageField_" + a).set("disabled", false);
                                    registry.byId("layerCheck_" + a).set("checked", true);
                                }
                                else if (!config.operationalLayers[a].imageSelector) {
                                    registry.byId("imageField_" + a).set("disabled", true);
                                    registry.byId("layerCheck_" + a).set("checked", false);
                                }
                                if (config.operationalLayers[a].imageField !== undefined) {
                                    registry.byId("imageField_" + a).set('value', config.operationalLayers[a].imageField);
                                }
                                if (config.operationalLayers[a].objectID !== undefined) {
                                    registry.byId("objectID_" + a).set('value', config.operationalLayers[a].objectID);
                                }
                                if (config.operationalLayers[a].catgory !== undefined) {
                                    registry.byId("category_" + a).set('value', config.operationalLayers[a].category);
                                }
                            }
                        }
                    }
                }
            },

            getConfig: function () {
                this.config.operationalLayers = [];
                for (var a in this.ISLayers) {
                    if (this.ISLayers[a].id !== "World_Imagery_9153") {
                        var obj = {
                            id: this.ISLayers[a].id,
                            imageField: registry.byId("imageField_" + a).get('value'),
                            objectID: registry.byId("objectID_" + a).get('value'),
                            category: registry.byId("category_" + a).get('value'),
                            title: this.ISLayers[a].title,
                            imageSelector: registry.byId("layerCheck_" + a).checked
                        };
                        this.config.operationalLayers.push(obj);
                    } else {
                        var obj = {
                            id: this.ISLayers[a].id,
                            title: this.ISLayers[a].title
                        };
                        this.config.operationalLayers.push(obj);
                    }
                }
                if (this.singleViewerSelector.checked) {
                    this.config.viewerType = "single";
                    this.config.comparisonLayer = null;
                }
                else if (this.doubleViewerSelector.checked) {
                    this.config.viewerType = "double";
                    this.config.comparisonLayer = registry.byId("secondaryLayer").get("value");
                }
                this.config.display = registry.byId("userInterfaceOption").get("value");
                this.config.zoomLevel = this.selectorZoomLevelInput.get("value");
                this.config.searchExtent = this.selectorSearchExtentInput.get("value");
                this.config.distinctImages = !this.listImagesSeparate.get("checked");
                this.config.autoRefresh = this.selectorAutoRefresh.get("checked");
                this.config.showFootprint = this.selectorShowFootprint.get("checked");
                this.config.showRange = this.selectorShowRange.get("checked");
                this.config.showRendering = this.selectorShowRendering.get("checked");
                this.config.defaultLayer = registry.byId("defaultLayer").get("value");

                return this.config;
            },

        });
    });
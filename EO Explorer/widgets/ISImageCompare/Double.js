///////////////////////////////////////////////////////////////////////////
// Copyright 2018 Esri. All Rights Reserved.
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
    'jimu/BaseWidget',
    "jimu/PanelManager",
    "jimu/WidgetManager",
    'dijit/_WidgetsInTemplateMixin',
    'dijit/_TemplatedMixin',
    'dojo/text!./Widget.html',
    "esri/IdentityManager",
    "./Change",
    'dijit/registry',
    'dojo/_base/lang',
    "dojo/Evented",
    'dojo/html',
    'dojo/dom-class',
    'dojo/dom',
    'esri/layers/MosaicRule',
    'esri/tasks/query',
    'esri/tasks/QueryTask',
    'esri/geometry/Extent',
    'dojo/date/locale',
    'dojo/dom-construct',
    'dijit/form/HorizontalSlider',
    'dijit/form/HorizontalRule',
    'dijit/form/HorizontalRuleLabels',
    'esri/graphic',
    'esri/symbols/SimpleLineSymbol',
    'esri/symbols/SimpleFillSymbol',
    'esri/Color',
    'esri/InfoTemplate',
    'esri/geometry/mathUtils',
    'dojo/dom-style',
    'esri/layers/ArcGISImageServiceLayer',
    "esri/layers/ArcGISTiledMapServiceLayer",
    'esri/layers/ImageServiceParameters',
    'esri/tasks/ImageServiceIdentifyTask',
    'esri/tasks/ImageServiceIdentifyParameters',
    'esri/layers/RasterFunction',
    'esri/geometry/Polygon',
    'esri/geometry/Point',
    'esri/request',
    'dijit/Tooltip',
    "esri/dijit/LayerSwipe",
    'dijit/form/Select',
    'dijit/form/Button',
    'dijit/form/NumberSpinner',
    'dijit/form/CheckBox',
    'dijit/form/TextBox',
    'dijit/form/DropDownButton',
    'dijit/TooltipDialog',
    'dijit/form/RadioButton',
    "dojo/domReady!"
],
    function (declare, BaseWidget, PanelManager, WidgetManager, _WidgetsInTemplateMixin, _TemplatedMixin, template, IdentityManager, Change, registry, lang, Evented, html, domClass, dom, MosaicRule, Query, QueryTask, Extent, locale, domConstruct,
        HorizontalSlider, HorizontalRule, HorizontalRuleLabels, Graphic, SimpleLineSymbol, SimpleFillSymbol, Color, InfoTemplate, mathUtils, domStyle, ArcGISImageServiceLayer, ArcGISTiledMapServiceLayer,
        ImageServiceParameters, ImageServiceIdentifyTask, ImageServiceIdentifyParameters, RasterFunction, Polygon, Point, esriRequest, Tooltip, LayerSwipe) {

        var pm = PanelManager.getInstance();
        var wm = WidgetManager.getInstance();
        return declare([BaseWidget, Evented, _TemplatedMixin], {

            constructor: function (parameters) {
                var defaults = {
                    map: null,
                    config: null,
                    nls: null,
                    mainConfig: null

                };
                lang.mixin(this, defaults, parameters);
            },

            templateString: template,
            primaryLayer: null,
            secondaryLayer: null,
            primaryLayerLeft: null,
            secondaryLayerRight: null,
            orderedDates: null,
            sliderRules: null,
            sliderLabels: null,
            slider: null,
            features: null,
            sliderValue: null,
            featureIds: [],
            responseAlert: false,
            defaultMosaicRule: null,
            mapZoomFactor: 2.0,
            previousValue: null,
            mapWidthPanFactor: 0.75,
            previousLayerInfo: { primary: { id: null, mosaicRule: null }, secondary: { id: null, mosaicRule: null } },
            swipePosition: null,
            displayModeFlagLeft: 0,
            displayModeFlagRight: 0,
            securityFlag: false,

            startup: function () {
                this.inherited(arguments);

            },

            postCreate: function () {
                var widgetId = this.mainConfig.id;
                var widgetPane = wm.getWidgetById(widgetId);
                var panelId = widgetId + "_panel";
                this.panel = pm.getPanelById(panelId);
                this.inherited(arguments);
                domConstruct.place('<img id="loadingLayerCompare" style="position: absolute;top:0;bottom: 0;left: 0;right: 0;margin:auto;z-index:100;" src="./widgets/ISImageCompare/images/loading1.gif">', document.getElementById("compareWidget"));
                domStyle.set("loadingLayerCompare", "display", "none");
                console.log('postCreate');

                this.layerInfos = [];
                for (var i in this.config.operationalLayers) {
                    this.layerInfos[this.config.operationalLayers[i].id] = this.config.operationalLayers[i];
                }

                registry.byId("dropDownImageListLeft").on("click", lang.hitch(this, this.imageDisplayFormat));
                registry.byId("dropDownImageListRight").on("click", lang.hitch(this, this.imageDisplayFormatRight));
                registry.byId("leftLayerRenderer").on("change", lang.hitch(this, this.setRenderingRule));
                registry.byId("rightLayerRenderer").on("change", lang.hitch(this, this.setRenderingRuleRight));
                registry.byId("imageSelectorDropDownLeft").on("change", lang.hitch(this, this.sliderDropDownSelection, "dropDown"));
                registry.byId("imageSelectorDropDownRight").on("change", lang.hitch(this, this.sliderDropDownSelectionRight, "dropDown"));

                registry.byId("refreshImageSliderBtnLeft").on("click", lang.hitch(this, this.imageSliderRefresh));
                registry.byId("refreshImageSliderBtnRight").on("click", lang.hitch(this, this.imageSliderRefreshRight));
                registry.byId("cloudFilterLeft").on("change", lang.hitch(this, this.imageSliderRefresh));
                registry.byId("cloudFilterRight").on("change", lang.hitch(this, this.imageSliderRefreshRight));
                registry.byId("imageSelectorLeft").on("change", lang.hitch(this, this.setFilterDiv));
                registry.byId("imageSelectorRight").on("change", lang.hitch(this, this.setFilterDivRight));
                registry.byId("leftLayerSelector").on("change", lang.hitch(this, this.selectLeftLayer));
                registry.byId("rightLayerSelector").on("change", lang.hitch(this, this.selectRightLayer));

                registry.byId("leftLayer").on("click", lang.hitch(this, function () {
                    if (registry.byId("leftLayerSelector").get("value") === "MS_696") {
                        if (this.config.renderInfo.landsat[registry.byId("leftLayerRenderer").value]) {
                            html.set(dom.byId("renderDescriptionCompare"), this.config.renderInfo.landsat[registry.byId("leftLayerRenderer").value].description);
                        } else {
                            html.set(dom.byId("renderDescriptionCompare"), 'Spectral Index RFT applied as a rendering rule.');
                        }
                        html.set(dom.byId("sensorDescriptionCompare"), "Landsat 8 OLI, 30m multispectral and multitemporal 8-band imagery, with on-the-fly renderings and indices. Additional Landsat services can be found <a href='https://www.arcgis.com/home/group.html?id=a74dff13f1be4b2ba7264c3315c57077#overview' target='_blank'>here</a>");
                    } else if (registry.byId("leftLayerSelector").get("value") === "Sentinel2_2553") {
                        if (this.config.renderInfo.sentinel[registry.byId("leftLayerRenderer").value]) {
                            html.set(dom.byId("renderDescriptionCompare"), this.config.renderInfo.sentinel[registry.byId("leftLayerRenderer").value].description);
                        } else {
                            html.set(dom.byId("renderDescriptionCompare"), 'Spectral Index RFT applied as a rendering rule.');
                        }
                        html.set(dom.byId("sensorDescriptionCompare"), "Sentinel-2, 10m Multispectral, Multitemporal, 13-band images with visual renderings and indices. - <a href='https://www.arcgis.com/home/item.html?id=fd61b9e0c69c4e14bebd50a9a968348c' target='_blank'>Find here</a>");
                    } else {
                        html.set(dom.byId("renderDescriptionCompare"), "Basemap");
                        html.set(dom.byId("sensorDescriptionCompare"), "Basemap");
                    }

                    if (this.layerSwipe) {
                        // if (this.panel) {
                        if ((document.getElementById("Compare Imagery").offsetLeft + document.getElementById("Compare Imagery").clientWidth) < (this.map.width - 40)) {
                            this.moveSwipe(this.map.width - 40, this.layerSwipe.invertPlacement, this.layerSwipe.layers);
                        }
                        else if (document.getElementById("Compare Imagery").offsetLeft < (this.map.width - 40) &&
                            (document.getElementById("Compare Imagery").offsetLeft + document.getElementById("Compare Imagery").clientWidth) > (this.map.width - 40)) {
                            this.moveSwipe(this.map.width - document.getElementById("Compare Imagery").clientWidth - 40, this.layerSwipe.invertPlacement, this.layerSwipe.layers);
                        } else {
                            this.moveSwipe(this.map.width - 40, this.layerSwipe.invertPlacement, this.layerSwipe.layers);
                        }
                    }

                    domStyle.set("rightLayerDiv", "display", "none");
                    domStyle.set("leftLayerDiv", "display", "block");
                    this.currentLayerProp = registry.byId("leftLayerSelector").get("value") !== "none" ? this.leftLayerInfos[registry.byId("leftLayerSelector").get("value")] : null;
                }));

                registry.byId("rightLayer").on("click", lang.hitch(this, function () {
                    if (registry.byId("rightLayerSelector").get("value") === "MS_696") {
                        if (this.config.renderInfo.landsat[registry.byId("rightLayerRenderer").value]) {
                            html.set(dom.byId("renderDescriptionCompare"), this.config.renderInfo.landsat[registry.byId("rightLayerRenderer").value].description);
                        } else {
                            html.set(dom.byId("renderDescriptionCompare"), 'Spectral Index RFT applied as a rendering rule.');
                        }
                        html.set(dom.byId("sensorDescriptionCompare"), "Landsat 8 OLI, 30m multispectral and multitemporal 8-band imagery, with on-the-fly renderings and indices. Additional Landsat services can be found <a href='https://www.arcgis.com/home/group.html?id=a74dff13f1be4b2ba7264c3315c57077#overview' target='_blank'>here</a>");
                    } else if (registry.byId("rightLayerSelector").get("value") === "Sentinel2_2553") {
                        if (this.config.renderInfo.sentinel[registry.byId("rightLayerRenderer").value]) {
                            html.set(dom.byId("renderDescriptionCompare"), this.config.renderInfo.sentinel[registry.byId("rightLayerRenderer").value].description);
                        } else {
                            html.set(dom.byId("renderDescriptionCompare"), 'Spectral Index RFT applied as a rendering rule.');
                        }
                        html.set(dom.byId("sensorDescriptionCompare"), "Sentinel-2, 10m Multispectral, Multitemporal, 13-band images with visual renderings and indices. - <a href='https://www.arcgis.com/home/item.html?id=fd61b9e0c69c4e14bebd50a9a968348c' target='_blank'>Find here</a>");
                    } else {
                        html.set(dom.byId("renderDescriptionCompare"), "Basemap");
                        html.set(dom.byId("sensorDescriptionCompare"), "Basemap");
                    }

                    if (this.layerSwipe) {
                        // if (this.panel) {
                        if (document.getElementById("Compare Imagery").offsetLeft > 40) {
                            this.moveSwipe(40, this.layerSwipe.invertPlacement, this.layerSwipe.layers);
                        }
                        else if (document.getElementById("Compare Imagery").offsetLeft < 40 &&
                            (document.getElementById("Compare Imagery").offsetLeft + document.getElementById("Compare Imagery").clientWidth) > 40) {
                            this.moveSwipe(document.getElementById("Compare Imagery").clientWidth + 40, this.layerSwipe.invertPlacement, this.layerSwipe.layers);
                        } else {
                            this.moveSwipe(40, this.layerSwipe.invertPlacement, this.layerSwipe.layers);
                        }
                    }

                    domStyle.set("leftLayerDiv", "display", "none");
                    domStyle.set("rightLayerDiv", "display", "block");
                    this.currentLayerPropRight = registry.byId("rightLayerSelector").get("value") !== "none" ? this.rightLayerInfos[registry.byId("rightLayerSelector").get("value")] : null;
                }));
                this.fillLayerSelector();
                this.primaryLayer = this.map.primaryLayer;
                if (!this.dateLeft) {
                    this.timebook("left");
                } else if (this.dateLeft) {
                    if (registry.byId("leftLayerSelector").value === "MS_696") {
                        dom.byId("dateDisplay").innerHTML = "Landsat - &nbsp;&nbsp;" + locale.format(new Date(this.dateLeft), { selector: "date", formatLength: "long" });
                    } else if (registry.byId("leftLayerSelector").value === "Sentinel2_2553") {
                        dom.byId("dateDisplay").innerHTML = "Sentinel 2 - &nbsp;&nbsp;" + locale.format(new Date(this.dateLeft), { selector: "date", formatLength: "long" });
                    } else {
                        dom.byId("dateDisplay").innerHTML = "Basemap";
                    }
                }
                if (!this.dateRight) {
                    this.timebook("right");
                } else if (this.dateRight) {
                    if (registry.byId("rightLayerSelector").value === "MS_696") {
                        dom.byId("compDisplay").innerHTML = "&nbsp;&nbsp; Compared with - Landsat - &nbsp;&nbsp;" + locale.format(new Date(this.dateRight), { selector: "date", formatLength: "long" });
                    } else if (registry.byId("rightLayerSelector").value === "Sentinel2_2553") {
                        dom.byId("compDisplay").innerHTML = "&nbsp;&nbsp; Compared with - Sentinel 2 - &nbsp;&nbsp;" + locale.format(new Date(this.dateRight), { selector: "date", formatLength: "long" });
                    } else {
                        dom.byId("compDisplay").innerHTML = "&nbsp;&nbsp; Compared with - Basemap";
                    }
                }
                this.changeDetection = new Change({ map: this.map, config: this.config, layers: this.layerInfos, nls: this.nls, mainConfig: this });
                if (this.map) {

                    this.map.on("update-start", lang.hitch(this, this.showLoading));
                    this.map.on("update-end", lang.hitch(this, this.hideLoading));
                    this.addLayerHandler = this.map.on("layer-add", lang.hitch(this, function (response) {
                        if (response.layer.id !== "Sentinel2_2553") {
                            this.currentLayerPropRight = this.rightLayerInfos[registry.byId("rightLayerSelector").get("value")];
                            this.checkLayerPropRight();
                        }
                    }));
                }
                this.setTooltips();
                //this.resizeBtn();

                var layer;
                for (var a in this.map.layerIds) {
                    layer = this.map.getLayer(this.map.layerIds[a]);
                    if ((layer.type && layer.type === 'ArcGISImageServiceLayer') || (layer.serviceDataType && layer.serviceDataType.substr(0, 16) === "esriImageService")) {
                        this.secondaryLayerIndex = 1;
                        break;
                    }
                }
                for (var a in this.layerInfos) {
                    if (a === this.config.comparisonLayer) {
                        this.map.getLayer(a).hide();
                        break;
                    }
                }
                if (this.config.comparisonLayer) {
                    registry.byId("rightLayerSelector").set("value", this.config.comparisonLayer);

                }

                if (this.config.defaultLayer) {
                    registry.byId("leftLayerSelector").set("value", this.config.defaultLayer);

                }

                setTimeout(lang.hitch(this, function () {
                    this.refreshSwipe();
                }), 500);

                document.getElementById("renderingInfoLeft").addEventListener("click", lang.hitch(this, function () {
                    if (!registry.byId("rendererInfoDialogCompare").open) {
                        registry.byId("rendererInfoDialogCompare").show();
                        domStyle.set("rendererInfoDialogCompare", "top", "110px");
                        if (!window.appInfo.isRunInMobile) {
                            domStyle.set("rendererInfoDialogCompare", "left", 170 + document.getElementById("Compare Imagery").offsetWidth + "px");
                        } else {
                            domStyle.set("rendererInfoDialogCompare", "left", "20vw");
                        }
                    } else {
                        registry.byId("rendererInfoDialogCompare").hide();
                    }
                    if (registry.byId("sensorInfoDialogCompare").open) {
                        registry.byId("sensorInfoDialogCompare").hide();
                    }
                }));
                document.getElementById("renderingInfoRight").addEventListener("click", lang.hitch(this, function () {
                    if (!registry.byId("rendererInfoDialogCompare").open) {
                        registry.byId("rendererInfoDialogCompare").show();
                        domStyle.set("rendererInfoDialogCompare", "top", "110px");
                        if (!window.appInfo.isRunInMobile) {
                            domStyle.set("rendererInfoDialogCompare", "left", 170 + document.getElementById("Compare Imagery").offsetWidth + "px");
                        } else {
                            domStyle.set("rendererInfoDialogCompare", "left", "20vw");
                        }
                    } else {
                        registry.byId("rendererInfoDialogCompare").hide();
                    }
                    if (registry.byId("sensorInfoDialogCompare").open) {
                        registry.byId("sensorInfoDialogCompare").hide();
                    }
                }));

                document.getElementById("sensorInfoLeft").addEventListener("click", lang.hitch(this, function () {
                    if (!registry.byId("sensorInfoDialogCompare").open) {
                        registry.byId("sensorInfoDialogCompare").show();
                        domStyle.set("sensorInfoDialogCompare", "top", "110px");
                        if (!window.appInfo.isRunInMobile) {
                            domStyle.set("sensorInfoDialogCompare", "left", 170 + document.getElementById("Compare Imagery").offsetWidth + "px");
                        } else {
                            domStyle.set("sensorInfoDialogCompare", "left", "20vw");
                        }
                    } else {
                        registry.byId("sensorInfoDialogCompare").hide();
                    }
                    if (registry.byId("rendererInfoDialogCompare").open) {
                        registry.byId("rendererInfoDialogCompare").hide();
                    }
                }));

                document.getElementById("sensorInfoRight").addEventListener("click", lang.hitch(this, function () {
                    if (!registry.byId("sensorInfoDialogCompare").open) {
                        registry.byId("sensorInfoDialogCompare").show();
                        domStyle.set("sensorInfoDialogCompare", "top", "110px");
                        if (!window.appInfo.isRunInMobile) {
                            domStyle.set("sensorInfoDialogCompare", "left", 170 + document.getElementById("Compare Imagery").offsetWidth + "px");
                        } else {
                            domStyle.set("sensorInfoDialogCompare", "left", "20vw");
                        }
                    } else {
                        registry.byId("sensorInfoDialogCompare").hide();
                    }
                    if (registry.byId("rendererInfoDialogCompare").open) {
                        registry.byId("rendererInfoDialogCompare").hide();
                    }
                }));

                document.getElementById("swapLayerIcon").addEventListener("click", lang.hitch(this, function () {
                    if (dom.byId("leftLayerSelector") && dom.byId("rightLayerSelector")) {
                        if (registry.byId("leftLayerSelector").value !== registry.byId("rightLayerSelector").value) {
                            var temp1 = registry.byId("leftLayerSelector").value;
                            var temp2 = registry.byId("rightLayerSelector").value;

                            registry.byId("leftLayerSelector").set("value", temp2);
                            registry.byId("rightLayerSelector").set("value", temp1);
                            if (this.map.spectralRenderer) {
                                var temp3 = this.map.spectralRenderer;
                            }
                            if (this.map.spectralRendererSec) {
                                var temp4 = this.map.spectralRendererSec;
                            }

                            this.map.spectralRenderer = temp4 ? temp4 : temp3;


                            this.map.spectralRendererSec = temp3 ? temp3 : null;

                        } else if (this.primaryLayer.mosaicRule && this.secondaryLayer.mosaicRule && this.primaryLayer.mosaicRule !== this.secondaryLayer.mosaicRule) {
                            var temp1 = this.primaryLayer.mosaicRule;
                            var temp2 = this.secondaryLayer.mosaicRule;

                            this.primaryLayer.setMosaicRule(temp2);
                            this.secondaryLayer.setMosaicRule(temp1);
                            this.timebook("left");
                            this.timebook("right");
                            if (this.displayModeFlagLeft === 0 && this.displayModeFlagRight === 0) {
                                var tempdate1 = this.slider.get("value");
                                var tempdate2 = this.sliderRight.get("value");

                                this.slider.set("value", tempdate2);
                                this.sliderRight.set("value", tempdate1);
                                this.sliderDropDownSelection("slider");
                                this.sliderDropDownSelectionRight("slider");

                            } else if (this.displayModeFlagLeft === 1 && this.displayModeFlagRight === 1) {
                                var tempdate1 = registry.byId("imageSelectorDropDownLeft").get("value");
                                var tempdate2 = registry.byId("imageSelectorDropDownRight").get("value");

                                registry.byId("imageSelectorDropDownLeft").set("value", tempdate2);
                                registry.byId("imageSelectorDropDownRight").set("value", tempdate1);
                                this.sliderDropDownSelection("dropdown");
                                this.sliderDropDownSelectionRight("dropdown");

                            } else if (this.displayModeFlagLeft === 0 && this.displayModeFlagRight === 1) {
                                var tempdate1 = this.slider.get("value");
                                var tempdate2 = registry.byId("imageSelectorDropDownRight").get("value");

                                this.slider.set("value", tempdate2);
                                registry.byId("imageSelectorDropDownRight").set("value", tempdate1);

                                this.sliderDropDownSelection("slider");
                                this.sliderDropDownSelectionRight("dropdown");

                            } else if (this.displayModeFlagLeft === 1 && this.displayModeFlagRight === 0) {
                                var tempdate1 = registry.byId("imageSelectorDropDownLeft").get("value");
                                var tempdate2 = this.sliderRight.get("value");

                                registry.byId("imageSelectorDropDownLeft").set("value", tempdate2);
                                this.sliderRight.set("value", tempdate1);
                                this.sliderDropDownSelection("dropdown");
                                this.sliderDropDownSelectionRight("slider");
                            }
                            var temprend = this.map.spectralRenderer ? this.map.spectralRenderer : null;
                            var temprendsec = this.map.spectralRendererSec ? this.map.spectralRendererSec : this.map.spectralRenderer;
                            this.map.spectralRenderer = temprendsec;
                            this.map.spectralRendererSec = temprend;
                            var renderL = registry.byId("leftLayerRenderer").value;
                            var renderR = registry.byId("rightLayerRenderer").value;
                            if (renderL === 'spectralindexvalue' && renderR === 'spectralindexvalue') {
                                registry.byId("leftLayerRenderer").getOptions('spectralindexvalue').label = this.map.spectralRenderer.name;
                                registry.byId("rightLayerRenderer").getOptions('spectralindexvalue').label = this.map.spectralRendererSec.name;
                                registry.byId("leftLayerRenderer").set("value", 'spectralindexvalue');
                                registry.byId("rightLayerRenderer").set("value", 'spectralindexvalue');
                                this.primaryLayer.setRenderingRule(this.map.spectralRenderer);
                                this.secondaryLayer.setRenderingRule(this.map.spectralRendererSec);
                            } else {
                                registry.byId("leftLayerRenderer").set("value", renderR);
                                registry.byId("rightLayerRenderer").set("value", renderL);
                            }

                        } else {
                            var temprend = this.map.spectralRenderer ? this.map.spectralRenderer : null;
                            var temprendsec = this.map.spectralRendererSec ? this.map.spectralRendererSec : this.map.spectralRenderer;
                            this.map.spectralRenderer = temprendsec;
                            this.map.spectralRendererSec = temprend;
                            var renderL = registry.byId("leftLayerRenderer").value;
                            var renderR = registry.byId("rightLayerRenderer").value;
                            if (renderL === 'spectralindexvalue' && renderR === 'spectralindexvalue') {
                                registry.byId("leftLayerRenderer").getOptions('spectralindexvalue').label = this.map.spectralRenderer.name;
                                registry.byId("rightLayerRenderer").getOptions('spectralindexvalue').label = this.map.spectralRendererSec.name;
                                registry.byId("leftLayerRenderer").set("value", 'spectralindexvalue');
                                registry.byId("rightLayerRenderer").set("value", 'spectralindexvalue');
                                this.primaryLayer.setRenderingRule(this.map.spectralRenderer);
                                this.secondaryLayer.setRenderingRule(this.map.spectralRendererSec);
                                if (registry.byId('layerRendererView') && registry.byId('layerRendererView').getOptions('spectralindexvalue')) {
                                    registry.byId('layerRendererView').getOptions('spectralindexvalue').label = this.map.spectralRenderer.name;
                                    registry.byId('layerRendererView').set("value", 'spectralindexvalue');
                                }
                            } else {
                                registry.byId("leftLayerRenderer").set("value", renderR);
                                registry.byId("rightLayerRenderer").set("value", renderL);
                            }
                        }
                    }
                }));

                registry.byId("changeDetectioCheckBox").set("disabled", true);
                if (!domClass.contains("activateChange", "activateChange")) {
                    domClass.add("activateChange", "activateChange");
                }
                registry.byId("changeDetectioCheckBox").on("change", lang.hitch(this, function (value) {

                    if (value === true) {
                        this.changeToolOn = 1;
                        domStyle.set("changeTemplate", "display", "block");
                        this.changeDetection.onOpen();
                        this.primaryLayer.on("mosaic-rule-change", lang.hitch(this, function () {
                            this.changeDetection.mosaicRuleChanged();
                        }));
                        this.secondaryLayer.on("mosaic-rule-change", lang.hitch(this, function () {
                            this.changeDetection.mosaicRuleChanged();
                        }));
                    } else {
                        this.changeToolOn = 0;
                        domStyle.set("changeTemplate", "display", "none");
                        if (this.map.getLayer("resultLayer")) {
                            this.map.removeLayer(this.map.getLayer("resultLayer"));
                        }
                    }
                }))

                if (dom.byId("layerSelectorView")) {
                    registry.byId("leftLayerSelector").set("value", registry.byId("layerSelectorView").value);
                }

                registry.byId('applyLeft').on("click", lang.hitch(this, this.stretchfnLeft));
                registry.byId('resetLeft').on("click", lang.hitch(this, this.reset1Left));
                registry.byId('applyIndexLeft').on("click", lang.hitch(this, this.indexFunctionLeft));

                registry.byId('applyRight').on("click", lang.hitch(this, this.stretchfnRight));
                registry.byId('resetRight').on("click", lang.hitch(this, this.reset1Right));
                registry.byId('applyIndexRight').on("click", lang.hitch(this, this.indexFunctionRight));
               
            },

            timebook: function (value) {
                if (value === "left") {
                    if (registry.byId("leftLayerSelector").value !== "none") {
                        //var getLayerPropertiesLeft = this.map.getLayer(registry.byId("leftLayerSelector").value);
                        var getLayerPropertiesLeft = this.primaryLayer;
                        if (getLayerPropertiesLeft.id === "MS_696") {
                            this.acquisitionDateLeft = "AcquisitionDate";
                            this.titleLeft = "Landsat";
                        } else if (getLayerPropertiesLeft.id === "Sentinel2_2553") {
                            this.acquisitionDateLeft = "acquisitiondate";
                            this.titleLeft = "Sentinel 2";
                        }
                        if (getLayerPropertiesLeft && (!getLayerPropertiesLeft.mosaicRule || getLayerPropertiesLeft.mosaicRule.method !== "esriMosaicLockRaster")) {
                            //dom.byId("dateDisplay").innerHTML = this.titleLeft + " - &nbsp;&nbsp;" + locale.format(new Date(result.samples[0].attributes[this.acquisitionDateLeft]), { selector: "date", formatLength: "long" });
                            dom.byId("dateDisplay").innerHTML = this.titleLeft;

                        } else if (getLayerPropertiesLeft && (getLayerPropertiesLeft.mosaicRule || getLayerPropertiesLeft.mosaicRule.method === "esriMosaicLockRaster")) {
                            if (registry.byId("imageSelectorLeft").checked) {
                                var getDateLeft = new esriRequest({
                                    url: getLayerPropertiesLeft.url + "/getSamples",
                                    content: {
                                        geometry: JSON.stringify(this.map.extent.getCenter()),
                                        geometryType: "esriGeometryPoint",
                                        returnGeometry: false,
                                        mosaicRule: JSON.stringify(getLayerPropertiesLeft.mosaicRule.toJson()),
                                        outFields: [this.acquisitionDateLeft],
                                        f: "json"
                                    },
                                    handleAs: "json",
                                    callbackParamName: "callback"
                                });
                                getDateLeft.then(lang.hitch(this, function (result) {
                                    if (result.samples && result.samples[0].attributes[this.acquisitionDateLeft]) {
                                        dom.byId("dateDisplay").innerHTML = this.titleLeft + " - &nbsp;&nbsp;" + locale.format(new Date(result.samples[0].attributes[this.acquisitionDateLeft]), { selector: "date", formatLength: "long" });
                                        //dom.byId("dateDisplay").innerHTML = this.titleLeft;
                                    }
                                }), lang.hitch(this, function () {
                                    this.hideLoading();
                                }));
                            } else {
                                dom.byId("dateDisplay").innerHTML = this.titleLeft;
                            }
                        }
                    } else {
                        dom.byId("dateDisplay").innerHTML = "Basemap";
                    }
                } else if (value === "right") {
                    if (registry.byId("rightLayerSelector").value !== "none") {
                        //var getLayerProperties = this.map.getLayer(registry.byId("rightLayerSelector").value);
                        var getLayerProperties = this.secondaryLayer ? this.secondaryLayer : this.map.getLayer(registry.byId("rightLayerSelector").value);
                        if (getLayerProperties.id === "MS_696") {
                            this.acquisitionDate = "AcquisitionDate";
                            this.title = "Landsat";
                        } else if (getLayerProperties.id === "Sentinel2_2553") {
                            this.acquisitionDate = "acquisitiondate";
                            this.title = "Sentinel 2";
                        }
                        if (getLayerProperties && (!getLayerProperties.mosaicRule || getLayerProperties.mosaicRule.method !== "esriMosaicLockRaster")) {
                            //dom.byId("compDisplay").innerHTML = "&nbsp;&nbsp; Compared with - "+ this.title + " - &nbsp;&nbsp;" + locale.format(new Date(result.samples[0].attributes[this.acquisitionDate]), { selector: "date", formatLength: "long" });
                            dom.byId("compDisplay").innerHTML = "&nbsp;&nbsp; Compared with - " + this.title;

                        } else if (getLayerProperties && (getLayerProperties.mosaicRule || getLayerProperties.mosaicRule.method === "esriMosaicLockRaster")) {
                            if (registry.byId("imageSelectorRight").checked) {
                                var getDate = new esriRequest({
                                    url: getLayerProperties.url + "/getSamples",
                                    content: {
                                        geometry: JSON.stringify(this.map.extent.getCenter()),
                                        geometryType: "esriGeometryPoint",
                                        returnGeometry: false,
                                        mosaicRule: JSON.stringify(getLayerProperties.mosaicRule.toJson()),
                                        outFields: [this.acquisitionDate],
                                        f: "json"
                                    },
                                    handleAs: "json",
                                    callbackParamName: "callback"
                                });
                                getDate.then(lang.hitch(this, function (result) {
                                    if (result.samples && result.samples[0].attributes[this.acquisitionDate]) {
                                        dom.byId("compDisplay").innerHTML = "&nbsp;&nbsp; Compared with - " + this.title + " - &nbsp;&nbsp;" + locale.format(new Date(result.samples[0].attributes[this.acquisitionDate]), { selector: "date", formatLength: "long" });
                                        //dom.byId("compDisplay").innerHTML = "&nbsp;&nbsp; Compared with - "+ this.title;
                                    }
                                }), lang.hitch(this, function () {
                                    this.hideLoading();
                                }));
                            } else {
                                dom.byId("compDisplay").innerHTML = "&nbsp;&nbsp; Compared with - " + this.title;
                            }
                        }
                    } else {
                        dom.byId("compDisplay").innerHTML = "&nbsp;&nbsp; Compared with - Basemap";
                    }
                }
            },

            fillLayerSelector: function () {
                registry.byId("leftLayerSelector").addOption({ label: "Basemap", value: "none" });
                registry.byId("rightLayerSelector").addOption({ label: "Basemap", value: "none" });
                var layer;
                this.leftLayerInfos = [], this.rightLayerInfos = [];
                for (var a in this.layerInfos) {
                    layer = this.map.getLayer(a);
                    registry.byId("leftLayerSelector").addOption({ label: this.layerInfos[a].title, value: layer.id });
                    registry.byId("rightLayerSelector").addOption({ label: this.layerInfos[a].title, value: layer.id });
                    this.layerInfos[a].defaultMosaicRule = (layer.mosaicRule || layer.defaultMosaicRule || null);
                    this.layerInfos[a].defaultRenderer = layer.renderer;
                    this.layerInfos[a].defaultRenderingRule = layer.renderingRule;
                    this.layerInfos[a].defaultBandIds = layer.bandIds;
                    this.layerInfos[a].state = false;
                    this.layerInfos[a].age = 0;
                    this.layerInfos[a].ageString = "days";
                    this.layerInfos[a].type = "image";
                    this.layerInfos[a].currentValue = null;
                    this.leftLayerInfos[a] = lang.clone(this.layerInfos[a]);
                    this.rightLayerInfos[a] = lang.clone(this.layerInfos[a]);
                }
            },

            setTooltips: function () {
                this.switchDisplayTooltip = new Tooltip({
                    connectId: ['dropDownListViewLeft'],
                    position: ['below'],
                    label: this.nls.dropDown
                });

                this.switchDisplayTooltip = new Tooltip({
                    connectId: ['dropDownImageListRight'],
                    position: ['below'],
                    label: this.nls.dropDown
                });

                new Tooltip({
                    connectId: ["imageSelectorLeft", "imageSelectorRight"],
                    position: ['below'],
                    label: this.nls.enableSearchImages
                });

                new Tooltip({
                    connectId: ["refreshImageSliderBtnLeft", "refreshImageSliderBtnRight"],
                    position: ['after', 'below'],
                    label: this.nls.refreshQuery
                });
            },

            onOpen: function () {

                this.instance = 1;
                console.log('onOpen');

                if (registry.byId("sensorNAME").get("value")) {
                    if (registry.byId("sensorNAME").get("value") !== "MS_696") {
                        registry.byId("leftLayerSelector").set("value", registry.byId("sensorNAME").get("value"));
                        registry.byId("sensorNAME").set("value", "");
                    }
                }
                if (registry.byId("secondarySensorNAME").get("value")) {
                    if (registry.byId("secondarySensorNAME").get("value") !== "MS_696") {
                        registry.byId("rightLayerSelector").set("value", registry.byId("secondarySensorNAME").get("value"));
                        registry.byId("secondarySensorNAME").set("value", "");
                    }
                }

                if (registry.byId("rightLayerSelector").value === "Sentinel2_2553" && this.map.secondaryLayer) {
                    this.secondaryLayer = this.map.getLayer("Sentinel2_2553_Right");
                }
                if (this.map.secureService) {
                    this.config.urlSentinel = "https://sentinel.arcgis.com/arcgis/rest/services/Sentinel2/ImageServer";
                } else {
                    this.config.urlSentinel = "https://utility.arcgis.com/usrsvcs/servers/d70ebb358d28463a99e574d56265dd95/rest/services/Sentinel2/ImageServer";
                }

                if (registry.byId("leftLayerSelector").value === "Sentinel2_2553" && !this.map.secureService && registry.byId("imageSelectorLeft").checked) {
                    registry.byId("imageSelectorLeft").set("checked", false);
                }

                if (registry.byId("rightLayerSelector").value === "Sentinel2_2553" && !this.map.secureService && registry.byId("imageSelectorRight").checked) {
                    registry.byId("imageSelectorRight").set("checked", false);
                }

                // if (dom.byId("layerSelectorView")) {
                //     registry.byId("leftLayerSelector").set("value", registry.byId("layerSelectorView").value);
                // }
                // if (registry.byId("leftLayer").checked) {                
                if (!this.dateLeft) {
                    this.timebook("left");
                } else if (this.dateLeft) {
                    if (registry.byId("leftLayerSelector").value === "MS_696") {
                        dom.byId("dateDisplay").innerHTML = "Landsat - &nbsp;&nbsp;" + locale.format(new Date(this.dateLeft), { selector: "date", formatLength: "long" });
                    } else if (registry.byId("leftLayerSelector").value === "Sentinel2_2553") {
                        dom.byId("dateDisplay").innerHTML = "Sentinel 2 - &nbsp;&nbsp;" + locale.format(new Date(this.dateLeft), { selector: "date", formatLength: "long" });
                    } else {
                        dom.byId("dateDisplay").innerHTML = "Basemap";
                    }
                }

                if (!this.dateRight) {
                    this.timebook("right");
                } else if (this.dateRight) {
                    if (registry.byId("rightLayerSelector").value === "MS_696") {
                        dom.byId("compDisplay").innerHTML = "&nbsp;&nbsp; Compared with - Landsat - &nbsp;&nbsp;" + locale.format(new Date(this.dateRight), { selector: "date", formatLength: "long" });
                    } else if (registry.byId("rightLayerSelector").value === "Sentinel2_2553") {
                        dom.byId("compDisplay").innerHTML = "&nbsp;&nbsp; Compared with - Sentinel 2 - &nbsp;&nbsp;" + locale.format(new Date(this.dateRight), { selector: "date", formatLength: "long" });
                    } else {
                        dom.byId("compDisplay").innerHTML = "&nbsp;&nbsp; Compared with - Basemap";
                    }
                }

                if (!this.previousInfo) {
                    this.previousInfo = {
                        extent: this.map.extent,
                        level: this.map.getLevel()
                    };
                    this.previousExtentChangeLevel = this.previousInfo.level;
                }
                if (registry.byId("leftLayerSelector").value === "none") {
                    this.primaryLayer = null;
                    domStyle.set("imageSelectCheckBoxLeft", "display", "none");
                    domStyle.set("leftRenderer", "display", "none");
                    registry.byId("imageSelectorLeft").set("checked", false);
                    for (var a in this.layerInfos) {

                        this.map.getLayer(a).hide();

                    }
                } else {
                    this.primaryLayer = this.map.getLayer(registry.byId("leftLayerSelector").value);
                    this.primaryLayer.show();
                    for (var a in this.leftLayerInfos) {
                        if (a !== this.primaryLayer.id) {
                            this.map.getLayer(a).hide();
                        }
                    }
                }

                if (registry.byId("rightLayerSelector").value === "none") {
                    //this.secondaryLayer = null;
                    // if (this.secondaryLayer) {
                    //     this.secondaryLayer.suspend();
                    //     this.map.removeLayer(this.secondaryLayer);
                    // }

                    domStyle.set("imageSelectCheckBoxRight", "display", "none");
                    registry.byId("imageSelectorRight").set("checked", false);
                    domStyle.set("rightRenderer", "display", "none");
                    for (var a in this.rightLayerInfos) {
                        if (this.primaryLayer) {
                            if (a !== this.primaryLayer.id) {
                                this.map.getLayer(a).hide();
                            }
                        } else {
                            this.map.getLayer(a).hide();
                        }
                    }
                } else {
                    this.tempLayer = this.map.getLayer(registry.byId("rightLayerSelector").value);
                    //this.tempLayer.show();
                    if (!this.secondaryLayer) {
                        for (var a in this.rightLayerInfos) {
                            if (this.primaryLayer) {
                                if (a !== this.tempLayer.id && a !== this.primaryLayer.id) {
                                    this.map.getLayer(a).hide();
                                }
                            } else {
                                if (a !== this.tempLayer.id) {
                                    this.map.getLayer(a).hide();
                                }
                            }

                        }
                    }
                    else {
                        this.secondaryLayer.show();
                        for (var a in this.rightLayerInfos) {
                            if (this.primaryLayer) {
                                if (a !== this.secondaryLayer.id && this.primaryLayer && a !== this.primaryLayer.id) {
                                    this.map.getLayer(a).hide();
                                }
                            } else {
                                if (a !== this.tempLayer.id) {
                                    this.map.getLayer(a).hide();
                                }
                            }
                        }
                    }
                    this.imageSliderShow();
                    this.imageSliderShowRight();

                    var widgetId = this.mainConfig.id;
                    var panelId = widgetId + "_panel";
                    this.panel = pm.getPanelById(panelId);

                }

                if (!this.addLayerHandler) {
                    this.addLayerHandler = this.map.on("layer-add", lang.hitch(this, function (response) {
                        if (response.layer.id !== "Sentinel2_2553") {
                            this.currentLayerPropRight = registry.byId("rightLayerSelector").get("value") !== "none" ? this.rightLayerInfos[registry.byId("rightLayerSelector").get("value")] : null;
                            this.checkLayerPropRight();
                        }
                    }));
                }
                this.refreshHandler = this.map.on("update-end", lang.hitch(this, this.refreshSwipe));
                this.refreshSwipe();

                if (this.map.getLevel() < this.config.zoomLevel) {
                    this.turnOffSelector();
                    this.turnOffSelectorRight();
                }

                if (registry.byId("leftLayerSelector").value === registry.byId("rightLayerSelector").value) {
                    html.set("itals", this.nls.sameDateWarning);
                    domStyle.set("itals", "display", "block");
                } else {
                    html.set("itals", this.nls.sameSensorRule);
                    domStyle.set("itals", "display", "block");
                }
                if (this.map) {
                    this.extentHandlerCompare = this.map.on("extent-change", lang.hitch(this, this.mapExtentChange));
                }
                if (this.changeToolOn === 1) {
                    this.changeDetection.onOpen();
                }
                if (this.secondaryLayer) {
                    this.secondaryLayer.show();
                }

                if (registry.byId("changeMaskDetect").get("value") === "change") {
                    setTimeout(function () {
                        registry.byId("changeDetectioCheckBox").set("checked", true);
                    }, 3500);

                }

                // if (this.map.getLayer(registry.byId('leftLayerSelector').value).renderer || this.map.getLayer(registry.byId('leftLayerSelector').value).bandIds) {
                //     this.currentLayerProp.defaultRenderer = this.map.getLayer(registry.byId('leftLayerSelector').value).renderer;
                //     this.currentLayerProp.defaultRenderingRule = this.map.getLayer(registry.byId('leftLayerSelector').value).renderingRule;
                //     this.currentLayerProp.defaultBandIds = this.map.getLayer(registry.byId('leftLayerSelector').value).bandIds;
                //     this.populateRendererList();
                // }

                // if (this.map.getLayer(registry.byId('rightLayerSelector').value + "_Right") && (this.map.getLayer(registry.byId('rightLayerSelector').value + "_Right").renderer || this.map.getLayer(registry.byId('rightLayerSelector').value + "_Right").bandIds)) {
                //     this.currentLayerPropRight.defaultRenderer = this.map.getLayer(registry.byId('rightLayerSelector').value + "_Right").renderer;
                //     this.currentLayerPropRight.defaultRenderingRule = this.map.getLayer(registry.byId('rightLayerSelector').value + "_Right").renderingRule;
                //     this.currentLayerPropRight.defaultBandIds = this.map.getLayer(registry.byId('rightLayerSelector').value + "_Right").bandIds;
                //     this.populateRendererListRight(this.map.getLayer(registry.byId('rightLayerSelector').value + "_Right"));
                // }
            },

            onClose: function () {
                this.instance = 0;
                console.log('onClose');
                if (this.addLayerHandler) {
                    this.addLayerHandler.remove();
                    this.addLayerHandler = null;
                }
                if (this.refreshHandler) {
                    this.refreshHandler.remove();
                    this.refreshHandler = null;
                }
                if (this.extentHandlerCompare) {
                    this.extentHandlerCompare.remove();
                    this.extentHandlerCompare = null;
                }
                if (this.layerSwipe) {
                    this.swipePosition2 = this.layerSwipe.left;
                    this.swipePosition = null;
                    this.layerSwipe.destroy();
                    this.layerSwipe = null;
                }
                this.previousLayerInfo = { primary: { id: null, mosaicRule: null }, secondary: { id: null, mosaicRule: null } };
                if (!this.dateLeft) {
                    this.timebook("left");
                } else if (this.dateLeft) {
                    if (registry.byId("leftLayerSelector").value === "MS_696") {
                        dom.byId("dateDisplay").innerHTML = "Landsat - &nbsp;&nbsp;" + locale.format(new Date(this.dateLeft), { selector: "date", formatLength: "long" });
                    } else if (registry.byId("leftLayerSelector").value === "Sentinel2_2553") {
                        dom.byId("dateDisplay").innerHTML = "Sentinel 2 - &nbsp;&nbsp;" + locale.format(new Date(this.dateLeft), { selector: "date", formatLength: "long" });
                    } else {
                        dom.byId("dateDisplay").innerHTML = "Basemap";
                    }
                }
                if (this.slider) {
                    this.slider.destroy();
                    this.slider = null;
                }

                if (this.sliderRight) {
                    this.sliderRight.destroy();
                    this.sliderRight = null;
                }

                if (registry.byId("rendererInfoDialogCompare").open) {
                    registry.byId("rendererInfoDialogCompare").hide();
                }
                if (registry.byId("sensorInfoDialogCompare").open) {
                    registry.byId("sensorInfoDialogCompare").hide();
                }
                if (registry.byId("leftLayerSelector").value !== "none") {
                    this.primaryLayer = this.map.getLayer(this.leftLayerInfos[registry.byId("leftLayerSelector").value].id);
                    this.map.primaryLayer = this.primaryLayer;
                    this.primaryLayer.show();
                    for (var a in this.layerInfos) {
                        if (a !== this.primaryLayer.id) {
                            this.map.getLayer(a).hide();
                        }
                    }
                } else {
                    this.primaryLayer = null;
                    for (var a in this.layerInfos) {
                        this.map.getLayer(a).hide();
                    }
                    if (registry.byId("rightLayerSelector").value !== "none") {
                        this.secondaryLayer.hide();
                    }
                }

                dom.byId("compDisplay").innerHTML = "";
                this.changeDetection.onClose();
                //this.map.primaryLayer = this.primaryLayer;
                if (this.secondaryLayer) {
                    this.secondaryLayer.hide();
                }

                if (registry.byId('Spectral Index Library') && registry.byId('Spectral Index Library').open) {
                    document.getElementsByClassName('icon-node')[2].click();
                }
            },

            selectLeftLayer: function (value) {
                if (this.config.display === "both") {
                    domStyle.set("imageSelectContainerLeft", "display", "inline-block");
                } else {
                    if (this.config.display === "dropdown") {
                        this.imageDisplayFormat();
                    }
                    domStyle.set("imageSelectContainerLeft", "display", "none");
                }

                if (this.primaryLayer) {
                    this.primaryLayer.hide();
                }
                if (value === "none") {
                    this.clearGraphics();
                    this.primaryLayer = null;
                    domStyle.set("imageSelectCheckBoxLeft", "display", "none");
                    domStyle.set("leftRenderer", "display", "none");
                    registry.byId("imageSelectorLeft").set("checked", false);
                    document.getElementById("dateDisplay").innerHTML = "Basemap";
                    registry.byId("changeDetectioCheckBox").set("checked", false);
                    registry.byId("changeDetectioCheckBox").set("disabled", true);
                    if (!domClass.contains("activateChange", "activateChange")) {
                        domClass.add("activateChange", "activateChange");
                    }
                    this.refreshSwipe();
                } else {
                    this.map.primaryLayerChanged = 1;
                    this.currentLayerProp = value !== "none" ? this.leftLayerInfos[value] : null;
                    this.valueSelected = null;
                    this.primaryLayer = this.map.getLayer(value);
                    this.map.primaryLayer = this.primaryLayer;
                    this.changeDetection.clearResultLayer();
                    this.changeDetection.primaryLayer = this.primaryLayer;
                    this.primaryLayer.show();
                    for (var a in this.layerInfos) {
                        if (a !== this.primaryLayer.id) {
                            this.map.getLayer(a).hide();
                        }
                    }
                    if (this.config.showRendering) {
                        this.populateRendererList();
                    }
                    this.checkLayerProp();
                    this.timebook("left");
                    this.refreshSwipe();
                }
                if (dom.byId("layerSelectorView")) {
                    registry.byId("layerSelectorView").set("value", registry.byId("leftLayerSelector").value);
                }


                if (registry.byId("leftLayerSelector").get("value") === "MS_696") {
                    if (this.config.renderInfo.landsat[registry.byId("leftLayerRenderer").value]) {
                        html.set(dom.byId("renderDescriptionCompare"), this.config.renderInfo.landsat[registry.byId("leftLayerRenderer").value].description);
                    } else {
                        html.set(dom.byId("renderDescriptionCompare"), 'Spectral Index RFT applied as a rendering rule.');
                    }
                    html.set(dom.byId("sensorDescriptionCompare"), "Landsat 8 OLI, 30m multispectral and multitemporal 8-band imagery, with on-the-fly renderings and indices. Additional Landsat services can be found <a href='https://www.arcgis.com/home/group.html?id=a74dff13f1be4b2ba7264c3315c57077#overview' target='_blank'>here</a>");
                } else if (registry.byId("leftLayerSelector").get("value") === "Sentinel2_2553") {
                    if (this.config.renderInfo.sentinel[registry.byId("leftLayerRenderer").value]) {
                        html.set(dom.byId("renderDescriptionCompare"), this.config.renderInfo.sentinel[registry.byId("leftLayerRenderer").value].description);
                    } else {
                        html.set(dom.byId("renderDescriptionCompare"), 'Spectral Index RFT applied as a rendering rule.');
                    }
                    html.set(dom.byId("sensorDescriptionCompare"), "Sentinel-2, 10m Multispectral, Multitemporal, 13-band images with visual renderings and indices. - <a href='https://www.arcgis.com/home/item.html?id=fd61b9e0c69c4e14bebd50a9a968348c' target='_blank'>Find here</a>");
                } else {
                    html.set(dom.byId("renderDescriptionCompare"), "Basemap");
                    html.set(dom.byId("sensorDescriptionCompare"), "Basemap");
                }

                if (registry.byId("leftLayerSelector").value === registry.byId("rightLayerSelector").value) {
                    html.set("itals", this.nls.sameDateWarning);
                    domStyle.set("itals", "display", "block");
                } else {
                    html.set("itals", this.nls.sameSensorRule);
                    domStyle.set("itals", "display", "block");
                }

            },

            populateRendererList: function () {
                registry.byId("leftLayerRenderer").removeOption(registry.byId("leftLayerRenderer").getOptions());
                var currentRenderer = this.primaryLayer.renderingRule ? this.primaryLayer.renderingRule : null;
                for (var a in this.primaryLayer.rasterFunctionInfos) {
                    // if (this.currentLayerProp.defaultRenderer || this.currentLayerProp.defaultBandIds) {
                    //     var rendererExist = true;
                    // }
                    if (currentRenderer && currentRenderer.functionName && this.primaryLayer.rasterFunctionInfos[a].name === currentRenderer.functionName) {
                        var setRenderer = true;
                    }
                    registry.byId("leftLayerRenderer").addOption({ label: this.primaryLayer.rasterFunctionInfos[a].name, value: this.primaryLayer.rasterFunctionInfos[a].name });
                }
                if (registry.byId("leftLayerRenderer").getOptions().length > 0) {
                    // if (rendererExist) {
                    //     registry.byId("leftLayerRenderer").addOption({ label: "Default", value: "default" });
                    //     this.defaultRenderer = this.currentLayerProp.defaultRenderer;
                    //     this.defaultBandIds = this.currentLayerProp.defaultBandIds;
                    //     this.defaultRenderingRule = this.currentLayerProp.defaultRenderingRule;
                    // }

                    if (setRenderer) {
                        registry.byId("leftLayerRenderer").set("value", currentRenderer.functionName);
                    } else {
                        registry.byId("leftLayerRenderer").addOption({ label: currentRenderer.functionName, value: "spectralindexvalue" });
                        registry.byId("leftLayerRenderer").set('value', 'spectralindexvalue');
                    }

                    domStyle.set("leftRenderer", "display", "block");
                    registry.byId("leftLayerRenderer").addOption({ label: "Custom Bands", value: "Build" });
                    registry.byId("leftLayerRenderer").addOption({ label: "Custom Index", value: "Index" });

                    if (registry.byId("renderNAME").get("value")) {
                        registry.byId("leftLayerRenderer").set("value", registry.byId("renderNAME").get("value"));
                        registry.byId("renderNAME").set("value", "");
                    } else if (this.map.appRenderer) {
                        registry.byId("leftLayerRenderer").addOption({ label: this.map.appRenderer.name, value: "spectralindexvalue" });
                        registry.byId("leftLayerRenderer").set("value", "spectralindexvalue");
                        var tempRend = new RasterFunction(this.map.appRenderer);
                        setTimeout(lang.hitch(this, function() {
                            this.primaryLayer.setRenderingRule(tempRend);
                        }), 5000);
                        
                    }
                    if (this.map.getLayer(registry.byId('leftLayerSelector').value).currentVersion > 10.60) {
                        registry.byId("leftLayerRenderer").addOption({ label: "Spectral Index", value: "Spectral Index" });
                    }
                } else {
                    if (this.map.getLayer(registry.byId('leftLayerSelector').value).currentVersion > 10.60) {
                        registry.byId("leftLayerRenderer").addOption({ label: "Spectral Index", value: "Spectral Index" });
                    } else {
                        domStyle.set("leftRenderer", "display", "none");
                    }
                }
            },

            setRenderingRule: function (value) {
                if (this.primaryLayer) {
                    if (value === "default") {
                        domStyle.set("buildExtensionLeft", "display", "none");
                        domStyle.set("formulaLeft", "display", "none");
                        domStyle.set("indexExtensionLeft", "display", "none");
                        this.primaryLayer.setBandIds(this.defaultBandIds, true);
                        this.primaryLayer.setRenderingRule(this.defaultRenderingRule, true);
                        this.primaryLayer.setRenderer(this.defaultRenderer);

                    } else if (value === 'spectralindexvalue') {
                        domStyle.set("buildExtensionLeft", "display", "none");
                        domStyle.set("formulaLeft", "display", "none");
                        domStyle.set("indexExtensionLeft", "display", "none");
                        this.primaryLayer.setRenderingRule(this.map.spectralRenderer);

                    } else if (value === "Spectral Index") {
                        domStyle.set("buildExtensionLeft", "display", "none");
                        domStyle.set("formulaLeft", "display", "none");
                        domStyle.set("indexExtensionLeft", "display", "none");
                        document.getElementsByClassName('icon-node')[2].click();

                    } else if (value === "Build") {
                        domStyle.set("buildExtensionLeft", "display", "block");
                        domStyle.set("formulaLeft", "display", "none");
                        domStyle.set("indexExtensionLeft", "display", "none");
                        registry.byId("bnd1Left").removeOption(registry.byId("bnd1Left").getOptions());
                        registry.byId("bnd2Left").removeOption(registry.byId("bnd2Left").getOptions());
                        registry.byId("bnd3Left").removeOption(registry.byId("bnd3Left").getOptions());

                        if (this.primaryLayer.url === this.config.urlLandsatMS) {
                            registry.byId("bnd1Left").addOption({ label: "Coastal(1)", value: "1" });
                            registry.byId("bnd1Left").addOption({ label: "Blue(2)", value: "2" });
                            registry.byId("bnd1Left").addOption({ label: "Green(3)", value: "3" });
                            registry.byId("bnd1Left").addOption({ label: "Red(4)", value: "4" });
                            registry.byId("bnd1Left").addOption({ label: "NIR(5)", value: "5" });
                            registry.byId("bnd1Left").addOption({ label: "SWIR1(6)", value: "6" });
                            registry.byId("bnd1Left").addOption({ label: "SWIR2(7)", value: "7" });
                            registry.byId("bnd1Left").addOption({ label: "Cirrus(8)", value: "8" });
                            registry.byId("bnd1Left").set("value", "6");

                            registry.byId("bnd2Left").addOption({ label: "Coastal(1)", value: "1" });
                            registry.byId("bnd2Left").addOption({ label: "Blue(2)", value: "2" });
                            registry.byId("bnd2Left").addOption({ label: "Green(3)", value: "3" });
                            registry.byId("bnd2Left").addOption({ label: "Red(4)", value: "4" });
                            registry.byId("bnd2Left").addOption({ label: "NIR(5)", value: "5" });
                            registry.byId("bnd2Left").addOption({ label: "SWIR1(6)", value: "6" });
                            registry.byId("bnd2Left").addOption({ label: "SWIR2(7)", value: "7" });
                            registry.byId("bnd2Left").addOption({ label: "Cirrus(8)", value: "8" });
                            registry.byId("bnd2Left").set("value", "5");

                            registry.byId("bnd3Left").addOption({ label: "Coastal(1)", value: "1" });
                            registry.byId("bnd3Left").addOption({ label: "Blue(2)", value: "2" });
                            registry.byId("bnd3Left").addOption({ label: "Green(3)", value: "3" });
                            registry.byId("bnd3Left").addOption({ label: "Red(4)", value: "4" });
                            registry.byId("bnd3Left").addOption({ label: "NIR(5)", value: "5" });
                            registry.byId("bnd3Left").addOption({ label: "SWIR1(6)", value: "6" });
                            registry.byId("bnd3Left").addOption({ label: "SWIR2(7)", value: "7" });
                            registry.byId("bnd3Left").addOption({ label: "Cirrus(8)", value: "8" });
                            registry.byId("bnd3Left").set("value", "2");

                            registry.byId("stretchoptionsLeft").set("value", "clip2");
                            registry.byId("gammaoptionsLeft").set("value", "4");
                        } else if (this.primaryLayer.url === this.config.urlSentinel) {
                            registry.byId("bnd1Left").addOption({ label: "Coastal(1)", value: "1" });
                            registry.byId("bnd1Left").addOption({ label: "Blue(2)", value: "2" });
                            registry.byId("bnd1Left").addOption({ label: "Green(3)", value: "3" });
                            registry.byId("bnd1Left").addOption({ label: "Red(4)", value: "4" });
                            registry.byId("bnd1Left").addOption({ label: "VRE(5)", value: "5" });
                            registry.byId("bnd1Left").addOption({ label: "VRE(6)", value: "6" });
                            registry.byId("bnd1Left").addOption({ label: "VRE(7)", value: "7" });
                            registry.byId("bnd1Left").addOption({ label: "NIR(8)", value: "8" });
                            registry.byId("bnd1Left").addOption({ label: "NarrowNIR(8A)", value: "9" });
                            registry.byId("bnd1Left").addOption({ label: "Water Vapor(9)", value: "10" });
                            registry.byId("bnd1Left").addOption({ label: "Cirrus(10)", value: "11" });
                            registry.byId("bnd1Left").addOption({ label: "SWIR(11)", value: "12" });
                            registry.byId("bnd1Left").addOption({ label: "SWIR(12)", value: "13" });
                            registry.byId("bnd1Left").set("value", "12");

                            registry.byId("bnd2Left").addOption({ label: "Coastal(1)", value: "1" });
                            registry.byId("bnd2Left").addOption({ label: "Blue(2)", value: "2" });
                            registry.byId("bnd2Left").addOption({ label: "Green(3)", value: "3" });
                            registry.byId("bnd2Left").addOption({ label: "Red(4)", value: "4" });
                            registry.byId("bnd2Left").addOption({ label: "VRE(5)", value: "5" });
                            registry.byId("bnd2Left").addOption({ label: "VRE(6)", value: "6" });
                            registry.byId("bnd2Left").addOption({ label: "VRE(7)", value: "7" });
                            registry.byId("bnd2Left").addOption({ label: "NIR(8)", value: "8" });
                            registry.byId("bnd2Left").addOption({ label: "NarrowNIR(8A)", value: "9" });
                            registry.byId("bnd2Left").addOption({ label: "Water Vapor(9)", value: "10" });
                            registry.byId("bnd2Left").addOption({ label: "Cirrus(10)", value: "11" });
                            registry.byId("bnd2Left").addOption({ label: "SWIR(11)", value: "12" });
                            registry.byId("bnd2Left").addOption({ label: "SWIR(12)", value: "13" });
                            registry.byId("bnd2Left").set("value", "8");

                            registry.byId("bnd3Left").addOption({ label: "Coastal(1)", value: "1" });
                            registry.byId("bnd3Left").addOption({ label: "Blue(2)", value: "2" });
                            registry.byId("bnd3Left").addOption({ label: "Green(3)", value: "3" });
                            registry.byId("bnd3Left").addOption({ label: "Red(4)", value: "4" });
                            registry.byId("bnd3Left").addOption({ label: "VRE(5)", value: "5" });
                            registry.byId("bnd3Left").addOption({ label: "VRE(6)", value: "6" });
                            registry.byId("bnd3Left").addOption({ label: "VRE(7)", value: "7" });
                            registry.byId("bnd3Left").addOption({ label: "NIR(8)", value: "8" });
                            registry.byId("bnd3Left").addOption({ label: "NarrowNIR(8A)", value: "9" });
                            registry.byId("bnd3Left").addOption({ label: "Water Vapor(9)", value: "10" });
                            registry.byId("bnd3Left").addOption({ label: "Cirrus(10)", value: "11" });
                            registry.byId("bnd3Left").addOption({ label: "SWIR(11)", value: "12" });
                            registry.byId("bnd3Left").addOption({ label: "SWIR(12)", value: "13" });
                            registry.byId("bnd3Left").set("value", "2");

                            registry.byId("stretchoptionsLeft").set("value", "clip1");
                            registry.byId("gammaoptionsLeft").set("value", "5");
                        }
                        if (registry.byId("redBuild").value && registry.byId("blueBuild").value && registry.byId("greenBuild").value && registry.byId("stretchBuild").value && registry.byId("gammaBuild").value) {
                            registry.byId("bnd1Left").set("value", registry.byId("redBuild").get("value"));
                            registry.byId("bnd2Left").set("value", registry.byId("blueBuild").get("value"));
                            registry.byId("bnd3Left").set("value", registry.byId("greenBuild").get("value"));
                            registry.byId("stretchoptionsLeft").set("value", registry.byId("stretchBuild").get("value"));
                            registry.byId("gammaoptionsLeft").set("value", registry.byId("gammaBuild").get("value"));

                            registry.byId("redBuild").set("value", "");
                            registry.byId("blueBuild").set("value", "");
                            registry.byId("greenBuild").set("value", "");
                            registry.byId("stretchBuild").set("value", "");
                            registry.byId("gammaBuild").set("value", "");

                            dom.byId("applyLeft").click();
                        }

                    } else if (value === "Index") {
                        domStyle.set("buildExtensionLeft", "display", "none");
                        domStyle.set("formulaLeft", "display", "block");
                        domStyle.set("indexExtensionLeft", "display", "block");
                        registry.byId("bandALeft").removeOption(registry.byId("bandALeft").getOptions());
                        registry.byId("bandBLeft").removeOption(registry.byId("bandBLeft").getOptions());

                        if (this.primaryLayer.url === this.config.urlLandsatMS) {
                            registry.byId("bandALeft").addOption({ label: "Coastal(1)", value: "1" });
                            registry.byId("bandALeft").addOption({ label: "Blue(2)", value: "2" });
                            registry.byId("bandALeft").addOption({ label: "Green(3)", value: "3" });
                            registry.byId("bandALeft").addOption({ label: "Red(4)", value: "4" });
                            registry.byId("bandALeft").addOption({ label: "NIR(5)", value: "5" });
                            registry.byId("bandALeft").addOption({ label: "SWIR1(6)", value: "6" });
                            registry.byId("bandALeft").addOption({ label: "SWIR2(7)", value: "7" });
                            registry.byId("bandALeft").addOption({ label: "Cirrus(8)", value: "8" });
                            registry.byId("bandALeft").set("value", "5");

                            registry.byId("bandBLeft").addOption({ label: "Coastal(1)", value: "1" });
                            registry.byId("bandBLeft").addOption({ label: "Blue(2)", value: "2" });
                            registry.byId("bandBLeft").addOption({ label: "Green(3)", value: "3" });
                            registry.byId("bandBLeft").addOption({ label: "Red(4)", value: "4" });
                            registry.byId("bandBLeft").addOption({ label: "NIR(5)", value: "5" });
                            registry.byId("bandBLeft").addOption({ label: "SWIR1(6)", value: "6" });
                            registry.byId("bandBLeft").addOption({ label: "SWIR2(7)", value: "7" });
                            registry.byId("bandBLeft").addOption({ label: "Cirrus(8)", value: "8" });
                            registry.byId("bandBLeft").set("value", "4");

                            registry.byId("OffsetValueLeft").set("value", "0");
                            registry.byId("ScaleLeft").set("value", "5");
                        } else if (this.primaryLayer.url === this.config.urlSentinel) {
                            registry.byId("bandALeft").addOption({ label: "Coastal(1)", value: "1" });
                            registry.byId("bandALeft").addOption({ label: "Blue(2)", value: "2" });
                            registry.byId("bandALeft").addOption({ label: "Green(3)", value: "3" });
                            registry.byId("bandALeft").addOption({ label: "Red(4)", value: "4" });
                            registry.byId("bandALeft").addOption({ label: "VRE(5)", value: "5" });
                            registry.byId("bandALeft").addOption({ label: "VRE(6)", value: "6" });
                            registry.byId("bandALeft").addOption({ label: "VRE(7)", value: "7" });
                            registry.byId("bandALeft").addOption({ label: "NIR(8)", value: "8" });
                            registry.byId("bandALeft").addOption({ label: "NarrowNIR(8A)", value: "9" });
                            registry.byId("bandALeft").addOption({ label: "Water Vapor(9)", value: "10" });
                            registry.byId("bandALeft").addOption({ label: "Cirrus(10)", value: "11" });
                            registry.byId("bandALeft").addOption({ label: "SWIR(11)", value: "12" });
                            registry.byId("bandALeft").addOption({ label: "SWIR(12)", value: "13" });
                            registry.byId("bandALeft").set("value", "8");

                            registry.byId("bandBLeft").addOption({ label: "Coastal(1)", value: "1" });
                            registry.byId("bandBLeft").addOption({ label: "Blue(2)", value: "2" });
                            registry.byId("bandBLeft").addOption({ label: "Green(3)", value: "3" });
                            registry.byId("bandBLeft").addOption({ label: "Red(4)", value: "4" });
                            registry.byId("bandBLeft").addOption({ label: "VRE(5)", value: "5" });
                            registry.byId("bandBLeft").addOption({ label: "VRE(6)", value: "6" });
                            registry.byId("bandBLeft").addOption({ label: "VRE(7)", value: "7" });
                            registry.byId("bandBLeft").addOption({ label: "NIR(8)", value: "8" });
                            registry.byId("bandBLeft").addOption({ label: "NarrowNIR(8A)", value: "9" });
                            registry.byId("bandBLeft").addOption({ label: "Water Vapor(9)", value: "10" });
                            registry.byId("bandBLeft").addOption({ label: "Cirrus(10)", value: "11" });
                            registry.byId("bandBLeft").addOption({ label: "SWIR(11)", value: "12" });
                            registry.byId("bandBLeft").addOption({ label: "SWIR(12)", value: "13" });
                            registry.byId("bandBLeft").set("value", "4");

                            registry.byId("OffsetValueLeft").set("value", "0");
                            registry.byId("ScaleLeft").set("value", "5");
                        }
                        if (registry.byId("bandAIndex").value && registry.byId("bandBIndex").value && registry.byId("offsetIndex").value && registry.byId("scaleIndex").value && registry.byId("renderIndex").value) {
                            registry.byId("bandALeft").set("value", registry.byId("bandAIndex").get("value"));
                            registry.byId("bandBLeft").set("value", registry.byId("bandBIndex").get("value"));
                            registry.byId("OffsetValueLeft").set("value", registry.byId("offsetIndex").get("value"));
                            registry.byId("ScaleLeft").set("value", registry.byId("scaleIndex").get("value"));
                            registry.byId("colorRampLeft").set("value", registry.byId("renderIndex").get("value"));

                            registry.byId("bandAIndex").set("value", "");
                            registry.byId("bandBIndex").set("value", "");
                            registry.byId("offsetIndex").set("value", "");
                            registry.byId("scaleIndex").set("value", "");
                            registry.byId("renderIndex").set("value", "");

                            dom.byId("applyIndexLeft").click();
                        }
                    }

                    else {
                        domStyle.set("buildExtensionLeft", "display", "none");
                        domStyle.set("formulaLeft", "display", "none");
                        domStyle.set("indexExtensionLeft", "display", "none");
                        this.primaryLayer.setBandIds([], true);
                        this.primaryLayer.setRenderer(null);
                        this.primaryLayer.setRenderingRule(new RasterFunction({ "rasterFunction": value }));
                    }
                    this.primaryMosaic = registry.byId("currentOBJECTID").get("value");
                    if (this.primaryMosaic) {
                        registry.byId("imageSelectorLeft").set("checked", true);
                        registry.byId("currentOBJECTID").set("value", "");
                        //this.setFilterDiv();
                    }

                    if (registry.byId("leftLayerSelector").get("value") === "MS_696") {
                        if (this.config.renderInfo.sentinel[registry.byId("leftLayerRenderer").value]) {
                            html.set(dom.byId("renderDescriptionCompare"), this.config.renderInfo.landsat[registry.byId("leftLayerRenderer").value].description);
                        } else {
                            html.set(dom.byId("renderDescriptionCompare"), 'Spectral Index RFT applied as a rendering rule.');
                        }
                    } else if (registry.byId("leftLayerSelector").get("value") === "Sentinel2_2553") {
                        if (this.config.renderInfo.sentinel[registry.byId("leftLayerRenderer").value]) {
                            html.set(dom.byId("renderDescriptionCompare"), this.config.renderInfo.sentinel[registry.byId("leftLayerRenderer").value].description);
                        } else {
                            html.set(dom.byId("renderDescriptionCompare"), 'Spectral Index RFT applied as a rendering rule.');
                        }
                    } else {
                        html.set(dom.byId("renderDescriptionCompare"), "Basemap");
                    }
                    if (dom.byId("layerRendererView")) {
                        if (registry.byId("leftLayerRenderer").value !== 'spectralindexvalue' && registry.byId("leftLayerRenderer").value !== 'Spectral Index') {
                            registry.byId("layerRendererView").set("value", registry.byId("leftLayerRenderer").value);
                        } else if (registry.byId("leftLayerRenderer").value === 'spectralindexvalue') {
                            if (registry.byId('layerRendererView').getOptions('spectralindexvalue')) {
                                // registry.byId('layerRendererView').removeOption(registry.byId('layerRendererView').getOptions('spectralindexvalue'));
                                // registry.byId('layerRendererView').addOption({ label: this.map.spectralRenderer.name, value: 'spectralindexvalue'});
                                registry.byId('layerRendererView').getOptions('spectralindexvalue').label = this.map.spectralRenderer.name;
                                registry.byId("layerRendererView").set("value", 'spectralindexvalue');
                            }
                        }
                    }
                }
                this.refreshSwipe();
            },

            selectRightLayer: function (value) {
                if (this.config.display === "both") {
                    domStyle.set("imageSelectContainerRight", "display", "inline-block");
                } else {
                    if (this.config.display === "dropdown") {
                        this.imageDisplayFormatRight();
                    }
                    domStyle.set("imageSelectContainerRight", "display", "none");
                }
                //this.config.showFootprint = true;
                // if (this.config.showFootprint) {
                //     domStyle.set("showImageFootprintRight", "display", "block");
                // }

                if (this.secondaryLayer) {
                    this.secondaryLayer.suspend();
                    this.map.removeLayer(this.secondaryLayer);
                }

                if (value === "none") {
                    this.clearGraphicsRight();
                    this.secondaryLayer = null;
                    domStyle.set("imageSelectCheckBoxRight", "display", "none");
                    registry.byId("imageSelectorRight").set("checked", false);
                    domStyle.set("rightRenderer", "display", "none");
                    dom.byId("compDisplay").innerHTML = "&nbsp;&nbsp; Compared with - Basemap";
                    registry.byId("changeDetectioCheckBox").set("checked", false);
                    registry.byId("changeDetectioCheckBox").set("disabled", true);
                    if (!domClass.contains("activateChange", "activateChange")) {
                        domClass.add("activateChange", "activateChange");
                    }
                    this.refreshSwipe();
                } else {
                    this.map.secondaryLayerChanged = 1;
                    this.valueSelectedRight = null;
                    this.secondaryLayerRight = this.map.getLayer(value);
                    var params = new ImageServiceParameters();
                    this.currentLayerPropRight = value !== "none" ? this.rightLayerInfos[value] : null;
                    if (this.config.showRendering) {
                        this.populateRendererListRight(this.secondaryLayerRight);
                    }

                    params.mosaicRule = this.rightLayerInfos[value].defaultMosaicRule;
                    if (this.secondaryLayerRight.renderingRule) {
                        params.renderingRule = this.secondaryLayerRight.renderingRule;
                    }
                    if (this.secondaryLayerRight.bandIds) {
                        params.bandIds = this.secondaryLayerRight.bandIds;
                    }
                    if (this.secondaryLayerRight.format) {
                        params.format = this.secondaryLayerRight.format;
                    }
                    if (this.secondaryLayerRight.interpolation) {
                        params.interpolation = this.secondaryLayerRight.interpolation;
                    }
                    if (this.secondaryLayerRight.compressionQuality) {
                        params.compressionQuality = this.secondaryLayerRight.compressionQuality;
                    }
                    if (this.secondaryLayerRight.timeInfo && this.secondaryLayerRight.timeInfo.timeExtent) {
                        params.timeExtent = this.secondaryLayerRight.timeInfo.timeExtent;
                    }

                    var popupInfo = "";
                    if (this.secondaryLayerRight.popupInfo) {
                        popupInfo = new PopupTemplate(this.secondaryLayerRight.popupInfo);
                    }
                    this.secondaryLayer = new ArcGISImageServiceLayer(
                        this.secondaryLayerRight.url,
                        {
                            id: this.secondaryLayerRight.id + "_Right",
                            imageServiceParameters: params,
                            visible: true,
                            infoTemplate: popupInfo,
                            opacity: this.secondaryLayerRight.opacity,
                            useMapTime: this.secondaryLayerRight.useMapTime,
                            useMapImage: this.secondaryLayerRight.useMapImage
                        });
                    this.map.addLayer(this.secondaryLayer, this.secondaryLayerIndex);
                    this.map.secondaryLayer = this.secondaryLayer;
                    this.changeDetection.clearResultLayer();

                    this.changeDetection.secondaryLayer = this.secondaryLayer;
                    this.timebook("right");
                    this.refreshSwipe();
                }
                if (registry.byId("rightLayerSelector").get("value") === "MS_696") {
                    if (this.config.renderInfo.landsat[registry.byId("rightLayerRenderer").value]) {
                        html.set(dom.byId("renderDescriptionCompare"), this.config.renderInfo.landsat[registry.byId("rightLayerRenderer").value].description);
                    } else {
                        html.set(dom.byId("renderDescriptionCompare"), 'Spectral Index RFT applied as a rendering rule.');
                    }
                    html.set(dom.byId("sensorDescriptionCompare"), "Landsat 8 OLI, 30m multispectral and multitemporal 8-band imagery, with on-the-fly renderings and indices. Additional Landsat services can be found <a href='https://www.arcgis.com/home/group.html?id=a74dff13f1be4b2ba7264c3315c57077#overview' target='_blank'>here</a>");
                } else if (registry.byId("rightLayerSelector").get("value") === "Sentinel2_2553") {
                    if (this.config.renderInfo.sentinel[registry.byId("rightLayerRenderer").value]) {
                        html.set(dom.byId("renderDescriptionCompare"), this.config.renderInfo.sentinel[registry.byId("rightLayerRenderer").value].description);
                    } else {
                        html.set(dom.byId("renderDescriptionCompare"), 'Spectral Index RFT applied as a rendering rule.');
                    }
                    html.set(dom.byId("sensorDescriptionCompare"), "Sentinel-2, 10m Multispectral, Multitemporal, 13-band images with visual renderings and indices. - <a href='https://www.arcgis.com/home/item.html?id=fd61b9e0c69c4e14bebd50a9a968348c' target='_blank'>Find here</a>");
                } else {
                    html.set(dom.byId("renderDescriptionCompare"), "Basemap");
                    html.set(dom.byId("sensorDescriptionCompare"), "Basemap");
                }
                if (registry.byId("leftLayerSelector").value === registry.byId("rightLayerSelector").value) {
                    html.set("itals", this.nls.sameDateWarning);
                    domStyle.set("itals", "display", "block");
                } else {
                    html.set("itals", this.nls.sameSensorRule);
                    domStyle.set("itals", "display", "block");
                }
            },

            populateRendererListRight: function (layer) {
                registry.byId("rightLayerRenderer").removeOption(registry.byId("rightLayerRenderer").getOptions());
                var currentRenderer = layer.renderingRule ? layer.renderingRule : null;
                //     if (this.map.getLayer(registry.byId('rightLayerSelector').value + "_Right")) {
                //     if (this.map.getLayer(registry.byId('rightLayerSelector').value + "_Right").renderer || this.map.getLayer(registry.byId('rightLayerSelector').value + "_Right").bandIds) {
                //         this.currentLayerPropRight.defaultRenderer = this.map.getLayer(registry.byId('rightLayerSelector').value + "_Right").renderer;
                //         this.currentLayerPropRight.defaultBandIds = this.map.getLayer(registry.byId('rightLayerSelector').value + "_Right").bandIds;
                //         this.currentLayerPropRight.defaultRenderingRule = this.map.getLayer(registry.byId('rightLayerSelector').value + "_Right").renderingRule;
                //     } 
                // }
                for (var a in layer.rasterFunctionInfos) {
                    // if (this.currentLayerPropRight.defaultRenderer || this.currentLayerPropRight.defaultBandIds) {
                    //     var rendererExist = true;
                    // }
                    if (currentRenderer && currentRenderer.functionName && layer.rasterFunctionInfos[a].name === currentRenderer.functionName) {
                        var setRenderer = true;
                    }
                    registry.byId("rightLayerRenderer").addOption({ label: layer.rasterFunctionInfos[a].name, value: layer.rasterFunctionInfos[a].name });
                }

                if (registry.byId("rightLayerRenderer").getOptions().length > 0) {
                    // if (rendererExist) {
                    //     registry.byId("rightLayerRenderer").addOption({ label: "Default", value: "default" });
                    //     this.defaultRendererRight = this.currentLayerPropRight.defaultRenderer;
                    //     this.defaultBandIdsRight = this.currentLayerPropRight.defaultBandIds;
                    //     this.defaultRenderingRuleRight = this.currentLayerPropRight.defaultRenderingRule;
                    // }
                    if (setRenderer) {
                        registry.byId("rightLayerRenderer").set("value", currentRenderer.functionName);
                    } else {
                        registry.byId("rightLayerRenderer").addOption({ label: currentRenderer.functionName, value: "spectralindexvalue" });
                        registry.byId("rightLayerRenderer").set('value', 'spectralindexvalue');
                    }
                    domStyle.set("rightRenderer", "display", "block");
                    registry.byId("rightLayerRenderer").addOption({ label: "Custom Bands", value: "Build" });
                    registry.byId("rightLayerRenderer").addOption({ label: "Custom Index", value: "Index" });

                    if (registry.byId("secondaryRenderNAME").get("value")) {
                        registry.byId("rightLayerRenderer").set("value", registry.byId("secondaryRenderNAME").get("value"));
                        registry.byId("secondaryRenderNAME").set("value", "");
                    } else if (this.map.secondaryAppRend) {
                        registry.byId("rightLayerRenderer").addOption({ label: this.map.secondaryAppRend.name, value: "spectralindexvalue" });
                        registry.byId("rightLayerRenderer").set("value", "spectralindexvalue");
                        var tempRend = new RasterFunction(this.map.secondaryAppRend);
                        setTimeout(lang.hitch(this, function() {
                            this.secondaryLayer.setRenderingRule(tempRend);
                        }), 5000);
                        
                    }
                    if (this.map.getLayer(registry.byId('rightLayerSelector').value).currentVersion > 10.60) {
                        registry.byId("rightLayerRenderer").addOption({ label: "Spectral Index", value: "Spectral Index" });
                    }
                } else {
                    if (this.map.getLayer(registry.byId('leftLayerSelector').value).currentVersion > 10.60) {
                        registry.byId("leftLayerRenderer").addOption({ label: "Spectral Index", value: "Spectral Index" });
                    } else {
                        domStyle.set("rightRenderer", "display", "none");
                    }
                }
            },

            setRenderingRuleRight: function (value) {
                if (this.secondaryLayer) {
                    if (value === "default") {
                        domStyle.set("buildExtensionRight", "display", "none");
                        domStyle.set("formulaRight", "display", "none");
                        domStyle.set("indexExtensionRight", "display", "none");
                        this.secondaryLayer.setBandIds(this.defaultBandIdsRight, true);
                        this.secondaryLayer.setRenderingRule(this.defaultRenderingRuleRight, true);
                        this.secondaryLayer.setRenderer(this.defaultRendererRight);

                    } else if (value === 'spectralindexvalue') {
                        domStyle.set("buildExtensionRight", "display", "none");
                        domStyle.set("formulaRight", "display", "none");
                        domStyle.set("indexExtensionRight", "display", "none");
                        if (this.map.spectralRendererSec) {
                            this.secondaryLayer.setRenderingRule(this.map.spectralRendererSec);
                        } else {
                            this.secondaryLayer.setRenderingRule(this.map.spectralRenderer);
                        }
                        
                    } else if (value === "Spectral Index") {
                        domStyle.set("buildExtensionRight", "display", "none");
                        domStyle.set("formulaRight", "display", "none");
                        domStyle.set("indexExtensionRight", "display", "none");
                        document.getElementsByClassName('icon-node')[2].click();

                    } else if (value === "Build") {
                        domStyle.set("buildExtensionRight", "display", "block");
                        domStyle.set("formulaRight", "display", "none");
                        domStyle.set("indexExtensionRight", "display", "none");
                        registry.byId("bnd1Right").removeOption(registry.byId("bnd1Right").getOptions());
                        registry.byId("bnd2Right").removeOption(registry.byId("bnd2Right").getOptions());
                        registry.byId("bnd3Right").removeOption(registry.byId("bnd3Right").getOptions());

                        if (this.secondaryLayer.url === this.config.urlLandsatMS) {
                            registry.byId("bnd1Right").addOption({ label: "Coastal(1)", value: "1" });
                            registry.byId("bnd1Right").addOption({ label: "Blue(2)", value: "2" });
                            registry.byId("bnd1Right").addOption({ label: "Green(3)", value: "3" });
                            registry.byId("bnd1Right").addOption({ label: "Red(4)", value: "4" });
                            registry.byId("bnd1Right").addOption({ label: "NIR(5)", value: "5" });
                            registry.byId("bnd1Right").addOption({ label: "SWIR1(6)", value: "6" });
                            registry.byId("bnd1Right").addOption({ label: "SWIR2(7)", value: "7" });
                            registry.byId("bnd1Right").addOption({ label: "Cirrus(8)", value: "8" });
                            registry.byId("bnd1Right").set("value", "6");

                            registry.byId("bnd2Right").addOption({ label: "Coastal(1)", value: "1" });
                            registry.byId("bnd2Right").addOption({ label: "Blue(2)", value: "2" });
                            registry.byId("bnd2Right").addOption({ label: "Green(3)", value: "3" });
                            registry.byId("bnd2Right").addOption({ label: "Red(4)", value: "4" });
                            registry.byId("bnd2Right").addOption({ label: "NIR(5)", value: "5" });
                            registry.byId("bnd2Right").addOption({ label: "SWIR1(6)", value: "6" });
                            registry.byId("bnd2Right").addOption({ label: "SWIR2(7)", value: "7" });
                            registry.byId("bnd2Right").addOption({ label: "Cirrus(8)", value: "8" });
                            registry.byId("bnd2Right").set("value", "5");

                            registry.byId("bnd3Right").addOption({ label: "Coastal(1)", value: "1" });
                            registry.byId("bnd3Right").addOption({ label: "Blue(2)", value: "2" });
                            registry.byId("bnd3Right").addOption({ label: "Green(3)", value: "3" });
                            registry.byId("bnd3Right").addOption({ label: "Red(4)", value: "4" });
                            registry.byId("bnd3Right").addOption({ label: "NIR(5)", value: "5" });
                            registry.byId("bnd3Right").addOption({ label: "SWIR1(6)", value: "6" });
                            registry.byId("bnd3Right").addOption({ label: "SWIR2(7)", value: "7" });
                            registry.byId("bnd3Right").addOption({ label: "Cirrus(8)", value: "8" });
                            registry.byId("bnd3Right").set("value", "2");

                            registry.byId("stretchoptionsRight").set("value", "clip2");
                            registry.byId("gammaoptionsRight").set("value", "4");
                        } else if (this.secondaryLayer.url === this.config.urlSentinel) {
                            registry.byId("bnd1Right").addOption({ label: "Coastal(1)", value: "1" });
                            registry.byId("bnd1Right").addOption({ label: "Blue(2)", value: "2" });
                            registry.byId("bnd1Right").addOption({ label: "Green(3)", value: "3" });
                            registry.byId("bnd1Right").addOption({ label: "Red(4)", value: "4" });
                            registry.byId("bnd1Right").addOption({ label: "VRE(5)", value: "5" });
                            registry.byId("bnd1Right").addOption({ label: "VRE(6)", value: "6" });
                            registry.byId("bnd1Right").addOption({ label: "VRE(7)", value: "7" });
                            registry.byId("bnd1Right").addOption({ label: "NIR(8)", value: "8" });
                            registry.byId("bnd1Right").addOption({ label: "NarrowNIR(8A)", value: "9" });
                            registry.byId("bnd1Right").addOption({ label: "Water Vapor(9)", value: "10" });
                            registry.byId("bnd1Right").addOption({ label: "Cirrus(10)", value: "11" });
                            registry.byId("bnd1Right").addOption({ label: "SWIR(11)", value: "12" });
                            registry.byId("bnd1Right").addOption({ label: "SWIR(12)", value: "13" });
                            registry.byId("bnd1Right").set("value", "12");

                            registry.byId("bnd2Right").addOption({ label: "Coastal(1)", value: "1" });
                            registry.byId("bnd2Right").addOption({ label: "Blue(2)", value: "2" });
                            registry.byId("bnd2Right").addOption({ label: "Green(3)", value: "3" });
                            registry.byId("bnd2Right").addOption({ label: "Red(4)", value: "4" });
                            registry.byId("bnd2Right").addOption({ label: "VRE(5)", value: "5" });
                            registry.byId("bnd2Right").addOption({ label: "VRE(6)", value: "6" });
                            registry.byId("bnd2Right").addOption({ label: "VRE(7)", value: "7" });
                            registry.byId("bnd2Right").addOption({ label: "NIR(8)", value: "8" });
                            registry.byId("bnd2Right").addOption({ label: "NarrowNIR(8A)", value: "9" });
                            registry.byId("bnd2Right").addOption({ label: "Water Vapor(9)", value: "10" });
                            registry.byId("bnd2Right").addOption({ label: "Cirrus(10)", value: "11" });
                            registry.byId("bnd2Right").addOption({ label: "SWIR(11)", value: "12" });
                            registry.byId("bnd2Right").addOption({ label: "SWIR(12)", value: "13" });
                            registry.byId("bnd2Right").set("value", "8");

                            registry.byId("bnd3Right").addOption({ label: "Coastal(1)", value: "1" });
                            registry.byId("bnd3Right").addOption({ label: "Blue(2)", value: "2" });
                            registry.byId("bnd3Right").addOption({ label: "Green(3)", value: "3" });
                            registry.byId("bnd3Right").addOption({ label: "Red(4)", value: "4" });
                            registry.byId("bnd3Right").addOption({ label: "VRE(5)", value: "5" });
                            registry.byId("bnd3Right").addOption({ label: "VRE(6)", value: "6" });
                            registry.byId("bnd3Right").addOption({ label: "VRE(7)", value: "7" });
                            registry.byId("bnd3Right").addOption({ label: "NIR(8)", value: "8" });
                            registry.byId("bnd3Right").addOption({ label: "NarrowNIR(8A)", value: "9" });
                            registry.byId("bnd3Right").addOption({ label: "Water Vapor(9)", value: "10" });
                            registry.byId("bnd3Right").addOption({ label: "Cirrus(10)", value: "11" });
                            registry.byId("bnd3Right").addOption({ label: "SWIR(11)", value: "12" });
                            registry.byId("bnd3Right").addOption({ label: "SWIR(12)", value: "13" });
                            registry.byId("bnd3Right").set("value", "2");

                            registry.byId("stretchoptionsRight").set("value", "clip1");
                            registry.byId("gammaoptionsRight").set("value", "5");
                        }
                        if (registry.byId("redBuildSec").value && registry.byId("blueBuildSec").value && registry.byId("greenBuildSec").value && registry.byId("stretchBuildSec").value && registry.byId("gammaBuildSec").value) {
                            registry.byId("bnd1Right").set("value", registry.byId("redBuildSec").get("value"));
                            registry.byId("bnd2Right").set("value", registry.byId("blueBuildSec").get("value"));
                            registry.byId("bnd3Right").set("value", registry.byId("greenBuildSec").get("value"));
                            registry.byId("stretchoptionsRight").set("value", registry.byId("stretchBuildSec").get("value"));
                            registry.byId("gammaoptionsRight").set("value", registry.byId("gammaBuildSec").get("value"));

                            registry.byId("redBuildSec").set("value", "");
                            registry.byId("blueBuildSec").set("value", "");
                            registry.byId("greenBuildSec").set("value", "");
                            registry.byId("stretchBuildSec").set("value", "");
                            registry.byId("gammaBuildSec").set("value", "");

                            dom.byId("applyRight").click();
                        }

                    } else if (value === "Index") {
                        domStyle.set("buildExtensionRight", "display", "none");
                        domStyle.set("formulaRight", "display", "block");
                        domStyle.set("indexExtensionRight", "display", "block");
                        registry.byId("bandARight").removeOption(registry.byId("bandARight").getOptions());
                        registry.byId("bandBRight").removeOption(registry.byId("bandBRight").getOptions());

                        if (this.secondaryLayer.url === this.config.urlLandsatMS) {
                            registry.byId("bandARight").addOption({ label: "Coastal(1)", value: "1" });
                            registry.byId("bandARight").addOption({ label: "Blue(2)", value: "2" });
                            registry.byId("bandARight").addOption({ label: "Green(3)", value: "3" });
                            registry.byId("bandARight").addOption({ label: "Red(4)", value: "4" });
                            registry.byId("bandARight").addOption({ label: "NIR(5)", value: "5" });
                            registry.byId("bandARight").addOption({ label: "SWIR1(6)", value: "6" });
                            registry.byId("bandARight").addOption({ label: "SWIR2(7)", value: "7" });
                            registry.byId("bandARight").addOption({ label: "Cirrus(8)", value: "8" });
                            registry.byId("bandARight").set("value", "5");

                            registry.byId("bandBRight").addOption({ label: "Coastal(1)", value: "1" });
                            registry.byId("bandBRight").addOption({ label: "Blue(2)", value: "2" });
                            registry.byId("bandBRight").addOption({ label: "Green(3)", value: "3" });
                            registry.byId("bandBRight").addOption({ label: "Red(4)", value: "4" });
                            registry.byId("bandBRight").addOption({ label: "NIR(5)", value: "5" });
                            registry.byId("bandBRight").addOption({ label: "SWIR1(6)", value: "6" });
                            registry.byId("bandBRight").addOption({ label: "SWIR2(7)", value: "7" });
                            registry.byId("bandBRight").addOption({ label: "Cirrus(8)", value: "8" });
                            registry.byId("bandBRight").set("value", "4");

                            registry.byId("OffsetValueRight").set("value", "0");
                            registry.byId("ScaleRight").set("value", "5");
                        } else if (this.secondaryLayer.url === this.config.urlSentinel) {
                            registry.byId("bandARight").addOption({ label: "Coastal(1)", value: "1" });
                            registry.byId("bandARight").addOption({ label: "Blue(2)", value: "2" });
                            registry.byId("bandARight").addOption({ label: "Green(3)", value: "3" });
                            registry.byId("bandARight").addOption({ label: "Red(4)", value: "4" });
                            registry.byId("bandARight").addOption({ label: "VRE(5)", value: "5" });
                            registry.byId("bandARight").addOption({ label: "VRE(6)", value: "6" });
                            registry.byId("bandARight").addOption({ label: "VRE(7)", value: "7" });
                            registry.byId("bandARight").addOption({ label: "NIR(8)", value: "8" });
                            registry.byId("bandARight").addOption({ label: "NarrowNIR(8A)", value: "9" });
                            registry.byId("bandARight").addOption({ label: "Water Vapor(9)", value: "10" });
                            registry.byId("bandARight").addOption({ label: "Cirrus(10)", value: "11" });
                            registry.byId("bandARight").addOption({ label: "SWIR(11)", value: "12" });
                            registry.byId("bandARight").addOption({ label: "SWIR(12)", value: "13" });
                            registry.byId("bandARight").set("value", "8");

                            registry.byId("bandBRight").addOption({ label: "Coastal(1)", value: "1" });
                            registry.byId("bandBRight").addOption({ label: "Blue(2)", value: "2" });
                            registry.byId("bandBRight").addOption({ label: "Green(3)", value: "3" });
                            registry.byId("bandBRight").addOption({ label: "Red(4)", value: "4" });
                            registry.byId("bandBRight").addOption({ label: "VRE(5)", value: "5" });
                            registry.byId("bandBRight").addOption({ label: "VRE(6)", value: "6" });
                            registry.byId("bandBRight").addOption({ label: "VRE(7)", value: "7" });
                            registry.byId("bandBRight").addOption({ label: "NIR(8)", value: "8" });
                            registry.byId("bandBRight").addOption({ label: "NarrowNIR(8A)", value: "9" });
                            registry.byId("bandBRight").addOption({ label: "Water Vapor(9)", value: "10" });
                            registry.byId("bandBRight").addOption({ label: "Cirrus(10)", value: "11" });
                            registry.byId("bandBRight").addOption({ label: "SWIR(11)", value: "12" });
                            registry.byId("bandBRight").addOption({ label: "SWIR(12)", value: "13" });
                            registry.byId("bandBRight").set("value", "4");

                            registry.byId("OffsetValueRight").set("value", "0");
                            registry.byId("ScaleRight").set("value", "5");
                        }
                        if (registry.byId("bandAIndexSec").value && registry.byId("bandBIndexSec").value && registry.byId("offsetIndexSec").value && registry.byId("scaleIndexSec").value && registry.byId("renderIndexSec").value) {
                            registry.byId("bandARight").set("value", registry.byId("bandAIndexSec").get("value"));
                            registry.byId("bandBRight").set("value", registry.byId("bandBIndexSec").get("value"));
                            registry.byId("OffsetValueRight").set("value", registry.byId("offsetIndexSec").get("value"));
                            registry.byId("ScaleRight").set("value", registry.byId("scaleIndexSec").get("value"));
                            registry.byId("colorRampRight").set("value", registry.byId("renderIndexSec").get("value"));

                            registry.byId("bandAIndexSec").set("value", "");
                            registry.byId("bandBIndexSec").set("value", "");
                            registry.byId("offsetIndexSec").set("value", "");
                            registry.byId("scaleIndexSec").set("value", "");
                            registry.byId("renderIndexSec").set("value", "");

                            dom.byId("applyIndexRight").click();
                        }
                    }

                    else {
                        domStyle.set("buildExtensionRight", "display", "none");
                        domStyle.set("formulaRight", "display", "none");
                        domStyle.set("indexExtensionRight", "display", "none");
                        this.secondaryLayer.setBandIds([], true);
                        this.secondaryLayer.setRenderer(null);
                        this.secondaryLayer.setRenderingRule(new RasterFunction({ "rasterFunction": value }));
                    }
                    this.secondaryMosaic = registry.byId("secondOBJECTID").get("value");
                    if (this.secondaryMosaic) {
                        registry.byId("imageSelectorRight").set("checked", true);
                        registry.byId("secondOBJECTID").set("value", "");
                        //this.setFilterDiv();
                    }
                    if (registry.byId("rightLayerSelector").get("value") === "MS_696") {
                        if (this.config.renderInfo.landsat[registry.byId("rightLayerRenderer").value]) {
                            html.set(dom.byId("renderDescriptionCompare"), this.config.renderInfo.landsat[registry.byId("rightLayerRenderer").value].description);
                        } else {
                            html.set(dom.byId("renderDescriptionCompare"), 'Spectral Index RFT applied as a rendering rule.');
                        }
                    } else if (registry.byId("rightLayerSelector").get("value") === "Sentinel2_2553") {
                        if (this.config.renderInfo.sentinel[registry.byId("rightLayerRenderer").value]) {
                            html.set(dom.byId("renderDescriptionCompare"), this.config.renderInfo.sentinel[registry.byId("rightLayerRenderer").value].description);
                        } else {
                            html.set(dom.byId("renderDescriptionCompare"), 'Spectral Index RFT applied as a rendering rule.');
                        }
                    } else {
                        html.set(dom.byId("renderDescriptionCompare"), "Basemap");
                    }
                }
                this.refreshSwipe();
            },

            stretchfnLeft: function () {
                registry.byId("redBuild").set("value", registry.byId("bnd1Left").value);
                registry.byId("blueBuild").set("value", registry.byId("bnd2Left").value);
                registry.byId("greenBuild").set("value", registry.byId("bnd3Left").value);
                registry.byId("stretchBuild").set("value", registry.byId("stretchoptionsLeft").value);
                registry.byId("gammaBuild").set("value", registry.byId("gammaoptionsLeft").value);

                this.gammaval = registry.byId("gammaoptionsLeft").get("value");
                this.gammacomputeLeft();
                var abc = new RasterFunction();
                abc.functionName = 'Stretch';
                var args = {};
                var type = registry.byId("stretchoptionsLeft").get("value");

                this.primaryLayer.setBandIds([parseInt(registry.byId("bnd1Left").get("value")) - 1, parseInt(registry.byId("bnd2Left").get("value")) - 1, parseInt(registry.byId("bnd3Left").get("value")) - 1], false);
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
                            if (this.primaryLayer.url === this.config.urlSentinel) {
                                args.Statistics = [[0, 3000, 1500, 1], [0, 3000, 1500, 1], [0, 3000, 1500, 1]];
                            } else if (this.primaryLayer.url === this.config.urlLandsatMS) {
                                args.Statistics = [[0, 4000, 1000, 1], [0, 2000, 1000, 1], [0, 2000, 1000, 1]];
                            }
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
                            if (this.primaryLayer.url === this.config.urlSentinel) {
                                args.Statistics = [[8000, 10000, 8000, 1], [8000, 10000, 8000, 1], [8000, 10000, 8000, 1]];
                            } else if (this.primaryLayer.url === this.config.urlLandsatMS) {
                                args.Statistics = [[8000, 10000, 9000, 1], [8000, 10000, 9000, 1], [8000, 10000, 9000, 1]];
                            }
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
                            if (this.primaryLayer.url === this.config.urlSentinel) {
                                args.Statistics = [[9000, 10000, 9000, 1], [9000, 10000, 9000, 1], [9000, 10000, 9000, 1]];
                            } else if (this.primaryLayer.url === this.config.urlLandsatMS) {
                                args.Statistics = [[9000, 10000, 9500, 1], [9000, 10000, 9500, 1], [9000, 10000, 9500, 1]];
                            }
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
                this.type = registry.byId("stretchoptionsLeft").get("value");
                this.band1 = registry.byId("bnd1Left").get("value");
                this.band2 = registry.byId("bnd2Left").get("value");
                this.band3 = registry.byId("bnd3Left").get("value");
                this.gamma = this.gammaval;
                this.saveRenderer = abc;
                this.layerflag = false;
                //html.set(dom.byId("rendererInformation"), "&nbsp;&nbsp;Rendering:&nbsp;" + "Stretch with Bands - " + this.band1 + "," + this.band2 + "," + this.band3);              
            },

            stretchfnRight: function () {
                registry.byId("redBuildSec").set("value", registry.byId("bnd1Right").value);
                registry.byId("blueBuildSec").set("value", registry.byId("bnd2Right").value);
                registry.byId("greenBuildSec").set("value", registry.byId("bnd3Right").value);
                registry.byId("stretchBuildSec").set("value", registry.byId("stretchoptionsRight").value);
                registry.byId("gammaBuildSec").set("value", registry.byId("gammaoptionsRight").value);

                this.gammavalRight = registry.byId("gammaoptionsRight").get("value");
                this.gammacomputeRight();
                var abc = new RasterFunction();
                abc.functionName = 'Stretch';
                var args = {};
                var type = registry.byId("stretchoptionsRight").get("value");

                this.secondaryLayer.setBandIds([parseInt(registry.byId("bnd1Right").get("value")) - 1, parseInt(registry.byId("bnd2Right").get("value")) - 1, parseInt(registry.byId("bnd3Right").get("value")) - 1], false);
                switch (type) {
                    case 'none':
                        {
                            args.StretchType = 0;
                            args.UseGamma = this.gvalueRight;
                            if (this.gvalueRight) {
                                args.Gamma = [parseFloat((this.valueRight).toFixed(2)), parseFloat((this.valueRight).toFixed(2)), parseFloat((this.valueRight).toFixed(2))];
                            }
                            break;
                        }
                    case 'minmax':
                        {
                            args.StretchType = 5;
                            args.Min = 0;
                            args.Max = 255;
                            args.UseGamma = this.gvalueRight;
                            if (this.gvalueRight) {

                                args.Gamma = [parseFloat(this.valueRight.toFixed(2)), parseFloat(this.valueRight.toFixed(2)), parseFloat(this.valueRight.toFixed(2))];
                            }
                            args.DRA = true;
                            break;
                        }
                    case 'standard':
                        {
                            args.StretchType = 3;
                            args.NumberofStandardDeviations = 2;
                            args.DRA = true;
                            args.UseGamma = this.gvalueRight;
                            if (this.gvalueRight) {
                                args.Gamma = [parseFloat(this.valueRight.toFixed(2)), parseFloat(this.valueRight.toFixed(2)), parseFloat(this.valueRight.toFixed(2))];
                            }
                            break;
                        }
                    case 'standard1':
                        {
                            args.StretchType = 3;
                            args.NumberofStandardDeviations = 3.0;
                            args.DRA = true;
                            args.UseGamma = this.gvalueRight;
                            if (this.gvalueRight) {
                                args.Gamma = [parseFloat(this.valueRight.toFixed(2)), parseFloat(this.valueRight.toFixed(2)), parseFloat(this.valueRight.toFixed(2))];
                            }
                            break;
                        }
                    case 'clip':
                        {
                            args.StretchType = 6;
                            args.MinPercent = 2.0;
                            args.MaxPercent = 2.0;
                            args.UseGamma = this.gvalueRight;
                            if (this.gvalueRight) {
                                args.Gamma = [parseFloat(this.valueRight.toFixed(2)), parseFloat(this.valueRight.toFixed(2)), parseFloat(this.valueRight.toFixed(2))];
                            }
                            args.DRA = true;
                            break;
                        }
                    case 'clip1':
                        {
                            args.StretchType = 6;
                            args.MinPercent = 0.5;
                            args.MaxPercent = 0.5;
                            args.UseGamma = this.gvalueRight;
                            if (this.gvalueRight) {
                                args.Gamma = [parseFloat(this.valueRight.toFixed(2)), parseFloat(this.valueRight.toFixed(2)), parseFloat(this.valueRight.toFixed(2))];
                            }
                            args.DRA = true;
                            break;
                        }
                    case 'clip2':
                        {
                            args.StretchType = 6;
                            args.MinPercent = 0.1;
                            args.MaxPercent = 0.1;
                            args.UseGamma = this.gvalueRight;
                            if (this.gvalueRight) {
                                args.Gamma = [parseFloat(this.valueRight.toFixed(2)), parseFloat(this.valueRight.toFixed(2)), parseFloat(this.valueRight.toFixed(2))];
                            }
                            args.DRA = true;
                            break;
                        }
                    case 'dark':
                        {
                            args.StretchType = 5;

                            args.Min = 0.0;
                            args.Max = 255.0;
                            if (this.secondaryLayer.url === this.config.urlSentinel) {
                                args.Statistics = [[0, 3000, 1500, 1], [0, 3000, 1500, 1], [0, 3000, 1500, 1]];
                            } else if (this.secondaryLayer.url === this.config.urlLandsatMS) {
                                args.Statistics = [[0, 4000, 1000, 1], [0, 2000, 1000, 1], [0, 2000, 1000, 1]];
                            }
                            args.UseGamma = this.gvalueRight;
                            if (this.gvalueRight) {

                                args.Gamma = [parseFloat(this.valueRight.toFixed(2)), parseFloat(this.valueRight.toFixed(2)), parseFloat(this.valueRight.toFixed(2))];
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
                            args.UseGamma = this.gvalueRight;
                            if (this.gvalueRight) {

                                args.Gamma = [parseFloat(this.valueRight.toFixed(2)), parseFloat(this.valueRight.toFixed(2)), parseFloat(this.valueRight.toFixed(2))];
                            }
                            args.DRA = false;
                            break;
                        }
                    case 'light':
                        {
                            args.StretchType = 5;

                            args.Min = 0.0;
                            args.Max = 255.0;
                            args.UseGamma = this.gvalueRight;
                            if (this.secondaryLayer.url === this.config.urlSentinel) {
                                args.Statistics = [[8000, 10000, 8000, 1], [8000, 10000, 8000, 1], [8000, 10000, 8000, 1]];
                            } else if (this.secondaryLayer.url === this.config.urlLandsatMS) {
                                args.Statistics = [[8000, 10000, 9000, 1], [8000, 10000, 9000, 1], [8000, 10000, 9000, 1]];
                            }
                            if (this.gvalueRight) {

                                args.Gamma = [parseFloat(this.valueRight.toFixed(2)), parseFloat(this.valueRight.toFixed(2)), parseFloat(this.valueRight.toFixed(2))];
                            }
                            args.DRA = false;
                            break;
                        }
                    case 'vlight':
                        {
                            args.StretchType = 5;

                            args.Min = 0.0;
                            args.Max = 255.0;
                            args.UseGamma = this.gvalueRight;
                            if (this.secondaryLayer.url === this.config.urlSentinel) {
                                args.Statistics = [[9000, 10000, 9000, 1], [9000, 10000, 9000, 1], [9000, 10000, 9000, 1]];
                            } else if (this.secondaryLayer.url === this.config.urlLandsatMS) {
                                args.Statistics = [[9000, 10000, 9500, 1], [9000, 10000, 9500, 1], [9000, 10000, 9500, 1]];
                            }
                            if (this.gvalueRight) {

                                args.Gamma = [parseFloat(this.valueRight.toFixed(2)), parseFloat(this.valueRight.toFixed(2)), parseFloat(this.valueRight.toFixed(2))];
                            }
                            args.DRA = false;
                            break;
                        }
                    case 'full':
                        {
                            args.StretchType = 5;

                            args.Min = 0.0;
                            args.Max = 255.0;
                            args.UseGamma = this.gvalueRight;
                            args.Statistics = [[0, 10000, 5000, 1], [0, 10000, 5000, 1], [0, 10000, 5000, 1]];
                            if (this.gvalueRight) {

                                args.Gamma = [parseFloat(this.valueRight.toFixed(2)), parseFloat(this.valueRight.toFixed(2)), parseFloat(this.valueRight.toFixed(2))];
                            }
                            args.DRA = false;
                            break;
                        }
                }
                abc.functionArguments = args;
                abc.variableName = "Raster";

                this.secondaryLayer.setRenderingRule(abc, false);
                this.typeRight = registry.byId("stretchoptionsRight").get("value");
                this.band1Right = registry.byId("bnd1Right").get("value");
                this.band2Right = registry.byId("bnd2Right").get("value");
                this.band3Right = registry.byId("bnd3Right").get("value");
                this.gammaRight = this.gammavalRight;
                this.saveRendererRight = abc;
                this.layerflagRight = false;
                //html.set(dom.byId("rendererInformation"), "&nbsp;&nbsp;Rendering:&nbsp;" + "Stretch with Bands - " + this.band1 + "," + this.band2 + "," + this.band3);

            },

            gammacomputeLeft: function () {
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

            gammacomputeRight: function () {
                if (this.gammavalRight === "0") {
                    this.gvalueRight = false;
                } else {
                    this.gvalueRight = true;
                }
                switch (this.gammavalRight) {
                    case '1':
                        {
                            this.valueRight = 0.3;
                            break;
                        }
                    case '2':
                        {
                            this.valueRight = 0.5;
                            break;
                        }
                    case '3':
                        {
                            this.valueRight = 0.8;
                            break;
                        }
                    case '4':
                        {
                            this.valueRight = 1;
                            break;
                        }
                    case '5':
                        {
                            this.valueRight = 1.2;
                            break;
                        }
                    case '6':
                        {
                            this.valueRight = 2;
                            break;
                        }
                    case '7':
                        {
                            this.valueRight = 4;
                            break;
                        }
                }
            },

            reset1Left: function () {
                var abc1 = new RasterFunction();
                abc1.functionName = "";
                var args1 = {};
                this.primaryLayer.setBandIds([], true);
                abc1.functionArguments = args1;
                abc1.variableName = "Raster";
                this.primaryLayer.setRenderingRule(abc1, false);
                if (this.primaryLayer.url === this.config.urlSentinel) {
                    registry.byId("bnd1Left").set("value", "12");
                    registry.byId("bnd2Left").set("value", "8");
                    registry.byId("bnd3Left").set("value", "2");
                    registry.byId("stretchoptionsLeft").set("value", "clip1");
                    registry.byId("gammaoptionsLeft").set("value", "5");
                } else if (this.primaryLayer.url === this.config.urlLandsatMS) {
                    registry.byId("bnd1Left").set("value", "6");
                    registry.byId("bnd2Left").set("value", "5");
                    registry.byId("bnd3Left").set("value", "2");
                    registry.byId("stretchoptionsLeft").set("value", "clip2");
                    registry.byId("gammaoptionsLeft").set("value", "4");
                }
            },

            reset1Right: function () {
                var abc1 = new RasterFunction();
                abc1.functionName = "";
                var args1 = {};
                this.secondaryLayer.setBandIds([], true);
                abc1.functionArguments = args1;
                abc1.variableName = "Raster";
                this.secondaryLayer.setRenderingRule(abc1, false);
                if (this.secondaryLayer.url === this.config.urlSentinel) {
                    registry.byId("bnd1Right").set("value", "12");
                    registry.byId("bnd2Right").set("value", "8");
                    registry.byId("bnd3Right").set("value", "2");
                    registry.byId("stretchoptionsRight").set("value", "clip1");
                    registry.byId("gammaoptionsRight").set("value", "5");
                } else if (this.secondaryLayer.url === this.config.urlLandsatMS) {
                    registry.byId("bnd1Right").set("value", "6");
                    registry.byId("bnd2Right").set("value", "5");
                    registry.byId("bnd3Right").set("value", "2");
                    registry.byId("stretchoptionsRight").set("value", "clip2");
                    registry.byId("gammaoptionsRight").set("value", "4");
                }
            },

            indexFunctionLeft: function () {
                registry.byId("bandAIndex").set("value", registry.byId("bandALeft").value);
                registry.byId("bandBIndex").set("value", registry.byId("bandBLeft").value);
                registry.byId("offsetIndex").set("value", registry.byId("OffsetValueLeft").value);
                registry.byId("scaleIndex").set("value", registry.byId("ScaleLeft").value);
                registry.byId("renderIndex").set("value", registry.byId("colorRampLeft").value);

                var A = "B" + registry.byId("bandALeft").get("value");
                var B = "B" + registry.byId("bandBLeft").get("value");
                if (registry.byId("ScaleLeft").get("value")) {
                    var S = parseInt(registry.byId("ScaleLeft").get("value"));
                }
                else {
                    var S = 1;
                }
                if (registry.byId("OffsetValueLeft").get("value")) {
                    var O = parseInt(registry.byId("OffsetValueLeft").get("value"));
                }
                else {
                    var O = 0;
                }
                // if (value === "Custom") {
                //     this.customProp = [registry.byId("bandALeft").get("value"), registry.byId("bandBLeft").get("value"), registry.byId("colorRampLeft").get("value"), O, S];
                // }
                var raster = new RasterFunction();
                raster.functionName = "BandArithmetic";
                if (registry.byId("colorRampLeft").get("value") === "custom" || registry.byId("colorRampLeft").get("value") === "moisture") {
                    raster.outputPixelType = "U8";
                }
                else {
                    raster.outputPixelType = "F32";
                }
                var args = {};
                args.Method = 0;
                // if (value === "SAVI") {
                //     args.BandIndexes = O + "+" + "(" + S + "*" + "(1.5*((" + A + "-" + B + ")/(" + A + "+" + B + " +5000))))";
                // }
                // else {
                args.BandIndexes = O + "+" + "(" + S + "*" + "((" + A + "-" + B + ")/(" + A + "+" + B + ")))";
                //}
                raster.functionArguments = args;

                if (registry.byId("colorRampLeft").get("value") !== "custom" && registry.byId("colorRampLeft").get("value") !== "moisture") {
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
                if (registry.byId("colorRampLeft").get("value") === "custom") {
                    args1.Colormap = this.config.colormap;
                    args1.Raster = raster;
                } else if (registry.byId("colorRampLeft").get("value") === "moisture") {
                    args1.Colormap = this.config.moisture;
                    args1.Raster = raster;
                } else {
                    args1.ColorRamp = registry.byId("colorRampLeft").get("value");
                    args1.Raster = raster2;
                }
                raster3.functionArguments = args1;
                var layer = this.primaryLayer;

                if (layer.format !== "lerc") {
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

                    var newLayer = new ArcGISImageServiceLayer(this.primaryLayer.url, {
                        imageServiceParameters: params,
                        visible: true,
                        id: this.primaryLayer.id
                    });

                    if (this.map.getLayer("secondaryLayer")) {
                        this.map.addLayer(newLayer, 2);
                    }
                    else {
                        this.map.addLayer(newLayer, 1);
                    }
                    connect.publish("refreshTime", [{ flag: true }]);
                }
            },

            indexFunctionRight: function () {
                registry.byId("bandAIndexSec").set("value", registry.byId("bandARight").value);
                registry.byId("bandBIndexSec").set("value", registry.byId("bandBRight").value);
                registry.byId("offsetIndexSec").set("value", registry.byId("OffsetValueRight").value);
                registry.byId("scaleIndexSec").set("value", registry.byId("ScaleRight").value);
                registry.byId("renderIndexSec").set("value", registry.byId("colorRampRight").value);

                var A = "B" + registry.byId("bandARight").get("value");
                var B = "B" + registry.byId("bandBRight").get("value");
                if (registry.byId("ScaleRight").get("value")) {
                    var S = parseInt(registry.byId("ScaleRight").get("value"));
                }
                else {
                    var S = 1;
                }
                if (registry.byId("OffsetValueRight").get("value")) {
                    var O = parseInt(registry.byId("OffsetValueRight").get("value"));
                }
                else {
                    var O = 0;
                }
                // if (value === "Custom") {
                //     this.customProp = [registry.byId("bandARight").get("value"), registry.byId("bandBRight").get("value"), registry.byId("colorRampRight").get("value"), O, S];
                // }
                var raster = new RasterFunction();
                raster.functionName = "BandArithmetic";
                if (registry.byId("colorRampRight").get("value") === "custom" || registry.byId("colorRampRight").get("value") === "moisture") {
                    raster.outputPixelType = "U8";
                }
                else {
                    raster.outputPixelType = "F32";
                }
                var args = {};
                args.Method = 0;
                // if (value === "SAVI") {
                //     args.BandIndexes = O + "+" + "(" + S + "*" + "(1.5*((" + A + "-" + B + ")/(" + A + "+" + B + " +5000))))";
                // }
                // else {
                args.BandIndexes = O + "+" + "(" + S + "*" + "((" + A + "-" + B + ")/(" + A + "+" + B + ")))";
                //}
                raster.functionArguments = args;

                if (registry.byId("colorRampRight").get("value") !== "custom" && registry.byId("colorRampRight").get("value") !== "moisture") {
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
                if (registry.byId("colorRampRight").get("value") === "custom") {
                    args1.Colormap = this.config.colormap;
                    args1.Raster = raster;
                } else if (registry.byId("colorRampRight").get("value") === "moisture") {
                    args1.Colormap = this.config.moisture;
                    args1.Raster = raster;
                } else {
                    args1.ColorRamp = registry.byId("colorRampRight").get("value");
                    args1.Raster = raster2;
                }
                raster3.functionArguments = args1;
                var layer = this.secondaryLayer;

                if (layer.format !== "lerc") {
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

                    var newLayer = new ArcGISImageServiceLayer(this.secondaryLayer.url, {
                        imageServiceParameters: params,
                        visible: true,
                        id: this.secondaryLayer.id
                    });

                    if (this.map.getLayer("secondaryLayer")) {
                        this.map.addLayer(newLayer, 2);
                    }
                    else {
                        this.map.addLayer(newLayer, 1);
                    }
                    connect.publish("refreshTime", [{ flag: true }]);
                }
            },

            checkLayerProp: function () {
                if (!this.currentLayerProp.imageSelector) {
                    domStyle.set("imageSelectCheckBoxLeft", "display", "none");
                    registry.byId("imageSelectorLeft").set("checked", false);
                } else {
                    domStyle.set("imageSelectCheckBoxLeft", "display", "block");
                    this.defaultMosaicRule = this.currentLayerProp.defaultMosaicRule;
                    if (this.primaryLayer.currentVersion) {
                        var currentVersion = this.primaryLayer.currentVersion;
                        this.checkField(currentVersion);
                    } else {
                        var layersRequest = esriRequest({
                            url: this.primaryLayer.url,
                            content: { f: "json" },
                            handleAs: "json",
                            callbackParamName: "callback"
                        });
                        layersRequest.then(lang.hitch(this, function (data) {
                            var currentVersion = data.currentVersion;
                            this.checkField(currentVersion);
                        }));
                    }
                }
            },

            checkField: function (currentVersion) {
                if (currentVersion >= 10.21) {
                    if (this.map.getLevel() >= this.config.zoomLevel) {
                        if (this.currentLayerProp.imageField && this.currentLayerProp.objectID && this.currentLayerProp.category) {
                            this.imageField = this.currentLayerProp.imageField;
                            this.cloudCover = this.currentLayerProp.cloudCover;
                            for (var a in this.primaryLayer.fields) {
                                if (this.imageField === this.primaryLayer.fields[a].name) {
                                    this.imageFieldType = this.primaryLayer.fields[a].type;
                                    break;
                                }
                            }

                            this.objectID = this.currentLayerProp.objectID;
                            this.categoryField = this.currentLayerProp.category;
                            registry.byId("imageSelectorLeft").set("disabled", false);
                            html.set(document.getElementById("errorDivLeft"), "");
                            this.setSavedState();
                        } else {
                            registry.byId("imageSelectorLeft").set("checked", false);
                            registry.byId("imageSelectorLeft").set("disabled", true);

                            if (!this.currentLayerProp.imageField) {
                                html.set(document.getElementById("errorDivLeft"), this.nls.fieldNotSpec);
                            }
                            else if (!this.currentLayerProp.objectID) {
                                html.set(document.getElementById("errorDivLeft"), this.nls.noObject);
                            }
                            else {
                                html.set(document.getElementById("errorDivLeft"), this.nls.noCategory);
                            }
                        }
                    } else {
                        this.turnOffSelector();
                    }
                } else {
                    registry.byId("imageSelectorLeft").set("checked", false);
                    registry.byId("imageSelectorLeft").set("disabled", true);
                    html.set(document.getElementById("errorDivLeft"), this.nls.serviceError);
                }
            },

            checkLayerPropRight: function () {
                if (!this.currentLayerPropRight.imageSelector) {
                    domStyle.set("imageSelectCheckBoxRight", "display", "none");
                    registry.byId("imageSelectorRight").set("checked", false);
                } else {
                    domStyle.set("imageSelectCheckBoxRight", "display", "block");
                    this.defaultMosaicRule = this.currentLayerPropRight.defaultMosaicRule;
                    // if (!(registry.byId("rightLayerSelector").value === "Sentinel2_2553" && !this.map.secureService)) {
                    if (this.secondaryLayer.currentVersion) {
                        var currentVersion = this.secondaryLayer.currentVersion;
                        this.checkFieldRight(currentVersion);
                    } else {
                        var layersRequest = esriRequest({
                            url: this.secondaryLayer.url,
                            content: { f: "json" },
                            handleAs: "json",
                            callbackParamName: "callback"
                        });
                        layersRequest.then(lang.hitch(this, function (data) {
                            var currentVersion = data.currentVersion;
                            this.checkFieldRight(currentVersion);
                        }));
                    }
                    //}
                }
            },

            checkFieldRight: function (currentVersion) {
                if (currentVersion >= 10.21) {
                    if (this.map.getLevel() >= this.config.zoomLevel) {
                        if (this.currentLayerPropRight.imageField && this.currentLayerPropRight.objectID && this.currentLayerPropRight.category) {
                            this.imageFieldRight = this.currentLayerPropRight.imageField;
                            this.cloudCoverRight = this.currentLayerPropRight.cloudCover;
                            for (var a in this.secondaryLayer.fields) {
                                if (this.imageFieldRight === this.secondaryLayer.fields[a].name) {
                                    this.imageFieldTypeRight = this.secondaryLayer.fields[a].type;
                                    break;
                                }
                            }
                            // if (this.imageFieldTypeRight === "esriFieldTypeDate" && this.config.showRange) {
                            //     domStyle.set("ageDivRight", "display", "block");
                            // }
                            // else {
                            //     domStyle.set("ageDivRight", "display", "none");
                            // }
                            this.objectIDRight = this.currentLayerPropRight.objectID;
                            this.categoryFieldRight = this.currentLayerPropRight.category;
                            registry.byId("imageSelectorRight").set("disabled", false);
                            html.set(document.getElementById("errorDivRight"), "");
                            this.setSavedStateRight();
                        } else {
                            registry.byId("imageSelectorRight").set("checked", false);
                            registry.byId("imageSelectorRight").set("disabled", true);
                            if (!this.currentLayerPropRight.imageField) {
                                html.set(document.getElementById("errorDivRight"), this.nls.fieldNotSpec);

                            } else if (!this.currentLayerPropRight.objectID) {

                                html.set(document.getElementById("errorDivRight"), this.nls.noObject);

                            } else {
                                html.set(document.getElementById("errorDivRight"), this.nls.noCategory);
                            }
                        }
                    } else {
                        this.turnOffSelectorRight();
                    }
                } else {
                    registry.byId("imageSelectorRight").set("checked", false);
                    registry.byId("imageSelectorRight").set("disabled", true);
                    html.set(document.getElementById("errorDivRight"), this.nls.serviceError);
                }
            },

            turnOffSelector: function () {
                if (registry.byId("imageSelectorLeft").checked) {
                    registry.byId("imageSelectorLeft").set("checked", false);
                }
                else {
                    this.setFilterDiv();
                }
                registry.byId("imageSelectorLeft").set("disabled", true);
                html.set(document.getElementById("errorDivLeft"), this.nls.zoomIn);

            },

            turnOffSelectorRight: function () {
                if (registry.byId("imageSelectorRight").checked) {
                    registry.byId("imageSelectorRight").set("checked", false);
                }
                else {
                    this.setFilterDivRight();
                }
                registry.byId("imageSelectorRight").set("disabled", true);
                html.set(document.getElementById("errorDivRight"), this.nls.zoomIn);
            },

            setSavedState: function () {
                if (registry.byId("imageSelectorLeft").checked !== this.currentLayerProp.state) {
                    registry.byId("imageSelectorLeft").set("checked", this.currentLayerProp.state);
                }
                else if (this.currentLayerProp.state) {
                    this.setFilterDiv();
                }
            },

            setSavedStateRight: function () {
                if (registry.byId("imageSelectorRight").checked !== this.currentLayerPropRight.state) {
                    registry.byId("imageSelectorRight").set("checked", this.currentLayerPropRight.state);
                }
                else if (this.currentLayerPropRight.state) {
                    this.setFilterDivRight();
                }
            },

            mapExtentChange: function (evt) {
                if (evt.lod.level >= this.config.zoomLevel) {
                    if (registry.byId("imageSelectorLeft").get("disabled")) {
                        //   if (!(registry.byId("leftLayerSelector").value && !this.map.secureService)) {
                        registry.byId("imageSelectorLeft").set("disabled", false);
                        //   }
                        html.set(document.getElementById("errorDivLeft"), "");
                    }
                    if (registry.byId("imageSelectorRight").get("disabled")) {
                        //   if (!(registry.byId("rightLayerSelector").value && !this.map.secureService)) {
                        registry.byId("imageSelectorRight").set("disabled", false);
                        //    }
                        html.set(document.getElementById("errorDivRight"), "");
                    }

                    var needsUpdate = false;
                    if (evt.levelChange) {
                        var zoomLevelChange = Math.abs(evt.lod.level - this.previousInfo.level);
                        if (zoomLevelChange >= this.mapZoomFactor) {
                            console.info("Large Zoom: ", evt);
                            needsUpdate = true;
                        } else {
                            if (this.previousExtentChangeLevel < this.config.zoomLevel) {
                                console.info("THRESHOLD zoom: ", evt);
                                needsUpdate = true;
                            }
                        }
                    }

                    var panDistance = Math.abs(mathUtils.getLength(evt.extent.getCenter(), this.previousInfo.extent.getCenter()));
                    var previousMapWidth = (this.previousInfo.extent.getWidth() * this.mapWidthPanFactor);
                    if (panDistance > previousMapWidth) {
                        console.info("Large Pan: ", evt);
                        needsUpdate = true;
                    }
                    if (needsUpdate && this.config.autoRefresh) {
                        this.imageSliderRefresh();
                        this.imageSliderRefreshRight();
                    }

                } else {
                    this.turnOffSelector();
                    this.turnOffSelectorRight();
                }
                this.previousExtentChangeLevel = evt.lod.level;
                if (this.primaryLayer) {
                    //  if (!(registry.byId("leftLayerSelector").value && !this.map.secureService)) {
                    if (this.primaryLayer.currentVersion) {
                        var currentVersion = this.primaryLayer.currentVersion;
                        this.checkField(currentVersion);
                    } else {
                        var layersRequest = esriRequest({
                            url: this.primaryLayer.url,
                            content: { f: "json" },
                            handleAs: "json",
                            callbackParamName: "callback"
                        });
                        layersRequest.then(lang.hitch(this, function (data) {
                            var currentVersion = data.currentVersion;
                            this.checkField(currentVersion);
                        }));
                    }
                    // }
                }
                if (this.secondaryLayer) {
                    //  if (!(registry.byId("rightLayerSelector").value && !this.map.secureService)) {
                    if (this.secondaryLayer.currentVersion) {
                        var currentVersion = this.secondaryLayer.currentVersion;
                        this.checkFieldRight(currentVersion);
                    } else {
                        var layersRequest = esriRequest({
                            url: this.secondaryLayer.url,
                            content: { f: "json" },
                            handleAs: "json",
                            callbackParamName: "callback"
                        });
                        layersRequest.then(lang.hitch(this, function (data) {
                            var currentVersion = data.currentVersion;
                            this.checkFieldRight(currentVersion);
                        }));
                    }
                    // }
                }
                if (this.changeToolOn === 1) {
                    this.changeDetection.mapExtentChange(evt);
                }
            },

            setFilterDiv: function () {
                if (registry.byId("imageSelectorLeft").get("checked")) {
                    if (!(registry.byId("leftLayerSelector").value === "Sentinel2_2553" && !this.map.secureService)) {
                        if (registry.byId("imageSelectorRight").get("checked")) {
                            domStyle.set("itals", "display", "none");
                        } else {
                            domStyle.set("itals", "display", "block");
                        }
                        if (!this.slider) {
                            this.imageSliderShow();
                        }
                        else {
                            this.imageSliderRefresh();
                        }
                        domStyle.set("selectorDivLeft", "display", "block");
                        this.leftLayerInfos[this.primaryLayer.id].state = true;

                        // if (domClass.contains("activateChange", "activateChange")) {
                        //     domClass.remove("activateChange", "activateChange");
                        // }
                    } else {
                        IdentityManager.useSignInPage = false;
                        var request = new esriRequest({
                            url: "https://sentinel.arcgis.com/arcgis/rest/services/Sentinel2/ImageServer",
                            content: {
                                "f": "json"
                            },
                            handleAs: "json",
                            callbackParamName: "callback"
                        });
                        request.then(lang.hitch(this, function () {
                            domStyle.set("sentinelTemporal", "display", "none");
                            this.map.secureService = true;
                            var params = new ImageServiceParameters();
                            params.format = "jpgpng";
                            
                            var newSentinel = new ArcGISImageServiceLayer("https://sentinel.arcgis.com/arcgis/rest/services/Sentinel2/ImageServer", {
                                id: "Sentinel2_2553",
                                imageServiceParameters: params,
                                title: "Sentinel 2"
                            });
                            newSentinel.defaultBandIds = this.primaryLayer.defaultBandIds;
                            newSentinel.defaultMosaicRule = this.primaryLayer.defaultMosaicRule;
                            newSentinel.defaultRenderer = this.primaryLayer.defaultRenderer;
                            newSentinel.defaultRenderingRule = this.primaryLayer.defaultRenderingRule;
                            newSentinel.setRenderingRule(this.primaryLayer.renderingRule);
                            //newSentinel.setMosaicRule(this.primaryLayer.mosaicRule);
                            newSentinel.extent = this.primaryLayer.extent;

                            this.map.removeLayer(this.primaryLayer);
                            this.primaryLayer = null;
                            this.map.addLayer(newSentinel);
                            this.primaryLayer = this.map.getLayer(newSentinel.id);
                            this.map.primaryLayer = this.primaryLayer;

                            if (registry.byId("rightLayerSelector").value === "Sentinel2_2553") {
                                var newSentinel2 = new ArcGISImageServiceLayer("https://sentinel.arcgis.com/arcgis/rest/services/Sentinel2/ImageServer", {
                                    id: "Sentinel2_2553_Right",
                                    imageServiceParameters: params
                                });
                                newSentinel2.defaultBandIds = this.secondaryLayer.defaultBandIds;
                                newSentinel2.defaultMosaicRule = this.secondaryLayer.defaultMosaicRule;
                                newSentinel2.defaultRenderer = this.secondaryLayer.defaultRenderer;
                                newSentinel2.defaultRenderingRule = this.secondaryLayer.defaultRenderingRule;
                                newSentinel2.setRenderingRule(this.secondaryLayer.renderingRule);
                                //newSentinel.setMosaicRule(this.secondaryLayer.mosaicRule);
                                newSentinel2.extent = this.secondaryLayer.extent;
                                this.map.removeLayer(this.secondaryLayer);
                                this.secondaryLayer = null;
                                this.map.addLayer(newSentinel2, this.secondaryLayerIndex);
                                this.secondaryLayer = this.map.getLayer(newSentinel2.id);
                                this.map.secondaryLayer = this.secondaryLayer;
                            }

                            this.config.urlSentinel = "https://sentinel.arcgis.com/arcgis/rest/services/Sentinel2/ImageServer";
                            document.getElementById("signInThumbnail").src = "./widgets/ISHeader/images/user.png";
                            document.getElementById("userName").innerHTML = "   Sign Out";

                            if (registry.byId("imageSelectorRight").get("checked")) {
                                domStyle.set("itals", "display", "none");
                            }
                            if (!this.slider) {
                                this.imageSliderShow();
                            }
                            else {
                                this.imageSliderRefresh();
                            }
                            domStyle.set("selectorDivLeft", "display", "block");
                            this.leftLayerInfos[this.primaryLayer.id].state = true;
                            // if (domClass.contains("activateChange", "activateChange")) {
                            //     domClass.remove("activateChange", "activateChange");
                            // }

                        })).otherwise(lang.hitch(this, function () {
                            registry.byId("imageSelectorLeft").set("checked", false);
                            domStyle.set("sentinelTemporal", "display", "block");
                        }));
                    }
                } else {
                    domStyle.set("changeTemplate", "display", "none");
                    if (!domClass.contains("activateChange", "activateChange")) {
                        domClass.add("activateChange", "activateChange");
                    }
                    if (registry.byId("changeDetectioCheckBox").checked) {
                        registry.byId("changeDetectioCheckBox").set("checked", false);
                    }
                    domStyle.set("itals", "display", "block");
                    domStyle.set("selectorDivLeft", "display", "none");
                    this.clearGraphics();

                    if (this.primaryLayer && this.primaryLayer.defaultMosaicRule) {
                        var mr = new MosaicRule(this.currentLayerProp.defaultMosaicRule);
                        this.primaryLayer.setMosaicRule(mr);
                        this.leftLayerInfos[this.primaryLayer.id].state = false;
                    }
                    if (domClass.contains("activateChange", "activateChange")) {
                        domClass.remove("activateChange", "activateChange");
                    }
                    this.timebook("left");
                }
            },

            setFilterDivRight: function () {
                if (registry.byId("imageSelectorRight").get("checked")) {
                    if (!(registry.byId("rightLayerSelector").value === "Sentinel2_2553" && !this.map.secureService)) {
                        if (registry.byId("imageSelectorLeft").get("checked")) {
                            domStyle.set("itals", "display", "none");
                        } else {
                            domStyle.set("itals", "display", "block");
                        }
                        if (!this.sliderRight) {
                            this.imageSliderShowRight();
                        } else {
                            this.imageSliderRefreshRight();
                        }
                        domStyle.set("selectorDivRight", "display", "block");
                        this.rightLayerInfos[this.secondaryLayerRight.id].state = true;
                        // if (domClass.contains("activateChange", "activateChange")) {
                        //     domClass.remove("activateChange", "activateChange");
                        // }
                    } else {
                        IdentityManager.useSignInPage = false;
                        var request = new esriRequest({
                            url: "https://sentinel.arcgis.com/arcgis/rest/services/Sentinel2/ImageServer",
                            content: {
                                "f": "json"
                            },
                            handleAs: "json",
                            callbackParamName: "callback"
                        });
                        request.then(lang.hitch(this, function () {
                            domStyle.set("sentinelTemporal", "display", "none");
                            this.map.secureService = true;
                            var params = new ImageServiceParameters();
                            params.format = "jpgpng";
                           
                            var newSentinel = new ArcGISImageServiceLayer("https://sentinel.arcgis.com/arcgis/rest/services/Sentinel2/ImageServer", {
                                id: "Sentinel2_2553_Right",
                                imageServiceParameters: params
                            });
                            newSentinel.defaultBandIds = this.secondaryLayer.defaultBandIds;
                            newSentinel.defaultMosaicRule = this.secondaryLayer.defaultMosaicRule;
                            newSentinel.defaultRenderer = this.secondaryLayer.defaultRenderer;
                            newSentinel.defaultRenderingRule = this.secondaryLayer.defaultRenderingRule;
                            newSentinel.setRenderingRule(this.secondaryLayer.renderingRule);
                            //newSentinel.setMosaicRule(this.secondaryLayer.mosaicRule);
                            newSentinel.extent = this.secondaryLayer.extent;
                            this.config.urlSentinel = "https://sentinel.arcgis.com/arcgis/rest/services/Sentinel2/ImageServer";
                            this.map.removeLayer(this.secondaryLayer);
                            this.secondaryLayer = null;
                            this.map.addLayer(newSentinel, this.secondaryLayerIndex);
                            this.secondaryLayer = this.map.getLayer(newSentinel.id);
                            this.map.secondaryLayer = this.secondaryLayer;

                            //if (registry.byId("leftLayerSelector").value === "Sentinel2_2553") {
                            var newSentinel2 = new ArcGISImageServiceLayer("https://sentinel.arcgis.com/arcgis/rest/services/Sentinel2/ImageServer", {
                                id: "Sentinel2_2553",
                                imageServiceParameters: params,
                                title: "Sentinel 2"
                            });
                            newSentinel2.defaultBandIds = this.map.getLayer("Sentinel2_2553").defaultBandIds;
                            newSentinel2.defaultMosaicRule = this.map.getLayer("Sentinel2_2553").defaultMosaicRule;
                            newSentinel2.defaultRenderer = this.map.getLayer("Sentinel2_2553").defaultRenderer;
                            newSentinel2.defaultRenderingRule = this.map.getLayer("Sentinel2_2553").defaultRenderingRule;
                            newSentinel2.setRenderingRule(this.map.getLayer("Sentinel2_2553").renderingRule);
                            //newSentinel.setMosaicRule(this.primaryLayer.mosaicRule);
                            newSentinel2.extent = this.map.getLayer("Sentinel2_2553").extent;
                            if (this.map.getLayer("Sentinel2_2553").visible) {
                                newSentinel2.setVisibility(true);
                            } else {
                                newSentinel2.setVisibility(false);
                            }
                            this.map.removeLayer(this.map.getLayer("Sentinel2_2553"));
                            //this.primaryLayer = null;
                            this.map.addLayer(newSentinel2);
                           // this.primaryLayer = this.map.getLayer(newSentinel2.id);
                           // this.map.primaryLayer = this.primaryLayer;
                      //  }

                            document.getElementById("signInThumbnail").src = "./widgets/ISHeader/images/user.png";
                            document.getElementById("userName").innerHTML = "   Sign Out";

                            if (registry.byId("imageSelectorLeft").get("checked")) {
                                domStyle.set("itals", "display", "none");
                            }
                            if (!this.sliderRight) {
                                this.imageSliderShowRight();
                            } else {
                                this.imageSliderRefreshRight();
                            }
                            domStyle.set("selectorDivRight", "display", "block");
                            this.rightLayerInfos[this.secondaryLayerRight.id].state = true;
                            // if (domClass.contains("activateChange", "activateChange")) {
                            //     domClass.remove("activateChange", "activateChange");
                            // }
                        })).otherwise(lang.hitch(this, function () {
                            registry.byId("imageSelectorRight").set("checked", false);
                            domStyle.set("sentinelTemporal", "display", "block");
                        }));;
                    }
                } else {
                    domStyle.set("changeTemplate", "display", "none");
                    if (!domClass.contains("activateChange", "activateChange")) {
                        domClass.add("activateChange", "activateChange");
                    }
                    if (registry.byId("changeDetectioCheckBox").checked) {
                        registry.byId("changeDetectioCheckBox").set("checked", false);
                    }
                    domStyle.set("itals", "display", "block");
                    domStyle.set("selectorDivRight", "display", "none");
                    this.clearGraphicsRight();
                    if (this.secondaryLayer && this.secondaryLayer.defaultMosaicRule) {
                        var mr = new MosaicRule(this.currentLayerPropRight.defaultMosaicRule);
                        this.secondaryLayer.setMosaicRule(mr);
                        this.rightLayerInfos[this.secondaryLayerRight.id].state = false;
                    }
                    if (domClass.contains("activateChange", "activateChange")) {
                        domClass.remove("activateChange", "activateChange");
                    }
                    this.timebook("right");
                }
            },

            imageDisplayFormat: function () {
                if (domClass.contains(registry.byId("dropDownImageListLeft").domNode, "dropDownSelected")) {
                    domClass.remove(registry.byId("dropDownImageListLeft").domNode, "dropDownSelected");
                    this.switchDisplayTooltip.set("label", this.nls.dropDown);
                    this.displayModeFlagLeft = 0;
                    document.getElementById("switchDisplayImageLeft").src = "./widgets/ISImageCompare/images/dropdownlist.png";
                } else {
                    domClass.add(registry.byId("dropDownImageListLeft").domNode, "dropDownSelected");
                    this.switchDisplayTooltip.set("label", this.nls.slider);
                    this.displayModeFlagLeft = 1;
                    document.getElementById("switchDisplayImageLeft").src = "./widgets/ISImageCompare/images/slider.png";
                }
                this.imageDisplayFormat2();
            },

            imageDisplayFormat2: function () {
                if (!domClass.contains(registry.byId("dropDownImageListLeft").domNode, "dropDownSelected")) {
                    domStyle.set(document.getElementById("imageRangeLeft"), "display", "inline-block");
                    domStyle.set("dropDownOptionLeft", "display", "none");
                    if (this.slider) {
                        if (this.featureLength > 1) {
                            domStyle.set(this.slider.domNode, "display", "block");
                            domStyle.set(this.sliderRules.domNode, "display", "block");
                            domStyle.set(this.sliderLabels.domNode, "display", "block");
                        } else {
                            domStyle.set(this.slider.domNode, "display", "none");
                            domStyle.set(this.sliderRules.domNode, "display", "none");
                            domStyle.set(this.sliderLabels.domNode, "display", "none");
                        }
                    }
                } else {
                    if (this.slider) {
                        domStyle.set(this.slider.domNode, "display", "none");
                        domStyle.set(this.sliderRules.domNode, "display", "none");
                        domStyle.set(this.sliderLabels.domNode, "display", "none");
                    }
                    domStyle.set("dropDownOptionLeft", "display", "inline-block");
                }
            },

            imageDisplayFormatRight: function () {
                if (domClass.contains("dropDownImageListRight", "dropDownSelected")) {
                    domClass.remove("dropDownImageListRight", "dropDownSelected");
                    this.switchDisplayTooltip.set("label", this.nls.dropDown);
                    this.displayModeFlagRight = 0;
                    document.getElementById("switchDisplayImageRight").src = "./widgets/ISImageCompare/images/dropdownlist.png";
                } else {
                    domClass.add("dropDownImageListRight", "dropDownSelected");
                    this.switchDisplayTooltip.set("label", this.nls.slider);
                    this.displayModeFlagRight = 1;
                    document.getElementById("switchDisplayImageRight").src = "./widgets/ISImageCompare/images/slider.png";
                }
                this.imageDisplayFormatRight2();
            },

            imageDisplayFormatRight2: function () {
                if (!domClass.contains("dropDownImageListRight", "dropDownSelected")) {
                    domStyle.set(document.getElementById("imageRangeRight"), "display", "inline-block");
                    domStyle.set("dropDownOptionRight", "display", "none");
                    if (this.sliderRight) {
                        if (this.featureLengthRight > 1) {
                            domStyle.set(this.sliderRight.domNode, "display", "block");
                            domStyle.set(this.sliderRulesRight.domNode, "display", "block");
                            domStyle.set(this.sliderLabelsRight.domNode, "display", "block");
                        } else {
                            domStyle.set(this.sliderRight.domNode, "display", "none");
                            domStyle.set(this.sliderRulesRight.domNode, "display", "none");
                            domStyle.set(this.sliderLabelsRight.domNode, "display", "none");
                        }
                    }
                } else {
                    if (this.sliderRight) {
                        domStyle.set(this.sliderRight.domNode, "display", "none");
                        domStyle.set(this.sliderRulesRight.domNode, "display", "none");
                        domStyle.set(this.sliderLabelsRight.domNode, "display", "none");
                    }
                    domStyle.set("dropDownOptionRight", "display", "inline-block");
                }
            },

            imageSliderShow: function () {
                if (this.primaryLayer && registry.byId("imageSelectorLeft").get("checked")) {
                    domStyle.set("selectorDivLeft", "display", "block");
                    var extent = this.map.extent;
                    var xminnew = ((extent.xmax + extent.xmin) / 2) - ((extent.xmax - extent.xmin) * this.config.searchExtent / 200);
                    var xmaxnew = ((extent.xmax + extent.xmin) / 2) + ((extent.xmax - extent.xmin) * this.config.searchExtent / 200);
                    var yminnew = ((extent.ymax + extent.ymin) / 2) - ((extent.ymax - extent.ymin) * this.config.searchExtent / 200);
                    var ymaxnew = ((extent.ymax + extent.ymin) / 2) + ((extent.ymax - extent.ymin) * this.config.searchExtent / 200);
                    var extentnew = new Extent(xminnew, yminnew, xmaxnew, ymaxnew, extent.spatialReference);
                    var query = new Query();
                    query.geometry = extentnew;
                    query.outFields = [this.imageField];

                    if (this.currentLayerProp.defaultMosaicRule && this.currentLayerProp.defaultMosaicRule.where) {
                        var layerFilter = this.currentLayerProp.defaultMosaicRule.where;
                    }
                    query.where = layerFilter ? this.categoryField + " = 1 AND " + this.cloudCover + " <= " + registry.byId("cloudFilterLeft").value + " AND " + layerFilter : this.categoryField + " = 1 AND " + this.cloudCover + " <= " + registry.byId("cloudFilterLeft").value;
                    query.orderByFields = [this.imageField];
                    query.returnGeometry = false;
                    this.showLoading();
                    var queryTask = new QueryTask(this.primaryLayer.url);
                    queryTask.execute(query, lang.hitch(this, function (result) {
                        this.previousInfo = {
                            extent: this.map.extent,
                            level: this.map.getLevel()
                        };
                        this.orderedFeatures = result.features;

                        if (this.orderedFeatures.length > 0) {
                            html.set(document.getElementById("errorDivLeft"), "");
                            this.orderedDates = [];
                            for (var a in this.orderedFeatures) {
                                if (this.config.distinctImages) {
                                    if (parseInt(a) < 1) {
                                        this.orderedDates.push({ value: this.orderedFeatures[a].attributes[this.imageField], id: this.orderedFeatures[a].attributes[this.objectID] });
                                    }
                                    else {
                                        if (this.imageFieldType === "esriFieldTypeDate") {
                                            var tempValue = locale.format(new Date(this.orderedDates[this.orderedDates.length - 1].value), { selector: "date", formatLength: "short" });
                                            var tempCurrentValue = locale.format(new Date(this.orderedFeatures[a].attributes[this.imageField]), { selector: "date", formatLength: "short" });
                                            if (tempValue !== tempCurrentValue) {
                                                this.orderedDates.push({ value: this.orderedFeatures[a].attributes[this.imageField], id: this.orderedFeatures[a].attributes[this.objectID] });
                                            }
                                        }
                                        else {
                                            if (this.orderedDates[this.orderedDates.length - 1].value !== this.orderedFeatures[a].attributes[this.imageField]) {
                                                this.orderedDates.push({ value: this.orderedFeatures[a].attributes[this.imageField], id: this.orderedFeatures[a].attributes[this.objectID] });
                                            }
                                        }
                                    }
                                }
                                else {
                                    this.orderedDates.push({ value: this.orderedFeatures[a].attributes[this.imageField], id: this.orderedFeatures[a].attributes[this.objectID] });
                                }
                            }
                            this.featureLength = this.orderedDates.length;
                            this.imageSliderHide();
                            var sliderNode = domConstruct.create("div", {}, "imageSliderDivLeft", "first");
                            var rulesNode = domConstruct.create("div", {}, sliderNode, "first");
                            this.sliderRules = new HorizontalRule({
                                container: "bottomDecoration",
                                count: this.featureLength,
                                style: "height:5px;"
                            }, rulesNode);
                            var labels = [];
                            if (this.imageFieldType === "esriFieldTypeDate") {
                                for (var i = 0; i < this.orderedDates.length; i++) {
                                    labels[i] = locale.format(new Date(this.orderedDates[i].value), { selector: "date", formatLength: "short" });
                                }
                            } else {
                                for (var i = 0; i < this.orderedDates.length; i++) {
                                    labels[i] = this.orderedDates[i].value;
                                }
                            }
                            var labelsNode = domConstruct.create("div", {}, sliderNode, "second");
                            this.sliderLabels = new HorizontalRuleLabels({
                                container: "bottomDecoration",
                                labelStyle: "height:1em;font-size:75%;color:gray;",
                                labels: [labels[0], labels[this.orderedDates.length - 1]]
                            }, labelsNode);
                            this.slider = new HorizontalSlider({
                                name: "slider",
                                value: 0,
                                minimum: 0,
                                maximum: this.featureLength - 1,
                                discreteValues: this.featureLength,
                                style: "width: 300px;",
                                onChange: lang.hitch(this, this.sliderDropDownSelection, "slider")
                            }, sliderNode);
                            this.slider.startup();
                            this.sliderRules.startup();
                            this.sliderLabels.startup();
                            this.imageDisplayFormat2();
                            //this.main.resizeTemplate();

                            registry.byId("imageSelectorDropDownLeft").removeOption(registry.byId("imageSelectorDropDownLeft").getOptions());

                            for (var v = this.orderedDates.length - 1; v >= 0; v--) {
                                registry.byId("imageSelectorDropDownLeft").addOption({
                                    label: (this.imageFieldType === "esriFieldTypeDate" ? locale.format(new Date(this.orderedDates[v].value),
                                        { selector: "date", formatLength: "long" }) : this.orderedDates[v].value.toString()), value: "" + v + ""
                                });
                            }

                            if (this.currentLayerProp.currentValue) {
                                var index = null;
                                for (var i in this.orderedDates) {
                                    if (this.orderedDates[i].value === this.currentLayerProp.currentValue.value &&
                                        this.orderedDates[i].id === this.currentLayerProp.currentValue.id) {
                                        var index = i;
                                        break;
                                    } else if (this.orderedDates[i].value <= this.currentLayerProp.currentValue.value) {
                                        var index = i;
                                    }
                                }
                                if (index) {
                                    this.setSliderValue(index);
                                }
                                else {
                                    this.selectDisplayedImage();
                                }
                            } else {
                                this.selectDisplayedImage();
                            }
                        } else {
                            html.set(document.getElementById("errorDivLeft"), this.nls.noScenes);
                            domStyle.set("selectorDivLeft", "display", "none");
                            html.set(document.getElementById("imageRangeLeft"), "");
                            this.hideLoading();
                        }
                    }));
                }
            },

            imageSliderShowRight: function () {
                if (this.secondaryLayer && registry.byId("imageSelectorRight").get("checked")) {
                    domStyle.set("selectorDivRight", "display", "block");
                    var extent = this.map.extent;
                    var xminnew = ((extent.xmax + extent.xmin) / 2) - ((extent.xmax - extent.xmin) * this.config.searchExtent / 200);
                    var xmaxnew = ((extent.xmax + extent.xmin) / 2) + ((extent.xmax - extent.xmin) * this.config.searchExtent / 200);
                    var yminnew = ((extent.ymax + extent.ymin) / 2) - ((extent.ymax - extent.ymin) * this.config.searchExtent / 200);
                    var ymaxnew = ((extent.ymax + extent.ymin) / 2) + ((extent.ymax - extent.ymin) * this.config.searchExtent / 200);
                    var extentnew = new Extent(xminnew, yminnew, xmaxnew, ymaxnew, extent.spatialReference);
                    var query = new Query();
                    query.geometry = extentnew;
                    query.outFields = [this.imageFieldRight];
                    if (this.currentLayerPropRight.defaultMosaicRule && this.currentLayerPropRight.defaultMosaicRule.where) {
                        var layerFilter = this.currentLayerPropRight.defaultMosaicRule.where;
                    }
                    query.where = layerFilter ? this.categoryFieldRight + " = 1 AND " + this.cloudCoverRight + " <= " + registry.byId("cloudFilterRight").value + " AND " + layerFilter : this.categoryFieldRight + " = 1 AND " + this.cloudCoverRight + " <= " + registry.byId("cloudFilterRight").value;
                    query.orderByFields = [this.imageFieldRight];
                    query.returnGeometry = false;
                    this.showLoading();
                    var queryTask = new QueryTask(this.secondaryLayer.url);
                    queryTask.execute(query, lang.hitch(this, function (result) {
                        this.previousInfo = {
                            extent: this.map.extent,
                            level: this.map.getLevel()
                        };
                        this.orderedFeaturesRight = result.features;
                        if (this.orderedFeaturesRight.length > 0) {
                            html.set(document.getElementById("errorDivRight"), "");
                            this.orderedDatesRight = [];
                            for (var a in this.orderedFeaturesRight) {
                                if (this.config.distinctImages) {
                                    if (parseInt(a) < 1) {
                                        this.orderedDatesRight.push({ value: this.orderedFeaturesRight[a].attributes[this.imageFieldRight], id: this.orderedFeaturesRight[a].attributes[this.objectIDRight] });
                                    }
                                    else {
                                        if (this.imageFieldTypeRight === "esriFieldTypeDate") {
                                            var tempValue = locale.format(new Date(this.orderedDatesRight[this.orderedDatesRight.length - 1].value), { selector: "date", formatLength: "short" });
                                            var tempCurrentValue = locale.format(new Date(this.orderedFeaturesRight[a].attributes[this.imageFieldRight]), { selector: "date", formatLength: "short" });
                                            if (tempValue !== tempCurrentValue)
                                                this.orderedDatesRight.push({ value: this.orderedFeaturesRight[a].attributes[this.imageFieldRight], id: this.orderedFeaturesRight[a].attributes[this.objectIDRight] });
                                        } else {
                                            if (this.orderedDatesRight[this.orderedDatesRight.length - 1].value !== this.orderedFeaturesRight[a].attributes[this.imageFieldRight])
                                                this.orderedDatesRight.push({ value: this.orderedFeaturesRight[a].attributes[this.imageFieldRight], id: this.orderedFeaturesRight[a].attributes[this.objectIDRight] });
                                        }
                                    }
                                } else {
                                    this.orderedDatesRight.push({ value: this.orderedFeaturesRight[a].attributes[this.imageFieldRight], id: this.orderedFeaturesRight[a].attributes[this.objectIDRight] });
                                }
                            }
                            this.featureLengthRight = this.orderedDatesRight.length;
                            this.imageSliderHideRight();
                            var sliderNode = domConstruct.create("div", {}, "imageSliderDivRight", "first");
                            var rulesNode = domConstruct.create("div", {}, sliderNode, "first");
                            this.sliderRulesRight = new HorizontalRule({
                                container: "bottomDecoration",
                                count: this.featureLengthRight,
                                style: "height:5px;"
                            }, rulesNode);
                            var labels = [];
                            if (this.imageFieldTypeRight === "esriFieldTypeDate") {

                                for (var i = 0; i < this.orderedDatesRight.length; i++) {
                                    labels[i] = locale.format(new Date(this.orderedDatesRight[i].value), { selector: "date", formatLength: "short" });
                                }
                            } else {
                                for (var i = 0; i < this.orderedDatesRight.length; i++) {
                                    labels[i] = this.orderedDatesRight[i].value;
                                }
                            }
                            var labelsNode = domConstruct.create("div", {}, sliderNode, "second");

                            this.sliderLabelsRight = new HorizontalRuleLabels({
                                container: "bottomDecoration",
                                labelStyle: "height:1em;font-size:75%;color:gray;",
                                labels: [labels[0], labels[this.orderedDatesRight.length - 1]]
                            }, labelsNode);

                            this.sliderRight = new HorizontalSlider({
                                name: "slider",
                                value: 0,
                                minimum: 0,
                                maximum: this.featureLengthRight - 1,
                                discreteValues: this.featureLengthRight,
                                style: "width: 300px;",
                                onChange: lang.hitch(this, this.sliderDropDownSelectionRight, "slider")
                            }, sliderNode);

                            this.sliderRight.startup();
                            this.sliderRulesRight.startup();
                            this.sliderLabelsRight.startup();
                            this.imageDisplayFormatRight2();
                            //this.main.resizeTemplate();

                            registry.byId("imageSelectorDropDownRight").removeOption(registry.byId("imageSelectorDropDownRight").getOptions());
                            for (var v = this.orderedDatesRight.length - 1; v >= 0; v--) {
                                registry.byId("imageSelectorDropDownRight").addOption({ label: (this.imageFieldTypeRight === "esriFieldTypeDate" ? locale.format(new Date(this.orderedDatesRight[v].value), { selector: "date", formatLength: "long" }) : this.orderedDatesRight[v].value.toString()), value: "" + v + "" });
                            }
                            if (this.currentLayerPropRight.currentValue) {
                                var index = null;
                                for (var i in this.orderedDatesRight) {
                                    if (this.orderedDatesRight[i].value === this.currentLayerPropRight.currentValue.value && this.orderedDatesRight[i].id === this.currentLayerPropRight.currentValue.id) {
                                        var index = i;
                                        break;
                                    } else if (this.orderedDatesRight[i].value <= this.currentLayerPropRight.currentValue.value) {
                                        var index = i;
                                    }
                                }
                                if (index) {
                                    this.setSliderValueRight(index);
                                }
                                else {
                                    this.selectDisplayedImageRight();
                                }
                            } else {
                                this.selectDisplayedImageRight();
                            }
                        } else {
                            html.set(document.getElementById("errorDivRight"), this.nls.noScenes);
                            domStyle.set("selectorDivRight", "display", "none");
                            html.set(document.getElementById("imageRangeRight"), "");
                            //html.set(document.getElementById("imageCountRight"), "");
                            this.hideLoading();
                        }
                    }));
                }
            },

            setSliderValue: function (index) {
                this.imageDisplayFormat2();
                registry.byId("imageSelectorDropDownLeft").set("value", index);
                this.slider.set("value", index);
                if (this.primaryMosaic) {
                    this.slider.set("value", this.primaryMosaic);
                    this.primaryMosaic = null;
                }

                if (this.imageFieldType === "esriFieldTypeDate") {
                    html.set(document.getElementById("imageRangeLeft"), this.nls.dates + ": <b>" + locale.format(new Date(this.orderedDates[index].value), { selector: "date", formatLength: "long" }) + "</b>");
                } else {
                    html.set(document.getElementById("imageRangeLeft"), this.imageField + ": <b>" + this.orderedDates[index].value + "</b>");
                }
                //html.set(document.getElementById("imageCountLeft"), "1 " + this.nls.images);
                this.hideLoading();
            },

            setSliderValueRight: function (index) {
                this.imageDisplayFormatRight2();
                registry.byId("imageSelectorDropDownRight").set("value", index);
                this.sliderRight.set("value", index);
                if (this.secondaryMosaic) {
                    this.sliderRight.set("value", this.secondaryMosaic);
                    this.secondaryMosaic = null;
                }

                if (this.imageFieldTypeRight === "esriFieldTypeDate") {
                    html.set(document.getElementById("imageRangeRight"), this.nls.dates + ": <b>" + locale.format(new Date(this.orderedDatesRight[index].value), { selector: "date", formatLength: "long" }) + "</b>");
                }
                else {
                    html.set(document.getElementById("imageRangeRight"), this.imageFieldRight + ": <b>" + this.orderedDatesRight[index].value + "</b>");
                }
                //html.set(document.getElementById("imageCountRight"), "1 " + this.nls.images);
                this.hideLoading();
            },

            selectDisplayedImage: function () {
                var request = new esriRequest({
                    url: this.primaryLayer.url + "/getSamples",
                    content: {
                        geometry: JSON.stringify(this.map.extent.getCenter()),
                        geometryType: "esriGeometryPoint",
                        returnGeometry: false,
                        sampleCount: 1,
                        mosaicRule: this.currentLayerProp.defaultMosaicRule ? JSON.stringify(this.currentLayerProp.defaultMosaicRule.toJson()) : null,
                        outFields: [this.imageField],
                        f: "json"
                    },
                    handleAs: "json",
                    callbackParamName: "callback"
                });
                request.then(lang.hitch(this, function (bestScene) {
                    var maxVisible = bestScene.samples[0].attributes[this.imageField];
                    var index = null;
                    for (var z in this.orderedDates) {
                        if (this.orderedDates[z].value === maxVisible) {
                            index = z;
                            break;
                        }
                    }
                    if (!index) {
                        var index = this.orderedDates.length - 1;
                    }
                    this.setSliderValue(index);
                }), lang.hitch(this, function () {
                    var imageTask = new ImageServiceIdentifyTask(this.primaryLayer.url);
                    var imageParams = new ImageServiceIdentifyParameters();
                    imageParams.geometry = this.map.extent.getCenter();
                    imageParams.mosaicRule = this.currentLayerProp.defaultMosaicRule;
                    imageParams.returnGeometry = false;
                    imageTask.execute(imageParams, lang.hitch(this, function (data) {
                        var index;
                        if (data.catalogItems.features[0]) {
                            var maxVisible = data.catalogItems.faetures[0].attributes[this.imageField];
                            for (var z in this.orderedDates) {
                                if (this.orderedDates[z].value === maxVisible) {
                                    index = z;
                                }
                            }
                        }
                        if (!index) {
                            var index = this.orderedDates.length - 1;
                        }
                        this.setSliderValue(index);
                    }), lang.hitch(this, function (error) {
                        this.setSliderValue(this.orderedDates.length - 1);
                    }));

                })
                );
            },

            selectDisplayedImageRight: function () {
                var request = new esriRequest({
                    url: this.secondaryLayer.url + "/getSamples",
                    content: {
                        geometry: JSON.stringify(this.map.extent.getCenter()),
                        geometryType: "esriGeometryPoint",
                        returnGeometry: false,
                        sampleCount: 1,
                        mosaicRule: this.currentLayerPropRight.defaultMosaicRule ? JSON.stringify(this.currentLayerPropRight.defaultMosaicRule.toJson()) : null,
                        outFields: [this.imageFieldRight],
                        f: "json"
                    },
                    handleAs: "json",
                    callbackParamName: "callback"
                });

                request.then(lang.hitch(this, function (bestScene) {
                    var maxVisible = bestScene.samples[0].attributes[this.imageFieldRight];
                    var index = null;
                    for (var z in this.orderedDatesRight) {
                        if (this.orderedDatesRight[z].value === maxVisible) {
                            index = z;
                            break;
                        }
                    }
                    if (!index) {
                        var index = this.orderedDatesRight.length - 1;
                    }
                    this.setSliderValueRight(index);
                }), lang.hitch(this, function () {
                    var imageTask = new ImageServiceIdentifyTask(this.secondaryLayer.url);
                    var imageParams = new ImageServiceIdentifyParameters();
                    imageParams.geometry = this.map.extent.getCenter();
                    imageParams.mosaicRule = this.currentLayerPropRight.defaultMosaicRule;
                    imageParams.returnGeometry = false;
                    imageTask.execute(imageParams, lang.hitch(this, function (data) {
                        var index;
                        if (/*!index && */data.catalogItems.features[0]) {
                            var maxVisible = data.catalogItems.features[0].attributes[this.imageFieldRight];
                            for (var z in this.orderedDatesRight) {
                                if (this.orderedDatesRight[z].value === maxVisible) {
                                    index = z;
                                }
                            }
                        }
                        if (!index) {
                            var index = this.orderedDatesRight.length - 1;
                        }
                        this.setSliderValueRight(index);
                    }), lang.hitch(this, function (error) {
                        this.setSliderValueRight(this.orderedDatesRight.length - 1);
                    }));
                }));
            },

            imageSliderHide: function () {
                if (this.slider) {
                    this.sliderRules.destroy();
                    this.sliderLabels.destroy();
                    this.slider.destroy();
                }
                this.sliderRules = null;
                this.sliderLabels = null;
                this.slider = null;
            },

            imageSliderHideRight: function () {
                if (this.sliderRight) {
                    this.sliderRulesRight.destroy();
                    this.sliderLabelsRight.destroy();
                    this.sliderRight.destroy();
                }
                this.sliderRulesRight = null;
                this.sliderLabelsRight = null;
                this.sliderRight = null;
            },

            sliderDropDownSelection: function (value) {
                if (!domClass.contains(registry.byId("dropDownImageListLeft").domNode, "dropDownSelected") && value === "slider") {
                    this.valueSelected = this.slider.get("value");
                    registry.byId("imageSelectorDropDownLeft").set("value", this.valueSelected);
                    this.sliderChange();
                } else if (domClass.contains(registry.byId("dropDownImageListLeft").domNode, "dropDownSelected") && value === "dropDown") {
                    this.valueSelected = registry.byId("imageSelectorDropDownLeft").get("value");
                    this.slider.set("value", this.valueSelected);
                    this.sliderChange();
                }
            },

            sliderDropDownSelectionRight: function (value) {
                if (!domClass.contains("dropDownImageListRight", "dropDownSelected") && value === "slider") {
                    this.valueSelectedRight = this.sliderRight.get("value");
                    registry.byId("imageSelectorDropDownRight").set("value", this.valueSelectedRight);
                    this.sliderChangeRight();
                } else if (domClass.contains("dropDownImageListRight", "dropDownSelected") && value === "dropDown") {
                    this.valueSelectedRight = registry.byId("imageSelectorDropDownRight").get("value");
                    this.sliderRight.set("value", this.valueSelectedRight);
                    this.sliderChangeRight();
                }
            },

            sliderChange: function () {
                if (registry.byId("imageSelectorLeft").get("checked")) {
                    if (this.valueSelected || this.valueSelected === 0) {
                        var aqDate = this.orderedDates[this.valueSelected].value;
                        this.dateLeft = aqDate;
                        if (registry.byId("leftLayerSelector").value === "MS_696") {
                            dom.byId("dateDisplay").innerHTML = "Landsat - &nbsp;&nbsp;" + locale.format(new Date(this.dateLeft), { selector: "date", formatLength: "long" });
                        } else if (registry.byId("leftLayerSelector").value === "Sentinel2_2553") {
                            dom.byId("dateDisplay").innerHTML = "Sentinel 2 - &nbsp;&nbsp;" + locale.format(new Date(this.dateLeft), { selector: "date", formatLength: "long" });
                        } else {
                            dom.byId("dateDisplay").innerHTML = "Basemap";
                        }
                        this.leftLayerInfos[this.primaryLayer.id].currentValue = this.orderedDates[this.valueSelected];
                        var featureSelect = [];
                        var featureIds = [];
                        this.featureNames = [];
                        if (this.imageFieldType === "esriFieldTypeDate") {
                            if (this.config.distinctImages) {
                                for (var c in this.orderedFeatures) {
                                    var tempValue = locale.format(new Date(this.orderedDates[this.valueSelected].value), { selector: "date", formatLength: "short" });
                                    var tempCurrentValue = locale.format(new Date(this.orderedFeatures[c].attributes[this.imageField]), { selector: "date", formatLength: "short" });
                                    if (tempValue === tempCurrentValue) {
                                        featureSelect.push(this.orderedFeatures[c]);
                                        featureIds.push(this.orderedFeatures[c].attributes[this.objectID]);
                                    }
                                }
                            } else {
                                featureSelect.push(this.orderedFeatures[this.valueSelected]);
                                featureIds.push(this.orderedFeatures[this.valueSelected].attributes[this.objectID]);
                            }
                            html.set(document.getElementById("imageRangeLeft"), this.nls.dates + ": <b>" + locale.format(new Date(aqDate), { selector: "date", formatLength: "long" }) + "</b>");

                        } else {
                            if (this.config.distinctImages) {
                                for (var c in this.orderedFeatures) {
                                    if (this.orderedFeatures[c].attributes[this.imageField] === this.orderedDates[this.valueSelected].value) {
                                        featureSelect.push(this.orderedFeatures[c]);
                                        featureIds.push(this.orderedFeatures[c].attributes[this.objectID]);
                                    }
                                }
                            } else {
                                featureSelect.push(this.orderedFeatures[this.valueSelected]);
                                featureIds.push(this.orderedFeatures[this.valueSelected].attributes[this.objectID]);
                            }
                            html.set(document.getElementById("imageRangeLeft"), this.imageField + ": <b>" + aqDate + "</b>");
                        }
                        this.clearGraphics();
                        var count = 0;

                        var mr = new MosaicRule();
                        mr.method = MosaicRule.METHOD_LOCKRASTER;
                        mr.ascending = true;
                        mr.operation = "MT_FIRST";
                        mr.lockRasterIds = featureIds;
                        this.primaryLayer.setMosaicRule(mr);
                        registry.byId("primarySceneId").set("value", this.valueSelected);
                        this.refreshSwipe();
                    }
                }
            },

            sliderChangeRight: function () {
                if (registry.byId("imageSelectorRight").get("checked")) {
                    if (this.valueSelectedRight || this.valueSelectedRight === 0) {
                        var aqDate = this.orderedDatesRight[this.valueSelectedRight].value;
                        this.dateRight = aqDate;
                        if (registry.byId("rightLayerSelector").value === "MS_696") {
                            dom.byId("compDisplay").innerHTML = "&nbsp;&nbsp; Compared with - Landsat - &nbsp;&nbsp;" + locale.format(new Date(this.dateRight), { selector: "date", formatLength: "long" });
                        } else if (registry.byId("rightLayerSelector").value === "Sentinel2_2553") {
                            dom.byId("compDisplay").innerHTML = "&nbsp;&nbsp; Compared with - Sentinel 2 - &nbsp;&nbsp;" + locale.format(new Date(this.dateRight), { selector: "date", formatLength: "long" });
                        } else {
                            dom.byId("compDisplay").innerHTML = "&nbsp;&nbsp; Compared with - Basemap";
                        }
                        this.rightLayerInfos[this.secondaryLayerRight.id].currentValue = this.orderedDatesRight[this.valueSelectedRight];
                        var featureSelect = [];
                        var featureIds = [];
                        if (this.imageFieldTypeRight === "esriFieldTypeDate") {
                            if (this.config.distinctImages) {
                                for (var c in this.orderedFeaturesRight) {
                                    var tempValue = locale.format(new Date(this.orderedDatesRight[this.valueSelectedRight].value), { selector: "date", formatLength: "short" });
                                    var tempCurrentValue = locale.format(new Date(this.orderedFeaturesRight[c].attributes[this.imageFieldRight]), { selector: "date", formatLength: "short" });
                                    if (tempValue === tempCurrentValue) {
                                        featureSelect.push(this.orderedFeaturesRight[c]);
                                        featureIds.push(this.orderedFeaturesRight[c].attributes[this.objectIDRight]);
                                    }
                                }
                            } else {
                                featureSelect.push(this.orderedFeaturesRight[this.valueSelectedRight]);
                                featureIds.push(this.orderedFeaturesRight[this.valueSelectedRight].attributes[this.objectIDRight]);
                            }
                            html.set(document.getElementById("imageRangeRight"), this.nls.dates + ": <b>" + locale.format(new Date(aqDate), { selector: "date", formatLength: "long" }) + "</b>");

                        } else {
                            if (this.config.distinctImages) {
                                for (var c in this.orderedFeaturesRight) {
                                    if (this.orderedFeaturesRight[c].attributes[this.imageFieldRight] === this.orderedDatesRight[this.valueSelectedRight].value) {
                                        featureSelect.push(this.orderedFeaturesRight[c]);
                                        featureIds.push(this.orderedFeaturesRight[c].attributes[this.objectIDRight]);
                                    }
                                }
                            } else {
                                featureSelect.push(this.orderedFeaturesRight[this.valueSelectedRight]);
                                featureIds.push(this.orderedFeaturesRight[this.valueSelectedRight].attributes[this.objectIDRight]);
                            }
                            html.set(document.getElementById("imageRangeRight"), this.imageField + ": <b>" + aqDate + "</b>");
                        }
                        this.clearGraphicsRight();
                        var count = 0;

                        var mr = new MosaicRule();
                        mr.method = MosaicRule.METHOD_LOCKRASTER;
                        mr.ascending = true;
                        mr.operation = "MT_FIRST";
                        mr.lockRasterIds = featureIds;
                        this.secondaryLayer.setMosaicRule(mr);
                        registry.byId("secondarySceneId").set("value", this.valueSelectedRight);
                        this.refreshSwipe();
                    }
                }
            },

            imageSliderRefresh: function () {
                this.imageSliderHide();
                this.imageSliderShow();

            },

            imageSliderRefreshRight: function () {
                this.imageSliderHideRight();
                this.imageSliderShowRight();
            },

            refreshSwipe: function () {
                if (this.instance === 1) {
                    if (this.primaryLayer || this.secondaryLayer) {
                        if (this.primaryLayer && this.secondaryLayer && (this.primaryLayer.id === this.secondaryLayer.id.split("_Right")[0] &&
                            (JSON.stringify(this.primaryLayer.mosaicRule) === JSON.stringify(this.secondaryLayer.mosaicRule) || (!this.primaryLayer.mosaicRule &&
                                JSON.stringify(this.primaryLayer.defaultMosaicRule) === JSON.stringify(this.secondaryLayer.mosaicRule))) &&
                            (JSON.stringify(this.primaryLayer.renderingRule) === JSON.stringify(this.secondaryLayer.renderingRule)) || !this.primaryLayer.visible ||
                            !this.secondaryLayer.visible)) {
                            if (this.layerSwipe) {
                                this.swipePosition = this.layerSwipe.domNode.children[0].offsetLeft;
                                this.layerSwipe.destroy();
                                this.layerSwipe = null;
                            }
                            domConstruct.place("<div id='swipewidgetViewer'></div>", "map", "first");
                            if (!this.primaryLayer && this.secondaryLayer) {
                                var invert = true;
                                var layer = this.secondaryLayer;
                            } else {
                                var invert = false;
                                var layer = this.primaryLayer;
                            }
                            if (this.swipePosition) {
                                this.swipePosition2 = this.swipePosition;
                            }
                            this.layerSwipe = new LayerSwipe({
                                type: "vertical",
                                map: this.map,
                                left: this.swipePosition2,
                                invertPlacement: invert,
                                layers: [layer]
                            }, dom.byId("swipewidgetViewer"));
                            this.layerSwipe.startup();
                            if (this.primaryLayer.visible && this.secondaryLayer.visible) {
                                document.getElementById("errorSwipeDiv").innerHTML = this.nls.leftRightIdentical;
                                this.previousLayerInfo = {
                                    primary: this.primaryLayer ? {
                                        id: this.primaryLayer.id, mosaicRule: this.primaryLayer.mosaicRule,
                                        renderer: this.primaryLayer.renderingRule
                                    } : { id: null, mosaicRule: null, renderer: null },
                                    secondary: this.secondaryLayer ? {
                                        id: this.secondaryLayerRight.id, mosaicRule: this.secondaryLayer.mosaicRule,
                                        renderer: this.secondaryLayer.renderingRule
                                    } : { id: null, mosaicRule: null, renderer: null }
                                };
                                registry.byId("changeDetectioCheckBox").set("disabled", true);
                                registry.byId("changeDetectioCheckBox").set("checked", false);
                                if (!domClass.contains("activateChange", "activateChange")) {
                                    domClass.add("activateChange", "activateChange");
                                }
                                domStyle.set("itals", "display", "none");
                                domStyle.set("changeTemplate", "display", "none");
                            } else {
                                document.getElementById("errorSwipeDiv").innerHTML = "";
                                this.previousLayerInfo = { primary: { id: null, mosaicRule: null, renderer: null }, secondary: { id: null, mosaicRule: null, renderer: null } };
                            }
                        } else {
                            document.getElementById("errorSwipeDiv").innerHTML = "";
                            if ((this.primaryLayer && (this.primaryLayer.id !== this.previousLayerInfo.primary.id ||
                                JSON.stringify(this.primaryLayer.mosaicRule) !== JSON.stringify(this.previousLayerInfo.primary.mosaicRule) ||
                                JSON.stringify(this.primaryLayer.renderingRule) !== JSON.stringify(this.previousLayerInfo.primary.renderer))) ||
                                (this.secondaryLayer && (this.secondaryLayerRight.id !== this.previousLayerInfo.secondary.id ||
                                    JSON.stringify(this.secondaryLayer.mosaicRule) !== JSON.stringify(this.previousLayerInfo.secondary.mosaicRule) ||
                                    JSON.stringify(this.secondaryLayer.renderingRule) !== JSON.stringify(this.previousLayerInfo.secondary.renderer))) ||
                                (!this.primaryLayer && this.previousLayerInfo.primary.id) || (!this.secondaryLayer && this.previousLayerInfo.secondary.id)) {
                                if (this.layerSwipe) {
                                    this.swipePosition = this.layerSwipe.domNode.children[0].offsetLeft;
                                    this.layerSwipe.destroy();
                                    this.layerSwipe = null;
                                }
                                domConstruct.place("<div id='swipewidgetViewer'></div>", "map", "first");
                                if (!this.primaryLayer && this.secondaryLayer) {
                                    var invert = true;
                                    var layer = this.secondaryLayer;
                                } else {
                                    var invert = false;
                                    var layer = this.primaryLayer;
                                }
                                if (!this.swipePosition) {
                                    if (registry.byId("leftLayer").checked) {
                                        // if (this.panel) {
                                        if ((document.getElementById("Compare Imagery").offsetLeft + document.getElementById("Compare Imagery").clientWidth) < (this.map.width - 40)) {
                                            this.swipePosition = this.map.width - 40;
                                        } else if (document.getElementById("Compare Imagery").offsetLeft < (this.map.width - 40) &&
                                            (document.getElementById("Compare Imagery").offsetLeft + document.getElementById("Compare Imagery").clientWidth) > (this.map.width - 40)) {
                                            this.swipePosition = this.map.width - document.getElementById("Compare Imagery").clientWidth - 40;
                                        } else {
                                            this.swipePosition = this.map.width - 40;
                                        }
                                        // } else {
                                        //     this.swipePosition = this.map.width - 40;
                                        // }
                                    }
                                    else {

                                        //this.swipePosition = document.getElementById("toolsContentContainer").clientWidth ? document.getElementById("toolsContentContainer").clientWidth + 15 : 40;
                                        //if (this.panel) {
                                        if (document.getElementById("Compare Imagery").offsetLeft > 40) {
                                            this.swipePosition = 40;
                                        } else if (document.getElementById("Compare Imagery").offsetLeft < 40 &&
                                            (document.getElementById("Compare Imagery").offsetLeft + document.getElementById("Compare Imagery").clientWidth) > 40) {
                                            this.swipePosition = document.getElementById("Compare Imagery").clientWidth + 40;
                                        } else {
                                            this.swipePosition = 40;
                                        }
                                        // } else {
                                        //     this.swipePosition = 40;
                                        // }
                                    }
                                }
                                this.swipePosition2 = this.swipePosition;
                                this.layerSwipe = new LayerSwipe({
                                    type: "vertical",
                                    map: this.map,
                                    left: this.swipePosition,
                                    invertPlacement: invert,
                                    layers: [layer]
                                }, dom.byId("swipewidgetViewer"));
                                this.layerSwipe.startup();
                                this.previousLayerInfo = {
                                    primary: this.primaryLayer ? {
                                        id: this.primaryLayer.id, mosaicRule: this.primaryLayer.mosaicRule,
                                        renderer: this.primaryLayer.renderingRule
                                    } : { id: null, mosaicRule: null, renderer: null },
                                    secondary: this.secondaryLayer ? {
                                        id: this.secondaryLayerRight.id, mosaicRule: this.secondaryLayer.mosaicRule,
                                        renderer: this.secondaryLayer.renderingRule
                                    } : { id: null, mosaicRule: null, renderer: null }
                                };

                                if (this.primaryLayer && this.secondaryLayer) {
                                    if (registry.byId("imageSelectorLeft").checked && registry.byId("imageSelectorRight").checked &&
                                        this.primaryLayer.id === this.secondaryLayer.id.split("_Right")[0] && this.primaryLayer.mosaicRule &&
                                        JSON.stringify(this.primaryLayer.mosaicRule) !== JSON.stringify(this.secondaryLayer.mosaicRule) &&
                                        JSON.stringify(this.primaryLayer.defaultMosaicRule) !== JSON.stringify(this.primaryLayer.mosaicRule) &&
                                        this.secondaryLayer.defaultMosaicRule &&
                                        JSON.stringify(this.secondaryLayer.defaultMosaicRule) !== JSON.stringify(this.secondaryLayer.mosaicRule)) {
                                        registry.byId("changeDetectioCheckBox").set("disabled", false);
                                        if (domClass.contains("activateChange", "activateChange")) {
                                            domClass.remove("activateChange", "activateChange");
                                        }
                                        domStyle.set("itals", "display", "none");
                                        this.changeDetection.populateBands();
                                    } else {
                                        registry.byId("changeDetectioCheckBox").set("disabled", true);
                                        registry.byId("changeDetectioCheckBox").set("checked", false);
                                        if (!domClass.contains("activateChange", "activateChange")) {
                                            domClass.add("activateChange", "activateChange");
                                        }
                                        domStyle.set("itals", "display", "block");
                                        domStyle.set("changeTemplate", "display", "none");
                                    }
                                }
                            }
                        }
                    } else if (this.layerSwipe) {
                        document.getElementById("errorSwipeDiv").innerHTML = "";
                        this.layerSwipe.destroy();
                        this.layerSwipe = null;
                        this.previousLayerInfo = { primary: { id: null, mosaicRule: null, renderer: null }, secondary: { id: null, mosaicRule: null, renderer: null } };
                    } else {
                        document.getElementById("errorSwipeDiv").innerHTML = "";
                        this.previousLayerInfo = { primary: { id: null, mosaicRule: null, renderer: null }, secondary: { id: null, mosaicRule: null, renderer: null } };
                    }
                }
            },

            moveSwipe: function (value, invertPlacement, layers) {
                this.layerSwipe.destroy();
                this.layerSwipe = null;
                domConstruct.place("<div id='swipewidgetViewer'></div>", "map", "first");
                this.layerSwipe = new LayerSwipe({
                    type: "vertical",
                    map: this.map,
                    left: value,
                    invertPlacement: invertPlacement,
                    layers: layers
                }, dom.byId("swipewidgetViewer"));
                this.layerSwipe.startup();
            },

            clearGraphics: function () {
                if (this.primaryLayer) {
                    var imagePosition = "left";
                    for (var s = this.map.graphics.graphics.length - 1; s >= 0; s--) {
                        if (this.map.graphics.graphics[s].symbol && this.map.graphics.graphics[s].symbol.style === "solid" &&
                            this.map.graphics.graphics[s].symbol.outline.color.g === 255 && this.map.graphics.graphics[s].symbol.outline.color.b === 255 &&
                            this.map.graphics.graphics[s].attributes.imagePosition === imagePosition) {
                            this.map.graphics.remove(this.map.graphics.graphics[s]);
                        }
                    }
                }
            },

            clearGraphicsRight: function () {
                if (this.secondaryLayer) {
                    var imagePosition = "right";
                    for (var s = this.map.graphics.graphics.length - 1; s >= 0; s--) {
                        if (this.map.graphics.graphics[s].symbol && this.map.graphics.graphics[s].symbol.style === "solid" &&
                            this.map.graphics.graphics[s].symbol.outline.color.g === 255 && this.map.graphics.graphics[s].symbol.outline.color.b === 255 &&
                            this.map.graphics.graphics[s].attributes.imagePosition === imagePosition) {
                            this.map.graphics.remove(this.map.graphics.graphics[s]);
                        }
                    }
                }
            },

            showLoading: function () {
                domStyle.set("loadingLayerCompare", "display", "block");
            },

            hideLoading: function () {
                domStyle.set("loadingLayerCompare", "display", "none");
            }
        });
    });
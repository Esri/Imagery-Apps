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
    'dijit/_WidgetsInTemplateMixin',
    'dijit/_TemplatedMixin',
    'dojo/text!./Widget.html',
    "esri/IdentityManager",
    "./Mask",
    "./Identify",
    "./Temporal",
    "./Query",
    'dijit/registry',
    'dojo/_base/lang',
    "dojo/Evented",
    'dojo/html',
    'dojo/dom-class',
    "dojo/dom-attr",
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
    'esri/layers/ImageServiceParameters',
    'esri/tasks/ImageServiceIdentifyTask',
    'esri/tasks/ImageServiceIdentifyParameters',
    'esri/layers/RasterFunction',
    'esri/geometry/Polygon',
    'esri/geometry/Point',
    'esri/request',
    'dijit/Tooltip',
    "dijit/ColorPalette",
    "dijit/form/Button",
    "dijit/form/NumberTextBox",
    'dijit/form/Select',
 
    'dijit/form/NumberSpinner',
    'dijit/form/CheckBox',
    'dijit/form/TextBox',
    'dijit/form/DropDownButton',
    'dijit/TooltipDialog',
    'dijit/form/RadioButton',
    
    "dojo/domReady!"
],
    function (declare, BaseWidget, PanelManager, _WidgetsInTemplateMixin, _TemplatedMixin, template, IdentityManager, Mask, Identify, Temporal, QueryLayer, registry, lang, Evented, html, domClass, domAttr, dom, MosaicRule, Query, QueryTask, Extent, locale, domConstruct,
        HorizontalSlider, HorizontalRule, HorizontalRuleLabels, Graphic, SimpleLineSymbol, SimpleFillSymbol, Color, InfoTemplate, mathUtils, domStyle, ArcGISImageServiceLayer,
        ImageServiceParameters, ImageServiceIdentifyTask, ImageServiceIdentifyParameters, RasterFunction, Polygon, Point, esriRequest, Tooltip, ColorPalette, Button, NumberTextBox) {

        var pm = PanelManager.getInstance();
        return declare([BaseWidget, Evented, _TemplatedMixin], {

            constructor: function (parameters) {
                var defaults = {
                    map: null,
                    config: null,
                    nls: null,
                    mainConfig: null,
                };
                lang.mixin(this, defaults, parameters);
            },

            templateString: template,
            primaryLayer: null,
            secondaryLayer: null,
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
            updateBandFlag: 0,
            secureFlag: false,

            startup: function () {
                this.inherited(arguments);
            },

            postCreate: function () {
                this.inherited(arguments);
                domConstruct.place('<img id="loadingLayerViewer" style="position: absolute;top:0;bottom: 0;left: 0;right: 0;margin:auto;z-index:100;" src="./widgets/ISImageExplorer/images/loading1.gif">', document.getElementById("explorerWidget"));
                domStyle.set("loadingLayerViewer", "display", "none");

                
                this.layerInfos = [];
                for (var i in this.config.operationalLayers) {
                    this.layerInfos[this.config.operationalLayers[i].id] = this.config.operationalLayers[i];
                }

                registry.byId("dropDownListView").on("click", lang.hitch(this, this.imageDisplayFormat));
                registry.byId("layerRendererView").on("change", lang.hitch(this, this.setRenderingRule));
                registry.byId("imageDropDownView").on("change", lang.hitch(this, this.sliderDropDownSelection, "dropDown"));

                if (registry.byId("layerSelectorView").get("value") === "MS_696") {
                    html.set(dom.byId("renderDescription"), this.config.renderInfo.landsat[registry.byId("layerRendererView").value].description);
                    html.set(dom.byId("sensorDescription"), "Landsat 8 OLI, 30m multispectral and multitemporal 8-band imagery, with on-the-fly renderings and indices. Additional Landsat services can be found <a href='https://www.arcgis.com/home/group.html?id=a74dff13f1be4b2ba7264c3315c57077#overview' target='_blank'>here</a>");
                } else if (registry.byId("layerSelectorView").get("value") === "Sentinel2_2553") {
                    html.set(dom.byId("renderDescription"), this.config.renderInfo.sentinel[registry.byId("layerRendererView").value].description);
                    html.set(dom.byId("sensorDescription"), "Sentinel-2, 10m Multispectral, Multitemporal, 13-band images with visual renderings and indices. - <a href='https://www.arcgis.com/home/item.html?id=fd61b9e0c69c4e14bebd50a9a968348c' target='_blank'>Find here</a>");
                } else {
                    html.set(dom.byId("renderDescription"), "Basemap");
                    html.set(dom.byId("sensorDescription"), "Basemap");
                }

                registry.byId("imageryTool").on("change", lang.hitch(this, function (value) {
                    this.imageMaskTool = value;
                    domStyle.set("scatterTemplate", "display", "none");
                    domStyle.set("maskTemplate", "display", "none");
                    domStyle.set("spectralTemplate", "display", "none");
                    domStyle.set("temporalTemplate", "display", "none");
                    domStyle.set("queryAOITemplate", "display", "none");
                    domStyle.set("zonestemplate", "display", "none");
                    domStyle.set("aoitemplate", "display", "none");
                    if (value === "mask") {
                        this.spectralProf.onClose();
                        this.scatterPlotTemp.onClose();
                        this.temporalProf.onClose();
                        this.queryLayer.onClose();
                        domStyle.set("maskTemplate", "display", "block");
                    
                        this.toolFlag = 1;
                        this.maskTemp.onOpen();
                        this.primaryLayer.on("mosaic-rule-change", lang.hitch(this, function () {
                            this.maskTemp.mosaicRuleChanged();
                        }));

                    } else if (value === "spectral") {
                        this.maskTemp.onClose();
                        this.temporalProf.onClose();
                        this.queryLayer.onClose();
                       
                        domStyle.set("spectralTemplate", "display", "block");
                    
                        this.toolFlag = 2;
                        //  if (this.updateBandFlag === 0) {
                        this.spectralProf.onOpen();
                        // }
                        this.updateBandFlag = 1;
                        this.primaryLayer.on("mosaic-rule-change", lang.hitch(this, function () {
                            domStyle.set("identifysp", "display", "none");
                            html.set("identifytab", "");
                        }));
                    } else if (value === "scatterplot") {
                        this.maskTemp.onClose();
                        this.temporalProf.onClose();
                        this.queryLayer.onClose();
                        domStyle.set("scatterTemplate", "display", "block");
                        
                        this.toolFlag = 3;
                        this.scatterPlotTemp.onOpen();
                        this.spectralProf.toolbarIdentify.deactivate();
                        this.scatterPlotTemp.scatterPlotDraw();

                    } else if (value === "temporal") {

                        if (registry.byId("layerSelectorView").value === "Sentinel2_2553" && !this.map.secureService) {
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
                                newSentinel.extent = this.primaryLayer.extent;


                                this.config.urlSentinel = "https://sentinel.arcgis.com/arcgis/rest/services/Sentinel2/ImageServer";
                                this.map.removeLayer(this.primaryLayer);
                                this.primaryLayer = null;
                                this.map.addLayer(newSentinel);
                                this.primaryLayer = this.map.getLayer(newSentinel.id);
                                this.map.primaryLayer = this.primaryLayer;
                                document.getElementById("signInThumbnail").src = "./widgets/ISHeader/images/user.png";
                                document.getElementById("userName").innerHTML = "   Sign Out";
                                this.spectralProf.onClose();
                                this.scatterPlotTemp.onClose();
                                this.maskTemp.onClose();
                                this.queryLayer.onClose();
                                domStyle.set("temporalTemplate", "display", "block");
                                
                                this.toolFlag = 4;
                                this.temporalProf.onOpen();

                            })).otherwise(lang.hitch(this, function (error) {
                                domStyle.set("sentinelTemporal", "display", "block");
                                registry.byId("imageryTool").set("value", "0");
                            }));
                        } else {

                            this.spectralProf.onClose();
                            this.scatterPlotTemp.onClose();
                            this.maskTemp.onClose();
                            this.queryLayer.onClose();
                            domStyle.set("temporalTemplate", "display", "block");
                            
                            this.toolFlag = 4;
                            this.temporalProf.onOpen();
                        }

                    } else if (value === "0") {
                       
                        this.maskTemp.onClose();
                        this.spectralProf.onClose();
                        this.scatterPlotTemp.onClose();
                        this.temporalProf.onClose();
                        this.queryLayer.onClose();
                        this.toolFlag = 0;
                    } else if (value === 'query') {
                        this.maskTemp.onClose();
                        this.spectralProf.onClose();
                        this.scatterPlotTemp.onClose();
                        this.temporalProf.onClose();
                        this.queryLayer.onOpen();
                        domStyle.set("queryAOITemplate", "display", "block");
                        
                        this.queryLayer.removeMapClickFunction();
                        this.toolFlag = 5;
                        
                    } else if (value === 'zones') {
                        this.maskTemp.onClose();
                        this.spectralProf.onClose();
                        this.scatterPlotTemp.onClose();
                        this.temporalProf.onClose();
                        this.queryLayer.onOpen();
                        domStyle.set("zonestemplate", "display", "block");
                        
                        this.queryLayer.removeMapClickFunction();
                        this.toolFlag = 5;
                    } else if (value === 'aoi') {
                        this.maskTemp.onClose();
                        this.spectralProf.onClose();
                        this.scatterPlotTemp.onClose();
                        this.temporalProf.onClose();
                        this.queryLayer.onOpen();
                        domStyle.set("aoitemplate", "display", "block");
                        
                        
                        this.toolFlag = 5;
                    }
                }));
                registry.byId("refreshImageSliderView").on("click", lang.hitch(this, this.imageSliderRefresh));
                registry.byId("cloudFilterView").on("change", lang.hitch(this, this.imageSliderRefresh));
                registry.byId("imageViewer").on("change", lang.hitch(this, this.setFilterDiv));
                registry.byId("layerSelectorView").on("change", lang.hitch(this, this.selectLayer));
                this.fillLayerSelector();
                this.maskTemp = new Mask({ map: this.map, config: this.config, layers: this.layerInfos, nls: this.nls, mainConfig: this });
                this.spectralProf = new Identify({ map: this.map, config: this.config, nls: this.nls, mainConfig: this });
                this.scatterPlotTemp = new Identify({ map: this.map, config: this.config, nls: this.nls, mainConfig: this });
                this.temporalProf = new Temporal({ map: this.map, config: this.config, layers: this.layerInfos, nls: this.nls, mainConfig: this });
                this.queryLayer = new QueryLayer({ map: this.map, config: this.config, layers: this.layerInfos, nls: this.nls, mainConfig: this });
                if (this.map) {
                    this.map.on("update-start", lang.hitch(this, this.showLoading));
                    this.map.on("update-end", lang.hitch(this, this.hideLoading));
                }
                this.setTooltips();

                //this.resizeBtn();

                if (this.config.defaultLayer) {
                    registry.byId("layerSelectorView").set("value", this.config.defaultLayer);
                }

                this.symbol = new SimpleFillSymbol();
                this.symbol.setStyle(SimpleFillSymbol.STYLE_SOLID);
                this.symbol.setOutline(new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0, 255, 255]), 2));
                this.symbol.setColor(new Color([0, 255, 255, 0.2]));

                document.getElementById("renderingInfo").addEventListener("click", lang.hitch(this, function () {
                    if (!registry.byId("rendererInfoDialog").open) {
                        registry.byId("rendererInfoDialog").show();
                        domStyle.set("rendererInfoDialog", "top", "110px");
                        if (!window.appInfo.isRunInMobile) {
                            domStyle.set("rendererInfoDialog", "left", 170 + document.getElementById("Explore Imagery").offsetWidth + "px");
                        } else {
                            domStyle.set("rendererInfoDialog", "left", "20vw");
                        }
                    } else {
                        registry.byId("rendererInfoDialog").hide();
                    }
                    if (registry.byId("sensorInfoDialog").open) {
                        registry.byId("sensorInfoDialog").hide();
                    }
                }));

                document.getElementById("sensorInfo").addEventListener("click", lang.hitch(this, function () {
                    if (!registry.byId("sensorInfoDialog").open) {
                        registry.byId("sensorInfoDialog").show();
                        domStyle.set("sensorInfoDialog", "top", "110px");
                        if (!window.appInfo.isRunInMobile) {
                            domStyle.set("sensorInfoDialog", "left", 170 + document.getElementById("Explore Imagery").offsetWidth + "px");
                        } else {
                            domStyle.set("sensorInfoDialog", "left", "20vw");
                        }
                    } else {
                        registry.byId("sensorInfoDialog").hide();
                    }
                    if (registry.byId("rendererInfoDialog").open) {
                        registry.byId("rendererInfoDialog").hide();
                    }
                }));

                if (dom.byId("leftLayerSelector")) {
                    registry.byId("layerSelectorView").set("value", registry.byId("leftLayerSelector").value);
                }

                //registry.byId("imageryTool").getOptions("temporal").disabled = "disabled";

                registry.byId('applyExp').on("click", lang.hitch(this, this.stretchfnExp));
                registry.byId('resetExp').on("click", lang.hitch(this, this.reset1Exp));
                registry.byId('applyIndexExp').on("click", lang.hitch(this, this.indexFunctionExp));
                
                // registry.byId('define-aoi-ch').on('change', lang.hitch(this, function(val) {
                //     if (val) {
                //         domStyle.set('define-aoi-div', 'display', 'block');
                //     } else {
                //         domStyle.set('define-aoi-div', 'display', 'none');
                //         if (this.map.aoi) {
                //             this.map.aoi = null;
                //         }
                //         this.map.getLayer(registry.byId('layerSelectorView').get('value')).setRenderingRule(new RasterFunction({ "rasterFunction": registry.byId('layerRendererView').get('value') }));
                //         this.map.clip = null;
                //     }
                // }))
            },

            fillLayerSelector: function () {
                registry.byId("layerSelectorView").addOption({ label: "Basemap", value: "none" });
                var layer;
                for (var a in this.layerInfos) {
                    layer = this.map.getLayer(a);
                    if (layer) {
                        registry.byId("layerSelectorView").addOption({ label: this.layerInfos[a].title, value: layer.id });
                        this.layerInfos[a].defaultMosaicRule = (layer.mosaicRule || layer.defaultMosaicRule || null);
                        this.layerInfos[a].defaultRenderer = layer.renderer;
                        this.layerInfos[a].defaultRenderingRule = layer.renderingRule;
                        this.layerInfos[a].defaultBandIds = layer.bandIds;
                        this.layerInfos[a].state = false;
                        this.layerInfos[a].age = 0;
                        this.layerInfos[a].ageString = "days";
                        this.layerInfos[a].type = "image";
                        this.layerInfos[a].currentValue = null;
                    }

                }

            },

            timebook: function () {
                if (registry.byId("layerSelectorView").value !== "none") {
                    var getLayerProperties = this.map.getLayer(registry.byId("layerSelectorView").value);
                    if (getLayerProperties.id === "MS_696") {
                        this.acquisitionDate = "AcquisitionDate";
                        this.title = "Landsat";
                    } else if (getLayerProperties.id === "Sentinel2_2553") {
                        this.acquisitionDate = "acquisitiondate";
                        this.title = "Sentinel 2";
                    } else if (getLayerProperties.id === 'naip123') {
                        this.acquisitionDate = "AcquisitionDate";
                        this.title = "NAIP";
                    } else if (getLayerProperties.id === 'dea123') {
                        this.acquisitionDate = "AcquisitionDate";
                        this.title = "Sentinel L2A";
                    } else if (getLayerProperties.id === "planet123") {
                        this.acquisitionDate = "AcqDate";
                        this.title = "Planet";
                    }
                    if (getLayerProperties && (!getLayerProperties.mosaicRule || getLayerProperties.mosaicRule.method !== "esriMosaicLockRaster")) {


                        //dom.byId("dateDisplay").innerHTML = this.title + " - &nbsp;&nbsp;" + locale.format(new Date(result.samples[0].attributes[this.acquisitionDate]), { selector: "date", formatLength: "long" });
                        dom.byId("dateDisplay").innerHTML = this.title;

                    } else if (getLayerProperties && (getLayerProperties.mosaicRule || getLayerProperties.mosaicRule.method === "esriMosaicLockRaster")) {
                        if (registry.byId("imageViewer").checked) {
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
                                    dom.byId("dateDisplay").innerHTML = this.title + " - &nbsp;&nbsp;" + locale.format(new Date(result.samples[0].attributes[this.acquisitionDate]), { selector: "date", formatLength: "long" });
                                    //dom.byId("compDisplay").innerHTML = "&nbsp;&nbsp; Compared with - "+ this.title;
                                }
                            }), lang.hitch(this, function () {
                                this.hideLoading();
                            }));
                        } else {
                            dom.byId("dateDisplay").innerHTML = this.title;
                        }
                    }
                } else {
                    dom.byId("dateDisplay").innerHTML = "Basemap";
                }
            },

            setTooltips: function () {
                this.switchDisplayTooltip = new Tooltip({
                    connectId: ['dropDownListView'],
                    position: ['below'],
                    label: this.nls.dropDown
                });

                new Tooltip({
                    connectId: ["imageViewer"],
                    position: ['below'],
                    label: this.nls.enableSearchImages
                });

                new Tooltip({
                    connectId: ["refreshImageSliderView"],
                    position: ['after', 'below'],
                    label: this.nls.refreshQuery
                });
            },

            onOpen: function () {
                registry.byId('exploreImageryOnOff').set('value', 'on');   //#270
                if (registry.byId("sensorNAME").get("value")) {
                    if (registry.byId("sensorNAME").get("value") !== "MS_696") {
                        registry.byId("layerSelectorView").set("value", registry.byId("sensorNAME").get("value"));
                        registry.byId("sensorNAME").set("value", "");
                    }
                }

                if (registry.byId('cloudValue').get('value')) {
                    registry.byId('cloudFilterView').set('value', Number(registry.byId('cloudValue').get('value')));
                }

                // if (dom.byId("leftLayerRenderer")) {
                //     if (registry.byId('leftLayerRenderer').value === 'spectralindexvalue' && registry.byId('layerRendererView')) {
                        
                //     }
                // }

                // console.log('onOpen');
                if (this.map.secureService) {
                    this.config.urlSentinel = "https://sentinel.arcgis.com/arcgis/rest/services/Sentinel2/ImageServer";
                } else {
                    this.config.urlSentinel = "https://utility.arcgis.com/usrsvcs/servers/d70ebb358d28463a99e574d56265dd95/rest/services/Sentinel2/ImageServer";
                }

                if (registry.byId("layerSelectorView").value === "Sentinel2_2553" && !this.map.secureService && registry.byId("imageViewer").checked) {
                    registry.byId("imageViewer").set("checked", false);
                }

                if (!this.date) {
                    this.timebook();
                } else {
                    if (registry.byId("layerSelectorView").value === "MS_696") {
                        dom.byId("dateDisplay").innerHTML = "Landsat - &nbsp;&nbsp;" + locale.format(new Date(this.date), { selector: "date", formatLength: "long" });
                    } else if (registry.byId("layerSelectorView").value === "Sentinel2_2553") {
                        dom.byId("dateDisplay").innerHTML = "Sentinel 2 - &nbsp;&nbsp;" + locale.format(new Date(this.date), { selector: "date", formatLength: "long" });
                    } else if (registry.byId("layerSelectorView").value === "naip123") {
                        dom.byId("dateDisplay").innerHTML = "NAIP - &nbsp;&nbsp;" + locale.format(new Date(this.date), { selector: "date", formatLength: "long" });
                    } else if (registry.byId("layerSelectorView").value === "planet123") {
                        dom.byId("dateDisplay").innerHTML = "Planet - &nbsp;&nbsp;" + locale.format(new Date(this.date), { selector: "date", formatLength: "long" });
                    } else if (registry.byId("layerSelectorView").value === "dea123") {
                        dom.byId("dateDisplay").innerHTML = "Sentinel L2A - &nbsp;&nbsp;" + locale.format(new Date(this.date), { selector: "date", formatLength: "long" });
                    } 
                    else {
                        dom.byId("dateDisplay").innerHTML = "Basemap";
                    }
                }
                if (!this.previousInfo) {
                    this.previousInfo = {
                        extent: this.map.extent,
                        level: this.map.getLevel()
                    };
                    this.previousExtentChangeLevel = this.previousInfo.level;
                }
                if (registry.byId("layerSelectorView").value === "none") {
                    this.primaryLayer = null;
                    for (var a in this.layerInfos) {

                        this.map.getLayer(a).hide();

                    }
                    domStyle.set("imageSelectCheckBoxView", "display", "none");
                    domStyle.set("rendererView", "display", "none");
                    registry.byId("imageViewer").set("checked", false);
                } else {
                    this.primaryLayer = this.map.getLayer(registry.byId("layerSelectorView").value);
                    this.primaryLayer.show();
                    for (var a in this.layerInfos) {
                        if (a !== this.primaryLayer.id) {
                            if (this.map.getLayer(a)) {
                            this.map.getLayer(a).hide();
                            }
                        }
                    }
                }
                if (this.map.getLevel() < this.config.zoomLevel) {
                    registry.byId("imageViewer").set("checked", false);
                    registry.byId("imageViewer").set("disabled", true);
                    html.set(document.getElementById("errorDivView"), this.nls.zoomIn);
                }
                this.imageSliderShow();
                if (this.toolFlag === 2) {
                    domStyle.set("identifysp", "display", "none");
                    html.set("identifytab", "");
                    this.spectralProf.primaryLayer = this.primaryLayer;
                    this.spectralProf.onOpen();

                }
                if (this.toolFlag === 1) {
                    domStyle.set("maskTemplate", "display", "block");
                    this.maskTemp.clearResultLayer();
                    this.maskTemp.primaryLayer = this.primaryLayer;
                    this.maskTemp.onOpen();
                    this.maskTemp.populateBands();
                }
                if (this.toolFlag === 3) {

                    this.scatterPlotTemp.primaryLayer = this.primaryLayer;
                    this.scatterPlotTemp.onOpen();
                    this.scatterPlotTemp.scatterPlotDraw();
                }
                if (this.map) {
                    this.extentHandlerExplore = this.map.on("extent-change", lang.hitch(this, this.mapExtentChange));
                }
                // if (registry.byId("imageViewer").get("checked")) {
                //     //domAttr.remove("temporalid", "disabled");
                //     registry.byId("imageryTool").getOptions("temporal").disabled = false;
                // } else {
                //     registry.byId("imageryTool").getOptions("temporal").disabled = "disabled";
                // }    

                if (registry.byId("changeMaskDetect").get("value") === "mask") {
                    registry.byId("imageryTool").set("value", "mask");
                }

                // if (this.map.getLayer(registry.byId('layerSelectorView').value).renderer || this.map.getLayer(registry.byId('layerSelectorView').value).bandIds) {
                //     this.defaultRenderer = this.map.getLayer(registry.byId('layerSelectorView').value).renderer;
                //     this.defaultRenderingRule = this.map.getLayer(registry.byId('layerSelectorView').value).renderingRule;
                //     this.defaultBandIds = this.map.getLayer(registry.byId('layerSelectorView').value).bandIds;
                //     this.populateRendererList();
                // }
                if (registry.byId('layerRendererView').getOptions('spectralindexvalue') && registry.byId('layerRendererView').getOptions('spectralindexvalue').label.includes('Visual')) {
                    registry.byId('methodMask').removeOption(registry.byId("methodMask").getOptions(5));                  
                }
                registry.byId('imageryTool').set("value", "0");
            },

            selectLayer: function (value) {

                if (this.config.display === "both") {
                    domStyle.set("imageSelectContainerView", "display", "inline-block");
                } else {
                    if (this.config.display === "dropdown") {
                        this.imageDisplayFormat();
                    }
                    domStyle.set("imageSelectContainerView", "display", "none");
                }

                if (this.primaryLayer) {
                    this.primaryLayer.hide();
                }
                if (value === "none") {
                    domStyle.set("maskTemplate", "display", "none");
                    domStyle.set("spectralTemplate", "display", "none");
                    domStyle.set("scatterTemplate", "display", "none");
                    this.primaryLayer = null;
                    for (var a in this.layerInfos) {
                        this.map.getLayer(a).hide();
                    }
                    if (this.map.secondaryLayer) {
                        this.map.secondaryLayer.hide();
                    }
                    domStyle.set("imageSelectCheckBoxView", "display", "none");
                    domStyle.set("rendererView", "display", "none");
                    domStyle.set("optionsDivExp", "display", "none");
                    registry.byId("imageViewer").set("checked", false);
                    dom.byId("dateDisplay").innerHTML = "Basemap";
                } else {
                    domStyle.set("optionsDivExp", "display", "block");
                    if (this.secondaryLayer) {
                        this.secondaryLayer.suspend();
                        this.map.removeLayer(this.secondaryLayer);
                        this.secondaryLayer = null;
                    }
                    this.map.primaryLayerChanged = 1;
                    this.layerChanged = true;
                    domStyle.set("updateMaskLayer", "display", "none");
                    this.valueSelected = null;
                    this.primaryLayer = this.map.getLayer(value);
                    this.map.primaryLayer = this.primaryLayer;
                    this.primaryLayer.show();
                    for (var a in this.layerInfos) {
                        if (a !== this.primaryLayer.id) {
                            if (this.map.getLayer(a)) {
                            this.map.getLayer(a).hide();
                            }
                        }
                    }
                    this.maskTemp?.populateBands();
                    if (this.toolFlag === 2) {
                        domStyle.set("identifysp", "display", "none");
                        html.set("identifytab", "");
                        this.updateBandFlag = 0;
                        this.spectralProf.primaryLayer = this.primaryLayer;
                        this.spectralProf.onOpen();

                    }
                    if (this.toolFlag === 1) {
                        domStyle.set("maskTemplate", "display", "block");
                        this.maskTemp.clearResultLayer();
                        this.maskTemp.primaryLayer = this.primaryLayer;
                        this.maskTemp.populateBands();
                    }
                    if (this.toolFlag === 3) {
                        this.scatterPlotTemp.onClose();
                        this.scatterPlotTemp.primaryLayer = this.primaryLayer;
                        this.scatterPlotTemp.onOpen();
                        this.scatterPlotTemp.scatterPlotDraw();
                    }
                    if (this.toolFlag === 5) {
                        //this.queryLayer.updateBands();
                        document.getElementById('segment-msg').style.display = 'block';
                    }
                    if (this.toolFlag === 4) {
                        if (!(registry.byId("layerSelectorView").value === "Sentinel2_2553" && !this.map.secureService)) {
                            this.temporalProf.onClose();
                            this.temporalProf.onOpen();
                        } else {
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
                                newSentinel.extent = this.primaryLayer.extent;


                                this.config.urlSentinel = "https://sentinel.arcgis.com/arcgis/rest/services/Sentinel2/ImageServer";
                                this.map.removeLayer(this.primaryLayer);
                                this.primaryLayer = null;
                                this.map.addLayer(newSentinel);
                                this.primaryLayer = this.map.getLayer(newSentinel.id);
                                this.map.primaryLayer = this.primaryLayer;
                                document.getElementById("signInThumbnail").src = "./widgets/ISHeader/images/user.png";
                                document.getElementById("userName").innerHTML = "   Sign Out";
                                this.temporalProf.onClose();
                                this.temporalProf.onOpen();

                            })).otherwise(lang.hitch(this, function (error) {
                                domStyle.set("sentinelTemporal", "display", "block");
                                registry.byId("imageryTool").set("value", "0");
                            }));
                        }
                    }
                    if (!this.layerInfos[value].imageSelector) {
                        domStyle.set("imageSelectCheckBoxView", "display", "none");
                        registry.byId("imageViewer").set("checked", false);
                    } else {
                        domStyle.set("imageSelectCheckBoxView", "display", "block");
                        this.defaultMosaicRule = this.layerInfos[value].defaultMosaicRule;
                        this.defaultRenderer = this.layerInfos[value].defaultRenderer;
                        this.defaultBandIds = this.layerInfos[value].defaultBandIds;
                        this.defaultRenderingRule = this.layerInfos[value].defaultRenderingRule;

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
                    if (this.config.showRendering) {
                        this.populateRendererList();
                    }
                    this.timebook();
                }
                if (dom.byId("leftLayerSelector")) {
                    registry.byId("leftLayerSelector").set("value", registry.byId("layerSelectorView").value);
                }


                if (registry.byId("layerSelectorView").get("value") === "MS_696") {
                    if (this.config.renderInfo.landsat[registry.byId("layerRendererView").value]) {
                        html.set(dom.byId("renderDescription"), this.config.renderInfo.landsat[registry.byId("layerRendererView").value].description);
                    } else {
                        html.set(dom.byId("renderDescription"), 'Spectral Index RFT applied as a rendering rule.');
                    }
                    html.set(dom.byId("sensorDescription"), "Landsat 8 OLI, 30m multispectral and multitemporal 8-band imagery, with on-the-fly renderings and indices. Additional Landsat services can be found <a href='https://www.arcgis.com/home/group.html?id=a74dff13f1be4b2ba7264c3315c57077#overview' target='_blank'>here</a>");
                } else if (registry.byId("layerSelectorView").get("value") === "Sentinel2_2553") {
                    if (this.config.renderInfo.sentinel[registry.byId("layerRendererView").value]) {
                        html.set(dom.byId("renderDescription"), this.config.renderInfo.sentinel[registry.byId("layerRendererView").value].description);
                    } else {
                        html.set(dom.byId("renderDescription"), 'Spectral Index RFT applied as a rendering rule.');
                    }
                    html.set(dom.byId("sensorDescription"), "Sentinel-2, 10m Multispectral, Multitemporal, 13-band images with visual renderings and indices. - <a href='https://www.arcgis.com/home/item.html?id=fd61b9e0c69c4e14bebd50a9a968348c' target='_blank'>Find here</a>");
                } else {
                    html.set(dom.byId("renderDescription"), "Basemap");
                    html.set(dom.byId("sensorDescription"), "Basemap");
                }



            },

            populateRendererList: function () {
                registry.byId("layerRendererView").removeOption(registry.byId("layerRendererView").getOptions());
                var currentRenderer = this.primaryLayer.renderingRule ? this.primaryLayer.renderingRule : null;
                for (var a in this.primaryLayer.rasterFunctionInfos) {
                    // if (this.defaultRenderer || this.defaultBandIds) {
                    //     var rendererExist = true;
                    // }
                    if (currentRenderer && currentRenderer.functionName && this.primaryLayer.rasterFunctionInfos[a].name === currentRenderer.functionName) {
                        var setRenderer = true;
                    }
                    registry.byId("layerRendererView").addOption({ label: this.primaryLayer.rasterFunctionInfos[a].name, value: this.primaryLayer.rasterFunctionInfos[a].name });

                }
                if (this.primaryLayer.url === this.config.urlPlanet) {
                    registry.byId("layerRendererView").addOption({ label: "RGB", value: "RGB" });
                }
                if (registry.byId("layerRendererView").getOptions().length > 0) {
                    // if (rendererExist) {
                    //     registry.byId("layerRendererView").addOption({ label: "Default", value: "default" });
                    // }
                    if (setRenderer) {

                        registry.byId("layerRendererView").set("value", currentRenderer.functionName);
                    } else {
                        registry.byId("layerRendererView").addOption({ label: currentRenderer.functionName, value: "spectralindexvalue" });
                        registry.byId("layerRendererView").set('value', 'spectralindexvalue');
                    }

                    registry.byId("layerRendererView").addOption({ label: "Custom Bands", value: "Build" });
                    registry.byId("layerRendererView").addOption({ label: "Custom Index", value: "Index" });
                    domStyle.set("rendererView", "display", "block");

                    
                    if (this.map.getLayer(registry.byId('layerSelectorView').value).currentVersion >= 10.60) {
                        registry.byId("layerRendererView").addOption({ label: "Spectral Index", value: "Spectral Index" });
                    } else {
                        if (registry.byId("Spectral Index Library") && registry.byId("Spectral Index Library").open) {
                            document.getElementsByClassName('icon-node')[2].click();
                        }
                    }

                    if (registry.byId("renderNAME").get("value")) {
                        
                            registry.byId("layerRendererView").set("value", registry.byId("renderNAME").get("value"));
                            registry.byId("renderNAME").set("value", "");
                         
                        
                    } else if (this.map.appRenderer) {
                        registry.byId("layerRendererView").addOption({ label: this.map.appRenderer.name, value: "spectralindexvalue" });
                        registry.byId("layerRendererView").set("value", "spectralindexvalue");
                        var tempRend = new RasterFunction(this.map.appRenderer);
                        setTimeout(lang.hitch(this, function() {
                            this.primaryLayer.setRenderingRule(tempRend);
                        }), 5000);
                        
                    }

                } else {
                    if (this.map.getLayer(registry.byId('layerSelectorView').value).currentVersion >= 10.60) {
                        registry.byId("layerRendererView").addOption({ label: "Spectral Index", value: "Spectral Index" });
                    } else if (this.map.getLayer(registry.byId('layerSelectorView').value).currentVersion < 10.60) {
                        if (registry.byId("Spectral Index Library") && registry.byId("Spectral Index Library").open) {
                            document.getElementsByClassName('icon-node')[2].click();
                        }
                    } else {
                        domStyle.set("rendererView", "display", "none");
                    }
                }

            },

            setRenderingRule: function (value) {
                if (this.primaryLayer) {
                    if (value === "default") {
                        domStyle.set("buildExtensionExp", "display", "none");
                        domStyle.set("formulaExp", "display", "none");
                        domStyle.set("indexExtensionExp", "display", "none");
                        
                        this.primaryLayer.setBandIds(this.defaultBandIds, true);
                        if (!this.map.clip) {
                        this.primaryLayer.setRenderingRule(this.defaultRenderingRule, true);
                        } else {
                            this.map.clip.functionArguments.Raster = this.defaultRenderingRule;
                            this.primaryLayer.setRenderingRule(this.map.clip, true);
                        }
                        this.primaryLayer.setRenderer(this.defaultRenderer);

                    } else if (value === 'spectralindexvalue') {
                        domStyle.set("buildExtensionExp", "display", "none");
                        domStyle.set("formulaExp", "display", "none");
                        domStyle.set("indexExtensionExp", "display", "none");
                        if (!this.map.clip) {
                        this.primaryLayer.setRenderingRule(this.map.spectralRenderer);
                        } else {
                            this.map.clip.functionArguments.Raster = this.map.spectralRenderer;
                            this.primaryLayer.setRenderingRule(this.map.clip);
                        }
                        if (registry.byId('layerRendererView').getOptions('spectralindexvalue') && registry.byId('layerRendererView').getOptions('spectralindexvalue').label.includes('Visual')) {
                            if (registry.byId("methodMask").getOptions(5)) {
                                registry.byId('methodMask').removeOption(registry.byId("methodMask").getOptions(5));       
                            }           
                        } else if (registry.byId('layerRendererView').getOptions('spectralindexvalue') && registry.byId('layerRendererView').getOptions('spectralindexvalue').label.includes('Analytic')) {
                            if (registry.byId("methodMask").getOptions(5)) {
                                registry.byId("methodMask").removeOption(registry.byId("methodMask").getOptions(5));
                            }
							registry.byId("methodMask").addOption({ label: registry.byId('layerRendererView').getOptions('spectralindexvalue').label, value: registry.byId('layerRendererView').getOptions('spectralindexvalue').label });
                        }
                    }

                    else if (value === "Spectral Index") {
                        domStyle.set("buildExtensionExp", "display", "none");
                        domStyle.set("formulaExp", "display", "none");
                        domStyle.set("indexExtensionExp", "display", "none");
                        document.getElementsByClassName('icon-node')[2].click();

                    } else if (value === "Build") {
                        domStyle.set("buildExtensionExp", "display", "block");
                        domStyle.set("formulaExp", "display", "none");
                        domStyle.set("indexExtensionExp", "display", "none");
                        registry.byId("bnd1Exp").removeOption(registry.byId("bnd1Exp").getOptions());
                        registry.byId("bnd2Exp").removeOption(registry.byId("bnd2Exp").getOptions());
                        registry.byId("bnd3Exp").removeOption(registry.byId("bnd3Exp").getOptions());

                        if (this.primaryLayer.url === this.config.urlLandsatMS) {
                            registry.byId("bnd1Exp").addOption({ label: "Coastal(1)", value: "1" });
                            registry.byId("bnd1Exp").addOption({ label: "Blue(2)", value: "2" });
                            registry.byId("bnd1Exp").addOption({ label: "Green(3)", value: "3" });
                            registry.byId("bnd1Exp").addOption({ label: "Red(4)", value: "4" });
                            registry.byId("bnd1Exp").addOption({ label: "NIR(5)", value: "5" });
                            registry.byId("bnd1Exp").addOption({ label: "SWIR1(6)", value: "6" });
                            registry.byId("bnd1Exp").addOption({ label: "SWIR2(7)", value: "7" });
                            registry.byId("bnd1Exp").addOption({ label: "Cirrus(8)", value: "8" });
                            registry.byId("bnd1Exp").set("value", "6");

                            registry.byId("bnd2Exp").addOption({ label: "Coastal(1)", value: "1" });
                            registry.byId("bnd2Exp").addOption({ label: "Blue(2)", value: "2" });
                            registry.byId("bnd2Exp").addOption({ label: "Green(3)", value: "3" });
                            registry.byId("bnd2Exp").addOption({ label: "Red(4)", value: "4" });
                            registry.byId("bnd2Exp").addOption({ label: "NIR(5)", value: "5" });
                            registry.byId("bnd2Exp").addOption({ label: "SWIR1(6)", value: "6" });
                            registry.byId("bnd2Exp").addOption({ label: "SWIR2(7)", value: "7" });
                            registry.byId("bnd2Exp").addOption({ label: "Cirrus(8)", value: "8" });
                            registry.byId("bnd2Exp").set("value", "5");

                            registry.byId("bnd3Exp").addOption({ label: "Coastal(1)", value: "1" });
                            registry.byId("bnd3Exp").addOption({ label: "Blue(2)", value: "2" });
                            registry.byId("bnd3Exp").addOption({ label: "Green(3)", value: "3" });
                            registry.byId("bnd3Exp").addOption({ label: "Red(4)", value: "4" });
                            registry.byId("bnd3Exp").addOption({ label: "NIR(5)", value: "5" });
                            registry.byId("bnd3Exp").addOption({ label: "SWIR1(6)", value: "6" });
                            registry.byId("bnd3Exp").addOption({ label: "SWIR2(7)", value: "7" });
                            registry.byId("bnd3Exp").addOption({ label: "Cirrus(8)", value: "8" });
                            registry.byId("bnd3Exp").set("value", "2");

                            registry.byId("stretchoptionsExp").set("value", "clip2");
                            registry.byId("gammaoptionsExp").set("value", "4");
                        } else if (this.primaryLayer.url === this.config.urlSentinel) {
                            registry.byId("bnd1Exp").addOption({ label: "Coastal(1)", value: "1" });
                            registry.byId("bnd1Exp").addOption({ label: "Blue(2)", value: "2" });
                            registry.byId("bnd1Exp").addOption({ label: "Green(3)", value: "3" });
                            registry.byId("bnd1Exp").addOption({ label: "Red(4)", value: "4" });
                            registry.byId("bnd1Exp").addOption({ label: "VRE(5)", value: "5" });
                            registry.byId("bnd1Exp").addOption({ label: "VRE(6)", value: "6" });
                            registry.byId("bnd1Exp").addOption({ label: "VRE(7)", value: "7" });
                            registry.byId("bnd1Exp").addOption({ label: "NIR(8)", value: "8" });
                            registry.byId("bnd1Exp").addOption({ label: "NarrowNIR(8A)", value: "9" });
                            registry.byId("bnd1Exp").addOption({ label: "Water Vapor(9)", value: "10" });
                            registry.byId("bnd1Exp").addOption({ label: "Cirrus(10)", value: "11" });
                            registry.byId("bnd1Exp").addOption({ label: "SWIR(11)", value: "12" });
                            registry.byId("bnd1Exp").addOption({ label: "SWIR(12)", value: "13" });
                            registry.byId("bnd1Exp").set("value", "12");

                            registry.byId("bnd2Exp").addOption({ label: "Coastal(1)", value: "1" });
                            registry.byId("bnd2Exp").addOption({ label: "Blue(2)", value: "2" });
                            registry.byId("bnd2Exp").addOption({ label: "Green(3)", value: "3" });
                            registry.byId("bnd2Exp").addOption({ label: "Red(4)", value: "4" });
                            registry.byId("bnd2Exp").addOption({ label: "VRE(5)", value: "5" });
                            registry.byId("bnd2Exp").addOption({ label: "VRE(6)", value: "6" });
                            registry.byId("bnd2Exp").addOption({ label: "VRE(7)", value: "7" });
                            registry.byId("bnd2Exp").addOption({ label: "NIR(8)", value: "8" });
                            registry.byId("bnd2Exp").addOption({ label: "NarrowNIR(8A)", value: "9" });
                            registry.byId("bnd2Exp").addOption({ label: "Water Vapor(9)", value: "10" });
                            registry.byId("bnd2Exp").addOption({ label: "Cirrus(10)", value: "11" });
                            registry.byId("bnd2Exp").addOption({ label: "SWIR(11)", value: "12" });
                            registry.byId("bnd2Exp").addOption({ label: "SWIR(12)", value: "13" });
                            registry.byId("bnd2Exp").set("value", "8");

                            registry.byId("bnd3Exp").addOption({ label: "Coastal(1)", value: "1" });
                            registry.byId("bnd3Exp").addOption({ label: "Blue(2)", value: "2" });
                            registry.byId("bnd3Exp").addOption({ label: "Green(3)", value: "3" });
                            registry.byId("bnd3Exp").addOption({ label: "Red(4)", value: "4" });
                            registry.byId("bnd3Exp").addOption({ label: "VRE(5)", value: "5" });
                            registry.byId("bnd3Exp").addOption({ label: "VRE(6)", value: "6" });
                            registry.byId("bnd3Exp").addOption({ label: "VRE(7)", value: "7" });
                            registry.byId("bnd3Exp").addOption({ label: "NIR(8)", value: "8" });
                            registry.byId("bnd3Exp").addOption({ label: "NarrowNIR(8A)", value: "9" });
                            registry.byId("bnd3Exp").addOption({ label: "Water Vapor(9)", value: "10" });
                            registry.byId("bnd3Exp").addOption({ label: "Cirrus(10)", value: "11" });
                            registry.byId("bnd3Exp").addOption({ label: "SWIR(11)", value: "12" });
                            registry.byId("bnd3Exp").addOption({ label: "SWIR(12)", value: "13" });
                            registry.byId("bnd3Exp").set("value", "2");

                            registry.byId("stretchoptionsExp").set("value", "clip1");
                            registry.byId("gammaoptionsExp").set("value", "5");
                        } else if (this.primaryLayer.url === this.config.urlNaip) {
                            registry.byId("bnd1Exp").addOption({ label: "Red(1)", value: "1" });
                            registry.byId("bnd1Exp").addOption({ label: "Green(2)", value: "2" });
                            registry.byId("bnd1Exp").addOption({ label: "Blue(3)", value: "3" });
                            registry.byId("bnd1Exp").addOption({ label: "NIR(4)", value: "4" });
                            registry.byId("bnd1Exp").set("value", "4");
                            

                            registry.byId("bnd2Exp").addOption({ label: "Red(1)", value: "1" });
                            registry.byId("bnd2Exp").addOption({ label: "Green(2)", value: "2" });
                            registry.byId("bnd2Exp").addOption({ label: "Blue(3)", value: "3" });
                            registry.byId("bnd2Exp").addOption({ label: "NIR(4)", value: "4" });
                            
                            registry.byId("bnd2Exp").set("value", "1");

                            registry.byId("bnd3Exp").addOption({ label: "Red(1)", value: "1" });
                            registry.byId("bnd3Exp").addOption({ label: "Green(2)", value: "2" });
                            registry.byId("bnd3Exp").addOption({ label: "Blue(3)", value: "3" });
                            registry.byId("bnd3Exp").addOption({ label: "NIR(4)", value: "4" });
                            registry.byId("bnd3Exp").set("value", "2");

                            registry.byId("stretchoptionsExp").set("value", "clip1");
                            registry.byId("gammaoptionsExp").set("value", "5");
                            
                        } else if (this.primaryLayer.url === this.config.urlDEA) {
                            registry.byId("bnd1Exp").addOption({ label: "Coastal(1)", value: "1" });
                            registry.byId("bnd1Exp").addOption({ label: "Blue(2)", value: "2" });
                            registry.byId("bnd1Exp").addOption({ label: "Green(3)", value: "3" });
                            registry.byId("bnd1Exp").addOption({ label: "Red(4)", value: "4" });
                            registry.byId("bnd1Exp").addOption({ label: "VRE(5)", value: "5" });
                            registry.byId("bnd1Exp").addOption({ label: "VRE(6)", value: "6" });
                            registry.byId("bnd1Exp").addOption({ label: "VRE(7)", value: "7" });
                            registry.byId("bnd1Exp").addOption({ label: "NIR(8)", value: "8" });
                            registry.byId("bnd1Exp").addOption({ label: "NarrowNIR(8A)", value: "9" });
                            registry.byId("bnd1Exp").addOption({ label: "Water Vapor(9)", value: "10" });
                            registry.byId("bnd1Exp").addOption({ label: "SWIR(11)", value: "11" });
                            registry.byId("bnd1Exp").addOption({ label: "SWIR(12)", value: "12" });
                            registry.byId("bnd1Exp").set("value", "12");

                            registry.byId("bnd2Exp").addOption({ label: "Coastal(1)", value: "1" });
                            registry.byId("bnd2Exp").addOption({ label: "Blue(2)", value: "2" });
                            registry.byId("bnd2Exp").addOption({ label: "Green(3)", value: "3" });
                            registry.byId("bnd2Exp").addOption({ label: "Red(4)", value: "4" });
                            registry.byId("bnd2Exp").addOption({ label: "VRE(5)", value: "5" });
                            registry.byId("bnd2Exp").addOption({ label: "VRE(6)", value: "6" });
                            registry.byId("bnd2Exp").addOption({ label: "VRE(7)", value: "7" });
                            registry.byId("bnd2Exp").addOption({ label: "NIR(8)", value: "8" });
                            registry.byId("bnd2Exp").addOption({ label: "NarrowNIR(8A)", value: "9" });
                            registry.byId("bnd2Exp").addOption({ label: "Water Vapor(9)", value: "10" });
                            registry.byId("bnd2Exp").addOption({ label: "SWIR(11)", value: "11" });
                            registry.byId("bnd2Exp").addOption({ label: "SWIR(12)", value: "12" });
                            registry.byId("bnd2Exp").set("value", "8");

                            registry.byId("bnd3Exp").addOption({ label: "Coastal(1)", value: "1" });
                            registry.byId("bnd3Exp").addOption({ label: "Blue(2)", value: "2" });
                            registry.byId("bnd3Exp").addOption({ label: "Green(3)", value: "3" });
                            registry.byId("bnd3Exp").addOption({ label: "Red(4)", value: "4" });
                            registry.byId("bnd3Exp").addOption({ label: "VRE(5)", value: "5" });
                            registry.byId("bnd3Exp").addOption({ label: "VRE(6)", value: "6" });
                            registry.byId("bnd3Exp").addOption({ label: "VRE(7)", value: "7" });
                            registry.byId("bnd3Exp").addOption({ label: "NIR(8)", value: "8" });
                            registry.byId("bnd3Exp").addOption({ label: "NarrowNIR(8A)", value: "9" });
                            registry.byId("bnd3Exp").addOption({ label: "Water Vapor(9)", value: "10" });
                            registry.byId("bnd3Exp").addOption({ label: "SWIR(11)", value: "11" });
                            registry.byId("bnd3Exp").addOption({ label: "SWIR(12)", value: "12" });
                            registry.byId("bnd3Exp").set("value", "2");

                            registry.byId("stretchoptionsExp").set("value", "clip1");
                            registry.byId("gammaoptionsExp").set("value", "5");
                        }
                        if (registry.byId("redBuild").value && registry.byId("blueBuild").value && registry.byId("greenBuild").value && registry.byId("stretchBuild").value && registry.byId("gammaBuild").value) {
                            registry.byId("bnd1Exp").set("value", registry.byId("redBuild").get("value"));
                            registry.byId("bnd2Exp").set("value", registry.byId("blueBuild").get("value"));
                            registry.byId("bnd3Exp").set("value", registry.byId("greenBuild").get("value"));
                            registry.byId("stretchoptionsExp").set("value", registry.byId("stretchBuild").get("value"));
                            registry.byId("gammaoptionsExp").set("value", registry.byId("gammaBuild").get("value"));

                            registry.byId("redBuild").set("value", "");
                            registry.byId("blueBuild").set("value", "");
                            registry.byId("greenBuild").set("value", "");
                            registry.byId("stretchBuild").set("value", "");
                            registry.byId("gammaBuild").set("value", "");

                            dom.byId("applyExp").click();
                        }

                    } else if (value === "Index") {
                        domStyle.set("buildExtensionExp", "display", "none");
                        domStyle.set("formulaExp", "display", "block");
                        domStyle.set("indexExtensionExp", "display", "block");
                        registry.byId("bandAExp").removeOption(registry.byId("bandAExp").getOptions());
                        registry.byId("bandBExp").removeOption(registry.byId("bandBExp").getOptions());

                        if (this.primaryLayer.url === this.config.urlLandsatMS) {
                            registry.byId("bandAExp").addOption({ label: "Coastal(1)", value: "1" });
                            registry.byId("bandAExp").addOption({ label: "Blue(2)", value: "2" });
                            registry.byId("bandAExp").addOption({ label: "Green(3)", value: "3" });
                            registry.byId("bandAExp").addOption({ label: "Red(4)", value: "4" });
                            registry.byId("bandAExp").addOption({ label: "NIR(5)", value: "5" });
                            registry.byId("bandAExp").addOption({ label: "SWIR1(6)", value: "6" });
                            registry.byId("bandAExp").addOption({ label: "SWIR2(7)", value: "7" });
                            registry.byId("bandAExp").addOption({ label: "Cirrus(8)", value: "8" });
                            registry.byId("bandAExp").set("value", "5");

                            registry.byId("bandBExp").addOption({ label: "Coastal(1)", value: "1" });
                            registry.byId("bandBExp").addOption({ label: "Blue(2)", value: "2" });
                            registry.byId("bandBExp").addOption({ label: "Green(3)", value: "3" });
                            registry.byId("bandBExp").addOption({ label: "Red(4)", value: "4" });
                            registry.byId("bandBExp").addOption({ label: "NIR(5)", value: "5" });
                            registry.byId("bandBExp").addOption({ label: "SWIR1(6)", value: "6" });
                            registry.byId("bandBExp").addOption({ label: "SWIR2(7)", value: "7" });
                            registry.byId("bandBExp").addOption({ label: "Cirrus(8)", value: "8" });
                            registry.byId("bandBExp").set("value", "4");

                            registry.byId("OffsetValueExp").set("value", "0");
                            registry.byId("ScaleExp").set("value", "5");
                        } else if (this.primaryLayer.url === this.config.urlSentinel) {
                            registry.byId("bandAExp").addOption({ label: "Coastal(1)", value: "1" });
                            registry.byId("bandAExp").addOption({ label: "Blue(2)", value: "2" });
                            registry.byId("bandAExp").addOption({ label: "Green(3)", value: "3" });
                            registry.byId("bandAExp").addOption({ label: "Red(4)", value: "4" });
                            registry.byId("bandAExp").addOption({ label: "VRE(5)", value: "5" });
                            registry.byId("bandAExp").addOption({ label: "VRE(6)", value: "6" });
                            registry.byId("bandAExp").addOption({ label: "VRE(7)", value: "7" });
                            registry.byId("bandAExp").addOption({ label: "NIR(8)", value: "8" });
                            registry.byId("bandAExp").addOption({ label: "NarrowNIR(8A)", value: "9" });
                            registry.byId("bandAExp").addOption({ label: "Water Vapor(9)", value: "10" });
                            registry.byId("bandAExp").addOption({ label: "Cirrus(10)", value: "11" });
                            registry.byId("bandAExp").addOption({ label: "SWIR(11)", value: "12" });
                            registry.byId("bandAExp").addOption({ label: "SWIR(12)", value: "13" });
                            registry.byId("bandAExp").set("value", "8");

                            registry.byId("bandBExp").addOption({ label: "Coastal(1)", value: "1" });
                            registry.byId("bandBExp").addOption({ label: "Blue(2)", value: "2" });
                            registry.byId("bandBExp").addOption({ label: "Green(3)", value: "3" });
                            registry.byId("bandBExp").addOption({ label: "Red(4)", value: "4" });
                            registry.byId("bandBExp").addOption({ label: "VRE(5)", value: "5" });
                            registry.byId("bandBExp").addOption({ label: "VRE(6)", value: "6" });
                            registry.byId("bandBExp").addOption({ label: "VRE(7)", value: "7" });
                            registry.byId("bandBExp").addOption({ label: "NIR(8)", value: "8" });
                            registry.byId("bandBExp").addOption({ label: "NarrowNIR(8A)", value: "9" });
                            registry.byId("bandBExp").addOption({ label: "Water Vapor(9)", value: "10" });
                            registry.byId("bandBExp").addOption({ label: "Cirrus(10)", value: "11" });
                            registry.byId("bandBExp").addOption({ label: "SWIR(11)", value: "12" });
                            registry.byId("bandBExp").addOption({ label: "SWIR(12)", value: "13" });
                            registry.byId("bandBExp").set("value", "4");

                            registry.byId("OffsetValueExp").set("value", "0");
                            registry.byId("ScaleExp").set("value", "5");
                        } else if (this.primaryLayer.url === this.config.urlNaip) {
                            registry.byId("bandAExp").addOption({ label: "Red(1)", value: "1" });
                            registry.byId("bandAExp").addOption({ label: "Green(2)", value: "2" });
                            registry.byId("bandAExp").addOption({ label: "Blue(3)", value: "3" });
                            registry.byId("bandAExp").addOption({ label: "NIR(4)", value: "4" });
                            
                            registry.byId("bandAExp").set("value", "4");

                            registry.byId("bandBExp").addOption({ label: "Red(1)", value: "1" });
                            registry.byId("bandBExp").addOption({ label: "Green(2)", value: "2" });
                            registry.byId("bandBExp").addOption({ label: "Blue(3)", value: "3" });
                            registry.byId("bandBExp").addOption({ label: "NIR(4)", value: "4" });
                           
                            registry.byId("bandBExp").set("value", "1");

                            registry.byId("OffsetValueExp").set("value", "0");
                            registry.byId("ScaleExp").set("value", "5");
                        } else if (this.primaryLayer.url === this.config.urlDEA) {
                            registry.byId("bandAExp").addOption({ label: "Coastal(1)", value: "1" });
                            registry.byId("bandAExp").addOption({ label: "Blue(2)", value: "2" });
                            registry.byId("bandAExp").addOption({ label: "Green(3)", value: "3" });
                            registry.byId("bandAExp").addOption({ label: "Red(4)", value: "4" });
                            registry.byId("bandAExp").addOption({ label: "VRE(5)", value: "5" });
                            registry.byId("bandAExp").addOption({ label: "VRE(6)", value: "6" });
                            registry.byId("bandAExp").addOption({ label: "VRE(7)", value: "7" });
                            registry.byId("bandAExp").addOption({ label: "NIR(8)", value: "8" });
                            registry.byId("bandAExp").addOption({ label: "NarrowNIR(8A)", value: "9" });
                            registry.byId("bandAExp").addOption({ label: "Water Vapor(9)", value: "10" });
                            registry.byId("bandAExp").addOption({ label: "SWIR(11)", value: "11" });
                            registry.byId("bandAExp").addOption({ label: "SWIR(12)", value: "12" });
                            registry.byId("bandAExp").set("value", "8");

                            registry.byId("bandBExp").addOption({ label: "Coastal(1)", value: "1" });
                            registry.byId("bandBExp").addOption({ label: "Blue(2)", value: "2" });
                            registry.byId("bandBExp").addOption({ label: "Green(3)", value: "3" });
                            registry.byId("bandBExp").addOption({ label: "Red(4)", value: "4" });
                            registry.byId("bandBExp").addOption({ label: "VRE(5)", value: "5" });
                            registry.byId("bandBExp").addOption({ label: "VRE(6)", value: "6" });
                            registry.byId("bandBExp").addOption({ label: "VRE(7)", value: "7" });
                            registry.byId("bandBExp").addOption({ label: "NIR(8)", value: "8" });
                            registry.byId("bandBExp").addOption({ label: "NarrowNIR(8A)", value: "9" });
                            registry.byId("bandBExp").addOption({ label: "Water Vapor(9)", value: "10" });
                            registry.byId("bandBExp").addOption({ label: "SWIR(11)", value: "11" });
                            registry.byId("bandBExp").addOption({ label: "SWIR(12)", value: "12" });
                            registry.byId("bandBExp").set("value", "4");

                            registry.byId("OffsetValueExp").set("value", "0");
                            registry.byId("ScaleExp").set("value", "5");
                        }
                        if (registry.byId("bandAIndex").value && registry.byId("bandBIndex").value && registry.byId("offsetIndex").value && registry.byId("scaleIndex").value && registry.byId("renderIndex").value) {
                            registry.byId("bandAExp").set("value", registry.byId("bandAIndex").get("value"));
                            registry.byId("bandBExp").set("value", registry.byId("bandBIndex").get("value"));
                            registry.byId("OffsetValueExp").set("value", registry.byId("offsetIndex").get("value"));
                            registry.byId("ScaleExp").set("value", registry.byId("scaleIndex").get("value"));
                            registry.byId("colorRampExp").set("value", registry.byId("renderIndex").get("value"));

                            registry.byId("bandAIndex").set("value", "");
                            registry.byId("bandBIndex").set("value", "");
                            registry.byId("offsetIndex").set("value", "");
                            registry.byId("scaleIndex").set("value", "");
                            registry.byId("renderIndex").set("value", "");

                            dom.byId("applyIndexExp").click();
                        }
                    }

                    else {


                        domStyle.set("buildExtensionExp", "display", "none");
                        domStyle.set("formulaExp", "display", "none");
                        domStyle.set("indexExtensionExp", "display", "none");
                        this.primaryLayer.setBandIds([], true);
                        this.primaryLayer.setRenderer(null);
                        if (!this.map.clip) {
                            this.primaryLayer.setRenderingRule(new RasterFunction({ "rasterFunction": value }));
                        } else {
                            this.map.clip.functionArguments.Raster = new RasterFunction({ "rasterFunction": value });
                            this.primaryLayer.setRenderingRule(this.map.clip);
                        }


                    }
                    this.primaryMosaic = registry.byId("currentOBJECTID").get("value");
                    if (this.primaryMosaic) {
                        registry.byId("imageViewer").set("checked", true);
                        registry.byId("currentOBJECTID").set("value", "");
                        //this.setFilterDiv();
                    }
                    if (registry.byId("layerSelectorView").get("value") === "MS_696") {
                        if (this.config.renderInfo.landsat[registry.byId("layerRendererView").value]) {
                            html.set(dom.byId("renderDescription"), this.config.renderInfo.landsat[registry.byId("layerRendererView").value].description);
                        } else {
                            html.set(dom.byId("renderDescription"), 'Spectral Index RFT applied as a rendering rule.');
                        }
                    } else if (registry.byId("layerSelectorView").get("value") === "Sentinel2_2553") {
                        if (this.config.renderInfo.sentinel[registry.byId("layerRendererView").value]) {
                            html.set(dom.byId("renderDescription"), this.config.renderInfo.sentinel[registry.byId("layerRendererView").value].description);
                        } else {
                            html.set(dom.byId("renderDescription"), 'Spectral Index RFT applied as a rendering rule.');
                        }
                    } else {
                        html.set(dom.byId("renderDescription"), "Basemap");
                    }
                    if (dom.byId("leftLayerRenderer")) {
                        if (registry.byId("layerRendererView").value !== 'spectralindexvalue' && registry.byId("layerRendererView").value !== 'Spectral Index') {
                            registry.byId("leftLayerRenderer").set("value", registry.byId("layerRendererView").value);
                        } else if (registry.byId("layerRendererView").value === 'spectralindexvalue') {
                            if (registry.byId('leftLayerRenderer').getOptions('spectralindexvalue')) {
                                // registry.byId('leftLayerRenderer').removeOption(registry.byId('leftLayerRenderer').getOptions('spectralindexvalue'));
                                // registry.byId('leftLayerRenderer').addOption({ label: this.map.spectralRenderer.name, value: 'spectralindexvalue'});
                                registry.byId('leftLayerRenderer').getOptions('spectralindexvalue').label = this.map.spectralRenderer.name;
                                registry.byId("leftLayerRenderer").set("value", 'spectralindexvalue');
                            }
                        }
                    }
                }
            },

            stretchfnExp: function () {
                registry.byId("redBuild").set("value", registry.byId("bnd1Exp").value);
                registry.byId("blueBuild").set("value", registry.byId("bnd2Exp").value);
                registry.byId("greenBuild").set("value", registry.byId("bnd3Exp").value);
                registry.byId("stretchBuild").set("value", registry.byId("stretchoptionsExp").value);
                registry.byId("gammaBuild").set("value", registry.byId("gammaoptionsExp").value);

                this.gammaval = registry.byId("gammaoptionsExp").get("value");
                this.gammacomputeExp();
                var abc = new RasterFunction();
                abc.functionName = 'Stretch';
                var args = {};
                var type = registry.byId("stretchoptionsExp").get("value");

                this.primaryLayer.setBandIds([parseInt(registry.byId("bnd1Exp").get("value")) - 1, parseInt(registry.byId("bnd2Exp").get("value")) - 1, parseInt(registry.byId("bnd3Exp").get("value")) - 1], false);
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
                if (!this.map.clip) {
                this.primaryLayer.setRenderingRule(abc, false);
                } else {
                    this.map.clip.functionArguments.Raster = abc;
                    this.primaryLayer.setRenderingRule(this.map.clip, false);
                }
                this.type = registry.byId("stretchoptionsExp").get("value");
                this.band1 = registry.byId("bnd1Exp").get("value");
                this.band2 = registry.byId("bnd2Exp").get("value");
                this.band3 = registry.byId("bnd3Exp").get("value");
                this.gamma = this.gammaval;
                this.saveRenderer = abc;
                this.layerflag = false;
                //html.set(dom.byId("rendererInformation"), "&nbsp;&nbsp;Rendering:&nbsp;" + "Stretch with Bands - " + this.band1 + "," + this.band2 + "," + this.band3);

            },

            gammacomputeExp: function () {
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

            reset1Exp: function () {
                var abc1 = new RasterFunction();
                abc1.functionName = "";
                var args1 = {};
                this.primaryLayer.setBandIds([], true);
                abc1.functionArguments = args1;
                abc1.variableName = "Raster";
                if (!this.map.clip) {
                this.primaryLayer.setRenderingRule(abc1, false);
                } else {
                    this.map.clip.functionArguments.Raster = abc1;
                    this.primaryLayer.setRenderingRule(this.map.clip, false);
                }
                if (this.primaryLayer.url === this.config.urlSentinel) {
                    registry.byId("bnd1Exp").set("value", "12");
                    registry.byId("bnd2Exp").set("value", "8");
                    registry.byId("bnd3Exp").set("value", "2");
                    registry.byId("stretchoptionsExp").set("value", "clip1");
                    registry.byId("gammaoptionsExp").set("value", "5");
                } else if (this.primaryLayer.url === this.config.urlLandsatMS) {
                    registry.byId("bnd1Exp").set("value", "6");
                    registry.byId("bnd2Exp").set("value", "5");
                    registry.byId("bnd3Exp").set("value", "2");
                    registry.byId("stretchoptionsExp").set("value", "clip2");
                    registry.byId("gammaoptionsExp").set("value", "4");
                }
            },

            indexFunctionExp: function () {
                registry.byId("bandAIndex").set("value", registry.byId("bandAExp").value);
                registry.byId("bandBIndex").set("value", registry.byId("bandBExp").value);
                registry.byId("offsetIndex").set("value", registry.byId("OffsetValueExp").value);
                registry.byId("scaleIndex").set("value", registry.byId("ScaleExp").value);
                registry.byId("renderIndex").set("value", registry.byId("colorRampExp").value);

                var A = "B" + registry.byId("bandAExp").get("value");
                var B = "B" + registry.byId("bandBExp").get("value");
                if (registry.byId("ScaleExp").get("value")) {
                    var S = parseInt(registry.byId("ScaleExp").get("value"));
                }
                else {
                    var S = 1;
                }
                if (registry.byId("OffsetValueExp").get("value")) {
                    var O = parseInt(registry.byId("OffsetValueExp").get("value"));
                }
                else {
                    var O = 0;
                }
                // if (value === "Custom") {
                //     this.customProp = [registry.byId("bandAExp").get("value"), registry.byId("bandBExp").get("value"), registry.byId("colorRampExp").get("value"), O, S];
                // }
                var raster = new RasterFunction();
                raster.functionName = "BandArithmetic";
                if (registry.byId("colorRampExp").get("value") === "custom" || registry.byId("colorRampExp").get("value") === "moisture") {
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

                if (registry.byId("colorRampExp").get("value") !== "custom" && registry.byId("colorRampExp").get("value") !== "moisture") {
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
                if (registry.byId("colorRampExp").get("value") === "custom") {
                    args1.Colormap = this.config.colormap;
                    args1.Raster = raster;
                } else if (registry.byId("colorRampExp").get("value") === "moisture") {
                    args1.Colormap = this.config.moisture;
                    args1.Raster = raster;
                } else {
                    args1.ColorRamp = registry.byId("colorRampExp").get("value");
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

            checkField: function (currentVersion) {
                if (currentVersion >= 10.21) {
                    if (this.map.getLevel() >= this.config.zoomLevel) {
                        if (this.layerInfos[this.primaryLayer.id].imageField && this.layerInfos[this.primaryLayer.id].objectID &&
                            this.layerInfos[this.primaryLayer.id].category) {
                            this.imageField = this.layerInfos[this.primaryLayer.id].imageField;
                            this.cloudCover = this.layerInfos[this.primaryLayer.id].cloudCover;
                            for (var a in this.primaryLayer.fields) {
                                if (this.imageField === this.primaryLayer.fields[a].name) {
                                    this.imageFieldType = this.primaryLayer.fields[a].type;
                                    break;
                                }
                            }

                            this.objectID = this.layerInfos[this.primaryLayer.id].objectID;
                            this.categoryField = this.layerInfos[this.primaryLayer.id].category;
                            registry.byId("imageViewer").set("disabled", false);
                            html.set(document.getElementById("errorDivView"), "");
                            this.setSavedState();
                        } else {
                            registry.byId("imageViewer").set("checked", false);
                            registry.byId("imageViewer").set("disabled", true);

                            if (!this.layerInfos[this.primaryLayer.id].imageField) {
                                html.set(document.getElementById("errorDivView"), this.nls.fieldNotSpec);
                            }
                            else if (!this.layerInfos[this.primaryLayer.id].objectID) {
                                html.set(document.getElementById("errorDivView"), this.nls.noObject);
                            }
                            else {
                                html.set(document.getElementById("errorDivView"), this.nls.noCategory);
                            }
                        }
                    } else {
                        registry.byId("imageViewer").set("checked", false);
                        registry.byId("imageViewer").set("disabled", true);
                        this.setFilterDiv();
                        html.set(document.getElementById("errorDivView"), this.nls.zoomIn);
                    }
                } else {
                    registry.byId("imageViewer").set("checked", false);
                    registry.byId("imageViewer").set("disabled", true);
                    html.set(document.getElementById("errorDivView"), this.nls.serviceError);
                }
            },

            setSavedState: function () {
                var layerProp = this.layerInfos[this.primaryLayer.id];

                if (registry.byId("imageViewer").checked !== layerProp.state) {
                    registry.byId("imageViewer").set("checked", layerProp.state);
                }
                else if (layerProp.state) {
                    this.setFilterDiv();
                }
            },

            mapExtentChange: function (evt) {
                if (evt.lod.level >= this.config.zoomLevel) {
                    if (registry.byId("imageViewer").get("disabled")) {
                        registry.byId("imageViewer").set("disabled", false);
                        html.set(document.getElementById("errorDivView"), "");
                    }

                    var needsUpdate = false;
                    if (evt.levelChange) {
                        var zoomLevelChange = Math.abs(evt.lod.level - this.previousInfo.level);
                        if (zoomLevelChange >= this.mapZoomFactor) {
                            console.info("Large Zoom: ", evt);
                            needsUpdate = true;
                        }
                    }

                    var panDistance = Math.abs(mathUtils.getLength(evt.extent.getCenter(), this.previousInfo.extent.getCenter()));
                    var previousMapWidth = (this.previousInfo.extent.getWidth() * this.mapWidthPanFactor);
                    var previousMapHeight = (this.previousInfo.extent.getHeight() * this.mapWidthPanFactor);   //#269
                    if (panDistance > previousMapWidth) {
                        console.info("Large Pan: ", evt);
                        needsUpdate = true;
                    }
                    //#269
                    if (panDistance > previousMapHeight) {
                        console.info("Large Pan: ", evt);
                        needsUpdate = true;
                    }
                    if (needsUpdate && this.config.autoRefresh) {
                        this.imageSliderRefresh();
                    }

                } else {
                    registry.byId("imageViewer").set("checked", false);
                    registry.byId("imageViewer").set("disabled", true);
                    html.set(document.getElementById("errorDivView"), this.nls.zoomIn);
                }
                if (needsUpdate) {  //#269
                this.previousExtentChangeLevel = evt.lod.level;
                if (this.primaryLayer) {
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
            }
                if (this.toolFlag === 4) {
                    this.temporalProf.extentChange(evt);
                } else if (this.toolFlag === 1) {
                    this.maskTemp.mapExtentChange(evt);
                }
            },

            setFilterDiv: function () {
                if (registry.byId("imageViewer").get("checked")) {
                    if (!(registry.byId("layerSelectorView").value === "Sentinel2_2553" && !this.map.secureService)) {
                        if (!this.slider) {
                            this.imageSliderShow();
                        }
                        else {
                            this.imageSliderRefresh();
                        }
                        domStyle.set("selectorDivView", "display", "block");
                        this.layerInfos[this.primaryLayer.id].state = true;
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
                            newSentinel.extent = this.primaryLayer.extent;


                            this.config.urlSentinel = "https://sentinel.arcgis.com/arcgis/rest/services/Sentinel2/ImageServer";
                            this.map.removeLayer(this.primaryLayer);
                            this.primaryLayer = null;
                            this.map.addLayer(newSentinel);
                            this.primaryLayer = this.map.getLayer(newSentinel.id);
                            this.map.primaryLayer = this.primaryLayer;
                            document.getElementById("signInThumbnail").src = "./widgets/ISHeader/images/user.png";
                            document.getElementById("userName").innerHTML = "   Sign Out";
                            if (!this.slider) {
                                this.imageSliderShow();
                            }
                            else {
                                this.imageSliderRefresh();
                            }
                            domStyle.set("selectorDivView", "display", "block");
                            this.layerInfos[this.primaryLayer.id].state = true;

                        })).otherwise(lang.hitch(this, function (error) {
                            registry.byId("imageViewer").set("checked", false);
                            domStyle.set("sentinelTemporal", "display", "block");
                        }));
                    }
                } else {
                    domStyle.set("selectorDivView", "display", "none");
                    this.map.graphics.clear();
                    this.map.mosaicRule = null;
                    if (this.primaryLayer && this.primaryLayer.defaultMosaicRule) {
                        var mr = new MosaicRule(this.layerInfos[this.primaryLayer.id].defaultMosaicRule);
                        this.primaryLayer.setMosaicRule(mr);
                        this.layerInfos[this.primaryLayer.id].state = false;
                    }
                    this.timebook();

                }
            },

            imageDisplayFormat: function () {
                if (domClass.contains(registry.byId("dropDownListView").domNode, "dropDownSelected")) {
                    domClass.remove(registry.byId("dropDownListView").domNode, "dropDownSelected");
                    this.switchDisplayTooltip.set("label", this.nls.dropDown);
                    document.getElementById("switchDisplayImageView").src = "widgets/ISImageExplorer/images/dropdownlist.png";
                } else {
                    domClass.add(registry.byId("dropDownListView").domNode, "dropDownSelected");
                    this.switchDisplayTooltip.set("label", this.nls.slider);
                    document.getElementById("switchDisplayImageView").src = "widgets/ISImageExplorer/images/slider.png";
                }
                this.imageDisplayFormat2();
            },

            imageDisplayFormat2: function () {
                if (!domClass.contains(registry.byId("dropDownListView").domNode, "dropDownSelected")) {
                    domStyle.set(document.getElementById("imageRangeView"), "display", "inline-block");
                    domStyle.set("dropDownOptionView", "display", "none");
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
                    domStyle.set("dropDownOptionView", "display", "inline-block");
                }
            },

            onClose: function () {
                registry.byId('exploreImageryOnOff').set('value', 'off');   //#270
                // for (var a in this.layerInfos) {
                //     this.map.getLayer(a).show();
                // }
                if (this.slider) {
                    this.slider.destroy();
                    this.slider = null;
                }
                if (this.extentHandlerExplore) {
                    this.extentHandlerExplore.remove();
                    this.extentHandlerExplore = null;
                }

                if (!this.date) {
                    this.timebook();
                } else {
                    if (registry.byId("layerSelectorView").value === "MS_696") {
                        dom.byId("dateDisplay").innerHTML = "Landsat - &nbsp;&nbsp;" + locale.format(new Date(this.date), { selector: "date", formatLength: "long" });
                    } else if (registry.byId("layerSelectorView").value === "Sentinel2_2553") {
                        dom.byId("dateDisplay").innerHTML = "Sentinel 2 - &nbsp;&nbsp;" + locale.format(new Date(this.date), { selector: "date", formatLength: "long" });
                    } else if (registry.byId("layerSelectorView").value === "naip123") {
                        dom.byId("dateDisplay").innerHTML = "NAIP - &nbsp;&nbsp;" + locale.format(new Date(this.date), { selector: "date", formatLength: "long" });
                    } else if (registry.byId("layerSelectorView").value === "planet123") {
                        dom.byId("dateDisplay").innerHTML = "Planet - &nbsp;&nbsp;" + locale.format(new Date(this.date), { selector: "date", formatLength: "long" });
                    } else if (registry.byId("layerSelectorView").value === "dea123") {
                        dom.byId("dateDisplay").innerHTML = "Sentinel L2A - &nbsp;&nbsp;" + locale.format(new Date(this.date), { selector: "date", formatLength: "long" });
                    }  
                    else {
                        dom.byId("dateDisplay").innerHTML = "Basemap";
                    }
                }

                if (registry.byId("rendererInfoDialog").open) {
                    registry.byId("rendererInfoDialog").hide();
                }
                if (registry.byId("sensorInfoDialog").open) {
                    registry.byId("sensorInfoDialog").hide();
                }
                this.maskTemp.onClose();
                this.spectralProf.onClose();
                this.scatterPlotTemp.onClose();
                this.temporalProf.onClose();
                this.queryLayer.onClose();

                if (registry.byId('Spectral Index Library') && registry.byId('Spectral Index Library').open) {
                    document.getElementsByClassName('icon-node')[2].click();
                }

                this.layerInfos[this.primaryLayer.id].currentValue = null; //#267
            },

            imageSliderShow: function () {
                if (this.primaryLayer && registry.byId("imageViewer").get("checked")) {
                    // if (this.toolFlag === 4) {
                    //     this.temporalProf.onClose();
                    //     this.temporalProf.onOpen();
                    // }
                    domStyle.set("selectorDivView", "display", "block");
                    var extent = this.map.extent;
                    var xminnew = ((extent.xmax + extent.xmin) / 2) - ((extent.xmax - extent.xmin) * this.config.searchExtent / 200);
                    var xmaxnew = ((extent.xmax + extent.xmin) / 2) + ((extent.xmax - extent.xmin) * this.config.searchExtent / 200);
                    var yminnew = ((extent.ymax + extent.ymin) / 2) - ((extent.ymax - extent.ymin) * this.config.searchExtent / 200);
                    var ymaxnew = ((extent.ymax + extent.ymin) / 2) + ((extent.ymax - extent.ymin) * this.config.searchExtent / 200);
                    var extentnew = new Extent(xminnew, yminnew, xmaxnew, ymaxnew, extent.spatialReference);
                    var query = new Query();
                    query.geometry = extentnew;
                    query.outFields = [this.imageField];

                    if (this.layerInfos[this.primaryLayer.id].defaultMosaicRule && this.layerInfos[this.primaryLayer.id].defaultMosaicRule.where) {
                        var layerFilter = this.layerInfos[this.primaryLayer.id].defaultMosaicRule.where;
                    }

                    if (registry.byId('layerSelectorView').get('value') === 'naip123' || registry.byId('layerSelectorView').get('value') === "planet123" || registry.byId('layerSelectorView').get('value') === 'USA_Cropland_683') {
                        document.getElementById('cloudSelectView').style.display = 'none';
                        query.where = layerFilter ? this.categoryField + " = 1 AND " + layerFilter : this.categoryField + " = 1";
                    
                    } else {
                        document.getElementById('cloudSelectView').style.display = 'block';
                        query.where = layerFilter ? this.categoryField + " = 1 AND " + this.cloudCover + " <= " + registry.byId("cloudFilterView").value + " AND " + layerFilter : this.categoryField + " = 1 AND " + this.cloudCover + " <= " + registry.byId("cloudFilterView").value;
                    
                    }
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
                            html.set(document.getElementById("errorDivView"), "");
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
                            var sliderNode = domConstruct.create("div", {}, "imageSliderDivView", "first");
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

                            registry.byId("imageDropDownView").removeOption(registry.byId("imageDropDownView").getOptions());

                            for (var v = this.orderedDates.length - 1; v >= 0; v--) {
                                registry.byId("imageDropDownView").addOption({
                                    label: (this.imageFieldType === "esriFieldTypeDate" ? locale.format(new Date(this.orderedDates[v].value),
                                        { selector: "date", formatLength: "long" }) : this.orderedDates[v].value.toString()), value: "" + v + ""
                                });
                            }

                            if (this.layerInfos[this.primaryLayer.id].currentValue) {
                                var index = null;
                                for (var i in this.orderedDates) {
                                    if (this.orderedDates[i].value === this.layerInfos[this.primaryLayer.id].currentValue.value &&
                                        this.orderedDates[i].id === this.layerInfos[this.primaryLayer.id].currentValue.id) {
                                        var index = i;
                                        break;
                                    } else if (this.orderedDates[i].value <= this.layerInfos[this.primaryLayer.id].currentValue.value) {
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
                            html.set(document.getElementById("errorDivView"), this.nls.noScenes);
                            domStyle.set("selectorDivView", "display", "none");
                            html.set(document.getElementById("imageRangeView"), "");
                            //html.set(document.getElementById("imageCountView"), "");
                            this.hideLoading();
                        }

                    }), lang.hitch(this, function (err) {
                        console.log(err);
                    }));
                }
            },

            setSliderValue: function (index) {
                this.imageDisplayFormat2();
                registry.byId("imageDropDownView").set("value", index);
                this.slider.set("value", index);

                if (this.primaryMosaic) {
                    this.slider.set("value", this.primaryMosaic);
                    this.primaryMosaic = null;
                }

                if (this.imageFieldType === "esriFieldTypeDate") {
                    html.set(document.getElementById("imageRangeView"), this.nls.dates + ": <b>" + locale.format(new Date(this.orderedDates[index].value), { selector: "date", formatLength: "long" }) + "</b>");
                } else {
                    html.set(document.getElementById("imageRangeView"), this.imageField + ": <b>" + this.orderedDates[index].value + "</b>");
                }
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
                        mosaicRule: this.map.getLayer(this.primaryLayer.id).mosaicRule ? JSON.stringify(this.map.getLayer(this.primaryLayer.id).mosaicRule.toJson()) : this.layerInfos[this.primaryLayer.id].defaultMosaicRule ? JSON.stringify(this.layerInfos[this.primaryLayer.id].defaultMosaicRule.toJson()) : null,  //#267
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

                    imageParams.mosaicRule = this.layerInfos[this.primaryLayer.id].defaultMosaicRule;
                    imageParams.returnGeometry = false;
                    imageTask.execute(imageParams, lang.hitch(this, function (data) {
                        var index;
                        if (data.catalogItems.features[0]) {
                            var maxVisible = data.catalogItems.features[0].attributes[this.imageField];
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

            sliderDropDownSelection: function (value) {
                if (this.layerChanged && this.date) {  //#268
                    var diff = Math.abs(this.orderedDates[0].value - this.date);
                    this.valueSelected = 0;
                    for (let i = 0; i < this.orderedDates.length; i++) {
                        
                        if (Math.abs(this.orderedDates[i].value - this.date) < diff) {
                            diff = Math.abs(this.orderedDates[i].value - this.date);
                            this.valueSelected = i;
                        }
                    }

                 
                    registry.byId("imageDropDownView").set("value", this.valueSelected);
                        this.slider.set("value", this.valueSelected);
                        this.sliderChange();
                    
                    
                } else {
                    if (!domClass.contains(registry.byId("dropDownListView").domNode, "dropDownSelected") && value === "slider") {
                        this.valueSelected = this.slider.get("value");
                        registry.byId("imageDropDownView").set("value", this.valueSelected);
                        this.sliderChange();
                    } else if (domClass.contains(registry.byId("dropDownListView").domNode, "dropDownSelected") && value === "dropDown") {
                        this.valueSelected = registry.byId("imageDropDownView").get("value");
                        this.slider.set("value", this.valueSelected);
                        this.sliderChange();
                    }
                }
                this.layerChanged = false;
                
            },

            sliderChange: function () {
                if (registry.byId("imageViewer").get("checked")) {
                    if (this.valueSelected || this.valueSelected === 0) {
                        var aqDate = this.orderedDates[this.valueSelected].value;
                        this.date = aqDate;
                        setTimeout(lang.hitch(this, function() {
                            if (registry.byId("layerSelectorView").value === "MS_696") {
                                dom.byId("dateDisplay").innerHTML = "Landsat - &nbsp;&nbsp;" + locale.format(new Date(this.date), { selector: "date", formatLength: "long" });
                            } else if (registry.byId("layerSelectorView").value === "Sentinel2_2553") {
                                dom.byId("dateDisplay").innerHTML = "Sentinel 2 - &nbsp;&nbsp;" + locale.format(new Date(this.date), { selector: "date", formatLength: "long" });
                            } else if (registry.byId("layerSelectorView").value === "naip123") {
                                dom.byId("dateDisplay").innerHTML = "NAIP - &nbsp;&nbsp;" + locale.format(new Date(this.date), { selector: "date", formatLength: "long" });
                            } else if (registry.byId("layerSelectorView").value === "planet123") {
                                dom.byId("dateDisplay").innerHTML = "Planet - &nbsp;&nbsp;" + locale.format(new Date(this.date), { selector: "date", formatLength: "long" });
                            } else if (registry.byId("layerSelectorView").value === "dea123") {
                                dom.byId("dateDisplay").innerHTML = "Sentinel L2A - &nbsp;&nbsp;" + locale.format(new Date(this.date), { selector: "date", formatLength: "long" });
                            }  
                            else {
                                dom.byId("dateDisplay").innerHTML = "Basemap";
                            }
                        }), 2500);
                        
                        this.layerInfos[this.primaryLayer.id].currentValue = this.orderedDates[this.valueSelected];
                        var featureSelect = [];
                        this.featureIds = [];
                        this.featureNames = [];
                        if (this.imageFieldType === "esriFieldTypeDate") {
                            if (this.config.distinctImages) {
                                for (var c in this.orderedFeatures) {
                                    var tempValue = locale.format(new Date(this.orderedDates[this.valueSelected].value), { selector: "date", formatLength: "short" });
                                    var tempCurrentValue = locale.format(new Date(this.orderedFeatures[c].attributes[this.imageField]), { selector: "date", formatLength: "short" });
                                    if (tempValue === tempCurrentValue) {
                                        featureSelect.push(this.orderedFeatures[c]);
                                        this.featureIds.push(this.orderedFeatures[c].attributes[this.objectID]);
                                    }
                                }
                            } else {
                                featureSelect.push(this.orderedFeatures[this.valueSelected]);
                                this.featureIds.push(this.orderedFeatures[this.valueSelected].attributes[this.objectID]);
                            }
                            html.set(document.getElementById("imageRangeView"), this.nls.dates + ": <b>" + locale.format(new Date(aqDate), { selector: "date", formatLength: "long" }) + "</b>");

                        } else {
                            if (this.config.distinctImages) {
                                for (var c in this.orderedFeatures) {
                                    if (this.orderedFeatures[c].attributes[this.imageField] === this.orderedDates[this.valueSelected].value) {
                                        featureSelect.push(this.orderedFeatures[c]);
                                        this.featureIds.push(this.orderedFeatures[c].attributes[this.objectID]);
                                    }
                                }
                            } else {
                                featureSelect.push(this.orderedFeatures[this.valueSelected]);
                                this.featureIds.push(this.orderedFeatures[this.valueSelected].attributes[this.objectID]);
                            }
                            html.set(document.getElementById("imageRangeView"), this.imageField + ": <b>" + aqDate + "</b>");
                        }
                        this.map.graphics.clear();
                        var count = 0;

                        var mr = new MosaicRule();
                        mr.method = MosaicRule.METHOD_LOCKRASTER;
                        mr.ascending = true;
                        mr.operation = "MT_FIRST";
                        mr.lockRasterIds = this.featureIds;
                        this.primaryLayer.setMosaicRule(mr);
                        registry.byId("primarySceneId").set("value", this.valueSelected);
                        this.map.mosaicRule = this.primaryLayer.mosaicRule;
                        if (registry.byId("imageryTool").get('value') === 'scatterplot') {
                            this.scatterPlotTemp.scatterPlotDraw();
                        }
                        
                    }
                }
            },

            imageSliderRefresh: function () {
                this.imageSliderHide();
                this.imageSliderShow();

            },

            showLoading: function () {
                domStyle.set("loadingLayerViewer", "display", "block");
                setTimeout(lang.hitch(this, function() {
                    this.hideLoading();
                }), 7000);
            },

            hideLoading: function () {
                domStyle.set("loadingLayerViewer", "display", "none");
            }

        });
    });
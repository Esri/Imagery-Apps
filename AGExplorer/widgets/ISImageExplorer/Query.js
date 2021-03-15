/*
 | Copyright 2018 Esri. All Rights Reserved.
 |
 | Licensed under the Apache License, Version 2.0 (the "License");
 | you may not use this file except in compliance with the License.
 | You may obtain a copy of the License at
 |
 |    http://www.apache.org/licenses/LICENSE-2.0
 |
 | Unless required by applicable law or agreed to in writing, software
 | distributed under the License is distributed on an "AS IS" BASIS,
 | WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 | See the License for the specific language governing permissions and
 | limitations under the License.
 */

define([
    "dojo/_base/declare",
    'jimu/BaseWidget',
    'dijit/_WidgetsInTemplateMixin',
    'dijit/_TemplatedMixin',
    'dojo/text!./Widget.html',
    'dijit/registry',
    "dojo/_base/lang",
    "dojo/Deferred",
    "dojo/Evented",
    "dojo/_base/kernel",
    "dojo/on",
    "dojo/query",
    "dijit/focus",
    "dojo/dom-attr",
    'dojo/html',
    'dojo/dom-class',
    'dojo/dom',
    "esri/dijit/Popup",
    'esri/layers/FeatureLayer',
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
    "dijit/popup",
    'esri/InfoTemplate',
    'esri/geometry/mathUtils',
    'dojo/dom-style',
    'esri/layers/ArcGISImageServiceLayer',
    "esri/layers/RasterLayer",
    'esri/layers/ImageServiceParameters',
    'esri/tasks/ImageServiceIdentifyTask',
    'esri/tasks/ImageServiceIdentifyParameters',
    'esri/layers/RasterFunction',
    'esri/geometry/Polygon',
    'esri/geometry/Point',
    'esri/request',
    "esri/toolbars/draw",
    "esri/geometry/geometryEngine",
    'dijit/Tooltip',
    'dijit/form/Select',
    'dijit/form/Button',
    'dijit/form/NumberSpinner',
    'dijit/form/CheckBox',
    'dijit/form/TextBox',
    'dijit/form/DropDownButton',
    'dijit/TooltipDialog',
    'dijit/form/RadioButton',
    "esri/dijit/LayerSwipe",
    "dijit/ColorPalette",
    "dijit/Dialog",
    "dijit/form/NumberTextBox",

    "dojo/domReady!"

], function (declare, BaseWidget, _WidgetsInTemplateMixin, _TemplatedMixin, template, registry, lang, Deferred, Evented, kernel, on, query, focus, domAttr, html, domClass, dom, Popup, FeatureLayer, MosaicRule, Query, QueryTask, Extent, locale, domConstruct,
    HorizontalSlider, HorizontalRule, HorizontalRuleLabels, Graphic, SimpleLineSymbol, SimpleFillSymbol, Color, popup, InfoTemplate, mathUtils, domStyle, ArcGISImageServiceLayer, RasterLayer,
    ImageServiceParameters, ImageServiceIdentifyTask, ImageServiceIdentifyParameters, RasterFunction, Polygon, Point, esriRequest, Draw, geometryEngine, Tooltip, Select, Button,
    NumberSpinner, CheckBox, TextBox, DropDownButton, TooltipDialog, RadioButton, LayerSwipe, ColorPalette, Dialog, NumberTextBox) {

    return declare([BaseWidget, Evented, _TemplatedMixin], {
        constructor: function (parameters) {
            var defaults = {
                map: null,
                config: null,
                layers: null,
                nls: null,
                mainConfig: null,
            };
            lang.mixin(this, defaults, parameters);
        },
        primaryLayer: null,
        orderedDates: null,
        sliderRules: null,
        sliderLabels: null,
        slider: null,
        featureIds: [],
        defaultMosaicRule: null,
        mapZoomFactor: 2.0,
        mapWidthPanFactor: 0.75,
        updateMask: false,

        postCreate: function () {
            console.log('querry');
            if (this.map) {
                this.queryDraw = new Draw(this.map);
                this.queryDraw.on("draw-complete", lang.hitch(this, this.addGraphic));
            }
            // document.getElementById('start-draw').style.display = 'none';
            // domStyle.set('segment-div', 'display', 'none');


            registry.byId('featureLayerlist').addOption({ label: "Select", value: 'none' });
            registry.byId('queryExt').on('change', lang.hitch(this, function (val) {
                if (val === 'draw-aoi') {
                    domStyle.set('selectLayer-div', 'display', 'none');

                    if (this.mapClick) {
                        this.mapClick.remove();
                        this.mapClick = null;
                    }
                    document.getElementById('start-draw').style.display = '';
                    //this.map.clip = null;
                } else {
                    if (!this.mapClick) {
                        this.mapClick = this.map.on('click', lang.hitch(this, this.mapClickEventQuery));

                    }
                    domStyle.set('selectLayer-div', 'display', 'block');
                    this.removeGraphic();
                    this.map.setInfoWindowOnClick(true);
                    this.queryDraw.deactivate();
                    //domStyle.set('start-draw', 'display', 'none');
                    document.getElementById('start-draw').style.display = 'none';
                }
            }));

            registry.byId('start-draw').on('click', lang.hitch(this, function () {
                this.map.setInfoWindowOnClick(false);
                this.queryDraw.activate(Draw.POLYGON);
            }));

            registry.byId('remove-aoi').on('click', lang.hitch(this, function () {
                registry.byId('define-aoi-ch').set('checked', false);
                if (this.map.clip && this.map.clip.functionArguments.Raster === '$$') {
                    this.map.getLayer(registry.byId('layerSelectorView').get('value')).setRenderingRule(new RasterFunction({ 'rasterFunction': registry.byId('layerRendererView').get('value') }));

                } else if (this.map.clip && this.map.clip.functionArguments.Raster !== '$$') {
                    this.map.getLayer(registry.byId('layerSelectorView').get('value')).setRenderingRule(this.map.clip.functionArguments.Raster);
                }
                if (this.map.aoi) {
                    this.map.aoi = null;
                }
                this.map.clip = null;
                this.map.pointtopass = null;
                this.map.geomtopass = null;
                this.removeGraphic();
            }));

            registry.byId('start-classify').on('click', lang.hitch(this, this.segmentImage));

            for (let i = 0; i < this.map.itemInfo.itemData.operationalLayers.length; i++) {
                if (this.map.itemInfo.itemData.operationalLayers[i].layerType === "ArcGISFeatureLayer") {
                    registry.byId('featureLayerlist').addOption({ label: this.map.itemInfo.itemData.operationalLayers[i].title, value: this.map.itemInfo.itemData.operationalLayers[i].id });
                }
            }
            registry.byId('featureLayerlist').on('change', lang.hitch(this, function (val) {
                if (val !== 'none') {
                    this.drawLayer = new FeatureLayer(this.map.getLayer(registry.byId('featureLayerlist').get('value')).url);

                    //this.featureClick = this.drawLayer.on('click', lang.hitch(this, this.getNDVI));
                }

            }));
            registry.byId('featureLayerlist').set('value', 'CLU_MN_Renville_AOI_7109');

            registry.byId('query-aoi').on('click', lang.hitch(this, function () {
                this.getNDVI(this.map.pointtopass, this.map.geomtopass);
            }));

            registry.byId('zone-method').on('change', lang.hitch(this, function (val) {
                if (val === 'segmentation') {
                    domStyle.set('zone-segment', 'display', 'block');
                    domStyle.set('zone-remap', 'display', 'none');
                } else {
                    domStyle.set('zone-segment', 'display', 'none');
                    domStyle.set('zone-remap', 'display', 'block');
                }
            }))

            registry.byId('visible-classify').on('click', lang.hitch(this, function () {
                // if (registry.byId('visible-classify').label === 'Turn off') {
                // this.map.getLayer('resultLayer').setVisibility(false);
                // registry.byId('visible-classify').setLabel('Turn on')
                // } else {
                //     this.map.getLayer('resultLayer').setVisibility(true);
                //     registry.byId('visible-classify').setLabel('Turn off')
                // }
                if (this.map.getLayer('resultLayer')) {
                    this.map.removeLayer(this.map.getLayer('resultLayer'));
                }
                document.getElementById('seg-trans').style.display = 'none';
            }));

            registry.byId('remove-popup').on('click', lang.hitch(this, function (val) {
                this.map.infoWindow.hide();
            }))

            registry.byId("result-seg-Opacity").on("change", lang.hitch(this, function (value) {
                if (this.map.getLayer("resultLayer")) {
                    this.map.getLayer("resultLayer").setOpacity(1 - value);
                }
            }));

            this.popup = new Popup({
                fillSymbol: new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
                    new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                        new Color([255, 0, 0]), 2), new Color([255, 255, 0, 0.25]))
            }, domConstruct.create("div"));
            //this.map.infoWindow = this.popup;

            if (this.map.getLayer('USA_Cropland_683')) {
                var rasterTable = esriRequest({
                    url: this.map.getLayer('USA_Cropland_683').url + '/rasterAttributeTable',
                    content: {
                        renderingRule: JSON.stringify({ "rasterFunction": "Analytic Renderer" }),
                        f: 'json'
                    }
                });
                rasterTable.then(lang.hitch(this, function (res) {
                    this.croplandraster = res;
                }));
            }
            


        },

        removeMapClickFunction: function () {
            if (this.mapClick) {
                this.mapClick.remove();
                this.mapClick = null;
            }
        },

        addGraphic: function (object) {
            if (this.polygons) {
                //this.polygons.addRing(object.geometry.rings[0]);
                this.removeGraphic();
            }
            document.getElementById('remove-aoi').click();
            document.getElementById('segment-msg').style.display = 'none';
            this.queryDraw.deactivate();
            var symbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([200, 0, 0]), 2);
            var graphic = new Graphic(object.geometry, symbol, { maskWidget: true });
            this.map.graphics.add(graphic);
            this.map.setInfoWindowOnClick(false);

            // else {
            //     this.polygons = object.geometry;
            // }
            registry.byId('define-aoi-ch').set('checked', true);
            this.polygons = object.geometry;
            this.map.aoi = this.polygons;

            this.map.pointtopass = this.polygons.getCentroid();
            this.map.geomtopass = object;

            this.map.clip = new RasterFunction();
            this.map.clip.functionName = 'Clip';
            let args = {};
            args.ClippingGeometry = this.map.aoi;
            args.ClippingType = 1;
            // if (this.map.getLayer(registry.byId('layerSelectorView').get('value')).url === this.config.urlLandsatMS || this.map.getLayer(registry.byId('layerSelectorView').get('value')).url === this.config.urlSentinel) {
            //     args.Raster = new RasterFunction({ "rasterFunction": "Agriculture" });
            // } else {
            //     args.Raster = '$$';
            // }
            args.Raster = this.map.getLayer(registry.byId('layerSelectorView').get('value')).renderingRule;
            this.map.clip.functionArguments = args;
            //this.map.clip.outputPixelType = "U8";
            this.map.clip.variableName = 'Clipgeom';
            this.map.getLayer(registry.byId('layerSelectorView').get('value')).setRenderingRule(this.map.clip);
            //this.getNDVI(this.polygons.getCentroid(), object);
        },

        segmentImage: function () {
            if (this.map.getLayer('resultLayer')) {
                this.map.removeLayer(this.map.getLayer('resultLayer'));
            }

            if (registry.byId('zone-method').get('value') === 'segmentation') {

                let ndviz = new RasterFunction();
                ndviz.functionName = 'NDVI';
                let argsn = {};
                if (this.map.getLayer(registry.byId('layerSelectorView').get('value')).url === this.config.urlLandsatMS) {
                    argsn.VisibleBandID = 3;
                    argsn.InfraredBandID = 4;
                } else if (this.map.getLayer(registry.byId('layerSelectorView').get('value')).url === this.config.urlSentinel) {
                    argsn.VisibleBandID = 3;
                    argsn.InfraredBandID = 7;
                } else if (this.map.getLayer(registry.byId('layerSelectorView').get('value')).url === this.config.urlNaip) {
                    argsn.VisibleBandID = 0;
                    argsn.InfraredBandID = 3;
                }
                if (this.map.clip) {
                    this.map.clip.functionArguments.Raster = '$$';
                    argsn.Raster = this.map.clip;
                }
                ndviz.functionArguments = argsn;
                ndviz.outputPixelType = 'U8';
                ndviz.variableName = 'ndviz';




                let segment = new RasterFunction();
                segment.functionName = 'SegmentMeanShift';
                let args1 = {};
                args1.SpectralDetail = Number(registry.byId('spectraldetail').get('value'));
                args1.SpatialDetail = Number(registry.byId('spatialdetail').get('value'));
                args1.MinNumPixelsPerSegment = Number(registry.byId('minpixel').get('value'));
                args1.Raster = ndviz;
                segment.functionArguments = args1;
                segment.outputPixelType = "U8";
                segment.variableName = 'Segment';

                let colormap = new RasterFunction();
                colormap.functionName = 'Colormap';
                let argsm = {};
                argsm.ColormapName = 'NDVI';
                argsm.Raster = segment;
                colormap.functionArguments = argsm;
                colormap.outputPixelType = 'U8';
                colormap.variableName = 'colormap';


                var params = new ImageServiceParameters();
                params.renderingRule = colormap;
                params.format = 'jpgpng';
                params.mosaicRule = this.map.getLayer(registry.byId('layerSelectorView').get('value')).mosaicRule ? this.map.getLayer(registry.byId('layerSelectorView').get('value')).mosaicRule : null;

                var segmentLayer = new ArcGISImageServiceLayer(this.map.getLayer(registry.byId('layerSelectorView').get('value')).url, {
                    imageServiceParameters: params,
                    visible: true,
                    id: "resultLayer",
                    title: 'Segmented Layer'


                    //pixelFilter: lang.hitch(this, this.maskPixels)
                });
                this.map.addLayer(segmentLayer);
            } else {

                let ndviz = new RasterFunction();
                ndviz.functionName = 'BandArithmetic';
                let argsn = {};
                if (this.map.getLayer(registry.byId('layerSelectorView').get('value')).url === this.config.urlLandsatMS) {
                    argsn.Method = 1;
                    argsn.BandIndexes = '5 4';


                } else if (this.map.getLayer(registry.byId('layerSelectorView').get('value')).url === this.config.urlSentinel || this.map.getLayer(registry.byId('layerSelectorView').get('value')).url === this.config.urlDEA) {
                    argsn.Method = 1;
                    argsn.BandIndexes = '8 4';
                } else if (this.map.getLayer(registry.byId('layerSelectorView').get('value')).url === this.config.urlNaip) {
                    argsn.Method = 1;
                    argsn.BandIndexes = '4 1';
                } else if (this.map.getLayer(registry.byId('layerSelectorView').get('value')).url === this.config.urlPlanet) {
                    argsn.Method = 1;
                    argsn.BandIndexes = '1 2';
                }
                if (this.map.clip) {
                    this.map.clip.functionArguments.Raster = '$$';
                    argsn.Raster = this.map.clip;
                }
                ndviz.functionArguments = argsn;
                ndviz.outputPixelType = 'F32';
                ndviz.variableName = 'ndviz';

                let remap = new RasterFunction();
                remap.functionName = 'Remap';
                let args1 = {};

                if (registry.byId('classes-no').get('value') !== 'dra') {
                    if (registry.byId('classes-no').get('value') === '10') {
                        args1.InputRanges = [-0.9, 0.1,
                            0.1, 0.2,
                            0.2, 0.3,
                            0.3, 0.4,
                            0.4, 0.5,
                            0.5, 0.6,
                            0.6, 0.7,
                            0.7, 0.8,
                            0.8, 0.9,
                            0.9,
                            1.1];
                        args1.OutputValues = [1,
                            2,
                            3,
                            4,
                            5,
                            6,
                            7,
                            8,
                            9,
                            10];
                    } else if (registry.byId('classes-no').get('value') === '3') {
                        args1.InputRanges = [-0.9, 0.3,

                            0.3, 0.6,

                            0.6, 1.1];
                        args1.OutputValues = [1,

                            2,

                            3];
                    } else if (registry.byId('classes-no').get('value') === '5') {
                        args1.InputRanges = [-0.9, 0.3,

                            0.3, 0.4,

                            0.4, 0.5,

                            0.5, 0.6,

                            0.6, 1.1];
                        args1.OutputValues = [1,

                            2,

                            3, 4, 5];
                    } else if (registry.byId('classes-no').get('value') === '15') {
                        args1.InputRanges = [

                            -0.9, 0.05,
                            0.05, 0.15,
                            0.15, 0.25,
                            0.25, 0.30,
                            0.30, 0.35,
                            0.35, 0.40,
                            0.40, 0.45,
                            0.45, 0.50,
                            0.50, 0.55,
                            0.55, 0.60,
                            0.60, 0.65,
                            0.65, 0.70,
                            0.70, 0.75,
                            0.75, 0.80,
                            0.80, 1.1
                        ];
                        args1.OutputValues = [1,
                            2,
                            3,
                            4,
                            5,
                            6,
                            7,
                            8,
                            9,
                            10,
                            11,
                            12,
                            13,
                            14,
                            15];
                    }
                    args1.Raster = ndviz;
                    remap.functionArguments = args1;
                    remap.outputPixelType = 'U8';
                    remap.variableName = 'Remap';

                    let colormap = new RasterFunction();
                    colormap.functionName = 'Colormap';
                    let argsm = {};
                    if (registry.byId('classes-no').get('value') === '10') {
                        argsm.Colormap = [
                            [1, 255, 0, 0],
                            [2, 255, 51, 0],
                            [3, 255, 102, 0],
                            [4, 255, 151, 0],
                            [5, 255, 205, 0],
                            [6, 204, 255, 0],
                            [7, 153, 255, 0],
                            [8, 102, 255, 0],
                            [9, 51, 255, 0],
                            [10, 0, 255, 0]
                        ];
                    } else if (registry.byId('classes-no').get('value') === '5') {
                        argsm.Colormap = [
                            [1, 245, 0, 0],

                            [2, 251, 140, 0],

                            [3, 245, 245, 0],

                            [4, 147, 247, 0],

                            [5, 0, 245, 0]
                        ];
                    } else if (registry.byId('classes-no').get('value') === '3') {
                        argsm.Colormap = [
                            [1, 245, 0, 0],

                            [2, 245, 245, 0],

                            [3, 0, 245, 0]
                        ];
                    } else {
                        argsm.Colormap = [
                            [1, 66, 33, 18],
                            [2, 159, 81, 42],
                            [3, 204, 170, 21],
                            [4, 253, 254, 3],
                            [5, 229, 237, 2],
                            [6, 208, 223, 0],
                            [7, 185, 207, 0],
                            [8, 162, 192, 0],
                            [9, 139, 176, 0],
                            [10, 117, 158, 0],
                            [11, 91, 142, 4],
                            [12, 69, 128, 0],
                            [13, 45, 112, 0],
                            [14, 23, 97, 0],
                            [15, 0, 82, 0]
                        ];
                    }

                    argsm.Raster = remap;
                    colormap.functionArguments = argsm;
                    colormap.outputPixelType = 'U8';
                    colormap.variableName = 'colormap';

                    var params = new ImageServiceParameters();
                    params.renderingRule = colormap;
                    params.format = 'jpgpng';
                    params.mosaicRule = this.map.getLayer(registry.byId('layerSelectorView').get('value')).mosaicRule ? this.map.getLayer(registry.byId('layerSelectorView').get('value')).mosaicRule : null;

                    var segmentLayer = new ArcGISImageServiceLayer(this.map.getLayer(registry.byId('layerSelectorView').get('value')).url, {
                        imageServiceParameters: params,
                        visible: true,
                        id: "resultLayer",
                        title: 'Segmented Layer'


                        //pixelFilter: lang.hitch(this, this.maskPixels)
                    });
                    this.map.addLayer(segmentLayer);
                }

                else {
                    if (ndviz.functionArguments.Raster) {


                        var stat = esriRequest({
                            url: this.map.getLayer(registry.byId('layerSelectorView').get('value')).url + '/computeStatisticsHistograms',
                            content: {
                                f: 'json',
                                renderingRule: JSON.stringify(ndviz.toJson()),
                                pixelSize: 30,
                                geometry: JSON.stringify(ndviz.functionArguments.Raster.functionArguments.ClippingGeometry.toJson()),
                                geometryType: 'esriGeometryPolygon',
                                mosaicRule: this.map.getLayer(registry.byId('layerSelectorView').get('value')).mosaicRule ? JSON.stringify(this.map.getLayer(registry.byId('layerSelectorView').get('value')).mosaicRule.toJson()) : null
                            },
                            handleAs: "json",
                            callbackParamName: "callback"
                        });
                    } else {
                        var extent = this.map.extent.xmin + "," + this.map.extent.ymin + "," + this.map.extent.xmax + "," + this.map.extent.ymax;

                        var stat = esriRequest({
                            url: this.map.getLayer(registry.byId('layerSelectorView').get('value')).url + '/computeStatisticsHistograms',
                            content: {
                                f: 'json',
                                renderingRule: JSON.stringify(ndviz.toJson()),
                                pixelSize: 30,
                                geometry: extent,
                                geometryType: 'esriGeometryEnvelope',
                                mosaicRule: this.map.getLayer(registry.byId('layerSelectorView').get('value')).mosaicRule ? JSON.stringify(this.map.getLayer(registry.byId('layerSelectorView').get('value')).mosaicRule.toJson()) : null
                            },
                            handleAs: "json",
                            callbackParamName: "callback"
                        });
                    }
                    stat.then(lang.hitch(this, function (response) {
                        console.log(response);
                        var min = response.statistics[0].min;
                        var max = response.statistics[0].max;
                        var rangeval = (max - min) / 5;
                        args1.InputRanges = [min, (min + rangeval),
                            (min + rangeval), (min + (2 * rangeval)),
                            (min + (2 * rangeval)), (min + (3 * rangeval)),
                            (min + (3 * rangeval)), (min + (4 * rangeval)),
                            (min + (4 * rangeval)), (max+0.1)
                        ];

                        args1.OutputValues = [1, 2, 3, 4, 5];




                        args1.Raster = ndviz;
                        remap.functionArguments = args1;
                        remap.outputPixelType = 'U8';
                        remap.variableName = 'Remap';

                        let colormap = new RasterFunction();
                        colormap.functionName = 'Colormap';
                        let argsm = {};
                        argsm.Colormap = [
                            [1, 245, 0, 0],

                            [2, 251, 140, 0],

                            [3, 245, 245, 0],

                            [4, 147, 247, 0],

                            [5, 0, 245, 0]
                        ];



                        argsm.Raster = remap;
                        colormap.functionArguments = argsm;
                        colormap.outputPixelType = 'U8';
                        colormap.variableName = 'colormap';

                        var params = new ImageServiceParameters();
                        params.renderingRule = colormap;
                        params.format = 'jpgpng';
                        params.mosaicRule = this.map.getLayer(registry.byId('layerSelectorView').get('value')).mosaicRule ? this.map.getLayer(registry.byId('layerSelectorView').get('value')).mosaicRule : null;

                        var segmentLayer = new ArcGISImageServiceLayer(this.map.getLayer(registry.byId('layerSelectorView').get('value')).url, {
                            imageServiceParameters: params,
                            visible: true,
                            id: "resultLayer",
                            title: 'Segmented Layer'


                            //pixelFilter: lang.hitch(this, this.maskPixels)
                        });
                        this.map.addLayer(segmentLayer);
                    }))
                }


            }







            //this.map.getLayer(registry.byId('layerSelectorView').get('value')).setRenderingRule(clip, false);
        },

        removeGraphic: function () {
            //domStyle.set('segment-div', 'display', 'none');
            var temp;
            for (var k = this.map.graphics.graphics.length - 1; k >= 0; k--) {
                temp = this.map.graphics.graphics[k];
                if (temp.geometry && temp.geometry.type === "polygon" && temp.attributes && temp.attributes.maskWidget) {
                    this.map.graphics.remove(this.map.graphics.graphics[k]);
                }
            }
        },

        mapClickEventQuery: function (evt) {
            if (registry.byId('queryExt').get('value') === 'choose-aoi' && registry.byId('imageryTool').get('value') === 'aoi') {
                //domStyle.set('segment-div', 'display', 'none');




                var query = new Query();
                query.geometry = evt.mapPoint;
                //this.drawLayer.selectFeatures(query, FeatureLayer.SELECTION_NEW, lang.hitch(this, this.getNDVI, evt.mapPoint));

                this.drawLayer.selectFeatures(query, FeatureLayer.SELECTION_NEW, lang.hitch(this, function (res) {
                    document.getElementById('remove-aoi').click();
                    registry.byId('define-aoi-ch').set('checked', true);
                    document.getElementById('segment-msg').style.display = 'none';
                    this.map.aoi = res[0].geometry;
                    this.map.pointtopass = evt.mapPoint;
                    this.map.geomtopass = res[0];
                    this.map.clip = new RasterFunction();
                    this.map.clip.functionName = 'Clip';
                    let args = {};
                    args.ClippingGeometry = this.map.aoi;
                    args.ClippingType = 1;
                    // if (this.map.getLayer(registry.byId('layerSelectorView').get('value')).url === this.config.urlLandsatMS || this.map.getLayer(registry.byId('layerSelectorView').get('value')).url === this.config.urlSentinel) {
                    //     args.Raster = new RasterFunction({ "rasterFunction": "Agriculture" });
                    // } else {
                    //     args.Raster = '$$';
                    // }
                    args.Raster = this.map.getLayer(registry.byId('layerSelectorView').get('value')).renderingRule;
                    this.map.clip.functionArguments = args;
                    //this.map.clip.outputPixelType = "U8";
                    this.map.clip.variableName = 'Clipgeom';

                    this.map.getLayer(registry.byId('layerSelectorView').get('value')).setRenderingRule(this.map.clip);

                }));

                //this.map.infoWindow.setFeatures([def]);
                //this.popup.setMap(this.map);
                //this.map.infoWindow.show(evt.mapPoint);
            }
        },

        getNDVI: function (point, res) {
            //this.map.infoWindow.setFeatures([res]);
            // this.map.infoWindow.show(this.map.toScreen(evt.mapPoint));
            this.content = '<b>Layer Infos </b><br />';

            if (!point) {
                point = this.map.extent.getCenter();
            }
            if (!res) {
                res = this.map.extent;
            }
            res = res[0] ? res[0] : res;
            this.aoi = res;
            //this.map.aoi = res;
            var request1 = esriRequest({
                url: this.map.getLayer('MS_696').url + "/getSamples",
                content: {
                    geometry: JSON.stringify(res.geometry ? res.geometry.toJson() : res.toJson()),
                    geometryType: res.geometry ? "esriGeometryPolygon" : "esriGeometryEnvelope",
                    mosaicRule: this.map.getLayer('MS_696').mosaicRule ? JSON.stringify(this.map.getLayer('MS_696').mosaicRule.toJson()) : null,
                    returnGeometry: false,
                    returnFirstValueOnly: true,
                    sampleCount: 1,
                    outFields: 'AcquisitionDate',
                    f: "json"
                },
                handleAs: "json",
                callbackParamName: "callback"
            });
            request1.then(lang.hitch(this, function (result) {
                console.log(result);
                let item = result.samples[0];
                let plot = item.value.split(' ');
                let nir = Number(plot[4]);
                let red = Number(plot[3]);
                let ndviz = (nir - red) / (red + nir);
                //this.map.infoWindow.show(result.samples[0].location);
                this.content = this.content + '<br /><br /><b>Landsat NDVI on ' + locale.format(new Date(item.attributes['AcquisitionDate']), { selector: "date", formatLength: "long" }) + '</b>: ' + ndviz.toFixed(2);
                this.map.infoWindow.setContent(this.content);
                this.map.infoWindow.show(point);
                //domStyle.set('segment-div', 'display', 'block');

            }));
            var request2 = esriRequest({
                url: this.map.getLayer('Sentinel2_2553').url + "/getSamples",
                content: {
                    geometry: JSON.stringify(res.geometry ? res.geometry.toJson() : res.toJson()),
                    geometryType: res.geometry ? "esriGeometryPolygon" : "esriGeometryEnvelope",
                    mosaicRule: this.map.getLayer('Sentinel2_2553').mosaicRule ? JSON.stringify(this.map.getLayer('Sentinel2_2553').mosaicRule.toJson()) : null,
                    sampleCount: 1,
                    returnGeometry: false,
                    returnFirstValueOnly: true,
                    outFields: 'acquisitiondate',
                    f: "json"
                },
                handleAs: "json",
                callbackParamName: "callback"
            });
            request2.then(lang.hitch(this, function (result) {
                console.log(result);
                let item = result.samples[0];
                let plot = item.value.split(' ');
                let nir = Number(plot[7]);
                let red = Number(plot[3]);
                let ndviz = (nir - red) / (red + nir);
                this.content = this.content + '<br /><br /><b>Sentinel2 NDVI on ' + locale.format(new Date(item.attributes['acquisitiondate']), { selector: "date", formatLength: "long" }) + '</b>: ' + ndviz.toFixed(2);
                this.map.infoWindow.setContent(this.content);
                this.map.infoWindow.show(point);
            }));

            var request3 = esriRequest({
                url: this.map.getLayer('naip123').url + "/getSamples",
                content: {
                    geometry: JSON.stringify(res.geometry ? res.geometry.toJson() : res.toJson()),
                    geometryType: res.geometry ? "esriGeometryPolygon" : "esriGeometryEnvelope",
                    sampleCount: 1,
                    mosaicRule: this.map.getLayer('naip123').mosaicRule ? JSON.stringify(this.map.getLayer('naip123').mosaicRule.toJson()) : null,
                    returnGeometry: false,
                    returnFirstValueOnly: true,
                    outFields: 'AcquisitionDate',
                    f: "json"
                },
                handleAs: "json",
                callbackParamName: "callback"
            });
            request3.then(lang.hitch(this, function (result) {
                console.log(result);
                let item = result.samples[0];
                let plot = item.value.split(' ');
                let nir = Number(plot[3]);
                let red = Number(plot[0]);
                let ndviz = (nir - red) / (red + nir);
                this.content = this.content + '<br /><br /><b>NAIP NDVI on ' + locale.format(new Date(item.attributes['AcquisitionDate']), { selector: "date", formatLength: "long" }) + '</b>: ' + ndviz.toFixed(2);
                this.map.infoWindow.setContent(this.content);
                this.map.infoWindow
                this.map.infoWindow.show(point);
            }));

            if (this.map.getLayer('USA_Cropland_683')) {
                var request4 = esriRequest({
                    url: this.map.getLayer('USA_Cropland_683').url + "/getSamples",
                    content: {
                        geometry: JSON.stringify(res.geometry ? res.geometry.toJson() : res.toJson()),
                        geometryType: res.geometry ? "esriGeometryPolygon" : "esriGeometryEnvelope",
                        sampleCount: 1,
                        mosaicRule: this.map.getLayer('USA_Cropland_683').mosaicRule ? JSON.stringify(this.map.getLayer('USA_Cropland_683').mosaicRule.toJson()) : null,
                        returnGeometry: false,
                        returnFirstValueOnly: true,
                        outFields: '*',
                        f: "json"
                    },
                    handleAs: "json",
                    callbackParamName: "callback"
                });
    
                request4.then(lang.hitch(this, function (result) {
                    console.log(result);
                    let item = result.samples[0];
                    for (let i = 0; i < this.croplandraster.features.length; i++) {
                        if (this.croplandraster.features[i].attributes.Value == item.value) {
                            var popuptext = this.croplandraster.features[i].attributes.Class_Name;
                            break;
                        }
                    }
                    this.content = this.content + '<br /><br /><b>Cropland Class' + '</b>: ' + popuptext;
                    this.map.infoWindow.setContent(this.content);
                    this.map.infoWindow
                    this.map.infoWindow.show(point);
                }));
            }
            
            if (this.map.getLayer('USA_Soils_Hydrologic_Group_8898')) {
                var request5 = esriRequest({
                    url: this.map.getLayer('USA_Soils_Hydrologic_Group_8898').url + "/getSamples",
                    content: {
                        geometry: JSON.stringify(res.geometry ? res.geometry.toJson() : res.toJson()),
                        geometryType: res.geometry ? "esriGeometryPolygon" : "esriGeometryEnvelope",
                        sampleCount: 1,
                        mosaicRule: this.map.getLayer('USA_Soils_Hydrologic_Group_8898').mosaicRule ? JSON.stringify(this.map.getLayer('USA_Soils_Hydrologic_Group_8898').mosaicRule.toJson()) : null,
                        returnGeometry: false,
                        returnFirstValueOnly: true,
                        outFields: '*',
                        f: "json"
                    },
                    handleAs: "json",
                    callbackParamName: "callback"
                });
    
                request5.then(lang.hitch(this, function (result) {
                    console.log(result);
                    let item = result.samples[0];
                    for (let i = 0; i < this.map.getLayer('USA_Soils_Hydrologic_Group_8898').rasterAttributeTable.features.length; i++) {
                        if (this.map.getLayer('USA_Soils_Hydrologic_Group_8898').rasterAttributeTable.features[i].attributes.Value == item.value) {
                            var popuptext = this.map.getLayer('USA_Soils_Hydrologic_Group_8898').rasterAttributeTable.features[i].attributes.PopupText;
                            break;
                        }
                    }
                    this.content = this.content + '<br /><br /><b>Soil Hydrology Group</b>: ' + popuptext;
                    this.map.infoWindow.setContent(this.content);
                    this.map.infoWindow
                    this.map.infoWindow.show(point);
                }));
    
            }
            
            var request6 = esriRequest({
                url: this.map.getLayer('dea123').url + "/getSamples",
                content: {
                    geometry: JSON.stringify(res.geometry ? res.geometry.toJson() : res.toJson()),
                    geometryType: res.geometry ? "esriGeometryPolygon" : "esriGeometryEnvelope",
                    mosaicRule: this.map.getLayer('dea123').mosaicRule ? JSON.stringify(this.map.getLayer('dea123').mosaicRule.toJson()) : null,
                    sampleCount: 1,
                    returnGeometry: false,
                    returnFirstValueOnly: true,
                    outFields: 'AcquisitionDate',
                    f: "json"
                },
                handleAs: "json",
                callbackParamName: "callback"
            });
            request6.then(lang.hitch(this, function (result) {
                console.log(result);
                let item = result.samples[0];
                let plot = item.value.split(' ');
                let nir = Number(plot[7]);
                let red = Number(plot[3]);
                let ndviz = (nir - red) / (red + nir);
                this.content = this.content + '<br /><br /><b>DEA_SentinelL2A NDVI on ' + locale.format(new Date(item.attributes['acquisitiondate']), { selector: "date", formatLength: "long" }) + '</b>: ' + ndviz.toFixed(2);
                this.map.infoWindow.setContent(this.content);
                this.map.infoWindow.show(point);
            }));

            var request7 = esriRequest({
                url: this.map.getLayer('planet123').url + "/getSamples",
                content: {
                    geometry: JSON.stringify(res.geometry ? res.geometry.toJson() : res.toJson()),
                    geometryType: res.geometry ? "esriGeometryPolygon" : "esriGeometryEnvelope",
                    mosaicRule: this.map.getLayer('planet123').mosaicRule ? JSON.stringify(this.map.getLayer('planet123').mosaicRule.toJson()) : null,
                    returnGeometry: false,
                    returnFirstValueOnly: true,
                    sampleCount: 1,
                    outFields: 'AcqDate',
                    f: "json"
                },
                handleAs: "json",
                callbackParamName: "callback"
            });
            request7.then(lang.hitch(this, function (result) {
                console.log(result);
                let item = result.samples[0];
                let plot = item.value.split(' ');
                let nir = Number(plot[0]);
                let red = Number(plot[1]);
                let ndviz = (nir - red) / (red + nir);
                //this.map.infoWindow.show(result.samples[0].location);
                this.content = this.content + '<br /><br /><b>Planet NDVI on ' + locale.format(new Date(item.attributes['AcqDate']), { selector: "date", formatLength: "long" }) + '</b>: ' + ndviz.toFixed(2);
                this.map.infoWindow.setContent(this.content);
                this.map.infoWindow.show(point);
                //domStyle.set('segment-div', 'display', 'block');

            }));

            if (this.map.getLayer(registry.byId('layerSelectorView').get('value')).url === this.config.urlSentinel) {
                domStyle.set('gamma-val', 'display', 'block');
            }

        },

        updateBands: function () {
            registry.byId("band-a").removeOption(registry.byId("band-a").getOptions());
            registry.byId("band-b").removeOption(registry.byId("band-b").getOptions());
            registry.byId("band-c").removeOption(registry.byId("band-c").getOptions());
            if (this.map.getLayer(registry.byId('layerSelectorView').get('value')).url === this.config.urlLandsatMS) {
                domStyle.set('gamma-val', 'display', 'none');
                registry.byId("band-a").addOption({ label: "Coastal(1)", value: "1" });
                registry.byId("band-a").addOption({ label: "Blue(2)", value: "2" });
                registry.byId("band-a").addOption({ label: "Green(3)", value: "3" });
                registry.byId("band-a").addOption({ label: "Red(4)", value: "4" });
                registry.byId("band-a").addOption({ label: "NIR(5)", value: "5" });
                registry.byId("band-a").addOption({ label: "SWIR1(6)", value: "6" });
                registry.byId("band-a").addOption({ label: "SWIR2(7)", value: "7" });
                registry.byId("band-a").addOption({ label: "Cirrus(8)", value: "8" });
                registry.byId("band-a").set("value", "6");

                registry.byId("band-b").addOption({ label: "Coastal(1)", value: "1" });
                registry.byId("band-b").addOption({ label: "Blue(2)", value: "2" });
                registry.byId("band-b").addOption({ label: "Green(3)", value: "3" });
                registry.byId("band-b").addOption({ label: "Red(4)", value: "4" });
                registry.byId("band-b").addOption({ label: "NIR(5)", value: "5" });
                registry.byId("band-b").addOption({ label: "SWIR1(6)", value: "6" });
                registry.byId("band-b").addOption({ label: "SWIR2(7)", value: "7" });
                registry.byId("band-b").addOption({ label: "Cirrus(8)", value: "8" });
                registry.byId("band-b").set("value", "5");

                registry.byId("band-c").addOption({ label: "Coastal(1)", value: "1" });
                registry.byId("band-c").addOption({ label: "Blue(2)", value: "2" });
                registry.byId("band-c").addOption({ label: "Green(3)", value: "3" });
                registry.byId("band-c").addOption({ label: "Red(4)", value: "4" });
                registry.byId("band-c").addOption({ label: "NIR(5)", value: "5" });
                registry.byId("band-c").addOption({ label: "SWIR1(6)", value: "6" });
                registry.byId("band-c").addOption({ label: "SWIR2(7)", value: "7" });
                registry.byId("band-c").addOption({ label: "Cirrus(8)", value: "8" });
                registry.byId("band-c").set("value", "2");

                registry.byId("stretchoptionsExp").set("value", "clip2");
                registry.byId("gammaoptionsExp").set("value", "4");
            } else if (this.map.getLayer(registry.byId('layerSelectorView').get('value')).url === this.config.urlSentinel) {
                domStyle.set('gamma-val', 'display', 'block');
                registry.byId("band-a").addOption({ label: "Coastal(1)", value: "1" });
                registry.byId("band-a").addOption({ label: "Blue(2)", value: "2" });
                registry.byId("band-a").addOption({ label: "Green(3)", value: "3" });
                registry.byId("band-a").addOption({ label: "Red(4)", value: "4" });
                registry.byId("band-a").addOption({ label: "VRE(5)", value: "5" });
                registry.byId("band-a").addOption({ label: "VRE(6)", value: "6" });
                registry.byId("band-a").addOption({ label: "VRE(7)", value: "7" });
                registry.byId("band-a").addOption({ label: "NIR(8)", value: "8" });
                registry.byId("band-a").addOption({ label: "NarrowNIR(8A)", value: "9" });
                registry.byId("band-a").addOption({ label: "Water Vapor(9)", value: "10" });
                registry.byId("band-a").addOption({ label: "Cirrus(10)", value: "11" });
                registry.byId("band-a").addOption({ label: "SWIR(11)", value: "12" });
                registry.byId("band-a").addOption({ label: "SWIR(12)", value: "13" });
                registry.byId("band-a").set("value", "12");

                registry.byId("band-b").addOption({ label: "Coastal(1)", value: "1" });
                registry.byId("band-b").addOption({ label: "Blue(2)", value: "2" });
                registry.byId("band-b").addOption({ label: "Green(3)", value: "3" });
                registry.byId("band-b").addOption({ label: "Red(4)", value: "4" });
                registry.byId("band-b").addOption({ label: "VRE(5)", value: "5" });
                registry.byId("band-b").addOption({ label: "VRE(6)", value: "6" });
                registry.byId("band-b").addOption({ label: "VRE(7)", value: "7" });
                registry.byId("band-b").addOption({ label: "NIR(8)", value: "8" });
                registry.byId("band-b").addOption({ label: "NarrowNIR(8A)", value: "9" });
                registry.byId("band-b").addOption({ label: "Water Vapor(9)", value: "10" });
                registry.byId("band-b").addOption({ label: "Cirrus(10)", value: "11" });
                registry.byId("band-b").addOption({ label: "SWIR(11)", value: "12" });
                registry.byId("band-b").addOption({ label: "SWIR(12)", value: "13" });
                registry.byId("band-b").set("value", "8");

                registry.byId("band-c").addOption({ label: "Coastal(1)", value: "1" });
                registry.byId("band-c").addOption({ label: "Blue(2)", value: "2" });
                registry.byId("band-c").addOption({ label: "Green(3)", value: "3" });
                registry.byId("band-c").addOption({ label: "Red(4)", value: "4" });
                registry.byId("band-c").addOption({ label: "VRE(5)", value: "5" });
                registry.byId("band-c").addOption({ label: "VRE(6)", value: "6" });
                registry.byId("band-c").addOption({ label: "VRE(7)", value: "7" });
                registry.byId("band-c").addOption({ label: "NIR(8)", value: "8" });
                registry.byId("band-c").addOption({ label: "NarrowNIR(8A)", value: "9" });
                registry.byId("band-c").addOption({ label: "Water Vapor(9)", value: "10" });
                registry.byId("band-c").addOption({ label: "Cirrus(10)", value: "11" });
                registry.byId("band-c").addOption({ label: "SWIR(11)", value: "12" });
                registry.byId("band-c").addOption({ label: "SWIR(12)", value: "13" });
                registry.byId("band-c").set("value", "2");

                registry.byId("stretchoptionsExp").set("value", "clip1");
                registry.byId("gammaoptionsExp").set("value", "5");
            } else if (this.map.getLayer(registry.byId('layerSelectorView').get('value')).url === this.config.urlNaip) {
                domStyle.set('gamma-val', 'display', 'none');
                registry.byId("band-a").addOption({ label: "Red(1)", value: "1" });
                registry.byId("band-a").addOption({ label: "Green(2)", value: "2" });
                registry.byId("band-a").addOption({ label: "Blue(3)", value: "3" });
                registry.byId("band-a").addOption({ label: "NIR(4)", value: "4" });
                registry.byId("band-a").set("value", "4");


                registry.byId("band-b").addOption({ label: "Red(1)", value: "1" });
                registry.byId("band-b").addOption({ label: "Green(2)", value: "2" });
                registry.byId("band-b").addOption({ label: "Blue(3)", value: "3" });
                registry.byId("band-b").addOption({ label: "NIR(4)", value: "4" });

                registry.byId("band-b").set("value", "1");

                registry.byId("band-c").addOption({ label: "Red(1)", value: "1" });
                registry.byId("band-c").addOption({ label: "Green(2)", value: "2" });
                registry.byId("band-c").addOption({ label: "Blue(3)", value: "3" });
                registry.byId("band-c").addOption({ label: "NIR(4)", value: "4" });
                registry.byId("band-c").set("value", "2");

            }
        },

        onOpen: function () {
            if (!this.map.aoi) {
                this.map.aoi = this.map.extent;
                this.aoi = this.map.extent;
            }
            this.mapClick = this.map.on('click', lang.hitch(this, this.mapClickEventQuery));

            //this.updateBands();
            if (this.map) {
                this.transparentSegkHandler = this.map.on("layer-add", lang.hitch(this, function (response) {
                    if (response.layer.id === "resultLayer") {
                        if (this.imageMaskTool === "mask") {
                            // registry.byId("aoiExtentMask").set("checked", false);
                        }
                        domStyle.set("seg-trans", "display", "block");
                        registry.byId("result-seg-Opacity").set("value", 1 - response.layer.opacity);
                    }
                }));
            }
        },

        onClose: function () {
            if (this.mapClick) {
                this.mapClick.remove();
                this.mapClick = null;
            }

            if (this.transparentSegkHandler) {
                this.transparentSegkHandler.remove();
                this.transparentSegkHandler = null
            }
        }

    });
});
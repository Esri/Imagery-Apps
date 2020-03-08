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
    'dojo/text!./Widget.html', "esri/IdentityManager",
    'jimu/BaseWidget', "./resourceLoad.js", "dijit/TooltipDialog",
    "esri/layers/ArcGISImageServiceVectorLayer", "esri/renderers/VectorFieldRenderer", "esri/layers/Raster", "esri/layers/MosaicRule"

],
        function (
                declare,
                _WidgetsInTemplateMixin,
                template, IdentityManager,
                BaseWidget, resourceLoad, TooltipDialog, ArcGISImageServiceVectorLayer, VectorFieldRenderer, Raster, MosaicRule
                ) {
            var resource = new resourceLoad({resource: "layer"});
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
                    Extent = plugins[15], bundle = plugins[16], registry = plugins[17],
                    PanelManager = plugins[18],
                    domAttr = plugins[19], WidgetManager = plugins[20];

            var pm = PanelManager.getInstance();
            var wm = WidgetManager.getInstance();
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
                    IdentityManager.useSignInPage = false;
                    if (window.innerWidth < 1150) {
                        var fontsize = (22 / window.innerWidth) * (window.innerWidth - 170);
                        var fontsize2 = 0.636 * fontsize;
                    } else {
                        var fontsize = 22;
                        var fontsize2 = 14;
                    }
                    if (window.innerWidth < 620) {
                        domStyle.set("oceanCurrentsDialog", "font-size", "7px");
                        var headerCustom = domConstruct.toDom('<table id="headerTable" style="border: 0px;height: 40px;display: -webkit-inline-box;margin-left: 20px;">' +
                                '<tr style="height: 40px;"><td><div id="appName" style="font-size: ' + fontsize + 'px; position: relative; bottom: 3px; color: white; font-weight: bold;background-color: transparent;">Hycom Explorer</div></td><td><div id="rendererInformation" style="font-size: ' + fontsize2 + 'px;color: white; font-weight: bold;background-color: transparent;display:block;">&nbsp;&nbsp;Rendering:&nbsp;Sea Water Temperature Celsius</div>' +
                                '<div style=" font-size: ' + fontsize2 + 'px;color: white; font-weight: bold;background-color: transparent;display:none;" id="dateSecondary"></div><div style=" font-size: ' + fontsize2 + 'px;color: white; font-weight: bold;background-color: transparent;" id="dateDisplay"></div></td><td><div style=" font-size: ' + fontsize2 + 'px;color: white; font-weight: bold;background-color: transparent;" id="depthDisplay">&nbsp;&nbsp;Depth:&nbsp;0&nbsp;m</div></td></tr></table>' +
                                '');

                    } else if (window.innerWidth < 850) {
                        domStyle.set("oceanCurrentsDialog", "font-size", "8px");
                        var headerCustom = domConstruct.toDom('<table id="headerTable" style="border: 0px;height: 40px;display: -webkit-inline-box;margin-left: 20px;">' +
                                '<tr style="height: 40px;"><td><div id="appName" style="font-size: ' + fontsize + 'px; position: relative; bottom: 3px; color: white; font-weight: bold;background-color: transparent;width:max-content;">Hycom Explorer</div></td><td><div id="rendererInformation" style="font-size: ' + fontsize2 + 'px;color: white; font-weight: bold;background-color: transparent;display:block;width:max-content;">&nbsp;&nbsp;Rendering:&nbsp;Sea Water Temperature Celsius</div></td>' +
                                '<td><div style=" font-size: ' + fontsize2 + 'px;color: white; font-weight: bold;background-color: transparent;display:none;width:max-content;" id="dateSecondary"></div><div style=" font-size: ' + fontsize2 + 'px;color: white; font-weight: bold;background-color: transparent;width:max-content;" id="dateDisplay"></div></td><td><div style=" font-size: ' + fontsize2 + 'px;color: white; font-weight: bold;background-color: transparent;width:max-content;" id="depthDisplay">&nbsp;&nbsp;Depth:&nbsp;0&nbsp;m</div></td></tr></table>' +
                                '');

                    } else {
                        domStyle.set("oceanCurrentsDialog", "font-size", "12px");
                        var headerCustom = domConstruct.toDom('<table id="headerTable" style="border: 0px;height: 40px;display: -webkit-inline-box;margin-left: 20px;">' +
                                '<tr style="height: 40px;"><td><div id="appName" style="font-size: ' + fontsize + 'px; position: relative; bottom: 3px; color: white; font-weight: bold;background-color: transparent;width:max-content;">Hycom Explorer</div></td><td><div id="rendererInformation" style="font-size: ' + fontsize2 + 'px;color: white; font-weight: bold;background-color: transparent;display:block;width:max-content;">&nbsp;&nbsp;Rendering:&nbsp;Sea Water Temperature Celsius</div></td>' +
                                '<td><div style=" font-size: ' + fontsize2 + 'px;color: white; font-weight: bold;background-color: transparent;display:none;width:max-content;" id="dateSecondary"></div></td><td><div style=" font-size: ' + fontsize2 + 'px;color: white; font-weight: bold;background-color: transparent;width:max-content;" id="dateDisplay"></div></td><td><div style=" font-size: ' + fontsize2 + 'px;color: white; font-weight: bold;background-color: transparent;width:max-content;" id="depthDisplay">&nbsp;&nbsp;Depth:&nbsp;0&nbsp;m</div></td></tr></table>' +
                                '');
                    }
                    domConstruct.place(headerCustom, "jimu-layout-manager", "after");
                    domConstruct.place('<img id="loadingLayer" style="position: absolute;top:0;bottom: 0;left: 0;right: 0;margin:auto;z-index:100;display:none;" src="' + require.toUrl('jimu') + '/images/loading.gif">', this.map.container);
                    domConstruct.place('<img id="loadingLayer1" style="position: absolute;top:0;bottom: 0;left: 0;right: 0;margin:auto;z-index:100;" src="' + require.toUrl('jimu') + '/images/loading.gif">', "oceanCurrentsDialog");

                    var headerCustom1 = domConstruct.toDom('<div id="minimizeLayerButton" style="background-color: black; cursor: pointer;border-radius: 4px;height: 30px;width:30px;position: absolute;top:180px;left: 20px;display: none;"><a   id="layerMinimize" target="_blank"><img id="timeThumnail" src="widgets/ISLayers/images/contour.png" style="height: 20px;margin:5px;" alt="Time" /></a></div>');
                    domConstruct.place(headerCustom1, this.map.container);
                    on(dom.byId("layerMinimize"), "click", lang.hitch(this, lang.hitch(this, function () {
                        domStyle.set("minimizeLayerButton", "display", "none");
                        this.noMinimizeDisplay = true;
                        if (registry.byId("oceanCurrentsDialog") && registry.byId("oceanCurrentsDialog").open)
                            registry.byId("oceanCurrentsDialog").hide();
                        if (registry.byId("maskDialog") && registry.byId("maskDialog").open)
                            registry.byId("maskDialog").hide();
                        if (registry.byId("timeDialog") && registry.byId("timeDialog").open)
                            registry.byId("timeDialog").hide();
                        var x = document.getElementsByClassName("icon-node");
                        if (domClass.contains(x[6], "jimu-state-selected"))
                            pm.closePanel("_22_panel");
                        if (domClass.contains(x[4], "jimu-state-selected"))
                            pm.closePanel("_70_panel");
                        registry.byId("overlayLayerDialog").show();
                        domStyle.set("overlayLayerDialog", "top", "100px");
                        domStyle.set("overlayLayerDialog", "left", "160px");
                    })));
                    new Tooltip({
                        connectId: ["appName"],
                        label: "Explore HYCOM Data with ArcGIS.",
                        position: ['below']
                    });
                },
                resizeLayersWidget: function () {
                    if (window.innerWidth < 1150) {
                        var fontsize = (22 / window.innerWidth) * (window.innerWidth - 170);
                        var fontsize2 = 0.636 * fontsize;
                        var tablewidth = 10;
                    } else {
                        var fontsize = 22;
                        var fontsize2 = 14;
                        var tablewidth = 15;
                    }

                    var appName = document.getElementById("appName")
                    var rendererDom = document.getElementById("rendererInformation");
                    var secondaryDom = document.getElementById("dateSecondary");
                    var primaryDom = document.getElementById("dateDisplay");
                    var depthDom = document.getElementById("depthDisplay");
                    appName.style.fontSize = fontsize + "px";
                    rendererDom.style.fontSize = fontsize2 + "px";
                    secondaryDom.style.fontSize = fontsize2 + "px";
                    primaryDom.style.fontSize = fontsize2 + "px";
                    depthDom.style.fontSize = fontsize2 + "px";
                    var table = document.getElementById("headerTable");
                    table.deleteRow(0);
                    var row = table.insertRow(0);
                    row.style = "height:40px";
                    var cell = row.insertCell(0);
                    //cell.style = "width:" + tablewidth + "rem";
                    cell.innerHTML = appName.outerHTML;
                    var cell1 = row.insertCell(1);
                    if (window.innerWidth < 620) {
                        domStyle.set("oceanCurrentsDialog", "font-size", "7px");
                        cell1.innerHTML = rendererDom.outerHTML + secondaryDom.outerHTML + primaryDom.outerHTML + depthDom.outerHTML;
                    } else if (window.innerWidth < 850) {
                        domStyle.set("oceanCurrentsDialog", "font-size", "8px");
                        cell1.innerHTML = rendererDom.outerHTML;
                        var cell2 = row.insertCell(2);
                        cell2.innerHTML = secondaryDom.outerHTML + primaryDom.outerHTML + depthDom.outerHTML;
                    } else {
                        domStyle.set("oceanCurrentsDialog", "font-size", "12px");
                        cell1.innerHTML = rendererDom.outerHTML;
                        var cell2 = row.insertCell(2);
                        cell2.innerHTML = secondaryDom.outerHTML;
                        var cell3 = row.insertCell(3);
                        cell3.innerHTML = primaryDom.outerHTML;
                        var cell4 = row.insertCell(4);
                        cell4.innerHTML = depthDom.outerHTML;
                    }

                },
                postCreate: function () {
                    window.addEventListener("resize", lang.hitch(this, function () {

                        if (registry.byId("oceanCurrentsDialog").open)
                            var tempDialog = "oceanCurrentsDialog";
                        else if (registry.byId("overlayLayerDialog").open)
                            var tempDialog = "overlayLayerDialog";
                        else if (registry.byId("timeDialog") && registry.byId("timeDialog").open)
                            var tempDialog = "timeDialog";
                        else if (registry.byId("maskDialog") && registry.byId("maskDialog").open)
                            var tempDialog = "maskDialog";
                        else if (registry.byId("Add Data from ArcGIS Online") && registry.byId("Add Data from ArcGIS Online").open)
                            var tempDialog = "Add Data from ArcGIS Online";
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
                        this.resizeLayersWidget();
                        document.getElementById("_8_panel").style.top = "40px";
                    }));
                    this.own(
                            on(this.multiBRadio, "click", lang.hitch(this, this.applyTemplate, "Sea Surface Elevation Meters", this.multiBRadio)),
                            on(this.multiCRadio, "click", lang.hitch(this, this.applyTemplate, "Sea Water Temperature Celsius", this.multiCRadio)),
                            on(this.multiDRadio, "click", lang.hitch(this, this.applyTemplate, "Sea Water Salinity", this.multiDRadio)),
                            on(this.multiERadio, "click", lang.hitch(this, this.applyTemplate, "Ocean Currents", this.multiERadio)),
                            on(this.multiARadio, "click", lang.hitch(this, function () {
                                if (domClass.contains(this.multiFRadio, "selected")) {
                                    this.multiFRadio.click();
                                }
                                if (domClass.contains(this.multiARadio, "selected")) {
                                    domClass.remove(this.multiARadio, "selected");
                                    if (this.map.getLayer("topLayer")) {
                                        this.map.getLayer("topLayer").suspend();
                                        this.map.removeLayer(this.map.getLayer("topLayer"));
                                    }
                                } else {
                                    domClass.add(this.multiARadio, "selected");
                                    this.addOverlayLayer("vector");
                                }
                            })),
                            on(this.multiFRadio, "click", lang.hitch(this, function () {
                                if (domClass.contains(this.multiARadio, "selected")) {
                                    this.multiARadio.click();
                                }
                                if (domClass.contains(this.multiFRadio, "selected")) {
                                    domClass.remove(this.multiFRadio, "selected");
                                    this.noMinimizeDisplay = false;
                                    if (registry.byId("overlayLayerDialog").open)
                                        registry.byId("overlayLayerDialog").hide();

                                    this.noMinimizeDisplay = true;
                                    if (this.map.getLayer("topLayer")) {
                                        this.map.getLayer("topLayer").suspend();
                                        this.map.removeLayer(this.map.getLayer("topLayer"));
                                    }
                                    if (domStyle.get("minimizeLayerButton", "display") === "block")
                                        domStyle.set("minimizeLayerButton", "display", "none");
                                } else {

                                    domClass.add(this.multiFRadio, "selected");
                                    this.addOverlayLayer("contour");
                                    this.noMinimizeDisplay = true;
                                    var x = document.getElementsByClassName("icon-node");

                                    if (registry.byId("oceanCurrentsDialog") && registry.byId("oceanCurrentsDialog").open)
                                        registry.byId("oceanCurrentsDialog").hide();
                                    if (registry.byId("maskDialog") && registry.byId("maskDialog").open)
                                        registry.byId("maskDialog").hide();
                                    if (registry.byId("timeDialog") && registry.byId("timeDialog").open)
                                        registry.byId("timeDialog").hide();

                                    if (domClass.contains(x[6], "jimu-state-selected"))
                                        pm.closePanel("_22_panel");
                                    if (domClass.contains(x[4], "jimu-state-selected"))
                                        pm.closePanel("_70_panel");
                                    registry.byId("overlayLayerDialog").show();
                                    domStyle.set("overlayLayerDialog", "top", "100px");
                                    domStyle.set("overlayLayerDialog", "left", "160px");
                                    domConstruct.destroy("overlayLayerDialog_underlay");
                                }
                            }))


                            );
                    registry.byId("smoothContours").on("change", lang.hitch(this, this.changeRenderer));
                    registry.byId("noOfContours").on("change", lang.hitch(this, this.changeRenderer));

                    registry.byId("oceanCurrentList").on("change", lang.hitch(this, function (value) {
                        var layer = this.map.getLayer("primaryLayer");
                        if (layer)
                            layer.setRenderingRule(new RasterFunction({"rasterFunction": value}));
                        dom.byId("rendererInformation").innerHTML = "&nbsp;&nbsp;Rendering:&nbsp;" + value;
                        this.timeAndDepthRefresh();
                    }));
                    registry.byId("contourList").on("change", lang.hitch(this, this.addOverlayLayer, "contour"));


                    this.map.on("update-start", lang.hitch(this, this.showLoading));
                    this.map.on("update-end", lang.hitch(this, this.hideLoading));
                    //    this.map.on("extent-change", lang.hitch(this, this.timebook));
                    this.appStageHandler = this.map.on("layer-add-result", lang.hitch(this, this.timeClicked));

                    new Tooltip({
                        connectId: [this.domNode],
                        selector: ".layer-item",
                        position: ['after'],
                        getContent: function (matchedNode) {
                            return matchedNode.getAttribute("data-tooltip");
                        }
                    });


                    var params = new ImageServiceParameters();
                    // params.format = "png32";
                    params.mosaicRule = new MosaicRule({"mosaicMethod": "esriMosaicAttribute", "sortField": "StdTime", "sortValue": "2050/01/01", "ascending": true, "mosaicOperation": "MT_FIRST", "multidimensionalDefinition": []});
                    var loadlayer = new ArcGISImageServiceLayer(this.config.hycomUrl, {
                        imageServiceParameters: params,
                        id: "primaryLayer",
                        visible: true,
                        title: "HYCOM"
                    });

                    this.map.addLayer(loadlayer, 1);




                    dojo.connect(registry.byId("overlayLayerDialog"), "hide", lang.hitch(this, function (e) {
                        if (this.noMinimizeDisplay && domStyle.get("minimizeLayerButton", "display") === "none")
                            domStyle.set("minimizeLayerButton", "display", "block");
                    }));
                    domClass.add(this.multiCRadio, "selected");
                    this.selectedRadio = this.multiCRadio;
                    this.map.primaryRenderer = "Sea Water Temperature Celsius";
                },
                changeRenderer: function () {
                    var raster = new RasterFunction();
                    raster.functionName = registry.byId("contourList").get("value");
                    var args = {};
                    args.SigmaGaussian = parseFloat(registry.byId("smoothContours").get("value"));
                    args.NumberOfContours = parseInt(registry.byId("noOfContours").get("value"));
                    raster.functionArguments = args;
                    this.map.getLayer("topLayer").setRenderingRule(raster);
                },
                applyTemplate: function (value, radio) {
                    if (this.selectedRadio) {
                        domClass.remove(this.selectedRadio, "selected");
                    }
                    if (value === "Sea Surface Elevation Meters")
                        document.getElementsByClassName("icon-node")[1].style.pointerEvents = "none";
                    else
                        document.getElementsByClassName("icon-node")[1].style.pointerEvents = "auto";
                    domClass.add(radio, "selected");
                    if (value === "Ocean Currents") {
                        var x = document.getElementsByClassName("icon-node");

                        if (registry.byId("overlayLayerDialog") && registry.byId("overlayLayerDialog").open)
                            registry.byId("overlayLayerDialog").hide();
                        if (registry.byId("maskDialog") && registry.byId("maskDialog").open)
                            registry.byId("maskDialog").hide();
                        if (registry.byId("timeDialog") && registry.byId("timeDialog").open)
                            registry.byId("timeDialog").hide();

                        if (domClass.contains(x[6], "jimu-state-selected"))
                            pm.closePanel("_22_panel");
                        if (domClass.contains(x[4], "jimu-state-selected"))
                            pm.closePanel("_70_panel");
                        registry.byId("oceanCurrentsDialog").show();
                        domStyle.set("oceanCurrentsDialog", "top", "100px");
                        domStyle.set("oceanCurrentsDialog", "left", "160px");
                        domConstruct.destroy("oceanCurrentsDialog_underlay");
                        value = registry.byId("oceanCurrentList").get("value");
                    } else {
                        if (registry.byId("oceanCurrentsDialog").open)
                            registry.byId("oceanCurrentsDialog").hide();
                    }
                    var layer = this.map.getLayer("primaryLayer");
                    if (layer) {
                        var raster = new RasterFunction();
                        raster.functionName = value;
                        this.map.primaryRenderer = value;
                        layer.setRenderingRule(raster);

                    }

                    dom.byId("rendererInformation").innerHTML = "&nbsp;&nbsp;Rendering:&nbsp;" + value;
                    this.selectedRadio = radio;
                    if (registry.byId("depthDialog") && registry.byId("depthDialog").open)
                        registry.byId("depthDialog").hide();
                    if (dom.byId("chartshow") && domStyle.get("chartshow", "display") === "block") {
                        domStyle.set("timeSortDivContainer", "display", "block");
                        domStyle.set("chartshow", "display", "none");
                    }
                    this.timeAndDepthRefresh();
                },
                timeAndDepthRefresh: function () {
                    if (wm.getWidgetById("widgets_ISTimeFilter_Widget_15") && domClass.contains(document.getElementsByClassName("icon-node")[0], "jimu-state-selected")) {

                        wm.getWidgetById("widgets_ISTimeFilter_Widget_15").timeSliderRefresh();
                    }
                    if (wm.getWidgetById("widgets_Depth_Widget_15") && domClass.contains(document.getElementsByClassName("icon-node")[1], "jimu-state-selected")) {
                        if (!domClass.contains(this.multiBRadio, "selected"))
                            wm.getWidgetById("widgets_Depth_Widget_15").depthSliderRefresh();
                        else
                            document.getElementsByClassName("icon-node")[1].click();//wm.getWidgetById("widgets_Depth_Widget_15").onClose();    
                    }
                },
                timeClicked: function (layer) {
                    if (layer.layer.id === "topLayer") {

                        this.timeAndDepthRefresh();
                    }
                },
                addOverlayLayer: function (type) {

                    var layer = this.map.getLayer("topLayer");
                    if (layer)
                    {
                        layer.suspend();
                        this.map.removeLayer(layer);

                    }

                    var params = new ImageServiceParameters();
                    params.mosaicRule = new MosaicRule({"mosaicMethod": "esriMosaicAttribute", "sortField": "StdTime", "sortValue": "2050/01/01", "ascending": true, "mosaicOperation": "MT_FIRST", "multidimensionalDefinition": []});
                    if (type === "contour") {
                        var rasterFunction = new RasterFunction();
                        rasterFunction.functionName = registry.byId("contourList").get("value");
                        var args = {};
                        args.SigmaGaussian = parseFloat(registry.byId("smoothContours").get("value"));
                        args.NumberOfContours = parseInt(registry.byId("noOfContours").get("value"));
                        rasterFunction.functionArguments = args;
                        params.renderingRule = rasterFunction;
                        var topLayer = new ArcGISImageServiceLayer(this.config.hycomUrl, {
                            imageServiceParameters: params,
                            id: "topLayer",
                            visible: true,
                            title: "HYCOM_Contour"
                        });
                        topLayer.title = "HYCOM_Contour";
                    } else {
                        var topLayer = new ArcGISImageServiceVectorLayer(this.config.uvUrl, {
                            id: "topLayer",
                            visible: true,
                            imageServiceParameters: params,
                            title: "HYCOM_UV"
                        });
                        topLayer.title = "HYCOM_UV";
                        var sizeInfoVar = {
                            type: "sizeInfo",
                            minSize: 3,
                            maxSize: 100,
                            minDataValue: 0.04,
                            maxDataValue: 32
                        };
                        var renderer1 = new VectorFieldRenderer({
                            style: VectorFieldRenderer["STYLE_OCEAN_CURRENT_M"], //registry.byId("arrowSymbol").get("value")],
                            flowRepresentation: VectorFieldRenderer.FLOW_FROM
                        });
                        //   renderer1.setVisualVariables([sizeInfoVar]);
                        topLayer.setRenderer(renderer1);
                    }
                    this.map.addLayer(topLayer);


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
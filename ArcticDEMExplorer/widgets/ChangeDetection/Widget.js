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
    "dijit/registry",
    "dojo/_base/lang",
    "dojo/dom",
    "dojo/dom-construct",
    "dojo/dom-style",
    "esri/request",
   "dojo/date/locale",
   "esri/layers/RasterFunction",
   "esri/layers/ArcGISImageServiceLayer",
    'dojo/dom-class',
    "esri/layers/ImageServiceParameters",
    "dojo/html",
    "dojo/_base/connect",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/symbols/SimpleLineSymbol",
    "esri/Color",
    "jimu/PanelManager",
    "esri/toolbars/draw",
    "dijit/Dialog",
     "esri/graphic",
    "dijit/form/Select",
    "dijit/form/Button",
    "dijit/form/NumberSpinner",
    "dijit/form/CheckBox",
    "dijit/form/TextBox",
    "dijit/form/DropDownButton",
    "dijit/TooltipDialog",
    'jimu/dijit/DrawBox',
    "esri/SpatialReference",
    "dijit/layout/BorderContainer",
    "dijit/form/RadioButton"
  
    

],
        function (
                declare,
                _WidgetsInTemplateMixin,
                template,
                BaseWidget,
                registry,
                lang,
                dom,
                domConstruct,
                domStyle, esriRequest,locale,RasterFunction,ArcGISImageServiceLayer,domClass,ImageServiceParameters, html, connect, SimpleMarkerSymbol, SimpleLineSymbol, Color, PanelManager, Draw) {
            var pm = PanelManager.getInstance();
            var clazz = declare([BaseWidget, _WidgetsInTemplateMixin], {
                templateString: template,
                name: 'ChangeDetection',
                baseClass: 'jimu-widget-ChangeDetection',
                primaryLayer: null,
                changeDetectionLayer : null,
                objectIdOfFirstScene: null,
                changeFlag: false,
                stretchRange: 15,
               savedFirstId:null,
               savedSecondId:null,
                startup: function () {
                    this.inherited(arguments);
                    domConstruct.place('<img id="loadingChangeDetection" style="position: absolute;top:0;bottom: 0;left: 0;right: 0;margin:auto;z-index:100;" src="' + require.toUrl('jimu') + '/images/loading.gif">', "changeDetectionDialog");
                },
                onOpen: function () {
                    if (registry.byId("buildDialog") && registry.byId("buildDialog").open)
                        registry.byId("buildDialog").hide();
                    if(registry.byId("timeDialog") && registry.byId("timeDialog").open)
                       registry.byId("timeDialog").hide();
                   if(pm.getPanelById("_33_panel") && pm.getPanelById("_33_panel").state === "opened")
                       pm.closePanel("_33_panel");
                  if(pm.getPanelById("_30_panel") && pm.getPanelById("_30_panel").state === "opened")
                       pm.closePanel("_30_panel");
                    if (registry.byId("contourDialog") && registry.byId("contourDialog").open)
                        registry.byId("contourDialog").hide();
                     if (registry.byId("DialogElevation") && registry.byId("DialogElevation").open)
                        registry.byId("DialogElevation").hide();
                    domStyle.set("loadingChangeDetection", "display", "none");
                    var layer = this.map.getLayer("primaryLayer");
                    var value = registry.byId("savedSceneDetails").get("value").split(",");
                    this.objectIdOfFirstScene = parseInt(value[0]);
                    this.firstSceneDate = parseInt(value[1]);
                    var shareCheck = registry.byId("savedSceneID").get("value");
                           if(shareCheck && shareCheck.includes(",")) {
                               registry.byId("savedScene").set("value","Hillshade Gray");
                               var shareCheck = {second: shareCheck.split(",")[0], first: shareCheck.split(",")[1]};
                               this.doChangeDetection(shareCheck);
                           } else if (layer && layer.mosaicRule && layer.mosaicRule.method === "esriMosaicLockRaster" && this.objectIdOfFirstScene && layer.mosaicRule.lockRasterIds[0] !== this.objectIdOfFirstScene) {
                            if(domClass.contains(registry.byId("savedScene").get("value"),"selected"))  
                            dom.byId(registry.byId("savedScene").get("value")).click();
                            this.doChangeDetection(layer);
                   
                    } else {
                            domStyle.set("stretchValue", "display", "none");
                            html.set(this.errorHandler, "First define a secondary image using Time Control.");
                            domStyle.set("stats", "display", "none");
                            html.set(this.statsText, "");
                    }

                 
                    if (!(registry.byId("changeDetectionDialog")).open) {
                        registry.byId("changeDetectionDialog").show();
                        domStyle.set("changeDetectionDialog", "left", "160px");
                        domStyle.set("changeDetectionDialog", "top", "75px");
                    }
                    domConstruct.destroy("changeDetectionDialog_underlay");
                },
                onClose: function () {
                    if(this.map.getLayer("resultLayer")){
                        if(this.map.getLayer("resultLayer").updating)
                                this.map.getLayer("resultLayer").suspend();
                        this.map.removeLayer(this.map.getLayer("resultLayer"));}
                     for(var k in this.map.graphics.graphics)
                    {
                        if(this.map.graphics.graphics[k].geometry.type==="polygon"){
                            if(this.map.graphics.graphics[k].symbol.color.r === 200)
                            {  this.map.graphics.remove(this.map.graphics.graphics[k]);
                    break;
                    }}
                }
                if(this.toolbarForStats)
                    this.toolbarForStats.deactivate();
                 
                     if(registry.byId("changeDetectionDialog").open)
                                   registry.byId("changeDetectionDialog").hide();
                               if(!domClass.contains(registry.byId("savedScene").get("value"),"selected"))
                               dom.byId(registry.byId("savedScene").get("value")).click();
                },
               
                postCreate: function () {
                    this.inherited(arguments);
                     registry.byId('inputRanges').on("change", lang.hitch(this, this.doChangeDetection));
                   /* registry.byId("getStatsBtn").on("click",lang.hitch(this, function(){
                    registry.byId("changeDetectionDialog").hide();
                    this.toolbarForStats.activate(Draw.POLYGON);
                    }));*/
                    this.map.on("layer-add-result",lang.hitch(this,function(layer){
                        if(layer.layer.id ==="resultLayer"){
                             this.toolbarForStats.activate(Draw.POLYGON);
                        }
                    }));
                    if (this.map) {
                        this.map.on("update-end", lang.hitch(this, this.refreshData));
                         this.toolbarForStats = new Draw(this.map);
                  dojo.connect(this.toolbarForStats,"onDrawEnd",lang.hitch(this,this.getStats));
                    }
                    dojo.connect(registry.byId("changeDetectionDialog"),"hide",lang.hitch(this, function(){
                        if(this.toolbarForStats)
                        this.toolbarForStats.deactivate();
                    }));
                },
                 doChangeDetection: function(layer){
                    
                  domStyle.set("loadingChangeDetection","display","block");
                  
                       if(this.map.getLayer("resultLayer") && this.stretchRange !== registry.byId("inputRanges").get("value")){
                                              var rendererOnResult = (this.map.getLayer("resultLayer")).renderingRule;
                             var min = parseInt(registry.byId("inputRanges").get("value")) * -1 ;
                       var max = parseInt(registry.byId("inputRanges").get("value")); 
                            rendererOnResult.functionArguments.Raster.functionArguments.Statistics = [[parseInt(registry.byId("inputRanges").get("value")) * -1,parseInt(registry.byId("inputRanges").get("value")),0,0]]; 
                    (this.map.getLayer("resultLayer")).setRenderingRule(rendererOnResult);
                    this.stretchRange = registry.byId("inputRanges").get("value");
                                        }else{
             
                            var raster1 = new RasterFunction();
                        raster1.functionName = "ExtractBand";
                        var arguments = {};
                        arguments.BandIDs = [0];
                        if(layer.first)
                        arguments.Raster = "$"+layer.first;
                         else
                        arguments.Raster = "$"+layer.mosaicRule.lockRasterIds[0];
                        raster1.functionArguments = arguments;
                        var raster2 = new RasterFunction();
                        raster2.functionName = "ExtractBand";
                        var arguments1 = {};
                        arguments1.BandIDs = [0];
                         if(layer.second)
                        arguments.Raster = "$"+layer.second;
                         else
                        arguments1.Raster = "$"+this.objectIdOfFirstScene;
                        raster2.functionArguments = arguments1;
                        
                        var raster  = new RasterFunction();
                        raster.functionName = "Arithmetic";
                        var arguments2 = {};
                        arguments2.Raster = raster1;
                        arguments2.Raster2 =  raster2;
                        arguments2.Operation = 2;
                        arguments2.ExtentType = 0;
                        arguments2.CellsizeType = 0;
                        raster.functionArguments = arguments2;
                        raster.outputPixelType = "F32";
                        
                       
                       var raster3 = new RasterFunction();
                       raster3.functionName = "Stretch";
                       var args3={};
                       args3.Raster = raster;
                       args3.StretchType = 5;
                       args3.Min = 0;
                       args3.Max = 20;
                       args3.DRA = false;
                       args3.Gamma = false;
                       var min = parseInt(registry.byId("inputRanges").get("value")) * -1 ;
                       var max = parseInt(registry.byId("inputRanges").get("value"));
                       args3.Statistics = [[min,max,0,0]];
                       raster3.functionArguments = args3;
                       raster3.outputPixelType = 'U8';
                      this.stretchRange = registry.byId("inputRanges").get("value");
                        this.secondSceneDate = parseInt(registry.byId("currentDate").get("value"));
                        var raster4 = new RasterFunction();
                        raster4.functionName = "Colormap";
                         var args = {};
                            args.Raster = raster3;
                            if(locale.format(new Date(this.secondSceneDate), {selector: "date", datePattern: "yyyy/MM/dd"}) < locale.format(new Date(this.firstSceneDate), {selector: "date", datePattern: "yyyy/MM/dd"})){
                            args.Colormap = [[0,78,78,255],
                                [1,95,95,255],
                                [2,113,113,255],
                                [3,131,131,255],
                                [4,148,148,255],
                                [5,166,166,255],
                                [6,184,184,255],
                                [7, 201,201,255],
                                [8,219,219,255],
                                [9,237,237,255],
                                [10,255,255,255],
                                [11,255,236,236],
                                [12,255,218,218],
                                [13,255,200,200],
                                [14,255,181,181],
                                [15,255,163,163],
                                [16,255,145,145],
                                [17,255,126,126],
                                [18,255,108,108],
                                [19,255,90,90],
                                [20,255,72,72]];
                        }
                    else{
                     
                    args.Colormap = [[20,78,78,255],
                                [19,95,95,255],
                                [18,113,113,255],
                                [17,131,131,255],
                                [16,148,148,255],
                                [15,166,166,255],
                                [14,184,184,255],
                                [13, 201,201,255],
                                [12,219,219,255],
                                [11,237,237,255],
                                [10,255,255,255],
                                [9,255,236,236],
                                [8,255,218,218],
                                [7,255,200,200],
                                [6,255,181,181],
                                [5,255,163,163],
                                [4,255,145,145],
                                [3,255,126,126],
                                [2,255,108,108],
                                [1,255,90,90],
                                [0,255,72,72]];
                            }
                            raster4.functionArguments = args;
                        var params = new ImageServiceParameters();
                        params.renderingRule = raster4;
                       
                        this.changeDetectionLayer = new ArcGISImageServiceLayer(this.config.urlElevation,{
                        id: "resultLayer",
                        imageServiceParameters: params
                      });
                            if (this.map.getLayer("primaryLayer")) {
                                if(this.map.getLayer("primaryLayer").updating)
                                this.map.getLayer("primaryLayer").suspend();
                                this.map.removeLayer(this.map.getLayer("primaryLayer"));
                            }
                            if(this.map.getLayer("landsatLayer"))
                            this.map.addLayer(this.changeDetectionLayer, 2);
                        else
                            this.map.addLayer(this.changeDetectionLayer, 1);
                        
                        if(!layer.first)
                        {   this.savedSecondId = layer.mosaicRule.lockRasterIds[0];
                            this.savedFirstId = this.objectIdOfFirstScene;
                        }else{
                            this.savedSecondId = layer.first;
                            this.savedFirstId = layer.second;
                        }
                            domStyle.set("stretchValue","display","block");
                            html.set(this.errorHandler,"");
                         //   domStyle.set("statsBtn","display","block");
                            html.set(this.statsText,"Draw a polygon on change area to find the <br />amount of ice lost and gained.");
                            domStyle.set("stats","display","none");
                    }
                            domStyle.set("loadingChangeDetection","display","none");
                     
                },
                 getStats: function(geometry){
                   domStyle.set("loadingChangeDetection","display","block");
                    for(var k in this.map.graphics.graphics)
                    {
                        if(this.map.graphics.graphics[k].geometry.type==="polygon"){
                            if(this.map.graphics.graphics[k].symbol.color.r === 200)
                            {  this.map.graphics.remove(this.map.graphics.graphics[k]);
                    break;
                    }}
                }
               
                    var symbol = new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new Color([200, 0, 0]), 2);
                    var graphic = new esri.Graphic(geometry, symbol);
                    this.map.graphics.add(graphic);
                      var resultLayer = this.map.getLayer("resultLayer");
                  var renderingRule = resultLayer.renderingRule;
                 var pixelSizeX = (this.map.extent.xmax - this.map.extent.xmin)/this.map.width;
                 var pixelSizeY = (this.map.extent.ymax - this.map.extent.ymin)/this.map.height;
                 pixelSizeX = Math.max(pixelSizeX, this.changeDetectionLayer.pixelSizeX);
                 pixelSizeY = Math.max(pixelSizeY, this.changeDetectionLayer.pixelSizeY);
                    var renderer = {"rasterFunction":"Arithmetic","rasterFunctionArguments":{"Raster":{"rasterFunction":"ExtractBand","rasterFunctionArguments":{"BandIDs":[0],"Raster":renderingRule.functionArguments.Raster.functionArguments.Raster.functionArguments.Raster.functionArguments.Raster}},"Raster2":{"rasterFunction":"ExtractBand","rasterFunctionArguments":{"BandIDs":[0],"Raster":renderingRule.functionArguments.Raster.functionArguments.Raster.functionArguments.Raster2.functionArguments.Raster}},"Operation":2,"ExtentType":0,"CellsizeType":0}};
                    var layersRequest = esriRequest({
                        url: this.config.urlElevation + "/computeStatisticsHistograms",
                        content: {
                            geometry: JSON.stringify(geometry.toJson()),
                            geometryType: "esriGeometryPolygon",
                            renderingRule: JSON.stringify(renderer),
                            pixelSize: '{"x":'+pixelSizeX+',"y":'+pixelSizeY+'}',
                            f: "json"
                        },
                        handleAs: "json",
                        callbackParamName: "callback"
                    });
                    
                    layersRequest.then(lang.hitch(this,function(data){
                        var layersRequest1 = esriRequest({
                        url: this.config.urlElevation + "/Measure",
                        content: {
                            fromGeometry: JSON.stringify(geometry.toJson()),
                            geometryType: "esriGeometryPolygon",
                            measureOperation: "esriMensurationAreaAndPerimeter",
                            f: "json"
                        },
                        handleAs: "json",
                        callbackParamName: "callback"
                    });
                    
                    layersRequest1.then(lang.hitch(this, function(data1){
                     
                        var area = data1.area.value;
                        var averageHeight = data.statistics[0].mean;
                        var standardDeviation = data.statistics[0].standardDeviation;
                        var volume = area * averageHeight;
                     
                    if(this.firstSceneDate > this.secondSceneDate){
                       var volume1 = volume* -1;
                       averageHeight = averageHeight * -1;
                       var startDate = locale.format(new Date(this.secondSceneDate), {selector: "date",  formatLength: "long"});
                       var endDate = locale.format(new Date(this.firstSceneDate), {selector: "date",  formatLength: "long"});
                    }
                    else{
                        var volume1 = volume;
                        var startDate = locale.format(new Date(this.firstSceneDate), {selector: "date", formatLength: "long"});
                       var endDate = locale.format(new Date(this.secondSceneDate), {selector: "date", formatLength: "long"});
                    } html.set(this.fromToDate, "From: <b>"+startDate.toString() + "</b>&nbsp;&nbsp;&nbsp;To: <b>"+endDate.toString()+"</b><br /><table><tr><td>Area:</td><td><b>"+((area/1000000).toFixed(2)).toLocaleString()+ "</b> km2</td></tr><tr><td>Average Height Change:</td><td><b>"+((averageHeight).toFixed(3)).toString() + "</b> m</td></tr><tr><td>Volume Change: </td><td><b>"+((volume1).toExponential(2)).toString()+ "</b> m3</td></tr><tr><td>Standard Deviation Difference: </td><td><b>"+(standardDeviation.toFixed(3)).toString() + "</b> m</td></tr></table>");
                        domStyle.set("stats","display","block");
                     //   domStyle.set("statsBtn","display","none");
                        html.set(this.statsText,"");
                        domStyle.set("stretchValue","display","block");
                        html.set(this.errorHandler,"");
                          
                        if(!(registry.byId("changeDetectionDialog")).open){
                        registry.byId("changeDetectionDialog").show(); domStyle.set("changeDetectionDialog","left","160px");
                        domStyle.set("changeDetectionDialog","top","75px");}
                domStyle.set("loadingChangeDetection","display","none");
                    }), lang.hitch(this, function(error){
                domStyle.set("loadingChangeDetection","display","none");
                }));
                    }),lang.hitch(this, function(error){
                domStyle.set("loadingChangeDetection","display","none");
                }));
                },
               
                showLoading: function () {
                    domStyle.set("loadingChangeDetection", "display", "block");
                },
                hideLoading: function () {
                    domStyle.set("loadingChangeDetection", "display", "none");
                }
            });
            clazz.hasLocale = false;
            clazz.hasSettingPage = false;
            clazz.hasSettingUIFile = false;
            clazz.hasSettingLocale = false;
            clazz.hasSettingStyle = false;
            return clazz;
        });
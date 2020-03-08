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
    "dojo/Evented",
    "dojo/on",
    "dijit/registry",
    "dojo/_base/lang",
    "dojo/html",
    "dojo/dom","jimu/PanelManager",
    "esri/layers/MosaicRule",
    "esri/tasks/query",
    "esri/tasks/QueryTask",
    "esri/geometry/Extent",
    "dojo/date/locale", "dijit/Tooltip",
   
    "dojo/dom-construct",
    "dijit/form/HorizontalSlider",
    "dijit/form/HorizontalRule",
    "dijit/form/HorizontalRuleLabels",

  "esri/dijit/LayerSwipe","jimu/WidgetManager",
 
    "dojo/dom-style", "esri/layers/ArcGISImageServiceLayer",
 "esri/layers/RasterFunction",
    "esri/layers/ImageServiceParameters",
     "esri/arcgis/Portal", "dojo/dom-attr","dojo/i18n!esri/nls/jsapi",
    "esri/request","esri/dijit/ColorPicker", "esri/geometry/Polygon", "esri/SpatialReference","esri/layers/RasterLayer",
    "dojo/_base/connect", 'dojo/dom-class',
     "dijit/Dialog",
    "dijit/form/Select",
    "dijit/form/Button",
    "dijit/form/CheckBox",
    "dijit/form/TextBox",

],
        function(
                declare,
                Evented,
                on,
                registry,
                lang,
                html,
                dom,PanelManager,
                MosaicRule,
                Query, QueryTask, Extent, locale,tooltip,  domConstruct, HorizontalSlider, HorizontalRule, HorizontalRuleLabels,  LayerSwipe, WidgetManager,  domStyle, ArcGISImageServiceLayer, RasterFunction, ImageServiceParameters, arcgisPortal, domAttr, bundle,  esriRequest,ColorPicker,Polygon, SpatialReference, RasterLayer, connect, domClass) {
                    return declare("resourceLoad", [Evented], {
    constructor: function(parameters) {
      var defaults = {
        resource: ""
      };
      lang.mixin(this, defaults, parameters);
    },
           
                load: function(widget) {
                    switch(widget) {
                        case  "layer": {
                        
                     var array =[on,
                lang,
                domClass,
                RasterFunction,
                ArcGISImageServiceLayer,
                ImageServiceParameters,
                tooltip, locale,
                domConstruct,
                dom, html, domStyle, connect, esriRequest, arcgisPortal,
                Extent,bundle, registry,
                 PanelManager, 
                  domAttr,WidgetManager];
              break;
                }
                case "time":{
                        
                    var array = [on,
                registry,
                lang,
                html,
                dom,
                MosaicRule,
                Query, QueryTask, Extent, locale,  domConstruct, HorizontalSlider, HorizontalRule, HorizontalRuleLabels,  domStyle, ArcGISImageServiceLayer, ImageServiceParameters,  esriRequest, connect, domClass,  PanelManager];
                    break;
                }
                case "compare":{
                    var array = [
                registry,
                lang,
                dom,on,
                domConstruct,
                LayerSwipe, WidgetManager,domClass,domStyle];
            break;
                }
                case "mask":{
                    var array = [on,
                lang,
                domClass,
                RasterFunction,ColorPicker,
               ImageServiceParameters,
               domConstruct,
                dom,html,domStyle, connect, Query,QueryTask,esriRequest,Polygon, SpatialReference,registry,RasterLayer, PanelManager];
                break;}
                case "change":{
                        
                        var array= [on,
                lang,
                domClass,
                RasterFunction,
                ArcGISImageServiceLayer,
                ImageServiceParameters,
                tooltip, locale,
                domConstruct,
                dom, html, domStyle, connect,  SpatialReference,HorizontalRule, HorizontalRuleLabels,  esriRequest, popup, Query, QueryTask, Draw, Polygon, Chart, theme, Magnify, registry, Color, RasterLayer, PanelManager];
                break;
            }
            case "story" :{
                    var array = [on,
                lang,
                domClass,
                RasterFunction,
                ArcGISImageServiceLayer,
                ImageServiceParameters,
                 locale,
                domConstruct,
                dom, html, domStyle,WidgetManager, MosaicRule, esriRequest, HorizontalSlider,arcgisPortal,  Query, QueryTask, Extent, registry,popup, RasterLayer, PanelManager,bundle];
            break;
            }
            case "identify": {
                    var array = [registry,
                lang,
                dom,
                domConstruct,
                domStyle, esriRequest, Chart, Tooltip, theme, SelectableLegend, Magnify, locale, html, on, popup, RasterFunction, ImageServiceParameters, RasterLayer, connect, SimpleMarkerSymbol, SimpleLineSymbol, Color, domClass, PanelManager, tooltip, Query, QueryTask, Draw, Polygon, SpatialReference];
              break; 
                                                    }
                   
                    
                }
                    return array;
                }
               
               
                      
               
               
            
            });

           
        });
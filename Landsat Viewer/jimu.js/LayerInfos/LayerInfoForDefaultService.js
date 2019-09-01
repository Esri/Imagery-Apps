///////////////////////////////////////////////////////////////////////////
// Copyright © 2014 Esri. All Rights Reserved.
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
  'dojo/_base/array',
  'dojo/_base/lang',
  'dojo/Deferred',
  'dojo/dom-construct',
  'dojo/dom-attr',
  'dojo/query',
  './LayerInfoForDefault',
  'esri/layers/FeatureLayer'
], function(declare, array, lang, Deferred, domConstruct, domAttr, query,
LayerInfoForDefault, FeatureLayer) {
  return declare(LayerInfoForDefault, {
    _legendsNode: null,
    // getDeniedItems: function() {
    //   var defRet = new Deferred();
    //   var dynamicDeniedItems = this.inherited(arguments);
    //   var tableIndex = dynamicDeniedItems
    //   .indexOf(this.nls.itemToAttributeTable/*'Open attribute table'*/);
    //   if (tableIndex !== -1) {
    //     dynamicDeniedItems.splice(tableIndex, 1);
    //   }
    //   defRet.resolve(dynamicDeniedItems);
    //   return defRet;
    // },

    // _onTableItemClick: function(evt) {
    //   if (this.layerObject.empty) {
    //     this.layerObject = new FeatureLayer(this.layerObject.url);
    //     this.layerObject.on('load', lang.hitch(this, function(){
    //       this.initLegendsNode(this.legendsNode);
    //       evt.layerListWidget.publishData({
    //         'target': 'AttributeTable',
    //         'layer': this.layerObject
    //       });
    //     }));
    //   } else {
    //     evt.layerListWidget.publishData({
    //       'target': 'AttributeTable',
    //       'layer': this.layerObject
    //     });
    //   }
    // },


    _loadLegends: function(portalUrl) {
      var defRet = new Deferred();
      var mapService = this.originOperLayer.mapService;
      mapService.layerInfo.getLegendInfo(portalUrl).then(lang.hitch(this, function(legendInfo) {
        defRet.resolve(legendInfo);
      }));
      return defRet;
    },

    drawLegends: function(legendsNode, portalUrl) {
      this._loadLegends(portalUrl).then(lang.hitch(this, function(legendInfo) {
        this.initLegendsNode(legendInfo, legendsNode);
      }));
    },

    initLegendsNode: function(legendInfo, legendsNode) {
      var mapService = this.originOperLayer.mapService;
      //var loadingImg = query(".legends-loading-img", legendsNode)[0];
      if (legendInfo/*&& loadingImg*/) {
        domConstruct.empty(legendsNode);
        //draw legend
        var legendLayer = null;
        for(var i = 0; i < legendInfo.length; i++) {
          if ( legendInfo[i].layerId === mapService.subId) {
            legendLayer = legendInfo[i];
            break;
          }
        }
        if (!legendLayer) {
          return;
        }
        array.forEach(legendLayer.legend, function(legend) {
          if (legend.label === "<all other values>") {
            return;
          }
          var legendDiv = domConstruct.create("div", {
            "class": "legend-div"
          }, legendsNode);

          var symbolDiv = domConstruct.create("div", {
            "class": "legend-symbol jimu-float-leading",
            "style": "width:50px;height:50px;position:relative"
          }, legendDiv);

          var imgSrc = null;
          if (legend.imageData) {
            imgSrc = "data:" + legend.contentType + ";base64," + legend.imageData;
          } else {
            imgSrc = legend.url;
          }
          domConstruct.create("img", {
            "class": "legend-symbol-image",
            "style": "overflow:auto;margin:auto;position:absolute;top:0;left:0;bottom:0;right:0",
            "src": imgSrc
          }, symbolDiv);

          domConstruct.create("div", {
            "class": "legend-label jimu-float-leading",
            "innerHTML": legend.label || " "
          }, legendDiv);
        }, this);
      }
    },



    //--------------public interface---------------------------
    getLayerObject: function() {
      var def = new Deferred();
      if(this.layerObject.empty) {
        this.layerObject = new FeatureLayer(this.layerObject.url);
        this.layerObject.on('load', lang.hitch(this, function() {
          def.resolve(this.layerObject);
        }));
        this.layerObject.on('error', lang.hitch(this, function(/*err*/) {
          //def.reject(err);
          def.resolve(null);
        }));
      } else {
        def.resolve(this.layerObject);
      }
      return def;
    },

    getPopupInfo: function() {
      var popupInfo = null;
      var layers = this.originOperLayer.mapService.layerInfo.originOperLayer.layers;
      if(layers) {
        for(var i = 0; i < layers.length; i++) {
          if(layers[i].id === this.originOperLayer.mapService.subId) {
            popupInfo = layers[i].popupInfo;
            break;
          }
        }
      }
      return popupInfo;
    },

    getLayerType: function() {
      var def = new Deferred();
      var mapService = this.originOperLayer.mapService;
      mapService.layerInfo._getSublayerIdent(mapService.subId)
      .then(lang.hitch(this, function(layerIdent) {
        if (layerIdent) {
          def.resolve(layerIdent.type.replace(/\ /g, ''));
        } else {
          def.resolve(null);
        }
      }), function() {
        def.resolve(null);
      });

      return def;
    },

    // summary:
    //    is support table.
    // description:
    //    return value:{
    //      isSupportedLayer: true/false,
    //      isSupportQuery: true/false,
    //      layerType: layerType
    //    }
    getSupportTableInfo: function() {
      var def = new Deferred();
      var resultValue = {
        isSupportedLayer: false,
        isSupportQuery: false,
        layerType: null
      };
      this.getLayerType().then(lang.hitch(this, function(layerType){
        resultValue.layerType = layerType;
        if (this._getLayerTypesOfSupportTable().indexOf(layerType) >= 0) {
          resultValue.isSupportedLayer = true;
        }
        var mapService = this.originOperLayer.mapService;
        mapService.layerInfo._getSublayerIdent(mapService.subId)
        .then(lang.hitch(this, function(layerIdent){
          if(layerIdent && layerIdent.capabilities.indexOf("Data") >= 0) {
            resultValue.isSupportQuery = true;
          }
          def.resolve(resultValue);
        }), function(){
          def.resolve(resultValue);
        });
      }), function() {
        def.resolve(resultValue);
      });
      return def;
    }

  });
});

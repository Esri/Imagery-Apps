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
  'esri/graphicsUtils',
  'dojo/aspect',
  'dojo/dom-style',
  'dojo/dom-class',
  'dojo/dom-attr',
  //'./NlsStrings',
  'dojo/dom-construct',
  'dojo/topic',
  'esri/layers/FeatureLayer',
  'esri/config',
  'esri/tasks/ProjectParameters',
  'esri/SpatialReference',
  'esri/geometry/webMercatorUtils'
], function(declare, array, lang, Deferred, graphicsUtils, aspect, domStyle, domClass, domAttr,
/*NlsStrings,*/ domConstruct, topic, FeatureLayer, esriConfig, ProjectParameters,
SpatialReference, webMercatorUtils) {
  return declare(null, {
    originOperLayer: null,
    layerObject:     null,
    map:             null,
    title:           null,
    id:              null,
    newSubLayers:    null,
    parentLayerInfo: null,

    constructor: function(operLayer, map) {
      this.originOperLayer = operLayer;
      this.layerObject = operLayer.layerObject;
      this.map = map;
      this.title = this.originOperLayer.title;
      this.id = this.originOperLayer.id;
      this.parentLayerInfo = operLayer.parentLayerInfo ? operLayer.parentLayerInfo : null;
      this.nls = window.jimuNls.layerInfosMenu;

      this.popupMenuInfo = {
        //descriptionTitle: NlsStrings.value.itemDesc,
        menuItems: [{
          key: 'zoomto',
          label: this.nls.itemZoomTo
        },{
          key: 'transparency',
          label: this.nls.itemTransparency
        },{
          key: null,
          label: ''
        },{
          key: 'moveup',
          label: this.nls.itemMoveUp
        },{
          key: 'movedown',
          label: this.nls.itemMoveDown
        },{
          key: null,
          label: ''
        },{
          key: 'description',
          label: '<a class="menu-item-description" target="_blank" href=' +
                  ((this.layerObject && this.layerObject.url) ? this.layerObject.url : '') + '>' +
                  this.nls.itemDesc + '</a>'
        }],
        deniedItems: []
      };

      // if (this.layerObject && this.layerObject.url) {
      //   this.popupMenuInfo.menuItems.push({
      //     key: null,
      //     label: ''
      //   });
      //   this.popupMenuInfo.menuItems.push({
      //     key: 'description',
      //     label: '<a class="menu-item-description" target="_blank" href=' +
      //       this.layerObject.url +'>' + this.nls.itemDesc + '</a>'
      //   });
      // }
    },

    init: function() {
      //new section
      this.newSubLayers = this.obtainNewSubLayers();
      this.initVisible();
      if (this.originOperLayer.popupInfo) {
        this.popupVisible = true;
      }
    },

    // to decide layer display in whitch group, now only has two groups: graphic or nographic
    isGraphicLayer: function() {
      var layerIndexesInMap = this._obtainLayerIndexesInMap();
      // to decide layer display in whitch group, now only has two groups: graphic or nographic
      return layerIndexesInMap.length ? layerIndexesInMap[0].isGraphicLayer : false;
    },

    obtainLayerIndexesInMap: function() {
      return this._obtainLayerIndexesInMap();
    },

    getExtent: function() {
      // implemented by sub class.
    },

    // about transparency
    getOpacity: function() {
      var i, opacity = 0;
      for (i = 0; i < this.newSubLayers.length; i++) {
        if (this.newSubLayers[i].layerObject.opacity) {
          opacity = this.newSubLayers[i].layerObject.opacity > opacity ?
                    this.newSubLayers[i].layerObject.opacity :
                    opacity;
        } else {
          return 1;
        }
      }
      return opacity;
    },

    setOpacity: function(opacity) {
      array.forEach(this.newSubLayers, function(subLayer) {
        if (subLayer.layerObject.setOpacity) {
          subLayer.layerObject.setOpacity(opacity);
        }
      });
    },

    // about change layer order.
    moveLeftOfIndex: function(index) {
      this.map.reorderLayer(this.layerObject, index);
    },

    // *************** need to refactor.
    moveRightOfIndex: function(index) {
      this.map.reorderLayer(this.layerObject, index);
    },
    
    traversal: function(callback) {
      // callback(this);
      // array.forEach(this.getSubLayers(), lang.hitch(this, function(subLayerInfo) {
      //   subLayerInfo.traversal(callback);
      // }));
      if(callback(this)) {
        return true;
      }
      var subLayerInfos = this.getSubLayers();
      for(var i = 0; i < subLayerInfos.length; i++) {
        if (subLayerInfos[i].traversal(callback)) {
          return true;
        }
      }
    },

    findLayerInfoById: function(id) {
      // summary:
      //    recursion find LayerInof in subLayerInfos.
      // description:
      //    return null if does not find.
      var layerInfo = null;
      var i = 0;
      if (this.id && this.id === id) {
        return this;
      } else {
        for(i = 0; i < this.newSubLayers.length; i++) {
          layerInfo = this.newSubLayers[i].findLayerInfoById(id);
          if (layerInfo) {
            break;
          }
        }
        return layerInfo;
      }
    },

    setTopLayerVisible: function(visible) {
      var oldIsShowInMap = this.isShowInMap();
      this._setTopLayerVisible(visible);
      this._isShowInMapChanged(oldIsShowInMap);
    },

    _setTopLayerVisible: function(visible) {
      /*jshint unused: false*/
      // implemented by sub class.
    },

    setSubLayerVisible: function(subLayerId, visible) {
      /*jshint unused: false*/
      // implemented by sub class.
    },

    setLayerVisiblefromTopLayer: function() {
      // implemented by sub class.
    },

    initVisible: function() {
      // implemented by sub class.
    },

    // about layer visible.
    isVisible: function() {
      return this._visible;
    },

    //about layer indexes
    //indexes:[{
    //  isGraphicLayer:
    //  index:
    //},{}]
    //
    _obtainLayerIndexesInMap: function() {
      var indexes = [];
      var index;
      index = this._getLayerIndexesInMapByLayerId(this.id);
      if (index) {
        indexes.push(index);
      }
      return indexes;
    },

    _getLayerIndexesInMapByLayerId: function(id) {
      var i;
      for (i = 0; i < this.map.graphicsLayerIds.length; i++) {
        if (this.map.graphicsLayerIds[i] === id) {
          return {
            isGraphicLayer: true,
            index: i
          };
        }
      }

      for (i = 0; i < this.map.layerIds.length; i++) {
        if (this.map.layerIds[i] === id) {
          return {
            isGraphicLayer: false,
            index: i
          };
        }
      }
      return null;
    },

    _convertGeometryToMapSpatialRef: function(geometry) {
      /*
      if (this.map.spatialReference.isWebMercator()) {
        if (!geometry.spatialReference.isWebMercator()) {
          return webMercatorUtils.geographicToWebMercator(geometry);
        }
      } else {
        if (geometry.spatialReference.isWebMercator()) {
          return webMercatorUtils.webMercatorToGeographic(geometry);
        }
      }
      return geometry;
      */
      var def = new Deferred();
      if (this.map.spatialReference.equals(geometry.spatialReference)) {
        def.resolve([geometry]);
        return def;
      }
      if (this.map.spatialReference.isWebMercator() &&
          geometry.spatialReference.equals(new SpatialReference(4326))) {
        def.resolve([webMercatorUtils.geographicToWebMercator(geometry)]);
        return def;
      }
      if (this.map.spatialReference.equals(new SpatialReference(4326)) &&
          geometry.spatialReference.isWebMercator()) {
        def.resolve([webMercatorUtils.webMercatorToGeographic(geometry)]);
        return def;
      }
      var params = new ProjectParameters();
      params.geometries = [geometry];
      params.outSR = this.map.spatialReference;
      return esriConfig.defaults.geometryService.project(params);
    },

    /*
    _onSubLayerVisibleChange: function(subLayerInfo, visibleFlage, visible) {
      if(this.responseVisibleChangeFlag) {
        subLayerInfo.visible = visible;
        if(visible && this.originOperLayer.featureCollection) {
          this._visible = visible;
        }
      } 
      this.responseVisibleChage = true;
    },*/


    _isShowInMapChanged: function(oldIsShowInMap) {
      if (oldIsShowInMap === this.isShowInMap()) {
        return;
      }
      var changedLayerInfos = [];
      this.traversal(function(layerInfo) {
        changedLayerInfos.push(layerInfo);
      });
      topic.publish('layerInfos/layerInfo/isShowInMapChanged', changedLayerInfos);
    },

    // new section--------------------------------------------------------------------

    obtainNewSubLayers: function( /*operLayer*/ ) {
      //implemented by sub class.
      var newSubLayers = [];
      return newSubLayers;
    },

    createLegendsNode: function() {
      var legendsNode = domConstruct.create("div", {
        "class": "legends-div"
      });
      return legendsNode;
    },

    drawLegends: function(legendsNode, portalUrl) {
      /*jshint unused: false*/
      // implemented by sub class.
    },

    // loadLegends: function(portalUrl) {
    //   /*jshint unused: false*/
    //   // implemented by sub class.
    //   var retDef = new Deferred();
    //   retDef.resolve();
    //   return retDef;
    // },

    initLegendsNode: function(legendsNode) {
      /*jshint unused: false*/
      // implemented by sub class.
    },

    getDeniedItems: function() {
      var defRet = new Deferred();
      var dynamicDeniedItems = [];
      if (this.isFirst) {
        dynamicDeniedItems.push('moveup'/*this.nls.itemMoveUp'Move up'*/);
      } else if (this.isLast) {
        dynamicDeniedItems.push('movedown'/*this.nls.itemMoveDown'Move down'*/);
      }


      if(!this.layerObject || !this.layerObject.url) {
        dynamicDeniedItems.push('description'/*this.nls.itemDesc'Description'*/);
        dynamicDeniedItems.push('download'/*this.nls.itemDownload'Download'*/);
      }

      // this.getLayerType().then(lang.hitch(this, function(layerType){
      //   if (layerType !== "FeatureLayer") {
      //    dynamicDeniedItems.push('table'/*this.nls.itemToAttributeTable'Open attribute table'*/);
      //   }
      //   defRet.resolve(this.popupMenuInfo.deniedItems.concat(dynamicDeniedItems));
      // }), function() {
      //   defRet.resolve(this.popupMenuInfo.deniedItems.concat(dynamicDeniedItems));
      // });
      this.getSupportTableInfo().then(lang.hitch(this, function(result){
        if (!(result.isSupportedLayer && result.isSupportQuery)) {
          dynamicDeniedItems.push('table'/*this.nls.itemToAttributeTable'Open attribute table'*/);
        }
        defRet.resolve(this.popupMenuInfo.deniedItems.concat(dynamicDeniedItems));
      }), function() {
        defRet.resolve(this.popupMenuInfo.deniedItems.concat(dynamicDeniedItems));
      });

      return defRet;
    },

    onPopupMenuClick: function(evt) {
      var result = {
        closeMenu: true
      };
      switch (evt.itemKey) {
      case 'zoomto'/*this.nls.itemZoomTo'Zoom to'*/:
        this._onItemZoomToClick(evt);
        break;
      case 'moveup'/*this.nls.itemMoveUp'Move up'*/:
        this._onMoveUpItemClick(evt);
        break;
      case 'movedown'/*this.nls.itemMoveDown'Move down'*/:
        this._onMoveDownItemClick(evt);
        break;
      case 'table'/*this.nls.itemToAttributeTable'Open attribute table'*/:
        this._onTableItemClick(evt);
        break;
      // case 'description':
      // case 'download':
      //   this._onUrlItemClick(evt);
      //   break;
      case 'transparencyChanged':
        this._onTransparencyChanged(evt);
        result.closeMenu = false;
        break;

      }
      return result;
    },

    // about popupMenu item click response
    _onItemZoomToClick: function(evt) {
      /*jshint unused: false*/
      //this.map.setExtent(this.getExtent());
      this.getExtent().then(lang.hitch(this, function(geometries) {
        this.map.setExtent(geometries[0]);
      }));
    },

    _onTransparencyItemClick: function(evt) {
      /*jshint unused: false*/
    },

    _onMoveUpItemClick: function(evt) {
      if (!this.isFirst) {
        evt.layerListView.moveUpLayer(this.id);
      }
    },

    _onMoveDownItemClick: function(evt) {
      if (!this.isLast) {
        evt.layerListView.moveDownLayer(this.id);
      }
    },

    _onTableItemClick: function(evt) {
      // old version, send layerObject.
      // if (this.layerObject.declaredClass === 'esri.layers.FeatureLayer') {
      //   evt.layerListWidget.publishData({
      //     'target': 'AttributeTable',
      //     'layer': this.layerObject
      //   });
      // }

      // new version, send layerInfo object.
      this.getLayerType().then(lang.hitch(this, function(layerType){
        if (this._getLayerTypesOfSupportTable().indexOf(layerType) >= 0) {
          evt.layerListWidget.publishData({
            'target': 'AttributeTable',
            'layer': this
          });
        }
      }));
    },

    _onUrlItemClick: function(evt) {
      /*jshint unused: false*/
      var a;
      if (this.layerObject && this.layerObject.url) {
        a = domConstruct.create('a', {
          'href': this.layerObject.url,
          'target': '_blank'
        });
        a.click();
      }
    },

    _onTransparencyChanged: function(evt) {
      this.setOpacity(1 - evt.data.newTransValue);
    },

    _getLayerTypesOfSupportTable: function() {
      var layerTypesOfSupportTable = "FeatureLayer,CSVLayer";
      return layerTypesOfSupportTable;
    },

    // return itemId if the layer is added from an item of Portal.
    _isItemLayer: function() {
      return this.originOperLayer.itemId;
    },

    //--------------public interface---------------------------
    getLayerObject: function() {
      var def = new Deferred();
      if (this.layerObject) {
        def.resolve(this.layerObject);
      } else {
        def.reject("layerObject is null");
      }
      return def;
    },

    getSubLayers: function() {
      return this.newSubLayers;
    },

    isLeaf: function() {
      if(this.getSubLayers().length === 0) {
        return true;
      } else {
        return false;
      }
    },

    isShowInMap: function() {
      var isShow = true;
      var currentLayerInfo = this;
      while(currentLayerInfo) {
        isShow = isShow && currentLayerInfo.isVisible();
        currentLayerInfo = currentLayerInfo.parentLayerInfo;
      }
      return isShow;
    },

    getLayerType: function() {
      var layerTypeArray = [null], def = new Deferred();
      if (this.layerObject.declaredClass) {
        layerTypeArray = this.layerObject.declaredClass.split(".");
      }
      def.resolve(layerTypeArray[layerTypeArray.length - 1]);
      return def;
    },

    getPopupInfo: function() {
      return this.originOperLayer.popupInfo;
    },

    getUrl: function() {
      return this.originOperLayer.url;
    },

    // search types on all sublayers by recursion
    // be used to layerInfoDijit.
    hasLayerTypes: function(types) {
      /*jshint unused: false*/
    },

    // summary:
    //    get support table info.
    // description:
    //    return value:{
    //      isSupportedLayer: true/false,
    //      isSupportQuery: true/false,
    //      layerType: layerType.
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
        if (this.layerObject.capabilities && this.layerObject.capabilities.indexOf("Query") >= 0) {
          resultValue.isSupportQuery = true;
        }
        def.resolve(resultValue);
      }), function() {
        def.resolve(resultValue);
      });
      return def;
    }

  });
});

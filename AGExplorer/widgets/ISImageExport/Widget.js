define([
  'dojo/_base/declare', "dojo/Evented", 'jimu/BaseWidget',
  'dijit/_WidgetsInTemplateMixin',
  'dojo/text!./Widget.html',
  "dojo/html", "dojo/dom-class", "esri/IdentityManager",
  "dijit/registry", "dojo/dom",
  "dojo/_base/lang",
  "dojo/dom-style", "esri/geometry/webMercatorUtils",
  "esri/SpatialReference", "esri/tasks/GeometryService", "esri/tasks/ProjectParameters", "dojo/Deferred", "esri/geometry/Extent", "esri/geometry/Polygon",
  "esri/request", "dojo/i18n!esri/nls/jsapi",
  'dojo/dom-construct', "esri/arcgis/Portal", "esri/Color", "esri/toolbars/draw", "dojo/dom-attr", "esri/layers/RasterFunction", "dijit/form/SimpleTextarea", "dijit/form/TextBox",
  "dijit/form/CheckBox", "dijit/form/Select", "dijit/form/Button", "dijit/form/RadioButton", "dijit/form/NumberTextBox", "dojo/domReady!"
],
  function (
    declare, Evented, BaseWidget, _WidgetsInTemplateMixin, template,
    html, domClass, IdentityManager,
    registry, dom,
    lang, domStyle, webMercatorUtils, SpatialReference, GeometryService, ProjectParameters, Deferred, Extent, Polygon, esriRequest, bundle, domConstruct, arcgisPortal, Color, Draw,
    domAttr, RasterFunction) {
    //To create a widget, you need to derive from BaseWidget.
    return declare([BaseWidget, _WidgetsInTemplateMixin], {
      // Custom widget code goes here

      baseClass: 'jimu-widget-ISImageExport',
      templateString: template,
      portalUrl: "www.arcgis.com",

      //this property is set by the framework when widget is loaded.
      //name: 'CustomWidget',


      //methods to communication with app container:

      postCreate: function () {
        window.addEventListener("resize", lang.hitch(this, this.resizeExportWidget));
        this.inherited(arguments);
        console.log('postCreate');

        registry.byId("saveAndExportOption").on("change", lang.hitch(this, function (value) {
          if (value === "agol") {
            domStyle.set("saveAgolContainer", "display", "block");
            domStyle.set("exportSaveContainer", "display", "none");
          } else {
            domStyle.set("saveAgolContainer", "display", "none");
            domStyle.set("exportSaveContainer", "display", "block");
          }
          window.addEventListener("resize", lang.hitch(this, this.resizeContainer));
          this.hideLoadingExport();
        }));
        registry.byId("submitAgolBtn").on("click", lang.hitch(this, function () {
          if (registry.byId("itemTitle").get("value") && registry.byId("itemTags").get("value")) {
            this.saveLayerToArcGIS();
          }
          else if (!registry.byId("itemTitle").get("value")) {
            html.set(document.getElementById("successNotification"), this.nls.error1);
          }
          else if (!registry.byId("itemTags").get("value")) {
            html.set(document.getElementById("successNotification"), this.nls.error2);
          }
        }));
        registry.byId("exportBtn").on("click", lang.hitch(this, this.exportLayer));
        registry.byId("defineExtent").on("change", lang.hitch(this, this.activatePolygon));

        // document.getElementById("saveAgolBtn").addEventListener("click", lang.hitch(this, this.addItemRequest));
        // document.getElementById("cancelAgolBtn").addEventListener("click", lang.hitch(this, function () {
        //   domStyle.set("previewContainer", "display", "none");
        //   document.getElementsByClassName("h3Title")[0].innerHTML = document.getElementsByClassName("h3Title")[0].title = "";
        // }));
        if (this.map) {
          this.map.on("update-start", lang.hitch(this, this.showLoadingExport));
          this.map.on("update-end", lang.hitch(this, this.hideLoadingExport));
        }
        if (this.exportMode !== "agol") {
          this.toolbarForExport = new Draw(this.map);
          dojo.connect(this.toolbarForExport, "onDrawComplete", lang.hitch(this, this.getExtent));
        }
        // document.getElementById("advanceSaveBtn").addEventListener("click", lang.hitch(this, this.expandMenu));

        this.geometryService = new GeometryService("https://utility.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer");
        registry.byId("exportLayer").on("change", lang.hitch(this, function(value) {
          if (value === "defaulti") {
            if (registry.byId("Explore Imagery") || registry.byId("Compare Imagery")) {
              this.imageServiceLayer = registry.byId("Explore Imagery") ? this.map.getLayer(registry.byId('layerSelectorView').value) : this.map.getLayer(registry.byId('leftLayerSelector').value);
            }
            else if (this.map.primaryLayer) {
              this.imageServiceLayer = this.map.primaryLayer;
              domStyle.set("errorPixelSize", "display", "none");
            } else {
              domStyle.set("errorPixelSize", "display", "block");
              dom.byId("errorPixelSize").innerHTML = "No Default Image is present on map";
              this.imageServiceLayer = null;
            }
          } else if (value === "comparei") {
            if (registry.byId("Compare Imagery")) {
              this.imageServiceLayer = this.map.getLayer(registry.byId('rightLayerSelector').value + '_Right');
            }
            else if (this.map.secondaryLayer) {
              this.imageServiceLayer = this.map.secondaryLayer;
              domStyle.set("errorPixelSize", "display", "none");           
            } else {
              domStyle.set("errorPixelSize", "display", "block");
              dom.byId("errorPixelSize").innerHTML = "No Comparison Image is present on map";
              this.imageServiceLayer = null;
            }
          } else if (value === "resulti") {
            if (this.map.getLayer("resultLayer")) {
              this.imageServiceLayer = this.map.getLayer("resultLayer")
              domStyle.set("errorPixelSize", "display", "none");
            } else {
              domStyle.set("errorPixelSize", "display", "block");
              dom.byId("errorPixelSize").innerHTML = "No Mask/Change Layer is present on map";
              this.imageServiceLayer = null;
            }
          } else {
            this.imageServiceLayer = null;
            domStyle.set("errorPixelSize", "display", "block");
            //dom.byId("errorPixelSize").innerHTML = "Please choose a layer to export";
          }
          
          this.refreshData();
          
        }));

      },

      startup: function () {
        IdentityManager.useSignInPage = false;
        this.inherited(arguments);
        if (this.config.exportMode === "both") {
          domStyle.set("selectExportDisplay", "display", "block");
        } else {
          domStyle.set("selectExportDisplay", "display", "none");
          if (this.config.exportMode === "agol") {
            domStyle.set("saveAgolContainer", "display", "block");
            domStyle.set("exportSaveContainer", "display", "none");
          } else if (this.config.exportMode === "disk") {
            domStyle.set("exportSaveContainer", "display", "block");
            domStyle.set("saveAgolContainer", "display", "none");
          }
        }
        domConstruct.place('<img id="loadingExport" style="display: none;position: absolute;top:0;bottom: 0;left: 0;right: 0;margin:auto;z-index:100;" src="widgets/ISImageExport/images/loading.gif">', document.getElementById("exportTemplate"));

        document.getElementById("saveAgolBtn").addEventListener("click", lang.hitch(this, this.addItemRequest));
        document.getElementById("cancelAgolBtn").addEventListener("click", lang.hitch(this, function () {
          domStyle.set("previewContainer", "display", "none");
          document.getElementsByClassName("h3Title")[0].innerHTML = document.getElementsByClassName("h3Title")[0].title = "";
        }));
        document.getElementById("advanceSaveBtn").addEventListener("click", lang.hitch(this, this.expandMenu));
        this.resizeContainer();
        this.refreshData();
        this.resizeExportWidget();
      },

      resizeExportWidget: function () {
        if (window.innerWidth < 620) {
          domStyle.set("widgets_ISImageExport_Widget_155", "font-size", "7px");



        } else if (window.innerWidth < 850) {
          domStyle.set("widgets_ISImageExport_Widget_155", "font-size", "8px");




        } else {
          domStyle.set("widgets_ISImageExport_Widget_155", "font-size", "12px");


        }
      },


      expandMenu: function () {
        var node = document.getElementById("advanceSaveBtn").children[1];
        if (domClass.contains(node, "launchpad-icon-arrow-right")) {
          domClass.remove(node, "launchpad-icon-arrow-right");
          domClass.add(node, "launchpad-icon-arrow-down");
          domStyle.set("advanceSaveContainer", "display", "block");
        } else {
          domStyle.set("advanceSaveContainer", "display", "none");
          domClass.remove(node, "launchpad-icon-arrow-down");
          domClass.add(node, "launchpad-icon-arrow-right");
        }
      },

      resizeContainer: function () {
        if (window.innerWidth > 1200) {
          document.getElementById("itemTitle").style.width = "200px";
          document.getElementById("itemTags").style.width = "200px";
          document.getElementById("itemDescription").style.width = "200px";
          document.getElementById("itemDescription").style.height = "80px";
          document.getElementById("itemTitle").style.height = "40px";
          document.getElementById("itemTags").style.height = "40px";
        } else if (window.innerWidth > 1000) {
          document.getElementById("itemTitle").style.width = "180px";
          document.getElementById("itemTags").style.width = "180px";
          document.getElementById("itemDescription").style.width = "180px";
          document.getElementById("itemDescription").style.height = "70px";
          document.getElementById("itemTitle").style.height = "36px";
          document.getElementById("itemTags").style.height = "36px";
        } else if (window.innerWidth > 800) {
          document.getElementById("itemTitle").style.width = "160px";
          document.getElementById("itemTags").style.width = "160px";
          document.getElementById("itemDescription").style.width = "160px";
          document.getElementById("itemDescription").style.height = "60px";
          document.getElementById("itemTitle").style.height = "32px";
          document.getElementById("itemTags").style.height = "32px";
        } else if (window.innerWidth > 600) {
          document.getElementById("itemTitle").style.width = "140px";
          document.getElementById("itemTags").style.width = "140px";
          document.getElementById("itemDescription").style.width = "140px";
          document.getElementById("itemDescription").style.height = "50px";
          document.getElementById("itemTitle").style.height = "28px";
          document.getElementById("itemTags").style.height = "28px";
        } else {
          document.getElementById("itemTitle").style.width = "120px";
          document.getElementById("itemTags").style.width = "120px";
          document.getElementById("itemDescription").style.width = "120px";
          document.getElementById("itemDescription").style.height = "40px";
          document.getElementById("itemTitle").style.height = "24px";
          document.getElementById("itemTags").style.height = "24px";
        }
      },

      onOpen: function () {
        console.log('onOpen');
        var x = document.getElementsByClassName("icon-node");
        for (var i = 0; i < x.length; i++) {
          if (i !== 3) {
            if (domClass.contains(x[i], "jimu-state-selected")) {
              x[i].click();
            }
          }
        }
        if (this.config.exportMode !== "agol") {
          var info = {};
          info.levelChange = true;
          this.updateValues(info);
          if (!this.extentchangeHandler) {
            this.extentchangeHandler = this.map.on("extent-change", lang.hitch(this, this.updateValues));
          }
        }
      },

      onClose: function () {
        console.log('onClose');
        if (this.extentchangeHandler) {
          this.extentchangeHandler.remove();
          this.extentchangeHandler = null;
        }
        registry.byId("defineExtent").set("checked", false);
      },

      saveLayerToArcGIS: function () {
        domStyle.set("loadingExport", "display", "block");
        this.refreshData();
        html.set(document.getElementById("successNotification"), "");
        if (this.imageServiceLayer) {
          var extent = this.map.geographicExtent.xmin + "," + this.map.geographicExtent.ymin + "," + this.map.geographicExtent.xmax + "," + this.map.geographicExtent.ymax;
          var spatialReference = this.map.extent.spatialReference.wkid;
          var mosaicRule = this.imageServiceLayer.mosaicRule ? this.imageServiceLayer.mosaicRule.toJson() : null;
          var bandIds = this.imageServiceLayer.bandIds ? [this.imageServiceLayer.bandIds] : [];
          if (this.imageServiceLayer.id === "resultLayer") {
            if (this.imageServiceLayer.changeMode === "mask" || this.imageServiceLayer.changeMode === "threshold") {
              var skipClip = true;
              var renderer = this.modifyRenderingRule(this.imageServiceLayer.changeMode, JSON.stringify(this.imageServiceLayer.renderingRule.toJson()));
            } else if (this.imageServiceLayer.maskMethod) {
              var skipClip = true;
              var renderer = this.modifyRenderer(this.imageServiceLayer.maskMethod, this.imageServiceLayer.renderingRule);
            } else {
              var renderer = this.imageServiceLayer.renderingRule;
            }
          } else {
            var renderer = this.imageServiceLayer.renderingRule;
          }

          if (registry.byId("defineExtent").checked && !skipClip) {

            var renderingRule = (this.addClipFunction(renderer)).toJson();
          } else {
            var renderingRule = renderer ? renderer.toJson() : null;
          }
          var opacity = this.imageServiceLayer.opacity ? this.imageServiceLayer.opacity : 1;
          var interpolation = this.imageServiceLayer.interpolation ? this.imageServiceLayer.interpolation : "RSP_BilinearInterpolation";
          var format = this.imageServiceLayer.format && this.imageServiceLayer.format.indexOf("lerc") === -1 ? this.imageServiceLayer.format : "jpgpng";
          var compressionQuality = this.imageServiceLayer.compressionQuality ? this.imageServiceLayer.compressionQuality : 100;
          var itemData = {
            "id": this.imageServiceLayer.id,
            "visibility": true,
            "bandIds": bandIds,
            "opacity": opacity,
            "title": registry.byId("itemTitle").get("value"),
            "timeAnimation": false,
            "renderingRule": renderingRule,
            "mosaicRule": mosaicRule,
            "interpolation": interpolation,
            "format": format,
            "compressionQuality": compressionQuality
          };
          var layersRequest = esriRequest({
            url: this.imageServiceLayer.url + "/exportImage",
            content: {
              f: "image",
              bbox: extent,
              bboxSR: 4326,
              size: "300,200",
              compressionQuality: compressionQuality,
              format: format,
              interpolation: interpolation,
              renderingRule: JSON.stringify(renderingRule),
              mosaicRule: JSON.stringify(mosaicRule),
              bandIds: this.imageServiceLayer.bandIds,
              imageSR: JSON.stringify(this.imageServiceLayer.spatialReference)
            },
            handleAs: "blob",
            callbackParamName: "callback"
          });

          layersRequest.then(lang.hitch(this, function (data) {
            document.getElementById("layerThumbnail").src = URL.createObjectURL(data);
          }));
          document.getElementsByClassName("h3Title")[0].innerHTML = document.getElementsByClassName("h3Title")[0].title = registry.byId("itemTitle").get("value");
          this.itemInfo = { itemData: itemData, extent: extent };
          var portalUrl = this.portalUrl.indexOf("arcgis.com") !== -1 ? "http://www.arcgis.com" : this.portalUrl;
          var portal = new arcgisPortal.Portal(portalUrl);
          bundle.identity.lblItem = "Account";
          var tempText = (bundle.identity.info).split("access the item on");
          bundle.identity.info = tempText[0] + tempText[1];

          portal.signIn().then(lang.hitch(this, function (loggedInUser) {
            if (loggedInUser.userContentUrl !== this.userContentUrl) {
              registry.byId("folderList").removeOption(registry.byId("folderList").getOptions());
              registry.byId("folderList").addOption({ label: this.nls.default, value: "" });
              domStyle.set("folderContainer", "display", "none");
              this.userContentUrl = loggedInUser.userContentUrl;
              var request = esriRequest({
                url: loggedInUser.userContentUrl,
                content: { f: "json" },
                handleAs: "json",
                callbackParamName: "callback"
              });
              request.then(lang.hitch(this, function (result) {
                if (result.folders.length > 0) {
                  domStyle.set("folderContainer", "display", "inline-block");
                }

                for (var a = 0; a < result.folders.length; a++) {
                  registry.byId("folderList").addOption({ label: result.folders[a].title, value: result.folders[a].id });
                }
                domStyle.set("previewContainer", "display", "block");
                domStyle.set("loadingExport", "display", "none");
              }), lang.hitch(this, function () {
                domStyle.set("previewContainer", "display", "block");
                html.set(document.getElementById("successNotification"), "Error! " + error);
                domStyle.set("loadingExport", "display", "none");
              }));
            } else {
              domStyle.set("previewContainer", "display", "block");
              domStyle.set("loadingExport", "display", "none");
            }
          }));
        } else {
          html.set(document.getElementById("successNotification"), this.nls.error);
        }
      },

      addItemRequest: function () {
        this.showLoadingExport();
        var portalUrl = this.portalUrl.indexOf("arcgis.com") !== -1 ? "http://www.arcgis.com" : this.portalUrl;
        var portal = new arcgisPortal.Portal(portalUrl);
        bundle.identity.lblItem = "Account";
        var tempText = (bundle.identity.info).split("access the item on");
        bundle.identity.info = tempText[0] + tempText[1];

        portal.signIn().then(lang.hitch(this, function (loggedInUser) {
          var folder = registry.byId("folderList").get("value");
          var url = loggedInUser.userContentUrl;
          var addItemRequest = esriRequest({
            url: url + (folder ? "/" + folder : "") + "/addItem",
            content: {
              f: "json",
              title: registry.byId("itemTitle").get("value"),
              type: "Image Service",
              url: this.imageServiceLayer.url,
              description: registry.byId("itemDescription").get("value"),
              tags: registry.byId("itemTags").get("value"),
              extent: this.itemInfo.extent,
              spatialReference: JSON.stringify(this.map.extent.spatialReference.toJson()),
              text: JSON.stringify(this.itemInfo.itemData)
            },
            handleAs: "json",
            callbackParamName: "callback"
          }, { usePost: true });
          addItemRequest.then(lang.hitch(this, function (result) {
            domStyle.set("previewContainer", "display", "none");
            html.set(document.getElementById("successNotification"), "<br />Layer saved.");
            setTimeout(lang.hitch(this, function () {
              html.set(document.getElementById("successNotification"), "");
            }), 4000);
            domStyle.set("loadingExport", "display", "none");

          }), lang.hitch(this, function (error) {
            domStyle.set("previewContainer", "display", "none");
            html.set(document.getElementById("successNotification"), "Error! " + error);
            domStyle.set("loadingExport", "display", "none");
          }));
        }));
      },

      updateValues: function (info) {
        this.project(this.map.extent, "extent").then(lang.hitch(this, function (extent) {
          if (extent !== "error") {
            this.mapExtent = extent;
            if (info.levelChange && !this.geometry) {
              this.refreshData();
              var widthMax = this.map.width;

              var width = (extent.xmax - extent.xmin);
              var height = (extent.ymax - extent.ymin);

              var psx = width / widthMax;
              var psy = height / widthMax;
              var servicePixel = (this.imageServiceLayer && this.imageServiceLayer.pixelSizeX) ? this.imageServiceLayer.pixelSizeX : 0;
              var ps = Math.max(psx, psy, servicePixel);
              var ps = parseFloat(ps);
              registry.byId("pixelSize").set("value", ps.toFixed(3));
              registry.byId("pixelSize").set("constraints", { min: parseFloat(ps.toFixed(3)), place: 0 });
              registry.byId("pixelSize").set("rangeMessage", this.nls.error3 + " " + ps.toFixed(3) + " " + this.nls.error4);
              this.currentPixelSize = parseFloat(ps.toFixed(3));
            }
          }
          this.previousSpatialReference = registry.byId("outputSp").get("value");
          this.getUTMZones(extent);

        }));
      },

      activatePolygon: function () {
        if (registry.byId("defineExtent").checked) {
          this.map.setInfoWindowOnClick(false);
          registry.byId("exportBtn").set("disabled", true);
          domStyle.set(document.getElementById("exportBtn"), "color", "grey");
          registry.byId("submitAgolBtn").set("disabled", true);
          domStyle.set(document.getElementById("submitAgolBtn"), "color", "grey");
          this.toolbarForExport.activate(Draw.POLYGON);
        } else {
          registry.byId("exportBtn").set("disabled", false);
          registry.byId("submitAgolBtn").set("disabled", false);
          domStyle.set(document.getElementById("exportBtn"), "color", "#333");
          domStyle.set(document.getElementById("submitAgolBtn"), "color", "#333");
          this.toolbarForExport.deactivate();
          this.map.setInfoWindowOnClick(true);
          for (var k in this.map.graphics.graphics) {
            if (this.map.graphics.graphics[k].geometry.type === "polygon") {
              if (this.map.graphics.graphics[k].symbol.color.r === 200) {
                this.map.graphics.remove(this.map.graphics.graphics[k]);
                break;
              }
            }
          }
          this.geometry = null;
          var info = {};
          info.levelChange = true;
          this.updateValues(info);
        }
      },

      getExtent: function (geometry) {
        registry.byId("exportBtn").set("disabled", false);
        registry.byId("submitAgolBtn").set("disabled", false);
        domStyle.set(document.getElementById("exportBtn"), "color", "#333");
        domStyle.set(document.getElementById("submitAgolBtn"), "color", "#333");
        var geometry = geometry.geometry;
        for (var k in this.map.graphics.graphics) {
          if (this.map.graphics.graphics[k].geometry.type === "polygon") {
            if (this.map.graphics.graphics[k].symbol.color.r === 200) {
              this.map.graphics.remove(this.map.graphics.graphics[k]);
              break;
            }
          }
        }
        var symbol = new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new Color([200, 0, 0]), 2);
        var graphic = new esri.Graphic(geometry, symbol);
        this.map.graphics.add(graphic);
        this.project(geometry, "polygon").then(lang.hitch(this, function (geometry) {
          if (geometry !== "error") {
            this.geometryClip = geometry;
            this.geometry = geometry.getExtent();
            var width = (this.geometry.xmax - this.geometry.xmin);
            var height = (this.geometry.ymax - this.geometry.ymin);
            var psx = width / this.map.width;
            var psy = height / this.map.width;
            var servicePixel = (this.imageServiceLayer && this.imageServiceLayer.pixelSizeX) ? this.imageServiceLayer.pixelSizeX : 0;
            var ps = Math.max(psx, psy, servicePixel);
            var ps = parseFloat(ps);
            registry.byId("pixelSize").set("value", ps.toFixed(3));
            registry.byId("pixelSize").set("constraints", { min: parseFloat(ps.toFixed(3)), place: 0 });
            registry.byId("pixelSize").set("rangeMessage", this.nls.error3 + " " + ps.toFixed(3) + " " + this.nls.error4);
            this.currentPixelSize = parseFloat(ps.toFixed(3));
          }
        }));
      },

      getUTMZones: function (extent) {
        if (registry.byId("outputSp").getOptions()) {
          registry.byId("outputSp").removeOption(registry.byId('outputSp').getOptions());
        }
        if (extent !== "error") {
          var mapCenter = extent.getCenter();
          var y = Math.pow(2.718281828, (mapCenter.y / 3189068.5));
          var sinvalue = (y - 1) / (y + 1);
          var y1 = Math.asin(sinvalue) / 0.017453292519943295;
          var x = mapCenter.x / 6378137.0;
          x = x / 0.017453292519943295;
          var utm = parseInt((x + 180) / 6) + 1;
          if (y1 > 0) {
            var wkid = 32600 + utm;
          }
          else {
            var wkid = 32500 + utm;
          }

          if (utm !== 1) {
            registry.byId("outputSp").addOption({ label: this.nls.utm + " " + (utm - 1) + "", value: wkid - 1 });
          } else {
            registry.byId("outputSp").addOption({ label: this.nls.utm + " " + (utm + 59) + "", value: wkid + 59 });
          }
          registry.byId("outputSp").addOption({ label: this.nls.utm + " " + utm + "", value: wkid });
          if (utm !== 60) {
            registry.byId("outputSp").addOption({ label: this.nls.utm + " " + (utm + 1) + "", value: wkid + 1 });
          }
          else {
            registry.byId("outputSp").addOption({ label: this.nls.utm + " " + utm - 59 + "", value: wkid - 59 });
          }
        } else {
          var wkid = this.map.extent.spatialReference.wkid;
          registry.byId("outputSp").addOption({ label: "WKID : " + wkid, value: wkid });
        }
        registry.byId("outputSp").addOption({ label: this.nls.mercator, value: 102100 });

        if (this.imageServiceLayer && this.imageServiceLayer.hasOwnProperty("spatialReference") && this.imageServiceLayer.spatialReference.wkid !== 102100) {
          registry.byId("outputSp").addOption({ label: this.nls.default, value: this.imageServiceLayer.spatialReference.wkid });
        }
        var srsList = registry.byId("outputSp").getOptions();
        var temp;
        for (var a in srsList) {
          if (this.previousSpatialReference === srsList[a].value) {
            temp = this.previousSpatialReference;
            break;
          } else {
            temp = wkid;
          }
        }
        registry.byId("outputSp").set("value", temp);
      },

      project: function (geometry, type) {
        var dfd = new Deferred();
        if (this.map.extent.spatialReference.wkid !== 102100 && this.map.extent.spatialReference.wkid !== 3857) {
          if (webMercatorUtils.canProject(this.map.extent.spatialReference.wkid, new SpatialReference(102100))) {
            geometry = webMercatorUtils.project(geometry, new SpatialReference({ wkid: 102100 }));
          } else {
            var params = new ProjectParameters();
            params.geometries = [geometry];
            params.outSR = new SpatialReference(102100);
            this.geometryService.project(params, lang.hitch(this, function (response) {

              if (response && response.length > 0) {
                response[0].spatialReference = { "wkid": 102100 };
                response[0] = type === "extent" ? new Extent(response[0]) : new Polygon(response[0]);
                return dfd.resolve(response[0]);
              } else {
                return dfd.resolve("error");
              }
            }), lang.hitch(this, function () {
              return dfd.resolve("error");
            }));
          }
        } else {
          return dfd.resolve(geometry);
        }
        return dfd.promise;
      },

      exportLayer: function () {
        this.refreshData();
        this.showLoadingExport();
        if (this.imageServiceLayer) {
          if (registry.byId("defineExtent").checked) {
            var bbox = (this.geometry.xmin + ", " + this.geometry.ymin + ", " + this.geometry.xmax + ", " + this.geometry.ymax).toString();
            var width = (this.geometry.xmax - this.geometry.xmin);
            var height = (this.geometry.ymax - this.geometry.ymin);
            var bboxSR = this.geometry.spatialReference;

          } else {
            var bbox = (this.mapExtent.xmin + ", " + this.mapExtent.ymin + ", " + this.mapExtent.xmax + ", " + this.mapExtent.ymax).toString();
            var width = (this.mapExtent.xmax - this.mapExtent.xmin);
            var height = (this.mapExtent.ymax - this.mapExtent.ymin);
            var bboxSR = this.mapExtent.spatialReference;
          }

          var pixelSize = (parseFloat(registry.byId("pixelSize").get("value")) || this.currentPixelSize);
          if (pixelSize < this.currentPixelSize) {
            domStyle.set("loadingExport", "display", "none");
          } else {
            var size = (parseInt(width / pixelSize)).toString() + ", " + (parseInt(height / pixelSize)).toString();
            
            domStyle.set("errorPixelSize", "display", "none");

            if (this.imageServiceLayer.renderingRule) {
              if (this.imageServiceLayer.id === "resultLayer") {
                if (this.imageServiceLayer.changeMode === "mask" || this.imageServiceLayer.changeMode === "threshold") {
                  var skipClip = true;
                  var renderer = this.modifyRenderingRule(this.imageServiceLayer.changeMode, JSON.stringify(this.imageServiceLayer.renderingRule.toJson()));
                } else if (this.imageServiceLayer.maskMethod) {
                  var skipClip = true;
                  var renderer = this.modifyRenderer(this.imageServiceLayer.maskMethod, this.imageServiceLayer.renderingRule);
                } else {
                  var renderer = this.imageServiceLayer.renderingRule;
                }
              } else {
                var renderer = this.imageServiceLayer.renderingRule;
              }


            } else {
              var renderer = null;
            }
            if (registry.byId("renderer").checked) {
              var renderingRule = renderer;
            }
            else {
              var skipClip = false;
              var renderingRule = new RasterFunction({ "rasterFunction": "None" });
            }
            if (registry.byId("defineExtent").checked && !skipClip) {

              var renderingRule = JSON.stringify((this.addClipFunction(renderingRule)).toJson());
            } else {
              var renderingRule = renderingRule ? JSON.stringify(renderingRule.toJson()) : null;
            }


            var format = "tiff";
            var compression = "LZ77";
            var mosaicRule = this.imageServiceLayer.mosaicRule ? JSON.stringify(this.imageServiceLayer.mosaicRule.toJson()) : null;
            var band = this.imageServiceLayer.bandIds ? (this.imageServiceLayer.bandIds).toString() : "";
            var noData = "";

            var layersRequest = esriRequest({
              url: this.imageServiceLayer.url + "/exportImage",
              content: {
                f: "json",
                bbox: bbox,
                size: size,
                bboxSR: JSON.stringify(bboxSR),
                compression: compression,
                format: format,
                //interpolation: this.imageServiceLayer.interpolation ? this.imageServiceLayer.interpolation : "RSP_BilinearInterpolation",
                renderingRule: renderingRule,
                mosaicRule: mosaicRule,
                bandIds: band,
                imageSR: registry.byId("outputSp").get("value"),
                noData: noData
              },
              handleAs: "json",
              callbackParamName: "callback"
            });

            layersRequest.then(lang.hitch(this, function (data) {
              domAttr.set("linkDownload", "href", data.href);

              // domAttr.set("linkDownload", "target", "_self");
              // (document.getElementById("linkDownload")).click();

              var http = new XMLHttpRequest();
              http.open("GET", data.href, true);
              http.responseType = "blob";
              var global = this;
              http.onload = function () {
                domAttr.set("linkDownload", "target", "_self");
                if (this.status === 200) {
                  domAttr.set("linkDownload", "href", URL.createObjectURL(http.response));
                  (document.getElementById("linkDownload")).click();
                } else {
                  domStyle.set("errorPixelSize", "display", "block");
                  document.getElementById("errorPixelSize").innerHTML = global.nls.error6;
                  setTimeout(function () {
                    domStyle.set("errorPixelSize", "display", "none");
                  }, 5000);
                }
                global.hideLoadingExport();
              };
              http.onerror = function () {
                domStyle.set("errorPixelSize", "display", "block");
                document.getElementById("errorPixelSize").innerHTML = global.nls.error6;
                setTimeout(function () {
                  domStyle.set("errorPixelSize", "display", "none");
                }, 5000);
                global.hideLoadingExport();
              };
              http.send();
            }), lang.hitch(this, function (error) {
              this.hideLoadingExport();
            }));
          }
        } else {
          domStyle.set("errorPixelSize", "display", "block");
          document.getElementById("errorPixelSize").innerHTML = this.nls.error;
        }
      },

      refreshData: function () {  
        if (this.imageServiceLayer) {          
          domStyle.set("extentCheckBoxContainer", "display", "block");
          domStyle.set("selectExportDisplay", "display", "block");
          if (registry.byId("saveAndExportOption").value === "agol") {
            domStyle.set("saveAgolContainer", "display", "block");
            domStyle.set("exportSaveContainer", "display", "none");
          } else if (registry.byId("saveAndExportOption").value === "disk"){
            domStyle.set("saveAgolContainer", "display", "none");
            domStyle.set("exportSaveContainer", "display", "block");
          }
        } else {        
          domStyle.set("exportSaveContainer", "display", "none");
          domStyle.set("saveAgolContainer", "display", "none");
          domStyle.set("selectExportDisplay", "display", "none");
          domStyle.set("extentCheckBoxContainer", "display", "none");
        }
      },

      modifyRenderingRule: function (mode, renderer) {
        renderer = new RasterFunction(JSON.parse(renderer));
        if (mode === "mask") {
          var positiveRange = registry.byId("positiveRange").get("value");
          var negativeRange = registry.byId("negativeRange").get("value");

          var remap = new RasterFunction();
          remap.functionName = "Remap";
          var remapArg = {};
          remapArg.InputRanges = [-5, negativeRange, positiveRange, 5];
          remapArg.OutputValues = [0, 1];
          remapArg.AllowUnmatched = false;
          remapArg.Raster = renderer;
          remap.outputPixelType = "U8";
          remap.functionArguments = remapArg;
          var raster3 = remap;
        } else {
          if (renderer.rasterFunction) {
            var rendererTemp = renderer.rasterFunction;
          }
          else {
            var rendererTemp = renderer.functionName;
          }
          var tempVariable = renderer.functionArguments;
          for (var a = 0; a < 20; a++) {
            if (tempVariable) {
              if (tempVariable.Rasters) {
                var raster1 = tempVariable.Rasters[0];
                var raster2 = tempVariable.Rasters[1];
                break;
              } else {
                tempVariable = tempVariable.Raster.functionArguments;
              }
            }
          }

          var thresholdValue = registry.byId("thresholdValue").get("value");
          var differenceValue = registry.byId("differenceValue").get("value");
          var remapRaster1 = new RasterFunction();
          remapRaster1.functionName = "Remap";
          var remapRaster1Arg = {};
          remapRaster1Arg.InputRanges = [-1, thresholdValue, thresholdValue, 1];
          remapRaster1Arg.OutputValues = [0, 1];
          remapRaster1Arg.AllowUnmatched = false;
          remapRaster1Arg.Raster = raster1;
          remapRaster1.functionArguments = remapRaster1Arg;
          remapRaster1.outputPixelType = "U8";

          var remapRaster2 = new RasterFunction();
          remapRaster2.functionName = "Remap";
          var remapRaster2Arg = {};
          remapRaster2Arg.InputRanges = [-1, thresholdValue, thresholdValue, 1];
          remapRaster2Arg.OutputValues = [0, 1];
          remapRaster2Arg.AllowUnmatched = false;
          remapRaster2Arg.Raster = raster2;
          remapRaster2.functionArguments = remapRaster2Arg;
          remapRaster2.outputPixelType = "U8";

          var arithmetic = new RasterFunction();
          arithmetic.functionName = "Arithmetic";
          var arithmeticArg = {};
          arithmeticArg.Operation = 2;
          arithmeticArg.ExtentType = 1;
          arithmeticArg.CellsizeType = 0;
          arithmeticArg.Raster = remapRaster1;
          arithmeticArg.Raster2 = remapRaster2;
          arithmetic.functionArguments = arithmeticArg;
          arithmetic.outputPixelType = "F32";

          var remapArithmetic = new RasterFunction();
          remapArithmetic.functionName = "Remap";
          var remapArithmeticArg = {};
          remapArithmeticArg.InputRanges = [-1.1, -0.01];
          remapArithmeticArg.OutputValues = [1];
          remapArithmeticArg.NoDataRanges = [0, 0];
          remapArithmeticArg.AllowUnmatched = true;
          remapArithmeticArg.Raster = arithmetic;
          remapArithmetic.functionArguments = remapArithmeticArg;
          remapArithmetic.outputPixelType = "F32";
          var arithmetic2 = new RasterFunction();
          arithmetic2.functionName = "Arithmetic";
          arithmetic2.outputPixelType = "F32";
          var arithmeticArg2 = {};
          arithmeticArg2.Raster = raster1;
          arithmeticArg2.Raster2 = raster2;
          arithmeticArg2.Operation = 2;
          arithmeticArg2.ExtentType = 1;
          arithmeticArg2.CellsizeType = 0;
          arithmetic2.functionArguments = arithmeticArg2;


          var remapDifference = new RasterFunction();
          remapDifference.functionName = "Remap";
          remapDifference.outputPixelType = "F32";
          var remapDifferenceArg = {};
          remapDifferenceArg.NoDataRanges = [(-1 * differenceValue), differenceValue];
          remapDifferenceArg.AllowUnmatched = true;
          remapDifferenceArg.Raster = arithmetic2;
          remapDifference.functionArguments = remapDifferenceArg;

          var arithmetic3 = new RasterFunction();
          arithmetic3.functionName = "Arithmetic";
          arithmetic3.outputPixelType = "F32";
          var arithmeticArg3 = {};
          arithmeticArg3.Raster = remapArithmetic;
          arithmeticArg3.Raster2 = remapDifference;
          arithmeticArg3.Operation = 3;
          arithmeticArg3.ExtentType = 1;
          arithmeticArg3.CellsizeType = 0;
          arithmetic3.functionArguments = arithmeticArg3;

          var remapArithmetic3 = new RasterFunction();
          remapArithmetic3.functionName = "Remap";
          remapArithmetic3.outputPixelType = "U8";
          var remapArithmeticArg3 = {};
          remapArithmeticArg3.InputRanges = [-5, 0, 0, 5];
          remapArithmeticArg3.OutputValues = [1, 0];
          remapArithmeticArg3.AllowUnmatched = false;
          remapArithmeticArg3.Raster = arithmetic3;
          remapArithmetic3.functionArguments = remapArithmeticArg3;


          if (rendererTemp === "Clip" && !registry.byId("defineExtent").checked) {
            renderer.functionArguments.Raster = remapArithmetic3;
            var raster3 = renderer;
          } else {
            var raster3 = remapArithmetic3;
          }
        }
        if (registry.byId("defineExtent").checked) {
          raster3 = this.addClipFunction(raster3);
        }
        var colormap = new RasterFunction();
        colormap.functionName = "Colormap";
        var colormapArg = {};
        colormapArg.Colormap = this.imageServiceLayer.changeMethod === "burn" ? [[0, 255, 69, 0], [1, 0, 252, 0]] : [[0, 255, 0, 255], [1, 0, 252, 0]];
        colormapArg.Raster = raster3;
        colormap.outputPixelType = "U8";
        colormap.functionArguments = colormapArg;

        return colormap;
      },

      modifyRenderer: function (maskProperties, renderer) {
        var remap = new RasterFunction();
        remap.functionName = "Remap";
        var argsRemap = {};
        argsRemap.Raster = renderer;
        if (maskProperties.mode === "less") {
          argsRemap.InputRanges = [maskProperties.range[0], maskProperties.value];
          argsRemap.NoDataRanges = [maskProperties.value, maskProperties.range[1]];
        } else {
          argsRemap.InputRanges = [maskProperties.value, maskProperties.range[1]];
          argsRemap.NoDataRanges = [maskProperties.range[0], maskProperties.value];
        }
        argsRemap.OutputValues = [1];
        remap.functionArguments = argsRemap;
        remap.outputPixelType = 'U8';

        var color = maskProperties.color;
        var colorMask = [[1, parseInt(color[0]), parseInt(color[1]), parseInt(color[2])]];
        if (registry.byId("defineExtent").checked) {
          remap = this.addClipFunction(remap);
        }

        var colormap = new RasterFunction();
        colormap.functionName = "Colormap";
        colormap.outputPixelType = "U8";
        var argsColor = {};
        argsColor.Colormap = colorMask;
        argsColor.Raster = remap;
        colormap.functionArguments = argsColor;

        return colormap;
      },

      addClipFunction: function (raster) {
        var rasterClip = new RasterFunction();
        rasterClip.functionName = "Clip";
        var clipArguments = {};
        clipArguments.ClippingGeometry = this.geometryClip;
        clipArguments.ClippingType = 1;
        if (raster) {
          clipArguments.Raster = raster;
        }
        else {
          clipArguments.Raster = "$$";
        }
        rasterClip.functionArguments = clipArguments;
        return rasterClip;
      },

      showLoadingExport: function () {
        domStyle.set("loadingExport", "display", "block");
      },

      hideLoadingExport: function () {
        domStyle.set("loadingExport", "display", "none");
      }

    });
  });
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
    'jimu/BaseWidget', "./resourceLoad.js"
],
        function (
                declare,
                _WidgetsInTemplateMixin,
                template,
                BaseWidget, resourceLoad
                ) {
            var resource = new resourceLoad({resource: "compare"});
            var plugins = resource.load("compare");
            var
                    registry = plugins[0],
                    lang = plugins[1],
                    dom = plugins[2], on = plugins[3],
                    domConstruct = plugins[4],
                    LayerSwipe = plugins[5], WidgetManager = plugins[6], domClass = plugins[7], domStyle = plugins[8];
            var wm = WidgetManager.getInstance();
            var clazz = declare([BaseWidget, _WidgetsInTemplateMixin], {
                templateString: template,
                name: 'ISCompare',
                baseClass: 'jimu-widget-ISCompare',
                primaryLayer: null,
                secondaryLayer: null,
                startup: function () {
                    this.inherited(arguments);
                },
                postCreate: function () {

                },
                onOpen: function () {


                    this.secondaryLayerHandler = this.map.on("update-end", lang.hitch(this, this.refreshData));
                    if (this.map.getLayer("secondaryLayer") && this.map.getLayer("secondaryLayer").mosaicRule !== this.map.getLayer("primaryLayer").mosaicRule)
                        this.map.getLayer("secondaryLayer").show();
                    domConstruct.place('<div id="swipeDiv"></div>', "map", "first");

                    this.layerForSwipe = (registry.byId("layerIdAdd") && this.map.getLayer(registry.byId("layerIdAdd").get("value"))) ? this.map.getLayer(registry.byId("layerIdAdd").get("value")) : this.map.getLayer("primaryLayer");
                    this.layerSwipe = new LayerSwipe({
                        layers: [this.layerForSwipe],
                        type: "vertical",
                        map: this.map,
                        left: 200,
                        invertPlacement: true
                    }, "swipeDiv");
                    this.layerSwipe.startup();

                    this.refreshData();

                },
                refreshData: function () {
                    var getLayerProperties = (registry.byId("layerIdAdd") && this.map.getLayer(registry.byId("layerIdAdd").get("value"))) ? this.map.getLayer(registry.byId("layerIdAdd").get("value")) : this.map.getLayer("primaryLayer");

                    this.layerSwipe.layers[0] = getLayerProperties;
                    if (this.map.getLayer("secondaryLayer")) {
                        if ((getLayerProperties.mosaicRule.method === "esriMosaicLockRaster" && getLayerProperties.mosaicRule.lockRasterIds[0] !== this.map.getLayer("secondaryLayer").mosaicRule.lockRasterIds[0]))
                            this.map.getLayer("secondaryLayer").show();
                        else {
                            this.map.getLayer("secondaryLayer").hide();
                        }

                    }
                    if (dom.byId("dateDisplay").innerHTML.split(":&nbsp;")[1] !== dom.byId("dateSecondary").innerHTML.split(":&nbsp;")[1])
                        domStyle.set(dom.byId("dateSecondary"), "display", "inline-block");
                    else
                        domStyle.set(dom.byId("dateSecondary"), "display", "none");
                },
                onClose: function () {
                    if (this.layerSwipe)
                        this.layerSwipe.destroy();
                    this.layerSwipe = null;
                    if (this.map.getLayer("secondaryLayer"))
                        this.map.getLayer("secondaryLayer").hide();
                    if (this.secondaryLayerHandler)
                    {
                        this.secondaryLayerHandler.remove();
                        this.secondaryLayerHandler = null;
                    }
                    domStyle.set(dom.byId("dateSecondary"), "display", "none");
                }


            });

            clazz.hasLocale = false;
            clazz.hasSettingPage = false;
            clazz.hasSettingUIFile = false;
            clazz.hasSettingLocale = false;
            clazz.hasSettingStyle = false;
            return clazz;
        });
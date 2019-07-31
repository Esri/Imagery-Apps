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

define(['dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/_base/html',
    'dojo/dom-class',
    'jimu/BaseWidgetFrame',
    'dijit/Dialog', "dojo/dom-style", 'dojo/dom-geometry'
],
    function (declare, lang, html, domClass, BaseWidgetFrame, Dialog, domStyle, domGeometry) {
        return declare([BaseWidgetFrame], {
            baseClass: 'jimu-widget-frame dialog-widget-frame',
            widgetConfig: null,
            widgetManager: null,
            panelManager: null,
            _dialog: null,
            postCreate: function () {
                this.inherited(arguments);

            },
            startup: function () {
                this.inherited(arguments);

                if (!this.widgetConfig) {
                    console.error("widgetConfig does not exist.");
                    return false;
                }

                if (this.widgetConfig.label !== "About" && this.widgetConfig.label !== "Add Data from ArcGIS Online" && this.widgetConfig.label !== "Bookmarks" && this.widgetConfig.label !== "Image Export") {
                    this.domNode.style.width = 100 + "%";
                    this.domNode.style.height = 100 + "%";
                } else if (this.widgetConfig.label === "Add Data from ArcGIS Online") {
                    this.domNode.style.width = this.widgetConfig.panel.position.width + "px";
                    this.domNode.style.height = this.widgetConfig.panel.position.height + "px";
                } else if (this.widgetConfig.label === "Image Export") {
                    this.domNode.style.height = 100 + "%";
                    this.domNode.style.width = 320 + "px";
                } else if (this.widgetConfig.label === "Bookmarks") {
                    this.domNode.style.width = this.widgetConfig.panel.position.width + "px";
                    this.domNode.style.height = 100 + "%";
                }

                var dialog = this._dialog = new Dialog({
                    title: this.widgetConfig.label,
                    content: this.domNode,
                    id: this.widgetConfig.label,
                    focus: function () { }
                });

                dialog.on('hide', lang.hitch(this, function () {
                    if (this.widget) {
                        this.widgetManager.closeWidget(this.widget);
                        this.panelManager.closePanel(this.parent);
                    }
                }));

            },
            _getLayoutBox: function () {
                //This panel's position always relates to map.
                return domGeometry.getMarginBox(jimuConfig.mapId);
            },
            show: function (position) {
                this._dialog.show();
                var box = this._getLayoutBox();
                if (window.appInfo.isRunInMobile) {
                    position.left = 50;
                    position.top = (box.h / 2) + 60;
                    position.width = box.w;
                    position.height = box.h / 2;
                    domStyle.set(this._dialog.id, "left", "20vw");
                    domStyle.set(this._dialog.id, "top", "40vh");

                    if (this.widgetConfig.label !== "About" && this.widgetConfig.label !== "Add Data from ArcGIS Online" && this.widgetConfig.label !== "Bookmarks" && this.widgetConfig.label !== "Image Export") {
                        this.domNode.style.height = 120 + "px";
                        this.domNode.style.overflow = "auto";
                    } else if (this.widgetConfig.label === "Add Data from ArcGIS Online") {
                        this.domNode.style.width = 350 + "px";
                    } else if (this.widgetConfig.label === "Image Export") {
                        this.domNode.style.width = 200 + "px";
                        this.domNode.style.height = 120 + "px";
                    }
                } else {
                    if (this.widgetConfig.label === "Spectral Index Library") {
                        domStyle.set(this._dialog.id, "left", "800px");
                        domStyle.set(this._dialog.id, "top", "235px");
                    } else {
                        domStyle.set(this._dialog.id, "left", "160px");
                        domStyle.set(this._dialog.id, "top", "100px");
                    }
                }



            },
            hide: function () {
                this._dialog.hide();
                //domClass.remove(document.body, "no-dialog-overlay");

            }
        });
    });
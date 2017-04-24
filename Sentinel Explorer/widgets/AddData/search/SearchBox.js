///////////////////////////////////////////////////////////////////////////
// Copyright © 2016 Esri. All Rights Reserved.
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
define(["dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/on", "dijit/registry", "dijit/popup", "dojo/dom-style",
    "dojo/keys",
    "./SearchComponent",
    "dojo/text!./templates/SearchBox.html",
    "dojo/i18n!../nls/strings"
],
        function (declare, lang, on, registry, popup, domStyle, keys, SearchComponent, template, i18n) {

            return declare([SearchComponent], {
                i18n: i18n,
                templateString: template,
                postCreate: function () {
                    this.inherited(arguments);
                    this._checkClearButton();

                    this.own(on(this.searchTextBox, "keyup", lang.hitch(this, function (evt) {
                        this._checkClearButton();
                        if (evt.keyCode === keys.ENTER) {
                            this.search();
                            if (registry.byId("tooltipDialogIntro") && registry.byId("tooltipDialogIntro").state === "open" && registry.byId("tutorialStage").get("value") === "34") {
                                var tooltipTemp = registry.byId("tooltipDialogIntro");
                                tooltipTemp.set("content", "Click <span style='color:orange;font-weight:bolder;'>ADD</span> to add the World Boundaries and Places map service to your map.");
                                popup.open({
                                    parent: registry.byId("Add Data from ArcGIS Online"),
                                    popup: tooltipTemp,
                                    orient: ["after-centered"],
                                    around: registry.byId("Add Data from ArcGIS Online").domNode,
                                    onClose: lang.hitch(this, function () {
                                        domStyle.set(tooltipTemp._popupWrapper, "display", "block");
                                    })
                                });
                                domStyle.set(tooltipTemp.connectorNode, "top", "0px");
                                registry.byId("tutorialStage").set("value", "35");
                            }
                        }
                    })));
                },
                _checkClearButton: function () {
                    /*
                     var v = this.searchTextBox.value;
                     if (v !== null && v.length > 0) {
                     //domClass.remove(this.clearButton,"hidden");
                     domClass.add(this.clearButton, "hidden");
                     } else {
                     domClass.add(this.clearButton, "hidden");
                     }
                     */
                },
                clearButtonClicked: function () {
                    this.searchTextBox.value = "";
                    this._checkClearButton();
                    this.search();
                },
                searchButtonClicked: function () {
                    this.search();
                    if (registry.byId("tooltipDialogIntro") && registry.byId("tooltipDialogIntro").state === "open" && registry.byId("tutorialStage").get("value") === "34") {
                        var tooltipTemp = registry.byId("tooltipDialogIntro");
                        tooltipTemp.set("content", "Click <span style='color:orange;font-weight:bolder;'>ADD</span> to add the World Boundaries and Places map service to your map.");
                        popup.open({
                            parent: registry.byId("Add Data from ArcGIS Online"),
                            popup: tooltipTemp,
                            orient: ["after-centered"],
                            around: registry.byId("Add Data from ArcGIS Online").domNode,
                            onClose: lang.hitch(this, function () {
                                domStyle.set(tooltipTemp._popupWrapper, "display", "block");
                            })
                        });
                        domStyle.set(tooltipTemp.connectorNode, "top", "0px");
                        registry.byId("tutorialStage").set("value", "35");
                    }
                },
                /* SearchComponent API ============================================= */

                appendQueryParams: function (params) {
                    var q = this.searchTextBox.value;
                    if (q !== null) {
                        q = lang.trim(q);
                    }
                    if (q !== null && q.length > 0) {
                        params.canSortByRelevance = true;
                        q = "(" + q + ")";
                        if (params.q !== null && params.q.length > 0) {
                            params.q += " AND " + q;
                        } else {
                            params.q = q;
                        }
                    }
                }

            });

        });

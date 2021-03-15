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
    'dojo/on',
    'dojo/json',
    'dojo/query',
    'dojo/cookie',
    'dijit/_WidgetsInTemplateMixin',
    'jimu/BaseWidget',
    "dojo/_base/connect",
    "jimu/PanelManager",
    "dijit/registry",
    "esri/layers/MosaicRule",
    "dojo/dom-style",
    "dojo/dom-class",
    "esri/geometry/ScreenPoint",
    "esri/symbols/SimpleFillSymbol",
    "esri/Color",
    "esri/graphic",
    'esri/symbols/SimpleLineSymbol',
    "esri/geometry/Circle",
    "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.8.0/Chart.min.js",
    // "https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels",
    "dojo/domReady!"
],
    function (declare, lang, html, on, dojoJson, query, cookie, _WidgetsInTemplateMixin, BaseWidget, connect, PanelManager, registry, MosaicRule,
        domStyle, domClass, ScreenPoint, SimpleFillSymbol, Color, Graphic, SimpleLineSymbol, Circle) {
        var pm = PanelManager.getInstance();
        var clazz = declare([BaseWidget, _WidgetsInTemplateMixin], {
            baseClass: 'jimu-widget-aggraph',
            // clasName: 'esri.widgets.About',

            _hasContent: null,
            a: null,

            postCreate: function() {
                this.inherited(arguments);
            },
            startup: function () {
                this.inherited(arguments);
                this.rasterAttributeFeatures = [];
                if (this.map.getLayer('usa_hydro').pixelData === null || this.map.getLayer('usa_hydro').pixelData.pixelBlock === null) {
                    return;
                }
                if (this.map.getLayer('usa_hydro').pixelData && this.map.getLayer('usa_hydro').pixelData.pixelBlock && this.map.getLayer('usa_hydro').pixelData.pixelBlock.pixels === null) {
                    return;
                }
                this.pixelData = this.map.getLayer('usa_hydro').pixelData;
                console.log(this.pixelData);

                var symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
                    new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                        new Color([0, 0, 255]), 2), new Color([255, 255, 0, 0.0]));
                this.graphic = new Graphic(null, symbol);
                this.map.graphics.add(this.graphic);

                // const graphic = new Graphic({
                //     geometry: null,
                //     symbol: {
                //       type: "simple-fill",
                //       color: null,
                //       style: "solid",
                //       outline: {
                //         color: "blue",
                //         width: 2
                //       }
                //     }
                //   });

                // raster attributes table returns categorical mapping of pixel values such as class and group
                const attributesData = this.map.getLayer('usa_hydro').rasterAttributeTable.features;

                // rasterAttributeFeatures will be used to add legend labels and colors for each
                // land use type
                for (var index in attributesData) {
                    if (attributesData) {
                        var hexColor = this.rgbToHex(
                            attributesData[index].attributes.Red,
                            attributesData[index].attributes.Green,
                            attributesData[index].attributes.Blue
                        );
                        this.rasterAttributeFeatures[
                            attributesData[index].attributes.Value
                        ] = {
                            ClassName: attributesData[index].attributes.ClassName,
                            hexColor: hexColor
                        };
                    }
                }
                // initialize the land cover pie chart
                //lang.hitch(this, this.createLandCoverChart);
                this.createLandCoverChart();
                this.mapClick = this.map.on('click', lang.hitch(this, this.getLandCoverType));

            },

            rgbToHex: function (r, g, b) {
                return (
                    "#" + this.componentToHex(r) + this.componentToHex(g) + this.componentToHex(b)
                );
            },

            componentToHex: function (c) {
                var hex = c.toString(16);
                return hex.length == 1 ? "0" + hex : hex;
            },

           
            onOpen: function () {
                //this.map.getLayer('usa_hydro').setPixelFilter(lang.hitch(this, this.getLandCoverType));


            },

            getLandCoverType: function (event) {
                var currentExtent = this.pixelData.extent;
                this.pixelBlock = this.pixelData.pixelBlock;
                const height = this.pixelBlock.height;
                const width = this.pixelBlock.width;

                var p = new ScreenPoint(event.x, event.y);
                var point = this.map.toMap(p);

                const reqX = Math.ceil(event.x);
                const reqY = Math.ceil(event.y);

                // calculate how many meters are represented by 1 pixel.
                const pixelSizeX =
                    Math.abs(currentExtent.xmax - currentExtent.xmin) / width;

                // calculate how many pixels represent one mile
                const bufferDim = Math.ceil(1609 / pixelSizeX);

                // figure out 2 mile extent around the pointer location
                const xmin = reqX - bufferDim < 0 ? 0 : reqX - bufferDim;
                const ymin = reqY - bufferDim < 0 ? 0 : reqY - bufferDim;
                const startPixel = ymin * width + xmin;
                const bufferlength = bufferDim * 2;
                const pixels = this.pixelBlock.pixels[0];
                let oneMilePixelValues = [];
                const radius2 = bufferDim * bufferDim;

                // cover pixels within to 2 mile rectangle
                if (bufferlength) {
                    for (var i = 0; i <= bufferlength; i++) {
                        for (var j = 0; j <= bufferlength; j++) {
                            // check if the given pixel location is in within one mile of the pointer
                            // add its value to pixelValue.
                            if (
                                Math.pow(i - bufferDim, 2) + Math.pow(j - bufferDim, 2) <=
                                radius2
                            ) {
                                var pixelValue =
                                    pixels[Math.floor(startPixel + i * width + j)];
                            }
                            if (pixelValue !== undefined) {
                                oneMilePixelValues.push(pixelValue);
                            }
                        }
                    }
                } else {
                    oneMilePixelValues.push(pixels[startPixel]);
                }

                this.pixelValCount = [];
                // get the count of each land type returned within one mile raduis
                for (var i = 0; i < oneMilePixelValues.length; i++) {
                    this.pixelValCount[oneMilePixelValues[i]] =
                        1 + (this.pixelValCount[oneMilePixelValues[i]] || 0);
                }
                var circle = new Circle(point, {
                   
                    radius: bufferDim * pixelSizeX
                });

                this.graphic.geometry = circle;

                this.updateLandCoverChart();
            },

            createLandCoverChart: function () {
                const landCoverCanvas = document.getElementById("landcover-chart");
          this.landCoverChart = new Chart(landCoverCanvas.getContext("2d"), {
            type: "doughnut",
            data: {
              labels: [],
              datasets: [
                {
                  data: [],
                  backgroundColor: [],
                  borderColor: "rgb(0, 0, 0, 0, 1)",
                  borderWidth: 0.5
                }
              ]
            },
            options: {
              responsive: false,
              cutoutPercentage: 35,
              legend: {
                display: false
              },
              title: {
                display: true,
                text: "Land Cover Types"
              },
              plugins: {
                datalabels: {
                  formatter: function (value, ctx) {
                    let datasets = ctx.chart.data.datasets;
                    if (datasets.indexOf(ctx.dataset) === datasets.length - 1) {
                      let sum = datasets[0].data.reduce(function (a, b) {
                        return a + b;
                      });
                      let percentage = Math.round((value / sum) * 100);
                      if (percentage > 15) {
                        return percentage + "%";
                      } else {
                        return "";
                      }
                    } else {
                      return percentage;
                    }
                  },
                  color: "#4c4c4c"
                }
              }
            }
          });
            },

            updateLandCoverChart: function() {
                if (infoDiv.style.display != "block") {
                    infoDiv.style.display = "block";
                  }
                  this.landCoverChart.data.datasets[0].data = [];
                  var dataset = [];
                  var landCoverTypeColors = [];
                  var landCoverTypeLabels = [];
        
                  // pixelValCount object contains land cover types and count of pixels
                  // that represent that type in within one mile.
                  for (var index in this.pixelValCount) {
                    if (index == 0) {
                      landCoverTypeColors.push("rgba(255,255,255,1");
                      landCoverTypeLabels.push("NoData");
                    } else {
                      var color = this.rasterAttributeFeatures[index].hexColor;
                      landCoverTypeColors.push(color);
                      landCoverTypeLabels.push(
                        this.rasterAttributeFeatures[index].ClassName
                      );
                    }
                    this.landCoverChart.data.datasets[0].data.push(this.pixelValCount[index]);
                  }
                  this.landCoverChart.data.datasets[0].backgroundColor = landCoverTypeColors;
                  this.landCoverChart.data.labels = landCoverTypeLabels;
                  this.landCoverChart.update(0);
                  document.getElementById(
                    "chartLegend"
                  ).innerHTML = this.landCoverChart.generateLegend();
            },

            onClose: function () {
                console.log('close');
            }


        });
        return clazz;
    });
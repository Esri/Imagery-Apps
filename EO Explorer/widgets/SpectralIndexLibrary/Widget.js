define([
	'dojo/_base/declare', "dojo/Evented", 'jimu/BaseWidget',
	'dijit/_WidgetsInTemplateMixin',
	'dojo/text!./Widget.html', "esri/request", "dojo/dom-construct", 'dojo/on', "esri/tasks/Geoprocessor", 'dojo/_base/lang', 'esri/layers/RasterFunction', 'dojo/dom-style',
	"dojo/dom-class", 'dojo/dom', "dijit/registry",
],
	function (declare, Evented, BaseWidget, _WidgetsInTemplateMixin, template, esriRequest, domConstruct, on, Geoprocessor, lang, RasterFunction, domStyle, domClass, dom, registry) {
		//To create a widget, you need to derive from BaseWidget.
		return declare([BaseWidget, _WidgetsInTemplateMixin], {
			// Custom widget code goes here

			baseClass: 'jimu-widget-ISImageExport',
			templateString: template,
			rftchosen: false,

			//this property is set by the framework when widget is loaded.
			//name: 'CustomWidget',


			//methods to communication with app container:

			postCreate: function () {
				this.inherited(arguments);
				console.log('postCreate');
				if (registry.byId('Explore Imagery') && registry.byId('Explore Imagery').open) {
					registry.byId('spectralIndexformula').on('change', lang.hitch(this, function (value) {
						if (value !== '') {
							registry.byId("methodMask").removeOption(registry.byId("methodMask").getOptions(5));
							registry.byId("methodMask").addOption({ label: value, value: value });
						}
					}));
				}
			},

			startup: function () {
				this.inherited(arguments);
				console.log('startup');
				domConstruct.place('<img id="loadingSpectralViewer" style="position: absolute;top:0;bottom: 0;left: 0;right: 0;margin:auto;z-index:100;" src="./widgets/ISImageExplorer/images/loading1.gif">', document.getElementById("spectralIndexTemplate"));
				domStyle.set("loadingSpectralViewer", "display", "none");
				on(dom.byId('rftsearchbar'), 'change', lang.hitch(this, function () {
					var rftitems = esriRequest({
						url: "https://www.arcgis.com/sharing/rest/content/groups/69c72a55bb77411c83955d14bee680d8/search",
						content: {
							f: 'json',
							q: dom.byId('rftsearchbar').value !== '' ? dom.byId('rftsearchbar').value + ' & tags: sentinel-2' : 'tags: sentinel-2',
							num: 10,
							sortField: 'title',
							start: 1,
							nextStart: 11

						},
						handleAs: "json",
						callbackParamName: "callback"
					});

					rftitems.then(lang.hitch(this, function (results) {
						this.eachItemClickEvent(results);

						var pages = Math.ceil(results.total / results.num);
						var pagination = document.getElementsByClassName('pagination')[0];
						pagination.innerHTML = "";

						domConstruct.create('a', {
							'id': 'leftarrow',
							'class': 'pagination-buttons',
							'innerHTML': '&laquo;'
						}, pagination, 'last');


						if (pages <= 3) {
							var page_visible = pages;
						} else {
							var page_visible = 3;
						}
						for (var i = 0; i < page_visible; i++) {

							domConstruct.create('a', {
								'class': 'pagination-buttons-pages',
								'innerHTML': i + 1
							}, pagination, 'last');
						}

						domClass.add(document.getElementsByClassName('pagination-buttons-pages')[0], 'active');

						domConstruct.create('a', {
							'id': 'rightarrow',
							'class': 'pagination-buttons',
							'innerHTML': '&raquo;'
						}, pagination, 'last');

						//sets click event for each page click
						for (var i = 0; i < document.getElementsByClassName('pagination-buttons-pages').length; i++) {
							on(document.getElementsByClassName('pagination-buttons-pages')[i], 'click', lang.hitch(this, function (e) {
								this.pagination(e);
							}));
						}

						//sets click event for page arrows
						on(document.getElementsByClassName('pagination-buttons')[0], 'click', lang.hitch(this, function () {
							this.leftarrowpaginate(pages);
						}));

						//sets click event for page arrows
						on(document.getElementsByClassName('pagination-buttons')[1], 'click', lang.hitch(this, function () {
							this.rightarrowpaginate(pages);
						}));

						// if (registry.byId("renderNAME").get("value")) {
						// 	for (let i=0; i<document.getElementsByClassName('individual-items').length; i++) {
						// 		registry.byId("renderNAME").set("value", "");
						// 		document.getElementsByClassName('individual-items')[i].click();
						// 	}
						// }
					}));
					
				}));

				
			},

			onClose: function () {
				console.log('onclose');
				if (!this.rftchosen) {
					if (registry.byId("Explore Imagery") && registry.byId("Explore Imagery").open) {

						registry.byId("layerRendererView").set("value", registry.byId("layerRendererView").getOptions()[0].value);
					} else if (registry.byId("Compare Imagery") && registry.byId("Compare Imagery").open) {
						if (registry.byId('leftLayer').checked) {

							registry.byId("leftLayerRenderer").set("value", registry.byId("leftLayerRenderer").getOptions()[0].value);
						} else {

							registry.byId("rightLayerRenderer").set("value", registry.byId("rightLayerRenderer").getOptions()[0].value);
						}
					}
				}
			},

			onOpen: function () {
				console.log('onOpen');
				// if (registry.byId("Explore Imagery") || registry.byId("Compare Imagery")) {
				// 	this.layer = registry.byId('Explore Imagery') ? this.map.getLayer(registry.byId('layerSelectorView').value) : this.map.getLayer(registry.byId('leftLayerSelector').value);
				// } else {
				// this.layer = this.map.layer;
				// }
				// var x = document.getElementsByClassName("icon-node");
				// for (var i = 0; i < x.length; i++) {
				// 	if (i !== 2) {
				// 		if (domClass.contains(x[i], "jimu-state-selected")) {
				// 			x[i].click();
				// 		}
				// 	}
				// }
				dom.byId('rftsearchbar').value = '';
				if (this.map.primaryLayerChanged === 1 || this.map.secondaryLayerChanged === 1) {
					if (registry.byId("Explore Imagery") && registry.byId("Explore Imagery").open) {
						this.layer = this.map.getLayer(registry.byId('layerSelectorView').value);
					} else if (registry.byId("Compare Imagery") && registry.byId("Compare Imagery").open) {

						this.layer = registry.byId('leftLayer').checked ? this.map.getLayer(registry.byId('leftLayerSelector').value) : this.map.getLayer(registry.byId('rightLayerSelector').value + "_Right");

					}
					if (this.layer.currentVersion < 10.60) {
						domStyle.set('servererror', 'display', '');
						domStyle.set('resultpane_rft', 'display', 'none');
					} else {
						domStyle.set('servererror', 'display', 'none');
						domStyle.set('resultpane_rft', 'display', '');

						var groups = esriRequest({
							url: "https://www.arcgis.com/sharing/rest/content/groups/69c72a55bb77411c83955d14bee680d8/search",
							content: {
								f: 'json',
								q: 'tags: sentinel-2',
								num: 10,
								sortField: 'title',
								start: 1,
								nextStart: 11

							},
							handleAs: "json",
							callbackParamName: "callback"
						});

						groups.then(lang.hitch(this, function (results) {
							//console.log(results);

							this.eachItemClickEvent(results);

							var pages = Math.ceil(results.total / results.num);
							var pagination = document.getElementsByClassName('pagination')[0];
							pagination.innerHTML = "";

							domConstruct.create('a', {
								'id': 'leftarrow',
								'class': 'pagination-buttons',
								'innerHTML': '&laquo;'
							}, pagination, 'last');


							if (pages <= 3) {
								var page_visible = pages;
							} else {
								var page_visible = 3;
							}
							for (var i = 0; i < page_visible; i++) {

								domConstruct.create('a', {
									'class': 'pagination-buttons-pages',
									'innerHTML': i + 1
								}, pagination, 'last');
							}

							domClass.add(document.getElementsByClassName('pagination-buttons-pages')[0], 'active');

							domConstruct.create('a', {
								'id': 'rightarrow',
								'class': 'pagination-buttons',
								'innerHTML': '&raquo;'
							}, pagination, 'last');

							//sets click event for each page click
							for (var i = 0; i < document.getElementsByClassName('pagination-buttons-pages').length; i++) {
								on(document.getElementsByClassName('pagination-buttons-pages')[i], 'click', lang.hitch(this, function (e) {
									this.pagination(e);
								}));
							}

							//sets click event for page arrows
							on(document.getElementsByClassName('pagination-buttons')[0], 'click', lang.hitch(this, function () {
								this.leftarrowpaginate(pages);
							}));

							//sets click event for page arrows
							on(document.getElementsByClassName('pagination-buttons')[1], 'click', lang.hitch(this, function () {
								this.rightarrowpaginate(pages);
							}));

						}), function (error) {
							console.log(error);
						});
					}
					this.map.primaryLayerChanged = 0;
					this.map.secondaryLayerChanged = 0;
				}

				// if (registry.byId("renderNAME").get("value")) {
				// 	dom.byId('rftsearchbar').value = (registry.byId("renderNAME").get("value")).substring(9);
				// 	var event = new Event('change');
				// 	dom.byId('rftsearchbar').dispatchEvent(event);
				// }
			},

			pagination: function (e) {
				var pagenum = Number(e.currentTarget.innerHTML);
				for (var j = 0; j < document.getElementsByClassName('pagination-buttons-pages').length; j++) {
					if (domClass.contains(document.getElementsByClassName('pagination-buttons-pages')[j], 'active')) {
						domClass.remove(document.getElementsByClassName('pagination-buttons-pages')[j], 'active');
					}
				}
				domClass.add(e.currentTarget, 'active');

				var regroup = esriRequest({
					url: "https://www.arcgis.com/sharing/rest/content/groups/69c72a55bb77411c83955d14bee680d8/search",
					content: {
						f: 'json',
						q: 'tags: sentinel-2',
						sortField: 'title',
						num: 10,
						start: ((pagenum * 10) - 9),
						nextStart: ((pagenum * 10) + 1)
					},
					handleAs: "json",
					callbackParamName: "callback"
				});

				regroup.then(lang.hitch(this, function (results) {
					this.eachItemClickEvent(results);
				}))
			},

			leftarrowpaginate: function (pages) {
				for (var i = 0; i < document.getElementsByClassName('pagination-buttons-pages').length; i++) {
					if (domClass.contains(document.getElementsByClassName('pagination-buttons-pages')[i], 'active')) {
						if (i > 0) {
							document.getElementsByClassName('pagination-buttons-pages')[i - 1].click();
							break;

						} else {
							if (pages <= 3) {
								return;
							} else {
								if (Number(document.getElementsByClassName('pagination-buttons-pages')[0].innerHTML) > 1) {
									for (var j = 0; j < document.getElementsByClassName('pagination-buttons-pages').length; j++) {

										document.getElementsByClassName('pagination-buttons-pages')[j].innerHTML = Number(document.getElementsByClassName('pagination-buttons-pages')[j].innerHTML) - 1;

									}
								} else {
									return;
								}
								document.getElementsByClassName('pagination-buttons-pages')[i].click();
								break;
							}
						}
					}
				}
			},

			rightarrowpaginate: function (pages) {
				for (var i = 0; i < document.getElementsByClassName('pagination-buttons-pages').length; i++) {
					if (domClass.contains(document.getElementsByClassName('pagination-buttons-pages')[i], 'active')) {
						if (i < document.getElementsByClassName('pagination-buttons-pages').length - 1) {

							document.getElementsByClassName('pagination-buttons-pages')[i + 1].click();
							break;
						} else {
							if (pages <= 3) {
								return;
							} else {
								if (Number(document.getElementsByClassName('pagination-buttons-pages')[2].innerHTML) < pages) {
									for (var j = 0; j < document.getElementsByClassName('pagination-buttons-pages').length; j++) {

										document.getElementsByClassName('pagination-buttons-pages')[j].innerHTML = Number(document.getElementsByClassName('pagination-buttons-pages')[j].innerHTML) + 1;

									}
								} else {
									return;
								}
								// document.getElementsByClassName('pagination-buttons-pages')[document.getElementsByClassName('pagination-buttons-pages').length-1].click();
								// break;
								document.getElementsByClassName('pagination-buttons-pages')[i].click();
								break;
							}
						}
					}
				}
			},

			eachItemClickEvent: function (results) {
				domConstruct.empty('spectralIndices');
				for (var i = 0; i < results.results.length; i++) {

					domConstruct.create('div', {
						'id': results.results[i].id,
						'class': 'individual-items'
					}, 'spectralIndices', 'last');

					domConstruct.create('img', {
						src: 'https://www.arcgis.com/sharing/rest/content/items/' + results.results[i].id + '/info/' + results.results[i].thumbnail,
						width: '100',
						height: '60',
						style: 'margin-right: 10px;padding-top: 5px;'

					}, results.results[i].id, 'last');

					domConstruct.create('h3', {
						innerHTML: results.results[i].title,
						style: 'display: table-cell;width: 10vw;color: #464646;margin-top: 0;position: relative;vertical-align: middle;'
					}, results.results[i].id);

				}

				//click event for each item listed
				for (var i = 0; i < document.getElementsByClassName('individual-items').length; i++) {
					on(document.getElementsByClassName('individual-items')[i], 'click', lang.hitch(this, function (e) {
						for (var j = 0; j < document.getElementsByClassName('individual-items').length; j++) {
							if (domClass.contains(document.getElementsByClassName('individual-items')[j], 'active')) {
								domClass.remove(document.getElementsByClassName('individual-items')[j], 'active');
							}
						}
						domClass.add(e.currentTarget, 'active');
						domStyle.set('loadingSpectralViewer', 'display', 'block');
						contentId = e.currentTarget.id;
						if (e.currentTarget.textContent.includes('Analytic')) {
							var addtomap = true;
							if (registry.byId('Explore Imagery') && registry.byId('Explore Imagery').open) {
								registry.byId('spectralIndexformula').set("value", e.currentTarget.textContent);
							}
						} else {
							var addtomap = false;
							if (registry.byId('Explore Imagery') && registry.byId('Explore Imagery').open) {
								registry.byId('spectralIndexformula').set("value", '');
							}
						}
						var contentData = esriRequest({
							url: 'https://www.arcgis.com/sharing/rest/content/items/' + contentId + '/data',

							handleAs: 'xml',
							callbackParamName: 'callback'
						});
						contentData.then(lang.hitch(this, function (res) {
							//console.log(res);

							var convertXmlToJson = new Geoprocessor('http://sampleserver6.arcgisonline.com/arcgis/rest/services/Utilities/RasterUtilities/GPServer/ConvertRasterFunctionTemplate');
							var inputparams = {
								"inputRasterFunction": res.documentElement.outerHTML,
								"outputFormat": 'json'
							};
							convertXmlToJson.submitJob(inputparams, lang.hitch(this, function (res) {
								//console.log(res);
								var getjson = esriRequest({
									url: 'http://sampleserver6.arcgisonline.com/arcgis/rest/services/Utilities/RasterUtilities/GPServer/ConvertRasterFunctionTemplate/jobs/' + res.jobId + '/' + res.results.outputRasterFunction.paramUrl,
									content: {
										f: 'json'
									},
									handleAs: 'json',
									callbackParamName: 'callback'
								});
								getjson.then(lang.hitch(this, function (result) {
									//console.log(result);

									var jsontemplate = esriRequest({
										url: result.value.url,
										content: {
											f: 'json'
										},
										handle: 'json',
										callbackParamName: 'callback'
									});
									jsontemplate.then(lang.hitch(this, function (result) {
										//console.log(result);

										// var rftToJson = {
										// 	toJson: function () {
										// 		return result;
										// 	}
										// };
										this.rftchosen = true;
										var rft = new RasterFunction(result);
										if (registry.byId("Explore Imagery") && registry.byId("Explore Imagery").open) {

											this.map.spectralRenderer = rft;

											if (registry.byId("layerRendererView").getOptions('spectralindexvalue')) {
												registry.byId("layerRendererView").removeOption(registry.byId("layerRendererView").getOptions('spectralindexvalue'));
											}
											registry.byId("layerRendererView").addOption({ label: rft.name, value: "spectralindexvalue" });
											registry.byId("layerRendererView").set("value", "spectralindexvalue");
										} else if (registry.byId("Compare Imagery") && registry.byId("Compare Imagery").open) {
											if (registry.byId('leftLayer').checked) {

												this.map.spectralRenderer = rft;

												if (registry.byId("leftLayerRenderer").getOptions('spectralindexvalue')) {
													registry.byId("leftLayerRenderer").removeOption(registry.byId("leftLayerRenderer").getOptions('spectralindexvalue'));
												}
												registry.byId("leftLayerRenderer").addOption({ label: rft.name, value: "spectralindexvalue" });
												registry.byId("leftLayerRenderer").set("value", "spectralindexvalue");
											} else {

												this.map.spectralRendererSec = rft;

												if (registry.byId("rightLayerRenderer").getOptions('spectralindexvalue')) {
													registry.byId("rightLayerRenderer").removeOption(registry.byId("rightLayerRenderer").getOptions('spectralindexvalue'));
												}
												registry.byId("rightLayerRenderer").addOption({ label: rft.name, value: "spectralindexvalue" });
												registry.byId("rightLayerRenderer").set("value", "spectralindexvalue");
											}
										}

										//this.layer.setRenderingRule(rft);
										domStyle.set('loadingSpectralViewer', 'display', 'none');
										document.getElementsByClassName('icon-node')[2].click();

									}), function (error) {
										console.log(error);
									});


								}), function (error) {
									console.log(error);
								});
							}), function (stat) {
								//console.log(stat);
							}, function (err) {
								console.log(err);
							});
						}), function (error) {
							console.log(error);
						});
					}));
				}
			}
		});
	});
//call this file by:
//node startbuild.js load=build profile=app.profile.js
//add load=build, because dojo'build assume the first arg is load=build
var prepareScript = require('./prebuild');

String.prototype.startWith = function(str) {
  if (this.substr(0, str.length) === str) {
    return true;
  } else {
    return false;
  }
};

String.prototype.endWith = function(str) {
  if (this.substr(this.length - str.length, str.length) === str) {
    return true;
  } else {
    return false;
  }
};

prepareScript.setInfo({});
prepareScript.prepare();

// The module to "bootstrap"
var loadModule = "build";

/*global dojoConfig:true*/
// Configuration Object for Dojo Loader:
dojoConfig = {
  baseUrl: "..", // Where we will put our packages
  async: 1, // We want to make sure we are using the "modern" loader
  hasCache: {
    "host-node": 1, // Ensure we "force" the loader into Node.js mode
    "dom": 0 // Ensure that none of the code assumes we have a DOM
  },
  // While it is possible to use config-tlmSiblingOfDojo to tell the
  // loader that your packages share the same root path as the loader,
  // this really isn't always a good idea and it is better to be
  // explicit about our package map.
  packages: [{
    name: "dojo",
    location: "arcgis-js-api/dojo"
  }, {
    name: "build",
    location: "arcgis-js-api/util/build"
  }],
  deps: [loadModule] // And array of modules to load on "boot"
};

// Now load the Dojo loader
require("../arcgis-js-api/dojo/dojo.js");

var utilscripts = require('./utilscripts');
var path = require('path');

/*global __dirname */
var basePath = path.join(__dirname, '..');
utilscripts.cleanApp(path.join(basePath, 'buildOutput/app'));
utilscripts.cleanFilesInAppSource(basePath);
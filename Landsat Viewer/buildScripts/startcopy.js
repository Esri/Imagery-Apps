var copyScript = require('./copyapp');

/*global process*/
//get command line parameter
var _args = process.argv.splice(2);
var args = {};
_args.forEach(function(arg) {
  switch (arg) {
  case "-keepsource":
    args.keepsource = true;
    break;
  case "-fullcopy":
    args.fullcopy = true;
    break;
  }
});
copyScript.copy({}, args);
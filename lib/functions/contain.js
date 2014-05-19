var Base = require("./base");
var Resizer = require("resizer");

var regexp = /^\/(?:contain\/){0,1}([wh])(\d+)\/([wh])(\d+)\/for\/(.+)/;

module.exports = Base.buildFunction(regexp, Resizer.contain, function () {
  return {width: this.width, height: this.height };
});


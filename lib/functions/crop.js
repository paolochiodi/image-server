var Base = require("./base");
var Resizer = require("resizer");

var regexp = /^\/crop\/([wh])(\d+)\/([wh])(\d+)\/for\/(.+)/;

module.exports = Base.buildFunction(regexp, Resizer.crop, function () {
  return { width: this.width, height: this.height };
});


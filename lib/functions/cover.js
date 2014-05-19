var Base = require("./base");
var Resizer = require("resizer");

var regexp = /^\/cover\/([wh])(\d+)\/([wh])(\d+)\/for\/(.+)/;

module.exports = Base.buildFunction(regexp, Resizer.cover, function() {
  return { width: this.width, height: this.height };
});


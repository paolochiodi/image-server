var Base = require("./base");
var Resizer = require("resizer");

var regexp = /^\/([wh])(\d+)\/for\/(.+)/;

module.exports = Base.buildFunction(regexp, Resizer.contain, function() {
  if (this.width) {
    return { width: this.width };
  }
  else {
    return { height: this.height };
  }
});

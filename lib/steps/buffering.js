
var bl = require("bl");

module.exports = function () {
  return function buffering(obj, job, cb) {

    obj.debug("buffering...");

    if (obj.stream) {
      // put the image stream into the callback to process it
      obj.stream = obj.stream.pipe(bl(function(err) {
        cb(err);
      }));
    } else {
      cb();
    }
  };
};

var spawn = require("child_process").spawn;
var BufferList = require('bl');

module.exports = function () {
  return function processor(obj, cb) {

    obj.debug('processing...');

    var func = obj.func,
      debug = obj.debug,
      called = false;

    if (!obj.stream) {
      debug("404");
      cb(404);
      return;
    }

    function cleanup() {
      resizer.removeListener('exit', done);
      resizer.removeListener('error', onerror);
      resizer = null;
    }

    var done = function completed(err) {
      if (err) {
        cleanup();
        return cb(err);
      }

      // we need to be sure that this is called twice
      // so we have all the damn data for sure
      if (called) {
        obj.resized = true;

        obj.stream = obj.outStream.duplicate();

        cleanup();
        cb();
      }

      called = true;
    };

    var onerror = function(err) {
      if (err) {
        debug('Failed conversion of file ' + func.url + ' with message:\n' + err);
      }
      else {
        debug('Failed conversion of file ' + func.url + ' without message');
      }

      done(500);
    };

    obj.outStream = new BufferList(done);

    var resizer = func.resizer();

    resizer.on('exit', done);
    resizer.on('error', onerror);

    obj.stream.pipe(resizer).pipe(obj.outStream);
  };
};

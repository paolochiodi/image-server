module.exports = function () {
  return function mind(obj, job, cb) {
    // if we have a stream, we have already download successfully the resource from S3
    if (obj.stream && obj.originalHeaders["Content-Length"] != 0) {
      obj.jump = true;
      obj.debug("jumping to server");
      job.jumpTo("server");
    } else {
      // otherwise there is no cache enabled or the file is not on S3
      obj.debug(obj.sourceUrl + " => " + obj.func.url);
      obj.sourceUrl = obj.func.url;
    }
    cb();
  };
};

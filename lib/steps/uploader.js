module.exports = function (client) {
  return function uploader(obj, cb) {

    if (!obj.resized) {
      return cb();
    }

    var headers = {},
      dest = obj.func.destPath();

    // compute the mime type so we can store it on S3
    headers['Content-Type'] = obj.func.mimeType;

    // set it public so it easier to debug
    headers['x-amz-acl'] = 'public-read';

    headers['Content-Length'] = obj.outStream.length;

    obj.debug("dest path: " + dest);

    client.putStream(obj.outStream, dest, headers, function (err, res) {
      if (err) {
        obj.debug(err);
        return;
      }

      if (res.statusCode !== 200) {
        obj.debug("Upload to S3 returned code " + res.statusCode + " instead of 200");
      }
    });

    cb();
  };
};

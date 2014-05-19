module.exports = function () {
  return function server(obj, cb) {

    obj.debug('server...');

    // copy the original header to the response
    Object.keys(obj.originalHeaders).forEach(function (header) {
      obj.res.setHeader(header, obj.originalHeaders[header]);
    });

    // set the header of the image converted
    obj.res.setHeader("Content-Type", obj.func.mimeType);
    obj.res.setHeader("Source-URL", obj.sourceUrl);

    // set the correct content-length in order to prevent problems with chrome visualization
    if (obj.stream.length) {
      obj.res.setHeader('Content-Length', obj.stream.length);
    }

    // send the HTTP response to the user
    obj.stream.pipe(obj.res);
    cb();
  };
};

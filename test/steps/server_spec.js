var server = require("../../lib/steps/server");
var debug = require("debug")("serverTest");
var fs = require("fs");
var functions = require("../../lib/functions");
var stream = require('stream');
var bl = require('bl');

describe("server", function () {

  var instance = null,
    obj = null,
    data = null;

  beforeEach(function (done) {
    instance = server();

    var res = new stream.PassThrough();
    res.setHeader = sinon.spy();
    res.getHeader = sinon.spy();

    obj = {
      func: functions.buildProcessingFunction("/w200/h100/for/http://myurl/image.jpg"),
      req: { headers: {}, getHeader: function () {} },
      stream: bl(),
      res:  res,
      debug: debug,
      sourceUrl: "http://path/to/nowhere",
      originalHeaders : { "Cache-Control": "public, max-age=86400" }
    };

    obj.req.on = function () {};

    obj.originalHeaders = {
      "Cache-Control": "public, max-age=86400"
    };

    fs.createReadStream(__dirname + "/../fixtures/mage/image.png")
             .pipe(bl(function (err, buf) {

      data = buf
      obj.stream.append(buf)

      done();
    }));
  });

  it("should pipe the content into the res", function (done) {
    instance(obj, function () {});

    var writable = obj.res.pipe(bl(function () {
      expect(data.toString('hex')).to.eql(writable.toString('hex'));
      done();
    }));
  });

  it("should set a Cache-Control header", function (done) {
    instance(obj, function () {
      expect(obj.res.setHeader).to.have.been.calledWith("Cache-Control", 'public, max-age=86400');
      done();
    });
  });

  it("should set a Content-Type", function (done) {
    instance(obj, function () {
      expect(obj.res.setHeader).to.have.been.calledWith("Content-Type", obj.func.mimeType);
      done();
    });
  });

  it("should set a Content-Length", function (done) {
    instance(obj, function () {
      expect(obj.res.setHeader).to.have.been.calledWith("Content-Length", data.length);
      done();
    });
  });

  it("should set a Source-Url", function (done) {
    instance(obj, function () {
      expect(obj.res.setHeader).to.have.been.calledWith("Source-URL", obj.sourceUrl);
      done();
    });
  });
});


var processor = require("../../lib/steps/processor");
var functions = require("../../lib/functions");
var fs = require("fs");
var debug = require("debug")("processorTest");
var stream = require("stream");
var gm = require("gm");
var assert = require("assert");

describe("processor", function () {

  var instance = null;
  var func = null;
  var obj = null;
  var job = null;

  beforeEach(function () {
    instance = processor();
    func = functions.buildProcessingFunction("/w200/for/http://myurl/image.png");
    obj = {
      func: func,
      sourceUrl: "http://a/source/url",
      destPath: process.cwd() + "/temp/123",
      debug: debug,
      stream: new stream.PassThrough()
    };
    fs.createReadStream(__dirname + "/../fixtures/mage/image.png").pipe(obj.stream);
  });

  afterEach(function (done) {
    fs.unlink(obj.destPath, function () {
      done();
    });
  });

  it("should process the image if it does not change the extension", function (done) {
    instance(obj, function () {
       gm(obj.outStream, obj.destPath)
         .identify(function (err, data) {
            if (err) {
              return done(err);
            }

            assert.equal(data.format, "PNG");
            assert.equal(data.Geometry, "200x20");
            done();
        });
    });
  });

  it("should process the image if it does change the extension", function (done) {
    func = functions.buildProcessingFunction("/w200/for/http://myurl/image.bmp");
    obj.func = func;

    instance(obj, function () {
      gm(obj.outStream, obj.destPath)
        .identify(function (err, data) {
          if (err) {
            return done(err);
          }
          assert.equal(data.format, "JPEG");
          assert.equal(data.Geometry, "200x20");
          done();
        });
    });
  });

  it("should pass an error if there was no original", function (done) {
    obj.stream = null;
    instance(obj, function (err) {
      expect(err).to.be.equal(404);
      done();
    });
  });
});

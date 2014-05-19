
var mind = require("../../lib/steps/mind");
var functions = require("../../lib/functions");
var debug = require("debug")("mindTest");

describe("mind", function() {

  var instance = null;
  var func = null;
  var obj = null;
  var job = null;

  beforeEach(function () {
    instance = mind();
    func = functions.buildProcessingFunction("/w200/h100/for/http://myurl/image.jpg");
    obj = {
      func: func,
      sourceUrl: "http://a/source/url",
      debug: debug,
      originalHeaders: {}
    };
    job = {
      jumpTo: function () {}
    };
  });

  it("should change the sourceUrl to origin if no stream exists", function (done) {
    instance(obj, job, function () {
      expect(obj).to.have.property("sourceUrl", "http://myurl/image.jpg");
      done();
    });
  });

  it("should jump to \"server\" if a source stream exists", function (done) {
    obj.stream = {};
    obj.originalHeaders["Content-Length"] = 42;
    var spy = sinon.spy(job, "jumpTo");
    instance(obj, job, function () {
      expect(spy).to.have.been.calledWith("server");
      done();
    });
  });

  it("should not jump to \"server\" if the data is empty", function (done) {
    obj.stream = {};
    obj.originalHeaders["Content-Length"] = 0;
    var spy = sinon.spy(job, "jumpTo");
    instance(obj, job, function () {
      expect(spy).not.to.have.been.calledWith("server");
      done();
    });
  });

  it("should not jump to \"server\" if the data if the content length is '0'", function (done) {
    obj.stream = {};
    obj.originalHeaders["Content-Length"] = '0';
    var spy = sinon.spy(job, "jumpTo");
    instance(obj, job, function () {
      expect(spy).not.to.have.been.calledWith("server");
      done();
    });
  });
});

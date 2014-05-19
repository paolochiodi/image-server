var Base = require("../../lib/functions/base");

util = require('util');
expect = require('chai').expect;
sinon = require('sinon');

describe("functions.Base", function () {

  it("should set the property width", function () {
    var instance = new Base(200, 100, "http://path/to/an/image");
    expect(instance).to.have.property("width", 200);
  });

  it("should set the property height", function () {
    var instance = new Base(200, 100, "http://path/to/an/image");
    expect(instance).to.have.property("height", 100);
  });

  it("should set the property url", function () {
    var instance = new Base(200, 100, "http://path/to/an/image");
    expect(instance).to.have.property("url", "http://path/to/an/image");
  });

  it("should remove dangling query parameters", function () {
    var instance = new Base(200, 100, "http://path/to/an/image?123456");
    expect(instance).to.have.property("url", "http://path/to/an/image");
  });

  it("should set the property width (bis)", function () {
    var instance = new Base(300, 100, "http://path/to/an/image");
    expect(instance).to.have.property("width", 300);
  });

  it("should set the property height (bis)", function () {
    var instance = new Base(200, 200, "http://path/to/an/image");
    expect(instance).to.have.property("height", 200);
  });

  it("should set the property url (bis)", function () {
    var instance = new Base(200, 100, "http://host/a.jpg");
    expect(instance).to.have.property("url", "http://host/a.jpg");
  });

  it("should set correct resizer options", function() {
    var instance = new Base(500, 300, "http://host/a.jpg");
    sinon.stub(instance, "descendantOptions").returns({width: 100, height: 200});
    var options = instance.resizerOptions();

    expect(options).to.have.property("width", 100);
    expect(options).to.have.property("height", 200);
    expect(options).to.have.property("convertTo", "jpg");
  });

  it("should change the format to jpg if it is a bmp", function () {
    var instance = new Base(500, 300, "http://host/a.bmp");
    expect(instance.resizerOptions().convertTo).to.equal("jpg");
  });

  it("should not keep the format if it is a jpg", function () {
    var instance = new Base(500, 300, "http://host/a.jpg");
    expect(instance.resizerOptions().convertTo).to.equal("jpg");
  });


  it("should not change the format to jpg if it is a png", function () {
    var instance = new Base(500, 300, "http://host/a.png");
    expect(instance.resizerOptions().convertTo).to.equal("png");
  });

  it("should not change the format to jpg if it is a gif", function () {
    var instance = new Base(500, 300, "http://host/a.gif");
    expect(instance.resizerOptions().convertTo).to.equal("gif");
  });

  var regexp = /^\/crop\/([wh])(\d+)\/([wh])(\d+)\/for\/(.*)/;
  it("should handle the URL /crop/w200/h100/for/http://myurl/image.jpg", function () {
    expect(Base.regexpGenerate(Base, regexp,"/crop/w200/h100/for/http://myurl/image.jpg")).to.exist;
  });

  it("should not handle the URL /crop/w200/w100/for/http://myurl/image.jpg", function () {
    expect(Base.regexpGenerate(Base, regexp,"/crop/w200/w100/for/http://myurl/image.jpg")).to.not.exist;
  });

  it("should create a new Crop with the right width with /crop/w200/h100/for/http://myurl/image.jpg", function () {
    var crop = Base.regexpGenerate(Base, regexp,"/crop/w200/h100/for/http://myurl/image.jpg");
    expect(crop.width).to.equal(200);
  });

  it("should create a new Crop with the right height with /crop/w200/h100/for/http://myurl/image.jpg", function () {
    var crop = Base.regexpGenerate(Base, regexp,"/crop/w200/h100/for/http://myurl/image.jpg");
    expect(crop.height).to.equal(100);
  });

  it("should create a new Crop with the right URL with /crop/w200/h100/for/http://myurl/image.jpg", function () {
    var crop = Base.regexpGenerate(Base, regexp,"/crop/w200/h100/for/http://myurl/image.jpg");
    expect(crop.url).to.equal("http://myurl/image.jpg");
  });

  it("should not handle the URL /w200/h100/for/http://myurl/image.jpg", function () {
    expect(Base.regexpGenerate(Base, regexp,"/w200/h100/for/http://myurl/image.jpg")).to.not.exist;
  });

  it("should not handle the URL /cover/w200/h100/for/http://myurl/image.jpg", function () {
    expect(Base.regexpGenerate(Base, regexp,"/cover/w200/h100/for/http://myurl/image.jpg")).to.not.exist;
  });

  it("should not handle the URL /contain/w200/h100/for/http://myurl/image.jpg", function () {
    expect(Base.regexpGenerate(Base, regexp,"/contain/w200/h100/for/http://myurl/image.jpg")).to.not.exist;
  });

  it("should not handle the URL /h100/for/http://myurl/image.jpg", function() {
    expect(Base.regexpGenerate(Base, regexp,"/h100/for/http://myurl/image.jpg")).to.not.exist;
  });

  it("should not handle the URL /w100/for/http://myurl/image.jpg", function() {
    expect(Base.regexpGenerate(Base, regexp,"/w100/for/http://myurl/image.jpg")).to.not.exist;
  });

  it("should provide the dest path that is only chars, digits lives under 'resizes'", function() {
    var instance = new Base(200, 100, "http://path/to/an/image");
    expect(instance.destPath()).to.match(/^resizes\/[0-9A-z]+/);
  });

  it("should provide a dest path that changes based on the descendantOptions", function() {
    var instance = new Base(200, 100, "http://path/to/an/image");
    var first = instance.destPath();

    sinon.stub(instance, "descendantOptions").returns({ width: 100, height: 100});
    expect(instance.destPath()).not.to.equal(first);
  });

  it("should provide a dest path that changes based on the resizerFunction", function() {
    var instance = new Base(200, 100, "http://path/to/an/image");
    var first = instance.destPath();

    sinon.stub(instance, "resizerFunction").returns(function cover(){});
    expect(instance.destPath()).not.to.equal(first);
  });

  it("should build a function that works", function() {
    var regexp = /^\/(?:contain\/){0,1}([wh])(\d+)\/([wh])(\d+)\/for\/(.*)/;
    var klass = Base.buildFunction(regexp, function () {}, function() {
      return {width: this.width, height: this.height};
    });

    var instance = klass.generate("/w100/h100/for/http://host/a.jpg");
    var options = instance.resizerOptions();

    expect(options).to.have.property("width", 100);
    expect(options).to.have.property("height", 100);
    expect(options).to.have.property("convertTo", "jpg");
  });

  it("should compute the mime type correctly for a png", function() {
    var instance = new Base(200, 100, "http://path/to/an/image.png");
    expect(instance).to.have.property("mimeType", "image/png");
  });

  it("should compute the mime type correctly for a jpg", function() {
    var instance = new Base(200, 100, "http://path/to/an/image.jpg");
    expect(instance).to.have.property("mimeType", "image/jpeg");
  });

  it("should compute the mime type correctly for a gif", function() {
    var instance = new Base(200, 100, "http://path/to/an/image.gif");
    expect(instance).to.have.property("mimeType", "image/gif");
  });

  it("should change the mime type to a jpg if it is a bmp", function() {
    var instance = new Base(200, 100, "http://path/to/an/image.bmp");
    expect(instance).to.have.property("mimeType", "image/jpeg");
  });

  it("should change the mime type to a jpg if it is unknown", function() {
    var instance = new Base(200, 100, "http://path/to/an/image");
    expect(instance).to.have.property("mimeType", "image/jpeg");
  });

  it("should rewrite http:/image/path into http://image/path", function() {
    var instance = new Base(200, 100, "http:/image/path");
    expect(instance).to.have.property("url", "http://image/path");
  });

  it("should rewrite https:/image/path into https://image/path", function() {
    var instance = new Base(200, 100, "https:/image/path");
    expect(instance).to.have.property("url", "https://image/path");
  });
});

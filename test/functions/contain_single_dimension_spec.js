var ContainSingleDimension = require("../../lib/functions/contain_single_dimension");
var Base = require("../../lib/functions/base");

describe("functions.ContainSingleDimension", function() {

  var regexp = ContainSingleDimension.regexp;
  it("should delegate the generate method to base", function() {
    sinon.stub(Base, "regexpGenerate").withArgs(ContainSingleDimension, regexp,"/an/url").returns("hello world");
    expect(ContainSingleDimension.generate("/an/url")).to.equal("hello world");
    Base.regexpGenerate.restore();
  });

  it("should not handle the URL /w200/h100/for/http://myurl/image.jpg", function() {
    expect(ContainSingleDimension.generate("/w200/h100/for/http://myurl/image.jpg")).to.not.exist;
  });

  it("should not handle the URL /h100/for/", function() {
    expect(ContainSingleDimension.generate("/h100/for/")).to.not.exist;
  });

  it("should handle the URL /h100/for/http://myurl/image.jpg", function() {
    expect(ContainSingleDimension.generate("/h100/for/http://myurl/image.jpg")).to.exist;
  });

  describe("instance", function() {
    beforeEach(function() {
      this.instance = new ContainSingleDimension(200, 200, "http://path/to/an/image.jpg");
    });

    it("should be an instance of Base", function() {
      expect(this.instance).to.be.an.instanceof(Base);
    });

    it("should set the resizerFunction correctly", function() {
      var instance = new ContainSingleDimension(null, 300, "http://host/a.jpg");
      expect(instance.resizerFunction).to.equal(require('resizer').contain);
    });

    it("should generate the descendantOptions correctly", function() {
      var instance = new ContainSingleDimension(null, 300, "http://host/a.jpg");
      expect(instance.descendantOptions()).to.deep.equal({ height: 300 });
    });

    it("should generate the descendantOptions correctly (bis)", function() {
      var instance = new ContainSingleDimension(200, null, "http://host/a.jpg");
      expect(instance.descendantOptions()).to.deep.equal({ width: 200 });
    });
  });
});

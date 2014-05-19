var Cover = require("../../lib/functions/cover");
var Base = require("../../lib/functions/base");

describe("functions.Cover", function() {

  var regexp = Cover.regexp;
  it("should delegate the generate method to base", function() {
    sinon.stub(Base, "regexpGenerate").withArgs(Cover, regexp,"/an/url").returns("hello world");
    expect(Cover.generate("/an/url")).to.equal("hello world");
    Base.regexpGenerate.restore();
  });

  it("should handle the URL /cover/w200/h100/for/http://myurl/image.jpg", function() {
    expect(Cover.generate("/cover/w200/h100/for/http://myurl/image.jpg")).to.exist;
  });

  it("should not handle the URL /cover/w200/h100/for/", function() {
    expect(Cover.generate("/cover/w200/h100/for/")).not.to.exist;
  });

  describe("instance", function() {
    beforeEach(function() {
      this.instance = new Cover(200, 200, "http://path/to/an/image.jpg");
    });

    it("should be an instance of Base", function() {
      expect(this.instance).to.be.an.instanceof(Base);
    });

    it("should generate the descendantParameters correctly", function() {
      var instance = new Cover(500, 300, "http://host/a.jpg");
      expect(instance.resizerFunction).to.equal(require("resizer").cover);
    });

    it("should generate the descendantOptions correctly", function() {
      var instance = new Cover(500, 300, "http://host/a.jpg");
      expect(instance.descendantOptions()).to.deep.equal({ width: 500, height: 300 });
    });

    it("should generate the descendantOptions correctly (bis)", function() {
      var instance = new Cover(200, 100, "http://host/a.jpg");
      expect(instance.descendantOptions()).to.deep.equal({ width: 200, height: 100 });
    });
  });
});

var Contain = require("../../lib/functions/contain");
var Base = require("../../lib/functions/base");

describe("functions.Contain", function() {

  var regexp = Contain.regexp;
  it("should delegate the generate method to base", function() {
    sinon.stub(Base, "regexpGenerate").withArgs(Contain, regexp,"/an/url").returns("hello world");
    expect(Contain.generate("/an/url")).to.equal("hello world");
    Base.regexpGenerate.restore();
  });

  it("should handle the URL /w200/h100/for/http://myurl/image.jpg", function() {
    expect(Contain.generate("/w200/h100/for/http://myurl/image.jpg")).to.exist;
  });

  it("should not handle the URL /w200/h100/for/", function() {
    expect(Contain.generate("/w200/h100/for/")).not.to.exist;
  });

  it("should not handle the URL /h100/for/http://myurl/image.jpg", function() {
    expect(Contain.generate("/h100/for/http://myurl/image.jpg")).to.not.exist;
  });

  describe("instance", function() {
    beforeEach(function() {
      this.instance = new Contain(200, 200, "http://path/to/an/image.jpg");
    });

    it("should be an instance of Base", function() {
      expect(this.instance).to.be.an.instanceof(Base);
    });

    it("should set the resizerFunction correctly", function() {
      var instance = new Contain(500, 300, "http://host/a.jpg");
      expect(instance.resizerFunction).to.equal(require("resizer").contain);
    });

    it("should generate the descendantOptions correctly", function() {
      var instance = new Contain(500, 300, "http://host/a.jpg");
      expect(instance.descendantOptions()).to.deep.equal({ width: 500, height: 300 });
    });


    it("should generate the descendantOptions correctly (bis)", function() {
      var instance = new Contain(200, 100, "http://host/a.jpg");
      expect(instance.descendantOptions()).to.deep.equal({ width: 200, height: 100 });
    });
  });
});

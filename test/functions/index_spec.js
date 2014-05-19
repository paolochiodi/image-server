
var functions = require("../../lib/functions");

describe("functions", function() {
  beforeEach(function() {
    this.sandbox = sinon.sandbox.create();
  });

  afterEach(function() {
    this.sandbox.restore();
  });

  it("should calls generate on all classes", function() {
    var that = this;
    var spies = functions.all.map(function(e) {
      return that.sandbox.spy(e, "generate");
    });

    functions.buildProcessingFunction("/an/url");

    spies.forEach(function(s) {
      expect(s.calledOnce).to.be.true;
    });
  });

  it("should throw an exception if more than one class return something", function() {
    var that = this;
    var stubs = functions.all.map(function(e) {
      var stub = that.sandbox.stub(e, "generate");
      stub.returns({});
      return stub;
    });

    expect(functions.buildProcessingFunction.bind(functions, "/an/url")).
      throw(Error);
  });

  it("should return the first element that generates", function() {
    var that = this;
    var stubs = functions.all.map(function(e) {
      return that.sandbox.stub(e, "generate");
    });

    stubs[1].returns({ an: "object" });

    expect(functions.buildProcessingFunction("/an/url")).to.deep.equal({ an: "object" });
  });
});

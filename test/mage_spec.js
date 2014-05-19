
var Mage = require("../lib/mage");
var kanban = require("kanban");
var steps = require("../lib/steps");
var functions = require("../lib/functions");
var connect = require("connect");
var hyperquest = require("hyperquest");
var EventEmitter = require("events").EventEmitter;

describe("Mage", function () {

  var instance = null;
  var sandbox = null;
  var opts = null;
  var client = null;

  beforeEach(function () {
    sandbox = sinon.sandbox.create();
    client = {
      putStream: function (stream, filename, headers, cb) {
        cb(null, { statusCode: 200 });
      }
    };
    opts = { bucket: "myBucket", client: client };
    instance = new Mage(opts);
  });

  afterEach(function () {
    sandbox.restore();
  });

  it("should exists", function () {
    expect(instance).to.not.be.null;
  });

  it("should include a board", function () {
    expect(instance.board).to.be.instanceof(kanban.Board);
  });

  it("should add seven steps into the board", function () {
    // there are 8 steps because one is the backlog
    expect(instance.board.steps.length - 1).to.be.equal(7);
  });

  it("should add only five steps into the board if the cacheOnS3 option is set to false", function () {
    instance = new Mage({ cacheOnS3: false });
    // there are 5 steps because one is the backlog
    expect(instance.board.steps.length - 1).to.be.equal(6);
  });

  it("should not include the first downloader step if the cacheOnS3 option is set to false", function () {
    instance = new Mage({ cacheOnS3: false });
    // there are 7 steps because one is the backlog
    expect(instance.board.steps[1]).to.have.property("name", "mind");
  });

  it("should store the opts", function () {
    expect(instance).to.have.property("opts", opts);
  });

  describe("board building", function () {

    var stepsNames = ["backlog", "downloader", "mind", "downloader", "buffering", "processor", "server", "uploader"];

    stepsNames.forEach(function (step, index) {
      if (step === "backlog") {
        return;
      }

      it("should set a " + step + " in " + index + " position", function () {
        expect(instance.board.steps[index]).to.have.property("name", step);
      });

      it("should set a " + step + " that has a function which is returned by the steps builder", function () {
        var spy = sandbox.spy(steps, step);
        instance = new Mage();
        expect(spy).to.have.been.calledOnce;
        expect(instance.board.steps[index]._func).to.equal(spy.getCall(0).returnValue);
      });
    });

    it("should set the wip of the processor to 1 by default", function () {
      // the processor is in position 5
      expect(instance.board.steps[5].wip).to.eql(1);
    });

    it("should let the wip of the processor to be configurable", function () {
      instance = new Mage({ parallelism: 42 });
      // the processor is in position 4
      expect(instance.board.steps[5].wip).to.eql(42);
    });

    it("should pass an S3 client to the uploader step", function () {
      var spy = sandbox.spy(steps, "uploader");
      var client = {};
      instance = new Mage({ client: client });
      expect(spy).to.have.been.calledWith(client);
    });

    it("should set a default timeout of 15 seconds for the processor function", function () {
      expect(instance.board.steps[5]._timeout).to.equal(15 * 1000);
    });

    it("should set a custom timeout for the processor function", function () {
      opts = { bucket: "myBucket", client: client, processorTimeout: 1000 };
      instance = new Mage(opts);
      expect(instance.board.steps[5]._timeout).to.equal(1000);
    });

    it("should set a default maxSockets of 15 for the downloader function", function () {
      var spy = sandbox.spy(steps, "downloader");
      instance = new Mage({});
      expect(spy.args[0][0].maxSockets).to.equal(15);
    });

    it("should set a custom maxSockets for the downloader function", function () {
      var spy = sandbox.spy(steps, "downloader");
      instance = new Mage({ maxSockets: 3});
      expect(spy.args[0][0].maxSockets).to.equal(3);
    });

  });

  describe("connect middleware", function () {

    var app = null;
    var baseUrl = null;

    var fixtureServer = null;
    var fixtureServerUrl = null;
    var fixtureServerPort = null;

    before(function (done) {
      var port = nextPort();
      fixtureServerPort = port;

      var app = connect().
        use(connect.static(__dirname + "/fixtures/mage"));

      fixtureServerUrl = "http://localhost:" + port + "/image.png";

      fixtureServer = app.listen(port, done);
    });

    after(function (done) {
      fixtureServer.close(done);
    });

    beforeEach(function (done) {
      app = connect();
      app.use(instance.middleware())
         .use(function (err, req, res, next) {
        if(err) {
          res.statusCode = 500;
          res.end();
          return;
        }
        next();
      });

      var port = nextPort();
      baseUrl = "http://localhost:" + port;
      app = app.listen(port, done);
    });

    afterEach(function (done) {
      app.close(done);
    });

    it("should handle double slashes at the beginning", function (done) {
      var req = hyperquest(baseUrl + "//w200/for/" + fixtureServerUrl, {}, function (err, res) {
        expect(res.statusCode).to.eql(200);
        done();
      });
    });

    it("should handle double slashes in the middle", function (done) {
      var req = hyperquest(baseUrl + "/w200//for/" + fixtureServerUrl, {}, function (err, res) {
        expect(res).to.have.property("statusCode", 200);
        done();
      });
    });

    it("should filter based on pattern (failure)", function (done) {
      instance.opts.pattern = "http://another/host";
      var req = hyperquest(baseUrl + "/w200//for/" + fixtureServerUrl, {}, function (err, res) {
        expect(res).to.have.property("statusCode", 403);
        done();
      });
    });

    it("should filter based on pattern (success)", function (done) {
      instance.opts.pattern = "http://localhost:" + fixtureServerPort + "/**/*";
      var req = hyperquest(baseUrl + "/w200//for/" + fixtureServerUrl, {}, function (err, res) {
        expect(res).to.have.property("statusCode", 200);
        done();
      });
    });

    it("should return a 500 if something goes wrong", function (done) {
      sandbox.stub(instance.board.steps[5], "_func", function (obj, job, cb) {
        cb(new Error("something went wrong"));
      });
      hyperquest(baseUrl + "/w200/for/" + fixtureServerUrl, {}, function (err, res) {
        expect(res).to.have.property("statusCode", 500);
        done();
      });
    });

    it("should return a 404 if a wrong url is passed", function (done) {
      hyperquest(baseUrl + "/blabla", {}, function (err, res) {
        expect(res).to.have.property("statusCode", 404);
        done();
      });
    });

    it("should return a 404 if a missing file is passed", function (done) {
      hyperquest(baseUrl + "/w200/for/" + fixtureServerUrl + "ahah", {}, function (err, res) {
        expect(res).to.have.property("statusCode", 404);
        done();
      });
    });

    function jobPropertyTest(desc, cb, before) {
      it(desc, function (done) {
        if (before) {
          before();
        }

        // avoid the board totally
        var lastJob = null;
        instance.board.insert = function (job, callback) {
          lastJob = job;
          callback();
          job.res.end();
        };

        var insertSpy = sandbox.spy(instance.board, "insert");
        var processingSpy = sandbox.spy(functions, "buildProcessingFunction");
        var req = hyperquest(baseUrl + "/w200/for/" + fixtureServerUrl, {}, function () {
          expect(lastJob).to.be.defined;
          var func = processingSpy.getCall(0).returnValue;
          cb(lastJob, func);
          done();
        });
      });
    }

    jobPropertyTest("should insert the request object in the board", function (job) {
      expect(job).to.have.property("req");
    });

    jobPropertyTest("should insert the response object in the board", function (job) {
      expect(job).to.have.property("res");
    });

    jobPropertyTest("should insert the processing function in the board", function (job, func) {
      expect(job).to.have.property("func", func);
    });

    jobPropertyTest("should insert the sourceUrl in the board", function (job, func) {
      expect(job).to.have.property("sourceUrl", "http://s3.amazonaws.com/myBucket/" +  func.destPath());
    });

    jobPropertyTest("should insert the sourceUrl in the board using another region", function (job, func) {
      expect(job).to.have.property("sourceUrl", "http://s3-eu.amazonaws.com/myBucket/" +  func.destPath());
    }, function () {
      instance.opts.region = "eu";
    });
  });
});

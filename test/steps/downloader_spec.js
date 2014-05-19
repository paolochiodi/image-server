
var downloader = require("../../lib/steps/downloader");

var connect = require('connect');
var https = require('https');
var http = require('http');
var fs = require('fs');
var async = require("async");
var debug = require("debug")("downloaderTest");
var bl = require("bl");

var httpsOptions = {
  key: fs.readFileSync('test/fixtures/key.pem'),
  cert: fs.readFileSync('test/fixtures/certificate.pem')
};

// to get rid of ssl error
// see https://github.com/joyent/node/issues/4984
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

describe("downloader", function() {

  var httpPort = nextPort();
  var httpsPort = nextPort();
  var instance = null;
  var servers = [];

  before(function (done) {

    instance = downloader({timeout: 20});

    var that = this;
    var app = connect().
      use(connect.static(__dirname + "/../fixtures/forward"));

    var httpServer = http.createServer(app);
    var httpsServer = https.createServer(httpsOptions, app);
    async.parallel([
      httpServer.listen.bind(httpServer, httpPort),
      httpsServer.listen.bind(httpsServer, httpsPort)
    ], done);
  });

  after(function(done) {
    var that = this;
    async.parallel(servers.map(function (s) {
      return function (cb) {
        s.close(cb);
      };
    }), done);
  });

  function fetchAndTest(url, done) {
    var destPath = process.cwd() + "/temp/first";
    var obj = { sourceUrl: url, debug: debug };
    instance(obj, function(err) {
      if (err) {
        return done(err);
      }
      obj.stream.pipe(bl(function(err, data)  {
        expect(data.toString()).to.be.equal("foobar\n");
        done();
      }));
    });
  }

  it("should download the source from http and put it in a stream", function(done) {
    fetchAndTest("http://localhost:" + httpPort + "/first", done);
  });

  it("should download the source from https and put it in a stream", function(done) {
    fetchAndTest("https://localhost:" + httpsPort + "/first", done);
  });

  it("should retry on ECONNREFUSED", function(done) {
    var newPort = nextPort();
    fetchAndTest("http://localhost:" + newPort + "/first", done);

    setTimeout(function () {
      var app = connect().
        use(connect.static(__dirname + "/../fixtures/forward"));
      var httpServer = http.createServer(app);
      httpServer.listen(newPort);
    }, 10);
  });

  it("should retry on timeout", function(done) {
    var newPort = nextPort();
    var firstTime = true;

    var wait = function(req, res, next) {
      if(firstTime) {
        firstTime = false;
        // do nothing, let request timeout
        return;
      }

      next();
    };

    var app = connect().
      use(wait).
      use(connect.static(__dirname + "/../fixtures/forward"));

    var httpServer = http.createServer(app);
    httpServer.listen(newPort);

    fetchAndTest("http://localhost:" + newPort + "/first", done);
  });
});

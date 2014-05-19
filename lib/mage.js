
var kanban = require("kanban");
var steps = require("./steps");
var functions = require("./functions");
var baseDebug = require("debug")("imageserver");
var minimatch = require("minimatch");

function Mage(opts) {
  opts = opts || {};
  opts.parallelism = opts.parallelism || 1;
  opts.maxSockets = opts.maxSockets || 15;
  opts.downloaderTimeout = opts.downloaderTimeout || 5000;

  if (opts.cacheOnS3 === undefined) {
    opts.cacheOnS3 = true;
  }

  this.opts = opts;

  // the kanban board allows you to define steps to be exectued sequencially
  this.board = new kanban.Board();

  var downloader = steps.downloader({ timeout: opts.downloaderTimeout, maxSockets: opts.maxSockets });

  // here are defined the steps of the application

  // if the cache is enabled, let's check whether the resource is already on S3 first
  if (opts.cacheOnS3) {
    this.board.defineStep("downloader", downloader);
  }

  // in mind we will check if the resource has been downloaded, otherwise we download it from the source
  this.board.defineStep("mind", steps.mind());
  this.board.defineStep("downloader", downloader);
  this.board.defineStep("buffering", steps.buffering());
  // wip are the workers that will execute in parallel
  this.board.defineStep("processor", { wip: opts.parallelism, timeout: opts.processorTimeout || (15 * 1000) }, steps.processor());
  this.board.defineStep("server", steps.server());
  this.board.defineStep("uploader", steps.uploader(opts.client));
}
module.exports = Mage;

Mage.prototype.middleware = function () {
  var board = this.board,
    opts = this.opts;

  return function (req, res, next) {
    // unique identifier for this request, makes log easier to read
    var reqId = req.headers['x-request-id'];
    var debug;

    if (reqId !== null && reqId !== undefined) {
      debug = function(msg) {
        baseDebug("[" + reqId + "] " + msg);
      };
    }
    else {
      debug = baseDebug;
    }

    // this handles the incoming URLs
    var func = functions.buildProcessingFunction(req.url.replace(/(?!https{0,1}:)\/\//, "/"));

    debug("Received request for URL: " + req.url);

    if (func === undefined || func === null) {
      next();
      return;
    }

    // if it's not an allowed URL, return 403
    // the pattern is used to prevent that an image not allowed is processed (i.e. one not of the client)
    if (opts.pattern && !minimatch(func.url, opts.pattern)) {
      res.statusCode = 403;
      res.end();
      return;
    }

    var regionPrefix = "s3";

    if (opts.region !== undefined && opts.region !== null) {
      regionPrefix = "s3-" + opts.region;
    }

    var resizedUrl = "http://" + regionPrefix + ".amazonaws.com/" + opts.bucket + "/" + func.destPath();

    debug("The resized URL is " + resizedUrl);

    var obj = {
      func: func,
      sourceUrl: resizedUrl,
      req: req,
      res: res,
      debug: debug
    };

    board.insert(obj, function (err) {
      if (err && !res.headersSent) {
        if (typeof err === 'number') {

          if (err === 404) {
            // ignore the error if the pipeline
            // decides it is 404
            next();
          } else {
            // return that statusCode instead
            res.statusCode = err;
            res.end();
            return;
          }
        } else {
          next(err);
        }
        return;
      }
    });
  };
};

"use strict";

var backoff = require('backoff');

var url = require('url');
var http = require('http');
var https = require('https');

module.exports = function (opts) {
  if (!opts) {
    opts = {};
  }

  var DownloaderAgentHttp = new http.Agent();
  DownloaderAgentHttp.maxSockets = opts.maxSockets || 15;

  var DownloaderAgentHttps = new https.Agent();
  DownloaderAgentHttps.maxSockets = opts.maxSockets || 15;

  // downloads the image to resize and create a stream with it
  return function downloader(obj, cb) {

    var debug = obj.debug,
      exponentialBackoff = backoff.exponential({
        randomisationFactor: 0,
        initialDelay: 1,
        maxDelay: 5000
      });

    debug('Downloading...');

    exponentialBackoff.on('ready', function (number, delay) {
      var req = null, completed = false,
          timeout, cleanup, error, response,
          abortedRequestError, abortedRequestCleanup,
          timer;

      cleanup = function () {
        if (timer) {
          clearTimeout(timer);
        }

        req.removeListener('error', error);
        req.removeListener('response', response);
        req = null;
      };

      timeout = function () {
        if (obj.stream) {
          // ignore, we cannot do more
        } else {
          debug("backoff for " + obj.sourceUrl + " because of timeout");

          req.removeListener('error', error);
          req.removeListener('response', response);

          req.on('error', abortedRequestError);
          req.on('end', abortedRequestCleanup);

          req.abort();

          exponentialBackoff.backoff();
        }
      };

      error = function (err) {
        cleanup();

        if (!completed) {
          // if we have not completed the step
          // we can backoff
          debug("backoff for " + obj.sourceUrl + " because of " + err.code);
          exponentialBackoff.backoff();
        } else {
          if (obj.stream) {
            debug("the source errored, closing downstream for " + obj.sourceUrl);
            // we are closing the stream,
            // we cannot do more
            obj.stream.end();
            obj.stream.emit("error", err);
          }
        }
      };

      response = function (res) {
        debug("status code " + res.statusCode + " for " + obj.sourceUrl);
        completed = true;
        if (res.statusCode === 200) {
          obj.originalHeaders = res.headers;
          obj.stream = res;
        }
        else {
          req.abort();
        }

        cleanup();
        cb();
      };

      abortedRequestError = function (err) {
        debug("error on aborted request:" + err);
        abortedRequestCleanup();
      };

      abortedRequestCleanup = function () {
        debug("aborted request cleanup");
        req.removeListener('error', abortedRequestError);
        req.removeListener('end', abortedRequestCleanup);
        req = null;
      };


      var u = url.parse(obj.sourceUrl);
      var protocol = u.protocol || '';

      var reqOpts = {
        scheme: protocol.replace(/:$/, ''),
        host: u.hostname,
        port: Number(u.port) || (protocol === 'https:' ? 443 : 80),
        path: u.path,
        agent: protocol === 'https:' ? DownloaderAgentHttps : DownloaderAgentHttp
      };

      var iface = protocol === 'https:' ? https : http;
      req = iface.get(reqOpts);
      req.on('error', error);
      req.on('response', response);

      timer = setTimeout(timeout, opts.timeout || 5000);
    });

    exponentialBackoff.on('fail', function () {
      cb("impossible to download" + obj.sourceUrl);
    });

    exponentialBackoff.backoff();
  };
};

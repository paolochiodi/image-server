#! /usr/bin/env node

// curl http://localhost:3000//w90/for/http://www.logotypes101.com/logos/755/6C6C997C421ED4073E95E25E43BF51B0/ciaode.png

if(process.env.NEW_RELIC_LICENSE_KEY) {
  require('newrelic');
}

if(process.env.LONGJOHN === 'enable') {
  require("longjohn");
}

var connect = require("connect");
var Mage = require("./lib/mage");
var errormailer = require("errormailer");
var nodemailer = require("nodemailer");
var domain = require("domain").create();
var knox = require("knox");

var mailTransport = nodemailer.createTransport("SMTP", {
  service: 'Sendgrid', // use well known service
  auth: {
    user: process.env.SENDGRID_USERNAME,
    pass: process.env.SENDGRID_PASSWORD
  }
});

var errorHandler = errormailer(mailTransport, {
  from: process.env.ERRORMAIL_FROM,
  to: process.env.ERRORMAIL_TO,
  subject: process.env.ERRORMAIL_SUBJECT
});

var cacheOnS3 = true;
if (process.env.CACHE_ON_S3 === "disable") {
  cacheOnS3 = false;
}

domain.on("error", errorHandler);

var client = knox.createClient({
  key: process.env.AWS_KEY,
  secret: process.env.AWS_SECRET,
  bucket: process.env.S3_BUCKET
});

var mage = new Mage({
  client: client,
  parallelism: parseInt(process.env.PARALLELISM, 10),
  cacheOnS3: cacheOnS3,
  bucket: process.env.S3_BUCKET,
  pattern: process.env.PATTERN,
  processorTimeout: parseInt(process.env.PROCESSOR_TIMEOUT, 10),
  downloaderTimeout: parseInt(process.env.DOWNLOADER_TIMEOUT, 10),
  maxSockets: parseInt(process.env.MAX_SOCKETS, 10)
});

domain.run(function () {
  var app = connect()

    // logging is for pros
    .use(connect.logger('dev'))

    // parsing the querystring
    .use(connect.query());


  if (process.env.ENABLE_ERROR_PATH === 'true') {

    // send an email to verify if there is an error
    app.use(function(req, res, next) {
      if(req.url === "/" + (process.env.ERROR_PATH || "test-error")) {
        throw new Error("This is a test");
      }

      next();
    });

  }

  app
    // doing the image magick :)
    // every URL request is handled by the middleware
    .use(mage.middleware())

    // sending emails in case of errors
    .use(errorHandler)

    .listen(process.env.PORT || 3000);
});

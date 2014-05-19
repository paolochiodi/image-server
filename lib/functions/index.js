
var files = ["./contain", "./contain_single_dimension", "./cover", "./crop"];
module.exports.all = files.map(function (e) { return require(e); });

function exists(obj) {
  return obj !== undefined && obj !== null;
}

module.exports.buildProcessingFunction = function (url) {
  return this.all.map(function (f) {
    // first we generate all the URLs
    return f.generate(url);
  }).reduce(function (processingFunction, e) {
    // then we check if there is a bug, and we do not
    // know what function to apply
    if (exists(processingFunction) && exists(e)) {
      throw new Error("There should not be two factories that generates a processing function");
    }
    return processingFunction || e;
  });
};


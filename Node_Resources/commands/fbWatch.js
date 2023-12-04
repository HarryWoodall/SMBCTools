const fs = require("fs");
const open = require("open");

let workDirectory;

module.exports = function (args, res) {
  console.log(`watching ${wkDir}/form-builder-json/DSL...`);

  const wkDir = args.pop();

  workDirectory = wkDir;

  fs.watch(`${wkDir}/form-builder-json/DSL`, (eventType, fileName) => {
    console.log(eventType);
    console.log(fileName);
  });
};

function watchFile() {}

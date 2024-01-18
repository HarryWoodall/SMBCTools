const fs = require("fs");
const chokidar = require("chokidar");

module.exports = function (args, res) {
  const wkDir = args.pop();
  const flag = args.pop();

  console.log(`watching ${wkDir}/form-builder-json/DSL...`);
  if (flag == "-f") console.log(`addresses will be faked`);
  console.log("");

  workDirectory = wkDir;

  chokidar.watch(`${wkDir}/form-builder-json/DSL`).on("all", (event, filePath) => {
    if (event == "change") {
      const fileName = filePath.split("\\").at(-1);
      console.log(`${filePath} updated`);

      if (fs.existsSync(`${wkDir}/form-builder/src/DSL/${fileName}`)) {
        try {
          console.log(`${fileName} found in form-builder, updating file...`);
          fs.copyFileSync(filePath, `${wkDir}/form-builder/src/DSL/${fileName}`);

          if (flag == "-f") {
            console.log("faking addresses");
            fakeAddresses(`${wkDir}/form-builder/src/DSL/${fileName}`);
          }

          console.log(`update complete \n`);
        } catch (err) {
          console.log(err);
        }
      }
    }
  });
};

const fakeAddresses = (fileName) => {
  fs.readFile(fileName, "utf8", function (err, data) {
    let addressSearch = '"AddressProvider": "CRM"';
    let addressReplace = '"AddressProvider": "Fake"';

    let streetSearch = '"StreetProvider": "CRM"';
    let streetReplace = '"StreetProvider": "Fake"';

    let addressRegex = new RegExp(addressSearch, "gm");
    data = data.replace(addressRegex, addressReplace);

    let streetRegex = new RegExp(streetSearch, "gm");
    data = data.replace(streetRegex, streetReplace);

    fs.writeFile(fileName, data, "utf8", function (err) {
      if (err) return console.log(err);
    });
  });
};

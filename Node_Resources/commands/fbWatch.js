const fs = require("fs");
const chokidar = require("chokidar");

module.exports = async function (args, res) {
  const wkDir = args.pop();
  const flags = args;
  let serverAvailable = false;

  console.log(`watching ${wkDir}/form-builder-json/DSL...`);

  if (flags.includes("-f")) console.log(`addresses will be faked`);

  if (flags.includes("-server")) {
    console.log("...checking server");

    try {
      const res = await fetch("http://localhost:3000/ping");
      if (res.status == 200) {
        console.log("server ready");
        serverAvailable = true;
      }
    } catch (err) {
      console.log("server unavailable");
    }
  }

  console.log("");

  workDirectory = wkDir;

  chokidar.watch(`${wkDir}/form-builder-json/DSL`).on("all", async (event, filePath) => {
    if (event == "change") {
      const fileName = filePath.split("\\").at(-1);
      console.log(`${filePath} updated`);

      if (fs.existsSync(`${wkDir}/form-builder/src/DSL/${fileName}`)) {
        try {
          console.log(`${fileName} found in form-builder, updating file...`);
          fs.copyFileSync(filePath, `${wkDir}/form-builder/src/DSL/${fileName}`);

          if (flags.includes("-f")) {
            console.log("faking addresses");
            fakeAddresses(`${wkDir}/form-builder/src/DSL/${fileName}`);
          }

          if (serverAvailable) {
            try {
              const res = await fetch("http://localhost:3000/updateForm", {
                headers: {
                  Accept: "application/json",
                  "Content-Type": "application/json",
                },
                method: "POST",
                body: fs.readFileSync(`${wkDir}/form-builder/src/DSL/${fileName}`, { encoding: "utf8", flag: "r" }),
              });

              if (res.status == 200) {
                const data = await res.json();
                console.log(data);
              }
            } catch (error) {
              console.log(error);
            }
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

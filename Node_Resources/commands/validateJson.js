const fs = require("fs");
const colors = require("../colors");

module.exports = function (args, res) {
  if (args.length !== 2) {
    console.log("Please input 1 argument");
    return;
  }

  if (args[0].toLowerCase() == "help") {
    displayHelp();
    return;
  }

  let form = args[0];
  const wkDir = args[1];

  if (form.slice(-5) !== ".json") form += ".json";
  const fileSource = `${wkDir}/form-builder-json/v2/${form}`;

  try {
    if (fs.existsSync(fileSource)) {
      let file = fs.readFileSync(fileSource).toString().trim();
      let form = JSON.parse(file);
      let questionIds = [];
      let duplicates = [];
      let nullValues = [];
      for (let page of form.Pages) {
        for (let element of page.Elements) {
          const questionId = element.Properties[Object.keys(element.Properties).find((key) => key.toLowerCase() === "questionId".toLowerCase())];

          if (questionId) {
            if (questionId == "") {
              nullValues.push(questionId);
            } else if (questionIds.includes(questionId)) {
              duplicates.push(questionId);
            } else {
              questionIds.push(questionId);
            }
          }
        }
      }

      console.log("Duplicate ids: ", duplicates);
      console.log("Empty ids: ", nullValues);
    } else {
      console.log(`File ${form} not found`);
    }
  } catch (err) {
    console.error(err);
  }
};

function displayHelp() {
  console.log(`
    validate ${colors.COMMAND}<form-name>${colors.RESET}

    Validates the JSON file, checks for:
      - Duplicate ids
      - Empty ids`);
}

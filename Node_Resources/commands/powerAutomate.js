const fs = require("fs");
const open = require("open");

let workDirectory;
let modifier;

module.exports = function (args, res) {
  if (args.length < 2) {
    console.log("Please give atleast 1 argument");
    return;
  }
  const wkDir = args.pop();
  let formName = args.pop();
  modifier = args.pop();

  workDirectory = wkDir;

  if (formName.slice(-5) !== ".json") formName += ".json";
  const fileSource = `${wkDir}/form-builder-json/DSL/${formName}`;

  try {
    if (fs.existsSync(fileSource)) {
      let file = fs.readFileSync(fileSource).toString().trim();
      let form = JSON.parse(file);

      const pages = form[Object.keys(form).find((key) => key.toLowerCase() === "pages")];

      let elementArray = [];
      pages.forEach((page) => {
        elementArray = convertPageElements(page, elementArray);
      });

      fs.writeFileSync(`${res}/powerAutomateOutput.txt`, JSON.stringify(elementArray, null, 2));
      open(`${res}/powerAutomateOutput.txt`);
    } else {
      console.log(`File ${formName} not found`);
    }
  } catch (err) {
    console.error(err);
  }
};

function convertPageElements(page, array) {
  const elements = page[Object.keys(page).find((key) => key.toLowerCase() === "elements")];

  elements.forEach((element) => {
    result = {};
    let type = element[Object.keys(element).find((key) => key.toLowerCase() === "type")];
    const properties = element[Object.keys(element).find((key) => key.toLowerCase() === "properties")];
    const questionid = properties[Object.keys(properties).find((key) => key.toLowerCase() === "questionid")];
    const label = properties[Object.keys(properties).find((key) => key.toLowerCase() === "label")];

    if (type.toLowerCase() == "reusable") {
      const ref = element[Object.keys(element).find((key) => key.toLowerCase() === "elementref")];
      const refElement = JSON.parse(fs.readFileSync(`${workDirectory}/form-builder-json/Elements/${ref}.json`).toString().trim());
      type = refElement[Object.keys(refElement).find((key) => key.toLowerCase() === "type")];
    }

    if (questionid) {
      if (modifier == "-labels" && label) {
        array = createArrayObjects(array, type, questionid, label);
      } else {
        array = createArrayObjects(array, type, questionid);
      }
    }
  });

  return array;
}

function createArrayObjects(array, type, questionid, label = null) {
  const result = {};
  let value;
  switch (type.toUpperCase()) {
    case "ADDRESS":
    case "STREET":
      value = `@{triggerBody()?['${questionid}']?['SelectedAddress']} @{triggerBody()?['${questionid}']?['AddressLine1']} @{triggerBody()?['${questionid}']?['AddressLine2']} @{triggerBody()?['${questionid}']?['Town']} @{triggerBody()?['${questionid}']?['Postcode']}`;
      break;
    case "DATEPICKER":
    case "DATEINPUT":
      value = `@{formatDateTime(triggerBody()['${questionid}'], 'dd/MM/yyyy')}`;
      break;
    default:
      value = `@{triggerBody()?['${questionid}']}`;
      break;
  }

  result["Key"] = label ? label : formatQuestionId(questionid);
  result["Value"] = value;
  array.push(result);

  return array; // Maybe not needed
}

function formatQuestionId(id) {
  let formattedString = "";

  [...id].forEach((char, index) => {
    if (index == 0) {
      formattedString += char.toUpperCase();
    } else if (char == char.toUpperCase()) {
      formattedString += ` ${char.toLowerCase()}`;
    } else {
      formattedString += char;
    }
  });
  return formattedString;
}

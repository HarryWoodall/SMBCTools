const fs = require("fs");
const open = require("open");

const ignoredTypes = ["summary"];

let workDirectory;

module.exports = function (args, res) {
  if (args.length < 2) {
    console.log("Please give atleast 1 argument");
    return;
  }
  const wkDir = args.pop();
  let formName = args.pop();

  workDirectory = wkDir;

  if (formName.slice(-5) !== ".json") formName += ".json";
  const fileSource = `${wkDir}/form-builder-json/v2/${formName}`;

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
    let properties;
    let questionid;
    let summaryLabel;
    if (element[Object.keys(element).find((key) => key.toLowerCase() === "type")].toLowerCase() == "reusable") {
      properties = element[Object.keys(element).find((key) => key.toLowerCase() === "properties")];
      questionid = properties[Object.keys(properties).find((key) => key.toLowerCase() === "questionid")];
      summaryLabel = properties[Object.keys(properties).find((key) => key.toLowerCase() === "summarylabel")];

      const ref = element[Object.keys(element).find((key) => key.toLowerCase() === "elementref")];
      const refElement = JSON.parse(fs.readFileSync(`${workDirectory}/form-builder-json/Elements/${ref}.json`).toString().trim());

      element = refElement;
    }

    let type = element[Object.keys(element).find((key) => key.toLowerCase() === "type")];
    if (!ignoredTypes.includes(type.toLowerCase())) {
      properties = element[Object.keys(element).find((key) => key.toLowerCase() === "properties")];
      questionid = questionid || properties[Object.keys(properties).find((key) => key.toLowerCase() === "questionid")];
      summaryLabel = summaryLabel || properties[Object.keys(properties).find((key) => key.toLowerCase() === "summarylabel")];

      let label = properties[Object.keys(properties).find((key) => key.toLowerCase() === "label")];

      if (element[Object.keys(element).find((key) => key.toLowerCase() == "type")].toLowerCase() == "address" && !label) {
        label = page[Object.keys(page).find((key) => key.toLowerCase() === "title")];
      }

      if (summaryLabel) label = summaryLabel;

      if (questionid) {
        array = appendArrayObjects(array, type, questionid, label);
      }
    }
  });

  return array;
}

function appendArrayObjects(array, type, questionid, label) {
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

  result["Key"] = label || formatQuestionId(questionid);
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

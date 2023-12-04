const fs = require("fs");
const open = require("open");

let workDirectory;

module.exports = function (args, res) {
  console.log("Cypress template");
  if (args.length < 2) {
    console.log("Please give atleast 1 argument");
    return;
  }

  const wkDir = args.pop();
  let formName = args.pop();

  workDirectory = wkDir;

  if (formName.slice(-5) !== ".json") formName += ".json";
  const fileSource = `${wkDir}/form-builder-json/DSL/${formName}`;

  try {
    if (fs.existsSync(fileSource)) {
      let file = fs.readFileSync(fileSource).toString().trim();
      let form = JSON.parse(file);

      const baseUrl = form[Object.keys(form).find((key) => key.toLowerCase() === "baseurl")];
      const pages = form[Object.keys(form).find((key) => key.toLowerCase() === "pages")];

      let template = `cy.visit(\"${baseUrl}\");\r\n`;

      pages.forEach((page, index) => {
        template += createPageItems(page, index, baseUrl);
      });

      fs.writeFileSync(`${res}/cypressTemplate.txt`, template);
      open(`${res}/cypressTemplate.txt`);
    } else {
      console.log(`File ${form} not found`);
    }
  } catch (err) {
    console.error(err);
  }
};

function createPageItems(page, index, baseUrl) {
  const pageSlug = page[Object.keys(page).find((key) => key.toLowerCase() === "pageslug")];
  const elements = page[Object.keys(page).find((key) => key.toLowerCase() === "elements")];
  const title = page[Object.keys(page).find((key) => key.toLowerCase() === "title")];

  let template = `/*\r\n * ${title}\r\n */\r\n`;
  if (index > 0) template += `cy.location("pathname").should("eq", "/${baseUrl}/${pageSlug}");\r\n`;

  elements.forEach((element) => {
    let type = element[Object.keys(element).find((key) => key.toLowerCase() === "type")];
    const properties = element[Object.keys(element).find((key) => key.toLowerCase() === "properties")];
    const questionid = properties[Object.keys(properties).find((key) => key.toLowerCase() === "questionid")];
    const isOptional = properties[Object.keys(properties).find((key) => key.toLowerCase() === "optional")];
    const options = properties[Object.keys(properties).find((key) => key.toLowerCase() === "options")];

    if (type.toLowerCase() == "reusable") {
      const ref = element[Object.keys(element).find((key) => key.toLowerCase() === "elementref")];
      const refElement = JSON.parse(fs.readFileSync(`${workDirectory}/form-builder-json/Elements/${ref}.json`).toString().trim());
      type = refElement[Object.keys(refElement).find((key) => key.toLowerCase() === "type")];
    }

    if (questionid) template += getter(type, questionid);
    if (questionid && type) template += ` //${type}${options ? ` [${options.length} options]` : ""}${isOptional ? " (Optional)" : ""}\r\n`;
  });

  template += " \r\n\r\n";
  return template;
}

function getter(type, id) {
  switch (type.toLowerCase()) {
    case "radio":
      return `cy.get('[type="radio"]')`;
    default:
      return `cy.get("#${id}")`;
  }
}

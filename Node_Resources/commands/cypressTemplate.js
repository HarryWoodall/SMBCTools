const fs = require("fs");
const open = require("open");

let workDirectory;
let totalPages = -1;

class FormElement {
  constructor(element) {
    this.type = element[Object.keys(element).find((key) => key.toLowerCase() === "type")];
    this.properties = element[Object.keys(element).find((key) => key.toLowerCase() === "properties")];
    this.questionid = this.properties[Object.keys(this.properties).find((key) => key.toLowerCase() === "questionid")];
    this.isOptional = this.properties[Object.keys(this.properties).find((key) => key.toLowerCase() === "optional")];
    this.isConditional = this.properties[Object.keys(this.properties).find((key) => key.toLowerCase() === "isconditionalelement")];
    this.options = this.properties[Object.keys(this.properties).find((key) => key.toLowerCase() === "options")];
    this.addAnotherElements = this.properties[Object.keys(this.properties).find((key) => key.toLowerCase() === "elements")];

    if (this.type.toLowerCase() == "reusable") {
      this.ref = element[Object.keys(element).find((key) => key.toLowerCase() === "elementref")];
      this.refElement = JSON.parse(fs.readFileSync(`${workDirectory}/form-builder-json/Elements/${this.ref}.json`).toString().trim());
      this.type = this.refElement[Object.keys(this.refElement).find((key) => key.toLowerCase() === "type")];
    }
  }
}

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
      totalPages = pages.length;

      let template = `import { clickContinue } from '../../HelperFunctions/HelperFunctions.spec'\r\n\r\n`;
      template += `describe('${formName}', () => {\r\n`;
      template += `\tit('ROUTE NAME', () => {\r\n`;

      template += `\t\tcy.visit(\"${baseUrl}\");\r\n`;

      pages.forEach((page, index) => {
        template += createPageItems(page, index, baseUrl);
      });

      template += `\t})\r\n})`;

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

  let template = ``;
  if (index > 0) template += `\t\tcy.location("pathname").should("eq", "/${baseUrl}/${pageSlug}");\r\n`;

  elements.forEach((element) => {
    const rootElement = new FormElement(element);

    // if (questionid) template += getter(type, questionid);
    if (rootElement.questionid && rootElement.type) {
      template += `\t\t// ${rootElement.questionid} -- ${rootElement.type}`;

      if (rootElement.options) {
        const optionList = rootElement.options.map((option) => {
          const value = option[Object.keys(option).find((key) => key.toLowerCase() === "value")];
          let conditionalElement = option[Object.keys(option).find((key) => key.toLowerCase() === "conditionalelementid")];
          conditionalElement = conditionalElement ? `{${conditionalElement}}` : "";

          return `${value} ${conditionalElement}`;
        });

        template += `${rootElement.options ? `(${rootElement.options.length}) [${optionList.join(", ")}]` : ""}`;
      }

      template += `${rootElement.isOptional ? " (Optional)" : ""}`;
      template += `${rootElement.isConditional ? " (Conditional)" : ""}`;

      if (rootElement.addAnotherElements) {
        template += "\r\n";
        rootElement.addAnotherElements.forEach((anotherElement) => {
          const addAnotherElement = new FormElement(anotherElement);

          if (addAnotherElement.questionid && addAnotherElement.type) {
            template += `\t\t//\t- ${addAnotherElement.questionid} -- ${addAnotherElement.type}`;

            if (addAnotherElement.options) {
              const optionList = addAnotherElement.options.map((option) => {
                const value = option[Object.keys(option).find((key) => key.toLowerCase() === "value")];
                let conditionalElement = option[Object.keys(option).find((key) => key.toLowerCase() === "conditionalelementid")];
                conditionalElement = conditionalElement ? `{${conditionalElement}}` : "";

                return `${value} ${conditionalElement}`;
              });

              template += `${addAnotherElement.options ? `(${addAnotherElement.options.length}) [${optionList.join(", ")}]` : ""}`;
            }

            template += `${rootElement.isOptional ? " (Optional)" : ""}`;
            template += `${rootElement.isConditional ? " (Conditional)" : ""}`;
            template += "\r\n";
          }
        });
      }

      template += "\r\n";
    }
  });

  if (totalPages > 0 && index < totalPages - 1) template += "\t\tclickContinue()";

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

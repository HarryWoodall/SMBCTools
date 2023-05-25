const fs = require("fs");
const open = require("open");

module.exports = function (args, res) {
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

      const baseURL = form[Object.keys(form).find((key) => key.toLowerCase() === "baseurl")];
      const pages = form[Object.keys(form).find((key) => key.toLowerCase() === "pages")];

      let template = `cy.visit('/${baseURL}');\r\n`;

      pages.forEach((page, index) => {
        template += createPageTemplate(page, index, baseURL);
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

function createPageTemplate(page, index, baseURL) {
  const pageSlug = page[Object.keys(page).find((key) => key.toLowerCase() === "pageslug")];
  const elements = page[Object.keys(page).find((key) => key.toLowerCase() === "elements")];

  let template = "";

  if (index > 0) {
    template += `cy.location('pathname').should('eq', '/${baseURL}/${pageSlug}')\r\n`;
  }

  elements.forEach((element) => {
    let type = element[Object.keys(element).find((key) => key.toLowerCase() === "type")];
    const properties = element[Object.keys(element).find((key) => key.toLowerCase() === "properties")];
    const questionid = properties[Object.keys(properties).find((key) => key.toLowerCase() === "questionid")];
    const isOptional = properties[Object.keys(properties).find((key) => key.toLowerCase() === "optional")];

    if (questionid) {
      if (type.toLowerCase() == "reusable") {
        const ref = element[Object.keys(element).find((key) => key.toLowerCase() === "elementref")];
        template += `// ${questionid} -- [${ref} (Reusable)]${isOptional ? "--Optional" : ""} ${elementDetails(template, properties, type)}\r\n`
      } else {
        template += `// ${questionid} -- [${type}]${isOptional ? "--Optional" : ""} ${elementDetails(template, properties, type)}\r\n`
      }
    }

    // if (questionid) ids.push(questionid);
    // if (questionid && type) types.push(type);
    // if (questionid && type && isOptional) optionalList.push(isOptional);
  });

  // ids.forEach((id) => {
  //   template += `${id}<br>`;
  // });

  // template += "";

  // types.forEach((type, index) => {
  //   template += `${type}${optionalList[index] ? " **(Optional)**" : ""}<br>`;
  // });

  template += " \r\n";
  return template;
}

function elementDetails(template, properties, type) {
  switch (type.toLowerCase()){
    case "radio":
      const options = properties[Object.keys(properties).find((key) => key.toLowerCase() === "options")];
      return `${options.length} options`
    default:
      return "";
  }
}

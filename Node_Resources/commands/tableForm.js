const fs = require("fs");
const open = require("open");

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
  const fileSource = `${wkDir}/form-builder-json/DSL/${formName}`;

  try {
    if (fs.existsSync(fileSource)) {
      let file = fs.readFileSync(fileSource).toString().trim();
      let form = JSON.parse(file);

      const pages = form[Object.keys(form).find((key) => key.toLowerCase() === "pages")];
      let markdown = "| Page Slug | Elements | Type |\r\n| --- | --- | --- |\r\n";

      pages.forEach((page) => {
        markdown += createElements(page);
      });

      fs.writeFileSync(`${res}/exampleOutput.md`, markdown);
      open(`${res}/exampleOutput.md`);
    } else {
      console.log(`File ${fileSource} not found`);
    }
  } catch (err) {
    console.error(err);
  }
};

function createElements(page) {
  const pageSlug = page[Object.keys(page).find((key) => key.toLowerCase() === "pageslug")];
  const elements = page[Object.keys(page).find((key) => key.toLowerCase() === "elements")];
  const ids = [];
  const types = [];
  const optionalList = [];

  let markdown = `| ${pageSlug} | `;

  elements.forEach((element) => {
    let type = element[Object.keys(element).find((key) => key.toLowerCase() === "type")];
    const properties = element[Object.keys(element).find((key) => key.toLowerCase() === "properties")];
    const questionid = properties[Object.keys(properties).find((key) => key.toLowerCase() === "questionid")];
    const isOptional = properties[Object.keys(properties).find((key) => key.toLowerCase() === "optional")];

    if (type.toLowerCase() == "reusable") {
      const ref = element[Object.keys(element).find((key) => key.toLowerCase() === "elementref")];
      const refElement = JSON.parse(fs.readFileSync(`${workDirectory}/form-builder-json/Elements/${ref}.json`).toString().trim());
      type = refElement[Object.keys(refElement).find((key) => key.toLowerCase() === "type")];
    }

    if (questionid) ids.push(questionid);
    if (questionid && type) types.push(type);
    if (questionid && type && isOptional) optionalList.push(isOptional);
  });

  ids.forEach((id) => {
    markdown += `${id}<br>`;
  });

  markdown += " | ";

  types.forEach((type, index) => {
    markdown += `${type}${optionalList[index] ? " **(Optional)**" : ""}<br>`;
  });

  markdown += " |\r\n";
  return markdown;
}

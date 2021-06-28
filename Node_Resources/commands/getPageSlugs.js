const fs = require("fs");
const colors = require("../colors");
const open = require("open");

let resources;

module.exports = function (args, res) {
  if (args.length < 1) {
    console.log("Please input altleast 1 argument");
    return;
  }

  resources = res;

  if (args[0].toLowerCase() == "help") {
    displayHelp();
    return;
  }

  const wkDir = args.pop();
  let form = args.pop();
  const modifier = args.pop();

  if (form.slice(-5) !== ".json") form += ".json";
  const fileSource = `${wkDir}/form-builder-json/v2/${form}`;

  try {
    if (fs.existsSync(fileSource)) {
      let file = fs.readFileSync(fileSource).toString().trim();
      let form = JSON.parse(file);
      let idPageMap = {};

      console.log();
      for (let page of form.Pages) {
        buildMap(page, idPageMap);
        if (modifier == "-s" || modifier == "-routes" || modifier == "-e") console.log();
        console.log(`${page.PageSlug}`);
        if (modifier == "-e") displayElements(page);
        if (modifier == "-routes") displayRoute(page, idPageMap);
      }
    } else {
      console.log(`File ${form} not found`);
    }
  } catch (err) {
    console.error(err);
  }
};

function displayRoute(page, map) {
  if (page.Behaviours) {
    page.Behaviours.forEach((behaviour, index) => {
      const pageSlug = page[Object.keys(page).find((key) => key.toLowerCase() === "pageslug")];
      const behaviourSlug = behaviour[Object.keys(behaviour).find((key) => key.toLowerCase() === "pageslug")];

      if (behaviour.conditions && behaviour.conditions.length == 1) {
        const condition = behaviour.conditions[0];
        const questionId = condition[Object.keys(condition).find((key) => key.toLowerCase() === "questionId".toLowerCase())];
        const conditionType = condition[Object.keys(condition).find((key) => key.toLowerCase() === "conditionType".toLowerCase())];
        const comparisonValue = condition[Object.keys(condition).find((key) => key.toLowerCase() === "comparisonValue".toLowerCase())];

        console.log(
          `  if ${colors.ROUTE_QUESTIONID}${questionId}${colors.ROUTE_PAGE_SLUG}${map[questionId] !== pageSlug ? "[" + map[questionId] + "]" : ""} ${
            colors.ROUTE_CONDITION_TYPE
          }${conditionType} ${colors.ROUTE_COMPARISON_VALUE}${comparisonValue}${colors.RESET}`
        );
        console.log(`    ${colors.ROUTE_BEHAVIOUR_TYPE}${behaviour.behaviourType}${colors.RESET} ${behaviourSlug}`);
        if (index < page.Behaviours.length - 1) console.log();
      } else {
        console.log(`  ${colors.ROUTE_BEHAVIOUR_TYPE}${behaviour.behaviourType}${colors.RESET} ${behaviourSlug}`);
      }
    });
    console.log();
  }
}

function buildMap(page, map) {
  if (page.Elements)
    page.Elements.forEach((element) => {
      const properties = element[Object.keys(element).find((key) => key.toLowerCase() === "properties")];
      let questionId;
      if (properties) questionId = properties[Object.keys(properties).find((key) => key.toLowerCase() === "questionid")];

      if (questionId) map[questionId] = page.PageSlug;
    });
}

function displayElements(page) {
  page.Elements.forEach((element) => {
    const questionId = element.Properties[Object.keys(element.Properties).find((key) => key.toLowerCase() === "questionid")];
    if (questionId) console.log(`    ${questionId}`);
  });
}

function displayHelp() {
  console.log(`
    slugs ${colors.MODIFIER}<?modifier>${colors.RESET} ${colors.COMMAND}<form-name>${colors.RESET} 

    Outputs all page slugs of the JSON file,

    Can be modified with: 
      ${colors.MODIFIER}-s${colors.RESET} to add linebreaks
      ${colors.MODIFIER}-e${colors.RESET} to show element questionIds
      ${colors.MODIFIER}-routes${colors.RESET} to show links to other pages (with conditions)
      `);
}

const fs = require("fs");
const colors = require("../colors");
const open = require("open");

let resources;

module.exports = function (args, res) {
  if (args.length !== 2) {
    console.log("Please input 1 argument");
    return;
  }

  resources = res;

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

      generateFlow(form.Pages, form.FormName, form.FirstPageSlug);
    } else {
      console.log(`File ${form} not found`);
    }
  } catch (err) {
    console.error(err);
  }
};

async function generateFlow(pages, name, startPage) {
  console.log("generation routes");
  let content = "# " + name + "\n```mermaid\ngraph TB\n";
  content += `START(( )) --> ${startPage}\n`;

  for (let page of pages) {
    content = addFlow(page, content, pages, startPage);
    // return;
  }

  content += "classDef missing fill:#999, stroke:#000, color:gray;\n";
  content += "classDef dangling fill:#db7d30, stroke:#eee, color: white;\n";
  content += "```\n";
  try {
    fs.writeFileSync(`${resources}/formRoute.md`, content);
    await open(`${resources}/formRoute.md`);
  } catch (err) {
    console.error(err);
  }
}

function addFlow(page, content, pages, startPage) {
  if (page.Behaviours) {
    page.Behaviours.forEach((behaviour, index) => {
      const pageSlug =
        behaviour[Object.keys(behaviour).find((key) => key.toLowerCase() === "behaviourtype")].toLowerCase() == "submitform"
          ? "success"
          : behaviour[Object.keys(behaviour).find((key) => key.toLowerCase() === "pageslug")];

      if (behaviour.conditions && behaviour.conditions.length == 1) {
        const condition = behaviour.conditions[0];
        const questionId = condition[Object.keys(condition).find((key) => key.toLowerCase() === "questionid")];
        const conditionType = condition[Object.keys(condition).find((key) => key.toLowerCase() === "conditiontype")];
        const comparisonValue = condition[Object.keys(condition).find((key) => key.toLowerCase() === "comparisonvalue")];

        content += `${cleanPageSlug(page.PageSlug)}${
          !isPointedTo(pages, startPage, page.PageSlug) ? ":::dangling" : ""
        } -- ${questionId}<br>${conditionType}<br>${comparisonValue} --> ${cleanPageSlug(pageSlug)}${!hasPage(pages, pageSlug) ? ":::missing" : ""}\n`;
      } else {
        content += `${cleanPageSlug(page.PageSlug)}${!isPointedTo(pages, startPage, page.PageSlug) ? ":::dangling" : ""} --> ${cleanPageSlug(pageSlug)}${
          !hasPage(pages, pageSlug) ? ":::missing" : ""
        }\n`;
      }
    });
  }

  return content;
}

function hasPage(pages, slug) {
  for (let page of pages) {
    if (page.PageSlug == slug) return true;
  }

  console.log(`${colors.HIGH_PRIORITY}ERROR${colors.RESET}: page ${colors.ROUTE_PAGE_SLUG}${slug}${colors.RESET} doesn't exist`);
  return false;
}

function isPointedTo(pages, startPage, slug) {
  if (startPage == slug) return true;

  for (let page of pages) {
    if (page.Behaviours) {
      for (let i = 0; i < page.Behaviours.length; i++) {
        const pageSlug =
          page.Behaviours[i][Object.keys(page.Behaviours[i]).find((key) => key.toLowerCase() === "behaviourtype")].toLowerCase() == "submitform"
            ? "success"
            : page.Behaviours[i][Object.keys(page.Behaviours[i]).find((key) => key.toLowerCase() === "pageslug")];

        if (pageSlug == slug) {
          return true;
        }
      }
    }
  }

  console.log(`${colors.MED_PRIORITY}WARNING${colors.RESET}: page ${colors.ROUTE_PAGE_SLUG}${slug}${colors.RESET} is inaccessible`);
  return false;
}

function cleanPageSlug(slug) {
  return slug.replace(/-end/g, "-ends");
}

function displayHelp() {
  console.log(`
    validate ${colors.COMMAND}<form-name>${colors.RESET}

    Validates the JSON file, checks for:
      - Duplicate ids
      - Empty ids`);
}

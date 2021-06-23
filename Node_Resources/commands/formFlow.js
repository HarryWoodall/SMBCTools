const fs = require("fs");
const colors = require("../colors");
const open = require("open");

let resources;
const pageMap = {};
const reachablePages = [];
const errorPages = [];
const warningPages = [];

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

      buildPageMap(form.Pages);
      buildReachableMap(pageMap[form.FirstPageSlug]);

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
    page.Behaviours.forEach((behaviour) => {
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
          !isPointedTo(startPage, page.PageSlug) ? ":::dangling" : ""
        } -- ${questionId}<br>${conditionType}<br>${comparisonValue} --> ${cleanPageSlug(pageSlug)}${!isPointedTo(startPage, pageSlug) ? ":::dangling" : ""}${
          !hasPage(pageSlug) ? ":::missing" : ""
        }\n`;
      } else {
        content += `${cleanPageSlug(page.PageSlug)}${!isPointedTo(startPage, page.PageSlug) ? ":::dangling" : ""} --> ${cleanPageSlug(pageSlug)}${
          !isPointedTo(startPage, pageSlug) ? ":::dangling" : ""
        }${!hasPage(pageSlug) ? ":::missing" : ""}\n`;
      }
    });
  }

  return content;
}

function hasPage(slug) {
  if (pageMap[slug]) return true;

  if (!errorPages.includes(slug)) {
    warningPages.push(slug);
    console.log(`${colors.HIGH_PRIORITY}ERROR${colors.RESET}: page ${colors.ROUTE_PAGE_SLUG}${slug}${colors.RESET} doesn't exist`);
  }
  return false;
}

function isPointedTo(startPage, slug) {
  if (startPage == slug || reachablePages.includes(slug) || !pageMap[slug]) return true;

  if (!warningPages.includes(slug)) {
    warningPages.push(slug);
    console.log(`${colors.MED_PRIORITY}WARNING${colors.RESET}: page ${colors.ROUTE_PAGE_SLUG}${slug}${colors.RESET} is inaccessible`);
  }
  return false;
}

function buildReachableMap(startPage) {
  addToReachableMap(startPage, reachablePages, [], 0);
}

function addToReachableMap(page, map, visitedPages, depth) {
  if (visitedPages.includes(page.PageSlug)) return map;
  if (!map.includes(page.PageSlug)) map.push(page.PageSlug);

  visitedPages.push(page.PageSlug);

  console.log(`function depth: ${depth}`);

  if (page.Behaviours) {
    page.Behaviours.forEach((behaviour) => {
      const pageSlug =
        behaviour[Object.keys(behaviour).find((key) => key.toLowerCase() === "behaviourtype")].toLowerCase() == "submitform"
          ? "success"
          : behaviour[Object.keys(behaviour).find((key) => key.toLowerCase() === "pageslug")];

      if (pageMap[pageSlug]) {
        addToReachableMap(pageMap[pageSlug], map, visitedPages, depth + 1);
      }
    });
  }
  return map;
}

function buildPageMap(pages) {
  pages.forEach((page) => {
    pageMap[page.PageSlug] = page;
  });
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

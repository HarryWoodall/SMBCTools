const fs = require("fs");
const open = require("open");

const propertyMapping = {
  slug: { name: "Page Slug", value: "pageslug", level: "pages" },
  label: { name: "Label", value: ["label", "addresslabel"], level: "elements", handleStore: storeLabel },
  validation: {
    name: "Validation",
    value: [
      { name: "Custom validation", value: "customvalidationmessage" },
      { name: "Manual address validation", value: "addressmanuallinktext" },
      { name: "Select address validation", value: "selectcustomvalidationmessage" },
      { name: "Exclusive checkbox validation", value: "exclusivecheckboxvalidationmessage" },
      { name: "No bookings validation", value: "noavailabletimeforbookingtype" },
      { name: "Date before validation", value: "isdatebeforevalidationmessage" },
      { name: "Date after validation", value: "isdateaftervalidationmessage" },
      { name: "Invalid date validation", value: "validationmessageinvaliddate" },
      { name: "Restrict future date validation", value: "validationmessagerestrictfuturedate" },
      { name: "Restrict past date validation", value: "validationmessagerestrictpastdate" },
      { name: "Upper limit validation", value: "upperlimitvalidationmessage" },
      { name: "AM PM validation", value: "customvalidationmessageampm" },
      { name: "Invalid time validation", value: "validationmessageinvalidtime" },
      { name: "Regex validation", value: "regexvalidationmessage" },
    ],
    level: "elements",
    handleStore: storeValidation,
    handleRender: renderValidation,
  },
  id: { name: "Elements", value: "questionid", level: "properties" },
  type: { name: "Type", value: "type", level: "elements", needsId: true, handleStore: storeType, handleRender: renderType },
};

let workDirectory;

module.exports = function (args, res) {
  if (args.length < 2) {
    console.log("Please give atleast 1 argument");
    return;
  }
  const wkDir = args.pop();
  let formName = args.shift();

  properties = args.length ? args : ["label", "validation"];

  workDirectory = wkDir;

  if (formName.slice(-5) !== ".json") formName += ".json";
  const fileSource = `${wkDir}/form-builder-json/v2/${formName}`;

  try {
    if (fs.existsSync(fileSource)) {
      let file = fs.readFileSync(fileSource).toString().trim();
      let form = JSON.parse(file);

      const pages = form[Object.keys(form).find((key) => key.toLowerCase() === "pages")];
      const formTitle = form[Object.keys(form).find((key) => key.toLowerCase() === "formname")];
      markdown = createHeader(properties, formTitle);

      pages.forEach((page) => {
        markdown += createElements(page, properties);
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

function createElements(page, properties) {
  const pageValues = {};

  const pagePropertyMappings = properties.filter((property) => propertyMapping[property].level == "pages");
  const elementPropertyMappings = properties.filter((property) => propertyMapping[property].level == "elements");
  const properyPropertyMappings = properties.filter((property) => propertyMapping[property].level == "properties");

  pagePropertyMappings.forEach((property) => {
    if (!pageValues[property]) pageValues[property] = [];
    pageValue = page[Object.keys(page).find((key) => key.toLowerCase() === propertyMapping[property].value)];
    if (pageValue) pageValues[property].push(pageValue);
  });

  const elements = page[Object.keys(page).find((key) => key.toLowerCase() === "elements")];
  const title = page[Object.keys(page).find((key) => key.toLowerCase() === "title")];

  elements.forEach((element) => {
    if (element[Object.keys(element).find((key) => key.toLowerCase() === "type")].toLowerCase() == "reusable") {
      const ref = element[Object.keys(element).find((key) => key.toLowerCase() === "elementref")];
      const refElement = JSON.parse(fs.readFileSync(`${workDirectory}/form-builder-json/Elements/${ref}.json`).toString().trim());
      element = refElement;
    }

    const properties = element[Object.keys(element).find((key) => key.toLowerCase() === "properties")];

    elementPropertyMappings.forEach((property) => {
      if (!pageValues[property]) pageValues[property] = [];

      if (propertyMapping[property].handleStore) {
        propertyMapping[property].handleStore(pageValues, properties, element, title);
      } else {
        elementValue = element[Object.keys(element).find((key) => key.toLowerCase() == propertyMapping[property].value)];

        if (propertyMapping[property].needsId && !elementHasId(properties)) return;
        if (elementValue) pageValues[property].push(elementValue);
      }
    });

    properyPropertyMappings.forEach((property) => {
      if (!pageValues[property]) pageValues[property] = [];

      if (propertyMapping[property].handleStore) {
        propertyMapping[property].handleStore(pageValues, properties);
      } else {
        propertyValue = properties[Object.keys(properties).find((key) => key.toLowerCase() === propertyMapping[property].value)];

        if (propertyMapping[property].needsId && !elementHasId(properties)) return;
        if (propertyValue) pageValues[property].push(propertyValue);
      }
    });
  });

  let markdown = "";

  properties.forEach((property) => {
    if (!isEmptyPage(pageValues)) {
      if (pageValues[property].length == 0) markdown += " | ";
      pageValues[property].forEach((item) => {
        if (propertyMapping[property].handleRender) {
          markdown = propertyMapping[property].handleRender(markdown, item);
        } else {
          markdown += `${item}<br>`;
        }
      });
      markdown += " | ";
    }
  });

  if (!isEmptyPage(pageValues)) markdown += " |\r\n";
  return markdown;
}

function createHeader(args, title) {
  let markdown = `# ${title}\r\n| `;

  args.forEach((arg) => {
    if (propertyMapping[arg].name) {
      markdown += `${propertyMapping[arg].name} | `;
    }
  });
  markdown += "\r\n | ";
  args.forEach((arg) => {
    if (propertyMapping[arg].name) {
      markdown += "--- | ";
    }
  });
  markdown += "\r\n";

  return markdown;
}

function elementHasId(properties) {
  return properties[Object.keys(properties).find((key) => key.toLowerCase() === "questionid")];
}

function storeType(pageValues, properties, element) {
  value = element[Object.keys(element).find((key) => key.toLowerCase() == "type")];

  if (!elementHasId(properties)) return;
  if (value) pageValues["type"].push({ value: value, optional: properties[Object.keys(properties).find((key) => key.toLowerCase() === "optional")] });
}

function renderType(markdown, item) {
  if (item.optional) {
    markdown += `${item.value} **(Optional)**<br>`;
  } else {
    markdown += `${item.value}<br>`;
  }

  return markdown;
}

function storeLabel(pageValues, properties, element, title) {
  let propertyValue;
  propertyMapping.label.value.forEach((labelKey) => {
    propertyValue = properties[Object.keys(properties).find((key) => key.toLowerCase() === labelKey)];
    if (propertyValue) pageValues["label"].push(propertyValue);
  });

  if (element[Object.keys(element).find((key) => key.toLowerCase() == "type")].toLowerCase() == "address" && !propertyValue) {
    pageValues["label"].push(title);
  }
}

function storeValidation(pageValues, properties) {
  propertyMapping.validation.value.forEach((validationKey) => {
    propertyValue = properties[Object.keys(properties).find((key) => key.toLowerCase() === validationKey.value)];
    if (propertyValue) pageValues["validation"].push({ validationType: validationKey.name, value: propertyValue });
  });
}

function renderValidation(markdown, item) {
  markdown += `**${item.validationType}**: ${item.value}<br>`;
  return markdown;
}

function isEmptyPage(pageData) {
  const keys = Object.keys(pageData);
  for (let i = 0; i < keys.length; i++) {
    if (pageData[keys[i]].length > 0) {
      return false;
    }
  }
  return true;
}

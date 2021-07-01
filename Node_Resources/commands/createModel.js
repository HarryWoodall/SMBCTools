const fs = require("fs");
const open = require("open");
const colors = require("../colors");

let resources;
const fields = [];

module.exports = function (args, res) {
  if (args.length < 1) {
    console.log("Please input atleast 1 argument");
    return;
  }

  if (args[0].toLowerCase() == "help") {
    displayHelp();
    return;
  }

  resources = res;

  const wkDir = args.pop();
  let form = args.pop();
  const modifier = args.pop();

  if (form.slice(-5) !== ".json") form += ".json";

  const fileSource = `${wkDir}/form-builder-json/v2/${form}`;

  try {
    if (fs.existsSync(fileSource)) {
      let file = fs.readFileSync(fileSource).toString().trim();
      let form = JSON.parse(file);
      let object = {};
      for (let page of form.Pages) {
        for (let element of page.Elements) {
          const targetMapping = element.Properties[Object.keys(element.Properties).find((key) => key.toLowerCase() === "TargetMapping".toLowerCase())];
          const questionId = element.Properties[Object.keys(element.Properties).find((key) => key.toLowerCase() === "questionId".toLowerCase())];

          if (!modifier) {
            let field = createField(element, targetMapping || questionId);
            addField(field, modifier);
          } else if (modifier == "-j") {
            createJsonField(element, targetMapping || questionId, object);
          }
        }
      }
      if (!modifier) {
        writeToFile();
      } else if (modifier == "-j") {
        writeJsonToFile(object);
      }
    } else {
      console.log(`File ${form} not found`);
    }
  } catch (err) {
    console.error(err);
  }
};

function createField(element, id) {
  if (!id) return null;

  let type;

  switch (element.Type.toUpperCase()) {
    case "CHECKBOX":
      type = "List<string>";
      break;
    case "ADDRESS":
    case "STREET":
      type = "Address";
      break;
    case "DATEINPUT":
    case "DATEPICKER":
      type = "DateTime";
      break;
    case "DOCUMENTUPLOAD":
    case "FILEUPLOAD":
    case "MULTIPLEFILEUPLOAD":
      type = "List<File>";
      break;
    case "BOOKING":
      type = "Booking";
      break;
    case "MAP":
      type = "Map";
      break;
    case "SUMMARY":
    case "LINK":
      type = null;
      break;
    default:
      type = "string";
      break;
  }

  if (type) {
    id = id.charAt(0).toUpperCase() + id.slice(1);

    if (id.includes(".")) {
      id = id.split(".")[0];
      type = id;
    }

    return { type: type, id: id };
  }
}

function createJsonField(element, id, rootObject) {
  if (!id) return null;

  switch (element.Type.toUpperCase()) {
    case "CHECKBOX":
      value = ["string"];
      break;
    case "ADDRESS":
    case "STREET":
      value = {
        SelectedAddress: "string",
        AddressLine1: "string",
        AddressLine2: "string",
        Town: "string",
        Postcode: "string",
        PlaceRef: "string",
        IsAutomaticallyFound: true,
      };
      break;
    case "DOCUMENTUPLOAD":
    case "FILEUPLOAD":
    case "MULTIPLEFILEUPLOAD":
      value = [
        {
          TrustedOriginalFileName: "string",
          Content: "string",
          UntrustedOriginalFileName: "string",
          KeyName: "string",
        },
      ];
      break;
    case "BOOKING":
      value = {
        Id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        Date: "2021-06-14T14:16:16.539Z",
        StartTime: "2021-06-14T14:16:16.539Z",
        EndTime: "2021-06-14T14:16:16.539Z",
        Location: "string",
      };
      break;
    case "MAP":
      value = {
        SiteCode: "string",
        AssetId: "string",
        Easting: "string",
        Northing: "string",
      };
      break;
    case "SUMMARY":
    case "LINK":
      value = null;
      break;
    default:
      value = "string";
      break;
  }

  if (value) {
    if (id.includes(".")) {
      let objects = id.split(".");
      id = objects.shift();

      objects.forEach((item, index) => {
        if (index == 0) {
          if (!rootObject[id]) rootObject[id] = {};

          rootObject[id][item] = value;
        } else {
          // TODO, if objet has more than 1 layer deep
          // e.g date.time.second
        }
      });
    } else {
      rootObject[id] = value;
    }
  }
}

function addField(field, modifier) {
  if (field && !modifier && !fields.find((element) => element.id == field.id)) {
    fields.push(field);
  } else if (field && modifier == "-j" && !fields.find((element) => element.key == field.id)) {
    fields.push(field);
  }
}

function writeToFile() {
  let data = "";

  data += "{\r\n";

  for (let item of fields.values()) {
    data += `\tpublic ${item.type} ${item.id} { get; set; }\r\n`;
  }

  data += "}";

  fs.writeFile(`${resources}/model.txt`, data, () => {
    open(`${resources}/model.txt`, { wait: false });
    console.log("model created");
    console.log("opening file");
  });
}

function writeJsonToFile(object) {
  fs.writeFileSync(`${resources}/model.txt`, JSON.stringify(object, null, 2));
  open(`${resources}/model.txt`);
  console.log("model created");
  console.log("opening file");
}

function displayHelp() {
  console.log(`
    model ${colors.COMMAND}<form-name>${colors.RESET}

      Creates the C# model of a json form.

      Assume all elements 
      that can be used, are used.
    
    model ${colors.MODIFIER}-j${colors.RESET} ${colors.COMMAND}<form-name>${colors.RESET}
    
      Creates a dummy JSON payload of the form`);
}

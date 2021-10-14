const fs = require("fs");
const open = require("open");

module.exports = function (args, res) {
  if (args.length < 2) {
    console.log("Please give atleast 1 argument");
    return;
  }

  /**
   * Command given in the form <command name> <form-name>
   *
   * Retrive the code directory and
   * the form name from the arguments
   */
  const wkDir = args.pop();
  let formName = args.pop();

  /**
   * If argument given does not have valid
   * file ending, give it one.
   * Then create the complete file path
   */
  if (formName.slice(-5) !== ".json") formName += ".json";
  const fileSource = `${wkDir}/form-builder-json/DSL/${formName}`;

  /**
   * If the form exists, load it into
   * the 'form' variable
   */
  try {
    if (fs.existsSync(fileSource)) {
      let file = fs.readFileSync(fileSource).toString().trim();
      let form = JSON.parse(file);

      //Your Code goes below here

      /**
       * Write data into a temp file
       * and open it up. At the moment it
       * just outputs the form name
       */
      fs.writeFileSync(`${res}/exampleOutput.md`, form.FormName);
      open(`${res}/exampleOutput.md`);
    } else {
      console.log(`File ${form} not found`);
    }
  } catch (err) {
    console.error(err);
  }
};

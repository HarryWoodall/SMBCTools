const fs = require("fs");
const open = require("open");

module.exports = function (args, res) {
  if (args.length != 2) {
    console.log("Please give 1 argument");
    return;
  }

  /**
   * Retrive the code directory and
   * the form name from the arguments
   */
  const wkDir = args.pop();
  let form = args.pop();

  /**
   * If argument given does not have valid 
   * file ending, give it one.
   * Then create the complete file path
   */
  if (form.slice(-5) !== ".json") form += ".json";
  const fileSource = `${wkDir}/form-builder-json/v2/${form}`;

    /**
     * If the form exists, load it into 
     * the 'form' variable
     */
  try {
    if (fs.existsSync(fileSource)) {
      let file = fs.readFileSync(fileSource).toString().trim();
      let form = JSON.parse(file);

      /*
       * Your Code goes below here
       */




      /**
       * Write data into a temp file
       * and open it up.
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



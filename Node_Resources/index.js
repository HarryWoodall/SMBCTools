const fs = require("fs");
const commands = require("./commands");

const resources = `${process.argv[2]}/Resources`;
const args = mapArgs(process.argv.slice(3));

if (!fs.existsSync(resources)) {
  fs.mkdirSync(resources);
}

command = args.shift();

if (commands[command]) {
  commands[command](args, resources);
} else {
  console.log("Command not found");
}

function mapArgs(args) {
  let result = [];
  let quoteFlag = false;
  let tempArgument = "";
  for (let i = 0; i < args.length; i++) {
    if (args[i][0] === '"') {
      quoteFlag = true;
    }

    if (quoteFlag) {
      tempArgument += tempArgument.length ? ` ${args[i]}` : args[i].slice(1);
    } else {
      result.push(args[i]);
    }

    if (args[i][args[i].length - 1] == '"') {
      result.push(tempArgument.slice(0, -1));
      tempArgument = "";
      quoteFlag = false;
    }
  }

  return result;
}

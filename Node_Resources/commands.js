const jira = require("./commands/jira");
const createModel = require("./commands/createModel");
const validateJson = require("./commands/validateJson");
const slugs = require("./commands/getPageSlugs");
const flow = require("./commands/formFlow");

module.exports = {
  jira: jira,
  createModel: createModel,
  validateJson: validateJson,
  slugs: slugs,
  flow: flow,
};

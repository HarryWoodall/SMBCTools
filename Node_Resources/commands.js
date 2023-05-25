module.exports = {
  jira: require("./commands/jira"),
  createModel: require("./commands/createModel"),
  validateJson: require("./commands/validateJson"),
  slugs: require("./commands/getPageSlugs"),
  flow: require("./commands/formFlow"),
  trivia: require("./commands/trivia"),
  table: require("./commands/tableForm"),
  PA: require("./commands/powerAutomate"),
  cypressTemplate: require("./commands/cypressTemplate"),
};

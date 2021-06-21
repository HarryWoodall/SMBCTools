const fs = require("fs");
const colors = require("../colors");

let resources;
let localData;

module.exports = function (tokens, res) {
  resources = res;
  command = tokens.shift();
  const commands = {
    show: show,
    update: update,
    add: add,
    rm: remove,
    priority: priority,
    help: help,
  };

  if (!fs.existsSync(`${resources}/Jira.json`)) {
    data = {
      cards: [],
      lastUpdated: 0,
      sync: true,
    };
    fs.writeFileSync(`${resources}/Jira.json`, JSON.stringify(data, null, 2));
  }

  if (commands[command]) {
    commands[command](tokens);
  } else {
    console.log("command not found");
  }
};

function getLocalData() {
  if (!localData) {
    localData = JSON.parse(fs.readFileSync(`${resources}/Jira.json`));
    localData.cards.sort((a, b) => {
      return parseInt(a.priority) - parseInt(b.priority);
    });
  }
  return localData;
}

function show() {
  let cards;
  const priorityMap = {
    1: colors.HIGH_PRIORITY,
    2: colors.MED_PRIORITY,
    3: colors.LOW_PRIORITY,
  };

  cards = getCards();
  console.log();
  cards.forEach((element) => {
    console.log(
      `  ${colors.BOLD}${colors.REFERENCE}${element.number}${colors.RESET} ${priorityMap[element.priority] || colors.STATUS}[${element.status}]${
        colors.RESET
      } ${element.description}`
    );
  });
}

function update(args) {
  const argsCount = args.length;
  const cards = getCards();
  const cardData = argsCount == 2 ? findCard(args[0], cards) : findCard(args[1], cards);
  const delimiterMap = {
    "-d": "description",
    "-n": "number",
    "-p": "priority",
  };
  const updateType = delimiterMap[args[0]] || "status";
  let updateValue = argsCount == 2 ? args[1] : args[2];

  if (updateType === "priority") {
    updateValue = convertPriority(updateValue);
  }

  if (cardData) {
    cardData.card[updateType] = updateValue;
    console.log(`successfully updated card ${argsCount == 2 ? args[0] : args[1]}`);
  } else {
    console.log(`card ${argsCount == 2 ? args[0] : args[1]} not found`);
  }

  updateCards(cards);
}

function add(args) {
  if (args.length >= 2) {
    const cards = getCards();
    if (!isNaN(args[0])) {
      const card = {
        number: args[0],
        description: args[1],
        priority: convertPriority(args[2]) || 4,
        status: args[3] || "In Progress",
      };
      cards.push(card);
      updateCards(cards);
    } else {
      console.log(`Failed to create card. ${args[0]} is not a valid case number`);
    }
  }
}

function remove(args) {
  const cards = getCards();
  if (args && args.length === 1) {
    const cardData = findCard(args, cards);
    if (cardData) {
      cards.splice(cardData.index, 1);
      console.log(`Succuessfully removed card: ${cardData.card.number}`);
      updateCards(cards);
    }
  }
}

function priority(args) {
  const cards = getCards();
  const cardData = findCard(args[0], cards);

  if (cardData) {
    cardData.card.priority = convertPriority(args[1]);
  } else {
    console.log(`card ${argsCount == 2 ? args[0] : args[1]} not found`);
  }

  updateCards(cards);
}

function help() {
  console.log(`
  jira <${colors.COMMAND}?command${colors.RESET}> <${colors.PARAM}?params...${colors.RESET}>

      jira -- open jira in Chrome

      jira <${colors.PARAM}ref#${colors.RESET}> -- open SMBC Jira card in Chrome

      jira ${colors.COMMAND}show${colors.RESET} -- show current Jira notes

      jira ${colors.COMMAND}add${colors.RESET} <${colors.PARAM}ref#${colors.RESET}> <${colors.PARAM}description${colors.RESET}> -- Jira note with default status 'IN PROGRESS'
      jira ${colors.COMMAND}add${colors.RESET} <${colors.PARAM}ref#${colors.RESET}> <${colors.PARAM}description${colors.RESET}> <${colors.PARAM}status${colors.RESET}> -- Jira note with custom status
      jira ${colors.COMMAND}add${colors.RESET} <${colors.PARAM}ref#${colors.RESET}> <${colors.PARAM}description${colors.RESET}> <${colors.PARAM}status${colors.RESET}> <${colors.PRIORITY}priorityValue${colors.RESET}> -- Jira note with custom 
                                                                 status and priority

      jira ${colors.COMMAND}rm${colors.RESET} <${colors.PARAM}ref#${colors.RESET}> -- remove Jira note

      jira ${colors.COMMAND}update${colors.RESET} <${colors.PARAM}ref#${colors.RESET}> <${colors.PARAM}status${colors.RESET}> -- update the status of Jira note
      jira ${colors.COMMAND}update${colors.RESET} <${colors.MODIFIER}modifier${colors.RESET}> <${colors.PARAM}ref#${colors.RESET}> <${colors.PARAM}value${colors.RESET}> -- update the data on Jira note 
                                               depending on modifier
          ${colors.MODIFIER}-d${colors.RESET} -- update description
          ${colors.MODIFIER}-n${colors.RESET} -- update ref#
          ${colors.MODIFIER}-p${colors.RESET} -- update priority
      
      jira ${colors.COMMAND}priority${colors.RESET} <${colors.PARAM}ref#${colors.RESET}> <${colors.PRIORITY}priorityValue${colors.RESET}> -- update the priority of a Jira note 
                                              with a Priority Value
          ${colors.PRIORITY}high${colors.RESET}  -- change description colour to ${colors.HIGH_PRIORITY}red${colors.RESET}
          ${colors.PRIORITY}med${colors.RESET}  -- change description colour to ${colors.MED_PRIORITY}yellow${colors.RESET}
          ${colors.PRIORITY}low${colors.RESET} -- change description colour to ${colors.LOW_PRIORITY}green${colors.RESET}
          ${colors.PRIORITY}any integer value${colors.RESET} (but only 1, 2 and 3 will change apperance of status)
  `);
}

// TODO - remove this redundant method
function getCards() {
  return getLocalData().cards;
}

function findCard(number, cards) {
  const cardIndex = cards.findIndex((card) => {
    return card.number == number;
  });

  if (cardIndex == -1) {
    return null;
  }

  results = {
    index: cardIndex,
    card: cards[cardIndex] || null,
  };

  return results;
}

function updateCards(cards, postData = true, overrideLocal = false) {
  let data;
  const time = Date.now();

  data = getLocalData();
  data.cards = cards;
  data.lastUpdated = time;

  fs.writeFileSync(`${resources}/Jira.json`, JSON.stringify(data, null, 2));
}

// TODO: find a better place for this function
function convertToExternalData(data) {
  if ("sync" in data) {
    delete data.sync;
  }

  return data;
}

function convertPriority(value) {
  const map = {
    low: 3,
    med: 2,
    high: 1,
  };

  if (!value) {
    return 4;
  }

  if (Number.isInteger(value)) {
    return value;
  }

  return map[value.toLowerCase()] || 4;
}

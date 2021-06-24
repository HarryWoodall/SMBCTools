const fs = require("fs");
const open = require("open");
const fetch = require("node-fetch");
const { decode } = require("html-entities");

const categoryMap = {
  any: "any",
  GeneralKnowladge: 9,
  Books: 10,
  Film: 11,
  Music: 12,
  Musicals: 13,
  Television: 14,
  VideoGames: 15,
  BoardGames: 16,
  ScienceAndNature: 17,
  Computers: 18,
  Mathematics: 19,
  Mythology: 20,
  Sports: 21,
  Geography: 22,
  History: 23,
  Politics: 24,
  Art: 25,
  Celebrities: 26,
  Animals: 27,
  Vehicles: 28,
  Comics: 29,
  Gadgets: 30,
  AnimeAndManga: 31,
  Cartoons: 32,
};

module.exports = async function (args, res) {
  let baseURL = "https://opentdb.com/api.php?amount=10";

  if (!args || args.length < 1) getTrivia(baseURL, Object.keys(categoryMap)[Math.floor(Math.random() * 22) + 1], res);

  args.forEach((arg) => {
    switch (arg) {
      case "list":
        listCategories();
        break;
      default:
        key = categoryMap[arg] ? arg : Object.keys(categoryMap)[Math.floor(Math.random() * 22) + 1];
        getTrivia(baseURL, key, res);
        break;
    }
  });
};

async function getTrivia(baseURL, category, res) {
  console.log(`Category: ${category}`);
  baseURL += `&category=${categoryMap[category]}`;
  const questionsFile = `${res}/triviaQuestions.txt`;
  const answersFile = `${res}/triviaAnswers.txt`;

  await fetch(baseURL)
    .then((response) => response.json())
    .then((data) => {
      questions = writeQuestions(data);
      answers = writeAnswers(data);
      fs.writeFileSync(questionsFile, questions);
      fs.writeFileSync(answersFile, writeAnswers(data));
    });

  await open(questionsFile, { wait: true });
  open(answersFile);
}

function listCategories() {
  console.log();
  for (const [key, value] of Object.entries(categoryMap)) {
    if (key != "any") console.log(`  ${key}`);
  }
}

function writeQuestions(data) {
  let text = "";
  data.results.forEach((question, index) => {
    let options = [];
    text += `Question: ${index + 1}\r\n`;
    text += `${decode(question.question)}\r\n`;
    if (question.type == "boolean") {
      text += `1. true\r\n2. false\r\n`;
    } else {
      options.push(question.correct_answer);
      options = options.concat(question.incorrect_answers);
      options.sort(() => Math.random() - 0.5);
      options.forEach((option, index) => {
        text += `${index + 1}. ${decode(option)}\r\n`;
      });
    }
    text += "\r\n";
  });
  return text;
}

function writeAnswers(data) {
  let text = "";
  data.results.forEach((question, index) => {
    text += `Question: ${index + 1}\r\n`;
    text += `${decode(question.question)}\r\n`;
    text += `Answer: ${decode(question.correct_answer)}\r\n`;
    text += "\r\n";
  });
  return text;
}

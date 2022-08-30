const fs = require("fs");
const puppeteer = require("./controllers/puppeteer");
const { restart } = require("./controllers/functions");

module.exports = startup = async (cb) => {
  loadCommandLineArguments();
  createDownloadDirectories();

  //   Launch puppeteer
  await puppeteer.init();

  await cb();
};

function loadCommandLineArguments() {
  global.__ = require("./controllers/functions");
  global.conf = require("./config");

  // Load the congressional sessions to scrape into the conf
  if (!process.argv[2]) return __.restart("You need to provide a number or numbers of congress to scrape!");
  conf.sessions = process.argv[2].split(",");

  // Load the puppeteer visibility into the conf
  conf.headless = process.argv.includes("--with-front") ? false : true;

  // Determine if the script has restarted or is the first start
  if (!fs.existsSync("./started") || process.argv.includes("--restart")) {
    fs.writeFileSync("./started", "");
    conf.firstStart = true;
  }
}

function createDownloadDirectories() {
  for (let session of conf.sessions) {
    if (!Number.isInteger(parseFloat(session))) return restart("The entered number is not an integer: " + session);

    if (!fs.existsSync(`./data/${session}`)) fs.mkdirSync(`./data/${session}`);
  }
}

const fs = require("fs");

module.exports = {
  restart(reason) {
    console.log(reason);
    process.exit(1);
  },

  sleep(ms = 2500) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  },

  save(file, text) {
    fs.writeFileSync(file, text);
  },

  filenamify(str) {
    return str.replace("https://www.congress.gov/congressional-record", "").replace(/\//g, "") + ".txt";
  },

  getArchiveURL(number) {
    return `https://www.congress.gov/congressional-record/${number}th-congress/browse-by-date`;
  },
};

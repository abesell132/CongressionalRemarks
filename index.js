const fs = require("fs");
const pup = require("./controllers/puppeteer");

const conf = require("./config.js");
const startup = require("./startup.js");

let dailyRemarkArchives;

startup(async () => {
  if (conf.firstStart) {
    for (let session of conf.sessions) {
      await pup.navigate(__.getArchiveURL(session), 2500);
      await pup.page.click("#expand-all");

      await __.sleep(1500);

      dailyRemarkArchives = await pup.getDailyRemarkURLs(session);

      await __.save("./data/dailyRemarkURLs.txt", JSON.stringify(dailyRemarkArchives));
    }
  } else {
    dailyRemarkArchives = JSON.parse(fs.readFileSync("./data/dailyRemarkURLs.txt"));
  }

  while (dailyRemarkArchives.length > 0) {
    let dailyRemarks = await dailyRemarkArchives[0];

    await pup.navigate(dailyRemarks.url);

    let memberRemarkURLs = await pup.getMemberRemarkURLs();
    await __.sleep();

    for (let remarkURL of memberRemarkURLs) {
      await download_extension_of_remark(remarkURL, dailyRemarks.session);
    }

    await dailyRemarkArchives.shift();

    await __.save("./data/dailyRemarkURLs.txt", JSON.stringify(dailyRemarkArchives));
    await __.sleep();
  }

  await console.log("Done!");
});

async function download_extension_of_remark(url, session) {
  await pup.navigate(url);

  let value = await pup.extractRemarkFromPage();

  await __.save(`./data/${session}/${__.filenamify(url)}`, value);
  await __.sleep();
}

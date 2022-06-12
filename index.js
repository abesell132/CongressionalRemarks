const puppeteer = require("puppeteer");
const fs = require("fs");
const conf = require("./config.js");

let firstStart = !fs.existsSync("./started");
if (firstStart) fs.writeFileSync("./started", "");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
function* generator(i) {
  while (true) {
    yield i++;
  }
}
const gen = generator(1);

console.log(conf);
let browser, page;

fs.mkdirSync(`./data/${conf.congressionalNumber}`, { recursive: true });

(async () => {
  browser = await puppeteer.launch({
    // headless: false, args: [`--window-size=1800,950`]
  });
  page = await browser.newPage();
  //   await page.setViewport(
  //       { width: 1800, height: 950 }
  //       );
  await page.setDefaultNavigationTimeout(300000);

  let dailyRemarkArchives;
  if (firstStart) {
    // Go to members list page

    await navigate0(conf.archiveURL);

    await sleep(1500); // Sleep so we don't piss of the government

    // View All of current year
    await page.click("#expand-all");

    // Collect Links to extensions of remarks
    dailyRemarkArchives = await page.$$eval("table tbody td:nth-child(5) a", (as) => as.map((a) => a.href));

    await saveDailyRemarkArchiveURLs(dailyRemarkArchives);
  }

  dailyRemarkArchives = await loadDailyRemarkArchiveURLs();

  while (dailyRemarkArchives.length > 0) {
    let dailyRemarks = await dailyRemarkArchives[0];

    // go to each daily extension of remark
    let res = await page.goto(dailyRemarks, { waitUntil: "networkidle2" });
    if (res.status() !== 200) await restart(res);

    // Collect Links to member remark
    let memberRemarks = await page.$$eval(".item_table  tbody td:nth-child(1) a:nth-child(1)", (as) => as.map((a) => a.href));

    await sleep(2500); // Sleep so we don't piss of the government

    // For each member remark page
    for (let remarkURL of memberRemarks) {
      await download_extension_of_remark(remarkURL);
    }

    await dailyRemarkArchives.shift();

    await console.log(dailyRemarkArchives[0]);
    await saveDailyRemarkArchiveURLs(dailyRemarkArchives);
    await sleep(3000);
    dailyRemarkArchives = await loadDailyRemarkArchiveURLs();
  }
})();
process.on("exit", () => browser.close());

async function download_extension_of_remark(url) {
  // go to the remark page
  await navigate0(url);

  let value = await extractRemarkFromPage();
  await saveCongressionalRemarkToFile(url, value);

  await sleep(2500); // Sleep so we don't piss off the government
}

async function navigate0(url) {
  let res = await page.goto(url, { waitUntil: "networkidle0" });
  if (res.status() !== 200) restart(res);
}

async function extractRemarkFromPage() {
  await page.waitForSelector("pre.styled");
  let element = await page.$("pre.styled");
  let value = await page.evaluate((el) => el.textContent, element);
  return value;
}

async function saveCongressionalRemarkToFile(url, text) {
  let fileName = url.replace("https://www.congress.gov/congressional-record", "").replace(/\//g, "") + ".txt";
  let filePath = `./data/${conf.congressionalNumber}/${fileName}`;
  await fs.writeFileSync(filePath, text);
}

async function saveDailyRemarkArchiveURLs(list) {
  await fs.writeFileSync("./data/dailyRemarkArchiveURLs.txt", list.join(","));
}

async function loadDailyRemarkArchiveURLs() {
  return fs.readFileSync("./data/dailyRemarkArchiveURLs.txt").toString().split(",");
}

function restart(reason) {
  console.log(reason);
  process.exit(1);
}

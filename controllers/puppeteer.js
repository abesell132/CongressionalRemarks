const puppeteer = require("puppeteer");
const config = require("../config");

module.exports = {
  browser: {},
  page: {},

  nonHeadlessOpts: {
    headless: false,
    args: [`--window-size=1800,950`],
  },

  async init() {
    this.browser = await this.createBrowser();

    [this.page] = await this.browser.pages();
    await this.page.setDefaultNavigationTimeout(300000);

    if (!config.headless) return await this.page.setViewport({ width: 1800, height: 950 });
  },

  async createBrowser() {
    if (config.headless) return await puppeteer.launch();
    return await puppeteer.launch(this.nonHeadlessOpts);
  },

  async getDailyRemarkURLs(session) {
    let urls = await this.page.$$eval("table tbody td:nth-child(5) a", (as) => as.map((a) => a.href));

    for (let a = 0; a < urls.length; a++) urls[a] = { url: urls[a], session };

    return urls;
  },

  async getMemberRemarkURLs() {
    return await this.page.$$eval(".item_table  tbody td:nth-child(1) a:nth-child(1)", (as) => as.map((a) => a.href));
  },

  async navigate(url, quickReturnTime = 1500) {
    let res = await this.page.goto(url, { waitUntil: "networkidle0" });
    let status = await res.status();
    if (status !== 200) await restart(res);

    if (quickReturnTime == true) return;
    await __.sleep(quickReturnTime); // Sleep so we don't piss off the government
  },

  async extractRemarkFromPage() {
    let element = await this.page.$("pre.styled");

    return await this.page.evaluate((el) => el.textContent, element);
  },
};

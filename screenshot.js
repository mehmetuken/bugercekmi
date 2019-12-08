const puppeteer = require("puppeteer");
const { Signale } = require("signale");

class Screenshot {
  constructor() {
    this.logger = new Signale({ scope: "Screenshot Manager" });
  }

  getArgs() {
    let args = [
      "--disable-background-timer-throttling",
      "--disable-breakpad",
      "--disable-client-side-phishing-detection",
      "--disable-cloud-import",
      "--disable-default-apps",
      "--disable-dev-shm-usage",
      "--disable-extensions",
      "--disable-gesture-typing",
      "--disable-hang-monitor",
      "--disable-infobars",
      "--disable-notifications",
      "--disable-offer-store-unmasked-wallet-cards",
      "--disable-offer-upload-credit-cards",
      "--disable-popup-blocking",
      "--disable-print-preview",
      "--disable-prompt-on-repost",
      "--disable-setuid-sandbox",
      "--disable-speech-api",
      "--disable-sync",
      "--disable-tab-for-desktop-share",
      "--disable-translate",
      "--disable-voice-input",
      "--disable-wake-on-wifi",
      "--disk-cache-size=33554432",
      "--enable-async-dns",
      "--enable-simple-cache-backend",
      "--enable-tcp-fast-open",
      "--enable-webgl",
      "--hide-scrollbars",
      "--ignore-gpu-blacklist",
      "--media-cache-size=33554432",
      "--metrics-recording-only",
      "--mute-audio",
      "--no-default-browser-check",
      "--no-first-run",
      "--no-pings",
      "--no-sandbox",
      "--no-zygote",
      "--password-store=basic",
      "--prerender-from-omnibox=disabled",
      "--use-gl=swiftshader",
      "--use-mock-keychain"
    ];
    return args;
  }

  getViewport() {
    return {
      width: 1440,
      height: 900,
      deviceScaleFactor: 2,
      isMobile: false,
      hasTouch: false,
      isLandscape: false
    };
  }

  async init(headless = true) {
    this.browser = await puppeteer.launch({
      args: this.getArgs(),
      headless: headless,
      defaultViewport: this.getViewport()
    });
    this.logger.debug("Create puppeter browser.");
  }

  async takeShot(imageUrl) {
    let page = null;
    try {
      page = await this.browser.newPage();

      await page.goto("https://google.com/imghp", {
        waitUntil: "networkidle2",
        timeout: 10000
      });

      const [imageBtn] = await page.$x("//*[@id='sbtc']/div/div[3]/div[1]");
      await imageBtn.click();

      await page.waitForSelector('input[type="submit"]', { timeout: 10000 });

      await page.type("input[name=image_url]", imageUrl);

      await page.click('input[type="submit"]');
      await page.waitForSelector("#res", { timeout: 10000 });

      const resEl = await page.$("#res");
      if (!resEl) {
        return null;
      }

      let searchText = "";
      const searchTextEls = await page.$x('//*[@id="topstuff"]/div/div[2]/a');
      if (searchTextEls.length > 0) {
        const searchTextEl = searchTextEls[0];
        searchText = await page.evaluate(
          element => element.textContent,
          searchTextEl
        );
      }

      const image = await resEl.screenshot({
        type: "jpeg",
        encoding: "base64",
        quality: 100
      });

      return { image, searchText };
    } catch (error) {
      throw new Error(error);
    } finally {
      if (page !== null) {
        await page.close();
      }
    }
  }

  async dispose() {
    if (this.browser !== null) await this.browser.close();
  }
}

module.exports = Screenshot;

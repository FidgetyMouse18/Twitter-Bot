const puppeteer = require('puppeteer');
const URL = 'https://www.amazon.com.au/gp/bestsellers/';
const { downloadImage } = require("./web.js")

async function createBrowser() {
  const browser = await puppeteer.launch({
    "headless": "new", timeout: 20000,
    ignoreHTTPSErrors: true,
    args: [
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--disable-setuid-sandbox',
      '--no-first-run',
      '--no-sandbox',
      '--no-zygote',
      '--window-size=1280,720',
    ],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  // Block images, videos, fonts from downloading
  await page.setRequestInterception(true);

  page.on('request', (interceptedRequest) => {
    const blockResources = ['script', 'stylesheet', 'image', 'media', 'font'];
    if (blockResources.includes(interceptedRequest.resourceType())) {
      interceptedRequest.abort();
    } else {
      interceptedRequest.continue();
    }
  });

  // Change the user agent of the scraper
  await page.setUserAgent(
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36'
  );

  return { browser: browser, page: page }
}

async function getCategories() {
  const { browser, page } = await createBrowser()

  await page.goto(URL, { waitUntil: "domcontentloaded", });
  await page.waitForSelector('.a-carousel-container > div > div > div > a.a-link-normal');

  let categories = await page.$$eval('.a-carousel-container > div > div > div > a.a-link-normal',
    (e) => e.map((n) => (
      {
        name: n.ariaLabel.replace(" - See More", "").replace("Best Sellers in ", ""),
        url: n.href.slice(0, n.href.indexOf("/ref="))
      }
    ))
  );
  let finalCategories = [];
  for (let category of categories) {
    if (category.name.includes("Gift Cards")) { continue; }
    finalCategories.push(category);
  }
  await browser.close();
  return finalCategories;
}

async function scrapeProducts(category) {
  const { browser, page } = await createBrowser()
  await page.goto(category.url);

  let products = await page.$$eval('.a-cardui',
    (e) => e.map((n, i) => {
      let t = n.querySelectorAll('div > div > a.a-link-normal');
      let img = n.querySelector('img')?.src;
      img = img.replace("._AC_UL300_SR300,200_", "._SR500,500_");
      let price = n.querySelector('.a-size-base')?.textContent;
      return { rank: i, url: t[0].href.slice(0, t[0].href.indexOf("/ref=") + 1), title: t[1].textContent, img: img, price: price }
    })
  );
  products.shift()
  products = products.slice(0, 10);

  let product = products[Math.floor(Math.random() * products.length)];

  await browser.close();
  return product;
}

module.exports = { getCategories, scrapeProducts }
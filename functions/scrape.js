const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const puppeteer = require('puppeteer');


const getMeme = async () => {
    let returnData = {title: "", image: "", link: ""}
    const browser = await puppeteer.launch({
      headless: true,
      timeout: 20000,
      ignoreHTTPSErrors: true,
      slowMo: 0,
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
  
    try {
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

      const subReddits = ['memes', 'MemeEconomy', 'wholesomememes', 'dankmemes', 'dogmemes', 'AnimalMemes', 'funny']
      const categories = ['hot', 'new', 'top/?t=hour', 'top/?t=day', 'top/?t=week', 'top/?t=month']
  
      await page.goto(`https://www.reddit.com/r/${subReddits[Math.floor(Math.random() * subReddits.length)]}/${categories[Math.floor(Math.random() * categories.length)]}`, {
        waitUntil: 'domcontentloaded',
      });
  
      const storySelector = '.Post';

      let divs = await page.$$eval(storySelector, (e) => e.map((n) => n.innerHTML));

      let dom = new JSDOM(divs[Math.floor(Math.random() * divs.length)]);
      let title = dom.window.document.querySelector('._eYtD2XCVieq6emjKBH3m');
      let image = dom.window.document.querySelector('.ImageBox-image');
      let url = dom.window.document.querySelector('a._2INHSNB8V5eaWp4P0rY_mE');

     

      while(!title || !title.innerHTML || !image || !image.src || !url || !url.href) {
        dom = new JSDOM(divs[Math.floor(Math.random() * divs.length)]);
        title = dom.window.document.querySelector('._eYtD2XCVieq6emjKBH3m');
      image = dom.window.document.querySelector('.ImageBox-image');
      url = dom.window.document.querySelector('a._2INHSNB8V5eaWp4P0rY_mE');
      }

      returnData.image = image.src;
      returnData.title = title.innerHTML + " #memes #memesdaily";
      returnData.link = 'https://www.reddit.com' + url.href;
      
    } catch (error) {
      console.log(error);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
    
    return returnData;
  };
  
module.exports = getMeme;
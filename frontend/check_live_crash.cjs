const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log(`[PAGE CONSOLE] ${msg.type().toUpperCase()}: ${msg.text()}`);
  });
  
  page.on('pageerror', error => {
    console.log(`[PAGE ERROR]: ${error.message}`);
  });

  page.on('requestfailed', request => {
    console.log(`[REQUEST FAILED] ${request.url()} - ${request.failure().errorText}`);
  });

  console.log('Navigating to https://syncspheremern.netlify.app/chat ...');
  try {
    await page.goto('https://syncspheremern.netlify.app/chat', { waitUntil: 'networkidle0' });
    console.log('Navigation complete. Waiting 2 seconds...');
    await new Promise(r => setTimeout(r, 2000));
  } catch (err) {
    console.log(`[GOTO ERROR]: ${err.message}`);
  }

  await browser.close();
})();

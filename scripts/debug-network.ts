import { chromium } from '@playwright/test';

async function debugNetwork() {
  console.log('🔍 Starting Network Debug...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Track all network requests
  const requests: any[] = [];
  const failedRequests: any[] = [];

  page.on('request', request => {
    requests.push({
      url: request.url(),
      method: request.method(),
      resourceType: request.resourceType()
    });
    console.log(`📤 ${request.method()} ${request.url()}`);
  });

  page.on('response', response => {
    const status = response.status();
    const url = response.url();
    if (status >= 400) {
      console.log(`❌ ${status} ${url}`);
      failedRequests.push({ url, status });
    } else if (url.includes('square')) {
      console.log(`✅ ${status} ${url}`);
    }
  });

  page.on('requestfailed', request => {
    console.log(`❌ FAILED: ${request.url()} - ${request.failure()?.errorText}`);
    failedRequests.push({
      url: request.url(),
      error: request.failure()?.errorText
    });
  });

  // Capture console
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error' || type === 'warning' || text.includes('Square') || text.includes('Cash App')) {
      console.log(`[${type}] ${text}`);
    }
  });

  try {
    console.log('📍 Navigating to test-payments...\n');
    await page.goto('http://localhost:3002/test-payments', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    await page.waitForTimeout(2000);

    console.log('\n🔍 Clicking Square Card Payment button...');
    const cardButton = page.locator('button:has-text("Square Card Payment")').first();
    await cardButton.click();

    console.log('⏳ Waiting 15 seconds for SDK to load...\n');
    await page.waitForTimeout(15000);

    // Check what happened
    console.log('\n📊 ANALYSIS:');
    console.log(`Total requests: ${requests.length}`);
    console.log(`Failed requests: ${failedRequests.length}`);

    const squareRequests = requests.filter(r => r.url.includes('square'));
    console.log(`\nSquare-related requests: ${squareRequests.length}`);
    squareRequests.forEach(r => {
      console.log(`  ${r.method} ${r.url}`);
    });

    if (failedRequests.length > 0) {
      console.log('\n❌ Failed Requests:');
      failedRequests.forEach(r => {
        console.log(`  ${r.status || 'FAILED'} ${r.url}`);
        if (r.error) console.log(`    Error: ${r.error}`);
      });
    }

    // Check DOM
    console.log('\n📋 DOM Check:');
    const scriptTags = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script[src]'));
      return scripts.map(s => ({
        src: (s as HTMLScriptElement).src,
        async: (s as HTMLScriptElement).async,
        defer: (s as HTMLScriptElement).defer
      }));
    });

    const squareScripts = scriptTags.filter(s => s.src.includes('square'));
    console.log(`Square scripts in DOM: ${squareScripts.length}`);
    squareScripts.forEach(s => {
      console.log(`  ${s.src} (async: ${s.async}, defer: ${s.defer})`);
    });

    // Check window.Square
    const squareStatus = await page.evaluate(() => {
      return {
        squareExists: typeof (window as any).Square !== 'undefined',
        squareKeys: typeof (window as any).Square === 'object'
          ? Object.keys((window as any).Square)
          : []
      };
    });
    console.log(`\nwindow.Square exists: ${squareStatus.squareExists}`);
    if (squareStatus.squareExists) {
      console.log(`Square object keys: ${squareStatus.squareKeys.join(', ')}`);
    }

    // Check component state
    const componentState = await page.evaluate(() => {
      const container = document.querySelector('#card-container');
      const loadingText = document.querySelector('text=Loading');
      return {
        containerExists: !!container,
        containerHTML: container?.outerHTML.substring(0, 200),
        hasLoadingText: !!loadingText
      };
    });
    console.log('\nComponent State:');
    console.log(`  Card container exists: ${componentState.containerExists}`);
    if (componentState.containerHTML) {
      console.log(`  Container HTML: ${componentState.containerHTML}`);
    }

    await page.screenshot({
      path: 'test-screenshots/network-debug.png',
      fullPage: true
    });
    console.log('\n📸 Screenshot saved');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    console.log('\n🏁 Closing in 5 seconds...');
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

debugNetwork().catch(console.error);

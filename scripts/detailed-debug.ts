import { chromium } from '@playwright/test';

async function detailedDebug() {
  console.log('🔍 Detailed Square Payment Debug...\n');

  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Intercept console messages
  page.on('console', msg => {
    const type = msg.type();
    console.log(`[BROWSER ${type.toUpperCase()}]`, msg.text());
  });

  // Intercept errors
  page.on('pageerror', error => {
    console.log(`[BROWSER ERROR]`, error.message);
    console.log(error.stack);
  });

  try {
    console.log('📍 Loading page...\n');
    await page.goto('http://localhost:3002/test-payments');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    console.log('\n🔍 Clicking Square Card Payment...');
    await page.click('button:has-text("Square Card Payment")');

    console.log('\n⏳ Waiting 20 seconds and watching console...\n');
    await page.waitForTimeout(20000);

    // Check final state
    console.log('\n📊 FINAL STATE:');
    const finalState = await page.evaluate(() => {
      return {
        squareExists: typeof (window as any).Square !== 'undefined',
        scripts: Array.from(document.querySelectorAll('script[src]')).map((s: any) => s.src),
        containerExists: !!document.getElementById('square-card-container'),
        loadingVisible: !!document.querySelector('text*=Loading'),
      };
    });

    console.log('window.Square exists:', finalState.squareExists);
    console.log('Scripts loaded:', finalState.scripts.filter(s => s.includes('square')));
    console.log('Container exists:', finalState.containerExists);
    console.log('Still showing loading:', finalState.loadingVisible);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    console.log('\n🏁 Closing in 5 seconds...');
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

detailedDebug().catch(console.error);

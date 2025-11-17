import { chromium } from '@playwright/test';

async function testSquarePayments() {
  console.log('🔍 Starting Square Payment Diagnostics...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console messages
  const consoleMessages: string[] = [];
  page.on('console', msg => {
    const text = `[${msg.type()}] ${msg.text()}`;
    consoleMessages.push(text);
    console.log(text);
  });

  // Capture network errors
  page.on('requestfailed', request => {
    console.log(`❌ Network failed: ${request.url()}`);
  });

  // Capture page errors
  page.on('pageerror', error => {
    console.log(`❌ Page error: ${error.message}`);
  });

  try {
    console.log('📍 Navigating to test-payments page...');
    await page.goto('http://localhost:3002/test-payments', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('\n✅ Page loaded\n');

    // Wait a bit for React to hydrate
    await page.waitForTimeout(2000);

    console.log('🔍 Checking for Square SDK...');
    const squareSDKLoaded = await page.evaluate(() => {
      return typeof (window as any).Square !== 'undefined';
    });
    console.log(`Square SDK loaded: ${squareSDKLoaded ? '✅' : '❌'}`);

    if (squareSDKLoaded) {
      const squareDetails = await page.evaluate(() => {
        const Square = (window as any).Square;
        return {
          hasPayments: typeof Square.payments === 'function',
          version: Square.version || 'unknown',
        };
      });
      console.log('Square SDK details:', squareDetails);
    }

    // Check for Square Card Payment button
    console.log('\n🔍 Testing Square Card Payment...');
    const cardButton = page.locator('button:has-text("Square Card Payment")');
    const cardButtonVisible = await cardButton.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`Square Card button visible: ${cardButtonVisible ? '✅' : '❌'}`);

    if (cardButtonVisible) {
      console.log('Clicking Square Card button...');
      await cardButton.click();
      await page.waitForTimeout(3000);

      // Check for loading state
      const loadingText = page.locator('text=Loading payment form');
      const isStuckLoading = await loadingText.isVisible().catch(() => false);
      console.log(`Stuck on loading: ${isStuckLoading ? '❌ YES' : '✅ NO'}`);

      // Check for card container
      const cardContainer = page.locator('#card-container');
      const cardContainerExists = await cardContainer.count() > 0;
      console.log(`Card container exists: ${cardContainerExists ? '✅' : '❌'}`);

      // Check if card inputs are present
      const cardInputs = page.locator('iframe[name*="sq-card"]');
      const cardInputCount = await cardInputs.count();
      console.log(`Card iframes found: ${cardInputCount}`);

      // Wait longer to see if it completes
      console.log('Waiting 10 seconds to see if initialization completes...');
      await page.waitForTimeout(10000);

      const stillLoading = await loadingText.isVisible().catch(() => false);
      console.log(`Still loading after 10s: ${stillLoading ? '❌ YES' : '✅ NO'}`);

      // Check for any error messages
      const errorAlert = page.locator('[role="alert"]');
      const errorCount = await errorAlert.count();
      if (errorCount > 0) {
        console.log(`\n❌ Error alerts found: ${errorCount}`);
        for (let i = 0; i < errorCount; i++) {
          const errorText = await errorAlert.nth(i).textContent();
          console.log(`Error ${i + 1}: ${errorText}`);
        }
      }
    }

    // Test Cash App Pay
    console.log('\n🔍 Testing Cash App Pay...');
    const cashAppButton = page.locator('button:has-text("Cash App Pay")');
    const cashAppButtonVisible = await cashAppButton.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`Cash App button visible: ${cashAppButtonVisible ? '✅' : '❌'}`);

    if (cashAppButtonVisible) {
      console.log('Clicking Cash App button...');
      await cashAppButton.click();
      await page.waitForTimeout(3000);

      // Check for loading state
      const cashAppLoading = page.locator('text=Initializing Cash App Pay');
      const isCashAppLoading = await cashAppLoading.isVisible().catch(() => false);
      console.log(`Cash App loading visible: ${isCashAppLoading ? '⏳' : '✅'}`);

      // Check for cash app container
      const cashAppContainer = page.locator('#cash-app-pay');
      const cashAppContainerExists = await cashAppContainer.count() > 0;
      console.log(`Cash App container exists: ${cashAppContainerExists ? '✅' : '❌'}`);

      // Check for actual button
      const cashAppPayButton = page.locator('#cash-app-pay button');
      const cashAppPayButtonVisible = await cashAppPayButton.isVisible({ timeout: 5000 }).catch(() => false);
      console.log(`Cash App Pay button rendered: ${cashAppPayButtonVisible ? '✅' : '❌'}`);

      console.log('Waiting 10 seconds for Cash App initialization...');
      await page.waitForTimeout(10000);

      const stillInitializing = await cashAppLoading.isVisible().catch(() => false);
      console.log(`Still initializing after 10s: ${stillInitializing ? '❌ YES' : '✅ NO'}`);
    }

    // Check network requests
    console.log('\n🌐 Checking Network Activity...');
    const squareSDKRequest = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script'));
      return scripts
        .filter(s => s.src.includes('squarecdn.com'))
        .map(s => s.src);
    });
    console.log(`Square SDK scripts loaded: ${squareSDKRequest.length}`);
    squareSDKRequest.forEach(url => console.log(`  - ${url}`));

    // Take a screenshot
    console.log('\n📸 Taking screenshot...');
    await page.screenshot({
      path: 'test-screenshots/square-payment-diagnostic.png',
      fullPage: true
    });
    console.log('Screenshot saved to test-screenshots/square-payment-diagnostic.png');

    // Print summary of console messages
    console.log('\n📋 Console Messages Summary:');
    const errorMessages = consoleMessages.filter(m => m.includes('[error]'));
    const warningMessages = consoleMessages.filter(m => m.includes('[warning]'));
    console.log(`Total messages: ${consoleMessages.length}`);
    console.log(`Errors: ${errorMessages.length}`);
    console.log(`Warnings: ${warningMessages.length}`);

    if (errorMessages.length > 0) {
      console.log('\n❌ Error messages:');
      errorMessages.forEach(msg => console.log(`  ${msg}`));
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error);
  } finally {
    console.log('\n🏁 Test complete. Browser will close in 5 seconds...');
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

testSquarePayments().catch(console.error);

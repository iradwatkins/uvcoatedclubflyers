/**
 * Test Admin Login Workflow
 */

import { chromium } from 'playwright';

async function testAdminLogin() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║        Admin Login Test - UV Coated Flyers            ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to login page
    console.log('🌐 Navigating to login page...');
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    console.log('✅ Login page loaded\n');

    // Take screenshot of login page
    await page.screenshot({ path: 'screenshots/01-login-page.png', fullPage: true });
    console.log('📸 Screenshot saved: screenshots/01-login-page.png\n');

    // Fill in credentials
    console.log('🔐 Entering admin credentials...');
    await page.waitForSelector('#email', { state: 'visible' });
    await page.fill('#email', 'ira@irawatkins.com');
    await page.fill('#password', 'Bobby321!');
    console.log('✅ Credentials entered\n');

    // Take screenshot before login
    await page.screenshot({ path: 'screenshots/02-credentials-filled.png', fullPage: true });
    console.log('📸 Screenshot saved: screenshots/02-credentials-filled.png\n');

    // Click login button
    console.log('🖱️  Clicking login button...');
    await page.click('button[type="submit"]');

    // Wait for navigation
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    console.log('✅ Login submitted\n');

    // Take screenshot after login
    await page.screenshot({ path: 'screenshots/03-after-login.png', fullPage: true });
    console.log('📸 Screenshot saved: screenshots/03-after-login.png\n');

    // Check current URL
    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}\n`);

    // Try to navigate to admin panel
    console.log('🔄 Navigating to admin panel...');
    await page.goto('http://localhost:3000/admin');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    console.log('✅ Admin panel loaded\n');

    // Take screenshot of admin panel
    await page.screenshot({ path: 'screenshots/04-admin-panel.png', fullPage: true });
    console.log('📸 Screenshot saved: screenshots/04-admin-panel.png\n');

    // Check if we're on admin page
    const adminUrl = page.url();
    console.log(`📍 Admin URL: ${adminUrl}\n`);

    if (adminUrl.includes('/admin')) {
      console.log('✅ Successfully accessed admin panel!\n');

      // Try to navigate to orders page
      console.log('🔄 Navigating to admin orders...');
      await page.goto('http://localhost:3000/admin/orders');
      await page.waitForLoadState('networkidle', { timeout: 10000 });

      await page.screenshot({ path: 'screenshots/05-admin-orders.png', fullPage: true });
      console.log('📸 Screenshot saved: screenshots/05-admin-orders.png\n');

      // Try to navigate to customers page
      console.log('🔄 Navigating to admin customers...');
      await page.goto('http://localhost:3000/admin/customers');
      await page.waitForLoadState('networkidle', { timeout: 10000 });

      await page.screenshot({ path: 'screenshots/06-admin-customers.png', fullPage: true });
      console.log('📸 Screenshot saved: screenshots/06-admin-customers.png\n');

      console.log('╔════════════════════════════════════════════════════════╗');
      console.log('║              Admin Login Test PASSED! ✅               ║');
      console.log('╚════════════════════════════════════════════════════════╝\n');
    } else {
      console.log('❌ Failed to access admin panel - redirected to:', adminUrl);
      console.log('   This may indicate an authorization issue.\n');
    }

    console.log('📝 Screenshots saved in ./screenshots/ directory');
    console.log('   You can review them to see the login flow.\n');

    // Keep browser open for 10 seconds so you can see it
    console.log('⏱️  Browser will close in 10 seconds...\n');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('\n❌ Error during admin login test:', error);
    await page.screenshot({ path: 'screenshots/error.png', fullPage: true });
    console.log('📸 Error screenshot saved: screenshots/error.png\n');
  } finally {
    await browser.close();
  }
}

testAdminLogin().catch(console.error);

import { chromium, Browser, Page } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

interface TestResult {
  method: string
  testNumber: number
  status: 'PASS' | 'FAIL'
  loadTime: number
  error?: string
  screenshot?: string
}

const TEST_URL = 'http://localhost:3001/test-payments'
const SCREENSHOT_DIR = path.join(process.cwd(), 'test-screenshots')
const TEST_ITERATIONS = 10

// Create screenshot directory
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })
}

async function waitForPaymentMethodRendering(
  page: Page,
  method: 'square' | 'cashapp' | 'paypal'
): Promise<{ success: boolean; error?: string; loadTime: number }> {
  const startTime = Date.now()

  try {
    if (method === 'square') {
      // Wait for Square card container and verify it's not just showing "Loading..."
      await page.waitForSelector('#square-card-container', { timeout: 30000 })

      // Wait a bit for SDK to attach
      await page.waitForTimeout(3000)

      // Check if card fields are actually rendered (Square SDK creates iframes)
      const hasCardFields = await page.evaluate(() => {
        const container = document.querySelector('#square-card-container')
        if (!container) return false

        // Square SDK injects iframes for card fields
        const iframes = container.querySelectorAll('iframe')
        return iframes.length > 0
      })

      if (!hasCardFields) {
        // Check if still showing loading message
        const isLoading = await page.locator('text=Loading payment form').isVisible()
        if (isLoading) {
          throw new Error('Square card form stuck on loading state')
        }
        throw new Error('Square card fields did not render')
      }

      console.log('  ✅ Square card fields rendered successfully')
    } else if (method === 'cashapp') {
      // Wait for Cash App container
      await page.waitForSelector('#cash-app-pay', { timeout: 30000 })

      // Wait for button to render
      await page.waitForTimeout(3000)

      // Check if Cash App button is actually rendered
      const hasCashAppButton = await page.evaluate(() => {
        const container = document.querySelector('#cash-app-pay')
        if (!container) return false

        // Cash App Pay button should have child elements or specific classes
        return container.children.length > 0 || container.innerHTML.trim().length > 0
      })

      if (!hasCashAppButton) {
        const isLoading = await page.locator('text=Loading Cash App Pay').isVisible()
        if (isLoading) {
          throw new Error('Cash App Pay stuck on loading state')
        }
        throw new Error('Cash App Pay button did not render')
      }

      console.log('  ✅ Cash App Pay button rendered successfully')
    } else if (method === 'paypal') {
      // PayPal is different - it uses a ref, so we need to check for PayPal buttons
      await page.waitForTimeout(3000)

      // Check for PayPal buttons (they have specific classes/attributes)
      const hasPayPalButtons = await page.evaluate(() => {
        // PayPal SDK creates elements with specific attributes
        const paypalElements = document.querySelectorAll('[data-funding-source="paypal"]')
        return paypalElements.length > 0
      })

      if (!hasPayPalButtons) {
        // Try alternate check - look for PayPal iframe
        const hasPayPalIframe = await page.evaluate(() => {
          const iframes = document.querySelectorAll('iframe[title*="PayPal"]')
          return iframes.length > 0
        })

        if (!hasPayPalIframe) {
          throw new Error('PayPal buttons did not render')
        }
      }

      console.log('  ✅ PayPal buttons rendered successfully')
    }

    const loadTime = Date.now() - startTime
    return { success: true, loadTime }
  } catch (error) {
    const loadTime = Date.now() - startTime
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      loadTime,
    }
  }
}

async function testPaymentMethod(
  browser: Browser,
  method: 'square' | 'cashapp' | 'paypal',
  iteration: number
): Promise<TestResult> {
  const methodNames = {
    square: 'Square Card Payment',
    cashapp: 'Cash App Pay',
    paypal: 'PayPal Payment',
  }

  const buttonTexts = {
    square: 'Square Card Payment',
    cashapp: 'Cash App Pay',
    paypal: 'PayPal Payment',
  }

  console.log(`\n🧪 Testing ${methodNames[method]} - Iteration ${iteration + 1}/${TEST_ITERATIONS}`)

  const page = await browser.newPage({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
  })
  const startTime = Date.now()

  try {
    // Navigate to test page
    await page.goto(TEST_URL, { waitUntil: 'networkidle' })
    console.log('  📄 Test page loaded')

    // Click payment method button
    await page.click(`button:has-text("${buttonTexts[method]}")`)
    console.log(`  🖱️  Clicked ${methodNames[method]} button`)

    // Wait for payment method to render
    const renderResult = await waitForPaymentMethodRendering(page, method)

    if (!renderResult.success) {
      // Take screenshot of failure
      const screenshotPath = path.join(
        SCREENSHOT_DIR,
        `${method}-test${iteration + 1}-FAIL.png`
      )
      await page.screenshot({ path: screenshotPath, fullPage: true })
      console.log(`  📸 Failure screenshot: ${screenshotPath}`)

      await page.close()
      return {
        method: methodNames[method],
        testNumber: iteration + 1,
        status: 'FAIL',
        loadTime: renderResult.loadTime,
        error: renderResult.error,
        screenshot: screenshotPath,
      }
    }

    // Take screenshot of success
    const screenshotPath = path.join(
      SCREENSHOT_DIR,
      `${method}-test${iteration + 1}-PASS.png`
    )
    await page.screenshot({ path: screenshotPath, fullPage: true })

    const totalTime = Date.now() - startTime
    console.log(`  ✅ Test PASSED in ${totalTime}ms`)
    console.log(`  📸 Screenshot: ${screenshotPath}`)

    await page.close()
    return {
      method: methodNames[method],
      testNumber: iteration + 1,
      status: 'PASS',
      loadTime: totalTime,
      screenshot: screenshotPath,
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.log(`  ❌ Test FAILED: ${errorMsg}`)

    // Take screenshot of error
    const screenshotPath = path.join(
      SCREENSHOT_DIR,
      `${method}-test${iteration + 1}-ERROR.png`
    )
    try {
      await page.screenshot({ path: screenshotPath, fullPage: true })
      console.log(`  📸 Error screenshot: ${screenshotPath}`)
    } catch (e) {
      console.log('  ⚠️  Could not capture screenshot')
    }

    await page.close()
    return {
      method: methodNames[method],
      testNumber: iteration + 1,
      status: 'FAIL',
      loadTime: Date.now() - startTime,
      error: errorMsg,
      screenshot: screenshotPath,
    }
  }
}

async function generateReport(results: TestResult[]) {
  const squareResults = results.filter((r) => r.method === 'Square Card Payment')
  const cashappResults = results.filter((r) => r.method === 'Cash App Pay')
  const paypalResults = results.filter((r) => r.method === 'PayPal Payment')

  const squarePasses = squareResults.filter((r) => r.status === 'PASS').length
  const cashappPasses = cashappResults.filter((r) => r.status === 'PASS').length
  const paypalPasses = paypalResults.filter((r) => r.status === 'PASS').length

  const totalPasses = results.filter((r) => r.status === 'PASS').length
  const totalTests = results.length

  const report = `# Payment Rendering Test Report

**Date:** ${new Date().toLocaleString()}
**Test URL:** ${TEST_URL}
**Total Tests:** ${totalTests}
**Passed:** ${totalPasses}/${totalTests} (${((totalPasses / totalTests) * 100).toFixed(1)}%)
**Failed:** ${totalTests - totalPasses}/${totalTests}

---

## Summary by Payment Method

| Payment Method | Tests Run | Passed | Failed | Pass Rate |
|---------------|-----------|---------|--------|-----------|
| Square Card Payment | ${squareResults.length} | ${squarePasses} | ${squareResults.length - squarePasses} | ${((squarePasses / squareResults.length) * 100).toFixed(1)}% |
| Cash App Pay | ${cashappResults.length} | ${cashappPasses} | ${cashappResults.length - cashappPasses} | ${((cashappPasses / cashappResults.length) * 100).toFixed(1)}% |
| PayPal Payment | ${paypalResults.length} | ${paypalPasses} | ${paypalResults.length - paypalPasses} | ${((paypalPasses / paypalResults.length) * 100).toFixed(1)}% |

---

## Detailed Test Results

### Square Card Payment

${squareResults
  .map(
    (r) => `
**Test #${r.testNumber}** - ${r.status === 'PASS' ? '✅ PASS' : '❌ FAIL'}
- Load Time: ${r.loadTime}ms
${r.error ? `- Error: ${r.error}` : ''}
- Screenshot: \`${r.screenshot}\`
`
  )
  .join('\n')}

---

### Cash App Pay

${cashappResults
  .map(
    (r) => `
**Test #${r.testNumber}** - ${r.status === 'PASS' ? '✅ PASS' : '❌ FAIL'}
- Load Time: ${r.loadTime}ms
${r.error ? `- Error: ${r.error}` : ''}
- Screenshot: \`${r.screenshot}\`
`
  )
  .join('\n')}

---

### PayPal Payment

${paypalResults
  .map(
    (r) => `
**Test #${r.testNumber}** - ${r.status === 'PASS' ? '✅ PASS' : '❌ FAIL'}
- Load Time: ${r.loadTime}ms
${r.error ? `- Error: ${r.error}` : ''}
- Screenshot: \`${r.screenshot}\`
`
  )
  .join('\n')}

---

## Performance Metrics

### Average Load Times

- **Square Card Payment:** ${(squareResults.reduce((sum, r) => sum + r.loadTime, 0) / squareResults.length).toFixed(0)}ms
- **Cash App Pay:** ${(cashappResults.reduce((sum, r) => sum + r.loadTime, 0) / cashappResults.length).toFixed(0)}ms
- **PayPal Payment:** ${(paypalResults.reduce((sum, r) => sum + r.loadTime, 0) / paypalResults.length).toFixed(0)}ms

---

## Recommendations

${
  totalPasses === totalTests
    ? '✅ All tests passed! Payment rendering is working correctly across all methods.'
    : `⚠️  ${totalTests - totalPasses} test(s) failed. Please review the error messages and screenshots above.

### Common Issues to Check:
1. Verify Square SDK is loading correctly (check browser console)
2. Ensure environment variables are set correctly
3. Check for network errors in browser DevTools
4. Review container rendering timing issues
5. Verify SDK versions are up to date`
}

---

**Test completed at:** ${new Date().toLocaleString()}
`

  const reportPath = path.join(process.cwd(), 'PAYMENT-RENDERING-TEST-REPORT.md')
  fs.writeFileSync(reportPath, report)

  console.log(`\n📄 Test report generated: ${reportPath}`)
  return reportPath
}

async function main() {
  console.log('🚀 Starting Payment Rendering Tests')
  console.log('=' .repeat(60))
  console.log(`Test URL: ${TEST_URL}`)
  console.log(`Iterations per method: ${TEST_ITERATIONS}`)
  console.log(`Total tests: ${TEST_ITERATIONS * 3} (${TEST_ITERATIONS} × 3 methods)`)
  console.log(`Screenshot directory: ${SCREENSHOT_DIR}`)
  console.log('=' .repeat(60))

  const browser = await chromium.launch({
    headless: false,
    args: ['--disable-blink-features=AutomationControlled']
  })
  const results: TestResult[] = []

  try {
    // Test Square Card Payment 10 times
    console.log('\n\n🔵 Testing Square Card Payment (10 iterations)')
    console.log('-' .repeat(60))
    for (let i = 0; i < TEST_ITERATIONS; i++) {
      const result = await testPaymentMethod(browser, 'square', i)
      results.push(result)
      // Small delay between tests
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    // Test Cash App Pay 10 times
    console.log('\n\n🟢 Testing Cash App Pay (10 iterations)')
    console.log('-' .repeat(60))
    for (let i = 0; i < TEST_ITERATIONS; i++) {
      const result = await testPaymentMethod(browser, 'cashapp', i)
      results.push(result)
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    // Test PayPal 10 times
    console.log('\n\n🟡 Testing PayPal Payment (10 iterations)')
    console.log('-' .repeat(60))
    for (let i = 0; i < TEST_ITERATIONS; i++) {
      const result = await testPaymentMethod(browser, 'paypal', i)
      results.push(result)
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    // Generate report
    console.log('\n\n📊 Generating Test Report')
    console.log('=' .repeat(60))
    const reportPath = await generateReport(results)

    // Print summary
    const totalPasses = results.filter((r) => r.status === 'PASS').length
    const totalTests = results.length

    console.log('\n\n✨ TEST SUMMARY')
    console.log('=' .repeat(60))
    console.log(`Total Tests: ${totalTests}`)
    console.log(`Passed: ${totalPasses}/${totalTests} (${((totalPasses / totalTests) * 100).toFixed(1)}%)`)
    console.log(`Failed: ${totalTests - totalPasses}/${totalTests}`)
    console.log('=' .repeat(60))

    if (totalPasses === totalTests) {
      console.log('\n🎉 SUCCESS! All payment methods rendered correctly!')
    } else {
      console.log(`\n⚠️  ${totalTests - totalPasses} test(s) failed. See report for details.`)
    }

    console.log(`\n📄 Full report: ${reportPath}`)
    console.log(`📸 Screenshots: ${SCREENSHOT_DIR}`)
  } finally {
    await browser.close()
  }
}

main().catch((error) => {
  console.error('❌ Test execution failed:', error)
  process.exit(1)
})

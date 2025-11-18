# UV Coated Club Flyers - Test Suite Documentation

## Overview

Comprehensive end-to-end testing suite for the UV Coated Club Flyers e-commerce application.

## Test Coverage

### 1. Playwright E2E Tests
Location: `tests/playwright/`

- **checkout-fedex.spec.ts**: Complete FedEx Ground checkout flow
- **checkout-southwest.spec.ts**: Complete Southwest Cargo airport pickup flow
- **upload-and-weight.spec.ts**: Multi-image upload and weight calculation validation

**Features Tested:**
- Product configuration (quantity, size, material, coating, sides)
- Multi-image upload (front and back)
- Cart operations
- 4-step checkout process
- Weight calculation (paperWeight × width × height × quantity)
- Box splitting logic (36 lbs max per box)
- Shipping rate calculation
- Order summary validation (subtotal, shipping, tax, total)
- Payment method UI (Square, Cash App, PayPal)

### 2. Puppeteer Tests
Location: `tests/puppeteer/`

- **form-validation.test.ts**: Form validation and screenshot capture

**Features Tested:**
- Empty field validation
- Email format validation
- Zip code format validation
- Required field highlighting
- State dropdown population
- Phone number formatting
- Mobile responsiveness
- Payment method UI

### 3. Chrome DevTools Monitoring
Location: `tests/devtools/`

- **network-monitor.ts**: Network and performance monitoring

**Features Monitored:**
- All network requests (API calls, uploads, third-party services)
- Failed requests (4xx, 5xx errors)
- Slow requests (>2s threshold)
- Console errors and warnings
- Performance metrics (FCP, DOM Interactive, Load Complete)
- HAR file export
- Detailed network report

### 4. Thunder Client API Tests
Location: `tests/thunder-client/`

- **uv-coated-tests.json**: Complete API test collection

**API Endpoints Tested:**
- GET `/api/health` - Health check
- GET `/api/cart` - Get cart contents
- POST `/api/cart/add` - Add item to cart
- POST `/api/cart/update` - Update cart item
- POST `/api/cart/remove` - Remove cart item
- POST `/api/cart/clear` - Clear cart
- GET `/api/shipping/airports?state=GA` - Get Georgia airports
- POST `/api/shipping/calculate` - Calculate shipping rates
- POST `/api/orders/create` - Create order
- GET `/api/orders/:id` - Get order details
- POST `/api/checkout/process-square-payment` - Process Square payment
- POST `/api/checkout/create-paypal-order` - Create PayPal order
- POST `/api/checkout/capture-paypal-order` - Capture PayPal payment

## Test Scenarios

### Scenario 1: FedEx Ground Shipping
```
Product: 5,000 UV-coated club flyers
Size: 4x6 inches
Material: 9pt card stock
Coating: UV coating
Sides: Both sides (different images)
Images: 2 uploads (front and back)

Shipping Address:
976 Carr Street
Atlanta, GA 30318

Weight Calculation:
0.009 lbs/sq in × 4" × 6" × 5,000 = 1,080 lbs

Box Splitting:
1,080 lbs ÷ 36 lbs max = 30 boxes
Packaging: 30 × 0.5 lbs = 15 lbs
Total: 1,095 lbs

Payment Methods: Square Card, Cash App, PayPal
```

### Scenario 2: Southwest Cargo Airport Pickup
```
Product: Same configuration as Scenario 1

Pickup Location:
Hartsfield-Jackson Atlanta International Airport (ATL)
6000 North Terminal Parkway
Atlanta, GA 30320

Airport Selection:
- State: Georgia
- Airport Code: ATL
- Hours: Available in airport details

Weight Calculation: Same as Scenario 1

Payment Methods: Square Card, Cash App, PayPal
```

## Setup Instructions

### Prerequisites
1. Node.js 18+ installed
2. All dependencies installed: `npm install`
3. Development server running: `npm run dev`
4. Test images available in: `/Users/irawatkins/Desktop/images for testing`

### Installation
```bash
# Install Playwright browsers
npx playwright install chromium

# Make test script executable
chmod +x tests/run-all-tests.sh
```

## Running Tests

### All Tests (Recommended)
```bash
# Run complete test suite (2x for consistency)
npm run test:all

# Or directly:
./tests/run-all-tests.sh
```

### Individual Test Suites

#### Playwright Tests
```bash
# Run all Playwright tests
npm run test:playwright

# Run specific test file
npx playwright test tests/playwright/checkout-fedex.spec.ts

# Run with UI mode
npx playwright test --ui

# Run with headed browser
npx playwright test --headed
```

#### Puppeteer Tests
```bash
# Run Puppeteer tests
npm run test:puppeteer

# Or directly:
npx ts-node tests/puppeteer/form-validation.test.ts
```

#### Chrome DevTools Monitoring
```bash
# Run network monitor
npm run test:devtools

# Or directly:
npx ts-node tests/devtools/network-monitor.ts
```

#### Thunder Client API Tests
1. Open VS Code
2. Install Thunder Client extension
3. Import collection: `tests/thunder-client/uv-coated-tests.json`
4. Set environment variables in Thunder Client
5. Run all tests in collection
6. Export results

### Generate Test Report
```bash
# After running tests, generate comprehensive report
npm run test:report

# Or with custom results directory:
npx ts-node tests/generate-report.ts test-results/run_20250117_123456
```

## Test Results

Test results are saved to: `test-results/run_YYYYMMDD_HHMMSS/`

### Directory Structure
```
test-results/
└── run_20250117_123456/
    ├── summary.json              # Test execution summary
    ├── TEST-REPORT.md           # Comprehensive markdown report
    ├── screenshots/             # Test screenshots
    ├── playwright-run1/         # First Playwright execution
    ├── playwright-run2/         # Second Playwright execution
    ├── puppeteer-screenshots/   # Puppeteer screenshots
    ├── devtools-run1/           # First DevTools monitoring
    │   ├── network.har         # HAR file
    │   └── network-report.json # Network analysis
    └── devtools-run2/           # Second DevTools monitoring
        ├── network.har
        └── network-report.json
```

## Weight Calculation Details

### Formula
```
paperWeight (lbs/sq in) × width (in) × height (in) × quantity = totalWeight (lbs)
```

### Example: 9pt Card Stock, 4x6, 5000 qty
```
Paper Weight: 0.009 lbs/sq in
Size: 4" × 6" = 24 sq in
Quantity: 5,000 flyers

Calculation:
0.009 × 4 × 6 × 5,000 = 1,080 lbs

Box Splitting (36 lbs max):
1,080 ÷ 36 = 30 boxes

Packaging:
30 boxes × 0.5 lbs = 15 lbs

Total Shipping Weight:
1,080 + 15 = 1,095 lbs
```

### Paper Stock Weights
| Stock | Weight (lbs/sq in) |
|-------|-------------------|
| 8pt   | 0.008            |
| 9pt   | 0.009            |
| 10pt  | 0.010            |
| 12pt  | 0.012            |
| 14pt  | 0.014            |

## MCP Servers Used

All 13 MCP servers are utilized:

1. **Playwright MCP** - E2E browser automation
2. **Puppeteer MCP** - Alternative browser automation
3. **Chrome DevTools MCP** - Network/console/performance monitoring
4. **Thunder Client** - API testing
5. **GitHub MCP** - Version control
6. **Filesystem MCP** - File operations
7. **Sequential Thinking MCP** - Test analysis

## Troubleshooting

### Development server not running
```bash
# Start the server
npm run dev

# Verify it's running
curl http://localhost:3000/api/health
```

### Playwright browser not installed
```bash
npx playwright install chromium
```

### Test images not found
Ensure test images are located at:
```
/Users/irawatkins/Desktop/images for testing/
```
At least 2 image files (jpg, jpeg, png, or gif) required.

### Permission denied on test script
```bash
chmod +x tests/run-all-tests.sh
```

### TypeScript errors
```bash
npm install --save-dev @types/node @types/puppeteer
```

## CI/CD Integration

### GitHub Actions Example
```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run dev &
      - run: npm run test:all
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: test-results
          path: test-results/
```

## Best Practices

1. **Always run tests 2x** for consistency verification
2. **Review screenshots** for visual regression
3. **Check network logs** for API errors
4. **Validate weight calculations** match expected values
5. **Test all payment methods** (Square, Cash App, PayPal)
6. **Monitor performance metrics** (FCP, page load times)
7. **Export HAR files** for detailed network analysis

## Contributing

When adding new tests:

1. Follow existing test structure and naming conventions
2. Use Page Object Model pattern for Playwright tests
3. Add appropriate test data to `helpers/test-data.ts`
4. Include screenshots for visual verification
5. Update this README with new test coverage
6. Run full test suite before committing

## Support

For issues or questions:
- Review test results in `TEST-REPORT.md`
- Check console output for errors
- Review screenshots for visual issues
- Consult network logs for API problems

---

**Last Updated:** 2025-11-17
**Test Suite Version:** 1.0
**Maintained by:** UV Coated Development Team

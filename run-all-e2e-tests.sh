#!/bin/bash

#####################################################################
# COMPREHENSIVE E2E TEST EXECUTION SCRIPT
# UV Coated Club Flyers - Complete Order Workflow Testing
#
# This script runs all test suites 2 times each:
# - Playwright Tests (2 scenarios × 2 runs = 4 tests)
# - Puppeteer Tests (2 scenarios × 2 runs = 4 tests)
# - Chrome DevTools Monitoring
# - API Tests (Thunder Client collection)
#
# Total: 8 browser tests + monitoring + API validation
#####################################################################

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0;' # No Color
BOLD='\033[1m'

# Timestamp for test run
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
TEST_RUN_DIR="test-results/run-$TIMESTAMP"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "🚀 UV COATED FLYERS - COMPREHENSIVE E2E TEST SUITE"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Test Run ID: $TIMESTAMP"
echo "Output Directory: $TEST_RUN_DIR"
echo ""

# Create test results directory
mkdir -p "$TEST_RUN_DIR"
mkdir -p "$TEST_RUN_DIR/playwright"
mkdir -p "$TEST_RUN_DIR/puppeteer"
mkdir -p "$TEST_RUN_DIR/devtools"
mkdir -p "$TEST_RUN_DIR/api"

# Log file
LOGFILE="$TEST_RUN_DIR/test-execution.log"
echo "Test Execution Log - $TIMESTAMP" > "$LOGFILE"

#####################################################################
# STEP 1: Environment Check
#####################################################################
echo -e "${BLUE}${BOLD}📋 Step 1: Environment Check${NC}"
echo "─────────────────────────────────────────────────────────────"

# Check if dev server is running
echo -n "Checking dev server... "
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200\|302"; then
    echo -e "${GREEN}✓ Running${NC}"
else
    echo -e "${RED}✗ Not running${NC}"
    echo ""
    echo -e "${YELLOW}Please start the dev server first:${NC}"
    echo "  npm run dev"
    echo ""
    exit 1
fi

# Check database connection
echo -n "Checking database connection... "
if PGPASSWORD="${DB_PASSWORD:-changeme}" psql -h localhost -U uvcoated -d uvcoated_db -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Connected${NC}"
else
    echo -e "${YELLOW}⚠ Could not verify database${NC}"
fi

# Check test fixtures
echo -n "Checking test fixtures... "
if [ -f "tests/fixtures/flyer-front.png" ] && [ -f "tests/fixtures/flyer-back.png" ]; then
    echo -e "${GREEN}✓ Found${NC}"
else
    echo -e "${RED}✗ Missing test images${NC}"
    echo ""
    echo "Please ensure test images exist:"
    echo "  tests/fixtures/flyer-front.png"
    echo "  tests/fixtures/flyer-back.png"
    echo ""
    exit 1
fi

echo ""

#####################################################################
# STEP 2: Run Playwright Tests (2 runs each scenario)
#####################################################################
echo -e "${BLUE}${BOLD}🎭 Step 2: Playwright E2E Tests${NC}"
echo "─────────────────────────────────────────────────────────────"
echo ""

PLAYWRIGHT_PASSED=0
PLAYWRIGHT_FAILED=0

for run in 1 2; do
    echo -e "${BOLD}▶ Playwright Test Run #$run${NC}"
    echo ""

    # Run Playwright tests
    if npx playwright test tests/e2e/complete-uv-flyers-order.spec.ts --reporter=list 2>&1 | tee -a "$LOGFILE"; then
        echo -e "${GREEN}✓ Playwright Run #$run: PASSED${NC}"
        ((PLAYWRIGHT_PASSED+=2))  # 2 scenarios
    else
        echo -e "${RED}✗ Playwright Run #$run: FAILED${NC}"
        ((PLAYWRIGHT_FAILED+=2))
    fi

    # Copy screenshots
    if [ -d "test-results/complete-order-tests" ]; then
        cp -r test-results/complete-order-tests "$TEST_RUN_DIR/playwright/run-$run" 2>/dev/null || true
    fi

    echo ""

    # Wait between runs
    if [ $run -eq 1 ]; then
        echo "Waiting 5 seconds before next run..."
        sleep 5
        echo ""
    fi
done

echo ""

#####################################################################
# STEP 3: Run Puppeteer Tests (2 runs each scenario)
#####################################################################
echo -e "${BLUE}${BOLD}🤖 Step 3: Puppeteer E2E Tests${NC}"
echo "─────────────────────────────────────────────────────────────"
echo ""

PUPPETEER_PASSED=0
PUPPETEER_FAILED=0

for run in 1 2; do
    echo -e "${BOLD}▶ Puppeteer Test Run #$run${NC}"
    echo ""

    # Run Puppeteer tests
    if npx tsx tests/puppeteer/complete-order-puppeteer.test.ts 2>&1 | tee -a "$LOGFILE"; then
        echo -e "${GREEN}✓ Puppeteer Run #$run: PASSED${NC}"
        ((PUPPETEER_PASSED+=2))  # 2 scenarios
    else
        echo -e "${RED}✗ Puppeteer Run #$run: FAILED${NC}"
        ((PUPPETEER_FAILED+=2))
    fi

    # Copy screenshots
    if [ -d "test-results/puppeteer-tests" ]; then
        cp -r test-results/puppeteer-tests "$TEST_RUN_DIR/puppeteer/run-$run" 2>/dev/null || true
    fi

    echo ""

    # Wait between runs
    if [ $run -eq 1 ]; then
        echo "Waiting 5 seconds before next run..."
        sleep 5
        echo ""
    fi
done

echo ""

#####################################################################
# STEP 4: Run Chrome DevTools Monitoring
#####################################################################
echo -e "${BLUE}${BOLD}🔍 Step 4: Chrome DevTools Monitoring${NC}"
echo "─────────────────────────────────────────────────────────────"
echo ""

DEVTOOLS_PASSED=0
DEVTOOLS_FAILED=0

# Monitor product page
echo "▶ Monitoring Product Page..."
if npx tsx tests/devtools/chrome-devtools-monitor.ts product 2>&1 | tee -a "$LOGFILE"; then
    echo -e "${GREEN}✓ Product page monitoring: PASSED${NC}"
    ((DEVTOOLS_PASSED++))
else
    echo -e "${RED}✗ Product page monitoring: FAILED${NC}"
    ((DEVTOOLS_FAILED++))
fi

echo ""

# Monitor checkout flow
echo "▶ Monitoring Checkout Flow..."
if npx tsx tests/devtools/chrome-devtools-monitor.ts checkout 2>&1 | tee -a "$LOGFILE"; then
    echo -e "${GREEN}✓ Checkout flow monitoring: PASSED${NC}"
    ((DEVTOOLS_PASSED++))
else
    echo -e "${RED}✗ Checkout flow monitoring: FAILED${NC}"
    ((DEVTOOLS_FAILED++))
fi

# Copy monitoring reports
if [ -d "test-results/devtools-monitoring" ]; then
    cp -r test-results/devtools-monitoring "$TEST_RUN_DIR/devtools/" 2>/dev/null || true
fi

echo ""

#####################################################################
# STEP 5: Thunder Client API Tests (Info Only)
#####################################################################
echo -e "${BLUE}${BOLD}⚡ Step 5: API Test Collection${NC}"
echo "─────────────────────────────────────────────────────────────"
echo ""

echo "Thunder Client collection created at:"
echo "  tests/thunder-client/uv-flyers-api-collection.json"
echo ""
echo "To run API tests:"
echo "  1. Import collection into Thunder Client (VS Code extension)"
echo "  2. Run all requests in sequence"
echo "  3. Verify all tests pass with green checkmarks"
echo ""
echo "The collection includes 18 API endpoints covering:"
echo "  • Product configuration and pricing"
echo "  • Cart management"
echo "  • File uploads"
echo "  • Shipping rate calculation (FedEx & Southwest Cargo)"
echo "  • Payment processing (Square test card)"
echo "  • Order creation and verification"
echo "  • Admin order management"
echo ""

#####################################################################
# STEP 6: Calculate Results
#####################################################################
TOTAL_TESTS=$((PLAYWRIGHT_PASSED + PLAYWRIGHT_FAILED + PUPPETEER_PASSED + PUPPETEER_FAILED + DEVTOOLS_PASSED + DEVTOOLS_FAILED))
TOTAL_PASSED=$((PLAYWRIGHT_PASSED + PUPPETEER_PASSED + DEVTOOLS_PASSED))
TOTAL_FAILED=$((PLAYWRIGHT_FAILED + PUPPETEER_FAILED + DEVTOOLS_FAILED))

#####################################################################
# STEP 7: Generate Summary Report
#####################################################################
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo -e "${BOLD}📊 TEST EXECUTION SUMMARY${NC}"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Test Run: $TIMESTAMP"
echo "Total Tests: $TOTAL_TESTS"
echo ""
echo "Results by Suite:"
echo "─────────────────────────────────────────────────────────────"
echo -e "  Playwright:  ${GREEN}$PLAYWRIGHT_PASSED passed${NC}  ${RED}$PLAYWRIGHT_FAILED failed${NC}"
echo -e "  Puppeteer:   ${GREEN}$PUPPETEER_PASSED passed${NC}  ${RED}$PUPPETEER_FAILED failed${NC}"
echo -e "  DevTools:    ${GREEN}$DEVTOOLS_PASSED passed${NC}  ${RED}$DEVTOOLS_FAILED failed${NC}"
echo "─────────────────────────────────────────────────────────────"
echo -e "  ${BOLD}TOTAL:       ${GREEN}$TOTAL_PASSED passed${NC}  ${RED}$TOTAL_FAILED failed${NC}${BOLD}"
echo ""

if [ $TOTAL_FAILED -eq 0 ]; then
    echo -e "${GREEN}${BOLD}✅ ALL TESTS PASSED!${NC}"
    PASS_RATE="100%"
else
    PASS_RATE=$(echo "scale=1; $TOTAL_PASSED * 100 / $TOTAL_TESTS" | bc)
    echo -e "${YELLOW}${BOLD}⚠️  SOME TESTS FAILED${NC}"
    echo -e "Pass Rate: ${PASS_RATE}%"
fi

echo ""
echo "Test Artifacts:"
echo "  • Screenshots: $TEST_RUN_DIR/playwright/ & $TEST_RUN_DIR/puppeteer/"
echo "  • DevTools Reports: $TEST_RUN_DIR/devtools/"
echo "  • Execution Log: $LOGFILE"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Save summary to file
cat > "$TEST_RUN_DIR/SUMMARY.md" << EOF
# E2E Test Suite Results

**Test Run:** $TIMESTAMP
**Total Tests:** $TOTAL_TESTS
**Passed:** $TOTAL_PASSED
**Failed:** $TOTAL_FAILED
**Pass Rate:** $PASS_RATE%

## Results by Suite

| Suite | Passed | Failed |
|-------|--------|--------|
| Playwright | $PLAYWRIGHT_PASSED | $PLAYWRIGHT_FAILED |
| Puppeteer | $PUPPETEER_PASSED | $PUPPETEER_FAILED |
| DevTools Monitoring | $DEVTOOLS_PASSED | $DEVTOOLS_FAILED |

## Test Scenarios

### Playwright Tests (Run 2x each)
- ✓ FedEx Ground Shipping to Atlanta, GA
- ✓ Southwest Cargo Airport Pickup at ATL

### Puppeteer Tests (Run 2x each)
- ✓ FedEx Ground Shipping (Cross-validation)
- ✓ Southwest Cargo Airport Pickup (Cross-validation)

### DevTools Monitoring
- ✓ Product Page Performance
- ✓ Checkout Flow Performance

### API Tests (Thunder Client)
- 📄 Collection: tests/thunder-client/uv-flyers-api-collection.json
- 18 endpoints covering complete order workflow

## Test Artifacts

- Screenshots: \`$TEST_RUN_DIR/playwright/\` & \`$TEST_RUN_DIR/puppeteer/\`
- DevTools Reports: \`$TEST_RUN_DIR/devtools/\`
- Execution Log: \`$LOGFILE\`

## Product Configuration Tested

- **Quantity:** 5,000 flyers
- **Size:** 4×6 inches
- **Paper Stock:** 9pt C2S Cardstock
- **Coating:** UV Both Sides
- **Turnaround:** 2-4 Days Standard
- **Images:** 2 different images (front/back)

## Weight Verification

- **Formula:** 0.000333333333 × 24 × 5000 = 40 lbs
- **Expected Range:** 39-41 lbs
- **Boxes Required:** 2 (36 lb max per box)

## Shipping Methods Tested

1. **FedEx Ground**
   - Destination: 976 Carr Street, Atlanta, GA 30318
   - Service: FEDEX_GROUND

2. **Southwest Cargo**
   - Airport: Hartsfield-Jackson Atlanta International (ATL)
   - Service: AIRPORT_PICKUP

## Status

$(if [ $TOTAL_FAILED -eq 0 ]; then echo "✅ ALL TESTS PASSED"; else echo "⚠️ SOME TESTS FAILED - Review logs for details"; fi)

---
Generated: $(date)
EOF

echo -e "${GREEN}✓ Summary report saved to: $TEST_RUN_DIR/SUMMARY.md${NC}"
echo ""

# Exit with appropriate code
if [ $TOTAL_FAILED -eq 0 ]; then
    exit 0
else
    exit 1
fi

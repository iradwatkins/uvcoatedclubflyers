#!/bin/bash

###############################################################################
# UV Coated Club Flyers - Comprehensive Test Execution Script
#
# Runs all tests twice for consistency verification:
# 1. Playwright E2E tests
# 2. Puppeteer validation tests
# 3. Chrome DevTools monitoring
# 4. Thunder Client API tests (manual)
###############################################################################

set -e  # Exit on error

echo "======================================================================"
echo "UV Coated Club Flyers - Test Suite"
echo "======================================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create results directory
RESULTS_DIR="test-results"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RUN_DIR="${RESULTS_DIR}/run_${TIMESTAMP}"

mkdir -p "${RUN_DIR}"
mkdir -p "${RUN_DIR}/screenshots"
mkdir -p "${RUN_DIR}/playwright-report"
mkdir -p "${RUN_DIR}/puppeteer-screenshots"
mkdir -p "${RUN_DIR}/devtools"

echo -e "${BLUE}Results will be saved to: ${RUN_DIR}${NC}"
echo ""

# Function to run tests and capture output
run_test_suite() {
  local suite_name=$1
  local command=$2
  local run_number=$3

  echo ""
  echo -e "${YELLOW}======================================================================"
  echo -e "Running: ${suite_name} (Run #${run_number})"
  echo -e "======================================================================${NC}"
  echo ""

  if eval "${command}"; then
    echo -e "${GREEN}✅ ${suite_name} (Run #${run_number}) PASSED${NC}"
    return 0
  else
    echo -e "${RED}❌ ${suite_name} (Run #${run_number}) FAILED${NC}"
    return 1
  fi
}

# Check if dev server is running
echo -e "${BLUE}Checking if development server is running...${NC}"
if ! curl -s http://localhost:3000/api/health > /dev/null; then
  echo -e "${RED}❌ Development server is not running!${NC}"
  echo -e "${YELLOW}Please start the server with: npm run dev${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Development server is running${NC}"
echo ""

# Initialize test results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

###############################################################################
# RUN 1: First execution of all tests
###############################################################################

echo ""
echo -e "${BLUE}======================================================================"
echo -e "FIRST TEST RUN"
echo -e "======================================================================${NC}"
echo ""

# Playwright Tests - Run 1
if run_test_suite "Playwright Tests" "npx playwright test --reporter=html,json" 1; then
  ((PASSED_TESTS++))
else
  ((FAILED_TESTS++))
fi
((TOTAL_TESTS++))

# Copy Playwright results
if [ -d "test-results/playwright-report" ]; then
  cp -r test-results/playwright-report "${RUN_DIR}/playwright-run1"
fi

sleep 2

# Puppeteer Tests - Run 1
echo ""
echo -e "${YELLOW}Note: Puppeteer tests require manual execution with Jest/Mocha${NC}"
echo -e "${YELLOW}To run: npx ts-node tests/puppeteer/form-validation.test.ts${NC}"
echo ""

# Chrome DevTools Monitoring - Run 1
if run_test_suite "Chrome DevTools Network Monitor" "npx ts-node tests/devtools/network-monitor.ts" 1; then
  ((PASSED_TESTS++))
else
  ((FAILED_TESTS++))
fi
((TOTAL_TESTS++))

# Copy DevTools results
if [ -d "test-results/devtools" ]; then
  cp -r test-results/devtools "${RUN_DIR}/devtools-run1"
fi

sleep 2

###############################################################################
# RUN 2: Second execution for consistency verification
###############################################################################

echo ""
echo -e "${BLUE}======================================================================"
echo -e "SECOND TEST RUN (Consistency Verification)"
echo -e "======================================================================${NC}"
echo ""

# Playwright Tests - Run 2
if run_test_suite "Playwright Tests" "npx playwright test --reporter=html,json" 2; then
  ((PASSED_TESTS++))
else
  ((FAILED_TESTS++))
fi
((TOTAL_TESTS++))

# Copy Playwright results
if [ -d "test-results/playwright-report" ]; then
  cp -r test-results/playwright-report "${RUN_DIR}/playwright-run2"
fi

sleep 2

# Chrome DevTools Monitoring - Run 2
if run_test_suite "Chrome DevTools Network Monitor" "npx ts-node tests/devtools/network-monitor.ts" 2; then
  ((PASSED_TESTS++))
else
  ((FAILED_TESTS++))
fi
((TOTAL_TESTS++))

# Copy DevTools results
if [ -d "test-results/devtools" ]; then
  cp -r test-results/devtools "${RUN_DIR}/devtools-run2"
fi

###############################################################################
# Thunder Client API Tests (Manual)
###############################################################################

echo ""
echo -e "${YELLOW}======================================================================"
echo -e "Thunder Client API Tests"
echo -e "======================================================================${NC}"
echo ""
echo -e "${YELLOW}Thunder Client tests must be run manually:${NC}"
echo ""
echo -e "1. Open VS Code"
echo -e "2. Install Thunder Client extension"
echo -e "3. Import collection: tests/thunder-client/uv-coated-tests.json"
echo -e "4. Set environment variables"
echo -e "5. Run all tests in the collection"
echo -e "6. Export results"
echo ""

###############################################################################
# Generate Summary Report
###############################################################################

echo ""
echo -e "${BLUE}======================================================================"
echo -e "TEST EXECUTION SUMMARY"
echo -e "======================================================================${NC}"
echo ""
echo -e "Total Test Suites: ${TOTAL_TESTS}"
echo -e "${GREEN}Passed: ${PASSED_TESTS}${NC}"
echo -e "${RED}Failed: ${FAILED_TESTS}${NC}"
echo ""
echo -e "Test Results Location: ${RUN_DIR}"
echo ""

# Create summary JSON
cat > "${RUN_DIR}/summary.json" <<EOF
{
  "timestamp": "${TIMESTAMP}",
  "totalSuites": ${TOTAL_TESTS},
  "passed": ${PASSED_TESTS},
  "failed": ${FAILED_TESTS},
  "runDirectory": "${RUN_DIR}",
  "testSuites": {
    "playwright": {
      "run1": "playwright-run1",
      "run2": "playwright-run2"
    },
    "devtools": {
      "run1": "devtools-run1",
      "run2": "devtools-run2"
    },
    "thunderClient": "Manual execution required"
  }
}
EOF

echo -e "${GREEN}✅ Test execution complete!${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo -e "1. Review test results in ${RUN_DIR}"
echo -e "2. Run Thunder Client API tests manually"
echo -e "3. Generate final test report with: npm run test:report"
echo ""

# Exit with appropriate code
if [ ${FAILED_TESTS} -gt 0 ]; then
  exit 1
else
  exit 0
fi

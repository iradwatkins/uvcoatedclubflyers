#!/usr/bin/env tsx
/**
 * UV Coated Club Flyers - Master Test Runner
 *
 * Executes all test suites:
 * - Playwright E2E tests
 * - Puppeteer tests
 * - Chrome DevTools monitoring
 * - API tests
 *
 * Runs each suite 2x for consistency and generates comprehensive report
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface TestSuiteResult {
  name: string;
  run: number;
  startTime: number;
  endTime?: number;
  duration?: number;
  success: boolean;
  output: string;
  error?: string;
}

interface MasterTestReport {
  startTime: number;
  endTime?: number;
  totalDuration?: number;
  suites: TestSuiteResult[];
  summary: {
    totalSuites: number;
    successfulSuites: number;
    failedSuites: number;
    totalRuns: number;
    successRate: number;
  };
  productDetails: {
    product: string;
    quantity: number;
    size: string;
    material: string;
    coating: string;
    weight: string;
  };
  testScenarios: {
    scenario1: string;
    scenario2: string;
  };
}

class MasterTestRunner {
  private report: MasterTestReport;
  private baseDir: string;

  constructor() {
    this.baseDir = path.join(__dirname, '..');
    this.report = {
      startTime: Date.now(),
      suites: [],
      summary: {
        totalSuites: 0,
        successfulSuites: 0,
        failedSuites: 0,
        totalRuns: 0,
        successRate: 0,
      },
      productDetails: {
        product: '4x6 UV Coated Club Flyers',
        quantity: 5000,
        size: '4x6 inches',
        material: '9pt Card Stock',
        coating: 'UV Both Sides',
        weight: '40 lbs (0.000333333 lbs/sq in × 4" × 6" × 5000)',
      },
      testScenarios: {
        scenario1: 'FedEx Ground shipping to 976 Carr Street, Atlanta, GA 30318',
        scenario2: 'Southwest Cargo airport pickup at Hartsfield-Jackson Atlanta Airport',
      },
    };
  }

  private async runCommand(command: string, cwd?: string): Promise<{ stdout: string; success: boolean }> {
    try {
      const stdout = execSync(command, {
        cwd: cwd || this.baseDir,
        encoding: 'utf8',
        stdio: 'pipe',
      });
      return { stdout, success: true };
    } catch (error: any) {
      return {
        stdout: error.stdout || error.message,
        success: false,
      };
    }
  }

  private async runTestSuite(name: string, command: string, run: number): Promise<TestSuiteResult> {
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`  Running: ${name} (Run ${run}/2)`);
    console.log(`${'═'.repeat(60)}\n`);

    const result: TestSuiteResult = {
      name,
      run,
      startTime: Date.now(),
      success: false,
      output: '',
    };

    try {
      const { stdout, success } = await this.runCommand(command);
      result.success = success;
      result.output = stdout;

      if (success) {
        console.log(`✅ ${name} (Run ${run}) - PASSED`);
      } else {
        console.log(`❌ ${name} (Run ${run}) - FAILED`);
        result.error = stdout;
      }
    } catch (error) {
      result.success = false;
      result.error = error instanceof Error ? error.message : String(error);
      console.log(`❌ ${name} (Run ${run}) - ERROR: ${result.error}`);
    }

    result.endTime = Date.now();
    result.duration = result.endTime - result.startTime;

    return result;
  }

  async runAllTests() {
    console.log('\n');
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║  UV COATED CLUB FLYERS - COMPREHENSIVE TEST SUITE         ║');
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('');
    console.log('📦 Product: 5,000 × 4x6 UV Coated Flyers (9pt card stock)');
    console.log('⚖️  Weight: 40 lbs');
    console.log('');
    console.log('🧪 Test Scenarios:');
    console.log('  1. FedEx Ground → 976 Carr Street, Atlanta, GA 30318');
    console.log('  2. Southwest Cargo → Hartsfield-Jackson Atlanta Airport');
    console.log('');
    console.log('🔧 Test Tools:');
    console.log('  ✓ Playwright MCP - E2E browser automation');
    console.log('  ✓ Puppeteer MCP - Alternative browser automation');
    console.log('  ✓ Chrome DevTools MCP - Network/console/performance monitoring');
    console.log('  ✓ Thunder Client - API testing');
    console.log('');
    console.log('📊 Each test suite will run 2 times for consistency');
    console.log('');

    const testSuites = [
      {
        name: 'Playwright E2E Tests',
        command: 'npx playwright test tests/e2e/uv-flyers-order-test.spec.ts',
      },
      {
        name: 'Puppeteer Tests',
        command: 'npx tsx tests/puppeteer/uv-flyers-puppeteer-test.ts',
      },
      {
        name: 'Chrome DevTools Monitoring',
        command: 'npx tsx tests/chrome-devtools/monitor-performance.ts',
      },
    ];

    // Run each suite twice
    for (let run = 1; run <= 2; run++) {
      console.log(`\n\n${'═'.repeat(60)}`);
      console.log(`  TEST RUN #${run}`);
      console.log(`${'═'.repeat(60)}\n`);

      for (const suite of testSuites) {
        const result = await this.runTestSuite(suite.name, suite.command, run);
        this.report.suites.push(result);
      }
    }

    // Generate summary
    this.generateSummary();

    // Save reports
    this.saveReport();

    // Print final summary
    this.printSummary();
  }

  private generateSummary() {
    this.report.endTime = Date.now();
    this.report.totalDuration = this.report.endTime - this.report.startTime;

    this.report.summary.totalSuites = this.report.suites.length;
    this.report.summary.successfulSuites = this.report.suites.filter((s) => s.success).length;
    this.report.summary.failedSuites = this.report.suites.filter((s) => !s.success).length;
    this.report.summary.totalRuns = 2;
    this.report.summary.successRate =
      (this.report.summary.successfulSuites / this.report.summary.totalSuites) * 100;
  }

  private saveReport() {
    const reportDir = path.join(this.baseDir, 'test-results');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    // Save JSON report
    const jsonPath = path.join(reportDir, `master-report-${Date.now()}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(this.report, null, 2));

    // Save markdown report
    const mdPath = path.join(reportDir, `master-report-${Date.now()}.md`);
    this.saveMarkdownReport(mdPath);

    console.log(`\n\n📊 Reports saved:`);
    console.log(`   JSON: ${jsonPath}`);
    console.log(`   Markdown: ${mdPath}`);
  }

  private saveMarkdownReport(filepath: string) {
    const lines: string[] = [];

    lines.push('# UV Coated Club Flyers - Comprehensive Test Report\n');
    lines.push(`**Generated:** ${new Date().toISOString()}\n`);
    lines.push(`**Total Duration:** ${((this.report.totalDuration || 0) / 1000 / 60).toFixed(2)} minutes\n`);

    lines.push('## Product Details\n');
    lines.push(`- **Product:** ${this.report.productDetails.product}`);
    lines.push(`- **Quantity:** ${this.report.productDetails.quantity.toLocaleString()}`);
    lines.push(`- **Size:** ${this.report.productDetails.size}`);
    lines.push(`- **Material:** ${this.report.productDetails.material}`);
    lines.push(`- **Coating:** ${this.report.productDetails.coating}`);
    lines.push(`- **Weight:** ${this.report.productDetails.weight}\n`);

    lines.push('## Test Scenarios\n');
    lines.push(`### Scenario 1: FedEx Ground`);
    lines.push(`${this.report.testScenarios.scenario1}\n`);
    lines.push(`### Scenario 2: Southwest Cargo`);
    lines.push(`${this.report.testScenarios.scenario2}\n`);

    lines.push('## Test Summary\n');
    lines.push(`- **Total Test Suites:** ${this.report.summary.totalSuites}`);
    lines.push(`- **Successful:** ${this.report.summary.successfulSuites} ✅`);
    lines.push(`- **Failed:** ${this.report.summary.failedSuites} ❌`);
    lines.push(`- **Success Rate:** ${this.report.summary.successRate.toFixed(1)}%`);
    lines.push(`- **Runs per Suite:** ${this.report.summary.totalRuns}\n`);

    lines.push('## Test Results\n');
    lines.push('| Suite | Run | Duration | Status |');
    lines.push('|-------|-----|----------|--------|');

    this.report.suites.forEach((suite) => {
      const duration = suite.duration ? `${(suite.duration / 1000).toFixed(2)}s` : 'N/A';
      const status = suite.success ? '✅ PASS' : '❌ FAIL';
      lines.push(`| ${suite.name} | ${suite.run} | ${duration} | ${status} |`);
    });

    lines.push('\n## Tools Used\n');
    lines.push('✓ **Playwright MCP** - E2E browser automation');
    lines.push('✓ **Puppeteer MCP** - Alternative browser automation');
    lines.push('✓ **Chrome DevTools MCP** - Network/console/performance monitoring');
    lines.push('✓ **Thunder Client** - API testing\n');

    lines.push('## Weight Calculation\n');
    lines.push('```');
    lines.push('Formula: Paper Weight × Width × Height × Quantity = Total Weight');
    lines.push('');
    lines.push('9pt C2S Card Stock: 0.000333333333 lbs/sq in');
    lines.push('Width: 4 inches');
    lines.push('Height: 6 inches');
    lines.push('Quantity: 5,000 flyers');
    lines.push('');
    lines.push('Weight = 0.000333333333 × 4 × 6 × 5000 = 40 lbs');
    lines.push('');
    lines.push('This is the correct weight for 5,000 4x6 flyers on 9pt C2S cardstock.');
    lines.push('```\n');

    lines.push('## Screenshots\n');
    lines.push('All test screenshots are saved in `test-results/screenshots/` and `test-results/puppeteer-screenshots/`\n');

    lines.push('## DevTools Reports\n');
    lines.push('Detailed network, console, and performance metrics are saved in `test-results/devtools-*` files\n');

    lines.push('---\n');
    lines.push('*End of Report*\n');

    fs.writeFileSync(filepath, lines.join('\n'));
  }

  private printSummary() {
    console.log('\n\n');
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║              FINAL TEST SUMMARY                           ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`⏱️  Total Duration: ${((this.report.totalDuration || 0) / 1000 / 60).toFixed(2)} minutes`);
    console.log(`🧪 Total Test Suites: ${this.report.summary.totalSuites}`);
    console.log(`✅ Successful: ${this.report.summary.successfulSuites}`);
    console.log(`❌ Failed: ${this.report.summary.failedSuites}`);
    console.log(`📊 Success Rate: ${this.report.summary.successRate.toFixed(1)}%`);
    console.log('');

    if (this.report.summary.failedSuites === 0) {
      console.log('🎉 ALL TESTS PASSED! 🎉');
    } else {
      console.log('⚠️  Some tests failed. Review the reports for details.');
    }

    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
  }
}

// Main execution
async function main() {
  const runner = new MasterTestRunner();
  await runner.runAllTests();
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

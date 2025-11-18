/**
 * Chrome DevTools Protocol Monitoring
 *
 * Monitors network requests, console messages, and performance metrics
 * during the order flow testing
 */

import puppeteer, { Browser, Page, CDPSession } from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

interface NetworkEvent {
  requestId: string;
  url: string;
  method: string;
  status?: number;
  timestamp: number;
  duration?: number;
  headers?: any;
  responseHeaders?: any;
  resourceType?: string;
  failed?: boolean;
  errorText?: string;
}

interface ConsoleEvent {
  type: string;
  text: string;
  timestamp: number;
  stackTrace?: any;
}

interface PerformanceMetrics {
  timestamp: number;
  metrics: {
    Timestamp?: number;
    Documents?: number;
    Frames?: number;
    JSEventListeners?: number;
    Nodes?: number;
    LayoutCount?: number;
    RecalcStyleCount?: number;
    LayoutDuration?: number;
    RecalcStyleDuration?: number;
    ScriptDuration?: number;
    TaskDuration?: number;
    JSHeapUsedSize?: number;
    JSHeapTotalSize?: number;
  };
}

interface DevToolsMonitorReport {
  testName: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  networkEvents: NetworkEvent[];
  consoleEvents: ConsoleEvent[];
  performanceMetrics: PerformanceMetrics[];
  errors: string[];
  warnings: string[];
  summary: {
    totalRequests: number;
    failedRequests: number;
    totalErrors: number;
    totalWarnings: number;
    avgResponseTime: number;
    slowestRequests: NetworkEvent[];
  };
}

class DevToolsMonitor {
  private page: Page;
  private client!: CDPSession;
  private report: DevToolsMonitorReport;
  private requestMap: Map<string, NetworkEvent>;

  constructor(page: Page, testName: string) {
    this.page = page;
    this.requestMap = new Map();
    this.report = {
      testName,
      startTime: Date.now(),
      networkEvents: [],
      consoleEvents: [],
      performanceMetrics: [],
      errors: [],
      warnings: [],
      summary: {
        totalRequests: 0,
        failedRequests: 0,
        totalErrors: 0,
        totalWarnings: 0,
        avgResponseTime: 0,
        slowestRequests: [],
      },
    };
  }

  async start() {
    this.client = await this.page.target().createCDPSession();

    // Enable domains
    await this.client.send('Network.enable');
    await this.client.send('Console.enable');
    await this.client.send('Performance.enable');

    // Listen to network events
    this.client.on('Network.requestWillBeSent', (params: any) => {
      const event: NetworkEvent = {
        requestId: params.requestId,
        url: params.request.url,
        method: params.request.method,
        timestamp: params.timestamp * 1000,
        headers: params.request.headers,
        resourceType: params.type,
      };
      this.requestMap.set(params.requestId, event);
    });

    this.client.on('Network.responseReceived', (params: any) => {
      const event = this.requestMap.get(params.requestId);
      if (event) {
        event.status = params.response.status;
        event.responseHeaders = params.response.headers;
        event.duration = params.timestamp * 1000 - event.timestamp;
      }
    });

    this.client.on('Network.loadingFinished', (params: any) => {
      const event = this.requestMap.get(params.requestId);
      if (event) {
        this.report.networkEvents.push(event);
      }
    });

    this.client.on('Network.loadingFailed', (params: any) => {
      const event = this.requestMap.get(params.requestId);
      if (event) {
        event.failed = true;
        event.errorText = params.errorText;
        this.report.networkEvents.push(event);
        this.report.errors.push(`Network Error: ${params.errorText} (${event.url})`);
      }
    });

    // Listen to console events
    this.client.on('Runtime.consoleAPICalled', (params: any) => {
      const consoleEvent: ConsoleEvent = {
        type: params.type,
        text: params.args.map((arg: any) => arg.value || arg.description || '').join(' '),
        timestamp: params.timestamp * 1000,
        stackTrace: params.stackTrace,
      };

      this.report.consoleEvents.push(consoleEvent);

      if (params.type === 'error') {
        this.report.errors.push(consoleEvent.text);
      } else if (params.type === 'warning') {
        this.report.warnings.push(consoleEvent.text);
      }
    });

    // Collect performance metrics every 2 seconds
    this.startPerformanceMonitoring();
  }

  private async startPerformanceMonitoring() {
    setInterval(async () => {
      try {
        const metrics = await this.client.send('Performance.getMetrics');
        const metricsObj: any = {};

        metrics.metrics.forEach((metric: any) => {
          metricsObj[metric.name] = metric.value;
        });

        this.report.performanceMetrics.push({
          timestamp: Date.now(),
          metrics: metricsObj,
        });
      } catch (error) {
        // Ignore errors during metrics collection
      }
    }, 2000);
  }

  async stop() {
    this.report.endTime = Date.now();
    this.report.duration = this.report.endTime - this.report.startTime;

    // Calculate summary statistics
    this.report.summary.totalRequests = this.report.networkEvents.length;
    this.report.summary.failedRequests = this.report.networkEvents.filter((e) => e.failed).length;
    this.report.summary.totalErrors = this.report.errors.length;
    this.report.summary.totalWarnings = this.report.warnings.length;

    const responseTimes = this.report.networkEvents
      .filter((e) => e.duration !== undefined)
      .map((e) => e.duration!);

    if (responseTimes.length > 0) {
      this.report.summary.avgResponseTime =
        responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    }

    // Get 10 slowest requests
    this.report.summary.slowestRequests = [...this.report.networkEvents]
      .filter((e) => e.duration !== undefined)
      .sort((a, b) => (b.duration || 0) - (a.duration || 0))
      .slice(0, 10);

    await this.client.detach();
  }

  getReport(): DevToolsMonitorReport {
    return this.report;
  }

  saveReport() {
    const reportPath = path.join(
      __dirname,
      '../../test-results',
      `devtools-${this.report.testName}-${Date.now()}.json`
    );
    const reportDir = path.dirname(reportPath);

    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    fs.writeFileSync(reportPath, JSON.stringify(this.report, null, 2));
    console.log(`\n📊 DevTools monitoring report saved: ${reportPath}`);

    // Also save a human-readable summary
    this.saveTextSummary(reportPath.replace('.json', '.txt'));
  }

  private saveTextSummary(filepath: string) {
    const lines: string[] = [];

    lines.push('═══════════════════════════════════════════════════════════');
    lines.push('  CHROME DEVTOOLS MONITORING REPORT');
    lines.push('═══════════════════════════════════════════════════════════');
    lines.push('');
    lines.push(`Test Name: ${this.report.testName}`);
    lines.push(`Duration: ${this.report.duration}ms`);
    lines.push('');

    lines.push('SUMMARY');
    lines.push('───────────────────────────────────────────────────────────');
    lines.push(`Total Requests: ${this.report.summary.totalRequests}`);
    lines.push(`Failed Requests: ${this.report.summary.failedRequests}`);
    lines.push(`Total Errors: ${this.report.summary.totalErrors}`);
    lines.push(`Total Warnings: ${this.report.summary.totalWarnings}`);
    lines.push(`Avg Response Time: ${this.report.summary.avgResponseTime.toFixed(2)}ms`);
    lines.push('');

    if (this.report.errors.length > 0) {
      lines.push('ERRORS');
      lines.push('───────────────────────────────────────────────────────────');
      this.report.errors.forEach((error, i) => {
        lines.push(`${i + 1}. ${error}`);
      });
      lines.push('');
    }

    if (this.report.warnings.length > 0) {
      lines.push('WARNINGS');
      lines.push('───────────────────────────────────────────────────────────');
      this.report.warnings.forEach((warning, i) => {
        lines.push(`${i + 1}. ${warning}`);
      });
      lines.push('');
    }

    lines.push('SLOWEST REQUESTS');
    lines.push('───────────────────────────────────────────────────────────');
    this.report.summary.slowestRequests.forEach((req, i) => {
      lines.push(`${i + 1}. ${req.duration?.toFixed(2)}ms - ${req.method} ${req.url}`);
    });
    lines.push('');

    lines.push('═══════════════════════════════════════════════════════════');

    fs.writeFileSync(filepath, lines.join('\n'));
    console.log(`📄 DevTools text summary saved: ${filepath}`);
  }
}

async function monitorOrderFlow(testName: string, testFn: (page: Page) => Promise<void>) {
  let browser: Browser | null = null;

  try {
    console.log(`\n🔍 Starting DevTools monitoring for: ${testName}`);

    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      devtools: false,
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    const monitor = new DevToolsMonitor(page, testName);
    await monitor.start();

    // Run the test function
    await testFn(page);

    // Stop monitoring and save report
    await monitor.stop();
    monitor.saveReport();

    console.log('✅ DevTools monitoring completed');

  } catch (error) {
    console.error('❌ DevTools monitoring failed:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Example test functions
async function testFedExFlow(page: Page) {
  const baseURL = process.env.BASE_URL || 'http://localhost:3000';

  await page.goto(`${baseURL}/products`);
  await page.waitForSelector('h1');

  // Navigate through the flow...
  console.log('  ➤ Monitoring product page...');
  await page.goto(`${baseURL}/cart`);
  console.log('  ➤ Monitoring cart page...');
  await page.goto(`${baseURL}/checkout`);
  console.log('  ➤ Monitoring checkout page...');
}

async function testSouthwestFlow(page: Page) {
  const baseURL = process.env.BASE_URL || 'http://localhost:3000';

  await page.goto(`${baseURL}/products`);
  await page.waitForSelector('h1');

  console.log('  ➤ Monitoring product selection...');
  await page.goto(`${baseURL}/checkout`);
  console.log('  ➤ Monitoring checkout with airport selection...');
}

// Main execution
async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  CHROME DEVTOOLS PROTOCOL MONITORING');
  console.log('═══════════════════════════════════════════════════════════');

  try {
    await monitorOrderFlow('fedex-ground-devtools', testFedExFlow);
    await monitorOrderFlow('southwest-cargo-devtools', testSouthwestFlow);

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✅ ALL DEVTOOLS MONITORING COMPLETED');
    console.log('═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ DevTools monitoring failed');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { DevToolsMonitor, monitorOrderFlow };

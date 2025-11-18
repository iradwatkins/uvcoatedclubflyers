/**
 * CHROME DEVTOOLS MONITORING INTEGRATION
 *
 * This script uses Chrome DevTools Protocol to monitor:
 * - Network activity
 * - Console logs
 * - Performance metrics
 * - JavaScript errors
 * - API calls
 *
 * Can be run standalone or integrated with Playwright/Puppeteer tests
 */

import puppeteer, { Browser, Page, CDPSession } from 'puppeteer';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = 'test-results/devtools-monitoring';

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

interface NetworkRequest {
  requestId: string;
  url: string;
  method: string;
  timestamp: number;
  headers: Record<string, string>;
  postData?: string;
}

interface NetworkResponse {
  requestId: string;
  url: string;
  status: number;
  statusText: string;
  timestamp: number;
  headers: Record<string, string>;
  mimeType: string;
  responseTime: number;
}

interface ConsoleMessage {
  type: string;
  text: string;
  url?: string;
  lineNumber?: number;
  timestamp: number;
}

interface PerformanceEntry {
  name: string;
  entryType: string;
  startTime: number;
  duration: number;
}

interface MonitoringSession {
  startTime: Date;
  endTime?: Date;
  url: string;
  requests: NetworkRequest[];
  responses: NetworkResponse[];
  consoleLogs: ConsoleMessage[];
  errors: ConsoleMessage[];
  performance: PerformanceEntry[];
  coverage: {
    js: number;
    css: number;
  };
}

export class ChromeDevToolsMonitor {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private cdpSession: CDPSession | null = null;
  private session: MonitoringSession;

  constructor() {
    this.session = {
      startTime: new Date(),
      url: '',
      requests: [],
      responses: [],
      consoleLogs: [],
      errors: [],
      performance: [],
      coverage: {
        js: 0,
        css: 0,
      },
    };
  }

  /**
   * Initialize browser and setup monitoring
   */
  async initialize(): Promise<void> {
    console.log('🔧 Initializing Chrome DevTools Monitor...\n');

    this.browser = await puppeteer.launch({
      headless: false,
      devtools: true,
      args: [
        '--auto-open-devtools-for-tabs',
        '--window-size=1920,1080',
      ],
      defaultViewport: {
        width: 1920,
        height: 1080,
      },
    });

    this.page = await this.browser.newPage();
    this.cdpSession = await this.page.target().createCDPSession();

    await this.setupNetworkMonitoring();
    await this.setupConsoleMonitoring();
    await this.setupPerformanceMonitoring();
    await this.setupCoverageMonitoring();

    console.log('✅ Chrome DevTools Monitor initialized\n');
  }

  /**
   * Setup network monitoring
   */
  private async setupNetworkMonitoring(): Promise<void> {
    if (!this.cdpSession) return;

    await this.cdpSession.send('Network.enable');

    this.cdpSession.on('Network.requestWillBeSent', (params: any) => {
      const request: NetworkRequest = {
        requestId: params.requestId,
        url: params.request.url,
        method: params.request.method,
        timestamp: params.timestamp,
        headers: params.request.headers,
        postData: params.request.postData,
      };

      this.session.requests.push(request);

      // Log API calls
      if (params.request.url.includes('/api/')) {
        console.log(`📡 API Request: ${params.request.method} ${params.request.url}`);
      }
    });

    this.cdpSession.on('Network.responseReceived', (params: any) => {
      const requestStart = this.session.requests.find(
        r => r.requestId === params.requestId
      );

      const response: NetworkResponse = {
        requestId: params.requestId,
        url: params.response.url,
        status: params.response.status,
        statusText: params.response.statusText,
        timestamp: params.timestamp,
        headers: params.response.headers,
        mimeType: params.response.mimeType,
        responseTime: requestStart ? params.timestamp - requestStart.timestamp : 0,
      };

      this.session.responses.push(response);

      // Log API responses
      if (params.response.url.includes('/api/')) {
        const status = params.response.status;
        const emoji = status < 300 ? '✅' : status < 400 ? '⚠️' : '❌';
        console.log(`${emoji} API Response: ${status} ${params.response.url} (${response.responseTime.toFixed(2)}ms)`);
      }
    });

    this.cdpSession.on('Network.loadingFailed', (params: any) => {
      console.log(`❌ Network Error: ${params.errorText} - ${params.url || params.requestId}`);
    });
  }

  /**
   * Setup console monitoring
   */
  private async setupConsoleMonitoring(): Promise<void> {
    if (!this.page) return;

    this.page.on('console', msg => {
      const consoleMsg: ConsoleMessage = {
        type: msg.type(),
        text: msg.text(),
        timestamp: Date.now(),
      };

      this.session.consoleLogs.push(consoleMsg);

      const emoji = {
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️',
        log: '📝',
      }[msg.type()] || '📝';

      console.log(`${emoji} Console [${msg.type()}]: ${msg.text()}`);
    });

    this.page.on('pageerror', error => {
      const errorMsg: ConsoleMessage = {
        type: 'error',
        text: error.message,
        timestamp: Date.now(),
      };

      this.session.errors.push(errorMsg);
      console.log(`❌ Page Error: ${error.message}`);
    });
  }

  /**
   * Setup performance monitoring
   */
  private async setupPerformanceMonitoring(): Promise<void> {
    if (!this.cdpSession) return;

    await this.cdpSession.send('Performance.enable');

    console.log('📊 Performance monitoring enabled\n');
  }

  /**
   * Setup code coverage monitoring
   */
  private async setupCoverageMonitoring(): Promise<void> {
    if (!this.cdpSession || !this.page) return;

    await Promise.all([
      this.page.coverage.startJSCoverage(),
      this.page.coverage.startCSSCoverage(),
    ]);

    console.log('📈 Code coverage monitoring enabled\n');
  }

  /**
   * Navigate to URL and monitor
   */
  async navigateAndMonitor(url: string, duration: number = 30000): Promise<void> {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }

    console.log(`🌐 Navigating to: ${url}\n`);
    this.session.url = url;

    const navigationStart = Date.now();
    await this.page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    const navigationTime = Date.now() - navigationStart;

    console.log(`✅ Page loaded in ${navigationTime}ms\n`);

    // Collect performance metrics
    await this.collectPerformanceMetrics();

    // Wait for specified duration to collect data
    console.log(`⏳ Monitoring for ${duration / 1000} seconds...\n`);
    await new Promise(resolve => setTimeout(resolve, duration));
  }

  /**
   * Collect performance metrics
   */
  private async collectPerformanceMetrics(): Promise<void> {
    if (!this.page) return;

    const performanceMetrics = await this.page.evaluate(() => {
      const entries: any[] = [];

      // Navigation timing
      const navigation = performance.getEntriesByType('navigation')[0] as any;
      if (navigation) {
        entries.push({
          name: 'Navigation',
          entryType: 'navigation',
          startTime: 0,
          duration: navigation.loadEventEnd - navigation.fetchStart,
        });
      }

      // Resource timing
      const resources = performance.getEntriesByType('resource');
      resources.forEach((resource: any) => {
        entries.push({
          name: resource.name,
          entryType: 'resource',
          startTime: resource.startTime,
          duration: resource.duration,
        });
      });

      return entries;
    });

    this.session.performance = performanceMetrics;

    console.log(`📊 Collected ${performanceMetrics.length} performance entries\n`);
  }

  /**
   * Get coverage statistics
   */
  async getCoverageStats(): Promise<void> {
    if (!this.page) return;

    const [jsCoverage, cssCoverage] = await Promise.all([
      this.page.coverage.stopJSCoverage(),
      this.page.coverage.stopCSSCoverage(),
    ]);

    // Calculate JS coverage
    let jsUsedBytes = 0;
    let jsTotalBytes = 0;
    for (const entry of jsCoverage) {
      jsTotalBytes += entry.text.length;
      for (const range of entry.ranges) {
        jsUsedBytes += range.end - range.start - 1;
      }
    }

    // Calculate CSS coverage
    let cssUsedBytes = 0;
    let cssTotalBytes = 0;
    for (const entry of cssCoverage) {
      cssTotalBytes += entry.text.length;
      for (const range of entry.ranges) {
        cssUsedBytes += range.end - range.start - 1;
      }
    }

    this.session.coverage.js = jsTotalBytes > 0 ? (jsUsedBytes / jsTotalBytes) * 100 : 0;
    this.session.coverage.css = cssTotalBytes > 0 ? (cssUsedBytes / cssTotalBytes) * 100 : 0;

    console.log(`📈 JavaScript Coverage: ${this.session.coverage.js.toFixed(2)}%`);
    console.log(`📈 CSS Coverage: ${this.session.coverage.css.toFixed(2)}%\n`);
  }

  /**
   * Generate monitoring report
   */
  async generateReport(filename: string = 'devtools-report'): Promise<void> {
    this.session.endTime = new Date();

    await this.getCoverageStats();

    const report = {
      ...this.session,
      summary: {
        totalRequests: this.session.requests.length,
        totalResponses: this.session.responses.length,
        apiCalls: this.session.requests.filter(r => r.url.includes('/api/')).length,
        totalConsoleLogs: this.session.consoleLogs.length,
        totalErrors: this.session.errors.length,
        averageResponseTime: this.calculateAverageResponseTime(),
        duration: this.session.endTime.getTime() - this.session.startTime.getTime(),
      },
      apiCallsSummary: this.getApiCallsSummary(),
    };

    // Save report
    const reportPath = path.join(OUTPUT_DIR, `${filename}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📊 DEVTOOLS MONITORING REPORT');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`URL: ${this.session.url}`);
    console.log(`Duration: ${report.summary.duration}ms`);
    console.log(`Total Requests: ${report.summary.totalRequests}`);
    console.log(`API Calls: ${report.summary.apiCalls}`);
    console.log(`Console Logs: ${report.summary.totalConsoleLogs}`);
    console.log(`Errors: ${report.summary.totalErrors}`);
    console.log(`Avg Response Time: ${report.summary.averageResponseTime.toFixed(2)}ms`);
    console.log(`JS Coverage: ${this.session.coverage.js.toFixed(2)}%`);
    console.log(`CSS Coverage: ${this.session.coverage.css.toFixed(2)}%`);
    console.log(`\n📄 Report saved to: ${reportPath}`);
    console.log('═══════════════════════════════════════════════════════\n');
  }

  /**
   * Calculate average response time
   */
  private calculateAverageResponseTime(): number {
    const responseTimes = this.session.responses
      .filter(r => r.responseTime > 0)
      .map(r => r.responseTime);

    if (responseTimes.length === 0) return 0;

    const sum = responseTimes.reduce((acc, time) => acc + time, 0);
    return sum / responseTimes.length;
  }

  /**
   * Get API calls summary
   */
  private getApiCallsSummary() {
    const apiRequests = this.session.requests.filter(r => r.url.includes('/api/'));
    const apiResponses = this.session.responses.filter(r => r.url.includes('/api/'));

    return apiRequests.map(req => {
      const res = apiResponses.find(r => r.requestId === req.requestId);

      return {
        method: req.method,
        url: req.url,
        status: res?.status || 'pending',
        responseTime: res?.responseTime || 0,
        timestamp: req.timestamp,
      };
    });
  }

  /**
   * Close browser
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      console.log('✅ Browser closed\n');
    }
  }
}

/**
 * Example usage: Monitor product page
 */
async function monitorProductPage() {
  const monitor = new ChromeDevToolsMonitor();

  try {
    await monitor.initialize();
    await monitor.navigateAndMonitor('http://localhost:3000/products/1', 20000);
    await monitor.generateReport('product-page-monitoring');
  } catch (error) {
    console.error('❌ Monitoring failed:', error);
  } finally {
    await monitor.close();
  }
}

/**
 * Example usage: Monitor checkout flow
 */
async function monitorCheckoutFlow() {
  const monitor = new ChromeDevToolsMonitor();

  try {
    await monitor.initialize();

    // Monitor multiple pages in sequence
    await monitor.navigateAndMonitor('http://localhost:3000/cart', 10000);
    await monitor.navigateAndMonitor('http://localhost:3000/checkout', 15000);

    await monitor.generateReport('checkout-flow-monitoring');
  } catch (error) {
    console.error('❌ Monitoring failed:', error);
  } finally {
    await monitor.close();
  }
}

// Run monitoring if executed directly
if (require.main === module) {
  const args = process.argv.slice(2);
  const scenario = args[0] || 'product';

  if (scenario === 'product') {
    monitorProductPage().catch(console.error);
  } else if (scenario === 'checkout') {
    monitorCheckoutFlow().catch(console.error);
  } else {
    console.log('Usage: npx tsx tests/devtools/chrome-devtools-monitor.ts [product|checkout]');
  }
}

export { monitorProductPage, monitorCheckoutFlow };

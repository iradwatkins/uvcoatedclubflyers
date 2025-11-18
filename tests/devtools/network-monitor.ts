import puppeteer, { Browser, Page, HTTPRequest, HTTPResponse } from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Chrome DevTools Protocol: Network Monitoring
 *
 * Monitors all network requests, console messages, and performance metrics
 */

interface NetworkRequest {
  url: string;
  method: string;
  status: number | null;
  statusText: string;
  type: string;
  size: number;
  timing: number;
  timestamp: Date;
  headers: Record<string, string>;
  requestBody?: any;
  responseBody?: any;
  error?: string;
}

interface ConsoleMessage {
  type: string;
  text: string;
  timestamp: Date;
  location?: string;
  args: any[];
}

interface PerformanceMetrics {
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  timeToInteractive: number;
  totalBlockingTime: number;
  speedIndex: number;
}

export class NetworkMonitor {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private requests: NetworkRequest[] = [];
  private consoleMessages: ConsoleMessage[] = [];
  private performanceMetrics: Partial<PerformanceMetrics> = {};
  private outputDir: string;

  constructor(outputDir: string = 'test-results/devtools') {
    this.outputDir = outputDir;

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
  }

  /**
   * Start monitoring
   */
  async start() {
    this.browser = await puppeteer.launch({
      headless: false,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--window-size=1920,1080',
        '--enable-features=NetworkService'
      ],
      devtools: true
    });

    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1920, height: 1080 });

    // Enable CDP domains
    const client = await this.page.target().createCDPSession();
    await client.send('Network.enable');
    await client.send('Performance.enable');
    await client.send('Console.enable');

    this.setupListeners();

    console.log('✅ Network monitoring started');
  }

  /**
   * Set up event listeners
   */
  private setupListeners() {
    if (!this.page) return;

    // Monitor network requests
    this.page.on('request', (request: HTTPRequest) => {
      const url = request.url();

      // Only log API calls and important resources
      if (this.shouldLogRequest(url)) {
        console.log(`→ ${request.method()} ${url}`);
      }
    });

    this.page.on('response', async (response: HTTPResponse) => {
      const request = response.request();
      const url = request.url();

      if (this.shouldLogRequest(url)) {
        const timing = response.timing();
        const headers = response.headers();

        const networkRequest: NetworkRequest = {
          url,
          method: request.method(),
          status: response.status(),
          statusText: response.statusText(),
          type: request.resourceType(),
          size: parseInt(headers['content-length'] || '0'),
          timing: timing ? timing.receiveHeadersEnd : 0,
          timestamp: new Date(),
          headers,
        };

        // Capture request body for POST/PUT
        if (['POST', 'PUT', 'PATCH'].includes(request.method())) {
          networkRequest.requestBody = request.postData();
        }

        // Capture response body for API calls
        if (url.includes('/api/')) {
          try {
            const contentType = headers['content-type'] || '';
            if (contentType.includes('application/json')) {
              networkRequest.responseBody = await response.json();
            } else {
              networkRequest.responseBody = await response.text();
            }
          } catch (e) {
            networkRequest.responseBody = '[Unable to parse]';
          }
        }

        this.requests.push(networkRequest);

        const status = response.status();
        const statusIcon = status >= 200 && status < 300 ? '✓' : '✗';
        console.log(`${statusIcon} ${status} ${request.method()} ${url} (${networkRequest.timing.toFixed(0)}ms)`);
      }
    });

    this.page.on('requestfailed', (request: HTTPRequest) => {
      const url = request.url();

      if (this.shouldLogRequest(url)) {
        const networkRequest: NetworkRequest = {
          url,
          method: request.method(),
          status: null,
          statusText: 'Failed',
          type: request.resourceType(),
          size: 0,
          timing: 0,
          timestamp: new Date(),
          headers: {},
          error: request.failure()?.errorText || 'Unknown error'
        };

        this.requests.push(networkRequest);
        console.log(`✗ FAILED ${request.method()} ${url} - ${networkRequest.error}`);
      }
    });

    // Monitor console messages
    this.page.on('console', async (msg) => {
      const type = msg.type();
      const text = msg.text();
      const location = msg.location();

      const consoleMessage: ConsoleMessage = {
        type,
        text,
        timestamp: new Date(),
        location: location.url ? `${location.url}:${location.lineNumber}` : undefined,
        args: await Promise.all(msg.args().map(arg => arg.jsonValue()))
      };

      this.consoleMessages.push(consoleMessage);

      const icon = type === 'error' ? '🔴' : type === 'warning' ? '🟡' : 'ℹ️';
      console.log(`${icon} [${type.toUpperCase()}] ${text}`);
    });

    // Monitor errors
    this.page.on('pageerror', (error) => {
      console.log('🔴 [PAGE ERROR]', error.message);

      this.consoleMessages.push({
        type: 'error',
        text: error.message,
        timestamp: new Date(),
        args: [error.stack]
      });
    });
  }

  /**
   * Determine if request should be logged
   */
  private shouldLogRequest(url: string): boolean {
    // Log API calls
    if (url.includes('/api/')) return true;

    // Log uploads
    if (url.includes('/upload')) return true;

    // Log third-party services
    if (url.includes('square') || url.includes('paypal') || url.includes('fedex')) return true;

    // Skip static assets, images, fonts
    if (url.match(/\.(png|jpg|jpeg|gif|svg|woff|woff2|ttf|css|ico)$/)) return false;

    // Skip very long data URLs
    if (url.startsWith('data:')) return false;

    return true;
  }

  /**
   * Navigate to URL
   */
  async goto(url: string) {
    if (!this.page) throw new Error('Monitor not started');

    console.log(`\n📍 Navigating to: ${url}\n`);

    const startTime = Date.now();

    await this.page.goto(url, { waitUntil: 'networkidle0' });

    const loadTime = Date.now() - startTime;
    console.log(`\n⏱️  Page loaded in ${loadTime}ms\n`);

    // Collect performance metrics
    await this.collectPerformanceMetrics();
  }

  /**
   * Collect performance metrics
   */
  private async collectPerformanceMetrics() {
    if (!this.page) return;

    const metrics = await this.page.evaluate(() => {
      const paint = performance.getEntriesByType('paint');
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

      const fcp = paint.find(p => p.name === 'first-contentful-paint');

      return {
        firstContentfulPaint: fcp ? fcp.startTime : 0,
        domContentLoaded: navigation?.domContentLoadedEventEnd || 0,
        loadComplete: navigation?.loadEventEnd || 0,
        domInteractive: navigation?.domInteractive || 0
      };
    });

    Object.assign(this.performanceMetrics, metrics);

    console.log('\n📊 Performance Metrics:');
    console.log(`  First Contentful Paint: ${metrics.firstContentfulPaint.toFixed(0)}ms`);
    console.log(`  DOM Interactive: ${metrics.domInteractive.toFixed(0)}ms`);
    console.log(`  DOM Content Loaded: ${metrics.domContentLoaded.toFixed(0)}ms`);
    console.log(`  Load Complete: ${metrics.loadComplete.toFixed(0)}ms\n`);
  }

  /**
   * Get failed requests
   */
  getFailedRequests(): NetworkRequest[] {
    return this.requests.filter(r => r.status === null || r.status >= 400);
  }

  /**
   * Get API requests
   */
  getApiRequests(): NetworkRequest[] {
    return this.requests.filter(r => r.url.includes('/api/'));
  }

  /**
   * Get slow requests (> 2s)
   */
  getSlowRequests(threshold: number = 2000): NetworkRequest[] {
    return this.requests.filter(r => r.timing > threshold);
  }

  /**
   * Get console errors
   */
  getConsoleErrors(): ConsoleMessage[] {
    return this.consoleMessages.filter(m => m.type === 'error');
  }

  /**
   * Get console warnings
   */
  getConsoleWarnings(): ConsoleMessage[] {
    return this.consoleMessages.filter(m => m.type === 'warning');
  }

  /**
   * Export network log as HAR format
   */
  exportHAR(filename: string = 'network.har') {
    const har = {
      log: {
        version: '1.2',
        creator: { name: 'UV Coated Network Monitor', version: '1.0' },
        entries: this.requests.map(r => ({
          startedDateTime: r.timestamp.toISOString(),
          time: r.timing,
          request: {
            method: r.method,
            url: r.url,
            headers: Object.entries(r.headers).map(([name, value]) => ({ name, value })),
            postData: r.requestBody ? { mimeType: 'application/json', text: r.requestBody } : undefined
          },
          response: {
            status: r.status || 0,
            statusText: r.statusText,
            headers: Object.entries(r.headers).map(([name, value]) => ({ name, value })),
            content: {
              size: r.size,
              mimeType: r.headers['content-type'] || 'unknown',
              text: typeof r.responseBody === 'string' ? r.responseBody : JSON.stringify(r.responseBody)
            }
          },
          cache: {},
          timings: { wait: r.timing, receive: 0 }
        }))
      }
    };

    const filepath = path.join(this.outputDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(har, null, 2));
    console.log(`✅ HAR file exported: ${filepath}`);
  }

  /**
   * Export summary report
   */
  exportReport(filename: string = 'network-report.json') {
    const report = {
      summary: {
        totalRequests: this.requests.length,
        failedRequests: this.getFailedRequests().length,
        apiRequests: this.getApiRequests().length,
        slowRequests: this.getSlowRequests().length,
        consoleErrors: this.getConsoleErrors().length,
        consoleWarnings: this.getConsoleWarnings().length
      },
      performanceMetrics: this.performanceMetrics,
      failedRequests: this.getFailedRequests(),
      slowRequests: this.getSlowRequests(),
      apiRequests: this.getApiRequests(),
      consoleErrors: this.getConsoleErrors(),
      consoleWarnings: this.getConsoleWarnings(),
      allRequests: this.requests,
      allConsoleMessages: this.consoleMessages
    };

    const filepath = path.join(this.outputDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
    console.log(`✅ Network report exported: ${filepath}`);

    return report;
  }

  /**
   * Print summary
   */
  printSummary() {
    console.log('\n' + '='.repeat(80));
    console.log('NETWORK MONITORING SUMMARY');
    console.log('='.repeat(80));

    console.log(`\n📦 Total Requests: ${this.requests.length}`);
    console.log(`✅ Successful: ${this.requests.filter(r => r.status && r.status < 400).length}`);
    console.log(`❌ Failed: ${this.getFailedRequests().length}`);
    console.log(`🐌 Slow (>2s): ${this.getSlowRequests().length}`);

    const failedRequests = this.getFailedRequests();
    if (failedRequests.length > 0) {
      console.log('\n❌ Failed Requests:');
      failedRequests.forEach(r => {
        console.log(`  ${r.status || 'FAILED'} ${r.method} ${r.url}`);
        if (r.error) console.log(`    Error: ${r.error}`);
      });
    }

    const slowRequests = this.getSlowRequests();
    if (slowRequests.length > 0) {
      console.log('\n🐌 Slow Requests (>2s):');
      slowRequests.forEach(r => {
        console.log(`  ${r.timing.toFixed(0)}ms ${r.method} ${r.url}`);
      });
    }

    console.log(`\n🖥️  Console Messages: ${this.consoleMessages.length}`);
    console.log(`🔴 Errors: ${this.getConsoleErrors().length}`);
    console.log(`🟡 Warnings: ${this.getConsoleWarnings().length}`);

    const errors = this.getConsoleErrors();
    if (errors.length > 0) {
      console.log('\n🔴 Console Errors:');
      errors.forEach(e => {
        console.log(`  ${e.text}`);
        if (e.location) console.log(`    at ${e.location}`);
      });
    }

    console.log('\n' + '='.repeat(80) + '\n');
  }

  /**
   * Stop monitoring and cleanup
   */
  async stop() {
    this.printSummary();
    this.exportHAR();
    this.exportReport();

    if (this.browser) {
      await this.browser.close();
    }

    console.log('✅ Network monitoring stopped');
  }

  /**
   * Get page instance
   */
  getPage(): Page {
    if (!this.page) throw new Error('Monitor not started');
    return this.page;
  }
}

// CLI usage
if (require.main === module) {
  (async () => {
    const monitor = new NetworkMonitor();

    try {
      await monitor.start();

      // Test checkout flow
      await monitor.goto('http://localhost:3000');
      await monitor.goto('http://localhost:3000/products');
      await monitor.goto('http://localhost:3000/checkout');

      // Wait a bit for async requests
      await new Promise(resolve => setTimeout(resolve, 5000));

      await monitor.stop();
    } catch (error) {
      console.error('Error:', error);
      process.exit(1);
    }
  })();
}

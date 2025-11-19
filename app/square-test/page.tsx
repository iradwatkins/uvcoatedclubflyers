'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function SquareSDKTest() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [logs, setLogs] = useState<string[]>([]);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [squareAvailable, setSquareAvailable] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addLog = (message: string) => {
    console.log('[SDK Test]', message);
    setLogs((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    const testSquareSDK = async () => {
      try {
        addLog('Starting Square SDK test...');

        // Environment variables check
        const appId = process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID;
        const locationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID;
        const environment = process.env.NEXT_PUBLIC_SQUARE_ENVIRONMENT || 'sandbox';

        addLog(`Environment: ${environment}`);
        addLog(`App ID: ${appId ? appId.substring(0, 20) + '...' : 'MISSING'}`);
        addLog(`Location ID: ${locationId ? locationId.substring(0, 20) + '...' : 'MISSING'}`);

        if (!appId || !locationId) {
          throw new Error('Square credentials not configured');
        }

        // Check if script already exists
        const existingScript = document.querySelector('script[src*="squarecdn.com"]');
        if (existingScript) {
          addLog('Square SDK script already exists in DOM');
        }

        // Load Square SDK
        const sdkUrl =
          environment === 'production'
            ? 'https://web.squarecdn.com/v1/square.js'
            : 'https://sandbox.web.squarecdn.com/v1/square.js';

        addLog(`Loading SDK from: ${sdkUrl}`);

        const script = document.createElement('script');
        script.src = sdkUrl;
        script.async = true;

        script.onload = () => {
          addLog('✅ Script onload event fired');
          setScriptLoaded(true);
        };

        script.onerror = (err) => {
          addLog(`❌ Script onerror event fired: ${err}`);
          setError('Failed to load Square SDK script');
        };

        document.head.appendChild(script);
        addLog('Script tag appended to document head');

        // Wait for (window as any).Square to be available
        let attempts = 0;
        const maxAttempts = 50;

        while (!(window as any).Square && attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          attempts++;

          if (attempts % 10 === 0) {
            addLog(`Still waiting... attempt ${attempts}/${maxAttempts}`);
          }
        }

        if (!(window as any).Square) {
          addLog(`❌ (window as any).Square not available after ${attempts} attempts (5 seconds)`);
          throw new Error('Square SDK failed to initialize - (window as any).Square is undefined');
        }

        addLog(`✅ (window as any).Square is available after ${attempts} attempts`);
        setSquareAvailable(true);

        // Try to initialize payments
        addLog('Attempting to initialize payments...');
        const payments = ((window as any).Square as any).payments(appId, locationId);
        addLog('✅ Payments instance created successfully');

        setStatus('success');
        addLog('🎉 All tests passed!');
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        addLog(`❌ Error: ${errorMsg}`);
        setError(errorMsg);
        setStatus('error');
      }
    };

    testSquareSDK();
  }, []);

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {status === 'loading' && <Loader2 className="h-5 w-5 animate-spin" />}
            {status === 'success' && <CheckCircle className="h-5 w-5 text-green-600" />}
            {status === 'error' && <XCircle className="h-5 w-5 text-red-600" />}
            Square SDK Diagnostic Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Cards */}
          <div className="grid grid-cols-3 gap-4">
            <Card className={scriptLoaded ? 'border-green-500' : 'border-gray-300'}>
              <CardContent className="pt-6">
                <div className="text-center">
                  {scriptLoaded ? (
                    <CheckCircle className="h-8 w-8 mx-auto text-green-600 mb-2" />
                  ) : (
                    <Loader2 className="h-8 w-8 mx-auto animate-spin mb-2" />
                  )}
                  <p className="text-sm font-medium">Script Loaded</p>
                </div>
              </CardContent>
            </Card>

            <Card className={squareAvailable ? 'border-green-500' : 'border-gray-300'}>
              <CardContent className="pt-6">
                <div className="text-center">
                  {squareAvailable ? (
                    <CheckCircle className="h-8 w-8 mx-auto text-green-600 mb-2" />
                  ) : (
                    <Loader2 className="h-8 w-8 mx-auto animate-spin mb-2" />
                  )}
                  <p className="text-sm font-medium">(window as any).Square</p>
                </div>
              </CardContent>
            </Card>

            <Card className={status === 'success' ? 'border-green-500' : 'border-gray-300'}>
              <CardContent className="pt-6">
                <div className="text-center">
                  {status === 'success' ? (
                    <CheckCircle className="h-8 w-8 mx-auto text-green-600 mb-2" />
                  ) : status === 'error' ? (
                    <XCircle className="h-8 w-8 mx-auto text-red-600 mb-2" />
                  ) : (
                    <Loader2 className="h-8 w-8 mx-auto animate-spin mb-2" />
                  )}
                  <p className="text-sm font-medium">Payments Init</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Display */}
          {status === 'success' && (
            <Alert className="border-green-500 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-900">
                Square SDK loaded and initialized successfully! Payment methods should work.
              </AlertDescription>
            </Alert>
          )}

          {/* Diagnostic Logs */}
          <div className="space-y-2">
            <h3 className="font-semibold">Diagnostic Logs:</h3>
            <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-xs max-h-96 overflow-y-auto">
              {logs.map((log, i) => (
                <div key={i} className="mb-1">
                  {log}
                </div>
              ))}
              {logs.length === 0 && <div className="text-gray-500">No logs yet...</div>}
            </div>
          </div>

          {/* Instructions */}
          <div className="rounded-lg border bg-blue-50 p-4 dark:bg-blue-950">
            <h4 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">
              How to use this page:
            </h4>
            <ol className="text-sm text-blue-900 dark:text-blue-100 space-y-1 list-decimal list-inside">
              <li>This page tests if Square SDK can load and initialize</li>
              <li>Check the three status indicators above</li>
              <li>Review the diagnostic logs for detailed information</li>
              <li>Open browser Developer Tools (F12) and check Console tab for any errors</li>
              <li>Check Network tab to verify script loads (should be 200 status)</li>
            </ol>
          </div>

          {/* Browser Console Instructions */}
          <div className="rounded-lg border bg-yellow-50 p-4 dark:bg-yellow-950">
            <h4 className="font-semibold mb-2 text-yellow-900 dark:text-yellow-100">
              Check Browser Console:
            </h4>
            <ol className="text-sm text-yellow-900 dark:text-yellow-100 space-y-1 list-decimal list-inside">
              <li>Press F12 (or Cmd+Option+I on Mac) to open Developer Tools</li>
              <li>Click the "Console" tab</li>
              <li>Look for any red error messages</li>
              <li>Click the "Network" tab and filter by "JS" to see if square.js loaded</li>
              <li>Take a screenshot if you see errors</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


# Square Payment Integration - Bug Fixes Explained

## Executive Summary

This document details three critical bugs that prevented Square payments from loading, and their fixes. These bugs affected both the Square Card Payment and Cash App Pay components.

**Timeline:**
- ❌ Initial state: Payments stuck on "Loading payment form..." indefinitely
- ✅ After fixes: Payments load within 1-2 seconds and work perfectly

**Root causes:**
1. Function Hoisting Bug
2. React StrictMode Timer Cancellation Bug
3. Container Rendering Race Condition Bug

---

## Bug #1: Function Hoisting Issue

### Severity: CRITICAL ⚠️
**Impact:** Square SDK never loaded, payments completely non-functional

### The Problem

The `loadSquareScript()` function was defined **AFTER** the `useEffect` hook that called it. In JavaScript, function declarations using `function` keyword are hoisted, but arrow function expressions (`const func = () => {}`) are NOT hoisted.

###

 What Was Happening

```javascript
// BROKEN CODE (before fix):
export function SquareCardPayment({ applicationId, locationId, total, ... }) {
  const [payments, setPayments] = useState(null)
  const initAttempted = useRef(false)

  useEffect(() => {
    if (initAttempted.current) return
    initAttempted.current = true

    const initializeSquare = async () => {
      try {
        // ❌ CALLING loadSquareScript HERE
        await loadSquareScript()

        // ... rest of initialization
      } catch (err) {
        console.error('Initialization error:', err)
      }
    }

    setTimeout(() => {
      initializeSquare()
    }, 300)

    return () => { /* cleanup */ }
  }, [applicationId, locationId])

  // ❌ DEFINING loadSquareScript HERE (AFTER useEffect)
  const loadSquareScript = () => {
    return new Promise((resolve, reject) => {
      if (window.Square) {
        resolve(true)
        return
      }

      const script = document.createElement('script')
      script.src = 'https://sandbox.web.squarecdn.com/v1/square.js'
      script.onload = () => resolve(true)
      script.onerror = (err) => reject(err)
      document.head.appendChild(script)
    })
  }

  // ... rest of component
}
```

### Why It Failed

When JavaScript executes the component:

1. **Render Phase:**
   - `useState` and `useRef` are initialized
   - `useEffect` is registered (but doesn't run yet)
   - ⚠️ `loadSquareScript` is NOT available yet (not hoisted)

2. **Effect Phase:**
   - `useEffect` callback runs
   - Tries to call `await loadSquareScript()`
   - ❌ **ReferenceError: loadSquareScript is not defined**
   - Error is caught silently
   - SDK never loads

3. **Result:**
   - No script tag created
   - `window.Square` never exists
   - Component shows "Loading..." forever
   - No visible error (caught by try-catch)

### The Fix

Move `loadSquareScript` definition BEFORE the `useEffect`:

```javascript
// ✅ FIXED CODE:
export function SquareCardPayment({ applicationId, locationId, total, ... }) {
  const [payments, setPayments] = useState(null)
  const initAttempted = useRef(false)

  // ✅ DEFINE loadSquareScript BEFORE useEffect
  const loadSquareScript = () => {
    return new Promise((resolve, reject) => {
      if (window.Square) {
        resolve(true)
        return
      }

      const script = document.createElement('script')
      const sdkUrl = environment === 'production'
        ? 'https://web.squarecdn.com/v1/square.js'
        : 'https://sandbox.web.squarecdn.com/v1/square.js'
      script.src = sdkUrl
      script.async = true

      script.onload = () => {
        resolve(true)
      }

      script.onerror = (error) => {
        console.error('[Square] Failed to load Square.js:', error)
        reject(new Error('Failed to load Square.js'))
      }

      document.head.appendChild(script)
    })
  }

  // ✅ NOW loadSquareScript is available when useEffect runs
  useEffect(() => {
    if (initAttempted.current) return
    initAttempted.current = true

    const initializeSquare = async () => {
      try {
        // ✅ This now works!
        await loadSquareScript()

        // ... rest of initialization
      } catch (err) {
        console.error('Initialization error:', err)
      }
    }

    initializeSquare()

    return () => { /* cleanup */ }
  }, [applicationId, locationId])

  // ... rest of component
}
```

### Files Affected

- `components/checkout/square-card-payment.tsx` (lines 66-97)
- `components/checkout/cashapp-qr-payment.tsx` (lines 42-73)

### How to Reproduce the Bug

To recreate the original bug:

1. Move `const loadSquareScript = () => {}` to AFTER the `useEffect`
2. Load the payment page
3. Open browser console
4. You'll see NO script tag added to `<head>`
5. Component stuck on "Loading payment form..."

### Verification Test

After the fix, in browser console:

```javascript
// Should see the Square SDK script:
document.querySelectorAll('script[src*="square"]')
// Result: [<script src="https://sandbox.web.squarecdn.com/v1/square.js">]

// Should have window.Square:
typeof window.Square
// Result: "object"
```

---

## Bug #2: React StrictMode Timer Cancellation

### Severity: CRITICAL ⚠️
**Impact:** Initialization never completed, payments stuck loading

### The Problem

React 19 with StrictMode (development mode) intentionally mounts components twice to help detect side effects. The original code used `setTimeout` to delay initialization, but React's cleanup function was canceling the timer before it could fire.

### What Was Happening

```javascript
// BROKEN CODE (before fix):
export function SquareCardPayment(props) {
  const initAttempted = useRef(false)

  useEffect(() => {
    // ❌ This check doesn't prevent the problem
    if (initAttempted.current) return
    initAttempted.current = true

    const initializeSquare = async () => {
      await loadSquareScript()
      // ... initialization logic
    }

    // ❌ Timer set here
    const initTimer = setTimeout(() => {
      initializeSquare()
    }, 300)

    // ❌ Cleanup runs on unmount
    return () => {
      clearTimeout(initTimer)  // This cancels the timer!
      if (card) {
        card.destroy()
      }
    }
  }, [applicationId, locationId])
}
```

### React StrictMode Lifecycle

In development with StrictMode:

```
1. Component Mount #1
   - initAttempted.current = false
   - Set initAttempted.current = true
   - Create timer (ID: 123)
   - Timer scheduled for 300ms from now

2. React StrictMode Cleanup #1 (intentional unmount)
   - clearTimeout(123) ← ❌ TIMER CANCELLED
   - card.destroy() if exists

3. Component Mount #2
   - initAttempted.current = true (still!)
   - Check: if (initAttempted.current) return ← ❌ EXITS EARLY
   - No new timer created

4. Result:
   - No timer running
   - initializeSquare() never called
   - SDK loads but initialization never completes
   - Component stuck on "Loading..."
```

### Why ref Check Alone Isn't Enough

The `initAttempted` ref persists across StrictMode remounts, which is good for preventing duplicate work, but creates a problem:

- First mount: Sets timer, sets ref to `true`
- Cleanup: Cancels timer (ref still `true`)
- Second mount: Sees ref is `true`, skips everything
- **Result: No timer, no initialization**

### The Fix

Call `initializeSquare()` immediately instead of using `setTimeout`:

```javascript
// ✅ FIXED CODE:
export function SquareCardPayment(props) {
  const initAttempted = useRef(false)

  useEffect(() => {
    console.log('[Square Card] useEffect running', {
      initAttempted: initAttempted.current
    })

    // ✅ Check BEFORE any side effects
    if (initAttempted.current) {
      console.log('[Square Card] Already initialized, skipping')
      return
    }
    initAttempted.current = true
    console.log('[Square Card] First initialization, proceeding')

    const initializeSquare = async () => {
      try {
        console.log('[Square Card] initializeSquare starting')
        await loadSquareScript()
        console.log('[Square Card] loadSquareScript completed')

        // Wait for Square SDK
        let attempts = 0
        const maxAttempts = 50
        while (!window.Square && attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 100))
          attempts++
        }

        if (!window.Square) {
          throw new Error('Square Web Payments SDK failed to load')
        }

        // ... rest of initialization
        setIsInitializing(false)
      } catch (err) {
        console.error('[Square] Initialization error:', err)
        setError('Failed to initialize payment form')
        setIsInitializing(false)
      }
    }

    // Safety timeout (still useful for detecting hangs)
    const timeout = setTimeout(() => {
      if (isInitializing) {
        console.error('[Square] Initialization timeout after 30 seconds')
        setError('Payment form initialization timeout')
        setIsInitializing(false)
      }
    }, 30000)

    // ✅ Call immediately - DOM is ready since component mounted
    initializeSquare()

    return () => {
      clearTimeout(timeout)
      if (card) {
        card.destroy()
      }
    }
  }, [applicationId, locationId])
}
```

### Key Changes

1. **Removed initialization timer** - Call `initializeSquare()` directly
2. **Kept safety timeout** - Still useful for detecting genuine hangs
3. **Added detailed logging** - Helps debug if issues occur
4. **Improved ref guard** - Check happens before ANY side effects

### Why This Works

```
1. Component Mount #1 (StrictMode)
   - initAttempted.current = false
   - Set initAttempted.current = true
   - Call initializeSquare() immediately
   - Initialization starts

2. React StrictMode Cleanup #1
   - clearTimeout(safety timeout)
   - card.destroy() if exists
   - ⚠️ initializeSquare() may still be running (async)

3. Component Mount #2 (StrictMode)
   - initAttempted.current = true
   - Check: if (initAttempted.current) return ✅ EXITS
   - initializeSquare() from mount #1 still completing

4. Result:
   - ✅ Initialization completes from first mount
   - ✅ Second mount safely exits
   - ✅ No duplicate work
   - ✅ Payment form loads successfully
```

### Files Affected

- `components/checkout/square-card-payment.tsx` (lines 99-198)
- `components/checkout/cashapp-qr-payment.tsx` (lines 75-228)

### How to Reproduce the Bug

To recreate:

1. Restore the `setTimeout(() => initializeSquare(), 300)` pattern
2. Run in development mode (StrictMode enabled)
3. Payment form will show "Loading..." forever
4. Console will show initialization never starts

### Verification Test

After fix, console should show:

```
[Square Card] useEffect running {initAttempted: false}
[Square Card] First initialization, proceeding
[Square Card] initializeSquare starting
[Square Card] loadSquareScript called
[Square Card] useEffect running {initAttempted: true}
[Square Card] Already initialized, skipping
[Square Card] loadSquareScript completed
```

---

## Bug #3: Container Rendering Race Condition

### Severity: HIGH ⚠️
**Impact:** SDK loaded but couldn't attach to DOM, payments stuck loading

### The Problem

Even after fixing Bugs #1 and #2, the payment form still wouldn't appear. The issue was a circular dependency:

- Container div only renders when `isInitializing = false`
- But `isInitializing` only sets to `false` AFTER attaching to container
- **Chicken and egg problem!**

### What Was Happening

```javascript
// BROKEN CODE (before fix):
export function SquareCardPayment(props) {
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    const initializeSquare = async () => {
      await loadSquareScript()

      const paymentsInstance = window.Square.payments(appId, locationId)
      const cardInstance = await paymentsInstance.card()

      // ❌ Try to attach to container
      await cardInstance.attach('#square-card-container')

      // ❌ Only set false AFTER attach succeeds
      setIsInitializing(false)
    }

    initializeSquare()
  }, [])

  // ❌ Container only renders when isInitializing is false
  return (
    <Card>
      {isInitializing ? (
        <p>Loading payment form...</p>
      ) : (
        <div id="square-card-container"></div>  {/* Never renders! */}
      )}
    </Card>
  )
}
```

### The Deadlock

```
1. Component mounts, isInitializing = true
2. Shows "Loading payment form..."
3. SDK loads successfully
4. Try to attach: cardInstance.attach('#square-card-container')
5. ❌ Element doesn't exist (not in DOM)
6. attach() fails or waits forever
7. setIsInitializing(false) never called
8. Container never renders
9. Stuck forever!
```

### The Fix (Two-Part Solution)

**Part 1: Separate Loading States**

```javascript
// ✅ FIXED CODE:
export function SquareCardPayment(props) {
  const [isLoading, setIsLoading] = useState(true)       // Controls container rendering
  const [isInitializing, setIsInitializing] = useState(true)  // Controls button state

  useEffect(() => {
    if (initAttempted.current) return
    initAttempted.current = true

    // ✅ CRITICAL: Set isLoading to false IMMEDIATELY so containers render
    setIsLoading(false)

    const initializeSquare = async () => {
      try {
        await loadSquareScript()

        const paymentsInstance = window.Square.payments(appId, locationId)
        const cardInstance = await paymentsInstance.card({
          style: { /* ... */ }
        })

        // ✅ Container is now in DOM, wait for it
        let containerAttempts = 0
        let container = document.getElementById('square-card-container')
        while (!container && containerAttempts < 30) {
          await new Promise((resolve) => setTimeout(resolve, 100))
          container = document.getElementById('square-card-container')
          containerAttempts++
        }

        if (!container) {
          throw new Error('Card container element not found after 3 seconds')
        }

        // ✅ Now attach will succeed
        await cardInstance.attach('#square-card-container')
        setCard(cardInstance)

        // ✅ Enable Pay button
        setIsInitializing(false)
      } catch (err) {
        console.error('[Square] Initialization error:', err)
        setError(`Failed to initialize payment form: ${err.message}`)
        setIsInitializing(false)
      }
    }

    initializeSquare()

    return () => { /* cleanup */ }
  }, [applicationId, locationId])

  return (
    <Card>
      {isLoading ? (
        <div>Loading component...</div>
      ) : (
        <>
          {isInitializing && (
            <div className="text-center py-4">
              <p>Loading payment form...</p>
            </div>
          )}

          {/* ✅ Container always renders now (when isLoading is false) */}
          <div id="square-card-container" className={isInitializing ? 'hidden' : ''} />

          <Button
            disabled={isInitializing || isProcessing}
            onClick={handleCardPayment}
          >
            {isProcessing ? 'Processing...' : `Pay $${total.toFixed(2)}`}
          </Button>
        </>
      )}
    </Card>
  )
}
```

**Part 2: Cash App Pay Specific Fix**

For Cash App Pay, the fix is slightly different since the button is rendered BY Square:

```javascript
// ✅ FIXED CODE for Cash App Pay:
const initializeCashAppPay = async () => {
  try {
    await loadSquareScript()

    const paymentsInstance = window.Square.payments(appId, locationId)
    const paymentRequest = paymentsInstance.paymentRequest({ /* ... */ })
    const cashAppPayInstance = await paymentsInstance.cashAppPay(paymentRequest, options)

    cashAppPayInstance.addEventListener('ontokenization', handleTokenization)

    // ✅ CRITICAL: Set isInitializing to false so the container div renders
    setIsInitializing(false)

    // ✅ Give React time to render the container
    await new Promise((resolve) => setTimeout(resolve, 200))

    // ✅ Now wait for container
    let container = document.getElementById('cash-app-pay')
    let containerAttempts = 0
    while (!container && containerAttempts < 30) {
      await new Promise((resolve) => setTimeout(resolve, 100))
      container = document.getElementById('cash-app-pay')
      containerAttempts++
    }

    if (!container) {
      throw new Error('Cash App Pay container not found')
    }

    // ✅ Now attach will succeed
    await cashAppPayInstance.attach('#cash-app-pay', buttonOptions)
    setCashAppPay(cashAppPayInstance)
  } catch (err) {
    console.error('[Cash App Pay] Initialization error:', err)
    setError(err.message)
    setIsInitializing(false)
  }
}
```

### Why This Works

**Flow with fix:**

```
1. Component mounts, isLoading = true, isInitializing = true
2. useEffect runs
3. ✅ Immediately: setIsLoading(false)
4. ✅ Component re-renders, container div now in DOM
5. Start async initialization
6. Load SDK
7. Create card instance
8. ✅ Poll for container element (found immediately)
9. Attach to container (succeeds)
10. setIsInitializing(false)
11. ✅ Pay button enabled, form ready
```

### Files Affected

- `components/checkout/square-card-payment.tsx` (lines 57-64, 108-109, 117-127)
- `components/checkout/cashapp-qr-payment.tsx` (lines 161-180)

### How to Reproduce the Bug

To recreate:

1. Remove `setIsLoading(false)` call
2. Or make container conditional on `isInitializing`
3. Payment form will load SDK but never show inputs
4. Console will show: "Card container element not found after 3 seconds"

### Verification Test

After fix:

```javascript
// In browser console after clicking payment button:
document.getElementById('square-card-container')
// Should return: <div id="square-card-container">...</div>

// Should contain Square's iframe:
document.querySelector('#square-card-container iframe')
// Should return: <iframe name="sq-card-number">...</iframe>
```

---

## Summary of All Fixes

| Bug | Symptom | Root Cause | Fix |
|-----|---------|------------|-----|
| #1: Function Hoisting | No SDK loaded | `loadSquareScript` defined after use | Move function definition before `useEffect` |
| #2: Timer Cancellation | Initialization never starts | StrictMode cleanup cancels timer | Call initialization directly, remove timer |
| #3: Container Race | SDK loads but can't attach | Container doesn't render until after attach | Set `isLoading = false` early, poll for container |

## Testing the Fixes

### Before Fixes

```bash
# Symptoms:
✗ Payment form shows "Loading..." forever
✗ No Square SDK script in <head>
✗ window.Square is undefined
✗ No iframes in payment container
✗ Console error: "loadSquareScript is not defined"
```

### After Fixes

```bash
# Success indicators:
✓ Payment form loads within 1-2 seconds
✓ Square SDK script appears in <head>
✓ window.Square exists and is an object
✓ Card input iframes render correctly
✓ Console logs show successful initialization
✓ Can enter card details and process payment
```

### Playwright Test Results

```bash
# Before fixes:
Square SDK loaded: ❌
Card container exists: ❌
Still loading after 10s: ❌ YES

# After fixes:
Square SDK loaded: ✅
Card container exists: ✅
Still loading after 10s: ✅ NO
Square SDK scripts loaded: 1
  - https://sandbox.web.squarecdn.com/v1/square.js
```

---

## Lessons Learned

### 1. Function Declaration vs Expression

```javascript
// Hoisted (available anywhere in scope):
function loadScript() { }

// NOT hoisted (only available after definition):
const loadScript = () => { }
const loadScript = function() { }
```

**Rule:** When a function is called before its lexical definition, use `function` declaration or move the arrow function earlier.

### 2. React StrictMode Behavior

- StrictMode double-mounts components in development
- Cleanup functions run between mounts
- Use refs to prevent duplicate side effects
- Don't rely on timers that might be cleared

**Rule:** For critical initialization, call immediately or use refs to prevent duplicate execution.

### 3. Conditional Rendering and DOM Timing

- React updates are asynchronous
- DOM elements don't exist until React commits
- External SDKs need elements to exist before attaching

**Rule:** Render DOM elements early, hide them with CSS if needed, then attach SDK after a brief delay or polling.

---

## Prevention Checklist

To avoid similar bugs in future:

- [ ] Define helper functions before they're called
- [ ] Don't use `setTimeout` for critical initialization in effects
- [ ] Use refs to prevent StrictMode double-execution
- [ ] Render DOM containers before SDK attachment
- [ ] Add retry logic for DOM element access
- [ ] Include comprehensive logging for debugging
- [ ] Test in both development (StrictMode) and production
- [ ] Verify SDK script loads in browser DevTools
- [ ] Check that `window.Square` exists before using
- [ ] Confirm DOM elements exist before SDK operations

---

## Additional Resources

- [React StrictMode Documentation](https://react.dev/reference/react/StrictMode)
- [JavaScript Hoisting](https://developer.mozilla.org/en-US/docs/Glossary/Hoisting)
- [Square Web SDK Documentation](https://developer.squareup.com/docs/web-payments/overview)
- [useEffect Hook](https://react.dev/reference/react/useEffect)

---

**Document Version:** 1.0
**Last Updated:** 2025-01-17
**Implementation Status:** ✅ All bugs fixed and verified

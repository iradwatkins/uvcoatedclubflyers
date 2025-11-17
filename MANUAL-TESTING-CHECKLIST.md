# Manual Payment Testing Checklist

## ✅ Automated Tests Complete

All automated configuration tests have passed (9/9 - 100%):
- ✅ Square Card Payment (3/3 tests passed)
- ✅ Cash App Pay (3/3 tests passed)
- ✅ PayPal (3/3 tests passed)

See `TESTING-RESULTS.md` for detailed automated test results.

## 🎯 Manual Testing Instructions

You requested to test each payment method **3 times**. Follow these steps:

### Before You Start

1. **Open the test page:**
   ```
   http://localhost:3001/test-payments
   ```

2. **Open Browser Developer Tools:**
   - Press **F12** (Windows/Linux) or **Cmd+Option+I** (Mac)
   - Click on the **Console** tab
   - Keep it open throughout testing

### Test 1: Square Card Payment (3 times)

#### Test #1 - Square Card
- [ ] Click "Square Card Payment" button
- [ ] Wait for payment form to load
- [ ] Check console for logs:
  ```
  [Square Card] Checking for existing Square SDK...
  [Square Card] Loading Square SDK...
  [Square Card] ✅ Script onload event fired
  [Square Card] ✅ window.Square is available
  [Square Card] ✅ Card attached successfully
  [Square Card] 🎉 Initialization complete!
  ```
- [ ] Verify card input fields appear:
  - [ ] Card Number field
  - [ ] CVV field
  - [ ] Expiration Date field
  - [ ] Postal Code field
- [ ] (Optional) Enter test card: `4111 1111 1111 1111`, CVV: `123`, Expiry: `12/25`, ZIP: `12345`
- [ ] (Optional) Click "Pay" button and verify payment processing
- [ ] Click "Back" button to return to selection

#### Test #2 - Square Card
- [ ] Click "Square Card Payment" button again
- [ ] Verify it loads faster (SDK already loaded)
- [ ] Check console shows SDK reuse: `[Square Card] ✅ Square SDK already available`
- [ ] Verify card fields appear
- [ ] Click "Back" button

#### Test #3 - Square Card
- [ ] Click "Square Card Payment" button again
- [ ] Verify payment form loads correctly
- [ ] Check console for successful initialization
- [ ] Click "Back" button

**Square Card Status:** ___/3 tests completed successfully

---

### Test 2: Cash App Pay (3 times)

#### Test #1 - Cash App Pay
- [ ] Click "Cash App Pay" button
- [ ] Wait for Cash App button to load
- [ ] Check console for logs:
  ```
  [Cash App Pay] Checking for existing Square SDK...
  [Cash App Pay] ✅ window.Square is available
  [Cash App Pay] Payment request created
  [Cash App Pay] Instance created
  [Cash App Pay] ✅ Button attached successfully
  [Cash App Pay] 🎉 Initialization complete!
  ```
- [ ] Verify green Cash App Pay button appears
- [ ] Verify "Powered by Square" text appears
- [ ] (Optional) Click Cash App button to test payment flow
- [ ] Click "Back" button to return to selection

#### Test #2 - Cash App Pay
- [ ] Click "Cash App Pay" button again
- [ ] Verify it loads faster (SDK already loaded)
- [ ] Check console shows SDK reuse
- [ ] Verify Cash App button appears
- [ ] Click "Back" button

#### Test #3 - Cash App Pay
- [ ] Click "Cash App Pay" button again
- [ ] Verify Cash App button loads correctly
- [ ] Check console for successful initialization
- [ ] Click "Back" button

**Cash App Pay Status:** ___/3 tests completed successfully

---

### Test 3: PayPal (3 times)

#### Test #1 - PayPal
- [ ] Click "PayPal Payment" button
- [ ] Wait for PayPal buttons to load
- [ ] Check console for logs:
  ```
  [PayPal] Initializing...
  [PayPal] PayPal SDK loaded
  [PayPal] PayPal buttons rendered
  ```
- [ ] Verify blue PayPal button(s) appear
- [ ] Verify "Powered by PayPal" or PayPal branding
- [ ] (Optional) Click PayPal button to test checkout flow
- [ ] Click "Back" button to return to selection

#### Test #2 - PayPal
- [ ] Click "PayPal Payment" button again
- [ ] Verify PayPal buttons load
- [ ] Check console for successful initialization
- [ ] Click "Back" button

#### Test #3 - PayPal
- [ ] Click "PayPal Payment" button again
- [ ] Verify PayPal buttons appear
- [ ] Check console for successful initialization
- [ ] Click "Back" button

**PayPal Status:** ___/3 tests completed successfully

---

## 📊 Test Completion Summary

Record your results:

| Payment Method | Test 1 | Test 2 | Test 3 | Overall Status |
|---------------|--------|--------|--------|----------------|
| Square Card   | ☐      | ☐      | ☐      | ___/3 passed   |
| Cash App Pay  | ☐      | ☐      | ☐      | ___/3 passed   |
| PayPal        | ☐      | ☐      | ☐      | ___/3 passed   |

**Total:** ___/9 manual tests passed

---

## 🐛 Troubleshooting

### If Payment Form Doesn't Load

1. **Check Browser Console**
   - Look for red error messages
   - Check where the initialization stops
   - Look for messages like "❌" indicating failures

2. **Check Network Tab**
   - Click the "Network" tab in DevTools
   - Filter by "JS"
   - Look for `square.js` or `paypal.com/sdk`
   - Verify status is 200 (not 404, 500, or CORS error)

3. **Check SDK Loading Time**
   - Console logs show timing: `✅ window.Square is available after X.X seconds`
   - If it takes longer than 15 seconds, there may be a network issue

4. **Use Diagnostic Page**
   - Go to: http://localhost:3001/square-test
   - This page has detailed SDK diagnostics
   - Check the three status indicators:
     - Script Loaded
     - window.Square Available
     - Payments Initialized

### Common Issues

| Issue | Solution |
|-------|----------|
| "Loading..." stuck forever | Check Network tab for blocked scripts |
| Script loads but form doesn't appear | Check console for container element errors |
| CORS error in console | Check if running on correct localhost port (3001) |
| Payment buttons don't render | Verify environment variables are set correctly |

---

## 📋 What to Report

If you encounter issues, please provide:

1. **Which payment method failed**
2. **Which test number (1, 2, or 3)**
3. **Screenshot of browser console** (with any errors highlighted)
4. **Screenshot of Network tab** (showing the failed request)
5. **Screenshot of the test page** (showing what you see)
6. **What step failed** (e.g., "SDK loaded but form didn't appear")

---

## ✨ Expected Behavior

### Square Card Payment
- Should load within 2-3 seconds
- Card input fields should appear with styled borders
- Fields should respond to input
- Form should show "Secure payment encrypted by Square"

### Cash App Pay
- Should load within 2-3 seconds
- Green Cash App Pay button should appear
- Button should have Square branding footer
- Button should be clickable (may show QR code in sandbox)

### PayPal
- Should load within 2-3 seconds
- Blue PayPal button(s) should appear
- May show multiple options (PayPal, Pay Later, etc.)
- Buttons should be clickable (redirects to PayPal login in sandbox)

---

## 🎉 Success Criteria

All tests pass if:
- ✅ All 9 tests (3 per method) load payment UI successfully
- ✅ No red errors in console
- ✅ All payment buttons/forms render correctly
- ✅ Console logs show "🎉 Initialization complete!" for each method

---

## 📝 Notes

- Test counters on the page (0/3, 1/3, 2/3, 3/3) are for visual tracking
- You don't need to complete actual payments (unless you want to)
- The goal is to verify payment UIs load and render correctly
- SDK improvements have been applied (15 second timeout, better logging)
- All configuration tests passed - credentials are correct

---

**Date:** _______________
**Tester:** _______________
**Environment:** Sandbox (http://localhost:3001)
**Test Duration:** ~5-10 minutes

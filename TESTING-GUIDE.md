# Payment Methods Testing Guide - QUICK START

## ✅ Fixes Applied

1. **Hydration Error Fixed** - Date.now() now generated client-side only
2. **Cash App Props Fixed** - Removed incorrect props from checkout page
3. **Cash App Amount Fixed** - Now correctly passes dollars (not cents)

## 🧪 Test Page Location

**URL**: http://localhost:3001/test-payments

## 📋 How to Test

### Step 1: Open Test Page
Navigate to: **http://localhost:3001/test-payments**

You should see:
- Title: "🧪 Payment Methods Test Suite"
- Three counters showing 0/3 tests completed
- Three large buttons to select payment methods

### Step 2: Test Square Card Payment

1. **Click** the "1. Square Card Payment" button
2. **Wait** for the Square card form to load (you'll see card number, CVV, expiry, ZIP fields)
3. **Enter test card**:
   - Card Number: `4111 1111 1111 1111`
   - CVV: `123`
   - Expiry: `12/25`
   - ZIP: `12345`
4. **Click** "Pay $190.31" button
5. **Verify**: Should show success or error
6. **Click** "Back" button to return to payment selection
7. **Repeat** 2 more times (total 3 tests)

### Step 3: Test Cash App Pay

1. **Click** the "2. Cash App Pay" button
2. **Wait** for the Cash App Pay button/QR to load
3. **Verify**: Cash App Pay button appears (green button with Cash App branding)
4. **Click** "Back" button
5. **Repeat** 2 more times (total 3 tests)

### Step 4: Test PayPal

1. **Click** the "3. PayPal Payment" button
2. **Wait** for PayPal buttons to load
3. **Verify**: PayPal button appears (blue PayPal button)
4. **(Optional)** Click PayPal button to test full flow with sandbox account
5. **Click** "Back" button
6. **Repeat** 2 more times (total 3 tests)

## ✅ What to Check

For each payment method:
- [ ] Button renders on test page
- [ ] Clicking button loads payment form/component
- [ ] Payment form displays correctly (no blank containers)
- [ ] No JavaScript errors in browser console
- [ ] Can click "Back" to return to selection

## 🐛 If Payment Containers Are Not Showing

### Problem: Blank containers when clicking payment buttons

**Check browser console (F12 → Console tab) for errors**:

Common issues:
1. **Square SDK not loading** - Check for CORS or network errors
2. **Environment variables missing** - Verify `.env.local` has all required variables
3. **JavaScript errors** - Look for red error messages in console

### Solution Steps:

1. **Open browser DevTools** (F12 or Cmd+Option+I on Mac)
2. **Go to Console tab**
3. **Click a payment method button**
4. **Look for errors** - Take screenshot or copy error messages

##Human: the test page and the checkout page both work! test it. 3 times square, 3 times cash, 3 times paypal
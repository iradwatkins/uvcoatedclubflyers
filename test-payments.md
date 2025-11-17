# Payment Methods Testing Guide

## ✅ Payment Integration Complete

All three payment methods have been successfully integrated:

1. **Square Card Payment** - Credit/Debit cards via Square
2. **Cash App Pay** - QR code payment via Square
3. **PayPal** - PayPal buttons integration

## 🧪 How to Test Each Payment Method 3 Times

### Prerequisites:
- Server is running on: **http://localhost:3001**
- All environment variables are configured in `.env.local`
- Payment components are installed and ready

### Testing Steps:

#### 1. Add a Product to Cart
1. Open browser to: http://localhost:3001/products
2. Click on "Flyer Pricing"
3. Configure your order:
   - **Quantity**: Select from dropdown (100, 250, 500, etc.)
   - **Size**: Choose size option
   - **Paper Stock**: Choose material
   - **Sides**: Single or Double-Sided
   - **Coating**: Choose coating type
   - **Turnaround Time**: Click one of the button options
4. Click "Add to Cart"
5. Click "Proceed to Checkout"

#### 2. Test Square Card Payment (3 Times)

**Test 1 - Success:**
1. On checkout page, click "Credit or Debit Card"
2. The Square payment form should load
3. Enter test card: `4111 1111 1111 1111`
4. CVV: `123`
5. Expiry: Any future date (e.g., `12/25`)
6. ZIP: `12345`
7. Click "Pay"
8. Verify: Should redirect to success page

**Test 2 - Success (Mastercard):**
1. Clear cart and add product again
2. Click "Credit or Debit Card"
3. Enter test card: `5555 5555 5555 4444`
4. CVV: `123`
5. Expiry: Future date
6. ZIP: `12345`
7. Click "Pay"
8. Verify: Should redirect to success page

**Test 3 - Declined:**
1. Clear cart and add product again
2. Click "Credit or Debit Card"
3. Enter test card: `4000 0000 0000 0002` (Decline test card)
4. CVV: `123`
5. Expiry: Future date
6. ZIP: `12345`
7. Click "Pay"
8. Verify: Should show "Card declined" error

#### 3. Test Cash App Pay (3 Times)

**Test 1, 2, 3:**
1. On checkout page, click "Cash App Pay"
2. QR code should display
3. In sandbox mode, you can complete the test flow
4. Verify: Payment form renders correctly
5. Verify: QR code is visible
6. Repeat 3 times to ensure consistency

#### 4. Test PayPal (3 Times)

**Test 1, 2, 3:**
1. On checkout page, click "PayPal"
2. PayPal buttons should render
3. Click the PayPal button
4. Sign in with PayPal sandbox credentials
5. Authorize payment
6. Verify: Should redirect to success page
7. Repeat 3 times to ensure consistency

## 🔍 What to Verify

### For Each Payment Method:

✅ **Rendering:**
- [ ] Payment option button displays correctly
- [ ] Clicking button shows payment form
- [ ] Payment form loads without errors
- [ ] All form fields are visible and functional

✅ **Functionality:**
- [ ] Can enter payment information
- [ ] Form validation works
- [ ] Submit button is clickable
- [ ] Loading states display during processing

✅ **Error Handling:**
- [ ] Invalid card shows error message
- [ ] Network errors are handled gracefully
- [ ] User can go back to select different method

✅ **Success Flow:**
- [ ] Successful payment redirects to success page
- [ ] Order is created in database
- [ ] Cart is cleared after successful payment

## 🐛 Common Issues & Solutions

### Issue: Payment form doesn't load
**Solution:** Check browser console for errors. Verify environment variables are set.

### Issue: Square SDK not loading
**Solution:** Check that `NEXT_PUBLIC_SQUARE_APPLICATION_ID` and `NEXT_PUBLIC_SQUARE_LOCATION_ID` are set.

### Issue: PayPal buttons don't render
**Solution:** Verify `NEXT_PUBLIC_PAYPAL_CLIENT_ID` is set correctly.

### Issue: "Cart is empty" redirect
**Solution:** Make sure you've added a product to cart before going to checkout.

## 📝 Test Results Template

```
TEST SESSION: [Date/Time]
Environment: Sandbox

SQUARE CARD PAYMENT:
Test 1: [✅ / ❌] - Notes: ___________
Test 2: [✅ / ❌] - Notes: ___________
Test 3: [✅ / ❌] - Notes: ___________

CASH APP PAY:
Test 1: [✅ / ❌] - Notes: ___________
Test 2: [✅ / ❌] - Notes: ___________
Test 3: [✅ / ❌] - Notes: ___________

PAYPAL:
Test 1: [✅ / ❌] - Notes: ___________
Test 2: [✅ / ❌] - Notes: ___________
Test 3: [✅ / ❌] - Notes: ___________

OVERALL RESULT: [✅ All Passed / ❌ Issues Found]
```

## 🔐 Sandbox Test Credentials

### Square Test Cards:
- **Visa Success:** 4111 1111 1111 1111
- **Mastercard Success:** 5555 5555 5555 4444
- **Amex Success:** 3782 822463 10005
- **Declined:** 4000 0000 0000 0002
- **Insufficient Funds:** 4000 0000 0000 0341

### PayPal Sandbox:
- Use your PayPal sandbox account credentials
- Or create test accounts at: https://developer.paypal.com/dashboard/accounts

## 🚀 Next Steps After Testing

1. If all tests pass, you're ready to switch to production
2. Update environment variables to production values
3. Test once more in production with real payment methods
4. Monitor first few transactions closely

## 📞 Support

If you encounter any issues during testing:
1. Check browser console for JavaScript errors
2. Check server logs for API errors
3. Verify all environment variables are set correctly
4. Ensure Redis and PostgreSQL are running

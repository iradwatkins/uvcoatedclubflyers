# Square Payment Integration - Implementation Guide

## Overview

This guide walks you through integrating Square Card and Cash App Pay payments into your Next.js application. This implementation has been tested and verified to work correctly after fixing three critical bugs.

---

## Prerequisites

- Next.js 14+ (tested with Next.js 16)
- React 18+ (tested with React 19)
- Node.js 20+
- A Square developer account with:
  - Application ID
  - Location ID
  - Access Token

---

## Quick Start (15 Minutes)

### Step 1: Install Dependencies

```bash
npm install square@^43.2.0
npm install @radix-ui/react-checkbox@^1.3.3 @radix-ui/react-label@^2.1.8
npm install lucide-react@^0.468.0 class-variance-authority@^0.7.1 clsx@^2.1.1 tailwind-merge@^2.6.0
```

### Step 2: Configure Environment Variables

Create or update your `.env.local`:

```bash
# Frontend (public - accessible in browser)
NEXT_PUBLIC_SQUARE_APPLICATION_ID=sandbox-sq0idb-YOUR_APP_ID_HERE
NEXT_PUBLIC_SQUARE_LOCATION_ID=YOUR_LOCATION_ID_HERE
NEXT_PUBLIC_SQUARE_ENVIRONMENT=sandbox

# Backend (secret - server-side only)
SQUARE_ACCESS_TOKEN=YOUR_ACCESS_TOKEN_HERE
SQUARE_LOCATION_ID=YOUR_LOCATION_ID_HERE
SQUARE_ENVIRONMENT=sandbox
```

**Important:**
- Use `sandbox` for testing, `production` for live payments
- Never commit `.env.local` to version control
- The access token must be kept secret (server-side only)

### Step 3: Copy Component Files

Copy the following folders to your project:

```
components/
├── checkout/
│   ├── square-card-payment.tsx
│   └── cashapp-qr-payment.tsx
└── ui/
    ├── button.tsx
    ├── card.tsx
    ├── alert.tsx
    ├── checkbox.tsx
    └── label.tsx

lib/
└── utils.ts
```

### Step 4: Copy Backend API Route

Copy the API route to your project:

```
app/api/checkout/process-square-payment/
└── route.ts
```

Or if using `pages` directory:

```
pages/api/checkout/
└── process-square-payment.ts
```

### Step 5: Implement in Your Checkout Page

```tsx
'use client'

import { useState } from 'react'
import { SquareCardPayment } from '@/components/checkout/square-card-payment'
import { CashAppQRPayment } from '@/components/checkout/cashapp-qr-payment'

export default function CheckoutPage() {
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cashapp' | null>(null)

  const handleSuccess = (result: Record<string, unknown>) => {
    console.log('Payment successful!', result)
    // Redirect to success page or update order status
    window.location.href = `/order/success?paymentId=${result.paymentId}`
  }

  const handleError = (error: string) => {
    console.error('Payment failed:', error)
    alert(`Payment failed: ${error}`)
  }

  return (
    <div className="container mx-auto max-w-2xl p-8">
      <h1 className="text-3xl font-bold mb-6">Checkout</h1>

      {!paymentMethod ? (
        <div className="space-y-4">
          <button
            onClick={() => setPaymentMethod('card')}
            className="w-full p-4 border rounded-lg hover:bg-gray-50"
          >
            Pay with Credit Card
          </button>

          <button
            onClick={() => setPaymentMethod('cashapp')}
            className="w-full p-4 border rounded-lg hover:bg-gray-50"
          >
            Pay with Cash App
          </button>
        </div>
      ) : paymentMethod === 'card' ? (
        <SquareCardPayment
          applicationId={process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID!}
          locationId={process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID!}
          total={99.99}
          environment={process.env.NEXT_PUBLIC_SQUARE_ENVIRONMENT as 'sandbox' | 'production'}
          onPaymentSuccess={handleSuccess}
          onPaymentError={handleError}
          onBack={() => setPaymentMethod(null)}
        />
      ) : (
        <CashAppQRPayment
          total={99.99}
          onPaymentSuccess={handleSuccess}
          onPaymentError={handleError}
          onBack={() => setPaymentMethod(null)}
        />
      )}
    </div>
  )
}
```

### Step 6: Verify Tailwind Configuration

Ensure your `tailwind.config.ts` includes the component paths:

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  // ... rest of config
}
```

---

## Component API Reference

### SquareCardPayment

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `applicationId` | string | Yes | Square Application ID |
| `locationId` | string | Yes | Square Location ID |
| `total` | number | Yes | Payment amount in dollars (e.g., 99.99) |
| `environment` | 'sandbox' \| 'production' | No | Default: 'sandbox' |
| `billingContact` | BillingContact | No | Pre-fill billing information |
| `savedPaymentMethod` | SavedPaymentMethod | No | Use saved card |
| `user` | User | No | Current user info for saving cards |
| `onPaymentSuccess` | (result) => void | Yes | Success callback |
| `onPaymentError` | (error) => void | Yes | Error callback |
| `onBack` | () => void | Yes | Back button callback |

**BillingContact Type:**

```typescript
interface BillingContact {
  givenName?: string
  familyName?: string
  email?: string
  phone?: string
  addressLines?: string[]
  city?: string
  state?: string
  countryCode?: string
  postalCode?: string
}
```

**Example with billing contact:**

```tsx
<SquareCardPayment
  applicationId={appId}
  locationId={locationId}
  total={99.99}
  billingContact={{
    givenName: 'John',
    familyName: 'Doe',
    email: 'john@example.com',
    postalCode: '12345'
  }}
  onPaymentSuccess={handleSuccess}
  onPaymentError={handleError}
  onBack={handleBack}
/>
```

### CashAppQRPayment

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `total` | number | Yes | Payment amount in dollars (e.g., 99.99) |
| `onPaymentSuccess` | (result) => void | Yes | Success callback |
| `onPaymentError` | (error) => void | Yes | Error callback |
| `onBack` | () => void | Yes | Back button callback |

**Note:** Cash App Pay reads Square credentials from environment variables automatically.

---

## Backend API Route

The backend route `/api/checkout/process-square-payment` handles payment processing.

**Request Format:**

```typescript
POST /api/checkout/process-square-payment
Content-Type: application/json

{
  "sourceId": "cnon:card-nonce-ok",  // Payment token from Square SDK
  "amount": 9999,                     // Amount in cents
  "currency": "USD",
  "customerId": "customer_123",       // Optional
  "referenceId": "ORDER-12345"        // Optional
}
```

**Response Format (Success):**

```json
{
  "success": true,
  "paymentId": "payment_xyz",
  "status": "COMPLETED",
  "receiptUrl": "https://squareup.com/receipt/..."
}
```

**Response Format (Error):**

```json
{
  "success": false,
  "error": "Card declined",
  "details": "CARD_DECLINED"
}
```

---

## Testing

### Sandbox Test Cards

Use these test cards in sandbox mode:

**Successful Payment:**
- Card Number: `4111 1111 1111 1111`
- CVV: `123`
- Expiration: Any future date
- ZIP: `12345`

**Declined Card:**
- Card Number: `4000 0000 0000 0002`

**Insufficient Funds:**
- Card Number: `4000 0000 0000 9995`

**Full Test Card List:**
https://developer.squareup.com/docs/testing/test-values

### Testing Cash App Pay

In sandbox mode, Cash App Pay will show a test interface. Click "Authorize" to simulate a successful payment.

---

## Important Configuration Notes

### 1. DO NOT Add Script to Layout

**❌ WRONG:**

```tsx
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <script src="https://sandbox.web.squarecdn.com/v1/square.js"></script>
      </head>
      <body>{children}</body>
    </html>
  )
}
```

**✅ CORRECT:**

```tsx
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <head></head>
      <body>{children}</body>
    </html>
  )
}
```

**Why:** The components load the Square SDK dynamically. Adding it to the layout causes duplicate loading and race conditions (Bug #1 in BUG-FIXES-EXPLAINED.md).

### 2. Amount Handling

**Square Card Payment:**
- Expects amount in **dollars** (e.g., `99.99`)
- Converts to cents internally for the API

**Backend API:**
- Expects amount in **cents** (e.g., `9999`)
- Converts to BigInt for Square API

### 3. Environment Variables

- Variables starting with `NEXT_PUBLIC_` are exposed to the browser
- Never put access tokens in `NEXT_PUBLIC_` variables
- Restart dev server after changing `.env.local`

---

## Production Checklist

Before going live:

- [ ] Update `NEXT_PUBLIC_SQUARE_ENVIRONMENT=production`
- [ ] Update `SQUARE_ENVIRONMENT=production`
- [ ] Use production Application ID
- [ ] Use production Access Token
- [ ] Test with real payment methods
- [ ] Set up webhook handlers for payment updates
- [ ] Implement proper order fulfillment
- [ ] Add error logging and monitoring
- [ ] Configure HTTPS (required for Square SDK)
- [ ] Review Square's compliance requirements

---

## Troubleshooting

### Payment form stuck on "Loading payment form..."

**Cause:** Container element not rendering before SDK tries to attach.

**Solution:** Verify `isLoading` is set to `false` early in the initialization. This is already fixed in the provided components (see BUG-FIXES-EXPLAINED.md #3).

### "Square Web Payments SDK failed to load"

**Possible causes:**
1. Network blocking the CDN
2. Ad blocker interfering
3. CSP (Content Security Policy) blocking the script

**Solution:** Check browser console for blocked requests. Add Square CDN to CSP if needed:

```
script-src 'self' https://sandbox.web.squarecdn.com https://web.squarecdn.com;
```

### "Card container element not found"

**Cause:** DOM element doesn't exist when SDK tries to attach.

**Solution:** Already handled in the component with retry logic (waits up to 3 seconds). If still happening, check that the component is rendering correctly.

### Payments work in development but fail in production

**Common causes:**
1. Environment variables not set in production
2. Using sandbox credentials in production
3. HTTP instead of HTTPS (Square requires HTTPS in production)

**Solution:**
1. Verify all environment variables are set in your hosting platform
2. Double-check you're using production credentials
3. Ensure your site is served over HTTPS

---

## Advanced Features

### Saving Payment Methods

To enable saving cards for future use:

```tsx
<SquareCardPayment
  {...props}
  user={{
    id: 'user_123',
    email: 'user@example.com',
    name: 'John Doe'
  }}
  // Component will show "Save card for future purchases" checkbox
/>
```

Then implement the `/api/save-payment-method` endpoint to store the card in your database.

### Using Saved Cards

```tsx
<SquareCardPayment
  {...props}
  savedPaymentMethod={{
    id: 'pm_123',
    squareCardId: 'ccof:...',
    maskedNumber: '****1111',
    cardBrand: 'VISA'
  }}
  // Component will show "Pay with Visa ****1111" option
/>
```

### Custom Styling

The Square Card component accepts style customization:

```typescript
// In square-card-payment.tsx, modify the style object:
const cardInstance = await paymentsInstance.card({
  style: {
    '.input-container': {
      borderRadius: '8px',
      borderColor: '#E5E7EB',
      borderWidth: '1px',
    },
    '.input-container.is-focus': {
      borderColor: '#3B82F6',
    },
    '.input-container.is-error': {
      borderColor: '#EF4444',
    },
    input: {
      fontSize: '16px',
      color: '#111827',
    },
  },
})
```

---

## Support & Resources

- **Square Developer Docs:** https://developer.squareup.com/docs/web-payments/overview
- **Square Web SDK Reference:** https://developer.squareup.com/reference/sdks/web/payments
- **Test Values:** https://developer.squareup.com/docs/testing/test-values
- **Square Developer Dashboard:** https://developer.squareup.com/apps

---

## Next Steps

1. Test payments in sandbox mode
2. Implement order confirmation page
3. Set up webhooks for payment status updates
4. Add receipt email functionality
5. Prepare for production launch

For detailed information about the bugs that were fixed in this implementation, see `BUG-FIXES-EXPLAINED.md`.

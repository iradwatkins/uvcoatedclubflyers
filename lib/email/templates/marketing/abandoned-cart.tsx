import * as React from 'react'

interface CartItem {
  productName: string
  quantity: number
  price: number
  options?: Record<string, string>
}

interface AbandonedCartEmailProps {
  customerName?: string
  items: CartItem[]
  subtotal: number
  total: number
  cartUrl: string
  couponCode?: string
  couponValue?: number
  hoursSinceAbandonment: number
}

export const AbandonedCartEmail = ({
  customerName,
  items,
  subtotal,
  total,
  cartUrl,
  couponCode,
  couponValue,
  hoursSinceAbandonment,
}: AbandonedCartEmailProps) => {
  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <title>Your Cart is Waiting</title>
      </head>
      <body
        style={{
          fontFamily: 'Arial, sans-serif',
          maxWidth: '600px',
          margin: '0 auto',
          padding: '20px',
        }}
      >
        {/* Header */}
        <div
          style={{
            background: '#f97316',
            padding: '24px',
            borderRadius: '8px',
            textAlign: 'center',
            marginBottom: '24px',
          }}
        >
          <h1 style={{ fontSize: '28px', margin: '0 0 16px', color: 'white' }}>
            🛒 Your Cart is Still Here!
          </h1>
          <p style={{ fontSize: '18px', color: 'white', margin: 0 }}>
            {customerName ? `Hi ${customerName}` : 'Hi there'}, you left something behind...
          </p>
        </div>

        {/* Message */}
        <div style={{ marginBottom: '24px' }}>
          <p style={{ fontSize: '16px', lineHeight: '1.6' }}>
            We noticed you left {items.length} item{items.length > 1 ? 's' : ''} in your cart about{' '}
            {hoursSinceAbandonment} hours ago. Your items are still waiting for you!
          </p>

          {couponCode && (
            <div
              style={{
                background: '#fef3c7',
                padding: '16px',
                borderRadius: '8px',
                margin: '20px 0',
                border: '2px dashed #f59e0b',
              }}
            >
              <p
                style={{
                  margin: '0 0 8px',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  textAlign: 'center',
                }}
              >
                🎉 Complete your order now and save {couponValue}%!
              </p>
              <p
                style={{
                  margin: 0,
                  textAlign: 'center',
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: '#f97316',
                }}
              >
                {couponCode}
              </p>
              <p
                style={{
                  margin: '8px 0 0',
                  fontSize: '12px',
                  textAlign: 'center',
                  color: '#737373',
                }}
              >
                Expires in 7 days
              </p>
            </div>
          )}
        </div>

        {/* Cart Items */}
        <div
          style={{
            background: '#f9fafb',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '24px',
          }}
        >
          <h2 style={{ fontSize: '18px', margin: '0 0 16px' }}>Your Cart:</h2>
          {items.map((item, index) => (
            <div
              key={index}
              style={{
                marginBottom: '12px',
                paddingBottom: '12px',
                borderBottom: index < items.length - 1 ? '1px solid #e5e7eb' : 'none',
              }}
            >
              <p style={{ margin: '0 0 4px', fontWeight: 'bold' }}>{item.productName}</p>
              <p style={{ margin: '0', fontSize: '14px', color: '#737373' }}>
                Quantity: {item.quantity} • {formatPrice(item.price)}
              </p>
              {item.options && Object.keys(item.options).length > 0 && (
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#a3a3a3' }}>
                  {Object.entries(item.options)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join(' • ')}
                </p>
              )}
            </div>
          ))}

          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '2px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '14px' }}>Subtotal:</span>
              <span style={{ fontSize: '14px' }}>{formatPrice(subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '16px', fontWeight: 'bold' }}>Total:</span>
              <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#f97316' }}>
                {formatPrice(total)}
              </span>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div style={{ textAlign: 'center', margin: '32px 0' }}>
          <a
            href={cartUrl}
            style={{
              background: '#f97316',
              color: 'white',
              padding: '14px 36px',
              textDecoration: 'none',
              borderRadius: '6px',
              fontWeight: 'bold',
              fontSize: '16px',
              display: 'inline-block',
            }}
          >
            Complete My Order →
          </a>
        </div>

        {/* Why Choose Us */}
        <div
          style={{
            background: '#f9fafb',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '24px',
          }}
        >
          <h3 style={{ fontSize: '16px', margin: '0 0 12px' }}>Why UV Coated Club Flyers?</h3>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', lineHeight: '1.8' }}>
            <li>⚡ Fast turnaround times</li>
            <li>🏆 Premium quality printing</li>
            <li>📦 Free shipping on orders over $100</li>
            <li>💯 100% satisfaction guarantee</li>
          </ul>
        </div>

        {/* Footer */}
        <div
          style={{
            textAlign: 'center',
            color: '#737373',
            fontSize: '14px',
            borderTop: '1px solid #e5e7eb',
            paddingTop: '20px',
          }}
        >
          <p style={{ margin: '0 0 8px' }}>Questions? Reply to this email or call (404) 668-2401</p>
          <p style={{ margin: 0, fontSize: '12px' }}>
            UV Coated Club Flyers • Professional Printing Services
          </p>
        </div>
      </body>
    </html>
  )
}

export default AbandonedCartEmail

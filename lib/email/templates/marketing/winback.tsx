import * as React from 'react'

interface WinbackEmailProps {
  customerName: string
  lastOrderDate: string
  lastOrderNumber: string
  daysSinceLastOrder: number
  couponCode?: string
  couponValue?: number
}

export const WinbackEmail = ({
  customerName,
  lastOrderDate,
  lastOrderNumber,
  daysSinceLastOrder,
  couponCode,
  couponValue,
}: WinbackEmailProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <title>We Miss You!</title>
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
            💙 We Miss You, {customerName}!
          </h1>
          <p style={{ fontSize: '18px', color: 'white', margin: 0 }}>
            It's been a while since we last saw you
          </p>
        </div>

        {/* Message */}
        <div style={{ marginBottom: '24px' }}>
          <p style={{ fontSize: '16px', lineHeight: '1.6' }}>
            It's been {Math.floor(daysSinceLastOrder)} days since your last order with us on{' '}
            {formatDate(lastOrderDate)}.
          </p>
          <p style={{ fontSize: '16px', lineHeight: '1.6' }}>
            We hope your previous order (#{lastOrderNumber}) turned out great! We'd love to help you
            with your next printing project.
          </p>

          {couponCode && (
            <div
              style={{
                background: '#fef3c7',
                padding: '20px',
                borderRadius: '8px',
                margin: '24px 0',
                border: '2px dashed #f59e0b',
              }}
            >
              <p
                style={{
                  margin: '0 0 12px',
                  fontWeight: 'bold',
                  fontSize: '18px',
                  textAlign: 'center',
                }}
              >
                🎁 Welcome Back Gift: {couponValue}% OFF Your Next Order!
              </p>
              <p
                style={{
                  margin: 0,
                  textAlign: 'center',
                  fontSize: '28px',
                  fontWeight: 'bold',
                  color: '#f97316',
                }}
              >
                {couponCode}
              </p>
              <p
                style={{
                  margin: '12px 0 0',
                  fontSize: '12px',
                  textAlign: 'center',
                  color: '#737373',
                }}
              >
                Expires in 7 days • One-time use
              </p>
            </div>
          )}
        </div>

        {/* Popular Products */}
        <div
          style={{
            background: '#f9fafb',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '24px',
          }}
        >
          <h2 style={{ fontSize: '18px', margin: '0 0 16px' }}>Our Most Popular Products:</h2>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', lineHeight: '1.8' }}>
            <li>
              📇 <strong>Business Cards</strong> - Starting at $19.99
            </li>
            <li>
              📄 <strong>Flyers & Postcards</strong> - High-quality, fast turnaround
            </li>
            <li>
              📚 <strong>Brochures & Catalogs</strong> - Perfect for promotions
            </li>
            <li>
              📋 <strong>Presentation Folders</strong> - Make an impression
            </li>
            <li>
              🪧 <strong>Posters & Banners</strong> - Get noticed
            </li>
          </ul>
        </div>

        {/* What's New */}
        <div
          style={{
            background: '#eff6ff',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '24px',
          }}
        >
          <h3 style={{ fontSize: '16px', margin: '0 0 12px' }}>✨ What's New at GangRun?</h3>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', lineHeight: '1.8' }}>
            <li>⚡ Even faster turnaround times (as fast as 24 hours!)</li>
            <li>📦 Free shipping on orders over $100</li>
            <li>🎨 New premium paper stocks and finishes</li>
            <li>🤖 Easy online ordering and file upload</li>
          </ul>
        </div>

        {/* CTA Button */}
        <div style={{ textAlign: 'center', margin: '32px 0' }}>
          <a
            href="https://uvcoatedclubflyers.com/products"
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
            {couponCode ? 'Claim My Discount' : 'Browse Products'} →
          </a>
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

export default WinbackEmail

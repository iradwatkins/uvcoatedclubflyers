import * as React from 'react'

interface ThankYouEmailProps {
  customerName: string
  orderNumber: string
  orderTotal: number
  trackingUrl: string
  recommendedProducts?: Array<{
    name: string
    price: number
    url: string
  }>
}

export const ThankYouEmail = ({
  customerName,
  orderNumber,
  orderTotal,
  trackingUrl,
  recommendedProducts,
}: ThankYouEmailProps) => {
  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <title>Thank You for Your Order!</title>
      </head>
      <body
        style={{
          fontFamily: 'Arial, sans-serif',
          maxWidth: '600px',
          margin: '0 auto',
          padding: '20px',
        }}
      >
        <div
          style={{
            background: '#f97316',
            padding: '24px',
            borderRadius: '8px',
            textAlign: 'center',
            marginBottom: '24px',
          }}
        >
          <h1 style={{ fontSize: '28px', margin: '0 0 16px', color: 'white' }}>🎉 Thank You!</h1>
          <p style={{ fontSize: '18px', color: 'white', margin: 0 }}>
            Your order has been received, {customerName}!
          </p>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <p style={{ fontSize: '16px', lineHeight: '1.6' }}>
            Thank you for choosing UV Coated Club Flyers! We're excited to bring your project to life.
          </p>
          <p style={{ fontSize: '16px', lineHeight: '1.6' }}>
            Your order #{orderNumber} for {formatPrice(orderTotal)} is now in production. We'll
            notify you as soon as it ships!
          </p>
        </div>

        <div
          style={{
            background: '#f9fafb',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '24px',
          }}
        >
          <h3 style={{ fontSize: '16px', margin: '0 0 12px' }}>📦 What Happens Next?</h3>
          <div style={{ fontSize: '14px', lineHeight: '1.8' }}>
            <p style={{ margin: '0 0 8px' }}>
              <strong>1. Production:</strong> Your order is being printed with care
            </p>
            <p style={{ margin: '0 0 8px' }}>
              <strong>2. Quality Check:</strong> We'll inspect every detail
            </p>
            <p style={{ margin: '0 0 8px' }}>
              <strong>3. Shipping:</strong> Carefully packaged and shipped to you
            </p>
            <p style={{ margin: 0 }}>
              <strong>4. Delivery:</strong> Track your shipment in real-time
            </p>
          </div>
        </div>

        <div style={{ textAlign: 'center', margin: '24px 0' }}>
          <a
            href={trackingUrl}
            style={{
              background: '#f97316',
              color: 'white',
              padding: '12px 32px',
              textDecoration: 'none',
              borderRadius: '6px',
              fontWeight: 'bold',
              fontSize: '14px',
              display: 'inline-block',
            }}
          >
            Track Your Order →
          </a>
        </div>

        {recommendedProducts && recommendedProducts.length > 0 && (
          <div
            style={{
              background: '#eff6ff',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '24px',
            }}
          >
            <h3 style={{ fontSize: '16px', margin: '0 0 16px' }}>🛍️ You Might Also Like:</h3>
            {recommendedProducts.map((product, index) => (
              <div
                key={index}
                style={{
                  marginBottom: '12px',
                  paddingBottom: '12px',
                  borderBottom:
                    index < recommendedProducts.length - 1 ? '1px solid #dbeafe' : 'none',
                }}
              >
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div>
                    <p style={{ margin: '0 0 4px', fontWeight: 'bold' }}>{product.name}</p>
                    <p style={{ margin: 0, fontSize: '14px', color: '#737373' }}>
                      Starting at {formatPrice(product.price)}
                    </p>
                  </div>
                  <a
                    href={product.url}
                    style={{
                      background: '#f97316',
                      color: 'white',
                      padding: '8px 16px',
                      textDecoration: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                    }}
                  >
                    View
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        <div
          style={{
            background: '#f9fafb',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '24px',
          }}
        >
          <h3 style={{ fontSize: '16px', margin: '0 0 12px' }}>💡 Pro Tips:</h3>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', lineHeight: '1.8' }}>
            <li>Save 10-20% by ordering in bulk next time</li>
            <li>Check out our premium finishes for added impact</li>
            <li>Sign up for our newsletter for exclusive deals</li>
            <li>Refer a friend and both get 15% off!</li>
          </ul>
        </div>

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

export default ThankYouEmail

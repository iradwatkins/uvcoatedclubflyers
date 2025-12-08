import * as React from 'react'

interface ReviewRequestEmailProps {
  customerName: string
  orderNumber: string
  orderDate: string
  reviewUrl: string
}

export const ReviewRequestEmail = ({
  customerName,
  orderNumber,
  orderDate,
  reviewUrl,
}: ReviewRequestEmailProps) => {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <title>How Did We Do?</title>
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
          <h1 style={{ fontSize: '28px', margin: '0 0 16px', color: 'white' }}>
            ⭐ How Did We Do?
          </h1>
          <p style={{ fontSize: '18px', color: 'white', margin: 0 }}>
            Hi {customerName}, we'd love your feedback!
          </p>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <p style={{ fontSize: '16px', lineHeight: '1.6' }}>
            Your order #{orderNumber} was delivered a few days ago, and we hope everything turned
            out perfect!
          </p>
          <p style={{ fontSize: '16px', lineHeight: '1.6' }}>
            We'd be incredibly grateful if you could take 60 seconds to share your experience with
            us. Your feedback helps us improve and helps other customers make informed decisions.
          </p>
        </div>

        <div
          style={{
            background: '#eff6ff',
            padding: '24px',
            borderRadius: '8px',
            textAlign: 'center',
            marginBottom: '24px',
          }}
        >
          <p style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 20px' }}>
            How would you rate your experience?
          </p>
          <div
            style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '20px' }}
          >
            <span style={{ fontSize: '32px' }}>⭐</span>
            <span style={{ fontSize: '32px' }}>⭐</span>
            <span style={{ fontSize: '32px' }}>⭐</span>
            <span style={{ fontSize: '32px' }}>⭐</span>
            <span style={{ fontSize: '32px' }}>⭐</span>
          </div>
          <a
            href={reviewUrl}
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
            Leave a Review →
          </a>
        </div>

        <div
          style={{
            background: '#f9fafb',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '24px',
          }}
        >
          <h3 style={{ fontSize: '16px', margin: '0 0 12px' }}>Your feedback helps us:</h3>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', lineHeight: '1.8' }}>
            <li>📈 Improve our products and services</li>
            <li>🤝 Help other customers make decisions</li>
            <li>💡 Understand what we're doing right (and wrong!)</li>
            <li>🙏 Show appreciation for our team's hard work</li>
          </ul>
        </div>

        <div
          style={{
            background: '#fef3c7',
            padding: '16px',
            borderRadius: '8px',
            margin: '24px 0',
            border: '1px solid #fbbf24',
          }}
        >
          <p style={{ margin: 0, fontSize: '14px', textAlign: 'center' }}>
            <strong>Note:</strong> If you had any issues with your order, please reply to this email
            and we'll make it right!
          </p>
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
          <p style={{ margin: '0 0 8px' }}>Thank you for choosing UV Coated Club Flyers!</p>
          <p style={{ margin: 0, fontSize: '12px' }}>
            UV Coated Club Flyers • Professional Printing Services
          </p>
        </div>
      </body>
    </html>
  )
}

export default ReviewRequestEmail

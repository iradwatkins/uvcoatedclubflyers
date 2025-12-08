import * as React from 'react'

interface AnniversaryEmailProps {
  customerName: string
  orderDate: string
  orderNumber: string
  yearsAgo: number
}

export const AnniversaryEmail = ({
  customerName,
  orderDate,
  orderNumber,
  yearsAgo,
}: AnniversaryEmailProps) => {
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
        <title>Happy Anniversary!</title>
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
          <h1 style={{ fontSize: '32px', margin: '0 0 16px', color: 'white' }}>
            🎉 Happy {yearsAgo}-Year Anniversary!
          </h1>
          <p style={{ fontSize: '18px', color: 'white', margin: 0 }}>
            Celebrating {yearsAgo} {yearsAgo === 1 ? 'year' : 'years'} together, {customerName}!
          </p>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <p style={{ fontSize: '16px', lineHeight: '1.6' }}>
            {yearsAgo === 1 ? 'One year ago today' : `${yearsAgo} years ago today`}, on{' '}
            {formatDate(orderDate)}, you placed your {yearsAgo === 1 ? 'first' : ''} order with
            UV Coated Club Flyers (Order #{orderNumber}).
          </p>
          <p style={{ fontSize: '16px', lineHeight: '1.6' }}>
            We're incredibly grateful for your continued trust and business. Thank you for being an
            amazing customer!
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
          <h2 style={{ fontSize: '24px', margin: '0 0 12px' }}>
            💙 Thank You for {yearsAgo} Amazing {yearsAgo === 1 ? 'Year' : 'Years'}!
          </h2>
          <p style={{ fontSize: '16px', margin: 0, lineHeight: '1.6' }}>
            Your support means the world to us. We look forward to many more years of helping you
            bring your printing projects to life!
          </p>
        </div>

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
            Start Your Next Project →
          </a>
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
          <p style={{ margin: '0 0 8px' }}>UV Coated Club Flyers • Professional Printing Services</p>
        </div>
      </body>
    </html>
  )
}

export default AnniversaryEmail

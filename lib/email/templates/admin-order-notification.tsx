import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface AdminOrderNotificationProps {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  itemCount: number;
  total: number;
  paymentMethod: string;
  orderUrl: string;
}

export const AdminOrderNotification = ({
  orderNumber,
  customerName,
  customerEmail,
  itemCount,
  total,
  paymentMethod,
  orderUrl,
}: AdminOrderNotificationProps) => {
  const previewText = `New order received: ${orderNumber}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>🎉 New Order Received!</Heading>

          <Section style={alertBox}>
            <Text style={alertText}>
              Order Number: <strong>{orderNumber}</strong>
            </Text>
          </Section>

          <Hr style={hr} />

          <Heading style={h2}>Customer Information</Heading>
          <Text style={text}>
            <strong>Name:</strong> {customerName}
            <br />
            <strong>Email:</strong> {customerEmail}
          </Text>

          <Hr style={hr} />

          <Heading style={h2}>Order Summary</Heading>
          <Text style={text}>
            <strong>Items:</strong> {itemCount}
            <br />
            <strong>Total:</strong> ${(total / 100).toFixed(2)}
            <br />
            <strong>Payment Method:</strong> {paymentMethod}
          </Text>

          <Hr style={hr} />

          <Section style={buttonSection}>
            <Link href={orderUrl} style={button}>
              View Full Order Details
            </Link>
          </Section>

          <Text style={footer}>
            Log in to the admin dashboard to process this order and update its status.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default AdminOrderNotification;

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0 48px',
};

const h2 = {
  color: '#333',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '20px 0 10px',
  padding: '0 48px',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  padding: '0 48px',
};

const alertBox = {
  backgroundColor: '#dcfce7',
  padding: '20px 48px',
  margin: '20px 0',
  borderLeft: '4px solid #16a34a',
};

const alertText = {
  color: '#15803d',
  fontSize: '18px',
  margin: '0',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
};

const buttonSection = {
  padding: '27px 48px',
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#16a34a',
  borderRadius: '5px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 30px',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  padding: '0 48px',
  marginTop: '20px',
};

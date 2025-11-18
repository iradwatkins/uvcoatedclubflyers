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
  Row,
  Column,
} from '@react-email/components';
import * as React from 'react';

interface OrderConfirmationEmailProps {
  orderNumber: string;
  customerName: string;
  items: Array<{
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    configuration?: any;
  }>;
  subtotal: number;
  tax: number;
  shippingCost: number;
  total: number;
  shippingAddress: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
  orderUrl: string;
}

export const OrderConfirmationEmail = ({
  orderNumber,
  customerName,
  items,
  subtotal,
  tax,
  shippingCost,
  total,
  shippingAddress,
  orderUrl,
}: OrderConfirmationEmailProps) => {
  const previewText = `Order confirmation for ${orderNumber}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Order Confirmation</Heading>

          <Text style={text}>Hi {customerName},</Text>

          <Text style={text}>
            Thank you for your order! We've received your order and will begin processing it
            shortly.
          </Text>

          <Section style={orderInfo}>
            <Text style={orderNumber_text}>
              Order Number: <strong>{orderNumber}</strong>
            </Text>
          </Section>

          <Hr style={hr} />

          <Heading style={h2}>Order Items</Heading>

          {items.map((item, index) => (
            <Section key={index} style={itemSection}>
              <Row>
                <Column>
                  <Text style={itemName}>{item.productName}</Text>
                  <Text style={itemDetails}>Quantity: {item.quantity.toLocaleString()}</Text>
                  {item.configuration && (
                    <Text style={itemDetails}>
                      {Object.entries(item.configuration).map(([key, value]) => (
                        <span key={key}>
                          {key}: {String(value)} |{' '}
                        </span>
                      ))}
                    </Text>
                  )}
                </Column>
                <Column align="right">
                  <Text style={itemPrice}>${(item.totalPrice / 100).toFixed(2)}</Text>
                </Column>
              </Row>
            </Section>
          ))}

          <Hr style={hr} />

          <Section style={totalsSection}>
            <Row>
              <Column>
                <Text style={totalLabel}>Subtotal:</Text>
              </Column>
              <Column align="right">
                <Text style={totalValue}>${(subtotal / 100).toFixed(2)}</Text>
              </Column>
            </Row>
            <Row>
              <Column>
                <Text style={totalLabel}>Shipping:</Text>
              </Column>
              <Column align="right">
                <Text style={totalValue}>${(shippingCost / 100).toFixed(2)}</Text>
              </Column>
            </Row>
            <Row>
              <Column>
                <Text style={totalLabel}>Tax:</Text>
              </Column>
              <Column align="right">
                <Text style={totalValue}>${(tax / 100).toFixed(2)}</Text>
              </Column>
            </Row>
            <Row>
              <Column>
                <Text style={grandTotalLabel}>Total:</Text>
              </Column>
              <Column align="right">
                <Text style={grandTotalValue}>${(total / 100).toFixed(2)}</Text>
              </Column>
            </Row>
          </Section>

          <Hr style={hr} />

          <Heading style={h2}>Shipping Address</Heading>
          <Text style={address}>
            {shippingAddress.address}
            <br />
            {shippingAddress.city}, {shippingAddress.state} {shippingAddress.zipCode}
          </Text>

          <Hr style={hr} />

          <Section style={buttonSection}>
            <Link href={orderUrl} style={button}>
              View Order Details
            </Link>
          </Section>

          <Text style={footer}>
            If you have any questions about your order, please contact us at
            support@uvcoatedflyers.com
          </Text>

          <Text style={footer}>
            © {new Date().getFullYear()} UV Coated Club Flyers. All rights reserved.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default OrderConfirmationEmail;

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

const orderInfo = {
  backgroundColor: '#f0f9ff',
  padding: '20px 48px',
  margin: '20px 0',
};

const orderNumber_text = {
  color: '#1e40af',
  fontSize: '18px',
  margin: '0',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
};

const itemSection = {
  padding: '10px 48px',
};

const itemName = {
  color: '#333',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 5px',
};

const itemDetails = {
  color: '#666',
  fontSize: '14px',
  margin: '0 0 5px',
};

const itemPrice = {
  color: '#333',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0',
};

const totalsSection = {
  padding: '0 48px',
};

const totalLabel = {
  color: '#666',
  fontSize: '14px',
  margin: '5px 0',
};

const totalValue = {
  color: '#333',
  fontSize: '14px',
  margin: '5px 0',
};

const grandTotalLabel = {
  color: '#333',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '10px 0',
};

const grandTotalValue = {
  color: '#1e40af',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '10px 0',
};

const address = {
  color: '#333',
  fontSize: '14px',
  lineHeight: '22px',
  padding: '0 48px',
};

const buttonSection = {
  padding: '27px 48px',
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#1e40af',
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

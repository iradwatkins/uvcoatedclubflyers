import pool from './lib/db';

async function checkOrderDetails() {
  console.log('\n📦 Order Details for Bill Blast:\n');

  // Get order
  const orderResult = await pool.query(`
    SELECT * FROM orders WHERE billing_email = 'appvillagellc@gmail.com' ORDER BY created_at DESC LIMIT 1
  `);

  if (orderResult.rows.length === 0) {
    console.log('No order found for appvillagellc@gmail.com');
    await pool.end();
    return;
  }

  const order = orderResult.rows[0];

  console.log('═══════════════════════════════════════════════════════');
  console.log('ORDER INFORMATION');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`Order Number: ${order.order_number}`);
  console.log(`Order ID: ${order.id}`);
  console.log(`Status: ${order.status}`);
  console.log(`Payment Status: ${order.payment_status}`);
  console.log('');

  console.log('CUSTOMER INFO');
  console.log(`Name: ${order.billing_first_name} ${order.billing_last_name}`);
  console.log(`Email: ${order.billing_email}`);
  console.log(`Phone: ${order.billing_phone}`);
  console.log('');

  console.log('BILLING ADDRESS');
  console.log(`${order.billing_address_1}`);
  if (order.billing_address_2) console.log(`${order.billing_address_2}`);
  console.log(`${order.billing_city}, ${order.billing_state} ${order.billing_postcode}`);
  console.log(`${order.billing_country}`);
  console.log('');

  console.log('SHIPPING ADDRESS');
  console.log(`${order.shipping_first_name} ${order.shipping_last_name}`);
  console.log(`${order.shipping_address_1}`);
  if (order.shipping_address_2) console.log(`${order.shipping_address_2}`);
  console.log(`${order.shipping_city}, ${order.shipping_state} ${order.shipping_postcode}`);
  console.log(`${order.shipping_country}`);
  console.log('');

  console.log('SHIPPING METHOD');
  console.log(`Carrier: ${order.shipping_carrier}`);
  console.log(`Service: ${order.shipping_service}`);
  console.log(`Rate: $${parseFloat(order.shipping_rate_amount || 0).toFixed(2)}`);
  console.log('');

  console.log('PRICING');
  console.log(`Subtotal: $${parseFloat(order.subtotal).toFixed(2)}`);
  console.log(`Tax: $${parseFloat(order.tax_amount).toFixed(2)}`);
  console.log(`Shipping: $${parseFloat(order.shipping_rate_amount || 0).toFixed(2)}`);
  console.log(`Total: $${parseFloat(order.total_amount).toFixed(2)}`);
  console.log('');

  // Get order items
  const itemsResult = await pool.query(`
    SELECT * FROM order_items WHERE order_id = $1
  `, [order.id]);

  console.log('ORDER ITEMS');
  console.log('─────────────────────────────────────────────────────');
  itemsResult.rows.forEach((item, index) => {
    console.log(`${index + 1}. ${item.product_name}`);
    console.log(`   Quantity: ${item.quantity}`);
    console.log(`   Unit Price: $${parseFloat(item.unit_price).toFixed(4)}`);
    console.log(`   Total: $${parseFloat(item.total_price).toFixed(2)}`);
    if (item.configuration) {
      const config = JSON.parse(item.configuration);
      console.log(`   Configuration:`);
      Object.entries(config).forEach(([key, value]) => {
        console.log(`     - ${key}: ${value}`);
      });
    }
    console.log('');
  });

  console.log('═══════════════════════════════════════════════════════');
  console.log('');
  console.log(`View in admin: http://localhost:3000/admin/orders/${order.id}`);
  console.log(`Production board: http://localhost:3000/admin/production`);
  console.log('');

  await pool.end();
}

checkOrderDetails().catch(console.error);

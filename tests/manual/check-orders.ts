import pool from './lib/db';

async function checkOrders() {
  console.log('\n📋 Recent Orders in Database:\n');

  const result = await pool.query(`
    SELECT
      id,
      order_number,
      billing_first_name || ' ' || billing_last_name as customer_name,
      billing_email,
      status,
      payment_status,
      total_amount,
      shipping_carrier,
      shipping_service,
      created_at
    FROM orders
    ORDER BY created_at DESC
    LIMIT 5
  `);

  if (result.rows.length === 0) {
    console.log('No orders found in database.');
    return;
  }

  result.rows.forEach((order, index) => {
    console.log(`${index + 1}. Order #${order.order_number}`);
    console.log(`   Customer: ${order.customer_name} (${order.billing_email})`);
    console.log(`   Status: ${order.status} | Payment: ${order.payment_status}`);
    console.log(`   Total: $${parseFloat(order.total_amount).toFixed(2)}`);
    console.log(`   Shipping: ${order.shipping_carrier} ${order.shipping_service || ''}`);
    console.log(`   Created: ${new Date(order.created_at).toLocaleString()}`);
    console.log('');
  });

  console.log(`✅ Found ${result.rows.length} orders total\n`);

  await pool.end();
}

checkOrders().catch(console.error);

/**
 * CREATE REAL ORDERS NOW
 * Customer: Bill Blast (appvillagellc@gmail.com)
 * Creates 2 orders using existing prisma.order.create method
 */

import { prisma } from './lib/prisma';

async function createFedExOrder() {
  console.log('\n📦 Creating FedEx Ground Order...\n');

  const orderNumber = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(10000 + Math.random() * 90000)}`;

  const orderData = {
    data: {
      orderNumber,
      userId: null,
      status: 'pending',
      subtotal: 3500.00,
      taxAmount: 0.00,
      totalAmount: 3545.00,
      transactionId: `TEST-FEDEX-${Date.now()}`,
      paymentMethod: 'square',
      paymentStatus: 'paid',

      billingInfo: {
        firstName: 'Bill',
        lastName: 'Blast',
        email: 'appvillagellc@gmail.com',
        phone: '(555) 123-4567',
        address: '976 Carr Street',
        address2: '',
        city: 'Atlanta',
        state: 'GA',
        zipCode: '30318',
        country: 'US',
      },

      shippingAddress: {
        firstName: 'Bill',
        lastName: 'Blast',
        fullName: 'Bill Blast',
        address: '976 Carr Street',
        street: '976 Carr Street',
        address2: '',
        city: 'Atlanta',
        state: 'GA',
        zipCode: '30318',
        zip: '30318',
        country: 'US',
      },

      shippingCarrier: 'FEDEX',
      shippingService: 'FEDEX_GROUND',
      shippingRateAmount: 45.00,
      pickupAirportId: null,

      customerNotes: 'Test order: 5,000 UV coated flyers, 4x6, 9pt cardstock, UV both sides. Weight: 40 lbs (2 boxes).',
      internalNotes: 'E2E Test Order - FedEx Ground - Created via test script',

      orderItems: {
        create: [
          {
            productId: 1,
            productName: 'UV Coated Club Flyers',
            quantity: 5000,
            unitPrice: 0.70,
            totalPrice: 3500.00,
            configuration: {
              size: '4x6',
              paperStock: '9pt C2S Cardstock',
              coating: 'UV Both Sides',
              turnaround: '2-4 Days Standard',
              weight: '40 lbs',
              boxes: 2,
              frontFile: 'flyer-front.png',
              backFile: 'flyer-back.png',
            },
          },
        ],
      },
    },
  };

  try {
    const order = await prisma.order.create(orderData);

    console.log('✅ FedEx Ground Order Created!');
    console.log(`   Order Number: ${orderNumber}`);
    console.log(`   Order ID: ${order.id}`);
    console.log(`   Customer: Bill Blast`);
    console.log(`   Email: appvillagellc@gmail.com`);
    console.log(`   Shipping: FedEx Ground to 976 Carr Street, Atlanta, GA 30318`);
    console.log(`   Product: 5,000 flyers, 4×6, 9pt C2S Cardstock, UV Both Sides`);
    console.log(`   Weight: 40 lbs (2 boxes)`);
    console.log(`   Total: $3,545.00 ($3,500 product + $45 shipping)`);
    console.log(`   Status: pending`);
    console.log(`   Payment: paid`);
    console.log('');

    return orderNumber;
  } catch (error) {
    console.error('❌ Error creating FedEx order:', error);
    throw error;
  }
}

async function createSouthwestCargoOrder() {
  console.log('✈️  Creating Southwest Cargo Airport Pickup Order...\n');

  // Get ATL airport ID
  const pool = require('./lib/db').default;
  const airportResult = await pool.query('SELECT id FROM airports WHERE code = $1 LIMIT 1', ['ATL']);
  const airportId = airportResult.rows[0]?.id;

  if (!airportId) {
    console.error('❌ ATL airport not found in database');
    console.log('   Make sure airports are seeded in the database');
    return null;
  }

  const orderNumber = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(10000 + Math.random() * 90000)}`;

  const orderData = {
    data: {
      orderNumber,
      userId: null,
      status: 'pending',
      subtotal: 3500.00,
      taxAmount: 0.00,
      totalAmount: 3538.00,
      transactionId: `TEST-SOUTHWEST-${Date.now()}`,
      paymentMethod: 'square',
      paymentStatus: 'paid',

      billingInfo: {
        firstName: 'Bill',
        lastName: 'Blast',
        email: 'appvillagellc@gmail.com',
        phone: '(555) 987-6543',
        address: '123 Peachtree St',
        address2: '',
        city: 'Atlanta',
        state: 'GA',
        zipCode: '30303',
        country: 'US',
      },

      shippingAddress: {
        firstName: 'Bill',
        lastName: 'Blast',
        fullName: 'Bill Blast',
        address: 'Hartsfield-Jackson Atlanta International Airport',
        street: 'Hartsfield-Jackson Atlanta International Airport',
        address2: 'Southwest Cargo',
        city: 'Atlanta',
        state: 'GA',
        zipCode: '30320',
        zip: '30320',
        country: 'US',
      },

      shippingCarrier: 'SOUTHWEST_CARGO',
      shippingService: 'AIRPORT_PICKUP',
      shippingRateAmount: 38.00,
      pickupAirportId: airportId,

      customerNotes: 'Test order: 5,000 UV coated flyers, 4x6, 9pt cardstock, UV both sides. Weight: 40 lbs (2 boxes). Pickup at ATL airport.',
      internalNotes: 'E2E Test Order - Southwest Cargo Airport Pickup - Created via test script',

      orderItems: {
        create: [
          {
            productId: 1,
            productName: 'UV Coated Club Flyers',
            quantity: 5000,
            unitPrice: 0.70,
            totalPrice: 3500.00,
            configuration: {
              size: '4x6',
              paperStock: '9pt C2S Cardstock',
              coating: 'UV Both Sides',
              turnaround: '2-4 Days Standard',
              weight: '40 lbs',
              boxes: 2,
              frontFile: 'flyer-front.png',
              backFile: 'flyer-back.png',
            },
          },
        ],
      },
    },
  };

  try {
    const order = await prisma.order.create(orderData);

    console.log('✅ Southwest Cargo Order Created!');
    console.log(`   Order Number: ${orderNumber}`);
    console.log(`   Order ID: ${order.id}`);
    console.log(`   Customer: Bill Blast`);
    console.log(`   Email: appvillagellc@gmail.com`);
    console.log(`   Pickup: Hartsfield-Jackson Atlanta International (ATL)`);
    console.log(`   Airport ID: ${airportId}`);
    console.log(`   Product: 5,000 flyers, 4×6, 9pt C2S Cardstock, UV Both Sides`);
    console.log(`   Weight: 40 lbs (2 boxes)`);
    console.log(`   Total: $3,538.00 ($3,500 product + $38 shipping)`);
    console.log(`   Status: pending`);
    console.log(`   Payment: paid`);
    console.log('');

    return orderNumber;
  } catch (error) {
    console.error('❌ Error creating Southwest Cargo order:', error);
    throw error;
  }
}

async function main() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('🚀 Creating Test Orders for Bill Blast');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log('Customer Information:');
  console.log('  Name: Bill Blast');
  console.log('  Email: appvillagellc@gmail.com');
  console.log('  Product: 5,000 UV Coated Club Flyers');
  console.log('  Size: 4×6 inches');
  console.log('  Paper: 9pt C2S Cardstock');
  console.log('  Coating: UV Both Sides');
  console.log('  Weight: 40 lbs (2 boxes)');
  console.log('  Formula: 0.000333333333 × 24 × 5000 = 40 lbs');
  console.log('');

  try {
    const fedexOrderNumber = await createFedExOrder();
    const southwestOrderNumber = await createSouthwestCargoOrder();

    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ SUCCESS! Both Orders Created');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('📊 Order Summary:');
    console.log(`   FedEx Ground: ${fedexOrderNumber}`);
    console.log(`   Southwest Cargo: ${southwestOrderNumber || 'Failed - check airport seeding'}`);
    console.log('');

    console.log('🔍 View Orders:');
    console.log('   Admin Panel: http://localhost:3000/admin/orders');
    console.log('   Production Board: http://localhost:3000/admin/production');
    console.log('');

    console.log('🔎 Search Filters:');
    console.log('   Search by email: appvillagellc@gmail.com');
    console.log('   Search by name: Bill Blast');
    console.log(`   Search by order: ${fedexOrderNumber}`);
    console.log('');

    console.log('✨ Orders are marked as:');
    console.log('   Status: pending (ready for production)');
    console.log('   Payment: paid (payment complete)');
    console.log('   Carrier: FEDEX / SOUTHWEST_CARGO');
    console.log('');

  } catch (error: any) {
    console.error('\n❌ Failed to create orders:', error.message);
    console.error('\nCheck that:');
    console.error('  1. Dev server is running (npm run dev)');
    console.error('  2. Database is connected');
    console.error('  3. Airports table is seeded (for Southwest Cargo)');
    console.error('');
    process.exit(1);
  }

  process.exit(0);
}

main();

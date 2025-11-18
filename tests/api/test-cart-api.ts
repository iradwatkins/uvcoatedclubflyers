async function testCartAPI() {
  try {
    const response = await fetch('http://localhost:3000/api/cart/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        productId: '1',
        productName: 'Flyer Pricing',
        quantity: 5000,
        options: {},
        price: 877000,
        unitPrice: 175
      })
    });

    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
    console.log('Headers:', Object.fromEntries(response.headers.entries()));

    if (data.success) {
      console.log('\n✅ Cart API is working!');
      console.log('Cart items:', data.cart.items.length);
      console.log('Cart total:', data.cart.total);
    } else {
      console.log('\n❌ Cart API failed');
      console.log('Error:', data.error);
    }
  } catch (error) {
    console.error('❌ Error testing cart API:', error);
  }
}

testCartAPI();

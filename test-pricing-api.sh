#!/bin/bash

echo "Testing Pricing API..."
echo "====================="
echo ""

echo "Test 1: Basic 4×6 Postcard - 500 qty, 12pt C2S, Matte Aqueous, Economy"
echo "----------------------------------------------------------------------"
curl -X POST http://localhost:3000/api/products/calculate-price \
  -H "Content-Type: application/json" \
  -d '{
    "productId": 1,
    "paperStockId": 5,
    "coatingId": 3,
    "turnaroundId": 6,
    "quantity": 500,
    "width": 4.0,
    "height": 6.0,
    "sides": "double",
    "addOns": []
  }' 2>&1 | jq '.'

echo ""
echo ""
echo "Test 2: With Perforation add-on - 1000 qty"
echo "-------------------------------------------"
curl -X POST http://localhost:3000/api/products/calculate-price \
  -H "Content-Type: application/json" \
  -d '{
    "productId": 1,
    "paperStockId": 5,
    "coatingId": 3,
    "turnaroundId": 6,
    "quantity": 1000,
    "width": 4.0,
    "height": 6.0,
    "sides": "double",
    "addOns": [
      {
        "addOnId": 7,
        "subOptions": {
          "vertical_count": 1,
          "vertical_position": "3.5\"",
          "horizontal_count": 0,
          "horizontal_position": ""
        }
      }
    ]
  }' 2>&1 | jq '.'

echo ""
echo ""
echo "Test 3: Get pricing options for product 1"
echo "-----------------------------------------"
curl -X GET http://localhost:3000/api/products/1/pricing-options 2>&1 | jq '.success, .data.product.name, (.data.paperStocks | length), (.data.turnarounds | length), (.data.addOns | length)'

echo ""
echo "Done!"

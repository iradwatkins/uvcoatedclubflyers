'use client';

import { useState, useEffect } from 'react';

interface PriceBreakdown {
  baseCost: number;
  pricePerSqIn: number;
  squareInches: number;
  sidesMultiplier: number;
  turnaroundMultiplier: number;
  markupMultiplier: number;
  markupAmount: number;
  subtotal: number;
  addOnsCost: number;
  discountAmount: number;
  totalBeforeDiscount: number;
  totalPrice: number;
  unitPrice: number;
  paperStock: string;
  coating: string;
  turnaround: string;
  quantity: number;
  size: string;
}

export default function PricingTestPage() {
  const [paperStockId, setPaperStockId] = useState(1); // 9pt C2S
  const [coatingId, setCoatingId] = useState(2); // Gloss Aqueous
  const [turnaroundId, setTurnaroundId] = useState(6); // 2-4 Days
  const [quantity, setQuantity] = useState(5000);
  const [width, setWidth] = useState(4);
  const [height, setHeight] = useState(6);
  const [sides, setSides] = useState<'single' | 'double'>('double');
  const [loading, setLoading] = useState(false);
  const [priceBreakdown, setPriceBreakdown] = useState<PriceBreakdown | null>(null);
  const [error, setError] = useState<string | null>(null);

  const calculatePrice = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/products/calculate-price', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: 1,
          paperStockId,
          coatingId,
          turnaroundId,
          quantity,
          width,
          height,
          sides,
          addOns: [],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to calculate price');
      }

      const result = await response.json();

      // Handle both formats: direct data or nested in data property
      const data = result.data || result;
      setPriceBreakdown(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Calculate price on mount and when values change
  useEffect(() => {
    calculatePrice();
  }, [paperStockId, coatingId, turnaroundId, quantity, width, height, sides]);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Pricing Calculator Test</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Configuration Panel */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-6">Configuration</h2>

            {/* Paper Stock */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Paper Stock</label>
              <select
                value={paperStockId}
                onChange={(e) => setPaperStockId(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={1}>9pt C2S Cardstock</option>
                <option value={2}>16pt C2S Cardstock</option>
                <option value={3}>60 lb Offset</option>
                <option value={4}>100 lb Gloss Text</option>
                <option value={5}>12pt C2S Cardstock (Special Markup)</option>
                <option value={6}>100 lb Uncoated Cover</option>
                <option value={7}>14pt C2S Cardstock (Special Markup)</option>
              </select>
            </div>

            {/* Coating */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Coating</label>
              <select
                value={coatingId}
                onChange={(e) => setCoatingId(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={1}>No Coating</option>
                <option value={2}>Gloss Aqueous</option>
                <option value={3}>Matte Aqueous</option>
                <option value={4}>High Gloss UV (One Side)</option>
                <option value={5}>High Gloss UV (Both Sides)</option>
              </select>
            </div>

            {/* Turnaround */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Turnaround Time
              </label>
              <select
                value={turnaroundId}
                onChange={(e) => setTurnaroundId(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={1}>Same Day (Crazy Fast)</option>
                <option value={2}>Next Day (Faster)</option>
                <option value={3}>Next Day Guaranteed (Faster)</option>
                <option value={4}>1-2 Days (Fast)</option>
                <option value={5}>2-3 Days (Fast)</option>
                <option value={6}>2-4 Days Standard (Economy)</option>
                <option value={7}>3-4 Days (Economy)</option>
                <option value={8}>5-7 Days (Economy)</option>
              </select>
            </div>

            {/* Quantity */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
              <select
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={250}>250</option>
                <option value={500}>500</option>
                <option value={1000}>1,000</option>
                <option value={2500}>2,500</option>
                <option value={5000}>5,000</option>
                <option value={10000}>10,000 (Test &gt; 5000)</option>
                <option value={15000}>15,000 (Test &gt; 5000)</option>
              </select>
            </div>

            {/* Size */}
            <div className="mb-4 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Width (inches)
                </label>
                <input
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(Number(e.target.value))}
                  min="1"
                  max="48"
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Height (inches)
                </label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  min="1"
                  max="48"
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Sides */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Printing Sides</label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="single"
                    checked={sides === 'single'}
                    onChange={(e) => setSides(e.target.value as 'single' | 'double')}
                    className="mr-2"
                  />
                  Single Side (4/0)
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="double"
                    checked={sides === 'double'}
                    onChange={(e) => setSides(e.target.value as 'single' | 'double')}
                    className="mr-2"
                  />
                  Both Sides (4/4)
                </label>
              </div>
            </div>

            <button
              onClick={calculatePrice}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-md font-semibold hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Calculating...' : 'Recalculate'}
            </button>
          </div>

          {/* Results Panel */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-6">Price Breakdown</h2>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            {loading && <div className="text-center py-8 text-gray-500">Calculating price...</div>}

            {priceBreakdown && !loading && (
              <div className="space-y-4">
                {/* Total Price - Highlighted */}
                <div className="bg-blue-50 border-2 border-blue-500 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Total Price</div>
                  <div className="text-4xl font-bold text-blue-600">
                    ${priceBreakdown.totalPrice.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600 mt-2">
                    ${priceBreakdown.unitPrice.toFixed(4)} per piece
                  </div>
                </div>

                {/* Configuration Summary */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Configuration</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Paper Stock:</span>
                      <span className="font-medium">{priceBreakdown.paperStock}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Coating:</span>
                      <span className="font-medium">{priceBreakdown.coating}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Size:</span>
                      <span className="font-medium">
                        {priceBreakdown.size} ({priceBreakdown.squareInches} sq in)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Quantity:</span>
                      <span className="font-medium">
                        {priceBreakdown.quantity.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Turnaround:</span>
                      <span className="font-medium">{priceBreakdown.turnaround}</span>
                    </div>
                  </div>
                </div>

                {/* Calculation Details */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Calculation Details</h3>
                  <div className="space-y-1 text-sm font-mono">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Price/sq in:</span>
                      <span>${priceBreakdown.pricePerSqIn.toFixed(10)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sides multiplier:</span>
                      <span>{priceBreakdown.sidesMultiplier.toFixed(2)}x</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Turnaround multiplier:</span>
                      <span>{priceBreakdown.turnaroundMultiplier.toFixed(2)}x</span>
                    </div>
                    <div className="flex justify-between font-semibold text-gray-900 pt-2 border-t">
                      <span>Base Cost:</span>
                      <span>${priceBreakdown.baseCost.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Markup Details */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Markup</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Markup multiplier:</span>
                      <span className="font-medium">
                        {priceBreakdown.markupMultiplier.toFixed(3)}x
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Markup amount:</span>
                      <span className="font-medium">${priceBreakdown.markupAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-gray-900 pt-2 border-t">
                      <span>Subtotal:</span>
                      <span>${priceBreakdown.subtotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Formula */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Formula</h3>
                  <div className="bg-gray-50 p-3 rounded text-xs font-mono">
                    <div className="mb-2">
                      baseCost = ${priceBreakdown.pricePerSqIn.toFixed(4)} ×{' '}
                      {priceBreakdown.sidesMultiplier} × {priceBreakdown.turnaroundMultiplier} ×{' '}
                      {priceBreakdown.squareInches} × {priceBreakdown.quantity.toLocaleString()}
                    </div>
                    <div className="mb-2">baseCost = ${priceBreakdown.baseCost.toFixed(2)}</div>
                    <div className="mb-2">
                      retailPrice = ${priceBreakdown.baseCost.toFixed(2)} ×{' '}
                      {priceBreakdown.markupMultiplier} = ${priceBreakdown.totalPrice.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

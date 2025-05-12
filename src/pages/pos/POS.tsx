import React, { useState } from 'react';
import { ShoppingCart, Search, Tag, Plus, Minus, X, CreditCard, Banknote, DollarSign } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { useCartStore } from '../../stores/cartStore';
import { formatCurrency } from '../../lib/utils';
import Button from '../../components/ui/button';
import Input from '../../components/ui/input';
import { Card, CardContent } from '../../components/ui/card';

// This would be fetched from API in a real implementation
const mockProducts = [
  { id: '1', name: 'Milk', price: 2.99, image_url: null, barcode: '123456', sku: 'MIL001', current_stock: 24, store_id: 'store1' },
  { id: '2', name: 'Bread', price: 1.99, image_url: null, barcode: '234567', sku: 'BRD001', current_stock: 15, store_id: 'store1' },
  { id: '3', name: 'Eggs', price: 3.49, image_url: null, barcode: '345678', sku: 'EGG001', current_stock: 30, store_id: 'store1' },
  { id: '4', name: 'Cheese', price: 4.99, image_url: null, barcode: '456789', sku: 'CHS001', current_stock: 12, store_id: 'store1' },
  { id: '5', name: 'Water Bottle', price: 1.49, image_url: null, barcode: '567890', sku: 'WAT001', current_stock: 48, store_id: 'store1' },
];

const POS: React.FC = () => {
  const { currentStore } = useStore();
  const cartStore = useCartStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [cashAmount, setCashAmount] = useState('');
  const currency = currentStore?.currency || 'USD';

  // Filter products based on search term
  const filteredProducts = mockProducts.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.barcode.includes(searchTerm) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Initialize cart with store settings when store changes
  React.useEffect(() => {
    if (currentStore) {
      cartStore.setStoreId(currentStore.id);
      cartStore.setTaxRate(currentStore.tax_rate / 100); // Convert percentage to decimal
    }
  }, [currentStore]);

  const handleAddToCart = (product: any) => {
    cartStore.addItem(product);
  };

  const handleUpdateQuantity = (productId: string, newQty: number) => {
    cartStore.updateItemQuantity(productId, newQty);
  };

  const handleRemoveItem = (productId: string) => {
    cartStore.removeItem(productId);
  };

  const handleCheckout = () => {
    setShowPaymentModal(true);
  };

  const handlePayment = (method: 'cash' | 'card') => {
    // In a real app, this would process the payment and update inventory
    console.log(`Processing ${method} payment for ${cartStore.total()} ${currency}`);
    
    // Clear cart after successful payment
    cartStore.clearCart();
    setShowPaymentModal(false);
    
    // Reset cash amount input
    setCashAmount('');
  };

  const calculateChange = () => {
    const cashValue = parseFloat(cashAmount);
    if (isNaN(cashValue)) return 0;
    return Math.max(0, cashValue - cartStore.total());
  };

  return (
    <div className="h-full">
      <div className="flex flex-col md:flex-row h-full gap-6">
        {/* Product search and listing */}
        <div className="w-full md:w-3/5 flex flex-col">
          <div className="mb-4">
            <Input
              placeholder="Search products by name, barcode, or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="h-5 w-5 text-gray-400" />}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 overflow-auto">
            {filteredProducts.map((product) => (
              <Card 
                key={product.id} 
                variant="bordered" 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleAddToCart(product)}
              >
                <CardContent className="p-3 flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                    <Tag className="h-8 w-8 text-gray-500" />
                  </div>
                  <h3 className="font-medium text-gray-900 text-sm">{product.name}</h3>
                  <p className="text-gray-700 font-bold mt-1">
                    {formatCurrency(product.price, currency)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Stock: {product.current_stock}
                  </p>
                </CardContent>
              </Card>
            ))}
            
            {filteredProducts.length === 0 && (
              <div className="col-span-full text-center py-8 text-gray-500">
                No products found. Try a different search term.
              </div>
            )}
          </div>
        </div>

        {/* Cart */}
        <div className="w-full md:w-2/5 flex flex-col bg-white rounded-lg shadow-md">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <ShoppingCart className="mr-2 h-5 w-5" />
                Cart
              </h2>
              <span className="text-sm text-gray-600">
                {cartStore.itemCount()} items
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-4">
            {cartStore.items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-500">
                <ShoppingCart className="h-12 w-12 mb-2" />
                <p>Your cart is empty</p>
                <p className="text-sm">Search for products to add them to your cart</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {cartStore.items.map((item) => (
                  <li key={item.product.id} className="py-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900">{item.product.name}</h3>
                        <p className="text-sm text-gray-600">
                          {formatCurrency(item.product.price, currency)} each
                        </p>
                      </div>
                      <div className="flex items-center ml-4">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleUpdateQuantity(item.product.id, item.quantity - 1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="mx-2 w-8 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleUpdateQuantity(item.product.id, item.quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveItem(item.product.id)}
                          className="ml-2 text-gray-400 hover:text-error-500"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-1 text-sm font-medium text-right">
                      {formatCurrency(item.subtotal, currency)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="p-4 border-t border-gray-200">
            <div className="space-y-1 mb-4">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatCurrency(cartStore.subtotal(), currency)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax ({(cartStore.taxRate * 100).toFixed(2)}%)</span>
                <span>{formatCurrency(cartStore.taxAmount(), currency)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total</span>
                <span>{formatCurrency(cartStore.total(), currency)}</span>
              </div>
            </div>

            <Button
              className="w-full"
              disabled={cartStore.items.length === 0}
              onClick={handleCheckout}
            >
              Checkout
            </Button>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full animate-fade-in">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Payment</h2>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="flex justify-between font-semibold">
                    <span>Total Amount:</span>
                    <span>{formatCurrency(cartStore.total(), currency)}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Cash Payment</h3>
                    <div className="flex space-x-2">
                      <Input
                        type="number"
                        placeholder="Enter amount"
                        value={cashAmount}
                        onChange={(e) => setCashAmount(e.target.value)}
                        leftIcon={<DollarSign className="h-5 w-5 text-gray-400" />}
                      />
                      <Button
                        onClick={() => handlePayment('cash')}
                        disabled={!cashAmount || parseFloat(cashAmount) < cartStore.total()}
                        leftIcon={<Banknote className="h-5 w-5" />}
                      >
                        Pay
                      </Button>
                    </div>
                    {cashAmount && (
                      <div className="mt-2 text-sm">
                        Change: {formatCurrency(calculateChange(), currency)}
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">Card Payment</h3>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => handlePayment('card')}
                      leftIcon={<CreditCard className="h-5 w-5" />}
                    >
                      Pay with Card
                    </Button>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <Button
                  variant="ghost"
                  onClick={() => setShowPaymentModal(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;
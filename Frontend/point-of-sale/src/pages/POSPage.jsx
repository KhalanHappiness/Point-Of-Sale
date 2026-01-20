/* ============================================================
   POS (POINT OF SALE) PAGE - WITH CONFIRMATION DIALOGS
   Main cashier interface for processing sales
   ============================================================ */
import React, { useState, useEffect } from 'react';
import { Search, ShoppingCart, Plus, Minus, Trash2, DollarSign, CreditCard, Smartphone, X } from 'lucide-react';
import api from '../services/apiService';

const POSPage = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Confirmation dialog states
  const [showAddConfirm, setShowAddConfirm] = useState(false);
  const [showCheckoutConfirm, setShowCheckoutConfirm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await api.getProducts();
      setProducts(data.products);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.trim()) {
      try {
        const data = await api.searchProducts(query);
        setProducts(data.products);
      } catch (error) {
        console.error('Search failed:', error);
      }
    } else {
      loadProducts();
    }
  };

  // Show confirmation dialog when clicking a product
  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setShowAddConfirm(true);
  };

  // Confirm adding to cart
  const confirmAddToCart = () => {
    if (!selectedProduct) return;
    
    const existing = cart.find(item => item.product_id === selectedProduct.id);
    if (existing) {
      setCart(cart.map(item => 
        item.product_id === selectedProduct.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        product_id: selectedProduct.id,
        name: selectedProduct.name,
        price: selectedProduct.price,
        quantity: 1,
        available: selectedProduct.inventory?.quantity || 0
      }]);
    }
    
    setShowAddConfirm(false);
    setSelectedProduct(null);
  };

  // Cancel adding to cart
  const cancelAddToCart = () => {
    setShowAddConfirm(false);
    setSelectedProduct(null);
  };

  const updateQuantity = (productId, change) => {
    setCart(cart.map(item => {
      if (item.product_id === productId) {
        const newQty = Math.max(0, item.quantity + change);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.product_id !== productId));
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Show checkout confirmation
  const handleCheckoutClick = () => {
    if (cart.length === 0) return;
    setShowCheckoutConfirm(true);
  };

  // Confirm checkout
  const confirmCheckout = async () => {
    setLoading(true);
    setShowCheckoutConfirm(false);
    
    try {
      const items = cart.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity
      }));

      await api.createSale({ items, payment_method: paymentMethod });
      setCart([]);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      loadProducts();
    } catch (error) {
      alert(`Checkout failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Cancel checkout
  const cancelCheckout = () => {
    setShowCheckoutConfirm(false);
  };

  return (
    <div className="flex h-full gap-4">
      {/* Add to Cart Confirmation Dialog */}
      {showAddConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-gray-800">Add to Cart?</h3>
              <button onClick={cancelAddToCart} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {selectedProduct && (
              <div className="mb-6">
                <p className="text-gray-600 mb-2">Do you want to add this item to cart?</p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-semibold text-lg">{selectedProduct.name}</p>
                  <p className="text-sm text-gray-500">{selectedProduct.sku}</p>
                  <p className="text-xl font-bold text-blue-600 mt-2">${selectedProduct.price.toFixed(2)}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Available: {selectedProduct.inventory?.quantity || 0} units
                  </p>
                </div>
              </div>
            )}
            
            <div className="flex gap-3">
              <button
                onClick={cancelAddToCart}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmAddToCart}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Confirmation Dialog */}
      {showCheckoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-gray-800">Complete Sale?</h3>
              <button onClick={cancelCheckout} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-4">Confirm sale details:</p>
              
              <div className="bg-gray-50 p-4 rounded-lg space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Items:</span>
                  <span className="font-semibold">{cart.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Method:</span>
                  <span className="font-semibold capitalize">{paymentMethod}</span>
                </div>
                <div className="border-t pt-2 mt-2 flex justify-between">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-xl font-bold text-blue-600">${total.toFixed(2)}</span>
                </div>
              </div>

              <div className="max-h-40 overflow-y-auto border rounded p-2">
                {cart.map(item => (
                  <div key={item.product_id} className="flex justify-between text-sm py-1">
                    <span>{item.name} x{item.quantity}</span>
                    <span className="font-semibold">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={cancelCheckout}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmCheckout}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
              >
                Confirm Sale
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Products Section */}
      <div className="flex-1 flex flex-col">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search products by name, SKU, or barcode..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 overflow-y-auto flex-1">
          {products.map(product => (
            <div
              key={product.id}
              onClick={() => handleProductClick(product)}
              className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-lg transition-shadow"
            >
              <h3 className="font-semibold text-gray-800 mb-1 truncate">{product.name}</h3>
              <p className="text-sm text-gray-500 mb-2">{product.sku}</p>
              <p className="text-lg font-bold text-blue-600">${product.price.toFixed(2)}</p>
              <p className="text-xs text-gray-500 mt-1">
                Stock: {product.inventory?.quantity || 0}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Cart Section */}
      <div className="w-96 bg-white rounded-lg shadow-lg p-6 flex flex-col">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <ShoppingCart className="w-6 h-6" />
          Cart
        </h2>

        <div className="flex-1 overflow-y-auto mb-4">
          {cart.length === 0 ? (
            <p className="text-gray-400 text-center mt-8">Cart is empty</p>
          ) : (
            cart.map(item => (
              <div key={item.product_id} className="flex items-center justify-between mb-3 pb-3 border-b">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{item.name}</h4>
                  <p className="text-sm text-gray-600">${item.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.product_id, -1)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-semibold">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.product_id, 1)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => removeFromCart(item.product_id)}
                    className="p-1 hover:bg-red-100 text-red-600 rounded ml-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded mb-4">
            Sale completed successfully!
          </div>
        )}

        <div className="space-y-4">
          <div className="flex justify-between text-xl font-bold border-t pt-4">
            <span>Total:</span>
            <span>${total.toFixed(2)}</span>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Payment Method</label>
            <div className="grid grid-cols-3 gap-2">
              {['cash', 'card', 'mobile'].map(method => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`py-2 rounded-lg border-2 transition-colors ${
                    paymentMethod === method
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {method === 'cash' && <DollarSign className="w-5 h-5 mx-auto" />}
                  {method === 'card' && <CreditCard className="w-5 h-5 mx-auto" />}
                  {method === 'mobile' && <Smartphone className="w-5 h-5 mx-auto" />}
                  <span className="text-xs capitalize mt-1 block">{method}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleCheckoutClick}
            disabled={cart.length === 0 || loading}
            className="w-full bg-blue-600 text-white py-4 rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : 'Complete Sale'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default POSPage;
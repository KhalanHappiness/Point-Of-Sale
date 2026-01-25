/* ============================================================
   POS (POINT OF SALE) PAGE - RESPONSIVE
   Main cashier interface with flexible pricing
   ============================================================ */

import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  DollarSign,
  CreditCard,
  Smartphone,
  X,
  AlertCircle,
  Edit2,
} from 'lucide-react';
import api from '../services/apiService';

const POSPage = () => {
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [showAddConfirm, setShowAddConfirm] = useState(false);
  const [showCheckoutConfirm, setShowCheckoutConfirm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  const [editingPrice, setEditingPrice] = useState(null);
  const [customPrice, setCustomPrice] = useState('');

  const formatCurrency = (amount) => {
    return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const hasStockIssues = () => {
    return cart.some(item => {
      const qty = parseInt(item.quantity, 10) || 0;
      return qty > item.available;
    });
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await api.getProducts();
      setProducts(data.products);
      setAllProducts(data.products);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setProducts(allProducts);
      return;
    }

    const searchLower = query.toLowerCase();
    const filtered = allProducts.filter(product => {
      return (
        product.name?.toLowerCase().includes(searchLower) ||
        product.sku?.toLowerCase().includes(searchLower) ||
        product.barcode?.toLowerCase().includes(searchLower)
      );
    });
    
    setProducts(filtered);
  };

  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setShowAddConfirm(true);
  };

  const confirmAddToCart = () => {
    if (!selectedProduct) return;

    const existing = cart.find(item => item.product_id === selectedProduct.id);

    if (existing) {
      setCart(cart.map(item =>
        item.product_id === selectedProduct.id
          ? { ...item, quantity: parseInt(item.quantity, 10) + 1 }
          : item
      ));
    } else {
      const defaultPrice = selectedProduct.max_price || selectedProduct.price || 0;
      
      setCart([
        ...cart,
        {
          product_id: selectedProduct.id,
          name: selectedProduct.name,
          price: defaultPrice,
          min_price: selectedProduct.min_price || 0,
          max_price: selectedProduct.max_price || defaultPrice,
          quantity: 1,
          available: selectedProduct.stock || 0,
        },
      ]);
    }

    setShowAddConfirm(false);
    setSelectedProduct(null);
  };

  const updateQuantity = (productId, change) => {
    setCart(
      cart.map(item => {
        if (item.product_id !== productId) return item;
        const currentQty = parseInt(item.quantity, 10) || 0;
        const newQty = currentQty + change;
        return { ...item, quantity: Math.max(1, newQty) };
      })
    );
  };

  const handlePriceEdit = (item) => {
    setEditingPrice(item.product_id);
    setCustomPrice(item.price.toString());
  };

  const confirmPriceChange = (productId) => {
    const newPrice = parseFloat(customPrice);
    const item = cart.find(i => i.product_id === productId);

    if (isNaN(newPrice)) {
      alert('Please enter a valid price');
      return;
    }

    if (newPrice < item.min_price || newPrice > item.max_price) {
      alert(`Price must be between Ksh. ${formatCurrency(item.min_price)} and Ksh. ${formatCurrency(item.max_price)}`);
      return;
    }

    setCart(cart.map(cartItem =>
      cartItem.product_id === productId
        ? { ...cartItem, price: newPrice }
        : cartItem
    ));

    setEditingPrice(null);
    setCustomPrice('');
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.product_id !== productId));
  };

  const total = cart.reduce(
    (sum, item) => sum + item.price * (parseInt(item.quantity, 10) || 0),
    0
  );

  const handleCheckoutClick = () => {
    if (!cart.length || hasStockIssues()) return;
    setShowCheckoutConfirm(true);
  };

  const confirmCheckout = async () => {
    setLoading(true);
    setShowCheckoutConfirm(false);
    
    try {
      const items = cart.map(item => ({
        product_id: item.product_id,
        quantity: parseInt(item.quantity, 10) || 1,
        price: item.price,
      }));

      await api.createSale({
        items,
        payment_method: paymentMethod,
      });

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

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 md:gap-6 p-3 sm:p-4 md:p-6">
      {/* ================= PRODUCTS ================= */}
      <div className="lg:col-span-2 order-2 lg:order-1">
        <div className="mb-3 md:mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-10 sm:pr-12 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm sm:text-base"
              placeholder="Search products by name, SKU, or barcode..."
            />
            {searchQuery && (
              <button
                onClick={() => handleSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                type="button"
              >
                <X size={16} className="sm:w-5 sm:h-5" />
              </button>
            )}
          </div>
          <div className="mt-2 text-xs sm:text-sm text-gray-600">
            Showing {products.length} of {allProducts.length} products
            {searchQuery && <span className="text-blue-600 font-medium"> - Searching: "{searchQuery}"</span>}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
          {products.length === 0 ? (
            <div className="col-span-full text-center py-8 text-gray-500">
              <p className="text-sm">No products found</p>
            </div>
          ) : (
            products.map(product => (
              <div
                key={product.id}
                onClick={() => handleProductClick(product)}
                className="bg-white border rounded-lg p-2.5 sm:p-3 md:p-4 cursor-pointer hover:shadow-lg transition-shadow"
              >
                <div className="font-semibold text-xs sm:text-sm md:text-base truncate">{product.name}</div>
                <div className="text-xs text-gray-500 truncate">{product.sku}</div>
                <div className="font-bold mt-1 text-xs sm:text-sm">
                  Ksh. {formatCurrency(product.min_price || 0)} - {formatCurrency(product.max_price || product.price || 0)}
                </div>
                <div className="text-xs text-gray-500">
                  Stock: {product.stock ?? 0}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ================= CART ================= */}
      <div className="bg-white border rounded-lg p-3 sm:p-4 flex flex-col order-1 lg:order-2 max-h-[600px] lg:max-h-none">
        <h2 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">Cart</h2>

        <div className="flex-1 space-y-2 sm:space-y-3 overflow-y-auto">
          {cart.length === 0 ? (
            <p className="text-gray-500 text-sm">Cart is empty</p>
          ) : (
            cart.map(item => {
              const qty = parseInt(item.quantity, 10) || 0;
              const exceedsStock = qty > item.available;
              const isEditingThisPrice = editingPrice === item.product_id;
              
              return (
                <div
                  key={item.product_id}
                  className="border-b pb-2 sm:pb-3 last:border-b-0"
                >
                  <div className="flex justify-between items-start mb-1 sm:mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-xs sm:text-sm truncate">{item.name}</div>
                      <div className="flex items-center gap-1 sm:gap-2 mt-1">
                        {isEditingThisPrice ? (
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-500">Ksh.</span>
                            <input
                              type="number"
                              step="0.01"
                              value={customPrice}
                              onChange={(e) => setCustomPrice(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  confirmPriceChange(item.product_id);
                                } else if (e.key === 'Escape') {
                                  setEditingPrice(null);
                                  setCustomPrice('');
                                }
                              }}
                              className="w-16 sm:w-20 text-xs sm:text-sm px-1 sm:px-2 py-1 border rounded"
                              autoFocus
                            />
                            <button
                              onClick={() => confirmPriceChange(item.product_id)}
                              className="text-xs bg-blue-600 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded hover:bg-blue-700"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => {
                                setEditingPrice(null);
                                setCustomPrice('');
                              }}
                              className="text-xs bg-gray-300 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded hover:bg-gray-400"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="text-xs sm:text-sm text-gray-600">
                              Ksh. {formatCurrency(item.price)}
                            </span>
                            <button
                              onClick={() => handlePriceEdit(item)}
                              className="text-blue-600 hover:text-blue-800 p-0.5 sm:p-1"
                              title="Edit price"
                            >
                              <Edit2 size={12} className="sm:w-3.5 sm:h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5 sm:mt-1">
                        Range: Ksh. {formatCurrency(item.min_price)} - {formatCurrency(item.max_price)}
                      </div>
                      {exceedsStock && (
                        <div className="text-xs text-red-600 flex items-center gap-1 mt-0.5 sm:mt-1">
                          <AlertCircle size={10} className="sm:w-3 sm:h-3" />
                          Only {item.available} available
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => removeFromCart(item.product_id)}
                      className="text-red-600 hover:bg-red-100 rounded p-0.5 sm:p-1 ml-2"
                    >
                      <Trash2 size={14} className="sm:w-4 sm:h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <button
                        onClick={() => updateQuantity(item.product_id, -1)}
                        className="p-0.5 sm:p-1 hover:bg-gray-100 rounded"
                      >
                        <Minus size={14} className="sm:w-4 sm:h-4" />
                      </button>

                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => {
                          const raw = e.target.value;
                          setCart(cart.map(cartItem =>
                            cartItem.product_id === item.product_id
                              ? { ...cartItem, quantity: raw }
                              : cartItem
                          ));
                        }}
                        onBlur={() => {
                          let value = parseInt(item.quantity, 10);
                          if (isNaN(value) || value < 1) value = 1;
                          setCart(cart.map(cartItem =>
                            cartItem.product_id === item.product_id
                              ? { ...cartItem, quantity: value }
                              : cartItem
                          ));
                        }}
                        className={`w-12 sm:w-14 text-center border rounded mx-1 sm:mx-2 px-1 py-0.5 text-xs sm:text-sm ${
                          exceedsStock 
                            ? 'border-red-500 bg-red-50 text-red-700' 
                            : 'border-gray-300'
                        }`}
                      />

                      <button
                        onClick={() => updateQuantity(item.product_id, 1)}
                        className="p-0.5 sm:p-1 hover:bg-gray-100 rounded"
                      >
                        <Plus size={14} className="sm:w-4 sm:h-4" />
                      </button>
                    </div>

                    <div className="font-semibold text-xs sm:text-sm">
                      Ksh. {formatCurrency(item.price * qty)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {success && (
          <div className="text-green-600 font-semibold mt-2 sm:mt-3 text-xs sm:text-sm">
            Sale completed successfully!
          </div>
        )}

        {hasStockIssues() && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-2 sm:p-3 mt-2 sm:mt-3 flex items-start gap-2">
            <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5 sm:w-4 sm:h-4" />
            <div className="text-xs sm:text-sm text-red-700">
              <span className="font-semibold">Cannot complete sale:</span> Some items exceed available stock
            </div>
          </div>
        )}

        <div className="mt-3 sm:mt-4 border-t pt-3 sm:pt-4">
          <div className="flex justify-between font-bold mb-3 sm:mb-4 text-sm sm:text-base">
            <span>Total</span>
            <span>Ksh. {formatCurrency(total)}</span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-3 sm:mb-4">
            {['cash', 'card', 'mobile'].map(method => (
              <button
                key={method}
                onClick={() => setPaymentMethod(method)}
                className={`py-1.5 sm:py-2 border-2 rounded-lg flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 capitalize text-xs sm:text-sm ${
                  paymentMethod === method
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-300'
                }`}
              >
                {method === 'cash' && <DollarSign size={14} className="sm:w-4 sm:h-4" />}
                {method === 'card' && <CreditCard size={14} className="sm:w-4 sm:h-4" />}
                {method === 'mobile' && <Smartphone size={14} className="sm:w-4 sm:h-4" />}
                <span className="hidden sm:inline">{method}</span>
              </button>
            ))}
          </div>

          <button
            onClick={handleCheckoutClick}
            disabled={cart.length === 0 || loading || hasStockIssues()}
            className="w-full bg-blue-600 text-white py-2 sm:py-3 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            {loading ? 'Processing...' : 'Complete Sale'}
          </button>
        </div>
      </div>

      {/* ================= ADD TO CART CONFIRMATION DIALOG ================= */}
      {showAddConfirm && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full">
            <div className="flex justify-between items-start mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-bold">Add to Cart</h3>
              <button
                onClick={() => {
                  setShowAddConfirm(false);
                  setSelectedProduct(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={18} className="sm:w-5 sm:h-5" />
              </button>
            </div>

            <div className="mb-4 sm:mb-6">
              <p className="text-gray-700 mb-2 text-sm sm:text-base">
                Add this product to cart?
              </p>
              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                <div className="font-semibold text-sm sm:text-base">{selectedProduct.name}</div>
                <div className="text-xs sm:text-sm text-gray-500">{selectedProduct.sku}</div>
                <div className="font-bold text-base sm:text-lg mt-2">
                  Ksh. {formatCurrency(selectedProduct.min_price || 0)} - {formatCurrency(selectedProduct.max_price || selectedProduct.price || 0)}
                </div>
                <div className="text-xs sm:text-sm text-gray-500 mt-1">
                  Available: {selectedProduct.stock ?? 0}
                </div>
              </div>
            </div>

            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={() => {
                  setShowAddConfirm(false);
                  setSelectedProduct(null);
                }}
                className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={confirmAddToCart}
                className="flex-1 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm sm:text-base"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= CHECKOUT CONFIRMATION DIALOG ================= */}
      {showCheckoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-bold">Confirm Sale</h3>
              <button
                onClick={() => setShowCheckoutConfirm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={18} className="sm:w-5 sm:h-5" />
              </button>
            </div>

            <div className="mb-4 sm:mb-6">
              <p className="text-gray-700 mb-3 sm:mb-4 text-sm sm:text-base">
                Complete this sale with the following items?
              </p>
              
              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg mb-3 sm:mb-4 max-h-48 sm:max-h-64 overflow-y-auto">
                {cart.map(item => {
                  const qty = parseInt(item.quantity, 10) || 1;
                  const itemTotal = item.price * qty;
                  
                  return (
                    <div key={item.product_id} className="flex justify-between py-1.5 sm:py-2 border-b last:border-b-0 text-xs sm:text-sm">
                      <div className="flex-1 min-w-0 mr-2">
                        <div className="font-medium truncate">{item.name}</div>
                        <div className="text-xs text-gray-500">
                          Ksh. {formatCurrency(item.price)} × {qty}
                        </div>
                      </div>
                      <div className="font-semibold whitespace-nowrap">
                        Ksh. {formatCurrency(itemTotal)}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between items-center font-bold text-base sm:text-lg mb-2">
                <span>Total:</span>
                <span>Ksh. {formatCurrency(total)}</span>
              </div>
              
              <div className="flex items-center gap-2 text-gray-600 text-sm sm:text-base">
                <span>Payment Method:</span>
                <span className="font-semibold capitalize">{paymentMethod}</span>
              </div>
            </div>

            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={() => setShowCheckoutConfirm(false)}
                className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={confirmCheckout}
                className="flex-1 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm sm:text-base"
              >
                Confirm Sale
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POSPage;
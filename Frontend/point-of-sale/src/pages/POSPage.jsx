/* ============================================================
   POS (POINT OF SALE) PAGE
   Main cashier interface for processing sales
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
} from 'lucide-react';
import api from '../services/apiService';

const POSPage = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

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

  const addToCart = (product) => {
    const existing = cart.find(item => item.product_id === product.id);

    if (existing) {
      setCart(cart.map(item =>
        item.product_id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([
        ...cart,
        {
          product_id: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          available: product.inventory?.quantity || 0,
        },
      ]);
    }
  };

  const updateQuantity = (productId, change) => {
    setCart(
      cart
        .map(item =>
          item.product_id === productId
            ? { ...item, quantity: Math.max(0, item.quantity + change) }
            : item
        )
        .filter(item => item.quantity > 0)
    );
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.product_id !== productId));
  };

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const handleCheckout = async () => {
    if (!cart.length) return;

    setLoading(true);
    try {
      const items = cart.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
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
    <div className="grid grid-cols-3 gap-6 p-6">
      {/* ================= PRODUCTS ================= */}
      <div className="col-span-2">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search products by name, SKU, or barcode..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          {products.map(product => (
            <div
              key={product.id}
              onClick={() => addToCart(product)}
              className="bg-white border rounded-lg p-4 cursor-pointer hover:shadow-lg"
            >
              <div className="font-semibold">{product.name}</div>
              <div className="text-sm text-gray-500">{product.sku}</div>
              <div className="font-bold mt-1">
                ${product.price.toFixed(2)}
              </div>
              <div className="text-sm text-gray-500">
                Stock: {product.inventory?.quantity || 0}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ================= CART ================= */}
      <div className="bg-white border rounded-lg p-4 flex flex-col">
        <h2 className="text-lg font-bold mb-4">Cart</h2>

        <div className="flex-1 space-y-3">
          {cart.length === 0 ? (
            <p className="text-gray-500">Cart is empty</p>
          ) : (
            cart.map(item => (
              <div
                key={item.product_id}
                className="flex justify-between items-center"
              >
                <div>
                  <div className="font-semibold">{item.name}</div>
                  <div className="text-sm text-gray-500">
                    ${item.price.toFixed(2)}
                  </div>
                </div>

                <div className="flex items-center">
                  <button
                    onClick={() =>
                      updateQuantity(item.product_id, -1)
                    }
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <Minus size={16} />
                  </button>

                  <span className="mx-2">{item.quantity}</span>

                  <button
                    onClick={() =>
                      updateQuantity(item.product_id, 1)
                    }
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <Plus size={16} />
                  </button>

                  <button
                    onClick={() =>
                      removeFromCart(item.product_id)
                    }
                    className="p-1 ml-2 text-red-600 hover:bg-red-100 rounded"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {success && (
          <div className="text-green-600 font-semibold mt-3">
            Sale completed successfully!
          </div>
        )}

        <div className="mt-4 border-t pt-4">
          <div className="flex justify-between font-bold mb-4">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            {['cash', 'card', 'mobile'].map(method => (
              <button
                key={method}
                onClick={() => setPaymentMethod(method)}
                className={`py-2 border-2 rounded-lg flex items-center justify-center gap-2 ${
                  paymentMethod === method
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-300'
                }`}
              >
                {method === 'cash' && <DollarSign size={16} />}
                {method === 'card' && <CreditCard size={16} />}
                {method === 'mobile' && <Smartphone size={16} />}
                {method}
              </button>
            ))}
          </div>

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Complete Sale'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default POSPage;

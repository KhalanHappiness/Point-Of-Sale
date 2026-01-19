/* ============================================================
   PRODUCTS MANAGEMENT PAGE (ADMIN ONLY)
   CRUD operations for products
   ============================================================ */

import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import api from '../services/apiService';

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    price: '',
    barcode: '',
    initial_stock: 0,
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await api.getProducts(false);
      setProducts(data.products);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, formData);
      } else {
        await api.createProduct(formData);
      }

      setShowForm(false);
      setEditingProduct(null);
      setFormData({
        sku: '',
        name: '',
        price: '',
        barcode: '',
        initial_stock: 0,
      });
      loadProducts();
    } catch (error) {
      alert(`Failed: ${error.message}`);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      sku: product.sku,
      name: product.name,
      price: product.price,
      barcode: product.barcode || '',
      initial_stock: 0,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this product?')) {
      try {
        await api.deleteProduct(id);
        loadProducts();
      } catch (error) {
        alert(`Delete failed: ${error.message}`);
      }
    }
  };

  return (
    <div className="p-6">
      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Products</h1>

        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={18} />
          Add Product
        </button>
      </div>

      {/* ================= FORM ================= */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white border rounded-lg p-6 mb-6 grid grid-cols-2 gap-4"
        >
          <h2 className="col-span-2 text-lg font-bold mb-2">
            {editingProduct ? 'Edit Product' : 'New Product'}
          </h2>

          <input
            placeholder="SKU"
            value={formData.sku}
            onChange={(e) =>
              setFormData({ ...formData, sku: e.target.value })
            }
            className="px-4 py-2 border rounded-lg"
            required
          />

          <input
            placeholder="Name"
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            className="px-4 py-2 border rounded-lg"
            required
          />

          <input
            type="number"
            step="0.01"
            placeholder="Price"
            value={formData.price}
            onChange={(e) =>
              setFormData({ ...formData, price: e.target.value })
            }
            className="px-4 py-2 border rounded-lg"
            required
          />

          <input
            placeholder="Barcode (optional)"
            value={formData.barcode}
            onChange={(e) =>
              setFormData({ ...formData, barcode: e.target.value })
            }
            className="px-4 py-2 border rounded-lg"
          />

          {!editingProduct && (
            <input
              type="number"
              placeholder="Initial Stock"
              value={formData.initial_stock}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  initial_stock: parseInt(e.target.value, 10) || 0,
                })
              }
              className="px-4 py-2 border rounded-lg"
            />
          )}

          <div className="col-span-2 flex gap-3 mt-4">
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              {editingProduct ? 'Update' : 'Create'}
            </button>

            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingProduct(null);
                setFormData({
                  sku: '',
                  name: '',
                  price: '',
                  barcode: '',
                  initial_stock: 0,
                });
              }}
              className="bg-gray-300 px-6 py-2 rounded-lg hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* ================= TABLE ================= */}
      <div className="bg-white border rounded-lg overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">SKU</th>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Price</th>
              <th className="p-3 text-left">Stock</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {products.map((product) => (
              <tr
                key={product.id}
                className="border-t hover:bg-gray-50"
              >
                <td className="p-3">{product.sku}</td>
                <td className="p-3">{product.name}</td>
                <td className="p-3">
                  ${product.price.toFixed(2)}
                </td>
                <td className="p-3">
                  {product.inventory?.quantity || 0}
                </td>
                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded text-sm ${
                      product.is_active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {product.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="p-3">
                  <button
                    onClick={() => handleEdit(product)}
                    className="text-blue-600 hover:text-blue-800 mr-3"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductsPage;

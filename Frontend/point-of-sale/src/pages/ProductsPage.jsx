/* ============================================================
   PRODUCTS PAGE - RESPONSIVE
   Manage product catalog with CRUD operations
   ============================================================ */

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import api from '../services/apiService';

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    min_price: '',
    max_price: '',
    category: '',
  });

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

  const handleSubmit = async () => {
    try {
      const productData = {
        ...formData,
        min_price: parseFloat(formData.min_price),
        max_price: parseFloat(formData.max_price),
      };

      if (editingProduct) {
        await api.updateProduct(editingProduct.id, productData);
      } else {
        await api.createProduct(productData);
      }

      setShowModal(false);
      setEditingProduct(null);
      setFormData({
        name: '',
        sku: '',
        barcode: '',
        min_price: '',
        max_price: '',
        category: '',
      });
      loadProducts();
    } catch (error) {
      alert(`Failed to save product: ${error.message}`);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      barcode: product.barcode || '',
      min_price: product.min_price?.toString() || '',
      max_price: product.max_price?.toString() || '',
      category: product.category || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      await api.deleteProduct(id);
      loadProducts();
    } catch (error) {
      alert(`Failed to delete product: ${error.message}`);
    }
  };

  const handleAddNew = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      sku: '',
      barcode: '',
      min_price: '',
      max_price: '',
      category: '',
    });
    setShowModal(true);
  };

  return (
    <div className="p-3 sm:p-4 md:p-6">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 md:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold">Products</h1>
        <button
          onClick={handleAddNew}
          className="bg-blue-600 text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <Plus size={18} className="sm:w-5 sm:h-5" />
          Add Product
        </button>
      </div>

      {/* ================= MOBILE CARDS VIEW ================= */}
      <div className="md:hidden space-y-3">
        {products.map((product) => (
          <div
            key={product.id}
            className="bg-white border rounded-lg p-3 hover:shadow-lg transition-shadow"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm truncate">
                  {product.name}
                </h3>
                <p className="text-xs text-gray-500 truncate">
                  Product Code: {product.sku}
                </p>
              </div>
              
              <div className="flex gap-1 ml-2 flex-shrink-0">
                <button
                  onClick={() => handleEdit(product)}
                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => handleDelete(product.id)}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {product.barcode && (
              <p className="text-xs text-gray-500 mb-2 truncate">
                Barcode: {product.barcode}
              </p>
            )}

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Price Range:</span>
                <span className="font-semibold">
                  Ksh. {product.min_price?.toFixed(2) || '0.00'} - {product.max_price?.toFixed(2) || '0.00'}
                </span>
              </div>
              
              {product.category && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Category:</span>
                  <span className="font-medium">{product.category}</span>
                </div>
              )}
              
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Stock:</span>
                <span className={`font-semibold ${
                  product.stock > 10 ? 'text-green-600' : 
                  product.stock > 0 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {product.stock ?? 0}
                </span>
              </div>
            </div>
          </div>
        ))}
        
        {products.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-sm">No products found. Add your first product to get started.</p>
          </div>
        )}
      </div>

      {/* ================= DESKTOP TABLE VIEW ================= */}
      <div className="hidden md:block bg-white border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left text-sm font-semibold">Product Name</th>
                <th className="p-3 text-left text-sm font-semibold">Product Code</th>
                <th className="p-3 text-left text-sm font-semibold">Barcode</th>
                <th className="p-3 text-left text-sm font-semibold">Category</th>
                <th className="p-3 text-left text-sm font-semibold">Min Price</th>
                <th className="p-3 text-left text-sm font-semibold">Max Price</th>
                <th className="p-3 text-left text-sm font-semibold">Stock</th>
                <th className="p-3 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 text-sm font-medium">{product.name}</td>
                  <td className="p-3 text-sm">{product.sku}</td>
                  <td className="p-3 text-sm text-gray-600">{product.barcode || '-'}</td>
                  <td className="p-3 text-sm">{product.category || '-'}</td>
                  <td className="p-3 text-sm">Ksh. {product.min_price?.toFixed(2) || '0.00'}</td>
                  <td className="p-3 text-sm">Ksh. {product.max_price?.toFixed(2) || '0.00'}</td>
                  <td className="p-3 text-sm">
                    <span className={`font-semibold ${
                      product.stock > 10 ? 'text-green-600' : 
                      product.stock > 0 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {product.stock ?? 0}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(product)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {products.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-sm">No products found. Add your first product to get started.</p>
          </div>
        )}
      </div>

      {/* ================= ADD/EDIT MODAL ================= */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-bold">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingProduct(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} className="sm:w-6 sm:h-6" />
              </button>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 sm:px-4 py-2 border rounded-lg text-sm sm:text-base"
                  placeholder="Enter product name"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2">
                  Product Code *
                </label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) =>
                    setFormData({ ...formData, sku: e.target.value })
                  }
                  className="w-full px-3 sm:px-4 py-2 border rounded-lg text-sm sm:text-base"
                  placeholder="Enter Product Code"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2">
                  Barcode
                </label>
                <input
                  type="text"
                  value={formData.barcode}
                  onChange={(e) =>
                    setFormData({ ...formData, barcode: e.target.value })
                  }
                  className="w-full px-3 sm:px-4 py-2 border rounded-lg text-sm sm:text-base"
                  placeholder="Enter barcode (optional)"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2">
                    Min Price *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.min_price}
                    onChange={(e) =>
                      setFormData({ ...formData, min_price: e.target.value })
                    }
                    className="w-full px-3 sm:px-4 py-2 border rounded-lg text-sm sm:text-base"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2">
                    Max Price *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.max_price}
                    onChange={(e) =>
                      setFormData({ ...formData, max_price: e.target.value })
                    }
                    className="w-full px-3 sm:px-4 py-2 border rounded-lg text-sm sm:text-base"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2">
                  Category
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full px-3 sm:px-4 py-2 border rounded-lg text-sm sm:text-base"
                  placeholder="Enter category (optional)"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6">
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingProduct(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm sm:text-base"
              >
                {editingProduct ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
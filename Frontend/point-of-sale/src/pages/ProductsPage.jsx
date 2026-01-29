/* ============================================================
   PRODUCTS PAGE WITH VARIANTS - RESPONSIVE
   Manage product catalog with sizes/variants
   ============================================================ */

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    min_price: '',
    max_price: '',
    category_id: '',
    brand_id: '',
    variants: []
  });

  // Mock API - replace with your actual api service
  const api = {
    getProducts: async () => ({ products: [] }),
    getCategories: async () => ({ categories: [] }),
    getBrands: async () => ({ brands: [] }),
    getSizes: async () => ({ sizes: [] }),
    createProduct: async (data) => console.log('Create:', data),
    updateProduct: async (id, data) => console.log('Update:', id, data),
    deleteProduct: async (id) => console.log('Delete:', id)
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [productsData, categoriesData, brandsData, sizesData] = await Promise.all([
        api.getProducts(),
        api.getCategories(),
        api.getBrands(),
        api.getSizes()
      ]);
      
      setProducts(productsData.products);
      setCategories(categoriesData.categories || []);
      setBrands(brandsData.brands || []);
      setSizes(sizesData.sizes || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      const productData = {
        ...formData,
        min_price: parseFloat(formData.min_price),
        max_price: parseFloat(formData.max_price),
        category_id: formData.category_id || null,
        brand_id: formData.brand_id || null,
        variants: formData.variants.filter(v => v.size_id) // Only include variants with size selected
      };

      if (editingProduct) {
        await api.updateProduct(editingProduct.id, productData);
      } else {
        await api.createProduct(productData);
      }

      setShowModal(false);
      setEditingProduct(null);
      resetForm();
      loadData();
    } catch (error) {
      alert(`Failed to save product: ${error.message}`);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      min_price: product.min_price?.toString() || '',
      max_price: product.max_price?.toString() || '',
      category_id: product.category_id || '',
      brand_id: product.brand_id || '',
      variants: product.variants || []
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      await api.deleteProduct(id);
      loadData();
    } catch (error) {
      alert(`Failed to delete product: ${error.message}`);
    }
  };

  const handleAddNew = () => {
    setEditingProduct(null);
    resetForm();
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      sku: '',
      min_price: '',
      max_price: '',
      category_id: '',
      brand_id: '',
      variants: []
    });
  };

  const handleVariantChange = (index, field, value) => {
    const newVariants = [...formData.variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setFormData({ ...formData, variants: newVariants });
  };

  const addVariant = () => {
    setFormData({
      ...formData,
      variants: [...formData.variants, { size_id: '', quantity: 0, sku_suffix: '' }]
    });
  };

  const removeVariant = (index) => {
    const newVariants = formData.variants.filter((_, i) => i !== index);
    setFormData({ ...formData, variants: newVariants });
  };

  const getTotalStock = (product) => {
    if (!product.variants) return 0;
    return product.variants.reduce((sum, v) => sum + (v.quantity || 0), 0);
  };

  return (
    <div className="p-3 sm:p-4 md:p-6">
      {/* HEADER */}
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

      {/* MOBILE CARDS VIEW */}
      <div className="md:hidden space-y-3">
        {products.map((product) => (
          <div key={product.id} className="bg-white border rounded-lg p-3 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm truncate">{product.name}</h3>
                <p className="text-xs text-gray-500 truncate">SKU: {product.sku}</p>
              </div>
              
              <div className="flex gap-1 ml-2 flex-shrink-0">
                <button onClick={() => handleEdit(product)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
                  <Edit2 size={14} />
                </button>
                <button onClick={() => handleDelete(product.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Price Range:</span>
                <span className="font-semibold">
                  Ksh. {product.min_price?.toFixed(2)} - {product.max_price?.toFixed(2)}
                </span>
              </div>
              
              {product.category && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Category:</span>
                  <span className="font-medium">{product.category.name}</span>
                </div>
              )}
              
              {product.brand && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Brand:</span>
                  <span className="font-medium">{product.brand.name}</span>
                </div>
              )}
              
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Total Stock:</span>
                <span className={`font-semibold ${
                  getTotalStock(product) > 10 ? 'text-green-600' : 
                  getTotalStock(product) > 0 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {getTotalStock(product)}
                </span>
              </div>
              
              {product.variants && product.variants.length > 0 && (
                <div className="mt-2 pt-2 border-t">
                  <p className="text-xs text-gray-500 font-medium mb-1">Sizes:</p>
                  <div className="flex flex-wrap gap-1">
                    {product.variants.map((variant) => (
                      <span key={variant.id} className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                        {variant.size?.name}: {variant.quantity}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {products.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-sm">No products found. Add your first product to get started.</p>
          </div>
        )}
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden md:block bg-white border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left text-sm font-semibold">Product Name</th>
                <th className="p-3 text-left text-sm font-semibold">SKU</th>
                <th className="p-3 text-left text-sm font-semibold">Category</th>
                <th className="p-3 text-left text-sm font-semibold">Brand</th>
                <th className="p-3 text-left text-sm font-semibold">Price Range</th>
                <th className="p-3 text-left text-sm font-semibold">Stock</th>
                <th className="p-3 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 text-sm font-medium">{product.name}</td>
                  <td className="p-3 text-sm">{product.sku}</td>
                  <td className="p-3 text-sm">{product.category?.name || '-'}</td>
                  <td className="p-3 text-sm">{product.brand?.name || '-'}</td>
                  <td className="p-3 text-sm">
                    Ksh. {product.min_price?.toFixed(2)} - {product.max_price?.toFixed(2)}
                  </td>
                  <td className="p-3 text-sm">
                    <span className={`font-semibold ${
                      getTotalStock(product) > 10 ? 'text-green-600' : 
                      getTotalStock(product) > 0 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {getTotalStock(product)}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(product)} className="p-2 text-blue-600 hover:bg-blue-50 rounded" title="Edit">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(product.id)} className="p-2 text-red-600 hover:bg-red-50 rounded" title="Delete">
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

      {/* ADD/EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-bold">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button onClick={() => { setShowModal(false); setEditingProduct(null); }} className="text-gray-400 hover:text-gray-600">
                <X size={20} className="sm:w-6 sm:h-6" />
              </button>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2">Product Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 border rounded-lg text-sm sm:text-base"
                    placeholder="Enter product name"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2">SKU *</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 border rounded-lg text-sm sm:text-base"
                    placeholder="Enter SKU"
                  />
                </div>
              </div>

              {/* Category & Brand */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2">Category</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 border rounded-lg text-sm sm:text-base"
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2">Brand</label>
                  <select
                    value={formData.brand_id}
                    onChange={(e) => setFormData({ ...formData, brand_id: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 border rounded-lg text-sm sm:text-base"
                  >
                    <option value="">Select Brand</option>
                    {brands.map((brand) => (
                      <option key={brand.id} value={brand.id}>{brand.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Prices */}
              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2">Min Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.min_price}
                    onChange={(e) => setFormData({ ...formData, min_price: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 border rounded-lg text-sm sm:text-base"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2">Max Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.max_price}
                    onChange={(e) => setFormData({ ...formData, max_price: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 border rounded-lg text-sm sm:text-base"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Variants/Sizes Section */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm sm:text-base font-medium">Sizes & Stock</label>
                  <button
                    onClick={addVariant}
                    type="button"
                    className="text-xs sm:text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                  >
                    + Add Size
                  </button>
                </div>

                {formData.variants.length === 0 ? (
                  <p className="text-xs sm:text-sm text-gray-500 italic">No sizes added yet. Click "Add Size" to add stock by size.</p>
                ) : (
                  <div className="space-y-2">
                    {formData.variants.map((variant, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 items-center bg-gray-50 p-2 rounded">
                        <select
                          value={variant.size_id}
                          onChange={(e) => handleVariantChange(index, 'size_id', e.target.value)}
                          className="col-span-4 px-2 py-1.5 border rounded text-sm"
                        >
                          <option value="">Select Size</option>
                          {sizes.map((size) => (
                            <option key={size.id} value={size.id}>{size.name}</option>
                          ))}
                        </select>

                        <input
                          type="number"
                          placeholder="Quantity"
                          value={variant.quantity}
                          onChange={(e) => handleVariantChange(index, 'quantity', parseInt(e.target.value, 10) || 0)}
                          className="col-span-3 px-2 py-1.5 border rounded text-sm"
                        />

                        <input
                          type="text"
                          placeholder="SKU suffix (e.g., -SM)"
                          value={variant.sku_suffix || ''}
                          onChange={(e) => handleVariantChange(index, 'sku_suffix', e.target.value)}
                          className="col-span-4 px-2 py-1.5 border rounded text-sm"
                        />

                        <button
                          onClick={() => removeVariant(index)}
                          type="button"
                          className="col-span-1 p-1.5 text-red-600 hover:bg-red-100 rounded"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6">
              <button
                onClick={() => { setShowModal(false); setEditingProduct(null); }}
                type="button"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                type="button"
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
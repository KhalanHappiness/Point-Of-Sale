/* ============================================================
   PRODUCT ATTRIBUTES MANAGEMENT PAGE (ADMIN ONLY)
   Manage Categories, Brands, and Sizes
   ============================================================ */

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Tag, Award, Ruler } from 'lucide-react';
import api from '../services/apiService';

const AttributesPage = () => {
  const [activeTab, setActiveTab] = useState('categories');
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [sizes, setSizes] = useState([]);
  
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });



  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [categoriesData, brandsData, sizesData] = await Promise.all([
        api.getCategories(),
        api.getBrands(),
        api.getSizes()
      ]);
      
      setCategories(categoriesData.categories || []);
      setBrands(brandsData.brands || []);
      setSizes(sizesData.sizes || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const getCurrentItems = () => {
    switch (activeTab) {
      case 'categories': return categories;
      case 'brands': return brands;
      case 'sizes': return sizes;
      default: return [];
    }
  };

  const getTabConfig = () => {
    switch (activeTab) {
      case 'categories':
        return {
          title: 'Categories',
          icon: Tag,
          create: api.createCategory,
          update: api.updateCategory,
          delete: api.deleteCategory
        };
      case 'brands':
        return {
          title: 'Brands',
          icon: Award,
          create: api.createBrand,
          update: api.updateBrand,
          delete: api.deleteBrand
        };
      case 'sizes':
        return {
          title: 'Sizes',
          icon: Ruler,
          create: api.createSize,
          update: api.updateSize,
          delete: api.deleteSize
        };
      default:
        return { title: '', icon: Tag, create: null, update: null, delete: null };
    }
  };

  const handleSubmit = async () => {
    try {
      const config = getTabConfig();
      
      if (editingItem) {
        await config.update(editingItem.id, formData);
      } else {
        await config.create(formData);
      }

      setShowModal(false);
      setEditingItem(null);
      resetForm();
      loadData();
    } catch (error) {
      alert(`Failed to save: ${error.message}`);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      const config = getTabConfig();
      await config.delete(id);
      loadData();
    } catch (error) {
      alert(`Failed to delete: ${error.message}`);
    }
  };

  const handleAddNew = () => {
    setEditingItem(null);
    resetForm();
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: ''
    });
  };

  const tabs = [
    { id: 'categories', label: 'Categories', icon: Tag },
    { id: 'brands', label: 'Brands', icon: Award },
    { id: 'sizes', label: 'Sizes', icon: Ruler }
  ];

  const config = getTabConfig();
  const items = getCurrentItems();

  return (
    <div className="p-3 sm:p-4 md:p-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 md:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold">Product Attributes</h1>
        <button
          onClick={handleAddNew}
          className="bg-blue-600 text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <Plus size={18} className="sm:w-5 sm:h-5" />
          Add {config.title.slice(0, -1)}
        </button>
      </div>

      {/* TABS */}
      <div className="bg-white border rounded-lg mb-4 md:mb-6 overflow-x-auto">
        <div className="flex">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon size={18} className="sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* MOBILE CARDS VIEW */}
      <div className="md:hidden space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-white border rounded-lg p-3 hover:shadow-lg transition-shadow"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm truncate">{item.name}</h3>
                {item.description && (
                  <p className="text-xs text-gray-500 truncate mt-1">
                    {item.description}
                  </p>
                )}
              </div>
              
              <div className="flex gap-1 ml-2 flex-shrink-0">
                <button
                  onClick={() => handleEdit(item)}
                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => handleDelete(item.id, item.name)}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {items.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <config.icon size={48} className="mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No {config.title.toLowerCase()} found. Add your first one to get started.</p>
          </div>
        )}
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden md:block bg-white border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left text-sm font-semibold">Name</th>
                <th className="p-3 text-left text-sm font-semibold">Description</th>
                <th className="p-3 text-left text-sm font-semibold">Created</th>
                <th className="p-3 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 text-sm font-medium">{item.name}</td>
                  <td className="p-3 text-sm text-gray-600">{item.description || '-'}</td>
                  <td className="p-3 text-sm text-gray-600">
                    {item.created_at ? new Date(item.created_at).toLocaleDateString() : '-'}
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id, item.name)}
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
        
        {items.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <config.icon size={48} className="mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No {config.title.toLowerCase()} found. Add your first one to get started.</p>
          </div>
        )}
      </div>

      {/* ADD/EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full">
            <div className="flex justify-between items-start mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-bold">
                {editingItem ? `Edit ${config.title.slice(0, -1)}` : `Add New ${config.title.slice(0, -1)}`}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingItem(null);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} className="sm:w-6 sm:h-6" />
              </button>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 border rounded-lg text-sm sm:text-base"
                  placeholder={`Enter ${config.title.slice(0, -1).toLowerCase()} name`}
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 border rounded-lg text-sm sm:text-base"
                  placeholder="Enter description..."
                  rows={3}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6">
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingItem(null);
                  resetForm();
                }}
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
                {editingItem ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttributesPage;
/* ============================================================
   INVENTORY MANAGEMENT PAGE WITH VARIANTS (ADMIN ONLY)
   View and adjust stock levels by size/variant
   ============================================================ */

import React, { useState, useEffect } from 'react';
import api from '../services/apiService';

const InventoryPage = () => {
  const [inventory, setInventory] = useState([]);
  const [showAdjust, setShowAdjust] = useState(false);
  const [adjustData, setAdjustData] = useState({
    variant_id: '',
    change: '',
    reason: 'restock',
    notes: '',
  });

 

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      const data = await api.getInventory();
      setInventory(data.inventory);
    } catch (error) {
      console.error('Failed to load inventory:', error);
    }
  };

  const handleAdjust = async () => {
    try {
      await api.adjustInventory({
        ...adjustData,
        change: parseInt(adjustData.change, 10),
      });

      setShowAdjust(false);
      setAdjustData({
        variant_id: '',
        change: '',
        reason: 'restock',
        notes: '',
      });
      loadInventory();
    } catch (error) {
      alert(`Adjustment failed: ${error.message}`);
    }
  };

  const getStatusInfo = (quantity) => {
    if (quantity > 10) {
      return { class: 'bg-green-100 text-green-800', text: 'In Stock' };
    } else if (quantity > 0) {
      return { class: 'bg-yellow-100 text-yellow-800', text: 'Low Stock' };
    } else {
      return { class: 'bg-red-100 text-red-800', text: 'Out of Stock' };
    }
  };

  return (
    <div className="p-3 sm:p-4 md:p-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 md:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold">Inventory</h1>
        <button
          onClick={() => setShowAdjust(!showAdjust)}
          className="bg-blue-600 text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-blue-700 w-full sm:w-auto"
        >
          Adjust Stock
        </button>
      </div>

      {/* ADJUST FORM */}
      {showAdjust && (
        <div className="bg-white border rounded-lg p-4 sm:p-6 mb-4 md:mb-6">
          <h2 className="text-base sm:text-lg font-bold mb-4">Adjust Inventory</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2">
                Select Product Variant *
              </label>
              <select
                value={adjustData.variant_id}
                onChange={(e) => setAdjustData({ ...adjustData, variant_id: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 border rounded-lg text-sm sm:text-base"
              >
                <option value="">Select Product & Size</option>
                {inventory.map((inv) => (
                  <option key={inv.variant_id} value={inv.variant_id}>
                    {inv.product?.name} - {inv.size?.name} (Current: {inv.quantity})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2">
                Change (+ or -) *
              </label>
              <input
                type="number"
                placeholder="e.g., +10 or -5"
                value={adjustData.change}
                onChange={(e) => setAdjustData({ ...adjustData, change: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 border rounded-lg text-sm sm:text-base"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2">
                Reason *
              </label>
              <select
                value={adjustData.reason}
                onChange={(e) => setAdjustData({ ...adjustData, reason: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 border rounded-lg text-sm sm:text-base"
              >
                <option value="restock">Restock</option>
                <option value="adjustment">Adjustment</option>
                <option value="damage">Damage</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2">
                Notes (optional)
              </label>
              <textarea
                placeholder="Add any notes about this adjustment..."
                value={adjustData.notes}
                onChange={(e) => setAdjustData({ ...adjustData, notes: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 border rounded-lg text-sm sm:text-base"
                rows={3}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6">
            <button
              onClick={handleAdjust}
              className="flex-1 bg-blue-600 text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-blue-700 text-sm sm:text-base"
            >
              Adjust Inventory
            </button>
            <button
              onClick={() => setShowAdjust(false)}
              type="button"
              className="flex-1 bg-gray-300 px-4 sm:px-6 py-2 rounded-lg hover:bg-gray-400 text-sm sm:text-base"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* MOBILE CARDS VIEW */}
      <div className="md:hidden space-y-3">
        {inventory.map((inv) => {
          const status = getStatusInfo(inv.quantity);
          
          return (
            <div key={inv.variant_id} className="bg-white border rounded-lg p-3">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate">{inv.product?.name}</h3>
                  <p className="text-xs text-gray-500">SKU: {inv.full_sku}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ml-2 ${status.class}`}>
                  {status.text}
                </span>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Size:</span>
                  <span className="font-medium">{inv.size?.name || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Quantity:</span>
                  <span className="font-bold text-base">{inv.quantity}</span>
                </div>
              </div>
            </div>
          );
        })}
        
        {inventory.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-sm">No inventory data available.</p>
          </div>
        )}
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden md:block bg-white border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left text-sm font-semibold">Product</th>
                <th className="p-3 text-left text-sm font-semibold">SKU</th>
                <th className="p-3 text-left text-sm font-semibold">Size</th>
                <th className="p-3 text-left text-sm font-semibold">Quantity</th>
                <th className="p-3 text-left text-sm font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((inv) => {
                const status = getStatusInfo(inv.quantity);
                
                return (
                  <tr key={inv.variant_id} className="border-t hover:bg-gray-50">
                    <td className="p-3 text-sm font-medium">{inv.product?.name}</td>
                    <td className="p-3 text-sm">{inv.full_sku}</td>
                    <td className="p-3 text-sm">{inv.size?.name || 'N/A'}</td>
                    <td className="p-3 text-sm font-bold">{inv.quantity}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${status.class}`}>
                        {status.text}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {inventory.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-sm">No inventory data available.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryPage;
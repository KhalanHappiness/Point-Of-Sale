/* ============================================================
   INVENTORY MANAGEMENT PAGE (ADMIN ONLY)
   View and adjust stock levels
   ============================================================ */

import React, { useState, useEffect } from 'react';
import api from '../services/apiService';

const InventoryPage = () => {
  const [inventory, setInventory] = useState([]);
  const [showAdjust, setShowAdjust] = useState(false);
  const [adjustData, setAdjustData] = useState({
    product_id: '',
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

  const handleAdjust = async (e) => {
    e.preventDefault();
    try {
      await api.adjustInventory({
        ...adjustData,
        change: parseInt(adjustData.change, 10),
      });

      setShowAdjust(false);
      setAdjustData({
        product_id: '',
        change: '',
        reason: 'restock',
        notes: '',
      });
      loadInventory();
    } catch (error) {
      alert(`Adjustment failed: ${error.message}`);
    }
  };

  return (
    <div className="p-6">
      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Inventory</h1>
        <button
          onClick={() => setShowAdjust(!showAdjust)}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          Adjust Stock
        </button>
      </div>

      {/* ================= ADJUST FORM ================= */}
      {showAdjust && (
        <form
          onSubmit={handleAdjust}
          className="bg-white border rounded-lg p-6 mb-6 grid grid-cols-2 gap-4"
        >
          <h2 className="col-span-2 text-lg font-bold">
            Adjust Inventory
          </h2>

          <select
            value={adjustData.product_id}
            onChange={(e) =>
              setAdjustData({
                ...adjustData,
                product_id: e.target.value,
              })
            }
            className="col-span-2 px-4 py-2 border rounded-lg"
            required
          >
            <option value="">Select Product</option>
            {inventory.map((inv) => (
              <option key={inv.product.id} value={inv.product.id}>
                {inv.product.name} (Current: {inv.quantity})
              </option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Change (+ or -)"
            value={adjustData.change}
            onChange={(e) =>
              setAdjustData({
                ...adjustData,
                change: e.target.value,
              })
            }
            className="px-4 py-2 border rounded-lg"
            required
          />

          <select
            value={adjustData.reason}
            onChange={(e) =>
              setAdjustData({
                ...adjustData,
                reason: e.target.value,
              })
            }
            className="px-4 py-2 border rounded-lg"
          >
            <option value="restock">Restock</option>
            <option value="adjustment">Adjustment</option>
            <option value="damage">Damage</option>
          </select>

          <textarea
            placeholder="Notes (optional)"
            value={adjustData.notes}
            onChange={(e) =>
              setAdjustData({
                ...adjustData,
                notes: e.target.value,
              })
            }
            className="col-span-2 px-4 py-2 border rounded-lg"
            rows={3}
          />

          <div className="col-span-2 flex gap-3">
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Adjust
            </button>

            <button
              type="button"
              onClick={() => setShowAdjust(false)}
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
              <th className="p-3 text-left">Product</th>
              <th className="p-3 text-left">SKU</th>
              <th className="p-3 text-left">Quantity</th>
              <th className="p-3 text-left">Status</th>
            </tr>
          </thead>

          <tbody>
            {inventory.map((inv) => {
              const statusClass =
                inv.quantity > 10
                  ? 'bg-green-100 text-green-800'
                  : inv.quantity > 0
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800';

              const statusText =
                inv.quantity > 10
                  ? 'In Stock'
                  : inv.quantity > 0
                  ? 'Low Stock'
                  : 'Out of Stock';

              return (
                <tr
                  key={inv.product.id}
                  className="border-t hover:bg-gray-50"
                >
                  <td className="p-3">{inv.product.name}</td>
                  <td className="p-3">{inv.product.sku}</td>
                  <td className="p-3">{inv.quantity}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded text-sm ${statusClass}`}
                    >
                      {statusText}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InventoryPage;

/* ============================================================
   AUDIT TRAIL PAGE (ADMIN ONLY)
   Complete history of sales and inventory movements
   ============================================================ */

import React, { useState, useEffect } from 'react';
import { Calendar, TrendingDown, TrendingUp, Package, ShoppingCart, Filter, Download } from 'lucide-react';
import api from '../services/apiService';

const AuditTrailPage = () => {
  const [activeTab, setActiveTab] = useState('sales');
  const [salesHistory, setSalesHistory] = useState([]);
  const [stockMovements, setStockMovements] = useState([]);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    productId: '',
    variantId: '',
    reason: '',
    userId: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  
  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      if (activeTab === 'sales') {
        const data = await api.getSales(100, 0);
        setSalesHistory(data.sales || []);
      } else {
        const data = await api.getStockMovements(null, null, 100);
        setStockMovements(data.movements || []);
      }
    } catch (error) {
      console.error('Failed to load audit trail:', error);
    }
  };

  const formatCurrency = (amount) => {
    return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getReasonBadge = (reason) => {
    const badges = {
      sale: 'bg-blue-100 text-blue-800',
      restock: 'bg-green-100 text-green-800',
      adjustment: 'bg-yellow-100 text-yellow-800',
      damage: 'bg-red-100 text-red-800'
    };
    return badges[reason] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentMethodBadge = (method) => {
    const badges = {
      cash: 'bg-green-100 text-green-800',
      card: 'bg-blue-100 text-blue-800',
      mobile: 'bg-purple-100 text-purple-800'
    };
    return badges[method] || 'bg-gray-100 text-gray-800';
  };

  const exportToCSV = () => {
    alert('Export to CSV - Feature coming soon!');
  };

  return (
    <div className="p-3 sm:p-4 md:p-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 md:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold">Audit Trail</h1>
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm sm:text-base"
          >
            <Filter size={16} className="sm:w-4 sm:h-4" />
            Filters
          </button>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm sm:text-base"
          >
            <Download size={16} className="sm:w-4 sm:h-4" />
            Export
          </button>
        </div>
      </div>

      {/* FILTERS */}
      {showFilters && (
        <div className="bg-white border rounded-lg p-4 mb-4">
          <h3 className="font-semibold mb-3">Filter Results</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            {activeTab === 'inventory' && (
              <div>
                <label className="block text-xs font-medium mb-1">Reason</label>
                <select
                  value={filters.reason}
                  onChange={(e) => setFilters({ ...filters, reason: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="">All Reasons</option>
                  <option value="sale">Sale</option>
                  <option value="restock">Restock</option>
                  <option value="adjustment">Adjustment</option>
                  <option value="damage">Damage</option>
                </select>
              </div>
            )}
            <div className="flex items-end">
              <button
                onClick={loadData}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TABS */}
      <div className="bg-white border rounded-lg mb-4 overflow-x-auto">
        <div className="flex">
          <button
            onClick={() => setActiveTab('sales')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === 'sales'
                ? 'border-blue-600 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-600 hover:bg-gray-50'
            }`}
          >
            <ShoppingCart size={18} className="sm:w-5 sm:h-5" />
            <span className="text-sm sm:text-base font-medium">Sales History</span>
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === 'inventory'
                ? 'border-blue-600 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Package size={18} className="sm:w-5 sm:h-5" />
            <span className="text-sm sm:text-base font-medium">Stock Movements</span>
          </button>
        </div>
      </div>

      {/* SALES HISTORY TAB */}
      {activeTab === 'sales' && (
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left text-xs sm:text-sm font-semibold">Date & Time</th>
                  <th className="p-3 text-left text-xs sm:text-sm font-semibold">Sale ID</th>
                  <th className="p-3 text-left text-xs sm:text-sm font-semibold">Cashier</th>
                  <th className="p-3 text-left text-xs sm:text-sm font-semibold">Total</th>
                  <th className="p-3 text-left text-xs sm:text-sm font-semibold">Payment</th>
                  <th className="p-3 text-left text-xs sm:text-sm font-semibold">Items</th>
                </tr>
              </thead>
              <tbody>
                {salesHistory.map((sale) => (
                  <tr key={sale.id} className="border-t hover:bg-gray-50">
                    <td className="p-3 text-xs sm:text-sm">
                      {formatDateTime(sale.created_at)}
                    </td>
                    <td className="p-3 text-xs sm:text-sm font-mono">
                      #{sale.id.toString().padStart(6, '0')}
                    </td>
                    <td className="p-3 text-xs sm:text-sm">
                      {sale.cashier || 'Unknown'}
                    </td>
                    <td className="p-3 text-xs sm:text-sm font-semibold">
                      Ksh. {formatCurrency(sale.total_amount)}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${getPaymentMethodBadge(sale.payment_method)}`}>
                        {sale.payment_method}
                      </span>
                    </td>
                    <td className="p-3 text-xs sm:text-sm text-gray-600">
                      {sale.item_count || 0} item(s)
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {salesHistory.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <ShoppingCart size={48} className="mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No sales recorded yet.</p>
            </div>
          )}
        </div>
      )}

      {/* STOCK MOVEMENTS TAB */}
      {activeTab === 'inventory' && (
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left text-xs sm:text-sm font-semibold">Date & Time</th>
                  <th className="p-3 text-left text-xs sm:text-sm font-semibold">Product</th>
                  <th className="p-3 text-left text-xs sm:text-sm font-semibold">Size</th>
                  <th className="p-3 text-left text-xs sm:text-sm font-semibold">Change</th>
                  <th className="p-3 text-left text-xs sm:text-sm font-semibold">Reason</th>
                  <th className="p-3 text-left text-xs sm:text-sm font-semibold">User</th>
                  <th className="p-3 text-left text-xs sm:text-sm font-semibold">Notes</th>
                </tr>
              </thead>
              <tbody>
                {stockMovements.map((movement) => (
                  <tr key={movement.id} className="border-t hover:bg-gray-50">
                    <td className="p-3 text-xs sm:text-sm">
                      {formatDateTime(movement.created_at)}
                    </td>
                    <td className="p-3 text-xs sm:text-sm font-medium">
                      {movement.product_name || 'Unknown Product'}
                    </td>
                    <td className="p-3 text-xs sm:text-sm">
                      {movement.size_name || 'N/A'}
                    </td>
                    <td className="p-3">
                      <div className={`flex items-center gap-1 ${
                        movement.change > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {movement.change > 0 ? (
                          <TrendingUp size={14} className="sm:w-4 sm:h-4" />
                        ) : (
                          <TrendingDown size={14} className="sm:w-4 sm:h-4" />
                        )}
                        <span className="font-semibold text-xs sm:text-sm">
                          {movement.change > 0 ? '+' : ''}{movement.change}
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${getReasonBadge(movement.reason)}`}>
                        {movement.reason}
                      </span>
                    </td>
                    <td className="p-3 text-xs sm:text-sm">
                      {movement.username || 'System'}
                    </td>
                    <td className="p-3 text-xs sm:text-sm text-gray-600">
                      {movement.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {stockMovements.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Package size={48} className="mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No stock movements recorded yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AuditTrailPage;
/* ============================================================
   REPORTS & ANALYTICS PAGE (ADMIN ONLY) - RESPONSIVE
   Business intelligence and sales reports
   ============================================================ */

import React, { useState, useEffect } from 'react';
import { DollarSign, Calendar, TrendingUp } from 'lucide-react';
import api from '../services/apiService';

const ReportsPage = () => {
  const [dailySales, setDailySales] = useState([]);
  const [productPerformance, setProductPerformance] = useState([]);
  const [paymentReport, setPaymentReport] = useState(null);
  const [days, setDays] = useState(7);

  // Helper function to format currency with commas
  const formatCurrency = (amount) => {
    return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  useEffect(() => {
    loadReports();
  }, [days]);

  const loadReports = async () => {
    try {
      const [daily, products, payments] = await Promise.all([
        api.getDailySales(days),
        api.getProductPerformance(days),
        api.getPaymentMethodReport(days),
      ]);

      setDailySales(daily.report);
      setProductPerformance(products.report);
      setPaymentReport(payments);
    } catch (error) {
      console.error('Failed to load reports:', error);
    }
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">Reports & Analytics</h1>

        <select
          value={days}
          onChange={(e) => setDays(parseInt(e.target.value, 10))}
          className="px-3 sm:px-4 py-2 border rounded-lg text-sm sm:text-base w-full sm:w-auto"
        >
          <option value={7}>Last 7 Days</option>
          <option value={30}>Last 30 Days</option>
          <option value={90}>Last 90 Days</option>
        </select>
      </div>

      {/* ================= PAYMENT METHODS ================= */}
      {paymentReport && (
        <div className="bg-white border rounded-lg p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 flex items-center gap-2">
            <DollarSign size={16} className="sm:w-5 sm:h-5" />
            Payment Methods Breakdown
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
            {Object.entries(paymentReport.report).map(
              ([method, data]) => (
                <div
                  key={method}
                  className="border rounded-lg p-3 sm:p-4"
                >
                  <div className="font-semibold capitalize text-sm sm:text-base">
                    {method}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500">
                    {data.percentage}% of sales
                  </div>
                  <div className="font-bold mt-2 text-sm sm:text-base">
                    Ksh. {formatCurrency(data.total)}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500">
                    {data.transaction_count} transactions
                  </div>
                </div>
              )
            )}
          </div>

          <div className="font-bold text-right text-sm sm:text-base">
            Total Revenue:{' '}
            <span className="text-green-600">
              Ksh. {formatCurrency(paymentReport.total)}
            </span>
          </div>
        </div>
      )}

      {/* ================= DAILY SALES ================= */}
      <div className="bg-white border rounded-lg p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 flex items-center gap-2">
          <Calendar size={16} className="sm:w-5 sm:h-5" />
          Daily Sales
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-semibold">Date</th>
                <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-semibold">Sales</th>
                <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-semibold">Trans.</th>
                <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-semibold">Cash</th>
                <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-semibold">Card</th>
                <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-semibold">Mobile</th>
              </tr>
            </thead>
            <tbody>
              {dailySales.map((day) => (
                <tr
                  key={day.date}
                  className="border-t hover:bg-gray-50"
                >
                  <td className="p-2 sm:p-3 text-xs sm:text-sm">{day.date}</td>
                  <td className="p-2 sm:p-3 font-semibold text-xs sm:text-sm">
                    Ksh. {formatCurrency(day.total_sales)}
                  </td>
                  <td className="p-2 sm:p-3 text-xs sm:text-sm">
                    {day.transaction_count}
                  </td>
                  <td className="p-2 sm:p-3 text-xs sm:text-sm">
                    Ksh. {formatCurrency(day.cash)}
                  </td>
                  <td className="p-2 sm:p-3 text-xs sm:text-sm">
                    Ksh. {formatCurrency(day.card)}
                  </td>
                  <td className="p-2 sm:p-3 text-xs sm:text-sm">
                    Ksh. {formatCurrency(day.mobile)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= TOP PRODUCTS ================= */}
      <div className="bg-white border rounded-lg p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 flex items-center gap-2">
          <TrendingUp size={16} className="sm:w-5 sm:h-5" />
          Top Selling Products
        </h2>

        <div className="space-y-2 sm:space-y-3">
          {productPerformance.map((product, index) => (
            <div
              key={product.product_id || index}
              className="flex justify-between items-center border rounded-lg p-3 sm:p-4"
            >
              <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                <div className="text-base sm:text-xl font-bold text-gray-400 flex-shrink-0">
                  #{index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-sm sm:text-base truncate">
                    {product.product_name}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500">
                    {product.units_sold} units sold
                  </div>
                </div>
              </div>

              <div className="text-right ml-2 flex-shrink-0">
                <div className="font-bold text-sm sm:text-base">
                  Ksh. {formatCurrency(product.revenue)}
                </div>
                <div className="text-xs sm:text-sm text-gray-500">
                  revenue
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
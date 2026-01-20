/* ============================================================
   REPORTS & ANALYTICS PAGE (ADMIN ONLY)
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
    <div className="p-6 space-y-6">
      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Reports & Analytics</h1>

        <select
          value={days}
          onChange={(e) => setDays(parseInt(e.target.value, 10))}
          className="px-4 py-2 border rounded-lg"
        >
          <option value={7}>Last 7 Days</option>
          <option value={30}>Last 30 Days</option>
          <option value={90}>Last 90 Days</option>
        </select>
      </div>

      {/* ================= PAYMENT METHODS ================= */}
      {paymentReport && (
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <DollarSign size={18} />
            Payment Methods Breakdown
          </h2>

          <div className="grid grid-cols-3 gap-4 mb-6">
            {Object.entries(paymentReport.report).map(
              ([method, data]) => (
                <div
                  key={method}
                  className="border rounded-lg p-4"
                >
                  <div className="font-semibold capitalize">
                    {method}
                  </div>
                  <div className="text-sm text-gray-500">
                    {data.percentage}% of sales
                  </div>
                  <div className="font-bold mt-2">
                    ${data.total.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {data.transaction_count} transactions
                  </div>
                </div>
              )
            )}
          </div>

          <div className="font-bold text-right">
            Total Revenue:{' '}
            <span className="text-green-600">
              ${paymentReport.total.toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* ================= DAILY SALES ================= */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Calendar size={18} />
          Daily Sales
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-left">Sales</th>
                <th className="p-3 text-left">Transactions</th>
                <th className="p-3 text-left">Cash</th>
                <th className="p-3 text-left">Card</th>
                <th className="p-3 text-left">Mobile</th>
              </tr>
            </thead>
            <tbody>
              {dailySales.map((day) => (
                <tr
                  key={day.date}
                  className="border-t hover:bg-gray-50"
                >
                  <td className="p-3">{day.date}</td>
                  <td className="p-3 font-semibold">
                    ${day.total_sales.toFixed(2)}
                  </td>
                  <td className="p-3">
                    {day.transaction_count}
                  </td>
                  <td className="p-3">
                    ${day.cash.toFixed(2)}
                  </td>
                  <td className="p-3">
                    ${day.card.toFixed(2)}
                  </td>
                  <td className="p-3">
                    ${day.mobile.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= TOP PRODUCTS ================= */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <TrendingUp size={18} />
          Top Selling Products
        </h2>

        <div className="space-y-3">
          {productPerformance.map((product, index) => (
            <div
              key={product.product_id || index}
              className="flex justify-between items-center border rounded-lg p-4"
            >
              <div className="flex items-center gap-4">
                <div className="text-xl font-bold text-gray-400">
                  #{index + 1}
                </div>
                <div>
                  <div className="font-semibold">
                    {product.product_name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {product.units_sold} units sold
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="font-bold">
                  ${product.revenue.toFixed(2)}
                </div>
                <div className="text-sm text-gray-500">
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

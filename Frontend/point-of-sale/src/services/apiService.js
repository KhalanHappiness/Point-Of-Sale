/* ============================================================
   API SERVICE
   Centralized API calls for all backend endpoints
   ============================================================ */
import { API_BASE_URL } from '../config/api';

const api = {
  async request(endpoint, options = {}) {
    // ✅ Get JWT token stored after login
    const token = localStorage.getItem('token');


    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        // ✅ Attach Authorization header if token exists
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  },

  /* ------------------
     PRODUCT ENDPOINTS
     ------------------ */
  getProducts: (activeOnly = true) => 
    api.request(`/products?active_only=${activeOnly ? 'true' : 'false'}`),

  searchProducts: (query, activeOnly = true) => 
   api.request(`/products/search?q=${query}&active_only=${activeOnly ? 'true' : 'false'}`),

  
  createProduct: (data) => 
    api.request('/products', { method: 'POST', body: JSON.stringify(data) }),
  
  updateProduct: (id, data) => 
    api.request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  
  deleteProduct: (id) => 
    api.request(`/products/${id}`, { method: 'DELETE' }),

  /* ------------------
     SALES ENDPOINTS
     ------------------ */
  createSale: (data) => 
    api.request('/sales', { method: 'POST', body: JSON.stringify(data) }),
  
  getSales: (limit = 100, offset = 0) => 
    api.request(`/sales?limit=${limit}&offset=${offset}`),
  
  getSale: (id) => 
    api.request(`/sales/${id}`),

  /* ------------------
     INVENTORY ENDPOINTS
     ------------------ */
  getInventory: () => 
    api.request('/inventory'),
  
  adjustInventory: (data) => 
    api.request('/inventory/adjust', { method: 'POST', body: JSON.stringify(data) }),
  
  getStockMovements: (productId = null, limit = 100) => {
    const params = new URLSearchParams({ limit });
    if (productId) params.append('product_id', productId);
    return api.request(`/inventory/movements?${params}`);
  },

  /* ------------------
     REPORT ENDPOINTS
     ------------------ */
  getDailySales: (days = 7) => 
    api.request(`/reports/daily?days=${days}`),
  
  getProductPerformance: (days = 30, limit = 20) => 
    api.request(`/reports/products?days=${days}&limit=${limit}`),
  
  getPaymentMethodReport: (days = 30) => 
    api.request(`/reports/payments?days=${days}`),
};

export default api;

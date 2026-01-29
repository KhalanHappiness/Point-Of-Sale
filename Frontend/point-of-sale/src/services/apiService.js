/* ============================================================
   API SERVICE - UPDATED FOR VARIANTS
   Centralized API calls for all backend endpoints
   ============================================================ */
import { API_BASE_URL } from '../config/api';

const api = {
  async request(endpoint, options = {}) {
    const token = localStorage.getItem('token');

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
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
     CATEGORY ENDPOINTS (NEW)
     ------------------ */
  getCategories: (activeOnly = true) => 
    api.request(`/categories?active_only=${activeOnly ? 'true' : 'false'}`),
  
  createCategory: (data) => 
    api.request('/categories', { method: 'POST', body: JSON.stringify(data) }),
  
  updateCategory: (id, data) => 
    api.request(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  
  deleteCategory: (id) => 
    api.request(`/categories/${id}`, { method: 'DELETE' }),

  /* ------------------
     BRAND ENDPOINTS (NEW)
     ------------------ */
  getBrands: (activeOnly = true) => 
    api.request(`/brands?active_only=${activeOnly ? 'true' : 'false'}`),
  
  createBrand: (data) => 
    api.request('/brands', { method: 'POST', body: JSON.stringify(data) }),
  
  updateBrand: (id, data) => 
    api.request(`/brands/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  
  deleteBrand: (id) => 
    api.request(`/brands/${id}`, { method: 'DELETE' }),

  /* ------------------
     SIZE ENDPOINTS (NEW)
     ------------------ */
  getSizes: (activeOnly = true) => 
    api.request(`/sizes?active_only=${activeOnly ? 'true' : 'false'}`),
  
  createSize: (data) => 
    api.request('/sizes', { method: 'POST', body: JSON.stringify(data) }),
  
  updateSize: (id, data) => 
    api.request(`/sizes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  
  deleteSize: (id) => 
    api.request(`/sizes/${id}`, { method: 'DELETE' }),

  /* ------------------
     SALES ENDPOINTS (UPDATED FOR VARIANTS)
     ------------------ */
  createSale: (data) => 
    api.request('/sales', { method: 'POST', body: JSON.stringify(data) }),
  
  getSales: (limit = 100, offset = 0) => 
    api.request(`/sales?limit=${limit}&offset=${offset}`),
  
  getSale: (id) => 
    api.request(`/sales/${id}`),

  /* ------------------
     INVENTORY ENDPOINTS (UPDATED FOR VARIANTS)
     ------------------ */
  getInventory: () => 
    api.request('/inventory'),
  
  adjustInventory: (data) => 
    api.request('/inventory/adjust', { method: 'POST', body: JSON.stringify(data) }),
  
  getStockMovements: (variantId = null, productId = null, limit = 100) => {
    const params = new URLSearchParams({ limit });
    if (variantId) params.append('variant_id', variantId);
    if (productId) params.append('product_id', productId);
    return api.request(`/inventory/movements?${params}`);
  },

  /* ------------------
     USER/AUTH ENDPOINTS
     ------------------ */
  registerUser: (data) => 
    api.request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  getUsers: () => 
    api.request('/auth/users'),

  getCurrentUser: () => 
    api.request('/auth/me'),

  updateUser: (id, data) => 
    api.request(`/auth/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteUser: (id) => 
    api.request(`/auth/users/${id}`, { method: 'DELETE' }),

  /* ------------------
     REPORT ENDPOINTS
     ------------------ */
  getDailySales: (days = 7) => 
    api.request(`/reports/daily?days=${days}`),
  
  getProductPerformance: (days = 30, limit = 20) => 
    api.request(`/reports/products?days=${days}&limit=${limit}`),
  
  getPaymentMethodReport: (days = 30) => 
    api.request(`/reports/payments?days=${days}`),
  
  getCashierSales: (days) => 
    api.request(`/reports/cashiers?days=${days}`),
};

export default api;
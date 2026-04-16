const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Generic fetch wrapper with error handling
const fetchAPI = async (endpoint) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    throw error;
  }
};

export const api = {
  // Get all products
  getProducts: () => fetchAPI('/products'),

  // Get sales history data
  getSalesHistory: () => fetchAPI('/sales-history'),

  // Get demand forecasts
  getForecasts: () => fetchAPI('/forecasts'),

  // Get current inventory
  getInventory: () => fetchAPI('/inventory'),

  // Get KPI metrics
  getKPIs: () => fetchAPI('/kpis'),

  // Get regional demand data
  getRegionalDemand: () => fetchAPI('/regional-demand'),

  // Get forecast vs actual comparison
  getForecastComparison: () => fetchAPI('/forecast-comparison'),

  // Get inventory health status
  getInventoryHealth: () => fetchAPI('/inventory-health'),

  // Health check
  checkHealth: () => fetchAPI('/health'),
};

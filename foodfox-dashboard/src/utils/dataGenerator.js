// Mock data generator for FoodFox Foods Dashboard
export const generateMockData = () => {
  const products = [
    { id: 1, name: 'Organic Protein Bars', category: 'Snacks', shelf_life: 180 },
    { id: 2, name: 'Berry Smoothie Mix', category: 'Beverages', shelf_life: 365 },
    { id: 3, name: 'Frozen Veggie Wraps', category: 'Frozen', shelf_life: 270 },
    { id: 4, name: 'Almond Energy Bites', category: 'Snacks', shelf_life: 150 },
    { id: 5, name: 'Kombucha Blend', category: 'Beverages', shelf_life: 90 },
    { id: 6, name: 'Quinoa Bowls', category: 'Frozen', shelf_life: 300 },
  ]

  const regions = ['North', 'South', 'East', 'West', 'Central']
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  // Generate historical sales data
  const salesHistory = []
  for (let i = 0; i < 12; i++) {
    for (const product of products) {
      for (const region of regions) {
        salesHistory.push({
          month: months[i],
          product_id: product.id,
          product_name: product.name,
          region,
          actual_quantity: Math.floor(Math.random() * 500) + 100,
          is_promotion: Math.random() > 0.7,
        })
      }
    }
  }

  // Generate demand forecasts
  const forecasts = []
  for (const product of products) {
    for (const region of regions) {
      for (let i = 0; i < 6; i++) {
        forecasts.push({
          product_id: product.id,
          product_name: product.name,
          region,
          month: months[(new Date().getMonth() + i) % 12],
          predicted_quantity: Math.floor(Math.random() * 600) + 150,
          confidence: (Math.random() * 25 + 75).toFixed(2),
        })
      }
    }
  }

  // Generate inventory data
  const inventory = products.map(product => ({
    product_id: product.id,
    product_name: product.name,
    category: product.category,
    current_stock: Math.floor(Math.random() * 1000) + 200,
    shelf_life_days: product.shelf_life,
    reorder_point: 300,
  }))

  // Calculate KPIs
  const mape = (Math.random() * 15 + 8).toFixed(2) // Mean Absolute Percentage Error
  const spoilageRate = (Math.random() * 12 + 3).toFixed(2) // Percentage
  const otif = (Math.random() * 8 + 88).toFixed(2) // On-Time In-Full percentage
  const promotionLift = (Math.random() * 35 + 15).toFixed(2) // Percentage increase
  const revenueAtRisk = Math.floor(Math.random() * 500000) + 100000 // Dollar amount

  return {
    products,
    salesHistory,
    forecasts,
    inventory,
    kpis: {
      mape: parseFloat(mape),
      spoilageRate: parseFloat(spoilageRate),
      otif: parseFloat(otif),
      promotionLift: parseFloat(promotionLift),
      revenueAtRisk,
    },
    regions,
  }
}

// Calculate metrics for KPI cards
export const calculateMetrics = (data) => {
  return {
    forecastAccuracy: ((100 - data.kpis.mape).toFixed(2)),
    spoilageRisk: data.kpis.spoilageRate,
    otif: data.kpis.otif,
    promotionLift: data.kpis.promotionLift,
  }
}

// Filter data based on selected filters
export const filterData = (data, filters) => {
  let filteredSales = data.salesHistory
  let filteredForecasts = data.forecasts
  let filteredInventory = data.inventory

  const forecastsHaveRegion = filteredForecasts.some(
    f => typeof f.region === 'string' && f.region.length > 0
  )

  if (filters.region !== 'All') {
    filteredSales = filteredSales.filter(s => s.region === filters.region)
    if (forecastsHaveRegion) {
      filteredForecasts = filteredForecasts.filter(f => f.region === filters.region)
    }
  }

  if (filters.category !== 'All') {
    filteredInventory = filteredInventory.filter(i => i.category === filters.category)
    const categoryProductIds = filteredInventory.map(i => i.product_id)
    filteredSales = filteredSales.filter(s => categoryProductIds.includes(s.product_id))
    filteredForecasts = filteredForecasts.filter(f => categoryProductIds.includes(f.product_id))
  }

  return { filteredSales, filteredForecasts, filteredInventory }
}

// Calculate regional demand heatmap data
export const calculateRegionalDemand = (data) => {
  const regionDemand = {}
  
  data.regions.forEach(region => {
    const regionData = data.salesHistory.filter(s => s.region === region)
    const totalDemand = regionData.reduce((sum, s) => sum + s.actual_quantity, 0)
    const avgDemand = Math.round(totalDemand / regionData.length) || 0
    
    regionDemand[region] = {
      demand: avgDemand,
      stockout_risk: Math.random() > 0.7 ? 'High' : 'Low',
    }
  })
  
  return regionDemand
}

import { useState, useContext, createContext, useEffect } from 'react'
import './App.css'
import KPIContainer from './components/KPIContainer'
import ForecastChart from './components/ForecastChart'
import InventoryHealthTable from './components/InventoryHealthTable'
import FilterSidebar from './components/FilterSidebar'
import RegionalHeatmap from './components/RegionalHeatmap'
import { api } from './services/api'
import { generateMockData } from './utils/dataGenerator'

// Import ERP Modules
import ProcurementModule from './components/modules/ProcurementModule'
import WarehouseModule from './components/modules/WarehouseModule'
import OrdersModule from './components/modules/OrdersModule'
import SuppliersModule from './components/modules/SuppliersModule'
import AnalyticsModule from './components/modules/AnalyticsModule'

export const DashboardContext = createContext()

function App() {
  const [activeModule, setActiveModule] = useState('dashboard')
  const [filters, setFilters] = useState({
    region: 'All',
    category: 'All',
    timeRange: '6months'
  })

  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Try to fetch real data from backend API
        const [products, salesHistory, forecasts, inventory, kpis, regionalDemand] = await Promise.all([
          api.getProducts(),
          api.getSalesHistory(),
          api.getForecasts(),
          api.getInventory(),
          api.getKPIs(),
          api.getRegionalDemand()
        ])

        // Transform API data to match component expectations
        const regions = [...new Set(salesHistory.map(s => s.region))].filter(Boolean)

        const data = {
          products,
          salesHistory: salesHistory.map(s => ({
            ...s,
            month_name: s.month_name || s.month,
            product_id: s.product_id,
            product_name: s.product_name,
            region: s.region,
            actual_quantity: s.actual_quantity,
            is_promotion: s.is_promotion,
            sale_date: s.sale_date
          })),
          forecasts: forecasts.map(f => ({
            ...f,
            month_name: f.month_name || f.month,
            product_id: f.product_id,
            product_name: f.product_name,
            predicted_quantity: f.predicted_quantity,
            confidence: f.confidence_interval,
            forecast_date: f.forecast_date
          })),
          inventory,
          kpis,
          regions,
          regionalDemand
        }

        setDashboardData(data)
      } catch (err) {
        console.error('Failed to fetch real data, using mock data:', err)
        const mockData = generateMockData()
        setDashboardData(mockData)
        setError('Using sample data - Backend connection unavailable')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters)
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading FoodFox ERP System...</p>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="loading-container">
        <div className="error-message">
          <p>❌ Failed to load dashboard data</p>
        </div>
      </div>
    )
  }

  return (
    <DashboardContext.Provider value={{ filters, dashboardData, activeModule }}>
      <div className="app">
        <header className="app-header">
          <div className="header-content">
            <h1 className="app-title">🦊 FoodFox Foods</h1>
            <p className="app-subtitle">Enterprise Supply Chain Management System</p>
          </div>
          <div className="header-meta">
            <span className="company-info">Real-time ERP & Analytics Platform</span>
            {error && <span className="connection-status warning">{error}</span>}
          </div>
        </header>

        <nav className="main-nav">
          <button 
            className={`nav-btn ${activeModule === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveModule('dashboard')}
          >
            📊 Dashboard
          </button>
          <button 
            className={`nav-btn ${activeModule === 'procurement' ? 'active' : ''}`}
            onClick={() => setActiveModule('procurement')}
          >
            🛒 Procurement
          </button>
          <button 
            className={`nav-btn ${activeModule === 'warehouse' ? 'active' : ''}`}
            onClick={() => setActiveModule('warehouse')}
          >
            🏭 Warehouse
          </button>
          <button 
            className={`nav-btn ${activeModule === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveModule('orders')}
          >
            📦 Orders
          </button>
          <button 
            className={`nav-btn ${activeModule === 'suppliers' ? 'active' : ''}`}
            onClick={() => setActiveModule('suppliers')}
          >
            🤝 Suppliers
          </button>
          <button 
            className={`nav-btn ${activeModule === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveModule('analytics')}
          >
            📈 Analytics
          </button>
        </nav>

        {activeModule === 'dashboard' && (
          <div className="dashboard-layout">
            <FilterSidebar onFilterChange={handleFilterChange} />
            
            <main className="main-content">
              <section className="kpi-section">
                <KPIContainer />
              </section>

              <section className="charts-section">
                <div className="chart-container">
                  <ForecastChart />
                </div>
                <div className="chart-container">
                  <RegionalHeatmap />
                </div>
              </section>

              <section className="inventory-section">
                <InventoryHealthTable />
              </section>
            </main>
          </div>
        )}

        {activeModule === 'procurement' && <ProcurementModule />}
        {activeModule === 'warehouse' && <WarehouseModule />}
        {activeModule === 'orders' && <OrdersModule />}
        {activeModule === 'suppliers' && <SuppliersModule />}
        {activeModule === 'analytics' && <AnalyticsModule />}

        <footer className="app-footer">
          <p>&copy; 2026 FoodFox Foods - Enterprise Supply Chain Management System</p>
        </footer>
      </div>
    </DashboardContext.Provider>
  )
}

export default App

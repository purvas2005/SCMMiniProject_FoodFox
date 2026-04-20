import { useContext, useMemo } from 'react'
import { DashboardContext } from '../App'
import { filterData } from '../utils/dataGenerator'
import { filterForecastsByDateRange } from '../utils/dateFilters'
import './InventoryHealthTable.css'

const InventoryHealthTable = () => {
  const { dashboardData, filters } = useContext(DashboardContext)
  const { filteredInventory, filteredForecasts: regionFilteredForecasts } = useMemo(() => 
    filterData(dashboardData, filters), 
    [dashboardData, filters]
  )

  // Filter forecasts by time range
  const filteredForecasts = useMemo(() =>
    filterForecastsByDateRange(regionFilteredForecasts, filters.timeRange),
    [regionFilteredForecasts, filters.timeRange]
  )

  // Calculate stockout risk for each product
  const inventoryHealth = useMemo(() => {
    return filteredInventory.map(item => {
      // Get average predicted demand for this product from the filtered time range
      const productForecasts = filteredForecasts.filter(f => f.product_id === item.product_id)
      const avgPredicted = productForecasts.length > 0 
        ? Math.round(productForecasts.reduce((sum, f) => sum + f.predicted_quantity, 0) / productForecasts.length)
        : 0

      const stockDays = item.current_stock > 0 && avgPredicted > 0 
        ? Math.round((item.current_stock / avgPredicted) * 30)
        : item.current_stock > 0 ? 999 : 0
      
      const spoilageRisk = item.shelf_life_days - stockDays
      
      return {
        ...item,
        predicted_demand: avgPredicted,
        stock_days: stockDays,
        spoilage_risk_days: spoilageRisk,
        stockout_risk: item.current_stock < item.reorder_point ? 'HIGH' : 'MEDIUM',
        health_status: item.current_stock > item.reorder_point * 1.5 ? 'Healthy' : 
                       item.current_stock >= item.reorder_point ? 'Monitor' : 'Critical',
      }
    }).sort((a, b) => {
      // Prioritize critical items
      const statusOrder = { 'Critical': 0, 'Monitor': 1, 'Healthy': 2 }
      return statusOrder[a.health_status] - statusOrder[b.health_status]
    })
  }, [filteredInventory, filteredForecasts])

  const getStatusColor = (status) => {
    const colors = {
      'Healthy': '#2ecc71',
      'Monitor': '#f39c12',
      'Critical': '#e74c3c',
    }
    return colors[status] || '#95a5a6'
  }

  const getTimeRangeLabel = () => {
    switch (filters.timeRange) {
      case '3months':
        return 'Last 3 Months'
      case '6months':
        return 'Last 6 Months'
      case '12months':
        return 'Last 12 Months'
      case 'ytd':
        return 'Year to Date'
      default:
        return '6-Month'
    }
  }

  return (
    <div className="inventory-health-table">
      <div className="table-header">
        <h2>Inventory Health & Stockout Prevention</h2>
        <p>{getTimeRangeLabel()} Forecast - Products requiring immediate attention highlighted in red</p>
      </div>

      <div className="table-wrapper">
        <table className="health-table">
          <thead>
            <tr>
              <th>Product Name</th>
              <th>Category</th>
              <th>Current Stock</th>
              <th>Predicted Demand (Avg)</th>
              <th>Stock Days Left</th>
              <th>Shelf Life (Days)</th>
              <th>Spoilage Risk</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {inventoryHealth.map((item, idx) => (
              <tr key={idx} className={`inventory-row status-${item.health_status.toLowerCase()}`}>
                <td className="product-name">
                  <strong>{item.product_name}</strong>
                </td>
                <td>{item.category}</td>
                <td className="stock-value">{item.current_stock} units</td>
                <td className="demand-value">{item.predicted_demand} units</td>
                <td>
                  <span className={`stock-days ${item.stock_days < 15 ? 'warning' : ''}`}>
                    {item.stock_days} days
                  </span>
                </td>
                <td>{item.shelf_life_days} days</td>
                <td>
                  <span 
                    className="spoilage-risk"
                    style={{ 
                      color: item.spoilage_risk_days < 30 ? '#e74c3c' : item.spoilage_risk_days < 90 ? '#f39c12' : '#2ecc71'
                    }}
                  >
                    {item.spoilage_risk_days > 0 ? `${item.spoilage_risk_days} days` : 'EXPIRED'}
                  </span>
                </td>
                <td>
                  <span 
                    className={`status-badge ${item.health_status.toLowerCase()}`}
                    style={{ backgroundColor: getStatusColor(item.health_status) }}
                  >
                    {item.health_status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="table-legend">
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#2ecc71' }}></span>
          <span>Healthy - Stock levels adequate</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#f39c12' }}></span>
          <span>Monitor - Approaching reorder point</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#e74c3c' }}></span>
          <span>Critical - Urgent action required</span>
        </div>
      </div>
    </div>
  )
}

export default InventoryHealthTable

import React, { useState } from 'react'
import './ModuleStyles.css'

const WarehouseModule = () => {
  const [activeTab, setActiveTab] = useState('inventory')

  const warehouseLocations = [
    { id: 'WH-001', name: 'North Hub', city: 'Mumbai', capacity: 5000, utilized: 3850, utilization: '77%' },
    { id: 'WH-002', name: 'South Distribution', city: 'Bangalore', capacity: 4000, utilized: 2275, utilization: '57%' },
    { id: 'WH-003', name: 'West Terminal', city: 'Ahmedabad', capacity: 3500, utilized: 2960, utilization: '85%' },
    { id: 'WH-004', name: 'East Center', city: 'Kolkata', capacity: 2500, utilized: 1875, utilization: '75%' },
  ]

  const inventoryByLocation = [
    { warehouse: 'North Hub', frozen: 1200, beverages: 950, snacks: 850, dairy: 850, total: 3850 },
    { warehouse: 'South Distribution', frozen: 680, beverages: 560, snacks: 540, dairy: 495, total: 2275 },
    { warehouse: 'West Terminal', frozen: 1100, beverages: 820, snacks: 680, dairy: 360, total: 2960 },
    { warehouse: 'East Center', frozen: 700, beverages: 450, snacks: 420, dairy: 305, total: 1875 },
  ]

  const stockAlerts = [
    { product: 'Frozen Veggie Wraps', warehouse: 'South Distribution', current: 85, reorder: 300, status: 'Critical', action: 'Reorder Now' },
    { product: 'Berry Smoothie Mix', warehouse: 'East Center', current: 120, reorder: 250, status: 'Low', action: 'Reorder Soon' },
    { product: 'Organic Protein Bars', warehouse: 'North Hub', current: 2500, reorder: 500, status: 'Excess', action: 'Reduce Orders' },
    { product: 'Kombucha Blend', warehouse: 'West Terminal', current: 95, reorder: 200, status: 'Critical', action: 'Urgent Reorder' },
  ]

  const storageCosts = [
    { month: 'January', cold_storage: 8500, dry_storage: 5200, handling: 3100, total: 16800 },
    { month: 'February', cold_storage: 9200, dry_storage: 5400, handling: 3200, total: 17800 },
    { month: 'March', cold_storage: 9800, dry_storage: 5600, handling: 3300, total: 18700 },
    { month: 'April', cold_storage: 10200, dry_storage: 5800, handling: 3400, total: 19400 },
  ]

  return (
    <div className="module-container">
      <div className="module-header">
        <h2>🏭 Warehouse Management</h2>
        <div className="header-stats">
          <div className="stat-box">
            <span className="stat-label">Total Warehouses</span>
            <span className="stat-value">4</span>
          </div>
          <div className="stat-box">
            <span className="stat-label">Avg Utilization</span>
            <span className="stat-value">73.5%</span>
          </div>
          <div className="stat-box">
            <span className="stat-label">Total Inventory</span>
            <span className="stat-value">10,960 units</span>
          </div>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => setActiveTab('inventory')}>📦 Inventory Status</button>
        <button className={`tab ${activeTab === 'locations' ? 'active' : ''}`} onClick={() => setActiveTab('locations')}>📍 Warehouse Locations</button>
        <button className={`tab ${activeTab === 'alerts' ? 'active' : ''}`} onClick={() => setActiveTab('alerts')}>⚠️ Stock Alerts</button>
        <button className={`tab ${activeTab === 'costs' ? 'active' : ''}`} onClick={() => setActiveTab('costs')}>💰 Storage Costs</button>
      </div>

      {activeTab === 'inventory' && (
        <div className="tab-content">
          <div className="inventory-grid">
            {inventoryByLocation.map((loc, idx) => (
              <div key={idx} className="inventory-card">
                <h4>{loc.warehouse}</h4>
                <div className="inventory-breakdown">
                  <div className="item-row">
                    <span>🧊 Frozen:</span>
                    <strong>{loc.frozen}</strong>
                  </div>
                  <div className="item-row">
                    <span>🥤 Beverages:</span>
                    <strong>{loc.beverages}</strong>
                  </div>
                  <div className="item-row">
                    <span>🍪 Snacks:</span>
                    <strong>{loc.snacks}</strong>
                  </div>
                  <div className="item-row">
                    <span>🥛 Dairy:</span>
                    <strong>{loc.dairy}</strong>
                  </div>
                  <div className="inventory-total">
                    Total: {loc.total} units
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'locations' && (
        <div className="tab-content">
          <table className="data-table">
            <thead>
              <tr>
                <th>Warehouse ID</th>
                <th>Location</th>
                <th>Capacity (units)</th>
                <th>Utilized</th>
                <th>Utilization %</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {warehouseLocations.map((wh) => (
                <tr key={wh.id}>
                  <td><strong>{wh.id}</strong></td>
                  <td>{wh.name}, {wh.city}</td>
                  <td>{wh.capacity.toLocaleString()}</td>
                  <td>{wh.utilized.toLocaleString()}</td>
                  <td>
                    <div className="utilization-bar">
                      <div className="bar-fill" style={{width: wh.utilization, backgroundColor: wh.utilization > '80%' ? '#ff9800' : '#4caf50'}}></div>
                      <span>{wh.utilization}</span>
                    </div>
                  </td>
                  <td>
                    <span className="status-badge" style={{backgroundColor: wh.utilization > '80%' ? '#ff9800' : '#4caf50'}}>
                      {wh.utilization > '80%' ? 'High' : 'Optimal'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'alerts' && (
        <div className="tab-content">
          <div className="alert-notice">
            <strong>⚠️ 4 Stock Alerts Detected</strong> - Immediate action required for 2 products
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Warehouse</th>
                <th>Current Stock</th>
                <th>Reorder Point</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {stockAlerts.map((alert, idx) => (
                <tr key={idx}>
                  <td><strong>{alert.product}</strong></td>
                  <td>{alert.warehouse}</td>
                  <td>{alert.current}</td>
                  <td>{alert.reorder}</td>
                  <td>
                    <span className="status-badge" style={{backgroundColor: alert.status === 'Critical' ? '#e74c3c' : alert.status === 'Low' ? '#ff9800' : '#2196f3'}}>
                      {alert.status}
                    </span>
                  </td>
                  <td>
                    <button className={`btn-small ${alert.status === 'Critical' ? 'btn-danger' : ''}`}>
                      {alert.action}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'costs' && (
        <div className="tab-content">
          <div className="insight-box">
            <h4>📌 Monthly Storage Cost Trend</h4>
            <p>Cold storage, dry storage, and handling costs breakdown</p>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Cold Storage</th>
                <th>Dry Storage</th>
                <th>Handling Costs</th>
                <th>Total</th>
                <th>Trend</th>
              </tr>
            </thead>
            <tbody>
              {storageCosts.map((cost, idx) => (
                <tr key={idx}>
                  <td><strong>{cost.month}</strong></td>
                  <td>${cost.cold_storage.toLocaleString()}</td>
                  <td>${cost.dry_storage.toLocaleString()}</td>
                  <td>${cost.handling.toLocaleString()}</td>
                  <td><strong>${cost.total.toLocaleString()}</strong></td>
                  <td style={{color: '#ff9800'}}>↑ +3.5%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default WarehouseModule

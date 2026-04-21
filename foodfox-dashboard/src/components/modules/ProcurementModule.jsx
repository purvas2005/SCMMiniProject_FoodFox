import React, { useState } from 'react'
import './ModuleStyles.css'

const ProcurementModule = () => {
  const [activeTab, setActiveTab] = useState('purchase-orders')
  const [showNewPO, setShowNewPO] = useState(false)

  const purchaseOrders = [
    { id: 'PO-2026-001', supplier: 'GreenField Farms', items: 5, total: '$12,500', status: 'Delivered', date: '2026-04-10' },
    { id: 'PO-2026-002', supplier: 'Coastal Imports', items: 3, total: '$8,750', status: 'In Transit', date: '2026-04-15' },
    { id: 'PO-2026-003', supplier: 'Alpine Foods', items: 8, total: '$22,100', status: 'Pending', date: '2026-04-18' },
    { id: 'PO-2026-004', supplier: 'Valley Produce', items: 4, total: '$9,200', status: 'Processing', date: '2026-04-19' },
    { id: 'PO-2026-005', supplier: 'Organic Direct', items: 6, total: '$15,600', status: 'Confirmed', date: '2026-04-20' },
  ]

  const procurementPlan = [
    { category: 'Frozen Foods', q1: 45000, q2: 52000, q3: 48000, q4: 61000, trend: '↑ +8%' },
    { category: 'Beverages', q1: 32000, q2: 38000, q3: 35000, q4: 42000, trend: '↑ +6%' },
    { category: 'Snacks', q1: 28000, q2: 31000, q3: 29000, q4: 35000, trend: '↑ +5%' },
    { category: 'Dairy', q1: 22000, q2: 25000, q3: 23000, q4: 28000, trend: '↑ +4%' },
  ]

  const vendorPerformance = [
    { vendor: 'GreenField Farms', orders: 12, onTime: '98%', quality: 'A+', costSavings: '$2,400' },
    { vendor: 'Coastal Imports', orders: 8, onTime: '95%', quality: 'A', costSavings: '$1,200' },
    { vendor: 'Alpine Foods', orders: 15, onTime: '92%', quality: 'B+', costSavings: '$1,800' },
    { vendor: 'Valley Produce', orders: 6, onTime: '97%', quality: 'A+', costSavings: '$900' },
  ]

  const statusColor = (status) => {
    const colors = {
      'Delivered': '#4caf50',
      'In Transit': '#2196f3',
      'Pending': '#ff9800',
      'Processing': '#9c27b0',
      'Confirmed': '#00bcd4'
    }
    return colors[status] || '#999'
  }

  return (
    <div className="module-container">
      <div className="module-header">
        <h2>🛒 Procurement Management</h2>
        <button className="btn-primary" onClick={() => setShowNewPO(!showNewPO)}>
          + Create Purchase Order
        </button>
      </div>

      {showNewPO && (
        <div className="form-section">
          <h3>New Purchase Order</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Supplier *</label>
              <select>
                <option>Select Supplier</option>
                <option>GreenField Farms</option>
                <option>Coastal Imports</option>
                <option>Alpine Foods</option>
              </select>
            </div>
            <div className="form-group">
              <label>PO Date *</label>
              <input type="date" />
            </div>
            <div className="form-group">
              <label>Delivery Date *</label>
              <input type="date" />
            </div>
            <div className="form-group">
              <label>Category *</label>
              <select>
                <option>Frozen Foods</option>
                <option>Beverages</option>
                <option>Snacks</option>
                <option>Dairy</option>
              </select>
            </div>
          </div>
          <button className="btn-primary">Create PO</button>
        </div>
      )}

      <div className="tabs">
        <button className={`tab ${activeTab === 'purchase-orders' ? 'active' : ''}`} onClick={() => setActiveTab('purchase-orders')}>📋 Purchase Orders</button>
        <button className={`tab ${activeTab === 'procurement-plan' ? 'active' : ''}`} onClick={() => setActiveTab('procurement-plan')}>📊 Procurement Plan</button>
        <button className={`tab ${activeTab === 'vendor-performance' ? 'active' : ''}`} onClick={() => setActiveTab('vendor-performance')}>⭐ Vendor Performance</button>
      </div>

      {activeTab === 'purchase-orders' && (
        <div className="tab-content">
          <table className="data-table">
            <thead>
              <tr>
                <th>PO Number</th>
                <th>Supplier</th>
                <th>Items</th>
                <th>Total Amount</th>
                <th>Status</th>
                <th>Order Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {purchaseOrders.map((po) => (
                <tr key={po.id}>
                  <td><strong>{po.id}</strong></td>
                  <td>{po.supplier}</td>
                  <td>{po.items}</td>
                  <td><strong>{po.total}</strong></td>
                  <td>
                    <span className="status-badge" style={{backgroundColor: statusColor(po.status)}}>
                      {po.status}
                    </span>
                  </td>
                  <td>{po.date}</td>
                  <td>
                    <button className="btn-small">View</button>
                    <button className="btn-small">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'procurement-plan' && (
        <div className="tab-content">
          <div className="insight-box">
            <h4>📌 Quarterly Procurement Forecast</h4>
            <p>Budget allocation and planned purchases by category for 2026</p>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Q1 Budget</th>
                <th>Q2 Budget</th>
                <th>Q3 Budget</th>
                <th>Q4 Budget</th>
                <th>Trend</th>
              </tr>
            </thead>
            <tbody>
              {procurementPlan.map((plan, idx) => (
                <tr key={idx}>
                  <td><strong>{plan.category}</strong></td>
                  <td>${plan.q1.toLocaleString()}</td>
                  <td>${plan.q2.toLocaleString()}</td>
                  <td>${plan.q3.toLocaleString()}</td>
                  <td>${plan.q4.toLocaleString()}</td>
                  <td><span style={{color: '#4caf50', fontWeight: 'bold'}}>{plan.trend}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'vendor-performance' && (
        <div className="tab-content">
          <table className="data-table">
            <thead>
              <tr>
                <th>Vendor Name</th>
                <th>Orders</th>
                <th>On-Time %</th>
                <th>Quality Score</th>
                <th>Cost Savings</th>
              </tr>
            </thead>
            <tbody>
              {vendorPerformance.map((vendor, idx) => (
                <tr key={idx}>
                  <td><strong>{vendor.vendor}</strong></td>
                  <td>{vendor.orders}</td>
                  <td><span style={{color: '#4caf50'}}>{vendor.onTime}</span></td>
                  <td><span className="quality-badge">{vendor.quality}</span></td>
                  <td><strong>{vendor.costSavings}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default ProcurementModule

import React, { useState } from 'react'
import './ModuleStyles.css'

const OrdersModule = () => {
  const [activeTab, setActiveTab] = useState('sales-orders')

  const salesOrders = [
    { id: 'SO-2026-501', customer: 'Retail Chain Alpha', items: 12, amount: '$8,450', status: 'Delivered', dueDate: '2026-04-10' },
    { id: 'SO-2026-502', customer: 'Metro Supermarket', items: 8, amount: '$5,920', status: 'Shipped', dueDate: '2026-04-22' },
    { id: 'SO-2026-503', customer: 'Local Store Network', items: 5, amount: '$3,750', status: 'Processing', dueDate: '2026-04-25' },
    { id: 'SO-2026-504', customer: 'Convenience Plus', items: 15, amount: '$11,250', status: 'Confirmed', dueDate: '2026-04-28' },
    { id: 'SO-2026-505', customer: 'Premium Retailers', items: 20, amount: '$15,800', status: 'Pending', dueDate: '2026-05-05' },
  ]

  const fulfillmentMetrics = [
    { metric: 'Order Fulfillment Rate', value: 97.3, benchmark: 95, status: 'Above Target', unit: '%' },
    { metric: 'Average Delivery Time', value: 3.2, benchmark: 4, status: 'Above Target', unit: 'days' },
    { metric: 'On-Time Delivery %', value: 96.8, benchmark: 95, status: 'Above Target', unit: '%' },
    { metric: 'Order Accuracy', value: 99.1, benchmark: 98, status: 'Above Target', unit: '%' },
  ]

  const returnAnalysis = [
    { month: 'January', total_orders: 156, returns: 4, rate: 2.6 },
    { month: 'February', total_orders: 163, returns: 3, rate: 1.8 },
    { month: 'March', total_orders: 171, returns: 5, rate: 2.9 },
    { month: 'April', total_orders: 148, returns: 2, rate: 1.4 },
  ]

  const customerOrders = [
    { customer: 'Retail Chain Alpha', orders: 45, value: '$285,000', avg_order: '$6,333', loyalty: 'Gold' },
    { customer: 'Metro Supermarket', orders: 38, value: '$228,800', avg_order: '$6,021', loyalty: 'Gold' },
    { customer: 'Local Store Network', orders: 22, value: '$99,000', avg_order: '$4,500', loyalty: 'Silver' },
    { customer: 'Convenience Plus', orders: 18, value: '$72,000', avg_order: '$4,000', loyalty: 'Silver' },
    { customer: 'Premium Retailers', orders: 15, value: '$105,000', avg_order: '$7,000', loyalty: 'Platinum' },
  ]

  const statusColor = (status) => {
    const colors = {
      'Delivered': '#4caf50',
      'Shipped': '#2196f3',
      'Processing': '#9c27b0',
      'Confirmed': '#00bcd4',
      'Pending': '#ff9800'
    }
    return colors[status] || '#999'
  }

  return (
    <div className="module-container">
      <div className="module-header">
        <h2>📦 Order Management</h2>
        <button className="btn-primary">+ Create New Order</button>
      </div>

      <div className="metrics-row">
        {fulfillmentMetrics.map((m, idx) => (
          <div key={idx} className="metric-card">
            <div className="metric-title">{m.metric}</div>
            <div className="metric-value">{m.value}{m.unit}</div>
            <div className="metric-bench">Benchmark: {m.benchmark}{m.unit}</div>
            <div className="metric-status" style={{color: m.status === 'Above Target' ? '#4caf50' : '#ff9800'}}>
              ✓ {m.status}
            </div>
          </div>
        ))}
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'sales-orders' ? 'active' : ''}`} onClick={() => setActiveTab('sales-orders')}>📋 Sales Orders</button>
        <button className={`tab ${activeTab === 'customers' ? 'active' : ''}`} onClick={() => setActiveTab('customers')}>👥 Customer Orders</button>
        <button className={`tab ${activeTab === 'returns' ? 'active' : ''}`} onClick={() => setActiveTab('returns')}>↩️ Returns Analysis</button>
      </div>

      {activeTab === 'sales-orders' && (
        <div className="tab-content">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Order Amount</th>
                <th>Status</th>
                <th>Due Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {salesOrders.map((order) => (
                <tr key={order.id}>
                  <td><strong>{order.id}</strong></td>
                  <td>{order.customer}</td>
                  <td>{order.items}</td>
                  <td><strong>{order.amount}</strong></td>
                  <td>
                    <span className="status-badge" style={{backgroundColor: statusColor(order.status)}}>
                      {order.status}
                    </span>
                  </td>
                  <td>{order.dueDate}</td>
                  <td>
                    <button className="btn-small">View</button>
                    <button className="btn-small">Track</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'customers' && (
        <div className="tab-content">
          <div className="insight-box">
            <h4>📌 Top Customers by Order Value</h4>
            <p>Customer segmentation and loyalty tier information</p>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Total Orders</th>
                <th>Total Value</th>
                <th>Avg Order Value</th>
                <th>Loyalty Tier</th>
              </tr>
            </thead>
            <tbody>
              {customerOrders.map((cust, idx) => (
                <tr key={idx}>
                  <td><strong>{cust.customer}</strong></td>
                  <td>{cust.orders}</td>
                  <td><strong>{cust.value}</strong></td>
                  <td>{cust.avg_order}</td>
                  <td>
                    <span className="loyalty-badge" style={{
                      backgroundColor: cust.loyalty === 'Platinum' ? '#9c27b0' : cust.loyalty === 'Gold' ? '#ffc107' : '#90a4ae'
                    }}>
                      {cust.loyalty}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'returns' && (
        <div className="tab-content">
          <div className="insight-box">
            <h4>📌 Return Rate Analysis</h4>
            <p>Monthly return trends and rates - Target: &lt; 2%</p>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Total Orders</th>
                <th>Returns</th>
                <th>Return Rate %</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {returnAnalysis.map((ret, idx) => (
                <tr key={idx}>
                  <td><strong>{ret.month}</strong></td>
                  <td>{ret.total_orders}</td>
                  <td>{ret.returns}</td>
                  <td><strong>{ret.rate}%</strong></td>
                  <td>
                    <span className="status-badge" style={{
                      backgroundColor: ret.rate < 2 ? '#4caf50' : ret.rate < 3 ? '#ff9800' : '#e74c3c'
                    }}>
                      {ret.rate < 2 ? '✓ Good' : ret.rate < 3 ? '⚠ Monitor' : '✗ High'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default OrdersModule

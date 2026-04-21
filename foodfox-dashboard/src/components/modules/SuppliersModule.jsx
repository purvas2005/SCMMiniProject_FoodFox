import React, { useState } from 'react'
import './ModuleStyles.css'

const SuppliersModule = () => {
  const [activeTab, setActiveTab] = useState('supplier-list')

  const suppliers = [
    { id: 'SUP-001', name: 'GreenField Farms', contact: 'John Smith', email: 'john@greenfield.com', phone: '+91-98765-43210', rating: 4.8, status: 'Active' },
    { id: 'SUP-002', name: 'Coastal Imports', contact: 'Sarah Johnson', email: 'sarah@coastal.com', phone: '+91-99123-45678', rating: 4.5, status: 'Active' },
    { id: 'SUP-003', name: 'Alpine Foods', contact: 'Michael Brown', email: 'michael@alpine.com', phone: '+91-97654-32109', rating: 4.2, status: 'Active' },
    { id: 'SUP-004', name: 'Valley Produce', contact: 'Emily Davis', email: 'emily@valley.com', phone: '+91-96543-21098', rating: 4.6, status: 'Active' },
    { id: 'SUP-005', name: 'Organic Direct', contact: 'Robert Wilson', email: 'robert@organic.com', phone: '+91-95432-10987', rating: 4.4, status: 'Inactive' },
  ]

  const supplierPerformance = [
    { supplier: 'GreenField Farms', orders: 12, onTime: 98, quality: 95, compliance: 100, overall: 97.7 },
    { supplier: 'Coastal Imports', orders: 8, onTime: 95, quality: 92, compliance: 96, overall: 94.3 },
    { supplier: 'Alpine Foods', orders: 15, onTime: 92, quality: 88, compliance: 94, overall: 91.3 },
    { supplier: 'Valley Produce', orders: 6, onTime: 97, quality: 96, compliance: 98, overall: 97.0 },
  ]

  const paymentTerms = [
    { supplier: 'GreenField Farms', terms: 'Net 30', discount: '2% 10', avg_payment_days: 28, credit_limit: '$50,000' },
    { supplier: 'Coastal Imports', terms: 'Net 45', discount: 'None', avg_payment_days: 42, credit_limit: '$35,000' },
    { supplier: 'Alpine Foods', terms: 'Net 30', discount: '1% 15', avg_payment_days: 31, credit_limit: '$40,000' },
    { supplier: 'Valley Produce', terms: '2/10 Net 30', discount: '2% 10', avg_payment_days: 9, credit_limit: '$30,000' },
  ]

  const riskAssessment = [
    { supplier: 'GreenField Farms', financial: 'Low', compliance: 'Low', delivery: 'Low', quality: 'Low', overall: 'Green' },
    { supplier: 'Coastal Imports', financial: 'Low', compliance: 'Medium', delivery: 'Medium', quality: 'Low', overall: 'Yellow' },
    { supplier: 'Alpine Foods', financial: 'Medium', compliance: 'Medium', delivery: 'High', quality: 'Medium', overall: 'Yellow' },
    { supplier: 'Valley Produce', financial: 'Low', compliance: 'Low', delivery: 'Low', quality: 'Low', overall: 'Green' },
  ]

  const getRiskColor = (risk) => {
    return {
      'Green': '#4caf50',
      'Yellow': '#ff9800',
      'Red': '#e74c3c'
    }[risk] || '#999'
  }

  return (
    <div className="module-container">
      <div className="module-header">
        <h2>🤝 Supplier Management</h2>
        <button className="btn-primary">+ Register New Supplier</button>
      </div>

      <div className="metrics-row">
        <div className="stat-box">
          <span className="stat-label">Active Suppliers</span>
          <span className="stat-value">4</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">Avg Performance Score</span>
          <span className="stat-value">95.1%</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">On-Time Delivery Avg</span>
          <span className="stat-value">95.5%</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">Quality Rating Avg</span>
          <span className="stat-value">92.8%</span>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'supplier-list' ? 'active' : ''}`} onClick={() => setActiveTab('supplier-list')}>📋 Supplier List</button>
        <button className={`tab ${activeTab === 'performance' ? 'active' : ''}`} onClick={() => setActiveTab('performance')}>⭐ Performance Scorecard</button>
        <button className={`tab ${activeTab === 'payment' ? 'active' : ''}`} onClick={() => setActiveTab('payment')}>💳 Payment Terms</button>
        <button className={`tab ${activeTab === 'risk' ? 'active' : ''}`} onClick={() => setActiveTab('risk')}>⚠️ Risk Assessment</button>
      </div>

      {activeTab === 'supplier-list' && (
        <div className="tab-content">
          <table className="data-table">
            <thead>
              <tr>
                <th>Supplier ID</th>
                <th>Name</th>
                <th>Contact Person</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Rating</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((supplier) => (
                <tr key={supplier.id}>
                  <td><strong>{supplier.id}</strong></td>
                  <td>{supplier.name}</td>
                  <td>{supplier.contact}</td>
                  <td>{supplier.email}</td>
                  <td>{supplier.phone}</td>
                  <td>
                    <strong style={{color: supplier.rating >= 4.5 ? '#4caf50' : '#ff9800'}}>
                      ★ {supplier.rating}
                    </strong>
                  </td>
                  <td>
                    <span className="status-badge" style={{backgroundColor: supplier.status === 'Active' ? '#4caf50' : '#9e9e9e'}}>
                      {supplier.status}
                    </span>
                  </td>
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

      {activeTab === 'performance' && (
        <div className="tab-content">
          <div className="insight-box">
            <h4>📌 Supplier Performance Scorecard</h4>
            <p>Performance metrics: On-Time %, Quality %, Compliance %, Overall Score</p>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Supplier</th>
                <th>Orders</th>
                <th>On-Time %</th>
                <th>Quality %</th>
                <th>Compliance %</th>
                <th>Overall Score</th>
              </tr>
            </thead>
            <tbody>
              {supplierPerformance.map((perf, idx) => (
                <tr key={idx}>
                  <td><strong>{perf.supplier}</strong></td>
                  <td>{perf.orders}</td>
                  <td><span style={{color: perf.onTime >= 95 ? '#4caf50' : '#ff9800'}}>{perf.onTime}%</span></td>
                  <td><span style={{color: perf.quality >= 90 ? '#4caf50' : '#ff9800'}}>{perf.quality}%</span></td>
                  <td><span style={{color: perf.compliance >= 95 ? '#4caf50' : '#ff9800'}}>{perf.compliance}%</span></td>
                  <td><strong style={{color: perf.overall >= 95 ? '#4caf50' : '#ff9800'}}>{perf.overall}%</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'payment' && (
        <div className="tab-content">
          <div className="insight-box">
            <h4>📌 Payment Terms & Credit Management</h4>
            <p>Negotiated payment terms, early payment discounts, and credit limits</p>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Supplier</th>
                <th>Payment Terms</th>
                <th>Discount Available</th>
                <th>Avg Payment Days</th>
                <th>Credit Limit</th>
              </tr>
            </thead>
            <tbody>
              {paymentTerms.map((term, idx) => (
                <tr key={idx}>
                  <td><strong>{term.supplier}</strong></td>
                  <td>{term.terms}</td>
                  <td><span style={{color: '#4caf50'}}>{term.discount}</span></td>
                  <td>{term.avg_payment_days} days</td>
                  <td><strong>{term.credit_limit}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'risk' && (
        <div className="tab-content">
          <div className="insight-box">
            <h4>📌 Supplier Risk Assessment Matrix</h4>
            <p>Financial health, compliance, delivery, and quality risk evaluation</p>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Supplier</th>
                <th>Financial Risk</th>
                <th>Compliance Risk</th>
                <th>Delivery Risk</th>
                <th>Quality Risk</th>
                <th>Overall Risk</th>
              </tr>
            </thead>
            <tbody>
              {riskAssessment.map((risk, idx) => (
                <tr key={idx}>
                  <td><strong>{risk.supplier}</strong></td>
                  <td><span className="risk-badge" style={{backgroundColor: getRiskColor(risk.financial)}}>{risk.financial}</span></td>
                  <td><span className="risk-badge" style={{backgroundColor: getRiskColor(risk.compliance)}}>{risk.compliance}</span></td>
                  <td><span className="risk-badge" style={{backgroundColor: getRiskColor(risk.delivery)}}>{risk.delivery}</span></td>
                  <td><span className="risk-badge" style={{backgroundColor: getRiskColor(risk.quality)}}>{risk.quality}</span></td>
                  <td><span className="risk-badge" style={{backgroundColor: getRiskColor(risk.overall)}}>{risk.overall}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default SuppliersModule

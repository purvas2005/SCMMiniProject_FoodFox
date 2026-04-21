import React, { useState } from 'react'
import './ModuleStyles.css'

const AnalyticsModule = () => {
  const [chartView, setChartView] = useState('demand')

  const chartTabs = [
    { key: 'demand', label: 'Demand Analysis' },
    { key: 'category', label: 'Category Performance' },
    { key: 'regional', label: 'Regional Analysis' },
    { key: 'kpi', label: 'KPI Dashboard' },
  ]

  const demandData = [
    { month: 'Jan', actual: 8500, forecast: 8200, variance: 3.7 },
    { month: 'Feb', actual: 7800, forecast: 7900, variance: -1.3 },
    { month: 'Mar', actual: 9200, forecast: 8950, variance: 2.8 },
    { month: 'Apr', actual: 10100, forecast: 9800, variance: 3.1 },
  ]

  const categoryPerformance = [
    { category: 'Snacks', revenue: 45000, margin: 28, trend: '+12%' },
    { category: 'Beverages', revenue: 38000, margin: 22, trend: '+8%' },
    { category: 'Frozen', revenue: 52000, margin: 31, trend: '+15%' },
    { category: 'Ingredients', revenue: 28000, margin: 25, trend: '+5%' },
    { category: 'Dairy', revenue: 35000, margin: 20, trend: '+10%' },
  ]

  const regionalAnalysis = [
    { region: 'North', sales: 65000, margin: 26, inventory: 3850, topProduct: 'Organic Chips' },
    { region: 'South', sales: 58000, margin: 24, inventory: 2275, topProduct: 'Frozen Berries' },
    { region: 'West', sales: 72000, margin: 28, inventory: 2960, topProduct: 'Mango Juice' },
    { region: 'East', sales: 42000, margin: 22, inventory: 1875, topProduct: 'Rice Mix' },
  ]

  const kpiMetrics = [
    { kpi: 'Inventory Turnover', value: 8.2, benchmark: 8.0, status: 'Above Target' },
    { kpi: 'Order Fulfillment Rate', value: 97.3, benchmark: 95, status: 'Above Target', unit: '%' },
    { kpi: 'Supplier On-Time Delivery', value: 93, benchmark: 90, status: 'Above Target', unit: '%' },
    { kpi: 'Demand Forecast Accuracy', value: 92.5, benchmark: 90, status: 'Above Target', unit: '%' },
    { kpi: 'Stockout Rate', value: 1.2, benchmark: 2, status: 'Above Target', unit: '%' },
    { kpi: 'Warehouse Utilization', value: 72.8, benchmark: 80, status: 'Below Target', unit: '%' },
  ]

  return (
    <div className="module-container">
      <div className="module-header">
        <h2>📈 Advanced Analytics & Reporting</h2>
        <div className="view-toggle">
          {chartTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              aria-pressed={chartView === tab.key}
              className={`toggle-btn ${chartView === tab.key ? 'active' : ''}`}
              onClick={() => setChartView(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {chartView === 'demand' && (
        <div className="analytics-section">
          <h3>📊 Demand Forecast vs Actual</h3>
          <div className="chart-container-analytics">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Actual Demand</th>
                  <th>Forecast</th>
                  <th>Variance %</th>
                  <th>Accuracy</th>
                </tr>
              </thead>
              <tbody>
                {demandData.map((row, idx) => (
                  <tr key={idx}>
                    <td><strong>{row.month}</strong></td>
                    <td>{row.actual.toLocaleString()}</td>
                    <td>{row.forecast.toLocaleString()}</td>
                    <td><span style={{color: row.variance > 0 ? '#ff9800' : '#4caf50'}}>{row.variance > 0 ? '+' : ''}{row.variance}%</span></td>
                    <td>{(100 - Math.abs(row.variance)).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="insight-box">
            <h4>📌 Insights</h4>
            <ul>
              <li>Average forecast accuracy: 92.3% (Excellent)</li>
              <li>April demand exceeded forecast by 3.1% (Expected surge)</li>
              <li>Consistent performance month-over-month</li>
              <li>Recommendation: Maintain current forecast model</li>
            </ul>
          </div>
        </div>
      )}

      {chartView === 'category' && (
        <div className="analytics-section">
          <h3>📦 Product Category Performance</h3>
          <div className="category-cards">
            {categoryPerformance.map((cat, idx) => (
              <div key={idx} className="category-card">
                <h4>{cat.category}</h4>
                <div className="metric-row">
                  <span>Revenue:</span>
                  <strong>${cat.revenue.toLocaleString()}</strong>
                </div>
                <div className="metric-row">
                  <span>Margin:</span>
                  <strong>{cat.margin}%</strong>
                </div>
                <div className="metric-row">
                  <span>YoY Trend:</span>
                  <strong style={{color: '#4caf50'}}>{cat.trend}</strong>
                </div>
              </div>
            ))}
          </div>
          <div className="insight-box">
            <h4>📌 Insights</h4>
            <ul>
              <li>Frozen category leading with ₹52K revenue and 31% margin</li>
              <li>All categories showing positive growth trends</li>
              <li>Snacks and Beverages have expansion potential</li>
              <li>Top performer: Frozen (+15% YoY)</li>
            </ul>
          </div>
        </div>
      )}

      {chartView === 'regional' && (
        <div className="analytics-section">
          <h3>🌍 Regional Performance Analysis</h3>
          <div className="regional-cards">
            {regionalAnalysis.map((reg, idx) => (
              <div key={idx} className="regional-card">
                <h4>{reg.region} Region</h4>
                <div className="metric-row">
                  <span>Sales:</span>
                  <strong>${reg.sales.toLocaleString()}</strong>
                </div>
                <div className="metric-row">
                  <span>Gross Margin:</span>
                  <strong>{reg.margin}%</strong>
                </div>
                <div className="metric-row">
                  <span>Inventory Stock:</span>
                  <strong>{reg.inventory.toLocaleString()} units</strong>
                </div>
                <div className="metric-row">
                  <span>Top Product:</span>
                  <strong>{reg.topProduct}</strong>
                </div>
              </div>
            ))}
          </div>
          <div className="insight-box">
            <h4>📌 Insights</h4>
            <ul>
              <li>West region leading with ₹72K sales and 28% margin</li>
              <li>North region showing strong inventory levels (3,850 units)</li>
              <li>East region has growth opportunity - focus on marketing</li>
              <li>Regional spread balanced across all zones</li>
            </ul>
          </div>
        </div>
      )}

      {chartView === 'kpi' && (
        <div className="analytics-section">
          <h3>🎯 Key Performance Indicators</h3>
          <div className="kpi-metrics-grid">
            {kpiMetrics.map((metric, idx) => (
              <div key={idx} className="kpi-card">
                <h4>{metric.kpi}</h4>
                <div className="kpi-value">
                  {metric.value}
                  {metric.unit && <span className="unit">{metric.unit}</span>}
                </div>
                <div className="kpi-benchmark">
                  Benchmark: {metric.benchmark}{metric.unit || ''}
                </div>
                <div className="kpi-status">
                  <span className={`status-badge ${metric.status === 'Above Target' ? 'above' : 'below'}`}>
                    {metric.status}
                  </span>
                </div>
                <div className="kpi-bar">
                  <div className="bar-fill" style={{width: `${(metric.value / (metric.benchmark * 1.2)) * 100}%`}}></div>
                </div>
              </div>
            ))}
          </div>
          <div className="insight-box">
            <h4>📌 Key Findings</h4>
            <ul>
              <li>✅ 5 out of 6 KPIs above target</li>
              <li>✅ Demand forecast accuracy: 92.5% (Excellent)</li>
              <li>⚠️ Warehouse utilization at 72.8% (capacity planning opportunity)</li>
              <li>✅ Order fulfillment rate: 97.3% (Industry leading)</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

export default AnalyticsModule

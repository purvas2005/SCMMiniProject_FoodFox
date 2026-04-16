import { useContext } from 'react'
import { DashboardContext } from '../App'
import { calculateMetrics } from '../utils/dataGenerator'
import './KPIContainer.css'

const KPIContainer = () => {
  const { dashboardData } = useContext(DashboardContext)
  const metrics = calculateMetrics(dashboardData)

  const kpiCards = [
    {
      title: 'Forecast Accuracy',
      value: metrics.forecastAccuracy,
      unit: '%',
      description: 'MAPE Score',
      icon: '📊',
      color: '#2ecc71',
      trend: '+2.3%',
    },
    {
      title: 'Spoilage Risk',
      value: metrics.spoilageRisk,
      unit: '%',
      description: 'Expiry Rate',
      icon: '⚠️',
      color: '#e74c3c',
      trend: '-1.2%',
    },
    {
      title: 'OTIF Score',
      value: metrics.otif,
      unit: '%',
      description: 'On-Time In-Full',
      icon: '✅',
      color: '#3498db',
      trend: '+3.1%',
    },
    {
      title: 'Promotion Lift',
      value: metrics.promotionLift,
      unit: '%',
      description: 'Campaign Boost',
      icon: '📈',
      color: '#f39c12',
      trend: '+5.7%',
    },
    {
      title: 'Revenue At Risk',
      value: `$${(dashboardData.kpis.revenueAtRisk / 1000).toFixed(0)}K`,
      unit: '',
      description: 'Potential Loss',
      icon: '💰',
      color: '#9b59b6',
      trend: '-8.4%',
    },
  ]

  return (
    <div className="kpi-container">
      {kpiCards.map((card, index) => (
        <div key={index} className="kpi-card" style={{ borderLeftColor: card.color }}>
          <div className="kpi-header">
            <span className="kpi-icon">{card.icon}</span>
            <div className="kpi-trend" style={{ color: card.trend.includes('-') ? '#27ae60' : '#e74c3c' }}>
              {card.trend}
            </div>
          </div>
          <h3 className="kpi-title">{card.title}</h3>
          <div className="kpi-value">
            {card.value}<span className="kpi-unit">{card.unit}</span>
          </div>
          <p className="kpi-description">{card.description}</p>
        </div>
      ))}
    </div>
  )
}

export default KPIContainer

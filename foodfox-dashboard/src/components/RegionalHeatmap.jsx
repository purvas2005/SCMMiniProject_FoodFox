import { useContext, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'
import { DashboardContext } from '../App'
import { calculateRegionalDemand } from '../utils/dataGenerator'
import './RegionalHeatmap.css'

const RegionalHeatmap = () => {
  const { dashboardData } = useContext(DashboardContext)

  const heatmapData = useMemo(() => {
    const regionalDemand = calculateRegionalDemand(dashboardData)
    return dashboardData.regions.map(region => ({
      region,
      demand: regionalDemand[region].demand,
      stockout_risk: regionalDemand[region].stockout_risk,
    }))
  }, [dashboardData])

  const getColor = (demand) => {
    if (demand > 2000) return '#e74c3c'
    if (demand > 1500) return '#f39c12'
    if (demand > 1000) return '#3498db'
    return '#2ecc71'
  }

  return (
    <div className="regional-heatmap">
      <div className="chart-header">
        <h2>Regional Demand Heatmap</h2>
        <p>Average monthly demand by region - identify stockout hotspots</p>
      </div>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={heatmapData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ecf0f1" />
          <XAxis dataKey="region" stroke="#7f8c8d" />
          <YAxis stroke="#7f8c8d" />
          <Tooltip 
            contentStyle={{ backgroundColor: '#2c3e50', border: '1px solid #3498db', borderRadius: '4px' }}
            labelStyle={{ color: '#ecf0f1' }}
          />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          <Bar dataKey="demand" fill="#3498db" name="Average Demand (units)" radius={[8, 8, 0, 0]}>
            {heatmapData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getColor(entry.demand)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      
      <div className="heatmap-legend">
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#e74c3c' }}></span>
          <span>Critical Demand (&gt;2000 units)</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#f39c12' }}></span>
          <span>High Demand (1500-2000 units)</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#3498db' }}></span>
          <span>Medium Demand (1000-1500 units)</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#2ecc71' }}></span>
          <span>Normal Demand (&lt;1000 units)</span>
        </div>
      </div>
    </div>
  )
}

export default RegionalHeatmap

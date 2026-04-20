import { useContext, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'
import { DashboardContext } from '../App'
import { filterData } from '../utils/dataGenerator'
import { filterSalesByDateRange } from '../utils/dateFilters'
import './RegionalHeatmap.css'

const RegionalHeatmap = () => {
  const { dashboardData, filters } = useContext(DashboardContext)

  // Filter by region and category first
  const { filteredSales } = useMemo(() => 
    filterData(dashboardData, filters), 
    [dashboardData, filters]
  )

  // Then filter by date range
  const timeFilteredSales = useMemo(() => 
    filterSalesByDateRange(filteredSales, filters.timeRange),
    [filteredSales, filters.timeRange]
  )

  // Calculate regional demand from filtered data
  const heatmapData = useMemo(() => {
    const regionDemand = {}

    // Initialize regions
    dashboardData.regions.forEach(region => {
      regionDemand[region] = {
        demand: 0,
        count: 0,
        stockout_risk: 'Low'
      }
    })

    // Aggregate sales by region
    timeFilteredSales.forEach(sale => {
      if (regionDemand[sale.region]) {
        regionDemand[sale.region].demand += sale.actual_quantity || 0
        regionDemand[sale.region].count += 1
      }
    })

    // Calculate average demand and determine risk
    return dashboardData.regions.map(region => {
      const data = regionDemand[region]
      const avgDemand = data.count > 0 ? Math.round(data.demand / data.count) : 0
      
      return {
        region,
        demand: data.demand,
        avgDemand,
        stockout_risk: avgDemand > 400 ? 'High' : avgDemand > 250 ? 'Medium' : 'Low',
      }
    })
  }, [timeFilteredSales, dashboardData.regions])

  const getColor = (demand) => {
    if (demand > 2000) return '#e74c3c'
    if (demand > 1500) return '#f39c12'
    if (demand > 1000) return '#3498db'
    return '#2ecc71'
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
    <div className="regional-heatmap">
      <div className="chart-header">
        <h2>Regional Demand Heatmap</h2>
        <p>{getTimeRangeLabel()} - Average demand by region - identify stockout hotspots</p>
      </div>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={heatmapData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ecf0f1" />
          <XAxis dataKey="region" stroke="#7f8c8d" />
          <YAxis stroke="#7f8c8d" />
          <Tooltip 
            contentStyle={{ backgroundColor: '#2c3e50', border: '1px solid #3498db', borderRadius: '4px' }}
            labelStyle={{ color: '#ecf0f1' }}
            formatter={(value) => `${value} units`}
          />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          <Bar dataKey="demand" fill="#3498db" name="Total Demand (units)" radius={[8, 8, 0, 0]}>
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

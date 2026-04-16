import { useContext, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { DashboardContext } from '../App'
import { filterData } from '../utils/dataGenerator'
import './ForecastChart.css'

const ForecastChart = () => {
  const { dashboardData, filters } = useContext(DashboardContext)
  const { filteredSales, filteredForecasts } = useMemo(() => 
    filterData(dashboardData, filters), 
    [dashboardData, filters]
  )

  // Aggregate data by month for chart
  const chartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
    const data = {}

    // Aggregate actual sales by month
    filteredSales.forEach(sale => {
      if (!data[sale.month]) {
        data[sale.month] = { month: sale.month, actual: 0, predicted: 0 }
      }
      data[sale.month].actual += sale.actual_quantity
    })

    // Aggregate forecasts by month
    filteredForecasts.forEach(forecast => {
      if (!data[forecast.month]) {
        data[forecast.month] = { month: forecast.month, actual: 0, predicted: 0 }
      }
      data[forecast.month].predicted += forecast.predicted_quantity
    })

    return months.map(m => data[m] || { month: m, actual: 0, predicted: 0 })
  }, [filteredSales, filteredForecasts])

  return (
    <div className="forecast-chart">
      <div className="chart-header">
        <h2>Demand Forecast vs Actual Sales</h2>
        <p>6-Month Historical and Predicted Demand Comparison</p>
      </div>
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ecf0f1" />
          <XAxis dataKey="month" stroke="#7f8c8d" />
          <YAxis stroke="#7f8c8d" />
          <Tooltip 
            contentStyle={{ backgroundColor: '#2c3e50', border: '1px solid #3498db', borderRadius: '4px' }}
            labelStyle={{ color: '#ecf0f1' }}
            cursor={{ stroke: '#3498db', strokeWidth: 2 }}
          />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
          />
          <Line 
            type="monotone" 
            dataKey="actual" 
            stroke="#2ecc71" 
            strokeWidth={2}
            dot={{ fill: '#2ecc71', r: 4 }}
            activeDot={{ r: 6 }}
            name="Actual Sales"
          />
          <Line 
            type="monotone" 
            dataKey="predicted" 
            stroke="#3498db" 
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: '#3498db', r: 4 }}
            activeDot={{ r: 6 }}
            name="Predicted Demand"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default ForecastChart

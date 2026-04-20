import { useContext, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { DashboardContext } from '../App'
import { filterData } from '../utils/dataGenerator'
import { filterSalesByDateRange, filterForecastsByDateRange, getMonthsForRange, getMonthLabel, normalizeMonthName } from '../utils/dateFilters'
import './ForecastChart.css'

const ForecastChart = () => {
  const { dashboardData, filters } = useContext(DashboardContext)
  
  // First filter by region/category
  const { filteredSales: regionFilteredSales, filteredForecasts: regionFilteredForecasts } = useMemo(() => 
    filterData(dashboardData, filters), 
    [dashboardData, filters]
  )

  // Then filter by date range (time range)
  const { filteredSales, filteredForecasts } = useMemo(() => ({
    filteredSales: filterSalesByDateRange(regionFilteredSales, filters.timeRange),
    filteredForecasts: filterForecastsByDateRange(regionFilteredForecasts, filters.timeRange)
  }), [regionFilteredSales, regionFilteredForecasts, filters.timeRange])

  // Aggregate data by month for chart
  const chartData = useMemo(() => {
    const months = getMonthsForRange(filters.timeRange)
    const data = {}

    // Initialize all months with zero values
    months.forEach(month => {
      data[month] = { month, actual: 0, predicted: 0 }
    })

    // Aggregate actual sales by month
    filteredSales.forEach(sale => {
      let monthKey = sale.month_name || sale.month
      
      // Normalize month name (convert "April" to "Apr", etc.)
      if (monthKey) {
        monthKey = normalizeMonthName(monthKey)
      }
      
      // If month_name is still undefined, extract from sale_date
      if (!monthKey && sale.sale_date) {
        try {
          monthKey = getMonthLabel(new Date(sale.sale_date))
        } catch (e) {
          // Skip if date parsing fails
        }
      }
      
      if (monthKey && data[monthKey]) {
        data[monthKey].actual += parseInt(sale.actual_quantity || 0)
      }
    })

    // Aggregate forecasts by month
    filteredForecasts.forEach(forecast => {
      let monthKey = forecast.month_name || forecast.month
      
      // Normalize month name (convert "October" to "Oct", etc.)
      if (monthKey) {
        monthKey = normalizeMonthName(monthKey)
      }
      
      // If month_name is still undefined, extract from forecast_date
      if (!monthKey && forecast.forecast_date) {
        try {
          monthKey = getMonthLabel(new Date(forecast.forecast_date))
        } catch (e) {
          // Skip if date parsing fails
        }
      }
      
      if (monthKey && data[monthKey]) {
        data[monthKey].predicted += parseInt(forecast.predicted_quantity || 0)
      }
    })

    return months.map(m => data[m] || { month: m, actual: 0, predicted: 0 })
  }, [filteredSales, filteredForecasts, filters.timeRange])

  return (
    <div className="forecast-chart">
      <div className="chart-header">
        <h2>Demand Forecast vs Actual Sales</h2>
        <p>{filters.timeRange === '3months' ? 'Last 3 Months' : filters.timeRange === '6months' ? 'Last 6 Months' : filters.timeRange === '12months' ? 'Last 12 Months' : 'Year to Date'} - Historical and Predicted Demand Comparison</p>
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

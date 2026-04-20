import { subMonths, startOfMonth, endOfMonth } from 'date-fns'

/**
 * Normalize month name to abbreviated format (e.g., "April" -> "Apr")
 */
export const normalizeMonthName = (monthName) => {
  if (!monthName) return null
  
  const fullMonthNames = {
    'january': 'Jan', 'february': 'Feb', 'march': 'Mar', 'april': 'Apr',
    'may': 'May', 'june': 'Jun', 'july': 'Jul', 'august': 'Aug',
    'september': 'Sep', 'october': 'Oct', 'november': 'Nov', 'december': 'Dec'
  }
  
  const abbrevMonthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  
  // If it's already abbreviated (3 letters), return as-is
  if (monthName.length === 3 && abbrevMonthNames.includes(monthName)) {
    return monthName
  }
  
  // If it's a full month name, convert to abbreviated
  const normalized = fullMonthNames[monthName.toLowerCase()]
  if (normalized) return normalized
  
  // Fallback: return original
  return monthName
}

/**
 * Get date range based on time range filter
 */
export const getDateRange = (timeRange) => {
  const today = new Date()
  let startDate, endDate = endOfMonth(today)

  switch (timeRange) {
    case '3months':
      startDate = startOfMonth(subMonths(today, 3))
      break
    case '6months':
      startDate = startOfMonth(subMonths(today, 6))
      break
    case '12months':
      startDate = startOfMonth(subMonths(today, 12))
      break
    case 'ytd':
      startDate = new Date(today.getFullYear(), 0, 1)
      break
    default:
      startDate = startOfMonth(subMonths(today, 6))
  }

  return { startDate, endDate }
}

/**
 * Filter sales data by date range
 */
export const filterSalesByDateRange = (sales, timeRange) => {
  const { startDate, endDate } = getDateRange(timeRange)

  return sales.filter(sale => {
    const saleDate = new Date(sale.sale_date)
    return saleDate >= startDate && saleDate <= endDate
  })
}

/**
 * Filter forecasts by date range
 */
export const filterForecastsByDateRange = (forecasts, timeRange) => {
  const { startDate, endDate } = getDateRange(timeRange)

  return forecasts.filter(forecast => {
    const forecastDate = new Date(forecast.forecast_date)
    return forecastDate >= startDate && forecastDate <= endDate
  })
}

/**
 * Get month label from date
 */
export const getMonthLabel = (date) => {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const d = new Date(date)
  return monthNames[d.getMonth()]
}

/**
 * Get months array for the selected time range
 */
export const getMonthsForRange = (timeRange) => {
  const { startDate, endDate } = getDateRange(timeRange)
  const months = []
  const current = new Date(startDate)

  while (current <= endDate) {
    months.push(getMonthLabel(current))
    current.setMonth(current.getMonth() + 1)
  }

  return months
}

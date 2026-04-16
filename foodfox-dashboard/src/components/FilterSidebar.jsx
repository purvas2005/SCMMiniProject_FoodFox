import { useState } from 'react'
import './FilterSidebar.css'

const FilterSidebar = ({ onFilterChange }) => {
  const [filters, setFilters] = useState({
    region: 'All',
    category: 'All',
    timeRange: '6months'
  })

  const regions = ['All', 'North', 'South', 'East', 'West', 'Central']
  const categories = ['All', 'Snacks', 'Beverages', 'Frozen']
  const timeRanges = [
    { value: '3months', label: 'Last 3 Months' },
    { value: '6months', label: 'Last 6 Months' },
    { value: '12months', label: 'Last 12 Months' },
    { value: 'ytd', label: 'Year to Date' },
  ]

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const resetFilters = () => {
    const defaultFilters = {
      region: 'All',
      category: 'All',
      timeRange: '6months'
    }
    setFilters(defaultFilters)
    onFilterChange(defaultFilters)
  }

  return (
    <aside className="filter-sidebar">
      <div className="sidebar-header">
        <h3>🔍 Filters</h3>
        <button className="reset-btn" onClick={resetFilters} title="Reset all filters">↻</button>
      </div>

      <div className="filter-group">
        <label htmlFor="region-select" className="filter-label">Region</label>
        <select 
          id="region-select"
          value={filters.region}
          onChange={(e) => handleFilterChange('region', e.target.value)}
          className="filter-select"
        >
          {regions.map(region => (
            <option key={region} value={region}>
              {region}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label htmlFor="category-select" className="filter-label">Product Category</label>
        <select 
          id="category-select"
          value={filters.category}
          onChange={(e) => handleFilterChange('category', e.target.value)}
          className="filter-select"
        >
          {categories.map(category => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label className="filter-label">Time Range</label>
        <div className="radio-group">
          {timeRanges.map(range => (
            <div key={range.value} className="radio-item">
              <input 
                type="radio"
                id={`time-${range.value}`}
                name="timeRange"
                value={range.value}
                checked={filters.timeRange === range.value}
                onChange={(e) => handleFilterChange('timeRange', e.target.value)}
              />
              <label htmlFor={`time-${range.value}`}>{range.label}</label>
            </div>
          ))}
        </div>
      </div>

      <div className="filter-info">
        <div className="info-card">
          <h4>📌 Active Filters</h4>
          <ul>
            {filters.region !== 'All' && <li>Region: <strong>{filters.region}</strong></li>}
            {filters.category !== 'All' && <li>Category: <strong>{filters.category}</strong></li>}
            <li>Period: <strong>{timeRanges.find(t => t.value === filters.timeRange)?.label}</strong></li>
          </ul>
        </div>
      </div>

      <div className="sidebar-footer">
        <p className="footer-text">Last updated: <br/><strong>Just now</strong></p>
      </div>
    </aside>
  )
}

export default FilterSidebar

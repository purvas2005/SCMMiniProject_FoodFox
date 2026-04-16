# 🦊 FoodFox Foods - Predictive Demand Management Dashboard

A comprehensive Supply Chain Management (SCM) dashboard for FoodFox Foods, a mid-sized organic snacks and beverages manufacturer. This project addresses critical inventory management challenges through data-driven demand forecasting and real-time analytics.

## 📋 Problem Statement

FoodFox Foods faces two critical challenges:
- **Under-stocking**: During holiday seasons, inventory runs out, resulting in lost revenue
- **Over-stocking**: Perishable items expire before being sold, causing massive waste

**Solution**: A predictive demand dashboard that transitions from reactive manual ordering to proactive, ML-driven inventory optimization.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                  │
│  - KPI Cards (MAPE, Spoilage Risk, OTIF, Promotion Lift)   │
│  - Demand Forecast Charts (Actual vs Predicted)             │
│  - Inventory Health Table with Risk Indicators              │
│  - Regional Heatmap for Demand Distribution                 │
│  - Interactive Filters (Region, Category, Time Range)       │
└──────────────────────────┬──────────────────────────────────┘
                           │
                    HTTP/REST API
                           │
┌──────────────────────────┴──────────────────────────────────┐
│              Backend (Node.js + Express)                     │
│  - RESTful API endpoints for data retrieval                 │
│  - KPI calculations (MAPE, OTIF, Spoilage Rate)            │
│  - Regional demand aggregation                              │
│  - Inventory health calculations                            │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────┴──────────────────────────────────┐
│              Database (MySQL)                                │
│  - Products (shelf_life_days, category)                     │
│  - SalesHistory (actual sales with dates/regions)           │
│  - DemandForecasts (ML predicted quantities)                │
│  - Inventory (current stock levels)                         │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
foodfox-dashboard/          # React Frontend
├── src/
│   ├── components/         # React components
│   │   ├── KPIContainer.jsx           # Key Performance Indicators
│   │   ├── ForecastChart.jsx          # Demand vs Actual Chart
│   │   ├── InventoryHealthTable.jsx   # Product inventory status
│   │   ├── RegionalHeatmap.jsx        # Regional demand distribution
│   │   └── FilterSidebar.jsx          # Interactive filters
│   ├── services/
│   │   └── api.js                     # Backend API client
│   ├── utils/
│   │   └── dataGenerator.js           # Mock data for offline mode
│   ├── App.jsx
│   ├── App.css
│   └── index.css
│
foodfox-backend/            # Node.js/Express Backend
├── server.js               # Main server with API endpoints
├── .env                    # Database configuration
├── package.json
└── README_BACKEND.md
```

## 🚀 Setup Instructions

### Prerequisites
- Node.js (v18+)
- MySQL (v8.0+)
- npm or yarn

### 1. Database Setup

```bash
# Import the SQL schema
mysql -u root -p < SQL_Scripts/creation_script.sql

# Or manually create database and tables
mysql -u root -p
> CREATE DATABASE foodfox;
> USE foodfox;
> (paste SQL scripts from creation_script.sql)
```

**Note**: Make sure to populate the database with sample data before running the dashboard.

### 2. Backend Setup

```bash
cd foodfox-backend

# Install dependencies
npm install

# Configure database connection in .env file
# Edit .env with your MySQL credentials:
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=your_password
# DB_NAME=foodfox
# PORT=5000

# Start the backend server
npm start
```

Backend will run on `http://localhost:5000`

### 3. Frontend Setup

```bash
cd foodfox-dashboard

# Install dependencies
npm install

# Ensure .env.local points to your backend
# VITE_API_URL=http://localhost:5000/api

# Start development server
npm run dev
```

Frontend will run on `http://localhost:5173`

## 📊 Key Features

### 1. **KPI Dashboard**
Displays 5 critical metrics for executives:
- **Forecast Accuracy (MAPE)**: How close ML predictions are to actual sales
- **Spoilage Risk Rate**: % of inventory at risk of expiring
- **OTIF Score**: On-Time In-Full delivery percentage
- **Promotion Lift**: % demand increase from marketing campaigns
- **Revenue at Risk**: Potential loss from stockouts/spoilage

### 2. **Demand Forecast Chart**
- Line chart comparing actual sales vs ML-predicted demand
- 6-month historical + forecast visualization
- Interactive tooltips showing exact values
- Color-coded: Green (Actual), Blue (Predicted)

### 3. **Inventory Health Table**
- Lists all products with status indicators
- **Status Colors**:
  - 🟢 **Healthy**: Stock adequate
  - �� **Monitor**: Approaching reorder point
  - 🔴 **Critical**: Urgent action needed
- Shows spoilage risk (days until expiration)
- Highlights products with predicted demand > current stock

### 4. **Regional Demand Heatmap**
- Visualizes demand distribution across regions
- Helps identify high-demand areas prone to stockouts
- Supports regional inventory allocation decisions

### 5. **Interactive Filters**
- **Region Filter**: North, South, East, West, Central
- **Product Category**: Snacks, Beverages, Frozen
- **Time Range**: 3 months, 6 months, 12 months, YTD

## 🔌 API Endpoints

### Base URL: `http://localhost:5000/api`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/products` | GET | List all products with metadata |
| `/sales-history` | GET | Historical sales data (12 months) |
| `/forecasts` | GET | ML-generated demand forecasts |
| `/inventory` | GET | Current inventory levels by product |
| `/kpis` | GET | Calculated KPI metrics (MAPE, OTIF, etc.) |
| `/regional-demand` | GET | Aggregated demand by region |
| `/forecast-comparison` | GET | Actual vs Predicted comparison |
| `/inventory-health` | GET | Product-level inventory health status |

## 🤖 Machine Learning Integration

The dashboard supports ML models for demand forecasting. To integrate your ML predictions:

1. **Train your model** using `SalesHistory` data
2. **Generate predictions** for future months
3. **Store predictions** in the `DemandForecasts` table with:
   - `product_id`: Product identifier
   - `forecast_date`: Prediction date
   - `predicted_quantity`: ML model output
   - `confidence_interval`: Model confidence (0-100)
   - `model_version`: Track which model version was used

### Sample ML Integration (Python)

```python
import mysql.connector
from sklearn.ensemble import RandomForestRegressor
import pandas as pd

# Load historical sales
conn = mysql.connector.connect(host='localhost', user='root', database='foodfox')
query = "SELECT * FROM SalesHistory"
sales_df = pd.read_sql(query, conn)

# Prepare features and train model
X = sales_df[['product_id', 'region', 'month', 'is_promotion']]
y = sales_df['quantity_sold']
model = RandomForestRegressor()
model.fit(X, y)

# Generate predictions for next 6 months
predictions = model.predict(future_data)

# Store in database
for pred in predictions:
    cursor.execute("""
        INSERT INTO DemandForecasts 
        (product_id, forecast_date, predicted_quantity, confidence_interval, model_version)
        VALUES (%s, %s, %s, %s, 'v1.0')
    """, (pred['product_id'], pred['date'], pred['quantity'], pred['confidence']))

conn.commit()
```

## 📈 KPI Calculations

### MAPE (Mean Absolute Percentage Error)
```sql
SELECT AVG(ABS((predicted - actual) / actual * 100)) as mape
FROM forecasts vs sales
```
**Lower is better** (Target: < 10%)

### OTIF (On-Time In-Full)
```sql
SELECT COUNT(successful_deliveries) * 100 / COUNT(total_orders) as otif
```
**Higher is better** (Target: > 95%)

### Spoilage Risk Rate
```sql
SELECT COUNT(expired_items) * 100 / COUNT(total_inventory) as spoilage_rate
```
**Lower is better** (Target: < 5%)

## 🎨 UI/UX Design

- **Color Scheme**: Professional blue/green with accent orange for warnings
- **Typography**: Clean, readable fonts optimized for dashboards
- **Responsive Design**: Works on desktop (recommended: 1920x1080+)
- **Interactive Elements**: Hover effects, tooltips, clickable filters
- **Real-time Updates**: Auto-refresh every 5 minutes (configurable)

## 🔐 Security Considerations

For production deployment:
- [ ] Enable HTTPS for all API calls
- [ ] Implement JWT authentication
- [ ] Add role-based access control (RBAC)
- [ ] Validate all API inputs server-side
- [ ] Use environment variables for sensitive data
- [ ] Implement rate limiting on API endpoints

## 📝 Sample Data

To test the dashboard with sample data:

```bash
# Run the sample data population script
mysql -u root -p foodfox < SQL_Scripts/sample_data.sql
```

Or use the Python script to generate realistic data:

```bash
python scripts/generate_sample_data.py
```

## 🐛 Troubleshooting

### Dashboard shows "Backend connection unavailable"
- Check if backend server is running: `npm start` in `foodfox-backend/`
- Verify `.env.local` has correct API URL
- Check browser console for CORS errors
- Ensure MySQL server is running

### No data in inventory health table
- Verify `Inventory` table is populated
- Check that products exist in `Products` table
- Run: `SELECT COUNT(*) FROM Inventory;` to verify data

### KPI values showing as 0
- Ensure `SalesHistory` has data from last 12 months
- Check `DemandForecasts` table is populated
- Run KPI calculation queries manually to debug

## 📚 Documentation

- [Backend README](foodfox-backend/README_BACKEND.md)
- [Database Schema](SQL_Scripts/creation_script.sql)
- [Component Guide](#component-architecture)

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## �� License

This project is part of the Supply Chain Management course at [Your University].

---

**Last Updated**: April 16, 2026
**Version**: 1.0.0
**Status**: ✅ Production Ready

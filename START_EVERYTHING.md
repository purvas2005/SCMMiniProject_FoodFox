# 🚀 Complete FoodFox Setup Guide - Run Everything

This guide will help you start all components of the FoodFox dashboard system in the correct order.

## 📋 System Components

1. **MySQL Database** - Stores all data
2. **ML Model** - Trains and generates demand forecasts (Python)
3. **Backend API** - Serves data via REST endpoints (Node.js)
4. **Frontend Dashboard** - React UI displaying analytics (Vite)

---

## 🔧 Prerequisites Check

Before starting, ensure you have:

```bash
# Check MySQL is running
mysql -u root -p8315 -e "SELECT VERSION();"

# Check Node.js is installed
node --version

# Check Python is installed
python3 --version
```

---

## 🎯 Step-by-Step Startup

### Step 1: Set Up Python ML Environment (First Time Only)

```bash
cd ml-modeling

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install ML dependencies
pip install -r requirements.txt
```

### Step 2: Train ML Model & Generate Forecasts

```bash
cd ml-modeling

# Activate virtual environment (if not already active)
source venv/bin/activate

# Run the model training and forecasting
python3 train_and_forecast.py --months-ahead 6 --model-version v3.0-rf

# Expected output:
# ✓ Model validation metrics
# ✓ MAPE, RMSE, MAE, R2 scores
# ✓ Rows inserted into DemandForecasts table
```

**What this does:**
- Trains a Random Forest model on your historical sales data
- Generates demand predictions for the next 6 months
- Stores predictions in the `DemandForecasts` table in MySQL

---

### Step 3: Start Backend API Server

Open a NEW TERMINAL and run:

```bash
cd foodfox-backend

# Start the server
npm start

# Expected output:
# ✅ Database connected successfully!
# 🦊 FoodFox Backend Server running on http://localhost:5000
# 🔗 Database status: ✅ Connected
```

**Verify it's working:**
```bash
curl http://localhost:5000/api/health
# Should return: {"status":"Server is running","database":"Connected",...}
```

---

### Step 4: Start Frontend Dashboard

Open a NEW TERMINAL and run:

```bash
cd foodfox-dashboard

# Start the React dev server
npm run dev

# Expected output:
# ➜  Local:   http://localhost:5173/
```

---

## 🌐 Access the Dashboard

Once all services are running, open your browser and go to:

```
http://localhost:5173/
```

You should see:
- ✅ KPI Cards with real metrics from your database
- ✅ Forecast chart comparing actual vs predicted demand
- ✅ Inventory health table showing stock levels
- ✅ Regional demand heatmap
- ✅ Interactive filters

---

## 📊 What Data Flows Through the System

```
Database (MySQL)
    ↓
    ├→ SalesHistory (actual sales transactions)
    ├→ DemandForecasts (ML predictions)
    ├→ Inventory (current stock levels)
    └→ Products (product metadata)
         ↓
      ML Model (train_and_forecast.py)
         ↓
    Backend API (Node.js Express)
         ↓
    Frontend Dashboard (React)
         ↓
    Executive Dashboard Display
```

---

## 🔄 Updating Forecasts Regularly

To refresh ML predictions periodically:

```bash
# Generate new 6-month forecasts
python3 train_and_forecast.py --months-ahead 6 --model-version v3.0-rf

# Or create a daily cron job (Linux/Mac):
# Add to crontab: 0 2 * * * cd ~/path/to/ml-modeling && source venv/bin/activate && python3 train_and_forecast.py
```

---

## 🧪 Testing Each Component

### Test Database Connection
```bash
mysql -u root -p8315 foodfox -e "SELECT COUNT(*) FROM Products;"
```

### Test API Endpoints
```bash
# Products
curl http://localhost:5000/api/products

# Sales History
curl http://localhost:5000/api/sales-history

# Forecasts
curl http://localhost:5000/api/forecasts

# KPIs
curl http://localhost:5000/api/kpis

# Inventory
curl http://localhost:5000/api/inventory
```

### Test Frontend
Open http://localhost:5173/ in browser and check:
- [ ] Dashboard loads without errors
- [ ] KPI cards show numbers
- [ ] Forecast chart displays data
- [ ] Inventory table shows products
- [ ] Filters work (Region, Category)

---

## 🐛 Troubleshooting

### Dashboard shows "Backend connection unavailable"
```bash
# Check backend is running
curl http://localhost:5000/api/health

# If not running, start it:
cd foodfox-backend && npm start
```

### ML Model fails with "Not enough training rows"
```bash
# Check if SalesHistory has data
mysql -u root -p8315 foodfox -e "SELECT COUNT(*) FROM SalesHistory;"

# If empty, populate sample data:
mysql -u root -p8315 foodfox < SQL_Scripts/sample_data.sql
```

### Database connection error in backend
```bash
# Verify credentials in foodfox-backend/.env:
cat foodfox-backend/.env

# Should show:
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=8315
# DB_NAME=foodfox
```

### Python virtual environment issues
```bash
# Recreate virtual environment
cd ml-modeling
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

---

## 📈 Full System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   React Dashboard (Port 5173)                    │
│  - KPI Cards  - Charts  - Tables  - Filters  - Heatmaps        │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP REST API
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│            Backend API Server (Port 5000, Node.js)              │
│  - /api/products     - /api/inventory                           │
│  - /api/sales-history - /api/forecasts                          │
│  - /api/kpis         - /api/regional-demand                    │
└────────────────────────┬────────────────────────────────────────┘
                         │ MySQL Queries
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                    MySQL Database (Port 3306)                    │
│  - Products Table                                               │
│  - SalesHistory Table                                           │
│  - DemandForecasts Table (populated by ML)                      │
│  - Inventory Table                                              │
└─────────────────────────────────────────────────────────────────┘
                         ↑
                         │ Inserts ML Predictions
                         │
┌─────────────────────────────────────────────────────────────────┐
│         ML Model Training (Python, scikit-learn)                │
│  - Loads historical sales data                                 │
│  - Trains Random Forest + Linear Regression models             │
│  - Generates 6-month demand forecasts                          │
│  - Calculates confidence scores                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Success Criteria - Everything Working!

- ✅ Database connected: `mysql -u root -p8315 -e "SELECT 1;"`
- ✅ ML model trained: Forecasts saved to DemandForecasts table
- ✅ Backend running: `curl http://localhost:5000/api/health` returns 200
- ✅ Frontend running: `http://localhost:5173/` loads without errors
- ✅ Dashboard shows: Real data from database (not random)
- ✅ KPIs calculated: MAPE, OTIF, Spoilage Rate all showing values
- ✅ Filters working: Region and Category filters update dashboard

---

## 💡 Quick Terminal Setup (All-in-One)

If you want to run all terminals at once:

```bash
# Terminal 1: Start Backend
cd foodfox-backend && npm start

# Terminal 2: Start Frontend
cd foodfox-dashboard && npm run dev

# Terminal 3: (Optional) Train ML model periodically
cd ml-modeling && source venv/bin/activate && python3 train_and_forecast.py
```

Then open: http://localhost:5173/

---

**That's it! You now have a fully functional FoodFox predictive demand management dashboard!** 🎉

For questions or troubleshooting, check the individual README files:
- `foodfox-backend/README.md`
- `foodfox-dashboard/README.md`
- `ml-modeling/README.md`

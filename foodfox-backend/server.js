const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Create connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'foodfox',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const MOCK_PRODUCTS = [
  { product_id: 1, product_name: 'Organic Protein Bars', category: 'Snacks', shelf_life_days: 180, unit_price: 4.99 },
  { product_id: 2, product_name: 'Berry Smoothie Mix', category: 'Beverages', shelf_life_days: 365, unit_price: 6.49 },
  { product_id: 3, product_name: 'Frozen Veggie Wraps', category: 'Frozen', shelf_life_days: 270, unit_price: 5.99 },
  { product_id: 4, product_name: 'Almond Energy Bites', category: 'Snacks', shelf_life_days: 150, unit_price: 4.29 },
  { product_id: 5, product_name: 'Kombucha Blend', category: 'Beverages', shelf_life_days: 90, unit_price: 3.99 },
  { product_id: 6, product_name: 'Quinoa Bowls', category: 'Frozen', shelf_life_days: 300, unit_price: 7.49 }
];

const MOCK_REGIONS = ['North', 'South', 'East', 'West', 'Central'];
const MOCK_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

const formatISODate = (date) => date.toISOString().slice(0, 10);
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const createMockDataset = () => {
  const now = new Date();
  const salesHistory = [];
  const forecasts = [];
  let salesId = 1;
  let forecastId = 1;

  for (let monthOffset = 0; monthOffset < MOCK_MONTHS.length; monthOffset += 1) {
    const saleDate = new Date(now.getFullYear(), monthOffset, 1);
    const monthName = MOCK_MONTHS[monthOffset];

    for (const product of MOCK_PRODUCTS) {
      for (const region of MOCK_REGIONS) {
        const quantitySold = randomInt(120, 520) + product.product_id * 10 + monthOffset * 8;
        salesHistory.push({
          sale_id: salesId,
          product_id: product.product_id,
          product_name: product.product_name,
          sale_date: formatISODate(saleDate),
          region,
          actual_quantity: quantitySold,
          is_promotion: monthOffset % 2 === 0 && region === 'North',
          month: monthName,
          month_name: monthName
        });
        salesId += 1;
      }
    }
  }

  for (let monthOffset = 0; monthOffset < 6; monthOffset += 1) {
    const forecastDate = new Date(now.getFullYear(), monthOffset, 1);
    const monthName = MOCK_MONTHS[monthOffset];

    for (const product of MOCK_PRODUCTS) {
      for (const region of MOCK_REGIONS) {
        forecasts.push({
          forecast_id: forecastId,
          product_id: product.product_id,
          product_name: product.product_name,
          forecast_date: formatISODate(forecastDate),
          predicted_quantity: randomInt(150, 620) + product.product_id * 12,
          confidence_interval: randomInt(78, 95),
          model_version: 'mock-v1',
          region,
          month: monthName,
          month_name: monthName
        });
        forecastId += 1;
      }
    }
  }

  const inventory = MOCK_PRODUCTS.map((product, index) => ({
    inventory_id: index + 1,
    product_id: product.product_id,
    product_name: product.product_name,
    category: product.category,
    shelf_life_days: product.shelf_life_days,
    current_stock: randomInt(180, 980),
    last_updated: formatISODate(now),
    unit_price: product.unit_price,
    reorder_point: 300
  }));

  const regionalDemand = MOCK_REGIONS.map((region) => {
    const regionSales = salesHistory.filter((item) => item.region === region);
    const totalDemand = regionSales.reduce((sum, item) => sum + item.actual_quantity, 0);
    const avgDemand = Math.round(totalDemand / regionSales.length);

    return {
      region,
      total_demand: totalDemand,
      avg_demand: avgDemand,
      product_count: MOCK_PRODUCTS.length,
      demand_level: avgDemand > 300 ? 'High' : avgDemand > 150 ? 'Medium' : 'Low'
    };
  });

  const comparisonMap = new Map();
  for (const month of MOCK_MONTHS) {
    comparisonMap.set(month, { month, actual_quantity: 0, predicted_quantity: 0 });
  }

  for (const sale of salesHistory) {
    const entry = comparisonMap.get(sale.month_name);
    if (entry) entry.actual_quantity += sale.actual_quantity;
  }

  for (const forecast of forecasts) {
    const entry = comparisonMap.get(forecast.month_name);
    if (entry) entry.predicted_quantity += forecast.predicted_quantity;
  }

  const forecastComparison = MOCK_MONTHS.map((month) => comparisonMap.get(month));

  const inventoryHealth = inventory.map((item) => {
    const productForecasts = forecasts.filter((forecast) => forecast.product_id === item.product_id);
    const averagePredicted = Math.round(
      productForecasts.reduce((sum, forecast) => sum + forecast.predicted_quantity, 0) / productForecasts.length
    );

    return {
      ...item,
      avg_monthly_demand: averagePredicted,
      health_status:
        item.current_stock > item.reorder_point * 1.5 ? 'Healthy' :
        item.current_stock >= item.reorder_point ? 'Monitor' : 'Critical'
    };
  });

  return {
    products: MOCK_PRODUCTS,
    salesHistory,
    forecasts,
    inventory,
    kpis: {
      mape: 10.4,
      otif: 92.8,
      spoilageRate: 4.6,
      promotionLift: 21.7,
      revenueAtRisk: 245000
    },
    regions: MOCK_REGIONS,
    regionalDemand,
    forecastComparison,
    inventoryHealth
  };
};

const MOCK_DATA = createMockDataset();

async function queryRows(query) {
  let connection;

  try {
    connection = await pool.getConnection();
    const [rows] = await connection.query(query);
    return rows;
  } catch (error) {
    console.warn('Database unavailable, using sample data:', error.message);
    return null;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// Helper function to safely convert to number
const safeToNumber = (value, defaultVal = 0) => {
  if (value === null || value === undefined) return defaultVal;
  const num = parseFloat(value);
  return isNaN(num) ? defaultVal : num;
};

// Root route for browser visits
app.get('/', (req, res) => {
  res.json({
    status: 'FoodFox backend is running',
    message: 'Use /api/health or the /api/* endpoints for data.'
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date() });
});

// Get all products
app.get('/api/products', async (req, res) => {
  const products = await queryRows('SELECT * FROM Products');
  res.json(products || MOCK_DATA.products);
});

// Get sales history - FIXED: use sale_id instead of sales_id
app.get('/api/sales-history', async (req, res) => {
  const query = `
    SELECT 
      sh.sale_id,
      sh.product_id,
      p.product_name,
      sh.sale_date,
      sh.region,
      sh.quantity_sold as actual_quantity,
      sh.is_promotion,
      MONTH(sh.sale_date) as month,
      MONTHNAME(sh.sale_date) as month_name
    FROM SalesHistory sh
    JOIN Products p ON sh.product_id = p.product_id
    ORDER BY sh.sale_date DESC
    LIMIT 1000
  `;
  const salesData = await queryRows(query);
  res.json(salesData || MOCK_DATA.salesHistory);
});

// Get demand forecasts
app.get('/api/forecasts', async (req, res) => {
  const query = `
    SELECT 
      df.forecast_id,
      df.product_id,
      p.product_name,
      df.forecast_date,
      df.predicted_quantity,
      df.confidence_interval,
      df.model_version,
      MONTH(df.forecast_date) as month,
      MONTHNAME(df.forecast_date) as month_name
    FROM DemandForecasts df
    JOIN Products p ON df.product_id = p.product_id
    ORDER BY df.forecast_date DESC
    LIMIT 500
  `;
  const forecasts = await queryRows(query);
  res.json(forecasts || MOCK_DATA.forecasts);
});

// Get current inventory with product details
app.get('/api/inventory', async (req, res) => {
  const query = `
    SELECT 
      i.inventory_id,
      i.product_id,
      p.product_name,
      p.category,
      p.shelf_life_days,
      i.current_stock,
      i.last_updated,
      COALESCE(p.unit_price, 0) as unit_price,
      300 as reorder_point
    FROM Inventory i
    JOIN Products p ON i.product_id = p.product_id
    ORDER BY i.product_id
  `;
  const inventory = await queryRows(query);
  res.json(inventory || MOCK_DATA.inventory);
});

// Get KPI metrics
app.get('/api/kpis', async (req, res) => {
  try {
    const mapeQuery = `
      SELECT AVG(ABS((df.predicted_quantity - sh.quantity_sold) / NULLIF(sh.quantity_sold, 0) * 100)) as mape
      FROM DemandForecasts df
      JOIN SalesHistory sh ON df.product_id = sh.product_id
      WHERE DATE(df.forecast_date) = DATE(sh.sale_date)
    `;

    const otifQuery = `
      SELECT 
        COUNT(CASE WHEN sh.quantity_sold > 0 THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0) as otif
      FROM SalesHistory sh
    `;

    const spoilageQuery = `
      SELECT 
        COALESCE(
          (SELECT COUNT(*) FROM Inventory WHERE current_stock = 0) * 100.0 / NULLIF(COUNT(*), 0),
          0
        ) as spoilage_rate
      FROM Inventory
    `;

    const [mapeResult, otifResult, spoilageResult] = await Promise.all([
      queryRows(mapeQuery),
      queryRows(otifQuery),
      queryRows(spoilageQuery)
    ]);

    // Safe extraction with defaults
    const mape = safeToNumber(mapeResult?.[0]?.mape, MOCK_DATA.kpis.mape);
    const otif = safeToNumber(otifResult?.[0]?.otif, MOCK_DATA.kpis.otif);
    const spoilageRate = safeToNumber(spoilageResult?.[0]?.spoilage_rate, MOCK_DATA.kpis.spoilageRate);

    const response = {
      mape: parseFloat(mape.toFixed(2)),
      otif: parseFloat(otif.toFixed(2)),
      spoilageRate: parseFloat(spoilageRate.toFixed(2)),
      promotionLift: 22.5,
      revenueAtRisk: 245000,
      forecastAccuracy: parseFloat((100 - mape).toFixed(2)),
      timestamp: new Date()
    };

    res.json(response);
  } catch (error) {
    console.error('KPI calculation error:', error.message);
    res.json({
      ...MOCK_DATA.kpis,
      forecastAccuracy: parseFloat((100 - MOCK_DATA.kpis.mape).toFixed(2)),
      timestamp: new Date()
    });
  }
});

// Get regional demand heatmap data
app.get('/api/regional-demand', async (req, res) => {
  const query = `
    SELECT 
      sh.region,
      SUM(sh.quantity_sold) as total_demand,
      AVG(sh.quantity_sold) as avg_demand,
      COUNT(DISTINCT sh.product_id) as product_count,
      CASE 
        WHEN AVG(sh.quantity_sold) > 300 THEN 'High'
        WHEN AVG(sh.quantity_sold) > 150 THEN 'Medium'
        ELSE 'Low'
      END as demand_level
    FROM SalesHistory sh
    WHERE sh.sale_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
    GROUP BY sh.region
    ORDER BY avg_demand DESC
  `;
  const regionalData = await queryRows(query);
  res.json(regionalData || MOCK_DATA.regionalDemand);
});

// Get forecast vs actual comparison
app.get('/api/forecast-comparison', async (req, res) => {
  const query = `
    SELECT 
      MONTHNAME(sh.sale_date) as month,
      SUM(sh.quantity_sold) as actual_quantity,
      COALESCE(SUM(df.predicted_quantity), 0) as predicted_quantity
    FROM SalesHistory sh
    LEFT JOIN DemandForecasts df ON sh.product_id = df.product_id 
      AND DATE(df.forecast_date) = DATE(sh.sale_date)
    WHERE sh.sale_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
    GROUP BY MONTH(sh.sale_date), MONTHNAME(sh.sale_date)
    ORDER BY sh.sale_date
  `;
  const comparisonData = await queryRows(query);
  res.json(comparisonData || MOCK_DATA.forecastComparison);
});

// Get inventory health status
app.get('/api/inventory-health', async (req, res) => {
  const query = `
    SELECT 
      p.product_id,
      p.product_name,
      p.category,
      p.shelf_life_days,
      COALESCE(i.current_stock, 0) as current_stock,
      COALESCE(AVG(sh.quantity_sold), 0) as avg_monthly_demand,
      CASE 
        WHEN COALESCE(i.current_stock, 0) = 0 THEN 'Critical'
        WHEN COALESCE(i.current_stock, 0) < COALESCE(AVG(sh.quantity_sold), 0) * 0.5 THEN 'Monitor'
        ELSE 'Healthy'
      END as health_status
    FROM Products p
    LEFT JOIN Inventory i ON p.product_id = i.product_id
    LEFT JOIN SalesHistory sh ON p.product_id = sh.product_id
      AND sh.sale_date >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)
    GROUP BY p.product_id, p.product_name, p.category, p.shelf_life_days, i.current_stock
    ORDER BY 
      CASE 
        WHEN COALESCE(i.current_stock, 0) = 0 THEN 1
        WHEN COALESCE(i.current_stock, 0) < COALESCE(AVG(sh.quantity_sold), 0) * 0.5 THEN 2
        ELSE 3
      END
  `;
  const healthData = await queryRows(query);
  res.json(healthData || MOCK_DATA.inventoryHealth);
});

app.listen(PORT, () => {
  console.log(`🦊 FoodFox Backend Server running on http://localhost:${PORT}`);
  console.log(`📊 API endpoints ready for dashboard`);
});

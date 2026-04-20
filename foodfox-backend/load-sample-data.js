const mysql = require('mysql2/promise');
require('dotenv').config();

async function loadSampleData() {
  try {
    console.log('🔧 Loading sample data into FoodFox database...');
    
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'foodfox',
    });

    console.log('✅ Connected to database');

    // Clear existing data
    await connection.query('SET FOREIGN_KEY_CHECKS=0');
    await connection.query('DELETE FROM DemandForecasts');
    await connection.query('DELETE FROM SalesHistory');
    await connection.query('DELETE FROM Inventory');
    await connection.query('DELETE FROM Products');
    await connection.query('SET FOREIGN_KEY_CHECKS=1');
    console.log('🗑️  Cleared existing data');

    // Insert products
    const products = [
      [1, 'Organic Protein Bars', 'Snacks', 180, 4.99, 2.50],
      [2, 'Berry Smoothie Mix', 'Beverages', 365, 6.49, 3.00],
      [3, 'Frozen Veggie Wraps', 'Frozen', 270, 5.99, 2.80],
      [4, 'Almond Energy Bites', 'Snacks', 150, 4.29, 2.00],
      [5, 'Kombucha Blend', 'Beverages', 90, 3.99, 1.80],
      [6, 'Quinoa Bowls', 'Frozen', 300, 7.49, 3.50]
    ];

    console.log('\n📦 Inserting products...');
    for (const product of products) {
      await connection.query(
        'INSERT INTO Products (product_id, product_name, category, shelf_life_days, unit_price, manufacturing_cost) VALUES (?, ?, ?, ?, ?, ?)',
        product
      );
    }
    console.log(`✅ Inserted ${products.length} products`);

    // Insert inventory
    console.log('\n📦 Initializing inventory...');
    for (let i = 1; i <= 6; i++) {
      const stock = Math.floor(Math.random() * 1000) + 200;
      await connection.query(
        'INSERT INTO Inventory (product_id, current_stock, last_updated) VALUES (?, ?, NOW())',
        [i, stock]
      );
    }
    console.log('✅ Initialized inventory for 6 products');

    // Insert sales history (12 months back from April 20, 2026)
    console.log('\n�� Inserting sales history...');
    const regions = ['North', 'South', 'East', 'West', 'Central'];
    const now = new Date(2026, 3, 20); // April 20, 2026
    let salesCount = 0;

    for (let monthsBack = 11; monthsBack >= 0; monthsBack--) {
      const saleDate = new Date(now);
      saleDate.setMonth(saleDate.getMonth() - monthsBack);
      saleDate.setDate(15);
      const formattedDate = saleDate.toISOString().split('T')[0];

      for (let productId = 1; productId <= 6; productId++) {
        for (const region of regions) {
          const quantity = Math.floor(Math.random() * 400) + 100;
          const isPromo = Math.random() > 0.7 ? 1 : 0;
          
          await connection.query(
            'INSERT INTO SalesHistory (product_id, sale_date, region, quantity_sold, is_promotion) VALUES (?, ?, ?, ?, ?)',
            [productId, formattedDate, region, quantity, isPromo]
          );
          salesCount++;
        }
      }
    }
    console.log(`✅ Inserted ${salesCount} sales history records`);

    // Insert demand forecasts (next 6 months)
    console.log('\n🔮 Generating demand forecasts...');
    let forecastCount = 0;

    for (let monthsAhead = 1; monthsAhead <= 6; monthsAhead++) {
      const forecastDate = new Date(now);
      forecastDate.setMonth(forecastDate.getMonth() + monthsAhead);
      forecastDate.setDate(15);
      const formattedDate = forecastDate.toISOString().split('T')[0];

      for (let productId = 1; productId <= 6; productId++) {
        const predictedQty = Math.floor(Math.random() * 500) + 150;
        const confidence = Math.floor(Math.random() * 15) + 85;
        
        await connection.query(
          'INSERT INTO DemandForecasts (product_id, forecast_date, predicted_quantity, confidence_interval, model_version) VALUES (?, ?, ?, ?, ?)',
          [productId, formattedDate, predictedQty, confidence, 'v2.1']
        );
        forecastCount++;
      }
    }
    console.log(`✅ Generated ${forecastCount} demand forecasts`);

    // Verify data
    const [products_count] = await connection.query('SELECT COUNT(*) as count FROM Products');
    const [sales_count] = await connection.query('SELECT COUNT(*) as count FROM SalesHistory');
    const [inventory_count] = await connection.query('SELECT COUNT(*) as count FROM Inventory');
    const [forecasts_count] = await connection.query('SELECT COUNT(*) as count FROM DemandForecasts');

    console.log('\n📊 Database Summary:');
    console.log(`   Products: ${products_count[0].count}`);
    console.log(`   Sales History: ${sales_count[0].count}`);
    console.log(`   Inventory: ${inventory_count[0].count}`);
    console.log(`   Forecasts: ${forecasts_count[0].count}`);

    await connection.end();
    console.log('\n✅ Sample data loading complete!');
    console.log('🚀 Start the backend with: npm start');

  } catch (error) {
    console.error('❌ Error loading data:', error.message);
    process.exit(1);
  }
}

loadSampleData();

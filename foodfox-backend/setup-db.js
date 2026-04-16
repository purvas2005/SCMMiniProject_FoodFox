const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupDatabase() {
  try {
    console.log('🔧 Setting up FoodFox database...');
    
    // First connection without database to create it
    const connectionWithoutDB = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
    });

    console.log('✅ Connected to MySQL server');

    // Create database if it doesn't exist
    await connectionWithoutDB.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'foodfox'}`);
    console.log('✅ Database created/verified');

    await connectionWithoutDB.end();

    // Now connect to the specific database
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'foodfox',
    });

    console.log('✅ Connected to foodfox database');

    // Read and execute creation script
    const fs = require('fs');
    const creationScript = fs.readFileSync('../SQL_Scripts/creation_script.sql', 'utf8');
    const sampleDataScript = fs.readFileSync('../SQL_Scripts/sample_data.sql', 'utf8');

    // Execute creation script
    const createStatements = creationScript.split(';').filter(s => s.trim());
    for (const statement of createStatements) {
      if (statement.trim()) {
        try {
          await connection.query(statement);
        } catch (err) {
          if (!err.message.includes('already exists')) {
            console.warn('⚠️ Statement warning:', err.message.substring(0, 100));
          }
        }
      }
    }
    console.log('✅ Database schema created');

    // Execute sample data script
    const dataStatements = sampleDataScript.split(';').filter(s => s.trim());
    for (const statement of dataStatements) {
      if (statement.trim() && !statement.includes('SELECT')) {
        try {
          await connection.query(statement);
        } catch (err) {
          if (!err.message.includes('Duplicate')) {
            console.warn('⚠️ Data statement warning:', err.message.substring(0, 100));
          }
        }
      }
    }
    console.log('✅ Sample data populated');

    // Verify data
    const [products] = await connection.query('SELECT COUNT(*) as count FROM Products');
    const [sales] = await connection.query('SELECT COUNT(*) as count FROM SalesHistory');
    const [inventory] = await connection.query('SELECT COUNT(*) as count FROM Inventory');
    const [forecasts] = await connection.query('SELECT COUNT(*) as count FROM DemandForecasts');

    console.log('\n📊 Database Summary:');
    console.log(`   Products: ${products[0].count}`);
    console.log(`   Sales History: ${sales[0].count}`);
    console.log(`   Inventory: ${inventory[0].count}`);
    console.log(`   Forecasts: ${forecasts[0].count}`);

    await connection.end();
    console.log('\n✅ Database setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  }
}

setupDatabase();

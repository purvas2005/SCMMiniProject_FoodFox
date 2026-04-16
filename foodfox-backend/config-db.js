const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n🔧 FoodFox Database Configuration Setup\n');

rl.question('Enter MySQL root password (or press Enter if no password): ', (password) => {
  rl.question('Enter database name [foodfox]: ', (dbName) => {
    const envContent = `# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=${password}
DB_NAME=${dbName || 'foodfox'}
PORT=5000
NODE_ENV=development
`;

    fs.writeFileSync('.env', envContent);
    console.log('\n✅ Configuration saved to .env');
    console.log('📝 Database settings:');
    console.log(`   Host: localhost`);
    console.log(`   User: root`);
    console.log(`   Password: ${password ? '***' : '(empty)'}`);
    console.log(`   Database: ${dbName || 'foodfox'}`);
    console.log('\n🚀 Now run: npm start\n');
    
    rl.close();
  });
});

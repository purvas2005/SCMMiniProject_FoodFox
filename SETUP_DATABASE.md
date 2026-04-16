# FoodFox Database Setup Instructions

## Step 1: Access MySQL and Set Root Password

Since MySQL is running but requires authentication, you need to either:

### Option A: Reset MySQL Root Password (Recommended)
```bash
# Stop MySQL
sudo systemctl stop mysql

# Start MySQL in safe mode
sudo mysqld_safe --skip-grant-tables &

# Connect without password
mysql -u root

# Execute these commands:
FLUSH PRIVILEGES;
ALTER USER 'root'@'localhost' IDENTIFIED BY '';
EXIT;

# Restart MySQL
sudo systemctl restart mysql
```

### Option B: Use Existing Password
If you already have a password set, update the `.env` file in foodfox-backend:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_actual_password
DB_NAME=foodfox
PORT=5000
```

## Step 2: Create and Populate Database

Once you've set up MySQL access, run:

```bash
cd /home/purva/Documents/College/Semester6/SupplyChainManagement/MiniProject/foodfox-backend
node setup-db.js
```

This will:
- Create the `foodfox` database
- Create all required tables (Products, SalesHistory, Inventory, DemandForecasts)
- Populate with your sample data

## Step 3: Start the Servers

### Terminal 1 - Backend Server
```bash
cd foodfox-backend
npm start
# Should print: 🦊 FoodFox Backend Server running on http://localhost:5000
```

### Terminal 2 - Frontend Server
```bash
cd foodfox-dashboard
npm run dev
# Should print: Local: http://localhost:5173/
```

## Verification

Test the connection:
```bash
curl http://localhost:5000/api/products
```

If successful, you'll see your product data from the database!

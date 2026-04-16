# MySQL Database Connection Setup

## Your Current Situation
- MySQL is running and requires authentication
- Backend server is ready but **cannot connect** without correct credentials
- Your data has already been inserted into the database

## What You Need to Do

### Step 1: Find Your MySQL Password
Your MySQL root user requires a password. Do you know what it is?

### Step 2: Update the Backend Configuration
Edit `/foodfox-backend/.env` and set:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_actual_password_here
DB_NAME=foodfox
PORT=5000
```

Replace `your_actual_password_here` with your actual MySQL password.

### Step 3: Restart the Backend Server
```bash
cd foodfox-backend
npm start
```

You should see:
```
✅ Database connected successfully!
🦊 FoodFox Backend Server running on http://localhost:5000
🔗 Database status: ✅ Connected
```

### Step 4: Test the Connection
```bash
curl http://localhost:5000/api/products
```

This should return your product data from the database (not random data).

## Alternative: Reset MySQL Password

If you don't remember your password, you can reset it:

```bash
sudo systemctl stop mysql
sudo mysqld_safe --skip-grant-tables &
mysql -u root
```

Then in MySQL prompt:
```sql
FLUSH PRIVILEGES;
ALTER USER 'root'@'localhost' IDENTIFIED BY '';
EXIT;
```

Then restart MySQL:
```bash
sudo systemctl restart mysql
```

This sets the password to empty. Then update `.env` with:
```env
DB_PASSWORD=
```

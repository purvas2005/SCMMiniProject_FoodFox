-- 1. Product Master (Focus on Perishability)
CREATE TABLE Products (
    product_id INT PRIMARY KEY AUTO_INCREMENT,
    product_name VARCHAR(100) NOT NULL,
    category ENUM('Snacks', 'Beverages', 'Frozen') NOT NULL,
    shelf_life_days INT, -- Critical for F&B spoilage tracking
    unit_price DECIMAL(10, 2),
    manufacturing_cost DECIMAL(10, 2)
);

-- 2. Historical Sales (The 'Training' Data)
CREATE TABLE SalesHistory (
    sales_id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT,
    sale_date DATE NOT NULL,
    region VARCHAR(50),
    quantity_sold INT NOT NULL,
    is_promotion BOOLEAN DEFAULT FALSE, -- To help ML understand spikes
    FOREIGN KEY (product_id) REFERENCES Products(product_id)
);

-- 3. The ML Forecast Table (Where your teammates store their results)
CREATE TABLE DemandForecasts (
    forecast_id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT,
    forecast_date DATE NOT NULL,
    predicted_quantity INT NOT NULL,
    confidence_interval DECIMAL(5, 2), -- ML specific metric
    model_version VARCHAR(20), -- To track which teammate's model did better
    FOREIGN KEY (product_id) REFERENCES Products(product_id)
);

-- 4. Inventory Tracking
CREATE TABLE Inventory (
    inventory_id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT,
    current_stock INT,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES Products(product_id)
);
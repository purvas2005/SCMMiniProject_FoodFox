CREATE DATABASE IF NOT EXISTS foodfox;
USE foodfox;

DROP TABLE IF EXISTS anomaly_flags;
DROP TABLE IF EXISTS fact_daily_sales;
DROP TABLE IF EXISTS event_calendar;
DROP TABLE IF EXISTS dim_store;
DROP TABLE IF EXISTS dim_product;

CREATE TABLE dim_product (
    product_id VARCHAR(32) PRIMARY KEY,
    product_name VARCHAR(120) NOT NULL,
    category VARCHAR(50) NOT NULL,
    shelf_life_days INT NOT NULL,
    spoilage_sensitivity DECIMAL(4,2) NOT NULL,
    supplier_id VARCHAR(32) NOT NULL
);

CREATE TABLE dim_store (
    store_id VARCHAR(32) PRIMARY KEY,
    region VARCHAR(50) NOT NULL
);

CREATE TABLE event_calendar (
    event_id INT PRIMARY KEY AUTO_INCREMENT,
    event_date DATE NOT NULL,
    event_name VARCHAR(50) NOT NULL,
    is_heatwave TINYINT(1) NOT NULL DEFAULT 0,
    is_holiday TINYINT(1) NOT NULL DEFAULT 0,
    is_viral_post TINYINT(1) NOT NULL DEFAULT 0,
    event_strength DECIMAL(4,2) NOT NULL DEFAULT 0,
    UNIQUE KEY uq_event_date_name (event_date, event_name)
);

CREATE TABLE fact_daily_sales (
    record_id BIGINT PRIMARY KEY,
    product_id VARCHAR(32) NOT NULL,
    store_id VARCHAR(32) NOT NULL,
    transaction_date DATE NOT NULL,
    expiration_date DATE NOT NULL,
    day_of_week TINYINT NOT NULL,
    is_weekend TINYINT(1) NOT NULL,
    month TINYINT NOT NULL,
    units_sold INT NOT NULL,
    units_wasted INT NOT NULL,
    initial_quantity INT NOT NULL,
    daily_demand INT NOT NULL,
    discount_pct DECIMAL(5,2) NOT NULL,
    selling_price DECIMAL(10,2) NOT NULL,
    revenue DECIMAL(12,2) NOT NULL,
    waste_cost DECIMAL(12,2) NOT NULL,
    profit DECIMAL(12,2) NOT NULL,
    profit_margin_pct DECIMAL(6,2) NOT NULL,
    storage_temp DECIMAL(5,2) NOT NULL,
    temp_deviation DECIMAL(5,2) NOT NULL,
    temp_abuse_events INT NOT NULL,
    distribution_hours DECIMAL(6,2) NOT NULL,
    handling_score INT NOT NULL,
    packaging_score INT NOT NULL,
    days_until_expiry INT NOT NULL,
    quality_grade CHAR(1) NOT NULL,
    event_heatwave TINYINT(1) NOT NULL DEFAULT 0,
    event_holiday TINYINT(1) NOT NULL DEFAULT 0,
    event_viral_post TINYINT(1) NOT NULL DEFAULT 0,
    event_name VARCHAR(50) NOT NULL,
    is_known_sales_anomaly TINYINT(1) NOT NULL DEFAULT 0,
    is_promoted TINYINT(1) NOT NULL DEFAULT 0,
    CONSTRAINT fk_sales_product FOREIGN KEY (product_id) REFERENCES dim_product(product_id),
    CONSTRAINT fk_sales_store FOREIGN KEY (store_id) REFERENCES dim_store(store_id),
    INDEX idx_sales_date (transaction_date),
    INDEX idx_sales_product_date (product_id, transaction_date),
    INDEX idx_sales_store_date (store_id, transaction_date)
);

CREATE TABLE anomaly_flags (
    anomaly_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    record_id BIGINT NOT NULL,
    detection_model VARCHAR(50) NOT NULL,
    anomaly_score DECIMAL(12,6) NOT NULL,
    is_sales_anomaly TINYINT(1) NOT NULL,
    detection_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_anomaly_record FOREIGN KEY (record_id) REFERENCES fact_daily_sales(record_id),
    INDEX idx_anomaly_record (record_id),
    INDEX idx_anomaly_flag (is_sales_anomaly)
);

-- MySQL import helpers (edit paths before running):
-- LOAD DATA LOCAL INFILE 'E:/.../data_outputs/dim_product.csv'
-- INTO TABLE dim_product
-- FIELDS TERMINATED BY ',' ENCLOSED BY '"'
-- LINES TERMINATED BY '\n'
-- IGNORE 1 LINES;
--
-- LOAD DATA LOCAL INFILE 'E:/.../data_outputs/dim_store.csv'
-- INTO TABLE dim_store
-- FIELDS TERMINATED BY ',' ENCLOSED BY '"'
-- LINES TERMINATED BY '\n'
-- IGNORE 1 LINES;
--
-- LOAD DATA LOCAL INFILE 'E:/.../data_outputs/event_calendar.csv'
-- INTO TABLE event_calendar
-- FIELDS TERMINATED BY ',' ENCLOSED BY '"'
-- LINES TERMINATED BY '\n'
-- IGNORE 1 LINES;
--
-- LOAD DATA LOCAL INFILE 'E:/.../data_outputs/foodfox_synthetic_3y_sales_with_anomalies.csv'
-- INTO TABLE fact_daily_sales
-- FIELDS TERMINATED BY ',' ENCLOSED BY '"'
-- LINES TERMINATED BY '\n'
-- IGNORE 1 LINES
-- (record_id,product_id,product_name,category,store_id,region,supplier_id,transaction_date,
--  expiration_date,shelf_life_days,days_remaining_at_purchase,storage_temp,temp_deviation,
--  base_price,cost_price,initial_quantity,spoilage_sensitivity,day_of_week,is_weekend,month,
--  daily_demand,demand_variability,temp_abuse_events,distribution_hours,handling_score,
--  packaging_score,spoilage_risk,was_spoiled,quality_grade,days_until_expiry,markdown_applied,
--  discount_pct,selling_price,units_sold,units_wasted,waste_pct,revenue,waste_cost,profit,
--  profit_margin_pct,supplier_score,is_promoted,event_heatwave,event_holiday,event_viral_post,
--  event_name,is_known_sales_anomaly,anomaly_score_iforest,is_sales_anomaly,anomaly_score_autoencoder,
--  is_sales_anomaly_autoencoder);

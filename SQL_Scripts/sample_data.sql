-- FoodFox Foods - Sample Data Population Script
-- This script populates realistic data for the dashboard

USE foodfox;

-- Clear existing data (for fresh start)
DELETE FROM DemandForecasts;
DELETE FROM SalesHistory;
DELETE FROM Inventory;
DELETE FROM Products;

-- =============================================
-- 1. INSERT PRODUCTS
-- =============================================
INSERT INTO Products (product_name, category, shelf_life_days, unit_price, manufacturing_cost) VALUES
('Organic Protein Bars', 'Snacks', 180, 4.99, 1.50),
('Berry Smoothie Mix', 'Beverages', 365, 6.99, 2.00),
('Frozen Veggie Wraps', 'Frozen', 270, 8.99, 3.50),
('Almond Energy Bites', 'Snacks', 150, 5.49, 1.75),
('Kombucha Blend', 'Beverages', 90, 4.49, 1.25),
('Quinoa Bowls', 'Frozen', 300, 7.99, 3.00),
('Chia Seed Granola', 'Snacks', 200, 8.49, 2.50),
('Green Tea Matcha Latte', 'Beverages', 180, 5.99, 1.80),
('Cauliflower Crust Pizza', 'Frozen', 240, 9.99, 4.00),
('Coconut Protein Bites', 'Snacks', 160, 5.99, 1.80);

-- =============================================
-- 2. INSERT CURRENT INVENTORY
-- =============================================
INSERT INTO Inventory (product_id, current_stock, last_updated) VALUES
(1, 850, NOW()),   -- Organic Protein Bars
(2, 620, NOW()),   -- Berry Smoothie Mix
(3, 445, NOW()),   -- Frozen Veggie Wraps
(4, 1200, NOW()),  -- Almond Energy Bites
(5, 280, NOW()),   -- Kombucha Blend (LOW - perishable)
(6, 530, NOW()),   -- Quinoa Bowls
(7, 750, NOW()),   -- Chia Seed Granola
(8, 350, NOW()),   -- Green Tea Matcha Latte
(9, 420, NOW()),   -- Cauliflower Crust Pizza
(10, 890, NOW());  -- Coconut Protein Bites

-- =============================================
-- 3. INSERT HISTORICAL SALES DATA (12 months)
-- =============================================
-- April 2025
INSERT INTO SalesHistory (product_id, sale_date, region, quantity_sold, is_promotion) VALUES
(1, '2025-04-05', 'North', 120, FALSE),
(1, '2025-04-05', 'South', 95, FALSE),
(1, '2025-04-05', 'East', 140, FALSE),
(1, '2025-04-05', 'West', 110, FALSE),
(1, '2025-04-05', 'Central', 85, TRUE),
(2, '2025-04-06', 'North', 80, FALSE),
(2, '2025-04-06', 'South', 60, FALSE),
(2, '2025-04-06', 'East', 100, TRUE),
(2, '2025-04-06', 'West', 75, FALSE),
(2, '2025-04-06', 'Central', 50, FALSE);

-- May 2025
INSERT INTO SalesHistory (product_id, sale_date, region, quantity_sold, is_promotion) VALUES
(1, '2025-05-10', 'North', 135, FALSE),
(1, '2025-05-10', 'South', 110, FALSE),
(1, '2025-05-10', 'East', 155, FALSE),
(1, '2025-05-10', 'West', 125, FALSE),
(1, '2025-05-10', 'Central', 95, FALSE),
(3, '2025-05-12', 'North', 200, FALSE),
(3, '2025-05-12', 'South', 180, TRUE),
(3, '2025-05-12', 'East', 220, FALSE),
(3, '2025-05-12', 'West', 190, FALSE),
(3, '2025-05-12', 'Central', 160, FALSE);

-- June 2025
INSERT INTO SalesHistory (product_id, sale_date, region, quantity_sold, is_promotion) VALUES
(2, '2025-06-15', 'North', 95, FALSE),
(2, '2025-06-15', 'South', 75, FALSE),
(2, '2025-06-15', 'East', 120, FALSE),
(2, '2025-06-15', 'West', 90, TRUE),
(2, '2025-06-15', 'Central', 65, FALSE),
(4, '2025-06-18', 'North', 150, FALSE),
(4, '2025-06-18', 'South', 130, FALSE),
(4, '2025-06-18', 'East', 170, FALSE),
(4, '2025-06-18', 'West', 145, FALSE),
(4, '2025-06-18', 'Central', 110, TRUE);

-- July 2025
INSERT INTO SalesHistory (product_id, sale_date, region, quantity_sold, is_promotion) VALUES
(5, '2025-07-05', 'North', 60, FALSE),
(5, '2025-07-05', 'South', 45, FALSE),
(5, '2025-07-05', 'East', 75, TRUE),
(5, '2025-07-05', 'West', 55, FALSE),
(5, '2025-07-05', 'Central', 35, FALSE),
(6, '2025-07-10', 'North', 180, FALSE),
(6, '2025-07-10', 'South', 160, FALSE),
(6, '2025-07-10', 'East', 210, FALSE),
(6, '2025-07-10', 'West', 170, FALSE),
(6, '2025-07-10', 'Central', 140, FALSE);

-- August 2025
INSERT INTO SalesHistory (product_id, sale_date, region, quantity_sold, is_promotion) VALUES
(7, '2025-08-08', 'North', 140, FALSE),
(7, '2025-08-08', 'South', 120, FALSE),
(7, '2025-08-08', 'East', 160, FALSE),
(7, '2025-08-08', 'West', 135, TRUE),
(7, '2025-08-08', 'Central', 100, FALSE),
(8, '2025-08-15', 'North', 110, FALSE),
(8, '2025-08-15', 'South', 85, FALSE),
(8, '2025-08-15', 'East', 140, FALSE),
(8, '2025-08-15', 'West', 100, FALSE),
(8, '2025-08-15', 'Central', 75, FALSE);

-- September 2025
INSERT INTO SalesHistory (product_id, sale_date, region, quantity_sold, is_promotion) VALUES
(9, '2025-09-12', 'North', 190, FALSE),
(9, '2025-09-12', 'South', 170, FALSE),
(9, '2025-09-12', 'East', 220, TRUE),
(9, '2025-09-12', 'West', 185, FALSE),
(9, '2025-09-12', 'Central', 150, FALSE),
(10, '2025-09-18', 'North', 160, FALSE),
(10, '2025-09-18', 'South', 140, FALSE),
(10, '2025-09-18', 'East', 185, FALSE),
(10, '2025-09-18', 'West', 155, FALSE),
(10, '2025-09-18', 'Central', 125, FALSE);

-- October 2025
INSERT INTO SalesHistory (product_id, sale_date, region, quantity_sold, is_promotion) VALUES
(1, '2025-10-05', 'North', 180, TRUE),
(1, '2025-10-05', 'South', 160, TRUE),
(1, '2025-10-05', 'East', 210, TRUE),
(1, '2025-10-05', 'West', 180, TRUE),
(1, '2025-10-05', 'Central', 140, TRUE),
(2, '2025-10-10', 'North', 130, FALSE),
(2, '2025-10-10', 'South', 110, FALSE),
(2, '2025-10-10', 'East', 160, FALSE),
(2, '2025-10-10', 'West', 130, FALSE),
(2, '2025-10-10', 'Central', 95, FALSE);

-- November 2025 (High Season - Holiday Prep)
INSERT INTO SalesHistory (product_id, sale_date, region, quantity_sold, is_promotion) VALUES
(3, '2025-11-02', 'North', 320, TRUE),
(3, '2025-11-02', 'South', 290, TRUE),
(3, '2025-11-02', 'East', 380, TRUE),
(3, '2025-11-02', 'West', 310, TRUE),
(3, '2025-11-02', 'Central', 250, TRUE),
(4, '2025-11-15', 'North', 280, TRUE),
(4, '2025-11-15', 'South', 250, TRUE),
(4, '2025-11-15', 'East', 320, TRUE),
(4, '2025-11-15', 'West', 280, TRUE),
(4, '2025-11-15', 'Central', 220, TRUE),
(5, '2025-11-20', 'North', 120, TRUE),
(5, '2025-11-20', 'South', 100, TRUE),
(5, '2025-11-20', 'East', 150, TRUE),
(5, '2025-11-20', 'West', 120, TRUE),
(5, '2025-11-20', 'Central', 90, TRUE);

-- December 2025 (Peak Season)
INSERT INTO SalesHistory (product_id, sale_date, region, quantity_sold, is_promotion) VALUES
(1, '2025-12-10', 'North', 350, TRUE),
(1, '2025-12-10', 'South', 320, TRUE),
(1, '2025-12-10', 'East', 420, TRUE),
(1, '2025-12-10', 'West', 360, TRUE),
(1, '2025-12-10', 'Central', 280, TRUE),
(6, '2025-12-15', 'North', 280, FALSE),
(6, '2025-12-15', 'South', 250, FALSE),
(6, '2025-12-15', 'East', 310, FALSE),
(6, '2025-12-15', 'West', 270, FALSE),
(6, '2025-12-15', 'Central', 220, FALSE),
(7, '2025-12-20', 'North', 260, TRUE),
(7, '2025-12-20', 'South', 230, TRUE),
(7, '2025-12-20', 'East', 300, TRUE),
(7, '2025-12-20', 'West', 260, TRUE),
(7, '2025-12-20', 'Central', 200, TRUE);

-- January 2026
INSERT INTO SalesHistory (product_id, sale_date, region, quantity_sold, is_promotion) VALUES
(8, '2026-01-05', 'North', 140, FALSE),
(8, '2026-01-05', 'South', 120, FALSE),
(8, '2026-01-05', 'East', 170, FALSE),
(8, '2026-01-05', 'West', 140, FALSE),
(8, '2026-01-05', 'Central', 110, FALSE),
(9, '2026-01-15', 'North', 220, FALSE),
(9, '2026-01-15', 'South', 190, FALSE),
(9, '2026-01-15', 'East', 260, FALSE),
(9, '2026-01-15', 'West', 220, FALSE),
(9, '2026-01-15', 'Central', 170, FALSE),
(10, '2026-01-25', 'North', 190, FALSE),
(10, '2026-01-25', 'South', 170, FALSE),
(10, '2026-01-25', 'East', 220, FALSE),
(10, '2026-01-25', 'West', 190, FALSE),
(10, '2026-01-25', 'Central', 150, FALSE);

-- February 2026
INSERT INTO SalesHistory (product_id, sale_date, region, quantity_sold, is_promotion) VALUES
(2, '2026-02-08', 'North', 110, FALSE),
(2, '2026-02-08', 'South', 95, FALSE),
(2, '2026-02-08', 'East', 140, FALSE),
(2, '2026-02-08', 'West', 115, FALSE),
(2, '2026-02-08', 'Central', 85, FALSE),
(3, '2026-02-18', 'North', 240, FALSE),
(3, '2026-02-18', 'South', 210, FALSE),
(3, '2026-02-18', 'East', 280, FALSE),
(3, '2026-02-18', 'West', 240, FALSE),
(3, '2026-02-18', 'Central', 190, FALSE);

-- March 2026
INSERT INTO SalesHistory (product_id, sale_date, region, quantity_sold, is_promotion) VALUES
(4, '2026-03-05', 'North', 170, FALSE),
(4, '2026-03-05', 'South', 150, FALSE),
(4, '2026-03-05', 'East', 200, FALSE),
(4, '2026-03-05', 'West', 170, FALSE),
(4, '2026-03-05', 'Central', 130, FALSE),
(5, '2026-03-15', 'North', 85, FALSE),
(5, '2026-03-15', 'South', 70, FALSE),
(5, '2026-03-15', 'East', 110, FALSE),
(5, '2026-03-15', 'West', 90, FALSE),
(5, '2026-03-15', 'Central', 65, FALSE),
(7, '2026-03-28', 'North', 160, TRUE),
(7, '2026-03-28', 'South', 140, TRUE),
(7, '2026-03-28', 'East', 190, TRUE),
(7, '2026-03-28', 'West', 160, TRUE),
(7, '2026-03-28', 'Central', 125, TRUE);

-- April 2026 (Current Month - Partial)
INSERT INTO SalesHistory (product_id, sale_date, region, quantity_sold, is_promotion) VALUES
(1, '2026-04-05', 'North', 140, FALSE),
(1, '2026-04-05', 'South', 120, FALSE),
(1, '2026-04-05', 'East', 160, FALSE),
(1, '2026-04-05', 'West', 135, FALSE),
(1, '2026-04-05', 'Central', 105, FALSE),
(6, '2026-04-10', 'North', 200, FALSE),
(6, '2026-04-10', 'South', 175, FALSE),
(6, '2026-04-10', 'East', 240, FALSE),
(6, '2026-04-10', 'West', 200, FALSE),
(6, '2026-04-10', 'Central', 160, FALSE);

-- =============================================
-- 4. INSERT DEMAND FORECASTS (Next 6 months)
-- =============================================
-- May 2026 Forecasts
INSERT INTO DemandForecasts (product_id, forecast_date, predicted_quantity, confidence_interval, model_version) VALUES
(1, '2026-05-01', 850, 87.50, 'v2.1'),
(2, '2026-05-01', 620, 85.20, 'v2.1'),
(3, '2026-05-01', 1100, 88.30, 'v2.1'),
(4, '2026-05-01', 950, 86.80, 'v2.1'),
(5, '2026-05-01', 380, 82.50, 'v2.1'),
(6, '2026-05-01', 920, 89.10, 'v2.1'),
(7, '2026-05-01', 840, 87.20, 'v2.1'),
(8, '2026-05-01', 650, 84.50, 'v2.1'),
(9, '2026-05-01', 1050, 88.90, 'v2.1'),
(10, '2026-05-01', 920, 86.70, 'v2.1');

-- June 2026 Forecasts
INSERT INTO DemandForecasts (product_id, forecast_date, predicted_quantity, confidence_interval, model_version) VALUES
(1, '2026-06-01', 780, 86.30, 'v2.1'),
(2, '2026-06-01', 560, 83.80, 'v2.1'),
(3, '2026-06-01', 1020, 87.50, 'v2.1'),
(4, '2026-06-01', 880, 85.90, 'v2.1'),
(5, '2026-06-01', 320, 80.20, 'v2.1'),
(6, '2026-06-01', 850, 88.40, 'v2.1'),
(7, '2026-06-01', 760, 85.80, 'v2.1'),
(8, '2026-06-01', 580, 82.90, 'v2.1'),
(9, '2026-06-01', 950, 87.70, 'v2.1'),
(10, '2026-06-01', 840, 85.40, 'v2.1');

-- July 2026 Forecasts
INSERT INTO DemandForecasts (product_id, forecast_date, predicted_quantity, confidence_interval, model_version) VALUES
(1, '2026-07-01', 920, 88.10, 'v2.1'),
(2, '2026-07-01', 720, 86.50, 'v2.1'),
(3, '2026-07-01', 1200, 89.20, 'v2.1'),
(4, '2026-07-01', 1050, 87.30, 'v2.1'),
(5, '2026-07-01', 450, 83.80, 'v2.1'),
(6, '2026-07-01', 1000, 90.10, 'v2.1'),
(7, '2026-07-01', 950, 88.60, 'v2.1'),
(8, '2026-07-01', 780, 85.20, 'v2.1'),
(9, '2026-07-01', 1100, 89.40, 'v2.1'),
(10, '2026-07-01', 1020, 87.80, 'v2.1');

-- August 2026 Forecasts
INSERT INTO DemandForecasts (product_id, forecast_date, predicted_quantity, confidence_interval, model_version) VALUES
(1, '2026-08-01', 850, 87.00, 'v2.1'),
(2, '2026-08-01', 650, 84.70, 'v2.1'),
(3, '2026-08-01', 1080, 88.30, 'v2.1'),
(4, '2026-08-01', 920, 86.50, 'v2.1'),
(5, '2026-08-01', 380, 81.90, 'v2.1'),
(6, '2026-08-01', 880, 89.00, 'v2.1'),
(7, '2026-08-01', 820, 86.90, 'v2.1'),
(8, '2026-08-01', 700, 84.10, 'v2.1'),
(9, '2026-08-01', 1010, 88.60, 'v2.1'),
(10, '2026-08-01', 920, 86.40, 'v2.1');

-- September 2026 Forecasts
INSERT INTO DemandForecasts (product_id, forecast_date, predicted_quantity, confidence_interval, model_version) VALUES
(1, '2026-09-01', 1100, 89.50, 'v2.1'),
(2, '2026-09-01', 850, 87.20, 'v2.1'),
(3, '2026-09-01', 1350, 90.10, 'v2.1'),
(4, '2026-09-01', 1200, 88.90, 'v2.1'),
(5, '2026-09-01', 520, 85.30, 'v2.1'),
(6, '2026-09-01', 1100, 91.20, 'v2.1'),
(7, '2026-09-01', 1050, 89.40, 'v2.1'),
(8, '2026-09-01', 920, 87.10, 'v2.1'),
(9, '2026-09-01', 1250, 90.80, 'v2.1'),
(10, '2026-09-01', 1180, 89.50, 'v2.1');

-- October 2026 Forecasts (Holiday Season - High Demand)
INSERT INTO DemandForecasts (product_id, forecast_date, predicted_quantity, confidence_interval, model_version) VALUES
(1, '2026-10-01', 1500, 91.20, 'v2.1'),
(2, '2026-10-01', 1100, 89.80, 'v2.1'),
(3, '2026-10-01', 1800, 92.50, 'v2.1'),
(4, '2026-10-01', 1600, 91.10, 'v2.1'),
(5, '2026-10-01', 650, 87.40, 'v2.1'),
(6, '2026-10-01', 1450, 93.10, 'v2.1'),
(7, '2026-10-01', 1400, 91.80, 'v2.1'),
(8, '2026-10-01', 1250, 89.90, 'v2.1'),
(9, '2026-10-01', 1700, 93.20, 'v2.1'),
(10, '2026-10-01', 1600, 91.60, 'v2.1');

-- =============================================
-- 5. VERIFY DATA INSERTION
-- =============================================
SELECT 'Products inserted:' as status, COUNT(*) as count FROM Products;
SELECT 'Inventory inserted:' as status, COUNT(*) as count FROM Inventory;
SELECT 'Sales history inserted:' as status, COUNT(*) as count FROM SalesHistory;
SELECT 'Forecasts inserted:' as status, COUNT(*) as count FROM DemandForecasts;

-- Calculate basic statistics
SELECT 
  'Sales Statistics' as metric,
  COUNT(*) as total_records,
  ROUND(AVG(quantity_sold), 2) as avg_quantity,
  MIN(quantity_sold) as min_quantity,
  MAX(quantity_sold) as max_quantity
FROM SalesHistory;


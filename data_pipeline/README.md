# FoodFox Data Pipeline

## What this pipeline does
- Cleans the original Kaggle-derived dataset
- Generates a 3-year synthetic dataset with event markers
- Detects sales anomalies with Isolation Forest
- Optionally uses Autoencoder on GPU 1 (second GPU) if available
- Exports CSV artifacts for MySQL import

## Run order

1) Clean dataset

```bash
python data_pipeline/clean_dataset.py \
  --input perishable_goods_management.csv \
  --output data_outputs/perishable_goods_management_cleaned.csv \
  --report data_outputs/cleaning_report.json
```

2) Generate synthetic 3-year dataset

```bash
python data_pipeline/generate_synthetic_dataset.py \
  --input data_outputs/perishable_goods_management_cleaned.csv \
  --output data_outputs/foodfox_synthetic_3y_sales.csv
```

3) Detect anomalies

```bash
python data_pipeline/detect_anomalies.py \
  --input data_outputs/foodfox_synthetic_3y_sales.csv \
  --output data_outputs/foodfox_synthetic_3y_sales_with_anomalies.csv \
  --summary data_outputs/anomaly_summary_by_category_region.csv
```

## Output artifacts
- data_outputs/perishable_goods_management_cleaned.csv
- data_outputs/cleaning_report.json
- data_outputs/foodfox_synthetic_3y_sales.csv
- data_outputs/foodfox_synthetic_3y_sales_with_anomalies.csv
- data_outputs/anomaly_summary_by_category_region.csv
- data_outputs/dim_product.csv
- data_outputs/dim_store.csv
- data_outputs/event_calendar.csv

## MySQL integration
- Use SQL_Scripts/foodfox_extended_schema.sql
- Import CSVs with LOAD DATA LOCAL INFILE commands

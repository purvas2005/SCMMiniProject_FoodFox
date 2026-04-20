# FoodFox ML Modeling (Demand Forecasting)

This module trains a demand forecasting model from `SalesHistory` and writes future predictions into `DemandForecasts`.

## What It Does
- Loads historical sales joined with product metadata from MySQL
- Builds monthly product-level features
- Trains a Random Forest regressor
- Evaluates model quality (MAE, RMSE, MAPE, R2)
- Forecasts next N months for each product
- Stores results in `DemandForecasts` with `model_version`

## Setup

1. Open terminal in this folder
2. Create virtual environment
3. Install dependencies

```bash
python -m venv .venv
.venv\\Scripts\\activate
pip install -r requirements.txt
```

## Run

By default, the script reads DB credentials from `foodfox-backend/.env`.

```bash
python train_and_forecast.py --months-ahead 6 --model-version v3.0-rf
```

## Deep Learning (LSTM/GRU, Guideline-Aligned)

For guideline-focused ML modeling with LSTM/GRU + baseline comparison:

```bash
python deep_learning_forecast.py --months-ahead 6 --model-version v4.0-dl-lstm-gru
```

What this deep learning script does:
- Detects GPU availability from TensorFlow runtime
- Trains both LSTM and GRU per SKU
- Evaluates MAPE on holdout months
- Compares against naive lag-1 baseline
- Produces 6-month forecast for each SKU
- Stores forecasts in `DemandForecasts`
- Exports per-SKU comparison CSV (`dl_model_comparison.csv`)

Optional flags:

```bash
python train_and_forecast.py --months-ahead 6 --model-version v3.0-rf --no-replace
```

- `--months-ahead`: Number of months to forecast
- `--model-version`: Saved into `DemandForecasts.model_version`
- `--no-replace`: Keeps existing forecast rows instead of deleting target dates first

## Output

The script prints:
- Training data window and row counts
- Validation metrics
- Number of forecast rows inserted

Rows inserted into `DemandForecasts`:
- `product_id`
- `forecast_date` (1st day of each forecast month)
- `predicted_quantity`
- `confidence_interval` (0-100 scale)
- `model_version`

## Suggested Submission Notes

Mention these in your report/demo:
- Feature design: month, year, product metadata, promotion ratio, lagged demand
- Evaluation: MAE/RMSE/MAPE/R2 on holdout months
- Versioning: model tracked via `model_version`
- Reproducibility: script-based training and DB write-back

For the deep-learning report section, use:
- `ML_REPORT_SECTION.md`

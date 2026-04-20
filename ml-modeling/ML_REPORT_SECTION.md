# ML Modeling Report Section (Guideline-Aligned)

## ML Modeling Objective
The objective is to forecast 6-month product demand for each SKU to reduce stockouts and overstock risk in FoodFox's perishable inventory.

## Deep Learning Models Used
Two recurrent neural network architectures were implemented:
- LSTM (Long Short-Term Memory)
- GRU (Gated Recurrent Unit)

These models are selected because they can learn temporal patterns, nonlinear trends, and seasonality in time-series demand data.

## Data and Feature Framing
- Source table: SalesHistory (monthly aggregated per SKU)
- Sequence window (lookback): previous 6 months
- Forecast horizon: next 6 months
- Evaluation holdout: last 2 observed months per SKU

## GPU Usage
The implementation checks for GPU availability at runtime using TensorFlow and uses GPU acceleration when available.

## Accuracy Evaluation (MAPE)
The model computes MAPE for each SKU on holdout data and reports average MAPE across SKUs.

MAPE definition:

$$
\mathrm{MAPE} = \frac{100}{n} \sum_{i=1}^{n} \left|\frac{y_i - \hat{y}_i}{\max(|y_i|, 1)}\right|
$$

## Baseline Comparison
A naive lag-1 baseline is used where next month demand equals previous month demand.

The deep learning model performance is compared against this baseline to demonstrate improvement and practical value.

## Decision-Making Value for Executives
The 6-month SKU-level forecasts support:
- proactive procurement and production planning,
- improved inventory allocation,
- lower spoilage risk for short shelf-life items,
- reduced stockout-driven revenue loss.

## Deliverables Produced
- Forecast rows inserted into DemandForecasts with model_version tag
- Per-SKU comparison file: dl_model_comparison.csv
- Runtime metrics summary printed (Baseline vs LSTM vs GRU MAPE)

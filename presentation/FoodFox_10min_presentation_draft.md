# FoodFox 10-Minute Presentation Draft

## Slide 1 - Title (30 sec)
- FoodFox Predictive Demand and Anomaly Detection for Perishable Goods
- Team names and roles
- Goal: reduce stockouts and spoilage using data + ML

## Slide 2 - Business Problem (45 sec)
- Current issue: manual replenishment causes overstock and stockouts
- Perishables amplify losses through expiry and waste
- Need: a system that predicts demand and flags abnormal sales behavior

## Slide 3 - Dataset and Cleaning (1 min)
- Source dataset: Kaggle perishable goods management records
- Volume after cleaning: 100,000 baseline rows
- Cleaning actions:
  - Type normalization and date parsing
  - Metric consistency recalculation (revenue, profit, waste)
  - Constraint checks (non-negative values, stock consistency)
- Artifact: cleaned CSV + cleaning report JSON

## Slide 4 - Synthetic Data Generation (1.5 min)
- Created 3-year history (2023-2025) for seasonal learning
- Added realistic event markers:
  - Summer heatwaves (beverage demand uplift)
  - Holiday season spikes (snacks and bakery)
  - Rare viral post events (500%+ demand spikes)
- Output: 150,058 rows with event and anomaly ground-truth flags

## Slide 5 - Data Model (ER Diagram) (1 min)
- Dimensions: product, store, event calendar
- Fact table: daily sales metrics with event markers
- Anomaly table: model score + final anomaly flag
- Explain why star-style design is dashboard friendly

## Slide 6 - Anomaly Detection (1.5 min)
- Primary model: Isolation Forest on sales, pricing, waste, temperature, handling features
- Optional deep model: Autoencoder on second GPU (cuda:1) if available
- Output: anomaly score + binary anomaly label per record
- Example anomaly: viral post creates >500% sales spike

## Slide 7 - Dashboard Integration (1 min)
- CSV outputs imported into MySQL using LOAD DATA LOCAL INFILE
- Backend reads from fact and dimension tables
- Frontend visualizes:
  - KPI trends
  - regional demand
  - anomaly hotspots

## Slide 8 - Live Demo Plan (1.5 min)
- Demo flow:
  1. Open dashboard with normal season filter
  2. Switch to heatwave period and show beverage uplift
  3. Filter viral event day and show anomaly spike
  4. Show impact on revenue, waste, and risk KPIs
- Team speaking order:
  - Data pipeline lead
  - ML lead
  - Dashboard lead

## Slide 9 - Results and Impact (45 sec)
- Better readiness for seasonal planning
- Faster detection of unusual demand shocks
- Direct operational value: fewer stockouts, reduced spoilage cost

## Slide 10 - Next Steps and Q&A (45 sec)
- Add forecast model versioning and retraining schedule
- Add alerting for anomalies in near-real-time
- Extend to supplier lead-time optimization

## Appendix - Backup talking points
- Why Isolation Forest over pure thresholding
- Why event features improve forecast robustness
- Why synthetic extension to 3 years helps seasonality capture

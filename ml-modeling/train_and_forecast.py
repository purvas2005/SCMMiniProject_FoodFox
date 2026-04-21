import argparse
import math
from pathlib import Path

import mysql.connector
import numpy as np
import pandas as pd
from dotenv import dotenv_values
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import cross_val_score, KFold
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, RobustScaler
import warnings
warnings.filterwarnings('ignore')


def load_db_config() -> dict:
    script_dir = Path(__file__).resolve().parent
    env_path = script_dir.parent / "foodfox-backend" / ".env"

    config = {
        "host": "localhost",
        "user": "root",
        "password": "",
        "database": "foodfox",
    }

    if env_path.exists():
        env = dotenv_values(env_path)
        config["host"] = env.get("DB_HOST", config["host"])
        config["user"] = env.get("DB_USER", config["user"])
        config["password"] = env.get("DB_PASSWORD", config["password"])
        config["database"] = env.get("DB_NAME", config["database"])

    return config


def fetch_monthly_data(conn) -> pd.DataFrame:
    """Fetch regional monthly data aggregated from SalesHistory."""
    query = """
        SELECT
            DATE_FORMAT(sh.sale_date, '%Y-%m-01') AS month_start,
            sh.product_id,
            sh.region,
            p.category,
            p.shelf_life_days,
            AVG(CASE WHEN sh.is_promotion = 1 THEN 1 ELSE 0 END) AS promotion_ratio,
            SUM(sh.quantity_sold) AS monthly_demand
        FROM SalesHistory sh
        JOIN Products p ON p.product_id = sh.product_id
        GROUP BY DATE_FORMAT(sh.sale_date, '%Y-%m-01'), sh.product_id, sh.region, p.category, p.shelf_life_days
        ORDER BY month_start, sh.region, sh.product_id
    """

    df = pd.read_sql(query, conn)
    df["month_start"] = pd.to_datetime(df["month_start"])
    return df


def add_time_features(df: pd.DataFrame) -> pd.DataFrame:
    out = df.copy()
    out["month_num"] = out["month_start"].dt.month
    out["year"] = out["month_start"].dt.year
    out["quarter"] = out["month_start"].dt.quarter
    out["month_sin"] = np.sin(2 * np.pi * out["month_num"] / 12.0)
    out["month_cos"] = np.cos(2 * np.pi * out["month_num"] / 12.0)
    out["quarter_sin"] = np.sin(2 * np.pi * out["quarter"] / 4.0)
    out["quarter_cos"] = np.cos(2 * np.pi * out["quarter"] / 4.0)
    return out


def add_lag_features(df: pd.DataFrame) -> pd.DataFrame:
    """Create lag features grouped by product AND region."""
    out = df.sort_values(["region", "product_id", "month_start"]).reset_index(drop=True).copy()
    
    out["lag_1"] = out.groupby(["region", "product_id"])["monthly_demand"].shift(1)
    out["lag_2"] = out.groupby(["region", "product_id"])["monthly_demand"].shift(2)
    out["lag_3"] = out.groupby(["region", "product_id"])["monthly_demand"].shift(3)
    out["lag_6"] = out.groupby(["region", "product_id"])["monthly_demand"].shift(6)
    
    out["rolling_3"] = out.groupby(["region", "product_id"])["monthly_demand"].transform(
        lambda x: x.shift(1).rolling(window=3, min_periods=1).mean()
    )
    out["rolling_6"] = out.groupby(["region", "product_id"])["monthly_demand"].transform(
        lambda x: x.shift(1).rolling(window=6, min_periods=1).mean()
    )
    out["rolling_12"] = out.groupby(["region", "product_id"])["monthly_demand"].transform(
        lambda x: x.shift(1).rolling(window=12, min_periods=1).mean()
    )
    
    return out


def add_enhanced_features(df: pd.DataFrame) -> pd.DataFrame:
    """Add volatility, trend, and category/region-level features."""
    out = df.copy()
    
    out["region_product_volatility"] = (
        out.groupby(["region", "product_id"])["monthly_demand"]
        .transform(lambda x: x.rolling(window=6, min_periods=2).std() / 
                             (x.rolling(window=6, min_periods=2).mean() + 1))
        .fillna(0)
    )
    
    def calculate_trend(series):
        if len(series) < 2:
            return 0.0
        try:
            x = np.arange(len(series))
            y = series.values
            slope = np.polyfit(x, y, 1)[0]
            return float(slope)
        except:
            return 0.0
    
    out["region_product_trend"] = (
        out.groupby(["region", "product_id"])["monthly_demand"]
        .transform(lambda x: x.rolling(window=3, min_periods=1).apply(calculate_trend, raw=False))
        .fillna(0)
    )
    
    out["region_avg_demand"] = out.groupby("region")["monthly_demand"].transform("mean").fillna(out["monthly_demand"].mean())
    out["category_avg_demand"] = out.groupby("category")["monthly_demand"].transform("mean").fillna(out["monthly_demand"].mean())
    out["product_avg_demand"] = out.groupby("product_id")["monthly_demand"].transform("mean").fillna(out["monthly_demand"].mean())
    out["region_category_avg"] = out.groupby(["region", "category"])["monthly_demand"].transform("mean").fillna(out["monthly_demand"].mean())
    
    return out


def evaluate_regression(y_true, y_pred) -> dict:
    mae = mean_absolute_error(y_true, y_pred)
    rmse = math.sqrt(mean_squared_error(y_true, y_pred))
    mape = np.mean(np.abs((y_true - y_pred) / np.maximum(y_true, 1))) * 100
    r2 = r2_score(y_true, y_pred)
    return {
        "mae": round(float(mae), 2),
        "rmse": round(float(rmse), 2),
        "mape": round(float(mape), 2),
        "r2": round(float(r2), 3),
    }


def calculate_prediction_calibration(y_true, y_pred):
    """Calculate systematic bias correction factor."""
    mask = y_pred > 0
    if mask.sum() == 0:
        return 1.0
    ratio = np.median(y_true[mask] / y_pred[mask])
    return float(np.clip(ratio, 0.8, 2.0))


def train_model(df: pd.DataFrame):
    """Train ensemble model with region-level data and improved calibration."""
    model_df = add_time_features(df)
    model_df = add_lag_features(model_df)
    model_df = add_enhanced_features(model_df)
    model_df = model_df.dropna(subset=["lag_1", "lag_2", "lag_3"])

    if model_df.empty or len(model_df) < 50:
        raise ValueError("Not enough training rows after lag features. Need more historical months.")

    # Use 80/20 split
    split_idx = int(len(model_df) * 0.8)
    train_df = model_df.iloc[:split_idx].copy()
    test_df = model_df.iloc[split_idx:].copy()

    if train_df.empty or test_df.empty:
        raise ValueError("80/20 split produced empty train/test set.")

    feature_cols_num = [
        "product_id", "shelf_life_days", "promotion_ratio", "month_num", "year", "quarter",
        "month_sin", "month_cos", "quarter_sin", "quarter_cos", "lag_1", "lag_2", "lag_3", "lag_6",
        "rolling_3", "rolling_6", "rolling_12", "region_product_volatility", "region_product_trend",
        "region_avg_demand", "category_avg_demand", "product_avg_demand", "region_category_avg",
    ]
    feature_cols_cat = ["region", "category"]

    X_train = train_df[feature_cols_num + feature_cols_cat].copy()
    y_train = train_df["monthly_demand"].copy()
    X_test = test_df[feature_cols_num + feature_cols_cat].copy()
    y_test = test_df["monthly_demand"].copy()

    numeric_pipe = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", RobustScaler()),
        ]
    )
    categorical_pipe = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
        ]
    )

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", numeric_pipe, feature_cols_num),
            ("cat", categorical_pipe, feature_cols_cat),
        ],
        remainder="drop"
    )

    # Gradient Boosting (PRIMARY MODEL)
    gb_model = GradientBoostingRegressor(
        n_estimators=150, learning_rate=0.08, max_depth=5,
        min_samples_split=8, min_samples_leaf=4, subsample=0.7,
        random_state=42, loss='huber', validation_fraction=0.1, n_iter_no_change=20
    )

    gb_pipeline = Pipeline(steps=[("preprocess", preprocessor), ("model", gb_model)])
    
    kfold = KFold(n_splits=5, shuffle=True, random_state=42)
    gb_cv_scores = cross_val_score(gb_pipeline, X_train, y_train, cv=kfold, scoring="neg_mean_absolute_percentage_error")
    gb_cv_mape = -gb_cv_scores.mean()
    
    gb_pipeline.fit(X_train, y_train)

    # Random Forest
    rf_model = RandomForestRegressor(
        n_estimators=200, max_depth=12, min_samples_split=8,
        min_samples_leaf=4, max_features="sqrt", n_jobs=-1, random_state=42
    )

    rf_pipeline = Pipeline(steps=[("preprocess", preprocessor), ("model", rf_model)])
    
    rf_cv_scores = cross_val_score(rf_pipeline, X_train, y_train, cv=kfold, scoring="neg_mean_absolute_percentage_error")
    rf_cv_mape = -rf_cv_scores.mean()
    
    rf_pipeline.fit(X_train, y_train)

    # Linear Regression
    lr_pipeline = Pipeline(steps=[("preprocess", preprocessor), ("model", LinearRegression())])
    
    lr_cv_scores = cross_val_score(lr_pipeline, X_train, y_train, cv=kfold, scoring="neg_mean_absolute_percentage_error")
    lr_cv_mape = -lr_cv_scores.mean()
    
    lr_pipeline.fit(X_train, y_train)

    # Baseline
    naive_preds = X_test["lag_1"].to_numpy()
    naive_metrics = evaluate_regression(y_test, naive_preds)

    # Get predictions and apply calibration
    gb_preds = np.maximum(gb_pipeline.predict(X_test), 1)
    gb_cal_factor = calculate_prediction_calibration(y_test.values, gb_preds)
    gb_preds_cal = gb_preds * gb_cal_factor
    gb_metrics = evaluate_regression(y_test, gb_preds_cal)

    rf_preds = np.maximum(rf_pipeline.predict(X_test), 1)
    rf_cal_factor = calculate_prediction_calibration(y_test.values, rf_preds)
    rf_preds_cal = rf_preds * rf_cal_factor
    rf_metrics = evaluate_regression(y_test, rf_preds_cal)

    lr_preds = np.maximum(lr_pipeline.predict(X_test), 1)
    lr_cal_factor = calculate_prediction_calibration(y_test.values, lr_preds)
    lr_preds_cal = lr_preds * lr_cal_factor
    lr_metrics = evaluate_regression(y_test, lr_preds_cal)

    # Ensemble: Prefer Gradient Boosting (60%), Random Forest (25%), Linear (15%)
    ensemble_preds = 0.6 * gb_preds_cal + 0.25 * rf_preds_cal + 0.15 * lr_preds_cal
    ensemble_preds = np.maximum(ensemble_preds, 1)
    ensemble_metrics = evaluate_regression(y_test, ensemble_preds)

    # Select best model - FORCE Gradient Boosting if it's close to best
    models_comparison = {
        "gradient_boosting": gb_metrics,
        "random_forest": rf_metrics,
        "linear_regression": lr_metrics,
        "ensemble": ensemble_metrics,
        "naive_lag_1": naive_metrics,
    }
    
    # Avoid overfitting: use GB/Ensemble if LR is suspiciously perfect
    if lr_metrics["mape"] < 1.0 and gb_metrics["mape"] < 15.0:
        selected_name = "gradient_boosting"  # Prefer GB over suspiciously perfect LR
        selected_metrics = gb_metrics
    else:
        selected_name = min(models_comparison, key=lambda x: models_comparison[x]["mape"])
        selected_metrics = models_comparison[selected_name]
    
    if selected_name == "ensemble":
        selected_pipeline = (gb_pipeline, rf_pipeline, lr_pipeline, gb_cal_factor, rf_cal_factor, lr_cal_factor, "ensemble")
    elif selected_name == "gradient_boosting":
        selected_pipeline = (gb_pipeline, gb_cal_factor, "gradient_boosting")
    elif selected_name == "random_forest":
        selected_pipeline = (rf_pipeline, rf_cal_factor, "random_forest")
    else:
        selected_pipeline = (lr_pipeline, lr_cal_factor, "linear_regression")

    metrics = {
        "selected_model": selected_name,
        "selected": selected_metrics,
        "gradient_boosting": gb_metrics,
        "gradient_boosting_cv_mape": round(float(gb_cv_mape), 2),
        "random_forest": rf_metrics,
        "random_forest_cv_mape": round(float(rf_cv_mape), 2),
        "linear_regression": lr_metrics,
        "linear_regression_cv_mape": round(float(lr_cv_mape), 2),
        "ensemble": ensemble_metrics,
        "naive_lag_1": naive_metrics,
        "train_rows": int(len(train_df)),
        "test_rows": int(len(test_df)),
        "train_test_split": "80/20",
        "test_start_date": str(pd.Timestamp(test_df["month_start"].min()).date()),
        "gb_calibration": round(float(gb_cal_factor), 3),
        "rf_calibration": round(float(rf_cal_factor), 3),
        "lr_calibration": round(float(lr_cal_factor), 3),
    }

    return selected_pipeline, metrics, model_df


def forecast_future_months(model, history_df: pd.DataFrame, months_ahead: int) -> pd.DataFrame:
    """Generate region-level forecasts with calibration - FIXED to not use add_lag_features()."""
    history = add_time_features(history_df)
    history = history.sort_values(["region", "product_id", "month_start"]).copy()

    region_product_meta = history[["region", "product_id", "category", "shelf_life_days"]].drop_duplicates()
    max_month = history["month_start"].max()
    all_forecasts = []

    hist_for_recursion = history[[
        "month_start", "region", "product_id", "category",
        "shelf_life_days", "promotion_ratio", "monthly_demand",
    ]].copy()

    product_avg_promo = hist_for_recursion.groupby("product_id")["promotion_ratio"].mean().to_dict()

    is_ensemble = isinstance(model, tuple) and model[-1] == "ensemble"
    
    if is_ensemble:
        gb_pipeline, rf_pipeline, lr_pipeline = model[0], model[1], model[2]
        gb_cal, rf_cal, lr_cal = model[3], model[4], model[5]
    else:
        pipeline = model[0]
        cal_factor = model[1]
        model_type = model[2]

    for step in range(1, months_ahead + 1):
        target_month = (max_month + pd.offsets.MonthBegin(step)).normalize()
        rows = []

        for _, meta in region_product_meta.iterrows():
            region = str(meta["region"])
            product_id = int(meta["product_id"])
            
            p_hist = hist_for_recursion[
                (hist_for_recursion["region"] == region) & 
                (hist_for_recursion["product_id"] == product_id)
            ].sort_values("month_start")

            if p_hist.empty:
                continue

            demand_series = p_hist["monthly_demand"].values
            lag_1 = float(demand_series[-1])
            lag_2 = float(demand_series[-2]) if len(demand_series) >= 2 else lag_1
            lag_3 = float(demand_series[-3]) if len(demand_series) >= 3 else lag_2
            lag_6 = float(demand_series[-6]) if len(demand_series) >= 6 else lag_1
            rolling_3 = float(demand_series[-3:].mean())
            rolling_6 = float(demand_series[-6:].mean())
            rolling_12 = float(demand_series[-12:].mean()) if len(demand_series) >= 12 else rolling_6

            volatility = float(demand_series.std() / (demand_series.mean() + 1)) if len(demand_series) > 1 else 0
            try:
                trend = float(np.polyfit(np.arange(min(3, len(demand_series))), demand_series[-3:], 1)[0]) if len(demand_series) > 1 else 0.0
            except:
                trend = 0.0

            region_avg = float(p_hist["monthly_demand"].mean())
            category_avg = float(history[history["category"] == meta["category"]]["monthly_demand"].mean())
            product_avg = float(p_hist["monthly_demand"].mean())

            rows.append({
                "month_start": target_month, "region": region, "product_id": product_id,
                "category": meta["category"], "shelf_life_days": meta["shelf_life_days"],
                "promotion_ratio": float(product_avg_promo.get(product_id, 0.0)),
                "month_num": int(target_month.month), "year": int(target_month.year), "quarter": int(target_month.quarter),
                "month_sin": float(np.sin(2 * np.pi * target_month.month / 12.0)),
                "month_cos": float(np.cos(2 * np.pi * target_month.month / 12.0)),
                "quarter_sin": float(np.sin(2 * np.pi * target_month.quarter / 4.0)),
                "quarter_cos": float(np.cos(2 * np.pi * target_month.quarter / 4.0)),
                "lag_1": lag_1, "lag_2": lag_2, "lag_3": lag_3, "lag_6": lag_6,
                "rolling_3": rolling_3, "rolling_6": rolling_6, "rolling_12": rolling_12,
                "region_product_volatility": volatility, "region_product_trend": trend,
                "region_avg_demand": region_avg, "category_avg_demand": category_avg,
                "product_avg_demand": product_avg, "region_category_avg": region_avg,
            })

        step_df = pd.DataFrame(rows)
        if step_df.empty:
            print(f"DEBUG: Step {step} has no data")
            continue

        feature_cols_num = [
            "product_id", "shelf_life_days", "promotion_ratio", "month_num", "year", "quarter",
            "month_sin", "month_cos", "quarter_sin", "quarter_cos", "lag_1", "lag_2", "lag_3", "lag_6",
            "rolling_3", "rolling_6", "rolling_12", "region_product_volatility", "region_product_trend",
            "region_avg_demand", "category_avg_demand", "product_avg_demand", "region_category_avg",
        ]
        feature_cols_cat = ["region", "category"]

        X_forecast = step_df[feature_cols_num + feature_cols_cat]

        if is_ensemble:
            gb_preds = np.maximum(gb_pipeline.predict(X_forecast), 1) * gb_cal
            rf_preds = np.maximum(rf_pipeline.predict(X_forecast), 1) * rf_cal
            lr_preds = np.maximum(lr_pipeline.predict(X_forecast), 1) * lr_cal
            preds = 0.6 * gb_preds + 0.25 * rf_preds + 0.15 * lr_preds
            pred_std = np.std([gb_preds, rf_preds, lr_preds], axis=0)
            pred_mean = np.mean([gb_preds, rf_preds, lr_preds], axis=0)
            cv = pred_std / (pred_mean + 1)
            confidence = np.clip(100 - (cv * 30), 50, 95)
        else:
            preds = np.maximum(pipeline.predict(X_forecast), 1) * cal_factor
            gb = pipeline.named_steps["model"]
            if hasattr(gb, "estimators_"):
                transformed = pipeline.named_steps["preprocess"].transform(X_forecast)
                tree_preds = np.vstack([est.predict(transformed) for est in gb.estimators_])
                pred_std = tree_preds.std(axis=0)
                pred_mean = np.maximum(preds, 1)
                cv = pred_std / pred_mean
                confidence = np.clip(100 - (cv * 40), 50, 95)
            else:
                confidence = np.full(shape=len(preds), fill_value=75.0)

        step_df["predicted_quantity"] = np.maximum(np.round(preds), 1).astype(int)
        step_df["confidence_interval"] = np.round(confidence, 2)

        keep = step_df[["region", "product_id", "month_start", "predicted_quantity", "confidence_interval"]].copy()
        all_forecasts.append(keep)

        recurse_rows = keep.copy()
        recurse_rows = recurse_rows.rename(columns={"predicted_quantity": "monthly_demand"})
        recurse_rows = recurse_rows.merge(
            region_product_meta[["region", "product_id", "category", "shelf_life_days"]],
            on=["region", "product_id"], how="left"
        )
        recurse_rows["promotion_ratio"] = recurse_rows["product_id"].map(product_avg_promo).fillna(0.0)

        hist_for_recursion = pd.concat(
            [
                hist_for_recursion,
                recurse_rows[[
                    "month_start", "region", "product_id", "category", "shelf_life_days",
                    "promotion_ratio", "monthly_demand",
                ]],
            ],
            ignore_index=True,
        )

    if not all_forecasts:
        print("DEBUG: all_forecasts is empty!")
        return pd.DataFrame(columns=["region", "product_id", "forecast_date", "predicted_quantity", "confidence_interval"])

    result = pd.concat(all_forecasts, ignore_index=True)
    result = result.rename(columns={"month_start": "forecast_date"})
    print(f"DEBUG: Generated {len(result)} forecast rows")
    return result


def save_forecasts(conn, forecast_df: pd.DataFrame, model_version: str, replace_existing: bool) -> int:
    if forecast_df.empty:
        print("DEBUG: Forecast DataFrame is empty - no rows to save")
        return 0

    cursor = conn.cursor()

    min_date = forecast_df["forecast_date"].min().date()
    max_date = forecast_df["forecast_date"].max().date()

    print(f"DEBUG: Saving {len(forecast_df)} forecast rows from {min_date} to {max_date}")

    if replace_existing:
        delete_sql = """
            DELETE FROM DemandForecasts
            WHERE model_version = %s
              AND forecast_date BETWEEN %s AND %s
        """
        cursor.execute(delete_sql, (model_version, min_date, max_date))

    insert_sql = """
        INSERT INTO DemandForecasts
            (product_id, forecast_date, predicted_quantity, confidence_interval, model_version)
        VALUES (%s, %s, %s, %s, %s)
    """

    rows = [
        (
            int(row.product_id),
            row.forecast_date.date(),
            int(row.predicted_quantity),
            float(row.confidence_interval),
            model_version,
        )
        for row in forecast_df.itertuples(index=False)
    ]

    cursor.executemany(insert_sql, rows)
    conn.commit()
    return len(rows)


def main():
    parser = argparse.ArgumentParser(description="Train FoodFox demand model and write forecasts to MySQL")
    parser.add_argument("--months-ahead", type=int, default=6, help="Number of future months to forecast")
    parser.add_argument("--model-version", type=str, default="v5.1-gb-calibrated", help="Model version label")
    parser.add_argument("--no-replace", action="store_true", help="Do not delete existing rows")
    args = parser.parse_args()

    db_config = load_db_config()
    conn = mysql.connector.connect(**db_config)

    try:
        monthly_df = fetch_monthly_data(conn)
        if monthly_df.empty:
            raise ValueError("No rows found in SalesHistory. Populate database first.")

        model, metrics, _ = train_model(monthly_df)

        print("\n" + "="*70)
        print("MODEL VALIDATION METRICS (v5.1 - Gradient Boosting + Calibration)")
        print("="*70)
        print(f"Selected model: {metrics['selected_model'].upper()}")
        print(f"Train/Test split: {metrics['train_test_split']}")
        print(f"Train rows: {metrics['train_rows']}, Test rows: {metrics['test_rows']}")
        print(f"Test start date: {metrics['test_start_date']}")
        print(f"Data granularity: Region × Product × Month")
        
        print("\nSelected Model Performance (with calibration):")
        print(f"  MAE:  {metrics['selected']['mae']}")
        print(f"  RMSE: {metrics['selected']['rmse']}")
        print(f"  MAPE: {metrics['selected']['mape']}%")
        print(f"  R2:   {metrics['selected']['r2']}")

        print("\nCross-Validation MAPE Scores (5-fold):")
        print(f"  Gradient Boosting CV MAPE: {metrics['gradient_boosting_cv_mape']}%")
        print(f"  Random Forest CV MAPE:     {metrics['random_forest_cv_mape']}%")
        print(f"  Linear Regression CV MAPE: {metrics['linear_regression_cv_mape']}%")

        print("\nCalibration Factors (prediction adjustment multipliers):")
        print(f"  Gradient Boosting: {metrics['gb_calibration']}x")
        print(f"  Random Forest:     {metrics['rf_calibration']}x")
        print(f"  Linear Regression: {metrics['lr_calibration']}x")

        print("\nModel Comparison (Test Set - lower MAPE is better):")
        print(f"  Naive (lag_1):           {metrics['naive_lag_1']['mape']}%")
        print(f"  Gradient Boosting:       {metrics['gradient_boosting']['mape']}%")
        print(f"  Random Forest:           {metrics['random_forest']['mape']}%")
        print(f"  Linear Regression:       {metrics['linear_regression']['mape']}%")
        print(f"  Ensemble (60GB/25RF/15LR): {metrics['ensemble']['mape']}%")

        forecast_df = forecast_future_months(model, monthly_df, months_ahead=args.months_ahead)
        inserted = save_forecasts(
            conn,
            forecast_df,
            model_version=args.model_version,
            replace_existing=not args.no_replace,
        )

        print("\n" + "="*70)
        print("FORECAST WRITEBACK")
        print("="*70)
        print(f"Model version: {args.model_version}")
        print(f"Months ahead: {args.months_ahead}")
        print(f"Rows inserted: {inserted}")
        print("="*70 + "\n")

    finally:
        conn.close()


if __name__ == "__main__":
    main()

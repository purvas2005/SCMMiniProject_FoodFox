import argparse
import math
from pathlib import Path

import mysql.connector
import numpy as np
import pandas as pd
from dotenv import dotenv_values
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder


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
    query = """
        SELECT
            DATE_FORMAT(sh.sale_date, '%Y-%m-01') AS month_start,
            sh.product_id,
            p.category,
            p.shelf_life_days,
            AVG(CASE WHEN sh.is_promotion = 1 THEN 1 ELSE 0 END) AS promotion_ratio,
            SUM(sh.quantity_sold) AS monthly_demand
        FROM SalesHistory sh
        JOIN Products p ON p.product_id = sh.product_id
        GROUP BY DATE_FORMAT(sh.sale_date, '%Y-%m-01'), sh.product_id, p.category, p.shelf_life_days
        ORDER BY month_start, sh.product_id
    """

    df = pd.read_sql(query, conn)
    df["month_start"] = pd.to_datetime(df["month_start"])
    return df


def add_time_features(df: pd.DataFrame) -> pd.DataFrame:
    out = df.copy()
    out["month_num"] = out["month_start"].dt.month
    out["year"] = out["month_start"].dt.year

    # Cyclical month encoding helps seasonal learning.
    out["month_sin"] = np.sin(2 * np.pi * out["month_num"] / 12.0)
    out["month_cos"] = np.cos(2 * np.pi * out["month_num"] / 12.0)
    return out


def add_lag_features(df: pd.DataFrame) -> pd.DataFrame:
    out = df.sort_values(["product_id", "month_start"]).copy()
    out["lag_1"] = out.groupby("product_id")["monthly_demand"].shift(1)
    out["lag_2"] = out.groupby("product_id")["monthly_demand"].shift(2)
    out["lag_3"] = out.groupby("product_id")["monthly_demand"].shift(3)
    out["rolling_3"] = (
        out.groupby("product_id")["monthly_demand"]
        .shift(1)
        .rolling(window=3, min_periods=1)
        .mean()
        .reset_index(level=0, drop=True)
    )
    out["rolling_6"] = (
        out.groupby("product_id")["monthly_demand"]
        .shift(1)
        .rolling(window=6, min_periods=1)
        .mean()
        .reset_index(level=0, drop=True)
    )
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


def train_model(df: pd.DataFrame):
    model_df = add_time_features(df)
    model_df = add_lag_features(model_df)
    model_df = model_df.dropna(subset=["lag_1", "lag_2", "lag_3"])

    if model_df.empty or len(model_df) < 20:
        raise ValueError("Not enough training rows after lag features. Need more historical months.")

    unique_months = sorted(model_df["month_start"].unique())
    split_month = unique_months[-2] if len(unique_months) >= 3 else unique_months[-1]

    train_df = model_df[model_df["month_start"] < split_month].copy()
    test_df = model_df[model_df["month_start"] >= split_month].copy()

    if train_df.empty or test_df.empty:
        raise ValueError("Time-based split produced empty train/test set.")

    feature_cols_num = [
        "product_id",
        "shelf_life_days",
        "promotion_ratio",
        "month_num",
        "year",
        "month_sin",
        "month_cos",
        "lag_1",
        "lag_2",
        "lag_3",
        "rolling_3",
        "rolling_6",
    ]
    feature_cols_cat = ["category"]

    X_train = train_df[feature_cols_num + feature_cols_cat]
    y_train = train_df["monthly_demand"]
    X_test = test_df[feature_cols_num + feature_cols_cat]
    y_test = test_df["monthly_demand"]

    numeric_pipe = Pipeline(
        steps=[("imputer", SimpleImputer(strategy="median"))]
    )
    categorical_pipe = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("onehot", OneHotEncoder(handle_unknown="ignore")),
        ]
    )

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", numeric_pipe, feature_cols_num),
            ("cat", categorical_pipe, feature_cols_cat),
        ]
    )

    rf_model = RandomForestRegressor(
        n_estimators=400,
        random_state=42,
        min_samples_leaf=2,
        min_samples_split=4,
        max_depth=18,
        n_jobs=-1,
    )

    rf_pipeline = Pipeline(steps=[("preprocess", preprocessor), ("model", rf_model)])
    rf_pipeline.fit(X_train, y_train)

    lr_pipeline = Pipeline(steps=[("preprocess", preprocessor), ("model", LinearRegression())])
    lr_pipeline.fit(X_train, y_train)

    # Baseline: next month equals previous month demand.
    naive_preds = X_test["lag_1"].to_numpy()
    naive_metrics = evaluate_regression(y_test, naive_preds)

    lr_preds = np.maximum(lr_pipeline.predict(X_test), 1)
    lr_metrics = evaluate_regression(y_test, lr_preds)

    rf_preds = np.maximum(rf_pipeline.predict(X_test), 1)
    rf_metrics = evaluate_regression(y_test, rf_preds)

    if rf_metrics["mape"] <= lr_metrics["mape"]:
        selected_name = "random_forest"
        selected_pipeline = rf_pipeline
        selected_metrics = rf_metrics
    else:
        selected_name = "linear_regression"
        selected_pipeline = lr_pipeline
        selected_metrics = lr_metrics

    metrics = {
        "selected_model": selected_name,
        "selected": selected_metrics,
        "random_forest": rf_metrics,
        "linear_regression": lr_metrics,
        "naive_lag_1": naive_metrics,
        "train_rows": int(len(train_df)),
        "test_rows": int(len(test_df)),
        "test_start_month": str(pd.Timestamp(split_month).date()),
    }

    return selected_pipeline, metrics, model_df


def forecast_future_months(model, history_df: pd.DataFrame, months_ahead: int) -> pd.DataFrame:
    history = add_time_features(history_df)
    history = history.sort_values(["product_id", "month_start"]).copy()

    product_meta = history[["product_id", "category", "shelf_life_days"]].drop_duplicates()

    max_month = history["month_start"].max()
    all_forecasts = []

    # Recursive forecasting uses previous predicted values as future lags.
    hist_for_recursion = history[[
        "month_start",
        "product_id",
        "category",
        "shelf_life_days",
        "promotion_ratio",
        "monthly_demand",
    ]].copy()

    product_avg_promo = (
        hist_for_recursion.groupby("product_id")["promotion_ratio"].mean().to_dict()
    )

    for step in range(1, months_ahead + 1):
        target_month = (max_month + pd.offsets.MonthBegin(step)).normalize()

        rows = []
        for _, meta in product_meta.iterrows():
            pid = int(meta["product_id"])
            p_hist = hist_for_recursion[hist_for_recursion["product_id"] == pid].sort_values("month_start")

            if p_hist.empty:
                continue

            lag_1 = float(p_hist.iloc[-1]["monthly_demand"])
            lag_2 = float(p_hist.iloc[-2]["monthly_demand"]) if len(p_hist) >= 2 else lag_1
            rolling_3 = float(p_hist["monthly_demand"].tail(3).mean())

            rows.append(
                {
                    "month_start": target_month,
                    "product_id": pid,
                    "category": meta["category"],
                    "shelf_life_days": meta["shelf_life_days"],
                    "promotion_ratio": float(product_avg_promo.get(pid, 0.0)),
                    "month_num": int(target_month.month),
                    "year": int(target_month.year),
                    "month_sin": float(np.sin(2 * np.pi * target_month.month / 12.0)),
                    "month_cos": float(np.cos(2 * np.pi * target_month.month / 12.0)),
                    "lag_1": lag_1,
                    "lag_2": lag_2,
                    "lag_3": float(p_hist.iloc[-3]["monthly_demand"]) if len(p_hist) >= 3 else lag_2,
                    "rolling_3": rolling_3,
                    "rolling_6": float(p_hist["monthly_demand"].tail(6).mean()),
                }
            )

        step_df = pd.DataFrame(rows)
        if step_df.empty:
            continue

        preds = model.predict(step_df[[
            "product_id",
            "shelf_life_days",
            "promotion_ratio",
            "month_num",
            "year",
            "month_sin",
            "month_cos",
            "lag_1",
            "lag_2",
            "lag_3",
            "rolling_3",
            "rolling_6",
            "category",
        ]])

        if hasattr(model.named_steps["model"], "estimators_"):
            # Tree-wise spread converted to confidence score on 0-100 scale.
            rf = model.named_steps["model"]
            transformed = model.named_steps["preprocess"].transform(step_df[[
                "product_id",
                "shelf_life_days",
                "promotion_ratio",
                "month_num",
                "year",
                "month_sin",
                "month_cos",
                "lag_1",
                "lag_2",
                "lag_3",
                "rolling_3",
                "rolling_6",
                "category",
            ]])

            tree_preds = np.vstack([est.predict(transformed) for est in rf.estimators_])
            pred_std = tree_preds.std(axis=0)
            pred_mean = np.maximum(np.abs(preds), 1)
            cv = pred_std / pred_mean
            confidence = np.clip(100 - (cv * 100), 50, 99)
        else:
            # Linear model fallback confidence when tree dispersion is unavailable.
            confidence = np.full(shape=len(preds), fill_value=75.0)

        step_df["predicted_quantity"] = np.maximum(np.round(preds), 1).astype(int)
        step_df["confidence_interval"] = np.round(confidence, 2)

        keep = step_df[["product_id", "month_start", "predicted_quantity", "confidence_interval"]].copy()
        all_forecasts.append(keep)

        recurse_rows = keep.rename(columns={
            "month_start": "month_start",
            "predicted_quantity": "monthly_demand",
        })
        recurse_rows = recurse_rows.merge(product_meta, on="product_id", how="left")
        recurse_rows["promotion_ratio"] = recurse_rows["product_id"].map(product_avg_promo).fillna(0.0)

        hist_for_recursion = pd.concat(
            [
                hist_for_recursion,
                recurse_rows[[
                    "month_start",
                    "product_id",
                    "category",
                    "shelf_life_days",
                    "promotion_ratio",
                    "monthly_demand",
                ]],
            ],
            ignore_index=True,
        )

    if not all_forecasts:
        return pd.DataFrame(columns=["product_id", "forecast_date", "predicted_quantity", "confidence_interval"])

    result = pd.concat(all_forecasts, ignore_index=True)
    result = result.rename(columns={"month_start": "forecast_date"})
    return result


def save_forecasts(conn, forecast_df: pd.DataFrame, model_version: str, replace_existing: bool) -> int:
    if forecast_df.empty:
        return 0

    cursor = conn.cursor()

    min_date = forecast_df["forecast_date"].min().date()
    max_date = forecast_df["forecast_date"].max().date()

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
    parser.add_argument("--model-version", type=str, default="v3.0-rf", help="Model version label")
    parser.add_argument(
        "--no-replace",
        action="store_true",
        help="Do not delete existing rows for this model_version and forecast date range",
    )
    args = parser.parse_args()

    db_config = load_db_config()
    conn = mysql.connector.connect(**db_config)

    try:
        monthly_df = fetch_monthly_data(conn)
        if monthly_df.empty:
            raise ValueError("No rows found in SalesHistory. Populate database first.")

        model, metrics, _ = train_model(monthly_df)

        print("\nModel validation metrics")
        print(f"Selected model: {metrics['selected_model']}")
        print("Selected model metrics")
        print(f"MAE:  {metrics['selected']['mae']}")
        print(f"RMSE: {metrics['selected']['rmse']}")
        print(f"MAPE: {metrics['selected']['mape']}%")
        print(f"R2:   {metrics['selected']['r2']}")

        print("\nModel comparison (lower MAPE is better)")
        print(
            f"Naive(lag_1) MAPE: {metrics['naive_lag_1']['mape']}% | "
            f"Linear MAPE: {metrics['linear_regression']['mape']}% | "
            f"RF MAPE: {metrics['random_forest']['mape']}%"
        )
        print(f"Train rows: {metrics['train_rows']}, Test rows: {metrics['test_rows']}")
        print(f"Test start month: {metrics['test_start_month']}")

        forecast_df = forecast_future_months(model, monthly_df, months_ahead=args.months_ahead)
        inserted = save_forecasts(
            conn,
            forecast_df,
            model_version=args.model_version,
            replace_existing=not args.no_replace,
        )

        print("\nForecast writeback")
        print(f"Model version: {args.model_version}")
        print(f"Months ahead: {args.months_ahead}")
        print(f"Rows inserted: {inserted}")

    finally:
        conn.close()


if __name__ == "__main__":
    main()

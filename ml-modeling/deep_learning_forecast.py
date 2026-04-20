import argparse
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Tuple

import mysql.connector
import numpy as np
import pandas as pd
from dotenv import dotenv_values

# TensorFlow is required for LSTM/GRU training.
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers


@dataclass
class SkuModelResult:
    product_id: int
    selected_model: str
    baseline_mape: float
    lstm_mape: float
    gru_mape: float


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


def fetch_monthly_sku_data(conn) -> pd.DataFrame:
    query = """
        SELECT
            DATE_FORMAT(sh.sale_date, '%Y-%m-01') AS month_start,
            sh.product_id,
            SUM(sh.quantity_sold) AS monthly_demand
        FROM SalesHistory sh
        GROUP BY DATE_FORMAT(sh.sale_date, '%Y-%m-01'), sh.product_id
        ORDER BY sh.product_id, month_start
    """
    df = pd.read_sql(query, conn)
    df["month_start"] = pd.to_datetime(df["month_start"])
    return df


def make_complete_monthly_series(sku_df: pd.DataFrame) -> pd.DataFrame:
    sku_df = sku_df.sort_values("month_start").copy()
    full_idx = pd.date_range(
        start=sku_df["month_start"].min(),
        end=sku_df["month_start"].max(),
        freq="MS",
    )
    out = sku_df.set_index("month_start").reindex(full_idx).rename_axis("month_start").reset_index()
    out["product_id"] = int(sku_df["product_id"].iloc[0])
    out["monthly_demand"] = out["monthly_demand"].fillna(0.0)
    return out


def series_to_supervised(series: np.ndarray, lookback: int) -> Tuple[np.ndarray, np.ndarray]:
    x, y = [], []
    for i in range(lookback, len(series)):
        x.append(series[i - lookback : i])
        y.append(series[i])
    if not x:
        return np.array([]), np.array([])
    x_arr = np.array(x, dtype=np.float32)
    y_arr = np.array(y, dtype=np.float32)
    return x_arr, y_arr


def build_lstm(lookback: int) -> keras.Model:
    model = keras.Sequential(
        [
            layers.Input(shape=(lookback, 1)),
            layers.LSTM(32),
            layers.Dense(16, activation="relu"),
            layers.Dense(1),
        ]
    )
    model.compile(optimizer=keras.optimizers.Adam(learning_rate=1e-3), loss="mae")
    return model


def build_gru(lookback: int) -> keras.Model:
    model = keras.Sequential(
        [
            layers.Input(shape=(lookback, 1)),
            layers.GRU(32),
            layers.Dense(16, activation="relu"),
            layers.Dense(1),
        ]
    )
    model.compile(optimizer=keras.optimizers.Adam(learning_rate=1e-3), loss="mae")
    return model


def mape(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    denom = np.maximum(np.abs(y_true), 1.0)
    return float(np.mean(np.abs((y_true - y_pred) / denom)) * 100.0)


def scale_fit(series: np.ndarray) -> Tuple[float, float]:
    mean = float(np.mean(series))
    std = float(np.std(series))
    if std < 1e-8:
        std = 1.0
    return mean, std


def scale_transform(series: np.ndarray, mean: float, std: float) -> np.ndarray:
    return (series - mean) / std


def inverse_scale(series: np.ndarray, mean: float, std: float) -> np.ndarray:
    return (series * std) + mean


def fit_and_eval_dl_model(
    model_name: str,
    series: np.ndarray,
    lookback: int,
    test_horizon: int,
    epochs: int,
    batch_size: int,
) -> Tuple[keras.Model, float]:
    train_series = series[:-test_horizon]
    test_series = series[-test_horizon:]

    mean, std = scale_fit(train_series)
    scaled_train = scale_transform(train_series, mean, std)

    x_train, y_train = series_to_supervised(scaled_train, lookback)
    if len(x_train) < 1:
        raise ValueError("Not enough train windows for DL model.")

    x_train = x_train.reshape((-1, lookback, 1))

    if model_name == "lstm":
        model = build_lstm(lookback)
    else:
        model = build_gru(lookback)

    callbacks = [
        keras.callbacks.EarlyStopping(monitor="loss", patience=8, restore_best_weights=True)
    ]

    model.fit(
        x_train,
        y_train,
        epochs=epochs,
        batch_size=batch_size,
        verbose=0,
        callbacks=callbacks,
    )

    # Recursive prediction over test horizon.
    history_scaled = scaled_train.copy().tolist()
    preds_scaled = []
    for _ in range(test_horizon):
        window = np.array(history_scaled[-lookback:], dtype=np.float32).reshape((1, lookback, 1))
        pred_scaled = float(model.predict(window, verbose=0)[0, 0])
        preds_scaled.append(pred_scaled)
        history_scaled.append(pred_scaled)

    preds = inverse_scale(np.array(preds_scaled, dtype=np.float32), mean, std)
    preds = np.maximum(preds, 1.0)

    score = mape(test_series, preds)
    return model, score


def forecast_next_n(
    model: keras.Model,
    train_series: np.ndarray,
    lookback: int,
    n_steps: int,
) -> np.ndarray:
    mean, std = scale_fit(train_series)
    scaled = scale_transform(train_series, mean, std).tolist()

    out_scaled = []
    for _ in range(n_steps):
        window = np.array(scaled[-lookback:], dtype=np.float32).reshape((1, lookback, 1))
        pred_scaled = float(model.predict(window, verbose=0)[0, 0])
        out_scaled.append(pred_scaled)
        scaled.append(pred_scaled)

    out = inverse_scale(np.array(out_scaled, dtype=np.float32), mean, std)
    return np.maximum(np.round(out), 1).astype(int)


def baseline_mape_lag1(series: np.ndarray, test_horizon: int) -> float:
    train_series = series[:-test_horizon]
    test_series = series[-test_horizon:]

    hist = train_series.copy().tolist()
    preds = []
    for _ in range(test_horizon):
        pred = hist[-1]
        preds.append(pred)
        hist.append(pred)

    return mape(test_series, np.array(preds, dtype=np.float32))


def save_forecasts(conn, rows: List[Tuple[int, pd.Timestamp, int, float, str]], replace_existing: bool, model_version: str):
    if not rows:
        return 0

    cursor = conn.cursor()

    if replace_existing:
        min_date = min(r[1] for r in rows).date()
        max_date = max(r[1] for r in rows).date()
        cursor.execute(
            """
            DELETE FROM DemandForecasts
            WHERE model_version = %s
              AND forecast_date BETWEEN %s AND %s
            """,
            (model_version, min_date, max_date),
        )

    cursor.executemany(
        """
        INSERT INTO DemandForecasts
            (product_id, forecast_date, predicted_quantity, confidence_interval, model_version)
        VALUES (%s, %s, %s, %s, %s)
        """,
        [(pid, dt.date(), qty, conf, ver) for pid, dt, qty, conf, ver in rows],
    )
    conn.commit()
    return len(rows)


def run_pipeline(months_ahead: int, test_horizon: int, lookback: int, epochs: int, batch_size: int, model_version: str, no_replace: bool):
    db = load_db_config()
    conn = mysql.connector.connect(**db)

    try:
        all_data = fetch_monthly_sku_data(conn)
        if all_data.empty:
            raise ValueError("No sales history found. Populate SalesHistory first.")

        gpu_devices = tf.config.list_physical_devices("GPU")
        print(f"GPU devices detected: {len(gpu_devices)}")
        if gpu_devices:
            print("Using GPU-enabled TensorFlow if runtime supports it.")
        else:
            print("No GPU detected, training will run on CPU.")

        forecast_rows = []
        sku_results: List[SkuModelResult] = []
        fallback_sku_count = 0

        for product_id, sku_df in all_data.groupby("product_id"):
            monthly = make_complete_monthly_series(sku_df)
            series = monthly["monthly_demand"].astype(float).to_numpy()
            future_start = monthly["month_start"].max() + pd.offsets.MonthBegin(1)
            future_months = pd.date_range(future_start, periods=months_ahead, freq="MS")

            if len(series) < (lookback + test_horizon + 2):
                # Keep full-SKU forecast coverage even when DL training is not feasible.
                fallback_sku_count += 1
                fallback_value = int(max(1, round(series[-1])))
                for dt in future_months:
                    forecast_rows.append((int(product_id), dt, fallback_value, 60.0, model_version))

                sku_results.append(
                    SkuModelResult(
                        product_id=int(product_id),
                        selected_model="naive_fallback",
                        baseline_mape=float("nan"),
                        lstm_mape=float("nan"),
                        gru_mape=float("nan"),
                    )
                )
                print(
                    f"SKU {product_id}: insufficient history ({len(series)} months), "
                    "used naive fallback forecast."
                )
                continue

            baseline_score = baseline_mape_lag1(series, test_horizon=test_horizon)

            lstm_model, lstm_score = fit_and_eval_dl_model(
                model_name="lstm",
                series=series,
                lookback=lookback,
                test_horizon=test_horizon,
                epochs=epochs,
                batch_size=batch_size,
            )

            gru_model, gru_score = fit_and_eval_dl_model(
                model_name="gru",
                series=series,
                lookback=lookback,
                test_horizon=test_horizon,
                epochs=epochs,
                batch_size=batch_size,
            )

            if lstm_score <= gru_score:
                selected_name = "lstm"
                selected_model = lstm_model
                selected_score = lstm_score
            else:
                selected_name = "gru"
                selected_model = gru_model
                selected_score = gru_score

            future_preds = forecast_next_n(
                model=selected_model,
                train_series=series,
                lookback=lookback,
                n_steps=months_ahead,
            )

            confidence = max(50.0, min(99.0, 100.0 - selected_score))
            for dt, qty in zip(future_months, future_preds):
                forecast_rows.append((int(product_id), dt, int(qty), float(round(confidence, 2)), model_version))

            sku_results.append(
                SkuModelResult(
                    product_id=int(product_id),
                    selected_model=selected_name,
                    baseline_mape=round(baseline_score, 2),
                    lstm_mape=round(lstm_score, 2),
                    gru_mape=round(gru_score, 2),
                )
            )

        inserted = save_forecasts(
            conn,
            rows=forecast_rows,
            replace_existing=not no_replace,
            model_version=model_version,
        )

        if not sku_results:
            raise ValueError("No SKU had enough data for DL training.")

        report_df = pd.DataFrame([r.__dict__ for r in sku_results]).sort_values("product_id")
        mean_baseline = float(report_df["baseline_mape"].mean())
        mean_lstm = float(report_df["lstm_mape"].mean())
        mean_gru = float(report_df["gru_mape"].mean())

        print("\nDeep learning model evaluation (mean across SKUs)")
        print(f"Baseline (lag-1) MAPE: {mean_baseline:.2f}%")
        print(f"LSTM MAPE:             {mean_lstm:.2f}%")
        print(f"GRU MAPE:              {mean_gru:.2f}%")
        print(f"Fallback SKUs:         {fallback_sku_count}")
        print(f"Forecast rows inserted: {inserted}")

        out_csv = Path(__file__).resolve().parent / "dl_model_comparison.csv"
        report_df.to_csv(out_csv, index=False)
        print(f"Per-SKU model comparison saved to: {out_csv}")

    finally:
        conn.close()


def main():
    parser = argparse.ArgumentParser(description="FoodFox DL demand forecasting with LSTM/GRU")
    parser.add_argument("--months-ahead", type=int, default=6, help="Forecast horizon in months")
    parser.add_argument("--test-horizon", type=int, default=2, help="Holdout months per SKU for MAPE evaluation")
    parser.add_argument("--lookback", type=int, default=6, help="Sequence window length")
    parser.add_argument("--epochs", type=int, default=80, help="Training epochs")
    parser.add_argument("--batch-size", type=int, default=8, help="Training batch size")
    parser.add_argument("--model-version", type=str, default="v4.0-dl-lstm-gru", help="DB model_version tag")
    parser.add_argument("--no-replace", action="store_true", help="Do not delete existing forecast rows for same model/date")
    args = parser.parse_args()

    run_pipeline(
        months_ahead=args.months_ahead,
        test_horizon=args.test_horizon,
        lookback=args.lookback,
        epochs=args.epochs,
        batch_size=args.batch_size,
        model_version=args.model_version,
        no_replace=args.no_replace,
    )


if __name__ == "__main__":
    main()

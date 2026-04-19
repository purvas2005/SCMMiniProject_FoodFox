import argparse
from pathlib import Path

import numpy as np
import pandas as pd


BEVERAGE_CATEGORIES = {"Beverages"}
SNACK_CATEGORIES = {"Snacks", "Bakery", "Ready_to_Eat"}



def add_event_markers(df: pd.DataFrame, rng: np.random.Generator) -> pd.DataFrame:
    df = df.copy()
    dates = pd.to_datetime(df["transaction_date"])

    # Seasonal event markers.
    df["event_heatwave"] = (
        dates.dt.month.isin([5, 6, 7])
        & df["category"].isin(BEVERAGE_CATEGORIES)
        & (rng.random(len(df)) < 0.35)
    ).astype(int)

    df["event_holiday"] = (
        dates.dt.month.isin([11, 12])
        & df["category"].isin(SNACK_CATEGORIES)
        & (rng.random(len(df)) < 0.45)
    ).astype(int)

    # Rare social-media virality spikes for anomaly testing.
    df["event_viral_post"] = (rng.random(len(df)) < 0.0012).astype(int)

    event_names = np.where(
        df["event_viral_post"] == 1,
        "viral_post",
        np.where(
            df["event_heatwave"] == 1,
            "heatwave",
            np.where(df["event_holiday"] == 1, "holiday_season", "none"),
        ),
    )

    df["event_name"] = event_names
    return df



def apply_event_effects(df: pd.DataFrame, rng: np.random.Generator) -> pd.DataFrame:
    df = df.copy()

    base_units = df["units_sold"].astype(float).to_numpy()

    heatwave_multiplier = np.where(df["event_heatwave"] == 1, rng.uniform(1.25, 1.55, len(df)), 1.0)
    holiday_multiplier = np.where(df["event_holiday"] == 1, rng.uniform(1.30, 1.70, len(df)), 1.0)
    viral_multiplier = np.where(df["event_viral_post"] == 1, rng.uniform(5.0, 7.0, len(df)), 1.0)

    final_multiplier = heatwave_multiplier * holiday_multiplier * viral_multiplier
    adjusted_units = np.floor(base_units * final_multiplier).astype(int)

    adjusted_units = np.maximum(adjusted_units, 0)

    # Ensure feasible quantities by expanding initial stock if needed.
    df["units_sold"] = adjusted_units
    df["initial_quantity"] = np.maximum(df["initial_quantity"], df["units_sold"] + df["units_wasted"]).astype(int)
    df["daily_demand"] = np.maximum(df["daily_demand"], df["units_sold"]).astype(int)

    # Slightly more temp abuse during heatwaves.
    temp_abuse_bump = np.where(df["event_heatwave"] == 1, 1, 0)
    df["temp_abuse_events"] = (df["temp_abuse_events"] + temp_abuse_bump).astype(int)

    # Recompute financial columns.
    df["revenue"] = df["selling_price"] * df["units_sold"]
    df["waste_cost"] = df["cost_price"] * df["units_wasted"]
    df["profit"] = df["revenue"] - (df["cost_price"] * (df["units_sold"] + df["units_wasted"]))
    df["profit_margin_pct"] = np.where(df["revenue"] > 0, (df["profit"] / df["revenue"]) * 100, 0)
    df["waste_pct"] = np.where(df["initial_quantity"] > 0, (df["units_wasted"] / df["initial_quantity"]) * 100, 0)

    for col in ["revenue", "waste_cost", "profit", "profit_margin_pct", "waste_pct"]:
        df[col] = np.round(df[col], 2)

    # Ground truth label for anomaly model validation.
    df["is_known_sales_anomaly"] = df["event_viral_post"].astype(int)

    return df



def generate_three_year_dataset(cleaned_csv: Path, output_csv: Path, seed: int = 42) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    base = pd.read_csv(cleaned_csv)
    base["transaction_date"] = pd.to_datetime(base["transaction_date"])
    base["expiration_date"] = pd.to_datetime(base["expiration_date"])

    # Existing data covers 2023 and 2024. Build 2025 by shifting all 2024 records.
    base_2024 = base[base["transaction_date"].dt.year == 2024].copy()
    synth_2025 = base_2024.copy()
    synth_2025["record_id"] = np.arange(base["record_id"].max() + 1, base["record_id"].max() + 1 + len(synth_2025))

    synth_2025["transaction_date"] = synth_2025["transaction_date"] + pd.DateOffset(years=1)
    synth_2025["expiration_date"] = synth_2025["expiration_date"] + pd.DateOffset(years=1)

    # Mild annual growth and realistic noise.
    growth = rng.normal(loc=1.04, scale=0.08, size=len(synth_2025))
    growth = np.clip(growth, 0.75, 1.45)
    synth_2025["units_sold"] = np.floor(synth_2025["units_sold"] * growth).astype(int)
    synth_2025["daily_demand"] = np.floor(synth_2025["daily_demand"] * growth).astype(int)

    full_df = pd.concat([base, synth_2025], ignore_index=True)

    full_df["transaction_date"] = pd.to_datetime(full_df["transaction_date"])
    full_df["expiration_date"] = pd.to_datetime(full_df["expiration_date"])
    full_df["day_of_week"] = full_df["transaction_date"].dt.dayofweek
    full_df["month"] = full_df["transaction_date"].dt.month
    full_df["is_weekend"] = full_df["day_of_week"].isin([5, 6]).astype(int)
    full_df["days_until_expiry"] = np.maximum((full_df["expiration_date"] - full_df["transaction_date"]).dt.days, 0)

    full_df = add_event_markers(full_df, rng)
    full_df = apply_event_effects(full_df, rng)

    full_df["transaction_date"] = full_df["transaction_date"].dt.strftime("%Y-%m-%d")
    full_df["expiration_date"] = full_df["expiration_date"].dt.strftime("%Y-%m-%d")

    output_csv.parent.mkdir(parents=True, exist_ok=True)
    full_df.to_csv(output_csv, index=False)
    return full_df


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate 3-year FoodFox synthetic dataset with event markers.")
    parser.add_argument(
        "--input",
        default="data_outputs/perishable_goods_management_cleaned.csv",
        help="Cleaned input CSV",
    )
    parser.add_argument(
        "--output",
        default="data_outputs/foodfox_synthetic_3y_sales.csv",
        help="Synthetic output CSV",
    )
    parser.add_argument("--seed", default=42, type=int, help="Random seed")
    args = parser.parse_args()

    df = generate_three_year_dataset(Path(args.input), Path(args.output), args.seed)
    print(f"Generated rows: {len(df)}")
    print(f"Date range: {df['transaction_date'].min()} to {df['transaction_date'].max()}")
    print("Event counts:")
    print(df[["event_heatwave", "event_holiday", "event_viral_post", "is_known_sales_anomaly"]].sum().to_string())

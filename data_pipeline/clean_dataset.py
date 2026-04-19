import argparse
import json
from pathlib import Path

import numpy as np
import pandas as pd


NUMERIC_COLUMNS = [
    "shelf_life_days",
    "days_remaining_at_purchase",
    "storage_temp",
    "temp_deviation",
    "base_price",
    "cost_price",
    "initial_quantity",
    "spoilage_sensitivity",
    "day_of_week",
    "is_weekend",
    "month",
    "daily_demand",
    "demand_variability",
    "temp_abuse_events",
    "distribution_hours",
    "handling_score",
    "packaging_score",
    "spoilage_risk",
    "was_spoiled",
    "days_until_expiry",
    "markdown_applied",
    "discount_pct",
    "selling_price",
    "units_sold",
    "units_wasted",
    "waste_pct",
    "revenue",
    "waste_cost",
    "profit",
    "profit_margin_pct",
    "supplier_score",
    "is_promoted",
]

INT_COLUMNS = [
    "shelf_life_days",
    "days_remaining_at_purchase",
    "initial_quantity",
    "day_of_week",
    "is_weekend",
    "month",
    "daily_demand",
    "temp_abuse_events",
    "handling_score",
    "packaging_score",
    "was_spoiled",
    "days_until_expiry",
    "markdown_applied",
    "units_sold",
    "units_wasted",
    "supplier_score",
    "is_promoted",
]

DATE_COLUMNS = ["transaction_date", "expiration_date"]



def safe_round(series: pd.Series, digits: int) -> pd.Series:
    return np.round(series.astype(float), digits)



def clean_dataset(input_csv: Path, output_csv: Path, report_json: Path) -> None:
    df = pd.read_csv(input_csv)
    original_rows = len(df)

    # Remove exact duplicates if any.
    df = df.drop_duplicates().reset_index(drop=True)
    duplicate_rows_removed = original_rows - len(df)

    # Parse dates.
    for col in DATE_COLUMNS:
        df[col] = pd.to_datetime(df[col], errors="coerce")

    date_parse_nulls = int(df[DATE_COLUMNS].isna().sum().sum())

    # Drop rows with invalid dates because downstream calculations depend on date arithmetic.
    df = df.dropna(subset=DATE_COLUMNS).reset_index(drop=True)

    # Coerce numerics.
    coercion_nulls = {}
    for col in NUMERIC_COLUMNS:
        before_null = int(df[col].isna().sum())
        df[col] = pd.to_numeric(df[col], errors="coerce")
        after_null = int(df[col].isna().sum())
        coercion_nulls[col] = max(after_null - before_null, 0)

    # Fill any numeric nulls with 0 to keep records usable for analysis.
    numeric_nulls_before_fill = int(df[NUMERIC_COLUMNS].isna().sum().sum())
    df[NUMERIC_COLUMNS] = df[NUMERIC_COLUMNS].fillna(0)

    # Business constraints.
    non_negative_cols = [
        "base_price",
        "cost_price",
        "selling_price",
        "initial_quantity",
        "units_sold",
        "units_wasted",
        "distribution_hours",
        "discount_pct",
        "spoilage_risk",
    ]
    clamped_counts = {}
    for col in non_negative_cols:
        neg_count = int((df[col] < 0).sum())
        clamped_counts[col] = neg_count
        df[col] = np.maximum(df[col], 0)

    # Ensure sold + wasted does not exceed initial quantity.
    sold_plus_waste = df["units_sold"] + df["units_wasted"]
    quantity_fix_count = int((sold_plus_waste > df["initial_quantity"]).sum())
    df.loc[sold_plus_waste > df["initial_quantity"], "initial_quantity"] = sold_plus_waste[
        sold_plus_waste > df["initial_quantity"]
    ]

    # Recompute date-derived fields.
    days_until_expiry_calc = (df["expiration_date"] - df["transaction_date"]).dt.days
    df["days_until_expiry"] = np.maximum(days_until_expiry_calc, 0)

    # Recompute financial metrics for consistency.
    df["waste_pct"] = np.where(
        df["initial_quantity"] > 0,
        (df["units_wasted"] / df["initial_quantity"]) * 100,
        0,
    )
    df["revenue"] = df["selling_price"] * df["units_sold"]
    df["waste_cost"] = df["cost_price"] * df["units_wasted"]

    # Profit uses full procurement cost of sold + wasted units.
    df["profit"] = df["revenue"] - (df["cost_price"] * (df["units_sold"] + df["units_wasted"]))
    df["profit_margin_pct"] = np.where(df["revenue"] > 0, (df["profit"] / df["revenue"]) * 100, 0)

    # Standardize integer columns.
    for col in INT_COLUMNS:
        df[col] = np.floor(df[col]).astype(int)

    # Standardize bounded categoricals and flags.
    df["quality_grade"] = df["quality_grade"].astype(str).str.upper().where(
        df["quality_grade"].astype(str).str.upper().isin(["A", "B", "C"]), "B"
    )
    df["is_weekend"] = df["is_weekend"].clip(0, 1)
    df["was_spoiled"] = df["was_spoiled"].clip(0, 1)
    df["is_promoted"] = df["is_promoted"].clip(0, 1)
    df["markdown_applied"] = df["markdown_applied"].clip(0, 1)

    # Final rounding to keep export neat and deterministic.
    for col in [
        "storage_temp",
        "temp_deviation",
        "base_price",
        "cost_price",
        "spoilage_sensitivity",
        "demand_variability",
        "distribution_hours",
        "spoilage_risk",
        "discount_pct",
        "selling_price",
        "waste_pct",
        "revenue",
        "waste_cost",
        "profit",
        "profit_margin_pct",
    ]:
        df[col] = safe_round(df[col], 2)

    # Restore date formatting for CSV portability.
    for col in DATE_COLUMNS:
        df[col] = df[col].dt.strftime("%Y-%m-%d")

    output_csv.parent.mkdir(parents=True, exist_ok=True)
    report_json.parent.mkdir(parents=True, exist_ok=True)

    df.to_csv(output_csv, index=False)

    report = {
        "input_csv": str(input_csv),
        "output_csv": str(output_csv),
        "rows_input": original_rows,
        "rows_output": len(df),
        "duplicate_rows_removed": duplicate_rows_removed,
        "invalid_date_values_seen": date_parse_nulls,
        "numeric_nulls_before_fill": numeric_nulls_before_fill,
        "numeric_coercion_new_nulls_by_column": coercion_nulls,
        "negative_value_clamps_by_column": clamped_counts,
        "quantity_constraint_fixes": quantity_fix_count,
    }

    report_json.write_text(json.dumps(report, indent=2), encoding="utf-8")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Clean FoodFox perishable goods dataset.")
    parser.add_argument(
        "--input",
        default="perishable_goods_management.csv",
        help="Input CSV path",
    )
    parser.add_argument(
        "--output",
        default="data_outputs/perishable_goods_management_cleaned.csv",
        help="Output cleaned CSV path",
    )
    parser.add_argument(
        "--report",
        default="data_outputs/cleaning_report.json",
        help="Output cleaning report JSON path",
    )
    args = parser.parse_args()

    clean_dataset(Path(args.input), Path(args.output), Path(args.report))

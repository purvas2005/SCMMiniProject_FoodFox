import argparse
from pathlib import Path

import pandas as pd



def export_dimensions(input_csv: Path, out_dir: Path) -> None:
    df = pd.read_csv(input_csv)
    out_dir.mkdir(parents=True, exist_ok=True)

    dim_product = (
        df[["product_id", "product_name", "category", "shelf_life_days", "spoilage_sensitivity", "supplier_id"]]
        .drop_duplicates()
        .sort_values(["category", "product_name", "product_id"])
    )

    dim_store = df[["store_id", "region"]].drop_duplicates().sort_values(["region", "store_id"])

    event_calendar = (
        df[["transaction_date", "event_name", "event_heatwave", "event_holiday", "event_viral_post"]]
        .drop_duplicates()
        .rename(columns={"transaction_date": "event_date"})
        .sort_values(["event_date", "event_name"])
    )

    # Simple event intensity for UI and analytics.
    event_calendar["event_strength"] = (
        event_calendar["event_heatwave"] * 0.6
        + event_calendar["event_holiday"] * 0.8
        + event_calendar["event_viral_post"] * 1.0
    ).round(2)

    dim_product.to_csv(out_dir / "dim_product.csv", index=False)
    dim_store.to_csv(out_dir / "dim_store.csv", index=False)
    event_calendar.to_csv(out_dir / "event_calendar.csv", index=False)

    print(f"dim_product rows: {len(dim_product)}")
    print(f"dim_store rows: {len(dim_store)}")
    print(f"event_calendar rows: {len(event_calendar)}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Export dimensional tables from synthetic sales CSV.")
    parser.add_argument(
        "--input",
        default="data_outputs/foodfox_synthetic_3y_sales_with_anomalies.csv",
        help="Input CSV with synthetic sales",
    )
    parser.add_argument(
        "--out-dir",
        default="data_outputs",
        help="Output directory",
    )
    args = parser.parse_args()

    export_dimensions(Path(args.input), Path(args.out_dir))

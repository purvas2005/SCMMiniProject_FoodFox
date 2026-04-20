import argparse
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler


FEATURES = [
    "units_sold",
    "daily_demand",
    "revenue",
    "waste_pct",
    "discount_pct",
    "temp_deviation",
    "temp_abuse_events",
    "days_until_expiry",
    "distribution_hours",
    "handling_score",
    "packaging_score",
]



def run_isolation_forest(df: pd.DataFrame, contamination: float, seed: int) -> pd.DataFrame:
    out = df.copy()
    out["anomaly_score_iforest"] = 0.0
    out["is_sales_anomaly"] = 0

    for category, idx in out.groupby("category").groups.items():
        part = out.loc[idx, FEATURES].copy()

        scaler = StandardScaler()
        x = scaler.fit_transform(part)

        model = IsolationForest(
            n_estimators=300,
            contamination=contamination,
            random_state=seed,
            n_jobs=-1,
        )

        preds = model.fit_predict(x)
        scores = model.decision_function(x)

        out.loc[idx, "anomaly_score_iforest"] = np.round(-scores, 6)
        out.loc[idx, "is_sales_anomaly"] = (preds == -1).astype(int)

    return out



def try_autoencoder_gpu(df: pd.DataFrame, epochs: int = 25, batch_size: int = 4096, seed: int = 42):
    try:
        import torch
        import torch.nn as nn
        import torch.optim as optim
    except Exception:
        return None

    if not torch.cuda.is_available() or torch.cuda.device_count() < 2:
        return None

    torch.manual_seed(seed)
    np.random.seed(seed)

    device = torch.device("cuda:1")

    scaler = StandardScaler()
    x_np = scaler.fit_transform(df[FEATURES]).astype(np.float32)

    x_tensor = torch.tensor(x_np, device=device)

    class AE(nn.Module):
        def __init__(self, in_dim: int):
            super().__init__()
            self.encoder = nn.Sequential(
                nn.Linear(in_dim, 32),
                nn.ReLU(),
                nn.Linear(32, 12),
                nn.ReLU(),
                nn.Linear(12, 4),
            )
            self.decoder = nn.Sequential(
                nn.Linear(4, 12),
                nn.ReLU(),
                nn.Linear(12, 32),
                nn.ReLU(),
                nn.Linear(32, in_dim),
            )

        def forward(self, x):
            z = self.encoder(x)
            return self.decoder(z)

    model = AE(in_dim=x_tensor.shape[1]).to(device)
    loss_fn = nn.MSELoss()
    optimizer = optim.Adam(model.parameters(), lr=1e-3)

    model.train()
    n = x_tensor.shape[0]
    for _ in range(epochs):
        indices = torch.randperm(n, device=device)
        for i in range(0, n, batch_size):
            batch_idx = indices[i : i + batch_size]
            xb = x_tensor[batch_idx]
            recon = model(xb)
            loss = loss_fn(recon, xb)
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()

    model.eval()
    with torch.no_grad():
        recon_all = model(x_tensor)
        mse = torch.mean((recon_all - x_tensor) ** 2, dim=1).detach().cpu().numpy()

    out = df.copy()
    out["anomaly_score_autoencoder"] = np.round(mse, 6)

    threshold = np.quantile(mse, 0.995)
    out["is_sales_anomaly_autoencoder"] = (mse >= threshold).astype(int)
    return out



def main(input_csv: Path, output_csv: Path, summary_csv: Path, contamination: float, seed: int) -> None:
    df = pd.read_csv(input_csv)

    missing_features = [c for c in FEATURES if c not in df.columns]
    if missing_features:
        raise ValueError(f"Missing required features: {missing_features}")

    result = run_isolation_forest(df, contamination=contamination, seed=seed)

    # Optionally run an autoencoder on GPU #2 if available.
    ae_result = try_autoencoder_gpu(df, seed=seed)
    if ae_result is not None:
        result["anomaly_score_autoencoder"] = ae_result["anomaly_score_autoencoder"]
        result["is_sales_anomaly_autoencoder"] = ae_result["is_sales_anomaly_autoencoder"]

    result.to_csv(output_csv, index=False)

    group_cols = ["category", "region"]
    summary = (
        result.groupby(group_cols, dropna=False)["is_sales_anomaly"]
        .agg(total_anomalies="sum", rows="count")
        .reset_index()
    )
    summary["anomaly_rate_pct"] = np.round((summary["total_anomalies"] / summary["rows"]) * 100, 3)
    summary = summary.sort_values("anomaly_rate_pct", ascending=False)
    summary.to_csv(summary_csv, index=False)

    print(f"Rows analyzed: {len(result)}")
    print(f"IsolationForest anomalies: {int(result['is_sales_anomaly'].sum())}")
    if "is_sales_anomaly_autoencoder" in result.columns:
        print(f"Autoencoder anomalies: {int(result['is_sales_anomaly_autoencoder'].sum())}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Detect sales anomalies in FoodFox synthetic dataset.")
    parser.add_argument(
        "--input",
        default="data_outputs/foodfox_synthetic_3y_sales.csv",
        help="Input synthetic CSV",
    )
    parser.add_argument(
        "--output",
        default="data_outputs/foodfox_synthetic_3y_sales_with_anomalies.csv",
        help="Output CSV with anomaly flags",
    )
    parser.add_argument(
        "--summary",
        default="data_outputs/anomaly_summary_by_category_region.csv",
        help="Output anomaly summary CSV",
    )
    parser.add_argument("--contamination", type=float, default=0.01, help="Expected anomaly proportion")
    parser.add_argument("--seed", type=int, default=42, help="Random seed")
    args = parser.parse_args()

    main(Path(args.input), Path(args.output), Path(args.summary), args.contamination, args.seed)

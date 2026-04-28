# de Bruijn S/E/P anomaly model v1

Generated: 2026-04-28T08:20:00

This package adds a predictive/anomaly model on top of the simulator output.

## Files

- `analysis/anomaly_model.py` — anomaly detector for exported JSON/CSV
- `examples/random_500.json`
- `examples/sequential_500.json`
- `examples/biased_sreal_500.json`
- `examples/high_overlap_500.json`
- `reports/*_anomaly_report.json`
- `reports/anomaly_model_report.md`

## Run

```bash
python3 analysis/anomaly_model.py examples/random_500.json --out reports/random_report.json
```

With rolling windows:

```bash
python3 analysis/anomaly_model.py examples/random_500.json --window 100 --step 25 --out reports/random_rolling.json
```

## Null model

S and E are independent uniform 6-bit words. Therefore overlap_score follows:

```text
Binomial(6, 0.5)
```

Overlap class probabilities:

```text
real  = 1/16
sreal = 3/16
ereal = 3/16
-     = 9/16
```

#!/usr/bin/env python3
"""Predictive/anomaly model for de Bruijn S/E/P simulator output.

The null model assumes S and E are independent uniformly sampled 6-bit words.
Under that model:
- P is uniform over 64 words.
- overlap_score follows Binomial(n=6, p=0.5).
- overlap_class probabilities can be calculated directly from the exhaustive 64x64 table.

The detector reports:
- z-score for mean overlap score
- chi-square statistic for overlap_score distribution
- chi-square statistic for overlap_class distribution
- entropy deficit for P
- repeated-pair / coverage indicators
- rolling-window anomaly flags
"""

from __future__ import annotations

import argparse, csv, json, math
from pathlib import Path
from collections import Counter
from typing import Any, Dict, List

EXPECTED_SCORE_COUNTS_4096 = {0:64, 1:384, 2:960, 3:1280, 4:960, 5:384, 6:64}
EXPECTED_SCORE_PROBS = {k:v/4096 for k,v in EXPECTED_SCORE_COUNTS_4096.items()}

# For overlap_class:
# class is based on whether overlap starts/ends with 1.
# Exhaustive probabilities are computed analytically here from independent S/E bits.
# At a boundary bit:
# S=E=1 has probability 1/4.
# A class depends on first and last overlap positions.
EXPECTED_CLASS_PROBS = {
    "real": 1/16,       # start=1 and end=1
    "sreal": 3/16,      # start=1 and end!=1
    "ereal": 3/16,      # end=1 and start!=1
    "-": 9/16,          # neither boundary overlap is 1
}

def shannon_entropy(values: List[str]) -> float:
    if not values:
        return 0.0
    n = len(values)
    c = Counter(values)
    return -sum((v/n)*math.log2(v/n) for v in c.values())

def load_records(path: Path) -> List[Dict[str, Any]]:
    if path.suffix.lower() == ".json":
        obj = json.loads(path.read_text(encoding="utf-8"))
        return obj["records"] if isinstance(obj, dict) and "records" in obj else obj
    if path.suffix.lower() == ".csv":
        with path.open(newline="", encoding="utf-8") as f:
            rows = list(csv.DictReader(f))
        for r in rows:
            for k in ["iteration","idxS","idxE","overlap_score"]:
                if k in r and r[k] != "":
                    r[k] = int(float(r[k]))
            if "real_overlap" in r:
                r["real_overlap"] = str(r["real_overlap"]).lower() in ("true","1","yes")
        return rows
    raise ValueError("Input must be JSON or CSV")

def overlap_class(ov: str) -> str:
    start = ov.startswith("1")
    end = ov.endswith("1")
    if start and end:
        return "real"
    if start and not end:
        return "sreal"
    if end and not start:
        return "ereal"
    return "-"

def chisq(observed: Counter, expected_probs: Dict[Any, float], n: int) -> float:
    total = 0.0
    for k, p in expected_probs.items():
        exp = n * p
        obs = observed.get(k, 0)
        if exp > 0:
            total += (obs-exp)**2/exp
    return total

def analyze_window(records: List[Dict[str, Any]]) -> Dict[str, Any]:
    n = len(records)
    scores = [int(r["overlap_score"]) for r in records]
    classes = [r.get("overlap_class") or overlap_class(r["overlap"]) for r in records]
    p_words = [r["P"] for r in records]
    pairs = [f'{r["S"]}/{r["E"]}' for r in records]

    mean_score = sum(scores)/n if n else 0.0
    # Binomial(6,0.5): mean 3, variance 1.5 per sample.
    se_mean = math.sqrt(1.5/n) if n else float("inf")
    z_mean = (mean_score-3.0)/se_mean if se_mean else 0.0

    score_counts = Counter(scores)
    class_counts = Counter(classes)

    p_entropy = shannon_entropy(p_words)
    entropy_deficit = 6.0 - p_entropy

    coverage_pairs = len(set(pairs))
    repeated_pair_rate = 1 - coverage_pairs/n if n else 0.0

    score_chi = chisq(score_counts, EXPECTED_SCORE_PROBS, n)
    class_chi = chisq(class_counts, EXPECTED_CLASS_PROBS, n)

    # A compact rule-based anomaly score. This is intentionally transparent.
    flags = []
    if abs(z_mean) > 3:
        flags.append("mean_overlap_z_gt_3")
    if score_chi > 18.55:  # df=6 approx p<0.005
        flags.append("overlap_score_chi_high")
    if class_chi > 12.84:  # df=3 approx p<0.005
        flags.append("overlap_class_chi_high")
    if entropy_deficit > 0.35:
        flags.append("p_entropy_deficit")
    if repeated_pair_rate > 0.20 and n >= 200:
        flags.append("many_repeated_pairs")

    anomaly_score = (
        min(abs(z_mean)/3, 3)
        + min(score_chi/18.55, 3)
        + min(class_chi/12.84, 3)
        + min(entropy_deficit/0.35, 3)
    )

    return {
        "n": n,
        "mean_overlap_score": mean_score,
        "mean_overlap_z": z_mean,
        "overlap_score_counts": dict(sorted(score_counts.items())),
        "overlap_score_chisq": score_chi,
        "overlap_class_counts": dict(class_counts),
        "overlap_class_chisq": class_chi,
        "p_entropy_bits": p_entropy,
        "p_entropy_deficit": entropy_deficit,
        "unique_pairs": coverage_pairs,
        "repeated_pair_rate": repeated_pair_rate,
        "flags": flags,
        "anomaly_score": anomaly_score,
        "is_anomaly": bool(flags),
    }

def rolling(records: List[Dict[str, Any]], window: int, step: int) -> List[Dict[str, Any]]:
    out = []
    for start in range(0, max(0, len(records)-window+1), step):
        chunk = records[start:start+window]
        a = analyze_window(chunk)
        a["start_iteration"] = chunk[0].get("iteration", start+1)
        a["end_iteration"] = chunk[-1].get("iteration", start+window)
        out.append(a)
    return out

def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("input", type=Path)
    ap.add_argument("--out", type=Path, default=None)
    ap.add_argument("--window", type=int, default=100)
    ap.add_argument("--step", type=int, default=25)
    args = ap.parse_args()

    records = load_records(args.input)
    report = {
        "schema": "debruijn-sep-anomaly-report-v1",
        "null_model": {
            "S_E": "independent uniform 6-bit words",
            "overlap_score": "Binomial(6,0.5)",
            "expected_mean_overlap_score": 3.0,
            "expected_class_probs": EXPECTED_CLASS_PROBS,
        },
        "overall": analyze_window(records),
        "rolling": rolling(records, args.window, args.step),
    }
    text = json.dumps(report, indent=2)
    if args.out:
        args.out.write_text(text, encoding="utf-8")
    print(text)

if __name__ == "__main__":
    main()

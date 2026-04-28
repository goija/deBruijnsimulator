# Predictive / anomaly model report

Generated: 2026-04-28T08:20:00

## 1. Null model

The baseline assumes independent uniform 6-bit S and E words.

Expected values:

| Metric | Expected |
|---|---:|
| Mean overlap score | 3.0 |
| Mean overlap density | 0.5 |
| P entropy | 6.0 bits |
| overlap_score | Binomial(6, 0.5) |
| overlap_class real | 1/16 = 0.0625 |
| overlap_class sreal | 3/16 = 0.1875 |
| overlap_class ereal | 3/16 = 0.1875 |
| overlap_class - | 9/16 = 0.5625 |

## 2. Detector

The detector flags deviations using:

- mean overlap z-score
- chi-square test for overlap_score distribution
- chi-square test for overlap_class distribution
- entropy deficit of P
- repeated S/E pair coverage

This is a transparent rule-based model, not a black-box classifier.

## 3. Random run, n=500

| Metric | Observed |
|---|---:|
| Mean overlap score | 3.0000 |
| Mean-overlap z-score | 0.0000 |
| P entropy | 5.8855 bits |
| P entropy deficit | 0.1145 |
| Score chi-square | 4.5504 |
| Class chi-square | 6.6453 |
| Unique S/E pairs | 475 |
| Anomaly? | False |

Overlap score counts:

```json
{
  "0": 8,
  "1": 58,
  "2": 104,
  "3": 154,
  "4": 117,
  "5": 50,
  "6": 9
}
```

Overlap class counts:

```json
{
  "-": 303,
  "ereal": 88,
  "real": 35,
  "sreal": 74
}
```

### Difference from expected values

The random run differs from the exact expected values only by finite-sample variation. The detector flags are:

```json
[]
```

## 4. Contrast runs

### Sequential run, n=500

```json
{
  "n": 500,
  "mean_overlap_score": 6.0,
  "mean_overlap_z": 54.77225575051661,
  "overlap_score_counts": {
    "6": 500
  },
  "overlap_class_counts": {
    "ereal": 126,
    "-": 127,
    "real": 124,
    "sreal": 123
  },
  "overlap_score_chisq": 31500.0,
  "overlap_class_chisq": 380.0995555555555,
  "p_entropy_bits": -0.0,
  "p_entropy_deficit": 6.0,
  "unique_pairs": 64,
  "flags": [
    "mean_overlap_z_gt_3",
    "overlap_score_chi_high",
    "overlap_class_chi_high",
    "p_entropy_deficit"
  ],
  "is_anomaly": true
}
```

### Biased-sreal run, n=500

```json
{
  "n": 500,
  "mean_overlap_score": 3.144,
  "mean_overlap_z": 2.6290682760247996,
  "overlap_score_counts": {
    "0": 5,
    "1": 36,
    "2": 114,
    "3": 147,
    "4": 136,
    "5": 49,
    "6": 13
  },
  "overlap_class_counts": {
    "-": 207,
    "ereal": 59,
    "sreal": 209,
    "real": 25
  },
  "overlap_score_chisq": 10.730666666666666,
  "overlap_class_chisq": 175.41333333333333,
  "p_entropy_bits": 5.830299508115305,
  "p_entropy_deficit": 0.16970049188469538,
  "unique_pairs": 459,
  "flags": [
    "overlap_class_chi_high"
  ],
  "is_anomaly": true
}
```

### High-overlap run, n=500

```json
{
  "n": 500,
  "mean_overlap_score": 4.69,
  "mean_overlap_z": 30.855037406124364,
  "overlap_score_counts": {
    "0": 4,
    "1": 13,
    "2": 49,
    "3": 79,
    "4": 57,
    "5": 19,
    "6": 279
  },
  "overlap_class_counts": {
    "-": 182,
    "real": 69,
    "sreal": 116,
    "ereal": 133
  },
  "overlap_score_chisq": 9565.158399999998,
  "overlap_class_chisq": 102.33955555555555,
  "p_entropy_bits": 3.5307499563757334,
  "p_entropy_deficit": 2.4692500436242666,
  "unique_pairs": 280,
  "flags": [
    "mean_overlap_z_gt_3",
    "overlap_score_chi_high",
    "overlap_class_chi_high",
    "p_entropy_deficit"
  ],
  "is_anomaly": true
}
```

## 5. Interpretation

The useful decomposition is:

```text
P                 -> randomness / XOR field
overlap_score     -> similarity density
overlap_class     -> boundary alignment detector
rolling anomaly   -> temporal/local structural deviation
```

The strongest anomaly signals come from overlap_class and overlap_score because they react directly to local structure in S/E alignment.

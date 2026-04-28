# Export schema

Each record has:

```json
{
  "iteration": 1,
  "timestamp": "2026-04-28T...",
  "idxS": 0,
  "idxE": 0,
  "S": "000000",
  "E": "000000",
  "P": "000000",
  "overlap": "000000",
  "overlap_score": 6,
  "overlap_density": 1.0,
  "real_overlap": false,
  "random_mode": false,
  "autoplay": false,
  "hex_mode": false,
  "orientation": "top-to-bottom"
}
```

`real_overlap` is true only when:

```text
overlap starts with 1 OR overlap ends with 1
```

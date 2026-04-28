# v10.2 real overlap indicator

A second overlap indicator was added.

Definitions:
- `O` overlap string keeps matching S/E bits and fills mismatches with `-`.
- Density score counts all non-`-` positions.
- Real overlap is stricter:

```text
real overlap = O starts with 1 OR O ends with 1
```

Examples:
- `1-----` -> REAL
- `-----1` -> REAL
- `0-----` -> EDGE / not real by this rule
- `--1---` -> EDGE / not real by this rule

# v10.3 overlap class

The overlap indicator now has four states:

```text
sreal : overlap string starts with 1, but does not end with 1
ereal : overlap string ends with 1, but does not start with 1
real  : overlap string starts with 1 and ends with 1
-     : neither start nor end overlap with 1
```

Examples:

```text
1----- -> sreal
-----1 -> ereal
1----1 -> real
0----1 -> ereal
1----0 -> sreal
0----0 -> -
--1--- -> -
------ -> -
```

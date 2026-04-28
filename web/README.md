# Web simulator v9.8

Open `index.html` directly in a browser.

New:
- Hexagram box is hidden entirely when hexagram mode is off.
- No blank space remains when hidden.
- Hexagram box animates open when turned on.
- UI settings are remembered using localStorage.

Remembered settings:
- random mode
- autoplay
- hexagram mode
- orientation
- trail
- fade
- P labels
- XOR guides


History fix:
- The history buffer still trims old entries.
- The visible iteration number no longer depends on buffer length.
- The counter keeps increasing after 40 updates.


## v9.8 overlap line

Generated: 2026-04-27T07:52:08

The XOR blend box now includes an `O` overlap row.

For every bit position:

```text
S bit == E bit  -> show that bit, 0 or 1
S bit != E bit  -> show -
```

Example:

```text
S = 101100
E = 111000
O = 1-1--0
```


## v9.8 history/counter upgrades

Generated: 2026-04-27T08:03:02

Added:
- iteration counter in the top status box
- history counter keeps increasing beyond 40
- timestamps in history entries
- yellow outline on changed P bits
- reset-counter button


## v9.8 visual fix

Generated: 2026-04-27T08:18:15

Fixed:
- the lower-right yellow `R` random indicator is visible again
- the S and E rings always show all 64 red/blue cycle LEDs
- the current S/E word is highlighted as a 6-LED window
- random mode still only changes S and E; P is always XOR(S,E)


## v9.8 random/autoplay and R-indicator fix

Generated: 2026-04-27T08:34:34

Fixed:
- Random S/E no longer turns autoplay on.
- Autoplay and Random S/E are now mutually exclusive runtime modes.
- Random/autoplay are no longer restored from localStorage.
- The yellow `R` indicator is moved outside the clipped scope layer and anchored lower-right.


## v9.8 strict Random S/E separation

Generated: 2026-04-27T08:45:53

Fixed:
- Random S/E and Autoplay are completely separate.
- Random S/E does not start or stop Autoplay.
- Autoplay does not start or stop Random S/E.
- When Random S/E is ON, the next iteration uses random S and E values.
- When Random S/E is OFF, the next iteration advances sequentially.
- The yellow R indicator is now in the top status box, so it cannot be clipped by the scope.


## v9.8 overlap schema and score meter

Generated: 2026-04-27T08:51:45

Added:
- Overlap row uses its own color schema:
  - `-` = light yellow
  - `1` = green
  - `0` = brown
- History trail now uses the same overlap color schema.
- XOR blend box includes an overlap density meter.
- Top status includes overlap string and score.


## v9.8 overlap meter fix

Generated: 2026-04-27T08:57:59

Fixed:
- The overlap density meter now updates through dedicated DOM elements.
- The meter is moved outside the circular display, top-left.
- The XOR blend box still shows the O row, but no longer contains the density meter.


## v9.8 layout and S/E ring rendering fix

Generated: 2026-04-27T09:09:37

Fixed:
- Overlap density meter is now a normal full-width panel aligned with the top box.
- The S and E rings are rebuilt from a clean renderer.
- Each ring always draws all 64 red/blue LEDs.
- The current S and E 6-bit windows are highlighted with six visible LEDs.


## v9.8 ring and XOR box layout

Generated: 2026-04-27T09:17:04

Fixed/changed:
- S/E ring LEDs are forced to render as clean individual dots.
- Active S/E windows are six separate highlighted LED dots.
- XOR blend box is compact:
  - S and E are on one line.
  - P and O are on one line.
- XOR guide opacity is reduced so it cannot look like a filled ring.


## v9.8 no cross-circle P guides

Generated: 2026-04-27T09:27:16

Changed:
- Removed guide lines from S/E rings to the P cells.
- P-cell guides are now short local ticks near the P strip only.
- Nothing crosses the S/E circles anymore.
- The former `XOR guides` control is now labelled `P ticks`.


## v9.8 no P bars

Generated: 2026-04-27T09:35:12

Changed:
- Removed all P ticks/bars/guides completely.
- Removed the P ticks control button.
- The P strip is now only six horizontal LED cells.


## v10.0 hard-clean render fix

Generated: 2026-04-27T13:42:38

Applied:
- no SVG guide layer
- no P bars/ticks/guides
- no P-cell wrappers
- P is six clean horizontal LED dots only
- S/E rings remain LED dots only


## v10.1 loading fix

Generated: 2026-04-27T13:51:34

Fixed:
- page no longer remains on `Loading`
- replaced simulator JavaScript with a clean known-good implementation
- kept hard-clean no-bars P rendering


## v10.2 real overlap indicator

Generated: 2026-04-27T14:59:12

Added:
- second overlap indicator in the overlap meter panel
- `REAL` when overlap string starts or ends with `1`
- `EDGE` otherwise
- top status includes `real=YES/NO`


## v10.3 overlap class

Generated: 2026-04-28T07:47:07

Changed overlap indicator:
- `sreal` = overlap starts with `1` and does not end with `1`
- `ereal` = overlap ends with `1` and does not start with `1`
- `real` = both start and end overlap with `1`
- `-` = otherwise

Export now includes `overlap_class` where available.

# v10.0 hard-clean render fix

Applied hard-clean rendering:
- Removed `guideLayer` SVG from HTML.
- Removed guide and label buttons.
- Disabled guide rendering.
- Replaced P rendering so the P strip creates only six circular `.pbit` LED dots.
- Removed P cell/label wrappers from runtime generation.
- CSS hides any accidental SVG/line/path/polygon inside `.scope`.

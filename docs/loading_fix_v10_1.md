# v10.1 loading fix

The previous hard-clean patch could leave JavaScript in a broken state, causing the page to stay at "Loading".

This version replaces `web/assets/simulator.js` with a clean known-good implementation:
- no guide layer
- no P bars
- six clean P dots
- S/E rings initialize correctly
- DOMContentLoaded startup
- button wiring guarded by element checks

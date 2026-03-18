# QuietAI Agent

This repository is a browser extension (Manifest V3) that enhances prompts before they are sent to AI chat interfaces.

## How the extension is wired (quick mental model)

- `manifest.json` registers:
  - `background.js` as the MV3 service worker
  - `content.js` as a content script on `<all_urls>`
  - `popup.html` + `popup.js` as the toolbar configuration UI
- `popup.js` persists user toggles in `chrome.storage.sync` under these keys:
  - `rules` (object of ruleId -> boolean)
  - `logging` (boolean)
  - `enabled` (boolean)
- `content.js`:
  - loads cached settings from `chrome.storage.sync`
  - listens for `keydown` on Enter (without Shift/Ctrl/Meta)
  - extracts the active chat input
  - builds an enhanced prompt (`buildEnhancedPrompt`)
  - writes the enhanced prompt back to the input and triggers the send button click

## Key consistency requirement

Rule identifiers must stay consistent across:

- `content.js`: `PROMPT_ENHANCEMENTS` keys
- `popup.js`: `ruleIds` array
- `popup.html`: checkbox `id` attributes

If you add/remove a rule, update all three places together.

## Browser folder sync

After changing root files (`manifest.json`, `content.js`, `popup.html`, `popup.js`, `background.js`), run:

- `scripts/sync-browsers.ps1`

so `browsers/chrome/*` and `browsers/edge/*` stay in sync.
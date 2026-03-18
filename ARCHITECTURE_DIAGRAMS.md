# QuietAI Architecture Diagrams

## High-level components

```mermaid
flowchart LR
  U[User] -->|Opens AI site| Chat[AI Chat UI]
  Chat -->|Typing + Enter| C[content.js (content script)]

  P[popup.html + popup.js] -->|Toggle rules| S[(chrome.storage.sync)]
  C -->|Reads settings| S

  C -->|Enhances prompt| B[buildEnhancedPrompt()]
  C -->|Writes prompt back + clicks send| Chat

  W[background.js (service worker)] -->|onInstalled logging| Brw[Browser console]
```

## Sequence: keydown -> enhance -> send

```mermaid
sequenceDiagram
  autonumber
  participant U as User
  participant C as content.js
  participant S as chrome.storage.sync
  participant P as popup UI
  participant A as AI Chat UI

  P->>S: set({ rules, logging, enabled })
  S-->>C: (onChanged) update cachedSettings

  U->>C: keydown "Enter" (no Shift/Ctrl/Meta)
  C->>S: use cachedSettings (rules/enabled)
  alt enabled + active rules
    C->>C: preventDefault + buildEnhancedPrompt(rawInput)
    C->>A: update input value
    C->>A: click submit/send button
  else disabled or no active rules
    C-->>U: allow native Enter behavior
  end
```

## Notes

- `content.js` extracts the prompt via input selectors and uses capture-phase `keydown` handling (`addEventListener(..., true)`).
- `popup.js` checkbox `id`s and `content.js` `PROMPT_ENHANCEMENTS` keys must remain aligned for rules to work.


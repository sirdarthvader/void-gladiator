---
"@void-gladiator/renderer-ansi": minor
"@void-gladiator/content": minor
"@void-gladiator/cli-game": minor
---

New rendering engine: chalk + ansi-escapes + delta rendering

- Replace raw ANSI escape codes with chalk for colors/styles
- Replace raw cursor/screen control with ansi-escapes
- Add delta rendering to frame-buffer (only write changed lines per tick)
- Decouple content from renderer (named color strings instead of ANSI codes)
- Switch to ASCII borders for reliable cross-terminal rendering
- Simplify title screen (spaced text, no animation)
- Increase arena size to 72x30

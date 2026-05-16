---
'@void-gladiator/renderer-ansi': major
'@void-gladiator/renderer-tk': major
---

- New package @void-gladiator/renderer-tk using terminal-kit's ScreenBuffer for cell-level delta rendering with rich visual support
- Renderer interface (init/render/cleanup) shared by both renderers
- ScreenBuffer core with arena coordinate mapping and bounds clipping
- Sprite system: 3x3 player sprites, 1x1 enemies/projectiles
- All 4 scene renderers (title, lobby, gameplay, results)
- Arena floor with subtle grid dots for depth
- Pulsing title prompt animation
- Switch via --renderer=enhanced or VOID_RENDERER=enhanced env var
- Classic renderer (renderer-ansi) remains the default

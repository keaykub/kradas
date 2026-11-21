# AGENTS.md

Notes for anyone (human or agent) changing kradas itself. To make a clip with kradas, read `SKILL.md` instead.

- Plain ES modules for the browser, no build step and no runtime dependencies. Keep it that way.
- Scripts in `scripts/` use only Node 22+ built-ins (global `fetch` and `WebSocket`), plus Chrome and ffmpeg.
- No code comments. Explain decisions in this file, `SKILL.md` or commit messages.
- Every drawing and sound must be a pure function of time and seeds: no `Math.random`, `Date.now`, timers or CSS
  animation, or renders stop matching the preview.
- After changing `lib/`, check `examples/canal-village` and `templates/story` still render:
  `npm run serve`, open each with `?t=6`, then `npm run render -- examples/canal-village`.
- Rendered `.mp4` and `.wav` files are ignored by git. `docs/preview.jpg` is the README image; re-export it from
  the demo when the look changes.
- `world/` needs three.js through the page's import map. Scenes must stay deterministic in `?rec=1` mode: use the
  engine clock and seeded `rng`, never `Math.random`, so `scripts/capture-world.mjs` records the same walk every time.

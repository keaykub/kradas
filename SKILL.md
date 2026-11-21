---
name: kradas
description: >-
  Makes short vertical story clips (Reels, TikTok, Shorts) in a cut-paper look, drawn entirely in code on a
  canvas: scenes pop up like a paper diorama, captions sit on torn paper strips, paper fold sounds are
  synthesized, and the page renders to an mp4 with audio. Use when someone wants a paper, papercut, pop-up book,
  diorama or storybook style animation, an explainer or story clip with that look, or a 9:16 video drawn in code.
  Not for real paper craft instructions or printable templates.
license: MIT
---

# kradas

kradas (กระดาษ, "paper" in Thai) is a small browser kit plus a renderer. A clip is one HTML page that imports
the kit and describes what is on screen at time `t`. The same page plays live in a browser and renders frame by
frame to an mp4, so what you preview is exactly what ships.

## Files

| Path | Use |
|---|---|
| `lib/core.js` | canvas size (1080x1920), math, easing, seeded random, colour helpers |
| `lib/paper.js` | `sheet`, `fold`, shapes (`rect`, `ellipse`, `blob`, `scallopTop`, `wave`, `leafShape`, `strip`), `setWorld`, finishing passes |
| `lib/motion.js` | `popUp`, `spring`, `slideIn`, `sway`, `camera`, `keyframes` |
| `lib/text.js` | `label`, `caption`, `subtitles`, `timeCues`, Thai-aware line wrapping |
| `lib/sound.js` | `renderSound` with `fold`, `flick`, `rustle`, `slide`, `pad`, `pluck` |
| `lib/stage.js` | `stage({ duration, draw, overlay, sound, lens })`: the player and the record hooks |
| `scripts/render.mjs` | headless Chrome to mp4 with sound |
| `scripts/serve.mjs` | local preview server |
| `templates/story/` | the smallest working clip, copy it to start |
| `examples/canal-village/` | a full 14 second scene to read for patterns |

## Workflow

1. **Write the beats first.** List each line of narration or caption with a start and end second, then the
   moment each piece pops. Keep both in one `AT` object so the picture and the sound read the same schedule.
2. **Copy `templates/story/`** into a new folder next to it (the imports are relative: `../../lib/`).
3. **Build the world back to front** inside `draw(c, t)`: backdrop, far layers, ground, the subjects, the
   foreground. Wrap every standing thing in `popUp(c, t, AT.x, hinge, () => ...)` where `hinge` is the point
   on its base that stays on the ground.
4. **Put text in `overlay(c, t)`**, never in `draw`. The overlay is drawn after the lens blur so captions stay
   sharp.
5. **Score it in `sound(k)`** from the same `AT` times: `k.fold` on every pop, `k.rustle` for leaves, `k.slide`
   for things that travel, a quiet `k.pad` underneath.
6. **Check stills** at the moments that matter: open the page with `?t=6` to freeze a frame in the browser, or
   `?rec=1&t=6` for the exact render framing.
7. **Render**: `node scripts/render.mjs <folder> [out.mp4] [--fps 30]`. Needs Node 22+, Chrome and ffmpeg on
   PATH.

## The look

These are what make a frame read as paper rather than flat vector art. Check every frame against them.

- **Every piece is a sheet.** Build things from flat cut shapes layered on top of each other. A house is
  stilts, a floor board, a wall, a door, a roof and a gable, each its own `sheet`. Detail comes from more
  layers, not from gradients or strokes on one shape.
- **Lift sets the shadow.** `lift` (0 to 3) is how far a sheet floats above the one behind it. Things lying
  on the ground get 0.3 to 0.6, standing pieces about 1, close foreground leaves 2 to 3. Keep neighbours
  consistent or the depth reads wrong.
- **One warm light.** The light comes from the upper left by default, so shadows fall down and to the right.
  Change it once with `setWorld({ light })` and never per piece. Shadows take the world colour
  (`setWorld({ shadow })`), a warm brown by day and a deep blue at night, never pure black.
- **Print, don't paint.** Use the `print` option of `sheet` to add planks, rays, ribs, rings or spots clipped
  to the shape, in a shade of the sheet colour. One or two motifs per piece is enough.
- **Fold for volume.** Roofs, hats, petals and anything that should look creased use `fold` with an `apex`
  where the crease meets.
- **Chunky shapes.** Avoid hair-thin parts; anything under about 8 px disappears on a phone. Make motifs big
  enough to count.
- **A shallow lens.** `lens: { focus, band, soft, blur }` blurs above and below a horizontal band like a
  close-up photo of a model. Put the focus on the subject of the shot.
- **Limited palette.** Pick 10 to 20 named colours in a `C` object at the top of the scene and only use those,
  plus `shade(color, k)` variations.

## Motion

- `popUp` springs a piece up from its hinge with a small overshoot. Stagger pops 0.15 to 0.3 s apart, back to
  front, so the scene assembles like a pop-up book opening.
- Keep idle motion small: `sway` for leaves and flags, slow `wave` phase for water, a gentle `camera` push
  (zoom 1 to about 1.07 over the clip).
- Everything must be a pure function of `t`. No `Math.random`, `Date.now`, CSS animations or timers: use
  `rng(seed)` so every frame renders the same way twice.

## Vertical safe area

Phones cover the top and bottom of a 9:16 clip with app UI. Keep the title below y = 140 and captions above
y = 1760; keep faces and key action between y = 300 and y = 1500.

## Checks before rendering

- [ ] Every pop has a matching `k.fold` at the same time.
- [ ] No caption overlaps another, and Thai lines wrap inside the strip (the wrap uses `Intl.Segmenter`).
- [ ] Freeze frames at the first pop, mid clip and the last second look finished, with nothing cut off at the
      sides.
- [ ] The lens focus band sits on the subject.
- [ ] Nothing uses black for shadows or outlines.

import { clamp, ease, seg } from './core.js'

export function spring(t, start, { damping = 7, frequency = 12, duration = 1.4 } = {}) {
  const x = t - start
  if (x <= 0) return 0
  if (x >= duration) return 1
  return 1 - Math.exp(-damping * x) * Math.cos(frequency * x)
}

export function popUp(c, t, start, hinge, draw, options = {}) {
  const k = spring(t, start, options)
  if (k <= 0) return 0
  const lean = (1 - clamp(k)) * (options.lean ?? 0.35)
  c.save()
  c.translate(hinge.x, hinge.y)
  c.transform(1, 0, lean, k, 0, 0)
  c.translate(-hinge.x, -hinge.y)
  draw(k)
  c.restore()
  return k
}

export function slideIn(c, t, start, from, draw, duration = 0.8) {
  const k = ease.out(seg(t, start, start + duration))
  if (k <= 0) return 0
  c.save()
  c.translate(from.x * (1 - k), from.y * (1 - k))
  draw(k)
  c.restore()
  return k
}

export function sway(t, seed = 0, amount = 0.04, speed = 1.2) {
  return Math.sin(t * speed + seed * 1.7) * amount + Math.sin(t * speed * 2.3 + seed) * amount * 0.35
}

export function keyframes(keys, t) {
  if (t <= keys[0][0]) return keys[0].slice(1)
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1]
    if (t <= b[0]) {
      const k = ease.inOut(seg(t, a[0], b[0]))
      return a.slice(1).map((v, j) => v + (b[j + 1] - v) * k)
    }
  }
  return keys[keys.length - 1].slice(1)
}

export function camera(c, t, keys, draw) {
  const [x, y, zoom] = keyframes(keys, t)
  const w = c.canvas.width, h = c.canvas.height
  c.save()
  c.translate(w / 2, h / 2)
  c.scale(zoom, zoom)
  c.translate(-x, -y)
  draw()
  c.restore()
}

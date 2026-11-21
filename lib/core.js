export const W = 1080
export const H = 1920

export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v))
export const lerp = (a, b, k) => a + (b - a) * k
export const seg = (t, a, b) => clamp((t - a) / (b - a))
export const window01 = (t, a, b, fadeIn = 0.3, fadeOut = 0.3) => seg(t, a, a + fadeIn) * (1 - seg(t, b - fadeOut, b))

export const ease = {
  in: k => k * k * k,
  out: k => 1 - Math.pow(1 - k, 3),
  inOut: k => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2),
  back: k => 1 + 2.70158 * Math.pow(k - 1, 3) + 1.70158 * Math.pow(k - 1, 2),
}

export function rng(seed) {
  let s = (seed >>> 0) || 1
  return () => {
    s ^= s << 13
    s >>>= 0
    s ^= s >> 17
    s ^= s << 5
    s >>>= 0
    return s / 4294967296
  }
}

export const P = (x, y) => ({ x, y })
export const lp = (a, b, k) => P(lerp(a.x, b.x, k), lerp(a.y, b.y, k))
export const rotate = (p, a, o = P(0, 0)) => {
  const dx = p.x - o.x, dy = p.y - o.y
  return P(o.x + dx * Math.cos(a) - dy * Math.sin(a), o.y + dx * Math.sin(a) + dy * Math.cos(a))
}

export function hexToRgb(color) {
  if (color.startsWith('rgb')) return color.match(/[\d.]+/g).slice(0, 3).map(Number)
  const n = parseInt(color.replace('#', ''), 16)
  return [n >> 16, (n >> 8) & 255, n & 255]
}

export function shade(hex, k) {
  const [r, g, b] = hexToRgb(hex), target = k > 0 ? 255 : 0, a = Math.abs(k)
  return `rgb(${Math.round(r + (target - r) * a)},${Math.round(g + (target - g) * a)},${Math.round(b + (target - b) * a)})`
}

export function mix(hexA, hexB, k) {
  const a = hexToRgb(hexA), b = hexToRgb(hexB)
  return `rgb(${a.map((v, i) => Math.round(lerp(v, b[i], k))).join(',')})`
}

export function rgba(hex, alpha) {
  const [r, g, b] = hexToRgb(hex)
  return `rgba(${r},${g},${b},${alpha})`
}

export function canvas(w, h, paint) {
  const el = document.createElement('canvas')
  el.width = w
  el.height = h
  if (paint) paint(el.getContext('2d'), el)
  return el
}

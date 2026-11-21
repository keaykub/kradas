import { W, H, P, rng, shade, rgba, canvas, clamp } from './core.js'

export const world = {
  light: normalize(P(-0.55, -0.83)),
  shadow: '#3a2414',
  shadowAlpha: 0.42,
  cut: 'rgba(48,30,18,0.62)',
  lip: 'rgba(255,247,228,0.62)',
}

export function setWorld(options) {
  Object.assign(world, options)
  if (options.light) world.light = normalize(options.light)
}

function normalize(v) {
  const l = Math.hypot(v.x, v.y) || 1
  return P(v.x / l, v.y / l)
}

export function trace(c, pts) {
  c.beginPath()
  pts.forEach((p, i) => (i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)))
  c.closePath()
}

function signedArea(pts) {
  let s = 0
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length]
    s += a.x * b.y - b.x * a.y
  }
  return s
}

function bounds(pts) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  for (const p of pts) {
    x0 = Math.min(x0, p.x)
    y0 = Math.min(y0, p.y)
    x1 = Math.max(x1, p.x)
    y1 = Math.max(y1, p.y)
  }
  return { x0, y0, x1, y1, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, w: x1 - x0, h: y1 - y0 }
}

function castShadow(c, pts, lift, color, o) {
  if (lift <= 0 || o.shadow === false) return
  c.save()
  c.shadowColor = rgba(o.shadowColor ?? world.shadow, o.shadowAlpha ?? world.shadowAlpha)
  c.shadowBlur = 3 + 9 * lift
  c.shadowOffsetX = -world.light.x * 5 * lift
  c.shadowOffsetY = -world.light.y * 5 * lift
  c.fillStyle = color
  trace(c, pts)
  c.fill()
  c.restore()
}

function toneFill(c, pts, color, o) {
  const b = bounds(pts), L = world.light, r = Math.max(b.w, b.h) / 2
  const g = c.createLinearGradient(b.cx + L.x * r, b.cy + L.y * r, b.cx - L.x * r, b.cy - L.y * r)
  const tone = o.tone ?? 0.07
  g.addColorStop(0, shade(color, tone))
  g.addColorStop(1, shade(color, -tone))
  c.fillStyle = g
  trace(c, pts)
  c.fill()
}

function cutEdges(c, pts, o) {
  if (o.edge === false) return
  const scale = o.edgeScale ?? 1
  c.save()
  c.lineJoin = 'round'
  c.strokeStyle = o.cut ?? world.cut
  c.lineWidth = 1.7 * scale
  trace(c, pts)
  c.stroke()
  const outwardSign = signedArea(pts) > 0 ? 1 : -1
  c.strokeStyle = o.lip ?? world.lip
  c.lineWidth = 1.5 * scale
  c.lineCap = 'round'
  c.beginPath()
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length], dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy)
    if (l < 0.5) continue
    const nx = (dy / l) * outwardSign, ny = (-dx / l) * outwardSign
    if (nx * world.light.x + ny * world.light.y < 0.2) continue
    const inset = 1.6 * scale
    c.moveTo(a.x - nx * inset, a.y - ny * inset)
    c.lineTo(b.x - nx * inset, b.y - ny * inset)
  }
  c.stroke()
  c.restore()
}

export function sheet(c, pts, color, o = {}) {
  castShadow(c, pts, o.lift ?? 1, color, o)
  toneFill(c, pts, color, o)
  if (o.print) {
    c.save()
    trace(c, pts)
    c.clip()
    o.print(c, bounds(pts))
    c.restore()
  }
  cutEdges(c, pts, o)
}

export function fold(c, pts, color, o = {}) {
  castShadow(c, pts, o.lift ?? 1, color, o)
  const n = pts.length, b = bounds(pts), apex = o.apex ?? P(b.cx, b.cy), depth = o.depth ?? 0.2, r = rng(o.seed ?? 3)
  for (let i = 0; i < n; i++) {
    const a = pts[i], q = pts[(i + 1) % n], mx = (a.x + q.x) / 2 - apex.x, my = (a.y + q.y) / 2 - apex.y, l = Math.hypot(mx, my) || 1
    const k = clamp(((mx / l) * world.light.x + (my / l) * world.light.y) * depth + (r() - 0.5) * 0.05, -0.55, 0.55)
    c.fillStyle = shade(color, k)
    c.strokeStyle = c.fillStyle
    c.lineWidth = 1
    c.beginPath()
    c.moveTo(apex.x, apex.y)
    c.lineTo(a.x, a.y)
    c.lineTo(q.x, q.y)
    c.closePath()
    c.fill()
    c.stroke()
  }
  if (o.print) {
    c.save()
    trace(c, pts)
    c.clip()
    o.print(c, b)
    c.restore()
  }
  cutEdges(c, pts, o)
}

export function ellipse(cx, cy, rx, ry, n = 24, turn = 0) {
  return [...Array(n)].map((_, i) => {
    const a = (i / n) * Math.PI * 2
    const x = Math.cos(a) * rx, y = Math.sin(a) * ry
    return P(cx + x * Math.cos(turn) - y * Math.sin(turn), cy + x * Math.sin(turn) + y * Math.cos(turn))
  })
}

export function rect(x, y, w, h) {
  return [P(x, y), P(x + w, y), P(x + w, y + h), P(x, y + h)]
}

export function blob(cx, cy, rx, ry, lobes = 6, seed = 1, depth = 0.18) {
  const r = rng(seed), out = [], n = lobes * 6, phase = r() * 6.28, amp = [...Array(lobes)].map(() => 0.6 + r() * 0.8)
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, lobe = Math.floor((i / n) * lobes), within = ((i / n) * lobes) % 1
    const bump = Math.sin(within * Math.PI) * depth * amp[lobe]
    out.push(P(cx + Math.cos(a + phase) * rx * (1 - depth + bump), cy + Math.sin(a + phase) * ry * (1 - depth + bump)))
  }
  return out
}

export function scallopTop(x0, x1, baseY, height, bumps, seed = 1) {
  const r = rng(seed), out = [P(x1, baseY), P(x0, baseY)], step = (x1 - x0) / bumps
  for (let i = 0; i < bumps; i++) {
    const h = height * (0.65 + r() * 0.5)
    for (let k = 0; k <= 6; k++) {
      const u = k / 6
      out.push(P(x0 + step * (i + u), baseY - Math.sin(u * Math.PI) * h))
    }
  }
  return out
}

export function wave(x0, x1, y, thickness, amp, wavelength, phase = 0) {
  const top = [], bottom = []
  for (let x = x0; x <= x1 + 1; x += 18) {
    top.push(P(x, y + Math.sin(x / wavelength * Math.PI * 2 + phase) * amp))
    bottom.push(P(x, y + thickness + Math.sin(x / wavelength * Math.PI * 2 + phase + 0.8) * amp * 0.6))
  }
  return [...top, ...bottom.reverse()]
}

export function leafShape(base, angle, length, width, seed = 1, notches = 0, bend = 0) {
  const r = rng(seed), side = [], other = [], n = 16
  let x = base.x, y = base.y
  for (let i = 0; i <= n; i++) {
    const u = i / n, a = angle + bend * u
    if (i) {
      x += Math.cos(a) * length / n
      y += Math.sin(a) * length / n
    }
    const w = Math.sin(Math.pow(u, 0.8) * Math.PI) * width * (notches && i % 2 ? 0.5 + r() * 0.2 : 1)
    side.push(P(x - Math.sin(a) * w, y + Math.cos(a) * w))
    other.push(P(x + Math.sin(a) * w, y - Math.cos(a) * w))
  }
  return [...side, ...other.reverse()]
}

export function strip(a, b, width) {
  const dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1, nx = (-dy / l) * width / 2, ny = (dx / l) * width / 2
  return [P(a.x + nx, a.y + ny), P(b.x + nx, b.y + ny), P(b.x - nx, b.y - ny), P(a.x - nx, a.y - ny)]
}

const fibreTile = typeof document === 'undefined' ? null : canvas(512, 512, c => {
  const r = rng(77), img = c.createImageData(512, 512), d = img.data
  for (let i = 0; i < d.length; i += 4) {
    const v = 128 + (r() - 0.5) * 40
    d[i] = d[i + 1] = d[i + 2] = v
    d[i + 3] = 255
  }
  c.putImageData(img, 0, 0)
  for (let i = 0; i < 90; i++) {
    const x = r() * 512, y = r() * 512, rad = 20 + r() * 60, g = c.createRadialGradient(x, y, 0, x, y, rad), light = r() > 0.5
    g.addColorStop(0, light ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)')
    g.addColorStop(1, 'rgba(128,128,128,0)')
    c.fillStyle = g
    c.fillRect(x - rad, y - rad, rad * 2, rad * 2)
  }
  c.lineCap = 'round'
  for (let i = 0; i < 900; i++) {
    const x = r() * 512, y = r() * 512, a = r() * 6.28, l = 6 + r() * 30
    c.strokeStyle = r() > 0.45 ? 'rgba(255,255,255,0.26)' : 'rgba(0,0,0,0.16)'
    c.lineWidth = 0.6 + r() * 1
    c.beginPath()
    c.moveTo(x, y)
    c.quadraticCurveTo(x + Math.cos(a + 0.7) * l * 0.5, y + Math.sin(a + 0.7) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l)
    c.stroke()
  }
})

let fibreMask = null

export function paperFinish(target, amount = 0.5) {
  const w = target.width, h = target.height
  if (!fibreMask || fibreMask.width < w || fibreMask.height < h) fibreMask = canvas(Math.max(w, fibreMask?.width ?? 0), Math.max(h, fibreMask?.height ?? 0))
  const m = fibreMask.getContext('2d')
  m.globalCompositeOperation = 'source-over'
  m.clearRect(0, 0, w, h)
  m.fillStyle = m.createPattern(fibreTile, 'repeat')
  m.fillRect(0, 0, w, h)
  m.globalCompositeOperation = 'destination-in'
  m.drawImage(target, 0, 0)
  const c = target.getContext('2d')
  c.save()
  c.setTransform(1, 0, 0, 1, 0, 0)
  c.globalAlpha = amount
  c.globalCompositeOperation = 'overlay'
  c.drawImage(fibreMask, 0, 0, w, h, 0, 0, w, h)
  c.restore()
}

export function grain(c, amount = 0.22) {
  c.save()
  c.setTransform(1, 0, 0, 1, 0, 0)
  c.globalAlpha = amount
  c.globalCompositeOperation = 'overlay'
  c.fillStyle = c.createPattern(fibreTile, 'repeat')
  c.fillRect(0, 0, c.canvas.width, c.canvas.height)
  c.restore()
}

let blurSmall = null, blurMask = null

export function tiltShift(c, { focus = H * 0.6, band = 260, soft = 520, blur = 9 } = {}) {
  const w = c.canvas.width, h = c.canvas.height, sw = Math.round(w / 2), shh = Math.round(h / 2)
  blurSmall ??= canvas(sw, shh)
  blurMask ??= canvas(w, h)
  const s = blurSmall.getContext('2d')
  s.clearRect(0, 0, sw, shh)
  s.filter = `blur(${blur / 2}px)`
  s.drawImage(c.canvas, 0, 0, sw, shh)
  s.filter = 'none'
  const m = blurMask.getContext('2d')
  m.globalCompositeOperation = 'source-over'
  m.clearRect(0, 0, w, h)
  m.drawImage(blurSmall, 0, 0, w, h)
  m.globalCompositeOperation = 'destination-in'
  const g = m.createLinearGradient(0, 0, 0, h), top = clamp((focus - band / 2) / h), bottom = clamp((focus + band / 2) / h)
  g.addColorStop(0, 'rgba(0,0,0,1)')
  g.addColorStop(clamp(top - soft / h), 'rgba(0,0,0,1)')
  g.addColorStop(top, 'rgba(0,0,0,0)')
  g.addColorStop(bottom, 'rgba(0,0,0,0)')
  g.addColorStop(clamp(bottom + soft / h), 'rgba(0,0,0,1)')
  g.addColorStop(1, 'rgba(0,0,0,1)')
  m.fillStyle = g
  m.fillRect(0, 0, w, h)
  c.save()
  c.setTransform(1, 0, 0, 1, 0, 0)
  c.drawImage(blurMask, 0, 0)
  c.restore()
}

export function vignette(c, color = '#2a170c', strength = 0.35) {
  const w = c.canvas.width, h = c.canvas.height
  c.save()
  c.setTransform(1, 0, 0, 1, 0, 0)
  const g = c.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.45, w / 2, h / 2, Math.max(w, h) * 0.72)
  g.addColorStop(0, rgba(color, 0))
  g.addColorStop(1, rgba(color, strength))
  c.fillStyle = g
  c.fillRect(0, 0, w, h)
  c.restore()
}

export { W, H }

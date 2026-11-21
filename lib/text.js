import { W, P, rng, ease, seg, window01 } from './core.js'
import { sheet } from './paper.js'

export const fonts = {
  body: 'Kanit',
  title: 'Kanit',
  href: 'https://fonts.googleapis.com/css2?family=Kanit:wght@400;600;700&display=swap',
}

const segmenter = typeof Intl !== 'undefined' && Intl.Segmenter ? new Intl.Segmenter('th', { granularity: 'word' }) : null

export function words(text) {
  if (!segmenter) return text.split(/(\s+)/)
  return [...segmenter.segment(text)].map(s => s.segment)
}

export function wrap(c, text, maxWidth) {
  const lines = []
  let line = ''
  for (const part of text.split('\n')) {
    for (const w of words(part)) {
      const next = line + w
      if (line && c.measureText(next.trimEnd()).width > maxWidth) {
        lines.push(line.trim())
        line = w.trimStart()
      } else line = next
    }
    lines.push(line.trim())
    line = ''
  }
  return lines.filter(Boolean)
}

function tornStrip(x, y, w, h, seed) {
  const r = rng(seed), top = [], bottom = [], n = Math.max(6, Math.round(w / 26))
  for (let i = 0; i <= n; i++) {
    const px = x + (w * i) / n
    top.push(P(px, y + (r() - 0.5) * 5))
    bottom.push(P(px, y + h + (r() - 0.5) * 5))
  }
  return [...top, ...bottom.reverse()]
}

export function label(c, text, x, y, o = {}) {
  const size = o.size ?? 54, pad = o.pad ?? size * 0.55, lineH = size * 1.42
  c.save()
  c.font = `${o.weight ?? 600} ${size}px ${o.font ?? fonts.body}`
  const lines = wrap(c, text, o.maxWidth ?? W - 180)
  const w = Math.max(...lines.map(l => c.measureText(l).width)) + pad * 2, h = lines.length * lineH + pad * 0.7
  const left = o.align === 'left' ? x : x - w / 2, top = y - h / 2
  c.translate(x, y)
  c.rotate(o.tilt ?? 0)
  c.translate(-x, -y)
  sheet(c, tornStrip(left, top, w, h, o.seed ?? 5), o.paper ?? '#f6ecd6', { lift: o.lift ?? 1.4, tone: 0.04 })
  c.fillStyle = o.color ?? '#2b1d12'
  c.textBaseline = 'middle'
  c.textAlign = 'left'
  lines.forEach((l, i) => {
    let cx = left + pad
    if (o.align !== 'left') cx = x - c.measureText(l).width / 2
    const ly = top + pad * 0.35 + lineH * (i + 0.5)
    if (o.highlight) drawHighlighted(c, l, cx, ly, o.highlight, o.color ?? '#2b1d12', o.accent ?? '#c2412d')
    else c.fillText(l, cx, ly)
  })
  c.restore()
}

function drawHighlighted(c, line, x, y, terms, base, accent) {
  const re = new RegExp(`(${terms.map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`)
  let cx = x
  for (const part of line.split(re)) {
    if (!part) continue
    c.fillStyle = terms.includes(part) ? accent : base
    c.fillText(part, cx, y)
    cx += c.measureText(part).width
  }
}

export function caption(c, t, a, b, text, y, o = {}) {
  const k = window01(t, a, b, 0.25, 0.25)
  if (k <= 0) return
  c.save()
  c.globalAlpha *= k
  c.translate(0, (1 - ease.out(seg(t, a, a + 0.35))) * 26)
  label(c, text, W / 2, y, o)
  c.restore()
}

export function subtitles(c, t, cues, o = {}) {
  const cue = cues.find(([, a, b]) => t >= a && t < b)
  if (!cue) return
  caption(c, t, cue[1], cue[2], cue[0], o.y ?? 1660, { size: 50, ...o, seed: Math.round(cue[1] * 10) })
}

export function timeCues(lines, start, end, gap = 0.15) {
  const total = lines.reduce((s, l) => s + l.length, 0)
  let at = start
  return lines.map(l => {
    const d = ((end - start) * l.length) / total
    const cue = [l, at, at + d - gap]
    at += d
    return cue
  })
}

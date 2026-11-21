import { P, rng, shade } from './core.js'
import { sheet, fold, rect, ellipse, blob, leafShape, strip } from './paper.js'
import { shingles, planks } from './props.js'

const JADE = '#3f8f8a', GOLD = '#d9a441', IVORY = '#f3ead6', ROCK = '#8d9aa6', BONE = '#e8dcc0', NIGHT = '#2a2230', BLOOD = '#b3261e'

function ring(cx, cy, outer, inner, n = 40) {
  const out = [], inn = []
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2
    out.push(P(cx + Math.cos(a) * outer, cy + Math.sin(a) * outer))
    inn.push(P(cx + Math.cos(-a) * inner, cy + Math.sin(-a) * inner))
  }
  return [...out, ...inn]
}

function curvedRoof(c, y, half, height, color, lift = 1.2) {
  const pts = [P(-half - 34, y - 18), P(-half - 10, y + 4), P(half + 10, y + 4), P(half + 34, y - 18), P(half * 0.72, y - height * 0.55), P(half * 0.46, y - height), P(-half * 0.46, y - height), P(-half * 0.72, y - height * 0.55)]
  fold(c, pts, color, { apex: P(0, y - height * 0.5), depth: 0.26, lift, print: (p, b) => shingles(p, b, shade(color, -0.28), 16, 22) })
  sheet(c, strip(P(-half - 30, y - 12), P(half + 30, y - 12), 9), GOLD, { lift: 0.4, edgeScale: 0.7 })
}

export function pagoda(c, { tiers = 5, roof = JADE, wall = IVORY, pillar = '#b3352a' } = {}) {
  sheet(c, rect(-150, -30, 300, 30), '#d6cdb8', { lift: 1 })
  let y = -30
  for (let i = 0; i < tiers; i++) {
    const half = 112 - i * 15, h = 78 - i * 5
    sheet(c, rect(-half + 14, y - h, (half - 14) * 2, h), wall, { lift: 0.9 })
    for (const s of [-1, 1]) sheet(c, rect(s * (half - 22) - 7, y - h, 14, h), pillar, { lift: 0.6, edgeScale: 0.8 })
    sheet(c, rect(-16, y - h * 0.72, 32, h * 0.72), shade(pillar, -0.25), { lift: 0.4, print: (p, b) => { p.strokeStyle = GOLD; p.lineWidth = 3; p.strokeRect(b.x0 + 4, b.y0 + 4, b.w - 8, b.h) } })
    sheet(c, rect(-half + 6, y - 14, (half - 6) * 2, 8), shade(pillar, 0.1), { lift: 0.5, edgeScale: 0.7 })
    y -= h
    curvedRoof(c, y, half + 10, 44, roof)
    y -= 40
  }
  sheet(c, rect(-7, y - 70, 14, 74), GOLD, { lift: 0.5 })
  for (let k = 0; k < 3; k++) sheet(c, ellipse(0, y - 16 - k * 20, 15 - k * 3.5, 7, 12), GOLD, { lift: 0.5, edgeScale: 0.7 })
  fold(c, [P(-6, y - 70), P(0, y - 112), P(6, y - 70)], GOLD, { lift: 0.4, depth: 0.2 })
}

export function pine(c, { seed = 1, needle = '#3d6b58' } = {}) {
  const r = rng(seed), bark = '#6b4a36'
  const spine = [P(0, 0), P(-22, -90), P(18, -180), P(-14, -270), P(10, -350)]
  for (let i = 1; i < spine.length; i++) sheet(c, strip(spine[i - 1], spine[i], 30 - i * 5), i % 2 ? bark : shade(bark, -0.12), { lift: 0.8 })
  const pads = [[-96, -150, 96, 32], [92, -214, 104, 34], [-80, -286, 92, 30], [70, -340, 84, 28], [0, -400, 96, 34]]
  pads.forEach(([x, y, rx, ry], i) => {
    sheet(c, strip(P(spine[Math.min(4, i + 1)].x, y + 30), P(x * 0.6, y + 6), 9), bark, { lift: 0.4, edgeScale: 0.6 })
    const pts = [P(x - rx, y + 8), P(x + rx, y + 8)]
    for (let k = 0; k <= 12; k++) { const u = k / 12, bump = 0.7 + 0.3 * Math.abs(Math.sin(u * Math.PI * 4 + i)); pts.push(P(x + rx - u * rx * 2, y + 8 - Math.sin(u * Math.PI) * ry * 2 * bump)) }
    sheet(c, pts, i % 2 ? needle : shade(needle, 0.1), {
      lift: 1.1,
      print: (p, b) => { p.strokeStyle = shade(needle, 0.3); p.lineWidth = 2.5; for (let k = 0; k < 16; k++) { const px = b.x0 + r() * b.w, py = b.y0 + r() * b.h; p.beginPath(); p.moveTo(px, py); p.lineTo(px + 8, py - 12); p.stroke() } },
    })
  })
}

export function blossomTree(c, { seed = 1, colors = ['#f2a8b8', '#f6c3cf', '#e88aa0'], trunk = '#5b4034', s = 1 } = {}) {
  sheet(c, [P(-22 * s, 0), P(-10 * s, -150 * s), P(-70 * s, -230 * s), P(-54 * s, -242 * s), P(0, -190 * s), P(60 * s, -250 * s), P(74 * s, -236 * s), P(16 * s, -150 * s), P(24 * s, 0)], trunk, { lift: 1 })
  const r = rng(seed)
  const lumps = [[-118, -270, 110, 78], [112, -280, 110, 78], [0, -350, 140, 92], [-40, -262, 110, 66], [66, -256, 104, 62]]
  lumps.forEach(([x, y, rx, ry], i) => sheet(c, blob(x * s, y * s, rx * s, ry * s, 8, seed + i * 3, 0.24), colors[i % colors.length], { lift: 1 + i * 0.1 }))
  for (let i = 0; i < 34; i++) sheet(c, ellipse((r() - 0.5) * 400 * s, (-210 - r() * 200) * s, 7 * s, 5 * s, 8, r() * 3), shade(colors[1], 0.3), { lift: 0.2, edge: false })
}

export function floatingPeak(c, { seed = 1, h = 420 } = {}) {
  const r = rng(seed), pts = [P(0, 0), P(-70, -h * 0.25), P(-150, -h * 0.5), P(-128, -h * 0.62), P(-80, -h * 0.9), P(-30, -h), P(26, -h * 0.84), P(70, -h * 0.94), P(124, -h * 0.66), P(142, -h * 0.5), P(60, -h * 0.24)]
  fold(c, pts, ROCK, { apex: P(-10, -h * 0.55), depth: 0.3, lift: 1.4, seed })
  sheet(c, [P(-150, -h * 0.5), P(-128, -h * 0.62), P(-80, -h * 0.9), P(-30, -h), P(26, -h * 0.84), P(70, -h * 0.94), P(124, -h * 0.66), P(142, -h * 0.5), P(80, -h * 0.58), P(10, -h * 0.52), P(-70, -h * 0.6)], '#7fae86', { lift: 0.5 })
  sheet(c, [P(-14, -h * 0.56), P(8, -h * 0.56), P(16, -h * 0.12), P(-2, -h * 0.04), P(-20, -h * 0.14)], '#eef6f4', { lift: 0.4 })
  for (let i = 0; i < 3; i++) {
    const x = -90 + i * 86 + r() * 20, y = -h * (0.64 + r() * 0.2)
    sheet(c, rect(x - 3, y - 26, 6, 26), '#6b4a36', { lift: 0.2, edge: false })
    sheet(c, blob(x, y - 34, 26, 16, 5, seed + i, 0.25), '#3d6b58', { lift: 0.5, edgeScale: 0.6 })
  }
}

export function crane(c, { fly = false, frame = 0 } = {}) {
  const white = '#fdf8ec'
  if (fly) {
    const w = frame ? -34 : 30
    sheet(c, [P(-10, -50), P(-90, -50 - w), P(-76, -40 - w * 0.4), P(-20, -40)], white, { lift: 0.5 })
    sheet(c, [P(10, -50), P(90, -50 - w), P(76, -40 - w * 0.4), P(20, -40)], white, { lift: 0.5 })
    sheet(c, [P(-90, -50 - w), P(-76, -40 - w * 0.4), P(-60, -44 - w * 0.6)], '#2b2630', { lift: 0.2, edgeScale: 0.5 })
    sheet(c, [P(90, -50 - w), P(76, -40 - w * 0.4), P(60, -44 - w * 0.6)], '#2b2630', { lift: 0.2, edgeScale: 0.5 })
    sheet(c, [P(-40, -44), P(0, -56), P(64, -50), P(0, -38)], white, { lift: 0.6 })
    sheet(c, ellipse(60, -52, 7, 6, 8), '#c2412d', { lift: 0.2, edgeScale: 0.5 })
    return
  }
  sheet(c, rect(-8, -90, 4, 90), '#2b2630', { lift: 0.2, edge: false })
  sheet(c, rect(6, -90, 4, 90), '#2b2630', { lift: 0.2, edge: false })
  sheet(c, [P(-64, -100), P(-30, -128), P(-22, -96)], '#2b2630', { lift: 0.5 })
  sheet(c, ellipse(0, -118, 46, 28, 16, -0.25), white, { lift: 0.8 })
  sheet(c, [P(26, -128), P(40, -200), P(54, -200), P(42, -116)], white, { lift: 0.7 })
  sheet(c, ellipse(48, -208, 13, 11, 12), white, { lift: 0.6 })
  sheet(c, ellipse(46, -216, 8, 5, 8), '#c2412d', { lift: 0.2, edgeScale: 0.5 })
  sheet(c, [P(58, -212), P(98, -204), P(58, -200)], '#55504a', { lift: 0.3, edgeScale: 0.6 })
}

export function immortal(c, { frame = 0, robe = '#eef2f5', sash = '#4a7fa8', skin = '#e2bd94', sword = true } = {}) {
  const sway = frame ? 10 : -6
  if (sword) {
    sheet(c, strip(P(-34, -246), P(30, -120), 7), '#b9c4cc', { lift: 0.4 })
    sheet(c, strip(P(-40, -258), P(-30, -238), 12), GOLD, { lift: 0.3, edgeScale: 0.6 })
  }
  fold(c, [P(-46 + sway, 0), P(52 + sway, 0), P(28, -200), P(-28, -200)], robe, { apex: P(0, -90), depth: 0.14, lift: 1 })
  sheet(c, [P(-46 + sway, 0), P(-30 + sway, -16), P(40 + sway, -16), P(52 + sway, 0)], shade(sash, 0.1), { lift: 0.3, edgeScale: 0.7 })
  sheet(c, rect(-28, -128, 56, 14), sash, { lift: 0.5, edgeScale: 0.7 })
  sheet(c, [P(-6, -116), P(8, -116), P(14, -50), P(-10, -54)], sash, { lift: 0.4, edgeScale: 0.7 })
  for (const s of [-1, 1]) sheet(c, [P(s * 26, -196), P(s * 34, -196), P(s * (70 - s * sway * 0.6), -110), P(s * (52 - s * sway * 0.6), -86), P(s * 22, -150)], shade(robe, -0.06), { lift: 0.8 })
  sheet(c, [P(-22, -200), P(0, -168), P(22, -200), P(12, -204), P(0, -186), P(-12, -204)], sash, { lift: 0.3, edgeScale: 0.6 })
  sheet(c, ellipse(0, -226, 23, 25, 20), skin, { lift: 0.9 })
  sheet(c, ellipse(8, -228, 3, 3.6, 8), '#2b1d12', { lift: 0, edge: false })
  sheet(c, ellipse(-7, -228, 3, 3.6, 8), '#2b1d12', { lift: 0, edge: false })
  sheet(c, [P(-24, -230), P(-22, -252), P(0, -258), P(22, -252), P(24, -230), P(12, -244), P(-12, -244)], '#2b2630', { lift: 0.5 })
  sheet(c, ellipse(0, -264, 10, 11, 12), '#2b2630', { lift: 0.5 })
  sheet(c, rect(-16, -268, 32, 4), GOLD, { lift: 0.2, edge: false })
  sheet(c, [P(-22, -236), P(-30, -150), P(-20, -160)], '#2b2630', { lift: 0.3, edgeScale: 0.6 })
}

export function swordRider(c, { robe = '#eef2f5', sash = '#4a7fa8' } = {}) {
  sheet(c, [P(-150, -22), P(120, -30), P(150, -24), P(120, -16)], '#cfe6ee', { lift: 0.6 })
  sheet(c, rect(-164, -30, 18, 14), GOLD, { lift: 0.3, edgeScale: 0.6 })
  fold(c, [P(-34, -28), P(20, -28), P(8, -130), P(-16, -130)], robe, { apex: P(-6, -70), depth: 0.14, lift: 0.9 })
  sheet(c, [P(-34, -28), P(-110, -60), P(-90, -36), P(-20, -60)], shade(robe, -0.06), { lift: 0.6 })
  sheet(c, rect(-16, -92, 26, 9), sash, { lift: 0.4, edgeScale: 0.6 })
  sheet(c, ellipse(-4, -146, 15, 16, 14), '#e2bd94', { lift: 0.7 })
  sheet(c, [P(-18, -150), P(-60, -150), P(-20, -162), P(8, -160)], '#2b2630', { lift: 0.4 })
}

export function stoneLantern(c, { glow = '#f4d04a', stone = '#b9b3a4' } = {}) {
  sheet(c, rect(-34, -16, 68, 16), stone, { lift: 0.7 })
  sheet(c, rect(-10, -92, 20, 76), stone, { lift: 0.7 })
  sheet(c, rect(-30, -104, 60, 14), shade(stone, 0.1), { lift: 0.6 })
  sheet(c, rect(-24, -154, 48, 50), stone, { lift: 0.8 })
  sheet(c, rect(-13, -146, 26, 34), glow, { lift: 0.2 })
  fold(c, [P(-46, -150), P(0, -196), P(46, -150)], shade(stone, -0.15), { apex: P(0, -164), depth: 0.3, lift: 0.9 })
  sheet(c, ellipse(0, -200, 8, 8, 10), shade(stone, -0.2), { lift: 0.4 })
}

export function incenseBurner(c) {
  const bronze = '#8a6a3c'
  for (const x of [-34, 0, 34]) sheet(c, rect(x - 6, -40, 12, 40), shade(bronze, -0.2), { lift: 0.5 })
  sheet(c, [P(-60, -110), P(60, -110), P(46, -36), P(-46, -36)], bronze, { lift: 1, print: (p, b) => { p.strokeStyle = GOLD; p.lineWidth = 4; p.strokeRect(b.x0 + 22, b.y0 + 16, b.w - 44, b.h - 34) } })
  sheet(c, rect(-70, -122, 140, 14), shade(bronze, 0.15), { lift: 0.6 })
  for (const x of [-18, 0, 18]) sheet(c, rect(x - 2, -176, 4, 56), '#b3352a', { lift: 0.2, edge: false })
  const smoke = [P(0, -180), P(-20, -220), P(14, -262), P(-12, -306), P(8, -340), P(22, -306), P(-2, -262), P(30, -220)]
  sheet(c, smoke, '#eef2f0', { lift: 0.3, edgeScale: 0.5 })
}

export function moonGate(c, { wall = IVORY, roof = JADE, glow = '#bfeee6' } = {}) {
  sheet(c, ellipse(0, -190, 132, 132, 44), glow, { lift: 0, edge: false, print: (p, b) => { p.strokeStyle = '#ffffff'; p.lineWidth = 6; for (let k = 1; k < 5; k++) { p.beginPath(); p.arc(b.cx, b.cy, k * 26, k, k + 4.2); p.stroke() } } })
  const body = [P(0, 0), P(-196, 0), P(-196, -190)]
  for (let i = 0; i <= 24; i++) { const a = Math.PI + (i / 24) * Math.PI; body.push(P(Math.cos(a) * 196, -190 + Math.sin(a) * 196)) }
  body.push(P(196, 0), P(0, 0))
  for (let i = 0; i <= 40; i++) { const a = Math.PI / 2 - (i / 40) * Math.PI * 2; body.push(P(Math.cos(a) * 134, -190 + Math.sin(a) * 134)) }
  sheet(c, body, wall, { lift: 1.2 })
  sheet(c, ring(0, -190, 150, 134), GOLD, { lift: 0.5, edgeScale: 0.7 })
  curvedRoof(c, -372, 190, 56, roof, 1.3)
  sheet(c, rect(-210, -28, 420, 28), '#d6cdb8', { lift: 0.8 })
}

export function deadTree(c, { seed = 1, leaves = BLOOD, bark = '#1f1a22' } = {}) {
  const r = rng(seed)
  const grow = (a, angle, len, width, depth) => {
    const b = P(a.x + Math.cos(angle) * len, a.y + Math.sin(angle) * len)
    sheet(c, strip(a, b, width), depth % 2 ? bark : shade(bark, 0.12), { lift: 0.7, edgeScale: 0.8 })
    if (depth > 3) {
      if (leaves) for (let k = 0; k < 4; k++) sheet(c, leafShape(b, angle + (k - 1.5) * 0.7, 30 + r() * 16, 8, seed + k, 0, 0.3), shade(leaves, (r() - 0.5) * 0.3), { lift: 0.4, edgeScale: 0.6 })
      return
    }
    grow(b, angle - 0.35 - r() * 0.4, len * 0.74, width * 0.68, depth + 1)
    grow(b, angle + 0.3 + r() * 0.45, len * 0.7, width * 0.64, depth + 1)
  }
  grow(P(0, 0), -Math.PI / 2 + (r() - 0.5) * 0.3, 130, 30, 0)
}

export function skullPile(c, { seed = 1 } = {}) {
  const r = rng(seed)
  for (let i = 0; i < 4; i++) sheet(c, strip(P(-80 + r() * 160, -8 - r() * 20), P(-80 + r() * 160, -8 - r() * 20), 9), shade(BONE, -0.1), { lift: 0.4, edgeScale: 0.6 })
  const spots = [[-52, -24], [48, -24], [-2, -26], [-26, -64], [24, -62], [0, -100]]
  for (const [x, y] of spots) {
    sheet(c, [P(x - 24, y - 6), P(x - 20, y - 28), P(x, y - 38), P(x + 20, y - 28), P(x + 24, y - 6), P(x + 12, y + 12), P(x - 12, y + 12)], BONE, { lift: 0.7 })
    sheet(c, ellipse(x - 9, y - 12, 6, 7, 8), '#1f1a22', { lift: 0, edge: false })
    sheet(c, ellipse(x + 9, y - 12, 6, 7, 8), '#1f1a22', { lift: 0, edge: false })
    sheet(c, rect(x - 8, y + 2, 16, 3), '#1f1a22', { lift: 0, edge: false })
  }
}

export function crystal(c, { color = '#8a4fd0', seed = 1 } = {}) {
  const r = rng(seed)
  for (let i = 0; i < 5; i++) {
    const x = -64 + i * 32 + (r() - 0.5) * 14, h = 90 + r() * 130, w = 20 + r() * 12, lean = (i - 2) * 16
    fold(c, [P(x - w, 0), P(x + w, 0), P(x + w * 0.8 + lean, -h * 0.72), P(x + lean, -h), P(x - w * 0.8 + lean, -h * 0.72)], shade(color, (r() - 0.5) * 0.3), { apex: P(x + lean * 0.5, -h * 0.5), depth: 0.4, lift: 0.8, seed: seed + i })
  }
}

export function demon(c, { frame = 0, robe = '#3a2a3e', trim = BLOOD, skin = '#8f6a78', spear = false } = {}) {
  const sway = frame ? 9 : -5
  if (spear) {
    sheet(c, rect(46, -300, 7, 300), '#1f1a22', { lift: 0.4 })
    fold(c, [P(38, -296), P(49, -352), P(61, -296)], '#b9c4cc', { lift: 0.4, depth: 0.25 })
    sheet(c, [P(40, -290), P(20, -262), P(42, -270)], trim, { lift: 0.3, edgeScale: 0.6 })
  }
  fold(c, [P(-44 + sway, 0), P(50 + sway, 0), P(32, -196), P(-32, -196)], robe, { apex: P(0, -90), depth: 0.16, lift: 1 })
  sheet(c, [P(-44 + sway, 0), P(-36 + sway, -14), P(42 + sway, -14), P(50 + sway, 0)], trim, { lift: 0.3, edgeScale: 0.7 })
  sheet(c, rect(-30, -126, 60, 12), trim, { lift: 0.5, edgeScale: 0.7 })
  for (const s of [-1, 1]) sheet(c, [P(s * 30, -192), P(s * 44, -188), P(s * 58, -100), P(s * 40, -92), P(s * 24, -140)], shade(robe, 0.1), { lift: 0.8 })
  sheet(c, [P(-38, -190), P(0, -206), P(38, -190), P(30, -176), P(0, -186), P(-30, -176)], shade(robe, -0.2), { lift: 0.6 })
  sheet(c, ellipse(0, -226, 24, 26, 20), skin, { lift: 0.9 })
  sheet(c, [P(-20, -240), P(-40, -284), P(-10, -250)], BONE, { lift: 0.5 })
  sheet(c, [P(20, -240), P(40, -284), P(10, -250)], BONE, { lift: 0.5 })
  sheet(c, [P(-14, -232), P(-4, -228), P(-12, -222)], '#ffd24a', { lift: 0, edge: false })
  sheet(c, [P(14, -232), P(4, -228), P(12, -222)], '#ffd24a', { lift: 0, edge: false })
  sheet(c, rect(-8, -212, 16, 3), '#1f1a22', { lift: 0, edge: false })
}

export function hornGate(c, { stone = '#3a3040', glow = '#ff5a3c' } = {}) {
  sheet(c, [P(-110, -8), P(110, -8), P(96, -330), P(-96, -330)], glow, { lift: 0, edge: false, print: (p, b) => { p.strokeStyle = '#ffd24a'; p.lineWidth = 6; for (let k = 0; k < 5; k++) { p.beginPath(); p.arc(b.cx, b.cy + 20, 30 + k * 28, k * 1.3, k * 1.3 + 3.6); p.stroke() } } })
  for (const s of [-1, 1]) {
    fold(c, [P(s * 110, 0), P(s * 176, 0), P(s * 160, -360), P(s * 112, -360)], stone, { apex: P(s * 140, -180), depth: 0.2, lift: 1.2, print: (p, b) => planks(p, b, shade(stone, -0.3), 46, false, 3) })
    sheet(c, [P(s * 150, -356), P(s * 250, -420), P(s * 232, -470), P(s * 200, -410), P(s * 120, -384)], BONE, { lift: 0.9 })
  }
  fold(c, [P(-190, -350), P(190, -350), P(170, -404), P(0, -440), P(-170, -404)], stone, { apex: P(0, -380), depth: 0.25, lift: 1.3 })
  sheet(c, ellipse(0, -396, 22, 22, 14), glow, { lift: 0.4 })
  sheet(c, rect(-200, -24, 400, 24), shade(stone, -0.2), { lift: 0.8 })
}

export function tombstone(c, { seed = 1, stone = '#6a6470' } = {}) {
  const tilt = (seed % 3 - 1) * 10, pts = [P(-34 + tilt * 0.2, 0), P(34 + tilt * 0.2, 0), P(32 + tilt, -84)]
  for (let k = 0; k <= 8; k++) { const a = (k / 8) * Math.PI; pts.push(P(tilt + Math.cos(a) * 32, -84 - Math.sin(a) * 30)) }
  sheet(c, pts, stone, { lift: 0.9, print: (p, b) => { p.strokeStyle = shade(stone, -0.35); p.lineWidth = 4; p.beginPath(); p.moveTo(b.cx, b.y0 + 30); p.lineTo(b.cx, b.y0 + 76); p.moveTo(b.cx - 16, b.y0 + 46); p.lineTo(b.cx + 16, b.y0 + 46); p.stroke() } })
  sheet(c, blob(-10, -6, 46, 12, 4, seed, 0.2), '#2f3a2c', { lift: 0.3, edgeScale: 0.6 })
}

export function cauldron(c, { brew = '#7dff8a' } = {}) {
  for (let k = 0; k < 5; k++) sheet(c, [P(-50 + k * 22, 0), P(-38 + k * 22, -34 - (k % 2) * 14), P(-28 + k * 22, 0)], k % 2 ? '#ff9a3c' : '#ffd24a', { lift: 0.2, edgeScale: 0.5 })
  const pot = '#1f1a22'
  sheet(c, [P(-70, -96), P(-84, -60), P(-66, -18), P(66, -18), P(84, -60), P(70, -96)], pot, { lift: 1 })
  sheet(c, ellipse(0, -98, 76, 16, 24), shade(pot, 0.25), { lift: 0.5 })
  sheet(c, ellipse(0, -100, 62, 11, 24), brew, { lift: 0, edge: false })
  for (const [x, y, s] of [[-24, -130, 10], [16, -150, 14], [-4, -184, 8]]) sheet(c, ellipse(x, y, s, s, 12), brew, { lift: 0.2, edgeScale: 0.5 })
}

export function wisp(c, { color = '#9df2ff' } = {}) {
  sheet(c, [P(0, -8), P(-26, -40), P(-18, -74), P(-4, -60), P(0, -110), P(10, -64), P(22, -76), P(26, -40)], color, { lift: 0, edge: false })
  sheet(c, ellipse(0, -44, 12, 16, 12), '#ffffff', { lift: 0, edge: false })
}

export function warBanner(c, { color = BLOOD } = {}) {
  sheet(c, rect(-5, -330, 10, 330), '#1f1a22', { lift: 0.6 })
  sheet(c, [P(5, -324), P(110, -318), P(104, -250), P(116, -180), P(90, -150), P(70, -176), P(48, -140), P(26, -170), P(5, -146)], color, { lift: 0.9, print: (p, b) => { p.fillStyle = '#1f1a22'; p.beginPath(); p.arc(b.x0 + 54, b.y0 + 70, 26, 0, 7); p.fill(); p.fillStyle = color; p.beginPath(); p.arc(b.x0 + 64, b.y0 + 62, 22, 0, 7); p.fill() } })
  fold(c, [P(-9, -330), P(0, -360), P(9, -330)], BONE, { lift: 0.3, depth: 0.2 })
}

export function boneFence(c) {
  for (let i = 0; i < 7; i++) {
    const x = -132 + i * 44, h = 70 + (i % 3) * 22
    fold(c, [P(x - 9, 0), P(x + 9, 0), P(x + 3, -h), P(x, -h - 22), P(x - 3, -h)], BONE, { lift: 0.6, depth: 0.2, seed: i })
  }
  sheet(c, rect(-146, -44, 292, 9), shade(BONE, -0.18), { lift: 0.4, edgeScale: 0.6 })
}

export function rockSpire(c, { seed = 1, color = NIGHT, h = 300 } = {}) {
  const r = rng(seed), pts = [P(-90, 0), P(-60, -h * 0.5), P(-76, -h * 0.62), P(-20, -h), P(10, -h * 0.8), P(40, -h * 0.9), P(84, -h * 0.4), P(100, 0)]
  fold(c, pts, color, { apex: P(-6, -h * 0.4), depth: 0.34, lift: 1.3, seed })
  for (let i = 0; i < 3; i++) sheet(c, strip(P(-40 + i * 36, -10 - r() * 30), P(-30 + i * 30 + r() * 10, -h * (0.3 + r() * 0.3)), 5), '#ff6a3c', { lift: 0, edge: false })
}

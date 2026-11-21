import { P, rng, shade } from './core.js'
import { sheet, fold, rect, ellipse, blob, leafShape, strip } from './paper.js'
import { palette as C, planks, gableRoof, shingles, chofa } from './props.js'

const STRAW = '#d9b65a'
const STONE = '#b9b3a4'

export function sala(c, { roof = '#7d5a3c' } = {}) {
  for (const x of [-150, -50, 50, 150]) sheet(c, rect(x - 7, -34, 14, 34), C.woodDark, { lift: 0.5 })
  sheet(c, rect(-180, -52, 360, 22), C.wood, { lift: 1, print: (p, b) => planks(p, b, shade(C.wood, -0.2), 30) })
  sheet(c, rect(-150, -92, 300, 12), C.wood, { lift: 0.6, edgeScale: 0.7 })
  for (let i = 0; i <= 10; i++) sheet(c, rect(-150 + i * 29.2, -92, 8, 40), C.trim, { lift: 0.4, edgeScale: 0.6 })
  for (const x of [-160, 160]) sheet(c, rect(x - 9, -230, 18, 180), C.woodDark, { lift: 0.8 })
  const top = -226
  sheet(c, [P(-214, top + 34), P(214, top + 34), P(180, top - 6), P(-180, top - 6)], shade(roof, -0.1), { lift: 1.1, print: (p, b) => shingles(p, b, shade(roof, -0.3), 16, 26) })
  gableRoof(c, P(-190, top), P(190, top), P(0, top - 150), roof, C.gable, C.trim, top - 4, 0)
}

export function spiritHouse(c) {
  sheet(c, rect(-30, -14, 60, 14), '#e8dcc0', { lift: 0.5 })
  sheet(c, rect(-9, -150, 18, 136), '#f3ead6', { lift: 0.8 })
  sheet(c, rect(-62, -164, 124, 16), '#f3ead6', { lift: 1 })
  sheet(c, rect(-40, -226, 80, 62), C.templeRoof, { lift: 0.9, print: (p, b) => { p.strokeStyle = C.gold; p.lineWidth = 4; p.strokeRect(b.x0 + 6, b.y0 + 6, b.w - 12, b.h - 6) } })
  sheet(c, rect(-12, -204, 24, 40), '#3a2414', { lift: 0.3 })
  fold(c, [P(-62, -222), P(0, -300), P(62, -222)], C.templeRoof, { apex: P(0, -250), depth: 0.3, lift: 1.1, print: (p, b) => shingles(p, b, shade(C.templeRoof, -0.25), 14, 18) })
  sheet(c, strip(P(-62, -222), P(0, -300), 8), C.gold, { lift: 0.5, edgeScale: 0.7 })
  sheet(c, strip(P(0, -300), P(62, -222), 8), C.gold, { lift: 0.5, edgeScale: 0.7 })
  chofa(c, P(0, -296), 1, C.gold, 0.6)
  for (let i = 0; i < 9; i++) sheet(c, ellipse(-52 + i * 13, -160 + Math.sin(i / 8 * Math.PI) * 16, 6, 6, 8), i % 2 ? '#f0a23a' : '#f4d04a', { lift: 0.3, edgeScale: 0.5 })
}

export function chedi(c) {
  const white = '#f6efe0'
  sheet(c, rect(-150, -40, 300, 40), '#e8dcc0', { lift: 1 })
  sheet(c, rect(-120, -80, 240, 40), white, { lift: 1 })
  sheet(c, rect(-96, -116, 192, 36), white, { lift: 0.9 })
  for (const x of [-150, 150]) {
    sheet(c, rect(x - 14, -84, 28, 44), white, { lift: 0.8 })
    fold(c, [P(x - 16, -84), P(x, -130), P(x + 16, -84)], C.gold, { lift: 0.6, depth: 0.25 })
  }
  const bell = []
  for (let i = 0; i <= 20; i++) { const u = i / 20, a = u * Math.PI; bell.push(P(-Math.cos(a) * 88 * (0.55 + 0.45 * Math.sin(a) ** 0.5), -116 - Math.sin(a) * 170)) }
  sheet(c, [P(-92, -116), ...bell, P(92, -116)], white, { lift: 1.2 })
  sheet(c, rect(-96, -150, 192, 12), C.gold, { lift: 0.5, edgeScale: 0.7 })
  sheet(c, rect(-28, -318, 56, 34), white, { lift: 0.8 })
  const rings = 9
  for (let i = 0; i < rings; i++) {
    const w = 46 - i * 4.4, y = -318 - i * 20
    sheet(c, [P(-w, y), P(w, y), P(w - 5, y - 20), P(-w + 5, y - 20)], C.gold, { lift: 0.5, edgeScale: 0.7 })
  }
  fold(c, [P(-8, -498), P(0, -590), P(8, -498)], C.gold, { lift: 0.5, depth: 0.2 })
  sheet(c, ellipse(0, -506, 11, 11, 12), C.gold, { lift: 0.4 })
}

export function haystack(c, { seed = 1 } = {}) {
  sheet(c, rect(-5, -250, 10, 250), C.woodDark, { lift: 0.5 })
  const pts = []
  for (let i = 0; i <= 24; i++) { const a = Math.PI + (i / 24) * Math.PI; pts.push(P(Math.cos(a) * 118, Math.sin(a) * 190)) }
  sheet(c, pts, STRAW, {
    lift: 1.2,
    print: (p, b) => {
      const r = rng(seed)
      p.lineWidth = 3
      for (let i = 0; i < 70; i++) {
        p.strokeStyle = r() > 0.5 ? shade(STRAW, -0.2) : shade(STRAW, 0.25)
        const x = b.x0 + r() * b.w, y = b.y0 + r() * b.h
        p.beginPath()
        p.moveTo(x, y)
        p.lineTo(x + (r() - 0.5) * 16, y + 22 + r() * 16)
        p.stroke()
      }
    },
  })
  sheet(c, [P(-60, -176), P(0, -214), P(60, -176), P(40, -160), P(-40, -160)], shade(STRAW, -0.12), { lift: 0.7 })
}

export function fence(c, { posts = 5 } = {}) {
  const w = 300, gap = w / (posts - 1)
  for (let i = 0; i < posts - 1; i++) {
    const x = -w / 2 + i * gap
    sheet(c, strip(P(x, -18), P(x + gap, -78), 7), '#c9a45c', { lift: 0.4, edgeScale: 0.6 })
    sheet(c, strip(P(x, -78), P(x + gap, -18), 7), '#b8934e', { lift: 0.5, edgeScale: 0.6 })
  }
  for (let i = 0; i < posts; i++) sheet(c, rect(-w / 2 + i * gap - 6, -96, 12, 96), '#a67f45', { lift: 0.8, edgeScale: 0.8 })
}

export function flagLine(c, { colors = ['#c2412d', '#f0a23a', '#3f6b9a', '#f6ead2', '#5d8a48'] } = {}) {
  for (const x of [-240, 240]) sheet(c, rect(x - 6, -250, 12, 250), C.woodDark, { lift: 0.7 })
  const sag = u => -236 + Math.sin(u * Math.PI) * 46
  const line = []
  for (let i = 0; i <= 20; i++) line.push(P(-240 + i * 24, sag(i / 20)))
  for (let i = 20; i >= 0; i--) line.push(P(-240 + i * 24, sag(i / 20) + 4))
  sheet(c, line, '#6e4529', { lift: 0.3, edge: false })
  for (let i = 0; i < 11; i++) {
    const u = (i + 0.5) / 11, x = -240 + u * 480, y = sag(u) + 3
    sheet(c, [P(x - 17, y), P(x + 17, y), P(x, y + 40)], colors[i % colors.length], { lift: 0.7, edgeScale: 0.7 })
  }
}

export function lampPost(c, { color = '#c2412d' } = {}) {
  sheet(c, rect(-7, -250, 14, 250), C.woodDark, { lift: 0.7 })
  sheet(c, rect(-7, -250, 60, 10), C.woodDark, { lift: 0.6 })
  sheet(c, rect(42, -240, 3, 22), '#3a2414', { lift: 0, edge: false })
  sheet(c, ellipse(44, -190, 24, 30, 18), color, { lift: 0.9, print: (p, b) => { p.strokeStyle = shade(color, 0.3); p.lineWidth = 3; for (let x = b.x0 + 8; x < b.x1; x += 10) { p.beginPath(); p.moveTo(x, b.y0); p.lineTo(x, b.y1); p.stroke() } } })
  sheet(c, rect(32, -224, 24, 8), C.gold, { lift: 0.4, edgeScale: 0.6 })
  sheet(c, rect(32, -164, 24, 8), C.gold, { lift: 0.4, edgeScale: 0.6 })
  sheet(c, [P(40, -156), P(48, -156), P(46, -124), P(42, -124)], '#f0a23a', { lift: 0.3, edgeScale: 0.6 })
}

export function well(c) {
  for (const x of [-64, 64]) sheet(c, rect(x - 7, -210, 14, 210), C.woodDark, { lift: 0.6 })
  sheet(c, rect(-70, -160, 140, 8), C.wood, { lift: 0.5, edgeScale: 0.7 })
  sheet(c, rect(-2, -156, 4, 60), '#3a2414', { lift: 0, edge: false })
  sheet(c, [P(-16, -96), P(16, -96), P(12, -68), P(-12, -68)], C.wood, { lift: 0.6 })
  fold(c, [P(-104, -206), P(0, -268), P(104, -206)], '#7d5a3c', { apex: P(0, -226), depth: 0.3, lift: 1.1, print: (p, b) => shingles(p, b, '#5c412a', 14, 22) })
  sheet(c, rect(-74, -66, 148, 66), STONE, {
    lift: 1,
    print: (p, b) => {
      p.strokeStyle = shade(STONE, -0.25)
      p.lineWidth = 3
      for (let row = 0; row < 3; row++) {
        const y = b.y0 + row * 22
        p.beginPath(); p.moveTo(b.x0, y); p.lineTo(b.x1, y); p.stroke()
        for (let x = b.x0 + (row % 2) * 18; x < b.x1; x += 36) { p.beginPath(); p.moveTo(x, y); p.lineTo(x, y + 22); p.stroke() }
      }
    },
  })
  sheet(c, rect(-82, -76, 164, 12), shade(STONE, 0.15), { lift: 0.6 })
}

export function cart(c) {
  sheet(c, strip(P(60, -96), P(190, -70), 10), C.woodDark, { lift: 0.6 })
  sheet(c, [P(-150, -100), P(90, -100), P(110, -150), P(-170, -150)], C.wood, { lift: 1, print: (p, b) => planks(p, b, shade(C.wood, -0.22), 14, false) })
  sheet(c, blob(-30, -176, 120, 44, 5, 3, 0.2), STRAW, { lift: 0.8 })
  for (const x of [-70]) {
    sheet(c, ellipse(x, -72, 72, 72, 30), C.woodDark, { lift: 1.2 })
    sheet(c, ellipse(x, -72, 56, 56, 30), shade(C.wood, 0.1), { lift: 0.3 })
    for (let i = 0; i < 6; i++) { const a = i * Math.PI / 6; sheet(c, strip(P(x + Math.cos(a) * 56, -72 + Math.sin(a) * 56), P(x - Math.cos(a) * 56, -72 - Math.sin(a) * 56), 7), C.woodDark, { lift: 0.2, edgeScale: 0.6 }) }
    sheet(c, ellipse(x, -72, 12, 12, 12), C.gold, { lift: 0.4 })
  }
}

export function clothesline(c, { cloths = ['#c2412d', '#f6ead2', '#3f6b9a', '#f0a23a'] } = {}) {
  for (const x of [-160, 160]) sheet(c, rect(x - 6, -200, 12, 200), '#a67f45', { lift: 0.7 })
  sheet(c, rect(-160, -190, 320, 4), '#6e4529', { lift: 0.2, edge: false })
  cloths.forEach((col, i) => {
    const x = -128 + i * 70, h = 84 + (i % 2) * 26
    sheet(c, [P(x, -188), P(x + 54, -188), P(x + 50, -188 + h), P(x + 4, -188 + h + 6)], col, {
      lift: 0.8,
      print: (p, b) => {
        if (i % 2) return
        p.strokeStyle = shade(col, 0.35)
        p.lineWidth = 3
        for (let y = b.y0 + 10; y < b.y1; y += 16) { p.beginPath(); p.moveTo(b.x0, y); p.lineTo(b.x1, y); p.stroke() }
        for (let px = b.x0 + 10; px < b.x1; px += 16) { p.beginPath(); p.moveTo(px, b.y0); p.lineTo(px, b.y1); p.stroke() }
      },
    })
  })
}

export function parasol(c, { color = '#d18a2c', goods = ['#7aa25a', '#e8a33d', '#d9533a'] } = {}) {
  sheet(c, rect(-150, -14, 300, 14), '#c9a45c', { lift: 0.5, print: (p, b) => planks(p, b, '#a8843f', 14) })
  const r = rng(4)
  goods.forEach((col, g) => {
    sheet(c, [P(-126 + g * 90, -14), P(-54 + g * 90, -14), P(-46 + g * 90, -44), P(-134 + g * 90, -44)], '#b8934e', { lift: 0.6, print: (p, b) => planks(p, b, '#8f6f38', 8) })
    for (let i = 0; i < 7; i++) sheet(c, ellipse(-120 + g * 90 + (i % 4) * 20, -50 - Math.floor(i / 4) * 14 - r() * 3, 12, 11, 12), shade(col, (r() - 0.5) * 0.2), { lift: 0.4, edgeScale: 0.6 })
  })
  sheet(c, rect(-5, -250, 10, 250), C.woodDark, { lift: 0.5 })
  const ribs = 8, top = P(0, -300)
  for (let i = 0; i < ribs; i++) {
    const x0 = -190 + i * 380 / ribs, x1 = x0 + 380 / ribs
    fold(c, [P(x0, -236), P(x1, -236), top], i % 2 ? color : '#f6ead2', { apex: P((x0 + x1) / 2, -256), depth: 0.18, lift: i ? 0 : 1.2, edgeScale: 0.7 })
  }
  sheet(c, ellipse(0, -302, 8, 8, 10), C.gold, { lift: 0.3 })
}

export function mangoTree(c, { seed = 1, fruits = true, ribbons = false, s = 1 } = {}) {
  const trunk = '#7d5a3c'
  sheet(c, [P(-26 * s, 0), P(-14 * s, -170 * s), P(-60 * s, -250 * s), P(-44 * s, -262 * s), P(0, -210 * s), P(50 * s, -270 * s), P(64 * s, -256 * s), P(18 * s, -170 * s), P(28 * s, 0)], trunk, { lift: 1 })
  if (ribbons) ['#c2412d', '#f4d04a', '#3f6b9a'].forEach((col, i) => sheet(c, rect(-22 * s, (-70 - i * 16) * s, 44 * s, 13 * s), col, { lift: 0.4, edgeScale: 0.6 }))
  const r = rng(seed)
  const lumps = [[-110, -300, 120, 90], [110, -310, 120, 90], [0, -380, 150, 100], [-50, -290, 130, 80], [60, -280, 120, 76]]
  lumps.forEach(([x, y, rx, ry], i) => sheet(c, blob(x * s, y * s, rx * s, ry * s, 7, seed + i * 3, 0.2), [C.leafDark, C.leaf, C.leafLight, C.leaf, C.leafDark][i], { lift: 1 + i * 0.1 }))
  for (let i = 0; i < 22; i++) {
    const x = (r() - 0.5) * 380 * s, y = (-250 - r() * 190) * s
    sheet(c, leafShape(P(x, y), -1.2 - r() * 0.8, 34 * s, 9 * s, i, 0, 0.3), shade(C.leafLight, 0.12), { lift: 0.3, edgeScale: 0.5 })
  }
  if (fruits) for (let i = 0; i < 9; i++) sheet(c, ellipse((r() - 0.5) * 320 * s, (-250 - r() * 120) * s, 11 * s, 15 * s, 12, 0.3), i % 3 ? '#f0a23a' : '#9ab84a', { lift: 0.5, edgeScale: 0.6 })
}

export function frangipani(c, { seed = 1 } = {}) {
  const bark = '#b7a48c'
  const tips = [P(-110, -230), P(-30, -290), P(60, -270), P(130, -210)]
  sheet(c, [P(-16, 0), P(-10, -120), P(10, -120), P(16, 0)], bark, { lift: 1 })
  for (const t of tips) sheet(c, strip(P(0, -112), t, 16), bark, { lift: 0.9 })
  tips.forEach((t, i) => {
    for (let k = 0; k < 7; k++) sheet(c, leafShape(t, -Math.PI + k * (Math.PI / 6), 70, 15, seed + i + k, 0, 0), k % 2 ? C.leaf : C.leafDark, { lift: 0.6, edgeScale: 0.6 })
    for (let k = 0; k < 3; k++) {
      const fx = t.x - 22 + k * 22, fy = t.y - 26 - (k % 2) * 14
      for (let pz = 0; pz < 5; pz++) sheet(c, ellipse(fx + Math.cos(pz * 1.257) * 9, fy + Math.sin(pz * 1.257) * 9, 8, 6, 8, pz * 1.257), '#fdf8ec', { lift: 0.3, edgeScale: 0.5 })
      sheet(c, ellipse(fx, fy, 5, 5, 8), '#f4d04a', { lift: 0, edge: false })
    }
  })
}

export function bamboo(c, { seed = 1 } = {}) {
  const r = rng(seed), cane = '#a9b65a'
  for (let i = 0; i < 7; i++) {
    const x = -70 + i * 23 + (r() - 0.5) * 10, h = 330 + r() * 130, lean = (i - 3) * 16 + (r() - 0.5) * 20, top = P(x + lean, -h)
    sheet(c, strip(P(x, 0), top, 12), i % 2 ? cane : shade(cane, -0.12), { lift: 0.8, print: (p, b) => { p.strokeStyle = shade(cane, -0.35); p.lineWidth = 3; for (let y = b.y0; y < b.y1; y += 44) { p.beginPath(); p.moveTo(b.x0, y); p.lineTo(b.x1, y); p.stroke() } } })
    for (let k = 0; k < 5; k++) {
      const u = 0.45 + k * 0.13, bp = P(x + lean * u, -h * u), dir = k % 2 ? -0.5 : -2.6
      sheet(c, leafShape(bp, dir + (r() - 0.5) * 0.5, 62, 9, seed + i + k, 0, 0.25), k % 3 ? C.leaf : C.leafLight, { lift: 0.5, edgeScale: 0.5 })
    }
  }
}

export function flowerBed(c, { seed = 1, colors = ['#f0a23a', '#f4d04a', '#e97e5e'] } = {}) {
  const r = rng(seed)
  for (let i = 0; i < 9; i++) {
    const x = -112 + i * 28 + (r() - 0.5) * 8, h = 44 + r() * 34
    sheet(c, strip(P(x, 0), P(x + 3, -h), 5), C.leafDark, { lift: 0.3, edgeScale: 0.5 })
    sheet(c, leafShape(P(x, -h * 0.4), -0.5, 24, 6, i, 0, 0), C.leaf, { lift: 0.3, edgeScale: 0.5 })
    sheet(c, leafShape(P(x, -h * 0.5), -2.6, 24, 6, i + 2, 0, 0), C.leaf, { lift: 0.3, edgeScale: 0.5 })
    const col = colors[i % colors.length]
    sheet(c, blob(x + 3, -h - 6, 15, 14, 7, seed + i, 0.25), col, { lift: 0.6, edgeScale: 0.6 })
    sheet(c, ellipse(x + 3, -h - 6, 6, 6, 8), shade(col, -0.2), { lift: 0, edge: false })
  }
}

export function riceRow(c, { seed = 1, ripe = false } = {}) {
  const r = rng(seed), green = ripe ? '#c9b24a' : '#8fb552'
  for (let i = 0; i < 12; i++) {
    const x = -150 + i * 27 + (r() - 0.5) * 8
    for (let k = 0; k < 5; k++) sheet(c, leafShape(P(x, 0), -Math.PI / 2 + (k - 2) * 0.24 + (r() - 0.5) * 0.1, 50 + r() * 24, 5, i + k, 0, (k - 2) * 0.16), k % 2 ? green : shade(green, -0.14), { lift: 0.4, edgeScale: 0.5 })
  }
}

export function reeds(c, { seed = 1 } = {}) {
  const r = rng(seed)
  for (let i = 0; i < 9; i++) {
    const a = -Math.PI / 2 + (i - 4) * 0.13 + (r() - 0.5) * 0.1, len = 110 + r() * 70
    sheet(c, leafShape(P((i - 4) * 9, 0), a, len, 8, seed + i, 0, (i - 4) * 0.08), i % 2 ? C.leafDark : '#6f9450', { lift: 0.6, edgeScale: 0.6 })
  }
  for (const [x, h] of [[-10, 170], [16, 150]]) {
    sheet(c, rect(x - 2, -h, 4, h), '#6f9450', { lift: 0.2, edge: false })
    sheet(c, ellipse(x, -h - 14, 7, 20, 12), '#7a4a2c', { lift: 0.5, edgeScale: 0.6 })
  }
}

export function rocks(c, { seed = 1 } = {}) {
  sheet(c, blob(-34, -30, 60, 34, 5, seed, 0.14), shade(STONE, -0.1), { lift: 0.8 })
  sheet(c, blob(34, -22, 46, 26, 5, seed + 3, 0.14), STONE, { lift: 0.8 })
  sheet(c, blob(4, -14, 30, 16, 4, seed + 5, 0.12), shade(STONE, 0.12), { lift: 0.5 })
}

export function scarecrow(c) {
  sheet(c, rect(-5, -230, 10, 230), '#a67f45', { lift: 0.6 })
  sheet(c, rect(-96, -176, 192, 10), '#a67f45', { lift: 0.5 })
  sheet(c, [P(-92, -182), P(92, -182), P(86, -146), P(40, -150), P(44, -70), P(-44, -70), P(-40, -150), P(-86, -146)], '#c2412d', {
    lift: 0.9,
    print: (p, b) => { p.strokeStyle = '#f6ead2'; p.lineWidth = 4; for (let y = b.y0 + 12; y < b.y1; y += 22) { p.beginPath(); p.moveTo(b.x0, y); p.lineTo(b.x1, y); p.stroke() } },
  })
  for (const x of [-92, 92]) for (let k = 0; k < 4; k++) sheet(c, strip(P(x, -172), P(x + Math.sign(x) * (14 + k * 4), -150 + k * 10), 4), STRAW, { lift: 0.2, edge: false })
  sheet(c, ellipse(0, -208, 26, 26, 16), '#e8d9b0', { lift: 0.8 })
  sheet(c, ellipse(-9, -210, 4, 4, 8), '#3a2414', { lift: 0, edge: false })
  sheet(c, ellipse(9, -210, 4, 4, 8), '#3a2414', { lift: 0, edge: false })
  fold(c, [P(-62, -222), P(0, -262), P(62, -222), P(0, -212)], C.hat, { apex: P(0, -240), depth: 0.3, lift: 0.9 })
}

export function kite(c, { color = '#c2412d' } = {}) {
  const pts = [P(0, -190), P(22, -124), P(92, -116), P(34, -86), P(60, -10), P(0, -52), P(-60, -10), P(-34, -86), P(-92, -116), P(-22, -124)]
  fold(c, pts, color, { apex: P(0, -100), depth: 0.22, lift: 1 })
  sheet(c, ellipse(0, -100, 16, 16, 12), '#f4d04a', { lift: 0.4 })
}

export function pierPosts(c) {
  for (const x of [-60, 60]) {
    sheet(c, rect(x - 8, -90, 16, 90), C.woodDark, { lift: 0.7 })
    sheet(c, rect(x - 11, -98, 22, 10), C.wood, { lift: 0.4, edgeScale: 0.7 })
  }
  sheet(c, rect(-60, -62, 120, 7), '#c9a45c', { lift: 0.3, edgeScale: 0.6 })
}

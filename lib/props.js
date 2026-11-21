import { P, rng, shade } from './core.js'
import { sheet, fold, rect, ellipse, blob, leafShape, strip, scallopTop } from './paper.js'

export const palette = {
  wood: '#9a6a42',
  woodDark: '#6e4529',
  wallA: '#c58d57',
  wallB: '#b77f4c',
  roof: '#8c3b2a',
  roofB: '#6d4a35',
  gable: '#dcb985',
  trim: '#f1dfb6',
  leaf: '#5d8a48',
  leafDark: '#46723a',
  leafLight: '#7aa25a',
  trunk: '#9c7a52',
  lotus: '#e88aa0',
  lotusPad: '#638f4c',
  shirt: '#e0744c',
  shorts: '#2e4866',
  skin: '#d6a274',
  hat: '#e2c58a',
  cloud: '#fbf2df',
  templeWall: '#f3ead6',
  templeRoof: '#b33c27',
  templeRoofEdge: '#3f6b4a',
  gold: '#d9a441',
  goldDark: '#a8761f',
}

const C = palette
const at = (a, b, k) => P(a.x + (b.x - a.x) * k, a.y + (b.y - a.y) * k)

export function planks(c, b, color, gap = 22, vertical = true, width = 2) {
  c.strokeStyle = color
  c.lineWidth = width
  c.beginPath()
  if (vertical) for (let x = b.x0 + gap; x < b.x1; x += gap) { c.moveTo(x, b.y0); c.lineTo(x, b.y1) }
  else for (let y = b.y0 + gap; y < b.y1; y += gap) { c.moveTo(b.x0, y); c.lineTo(b.x1, y) }
  c.stroke()
}

function rays(c, origin, count, color, from = Math.PI, span = Math.PI) {
  c.strokeStyle = color
  c.lineWidth = 2
  for (let k = 0; k < count; k++) {
    const a = from + (k + 0.5) * (span / count)
    c.beginPath()
    c.moveTo(origin.x, origin.y)
    c.lineTo(origin.x + Math.cos(a) * 600, origin.y + Math.sin(a) * 600)
    c.stroke()
  }
}

export function chofa(c, tip, dir, color, size = 1) {
  const s = dir * size, k = size
  sheet(c, [tip, P(tip.x + 10 * s, tip.y - 18 * k), P(tip.x + 4 * s, tip.y - 44 * k), P(tip.x + 16 * s, tip.y - 52 * k), P(tip.x + 22 * s, tip.y - 36 * k), P(tip.x + 20 * s, tip.y - 14 * k), P(tip.x + 6 * s, tip.y + 6 * k)], color, { lift: 0.6, edgeScale: 0.8 })
}

export function shingles(c, b, color, row = 24, w = 30) {
  c.strokeStyle = color
  c.lineWidth = 2.5
  for (let y = b.y0 + row, i = 0; y < b.y1 + row; y += row, i++) {
    c.beginPath()
    for (let x = b.x0 - w + (i % 2) * w / 2; x < b.x1 + w; x += w) {
      c.moveTo(x, y - row * 0.5)
      c.quadraticCurveTo(x + w / 2, y + row * 0.35, x + w, y - row * 0.5)
    }
    c.stroke()
  }
}

export function gableRoof(c, L, R, A, roof, gable, trim, wallTop, x) {
  fold(c, [L, A, R], roof, { apex: P(x, A.y + (wallTop - A.y) * 0.7), depth: 0.32, lift: 1.2, print: (p, b) => shingles(p, b, shade(roof, -0.22)) })
  const gl = at(L, A, 0.16), gr = at(R, A, 0.16), ga = P(x, A.y + (wallTop - A.y) * 0.28)
  sheet(c, [P(gl.x + 14, wallTop + 4), ga, P(gr.x - 14, wallTop + 4)], gable, { lift: 0.5, print: p => rays(p, P(x, wallTop + 4), 11, shade(gable, -0.2)) })
  sheet(c, strip(L, A, 14), trim, { lift: 0.6, edgeScale: 0.8 })
  sheet(c, strip(A, R, 14), trim, { lift: 0.6, edgeScale: 0.8 })
  chofa(c, P(A.x, A.y + 4), 1, trim)
  sheet(c, [L, P(L.x - 22, L.y - 18), P(L.x - 16, L.y + 6)], trim, { lift: 0.5, edgeScale: 0.8 })
  sheet(c, [R, P(R.x + 22, R.y - 18), P(R.x + 16, R.y + 6)], trim, { lift: 0.5, edgeScale: 0.8 })
}

export function waterJar(c, { x = 0, s = 1, color = '#8a4a2e' } = {}) {
  const pts = [P(-20, 0), P(-36, -30), P(-34, -62), P(-18, -84), P(18, -84), P(34, -62), P(36, -30), P(20, 0)].map(p => P(x + p.x * s, p.y * s))
  sheet(c, pts, color, {
    lift: 0.8,
    print: (p, b) => {
      p.strokeStyle = '#e0b56a'
      p.lineWidth = 4 * s
      p.beginPath()
      for (let px = b.x0; px <= b.x1; px += 6) p.lineTo(px, b.y0 + b.h * 0.45 + Math.sin(px / (9 * s)) * 7 * s)
      p.stroke()
    },
  })
  sheet(c, rect(x - 22 * s, -92 * s, 44 * s, 10 * s), shade(color, -0.2), { lift: 0.5, edgeScale: 0.7 })
}

export function stiltHouse(c, { w = 200, wall = C.wallA, roof = C.roof, seed = 1, stilts = 118, part = 'all', ladder = 1, jars = true } = {}) {
  const floor = -stilts, wallTop = floor - 150, roofH = 200, r = rng(seed), show = name => part === 'all' || part === name
  const win = r() > 0.4 ? w * 0.27 : -w * 0.27, potted = r() > 0.3
  if (show('base')) {
    for (let i = 0; i < 4; i++) sheet(c, rect(-w / 2 + 8 + i * (w - 30) / 3, floor, 14, stilts), C.woodDark, { lift: 0.6 })
    sheet(c, strip(P(-w / 2 + 14, floor + 8), P(-w / 2 + 14 + (w - 30) / 3, -8), 8), shade(C.woodDark, 0.1), { lift: 0.4, edgeScale: 0.7 })
    sheet(c, strip(P(w / 2 - 14, floor + 8), P(w / 2 - 14 - (w - 30) / 3, -8), 8), shade(C.woodDark, 0.1), { lift: 0.4, edgeScale: 0.7 })
    if (jars) {
      waterJar(c, { x: -win * 0.9, s: 0.9 })
      waterJar(c, { x: -win * 0.9 + 52, s: 0.65, color: '#7a5236' })
    }
    sheet(c, rect(-w / 2 - 34, floor - 12, w + 68, 22), C.wood, { lift: 1, print: (p, b) => planks(p, b, shade(C.wood, -0.2), 30) })
  }
  if (show('body')) {
    sheet(c, rect(-w / 2, wallTop, w, 150), wall, { lift: 1, print: (p, b) => planks(p, b, shade(wall, -0.18)) })
    sheet(c, rect(-w / 2, wallTop + 66, w, 10), shade(wall, -0.25), { lift: 0.3, edgeScale: 0.6 })
    sheet(c, rect(-36, floor - 120, 72, 120), shade(wall, 0.2), { lift: 0.5 })
    sheet(c, rect(-28, floor - 112, 56, 112), shade(wall, -0.45), { lift: 0.3 })
    sheet(c, rect(win - 32, wallTop + 28, 64, 68), shade(wall, 0.2), { lift: 0.5 })
    sheet(c, rect(win - 26, wallTop + 34, 52, 56), '#f2c56b', { lift: 0.3, print: (p, b) => { p.strokeStyle = shade(wall, -0.3); p.lineWidth = 3; p.beginPath(); p.moveTo(b.cx, b.y0); p.lineTo(b.cx, b.y1); p.moveTo(b.x0, b.cy); p.lineTo(b.x1, b.cy); p.stroke() } })
    sheet(c, rect(win - 60, wallTop + 30, 28, 64), shade(wall, 0.12), { lift: 0.6, print: (p, b) => planks(p, b, shade(wall, -0.15), 9, false) })
    sheet(c, rect(win + 32, wallTop + 30, 28, 64), shade(wall, 0.12), { lift: 0.6, print: (p, b) => planks(p, b, shade(wall, -0.15), 9, false) })
    for (let i = 0; i <= 8; i++) {
      const bx = -w / 2 - 28 + i * (w + 56) / 8
      if (Math.abs(bx) < 40) continue
      sheet(c, rect(bx - 4, floor - 46, 8, 36), C.trim, { lift: 0.5, edgeScale: 0.6 })
    }
    sheet(c, rect(-w / 2 - 34, floor - 52, w / 2 - 6, 9), C.wood, { lift: 0.7, edgeScale: 0.7 })
    sheet(c, rect(40, floor - 52, w / 2 - 6, 9), C.wood, { lift: 0.7, edgeScale: 0.7 })
    if (potted) {
      const px = -win
      sheet(c, [P(px - 16, floor - 52), P(px + 16, floor - 52), P(px + 12, floor - 76), P(px - 12, floor - 76)], '#b5553a', { lift: 0.5, edgeScale: 0.7 })
      for (const a of [-2.2, -1.57, -0.95]) sheet(c, leafShape(P(px, floor - 74), a, 44, 9, seed, 0, 0), C.leaf, { lift: 0.5, edgeScale: 0.6 })
      sheet(c, ellipse(px, floor - 118, 8, 8, 10), '#e97e5e', { lift: 0.3, edgeScale: 0.6 })
    }
    const lx = ladder * 78
    sheet(c, strip(P(lx - 20, floor - 4), P(lx - 20 + ladder * 30, 0), 9), C.woodDark, { lift: 0.9 })
    sheet(c, strip(P(lx + 20, floor - 4), P(lx + 20 + ladder * 30, 0), 9), C.woodDark, { lift: 0.9 })
    for (let i = 1; i <= 4; i++) {
      const k = i / 5, y = floor * (1 - k), dx = ladder * 30 * k
      sheet(c, rect(lx - 24 + dx, y - 4, 48, 8), C.wood, { lift: 0.5, edgeScale: 0.7 })
    }
  }
  if (show('roof')) {
    const eave = [P(-w / 2 - 62, wallTop + 40), P(w / 2 + 62, wallTop + 40), P(w / 2 + 34, wallTop - 4), P(-w / 2 - 34, wallTop - 4)]
    sheet(c, eave, shade(roof, -0.12), { lift: 1.1, print: (p, b) => shingles(p, b, shade(roof, -0.32), 16, 26) })
    gableRoof(c, P(-w / 2 - 40, wallTop + 8), P(w / 2 + 40, wallTop + 8), P(0, wallTop - roofH), roof, C.gable, C.trim, wallTop, 0)
  }
}

export function palmTree(c, { h = 400, lean = 30, seed = 1 } = {}) {
  const top = P(lean, -h), n = 10, left = [], right = []
  for (let i = 0; i <= n; i++) {
    const u = i / n, px = lean * u * u, py = -h * u, w = 15 - 6 * u
    left.push(P(px - w, py))
    right.push(P(px + w, py))
  }
  sheet(c, [...left, ...right.reverse()], C.trunk, {
    lift: 1,
    print: (p, b) => {
      p.strokeStyle = shade(C.trunk, -0.22)
      p.lineWidth = 3
      for (let y = b.y0 + 14; y < b.y1; y += 22) { p.beginPath(); p.moveTo(b.x0, y); p.lineTo(b.x1, y + 4); p.stroke() }
    },
  })
  const angles = [-3.0, -2.55, -2.15, -1.75, -1.4, -1.05, -0.65, -0.2, 0.15]
  ;[0, 8, 1, 7, 2, 6, 3, 5, 4].forEach(i => {
    const len = 185 + ((i * 37 + seed * 11) % 40), droop = i < 4 ? -0.6 : i > 4 ? 0.6 : 0
    sheet(c, leafShape(top, angles[i], len, 24, seed + i, 1, droop), [C.leafDark, C.leaf, C.leafLight][i % 3], { lift: 1.1 })
  })
  for (let k = 0; k < 3; k++) sheet(c, ellipse(top.x - 12 + k * 13, top.y + 14 + (k % 2) * 6, 11, 12, 14), '#7a5a2e', { lift: 0.4 })
}

export function bananaTree(c, { seed = 1 } = {}) {
  sheet(c, [P(-22, 0), P(-13, -170), P(13, -170), P(22, 0)], '#93a85c', { lift: 0.9 })
  const leaves = [[-2.5, -0.55, 200], [-0.65, 0.55, 210], [-2.0, -0.35, 230], [-1.15, 0.4, 230], [-1.6, 0.05, 190]]
  leaves.forEach(([angle, bend, len], i) => {
    const base = P(0, -160), col = [C.leaf, C.leafLight, C.leafDark][(i + seed) % 3]
    sheet(c, leafShape(base, angle, len, 40, seed + i, 0, bend), col, {
      lift: 1.1,
      print: p => {
        p.strokeStyle = shade(col, 0.25)
        p.lineWidth = 4
        p.beginPath()
        let px = base.x, py = base.y
        p.moveTo(px, py)
        for (let k = 1; k <= 16; k++) {
          const a = angle + bend * (k / 16)
          px += Math.cos(a) * len / 16
          py += Math.sin(a) * len / 16
          p.lineTo(px, py)
        }
        p.stroke()
      },
    })
  })
}

export function bush(c, { rx = 120, ry = 70, seed = 1, flowers = true } = {}) {
  sheet(c, blob(0, -ry * 0.85, rx, ry, 6, seed, 0.25), C.leafDark, { lift: 1.2 })
  sheet(c, blob(-rx * 0.15, -ry * 0.7, rx * 0.75, ry * 0.7, 5, seed + 2, 0.22), C.leaf, { lift: 0.8 })
  if (!flowers) return
  const r = rng(seed)
  for (let i = 0; i < 6; i++) sheet(c, ellipse(-rx * 0.7 + r() * rx * 1.3, -ry * 1.3 + r() * ry, 10, 10, 10), i % 2 ? '#f4e2a8' : '#e97e5e', { lift: 0.4, edgeScale: 0.6 })
}

export function lotusFlower(c, { seed = 1, height = 110 } = {}) {
  sheet(c, strip(P(0, 0), P(4, -height), 8), C.leafDark, { lift: 0.5 })
  const bx = 4, y = -height
  sheet(c, [P(bx, y), P(bx - 44, y - 30), P(bx - 32, y - 52), P(bx - 6, y - 22)], shade(C.lotus, -0.1), { lift: 0.7 })
  sheet(c, [P(bx, y), P(bx + 44, y - 30), P(bx + 32, y - 52), P(bx + 6, y - 22)], shade(C.lotus, -0.1), { lift: 0.7 })
  fold(c, [P(bx, y + 2), P(bx - 22, y - 36), P(bx, y - 84), P(bx + 22, y - 36)], C.lotus, { apex: P(bx, y - 36), depth: 0.3, lift: 0.9, seed })
}

export function kid(c, { frame = 0, shirt = C.shirt } = {}) {
  const stride = frame ? 16 : 0
  sheet(c, [P(-14 - stride, 0), P(-22 - stride * 0.4, -64), P(-4, -64), P(-2 - stride * 0.2, 0)], C.skin, { lift: 0.6 })
  sheet(c, [P(4 + stride * 0.2, 0), P(4, -64), P(22 + stride * 0.4, -64), P(16 + stride, 0)], shade(C.skin, -0.08), { lift: 0.6 })
  sheet(c, rect(-26, -96, 52, 38), C.shorts, { lift: 0.9 })
  sheet(c, [P(-30, -92), P(-34, -158), P(34, -158), P(30, -92)], shirt, { lift: 1, print: (p, b) => planks(p, b, shade(shirt, 0.15), 14, false, 3) })
  const swing = frame ? 0.35 : -0.15
  sheet(c, strip(P(-30, -150), P(-30 - Math.sin(swing) * 46, -150 + Math.cos(swing) * 46), 16), shade(shirt, -0.1), { lift: 0.8 })
  sheet(c, strip(P(30, -150), P(30 + Math.sin(swing) * 46, -150 + Math.cos(swing) * 46), 16), shade(shirt, -0.1), { lift: 0.8 })
  sheet(c, ellipse(0, -186, 26, 28, 20), C.skin, { lift: 0.9 })
  sheet(c, ellipse(9, -188, 3.5, 4.5, 8), '#2b1d12', { lift: 0, edge: false })
  sheet(c, ellipse(-7, -188, 3.5, 4.5, 8), '#2b1d12', { lift: 0, edge: false })
  fold(c, [P(-70, -196), P(-34, -214), P(0, -234), P(34, -214), P(70, -196), P(0, -186)], C.hat, { apex: P(0, -216), depth: 0.3, lift: 1 })
}

export function stall(c, { awning = '#c2412d', seed = 1, goods = ['#e8a33d', '#d9533a', '#7aa25a'] } = {}) {
  for (const x of [-150, 140]) sheet(c, rect(x, -260, 12, 260), C.woodDark, { lift: 0.6 })
  sheet(c, rect(-170, -110, 340, 26), C.wood, { lift: 1, print: (p, b) => planks(p, b, shade(C.wood, -0.2), 26) })
  sheet(c, rect(-160, -84, 320, 84), shade(C.wood, -0.15), { lift: 0.8 })
  const r = rng(seed)
  goods.forEach((col, g) => {
    for (let i = 0; i < 6; i++) sheet(c, ellipse(-120 + g * 110 + (i % 3) * 22, -122 - Math.floor(i / 3) * 18 - r() * 4, 13, 12, 12), shade(col, (r() - 0.5) * 0.2), { lift: 0.5, edgeScale: 0.7 })
  })
  const top = [P(-200, -250), P(200, -250), P(176, -310), P(-176, -310)]
  sheet(c, top, awning, {
    lift: 1.3,
    print: (p, b) => {
      p.fillStyle = '#f6ead2'
      for (let x = b.x0; x < b.x1; x += 64) p.fillRect(x, b.y0, 32, b.h)
    },
  })
  const scallops = []
  for (let i = 0; i <= 10; i++) {
    const x = -200 + i * 40
    scallops.push(P(x, -250))
    if (i < 10) scallops.push(P(x + 20, -226))
  }
  sheet(c, [...scallops, P(200, -256), P(-200, -256)], shade(awning, -0.1), { lift: 0.9 })
}

export function temple(c, { w = 620, part = 'all' } = {}) {
  const base = -60, wallTop = base - 230, half = w / 2
  if (part !== 'roof') {
  sheet(c, rect(-half - 70, -34, w + 140, 34), '#e8dcc0', { lift: 1 })
  sheet(c, rect(-half - 40, base, w + 80, 28), '#f1e7d0', { lift: 1 })
  for (let i = 0; i < 3; i++) sheet(c, rect(-90 + i * 14, -34 - i * 10 - 10, 180 - i * 28, 12), '#ddd0b2', { lift: 0.4 })
  sheet(c, rect(-half, wallTop, w, 230), C.templeWall, { lift: 1 })
  for (let i = 0; i < 6; i++) {
    const px = -half + 20 + i * (w - 52) / 5
    sheet(c, rect(px, wallTop, 32, 230), '#fbf5e8', { lift: 0.8, print: (p, b) => { p.fillStyle = C.gold; p.fillRect(b.x0, b.y0, b.w, 18) } })
  }
  sheet(c, rect(-44, base - 170, 88, 170), C.templeRoof, { lift: 0.5, print: (p, b) => { p.strokeStyle = C.gold; p.lineWidth = 5; p.strokeRect(b.x0 + 8, b.y0 + 8, b.w - 16, b.h - 8) } })
  fold(c, [P(-56, base - 170), P(0, base - 236), P(56, base - 170)], C.gold, { lift: 0.6, depth: 0.25 })
  for (const s of [-1, 1]) {
    const wx = s * (half - 120)
    sheet(c, rect(wx - 30, base - 150, 60, 90), C.templeRoof, { lift: 0.4, print: (p, b) => { p.strokeStyle = C.gold; p.lineWidth = 4; p.strokeRect(b.x0 + 6, b.y0 + 6, b.w - 12, b.h - 12) } })
    fold(c, [P(wx - 38, base - 150), P(wx, base - 196), P(wx + 38, base - 150)], C.gold, { lift: 0.5, depth: 0.25 })
  }
  }
  if (part === 'body') return
  const tiers = [[w * 0.62, 150, 70], [w * 0.5, 120, -10], [w * 0.36, 140, -90]]
  tiers.forEach(([tw, th, dy], i) => {
    const y = wallTop + dy, L = P(-tw - 30, y + 30), R = P(tw + 30, y + 30), A = P(0, y - th - 60 - i * 10)
    const shoulderL = P(-tw * 0.62, y - th * 0.35), shoulderR = P(tw * 0.62, y - th * 0.35)
    fold(c, [L, shoulderL, A, shoulderR, R, P(tw * 0.9, y + 44), P(-tw * 0.9, y + 44)], C.templeRoof, { apex: P(0, y - th * 0.3), depth: 0.28, lift: 1.4, seed: i + 2, print: (p, b) => shingles(p, b, shade(C.templeRoof, -0.25), 20, 28) })
    sheet(c, strip(L, shoulderL, 16), C.templeRoofEdge, { lift: 0.5, edgeScale: 0.8 })
    sheet(c, strip(shoulderR, R, 16), C.templeRoofEdge, { lift: 0.5, edgeScale: 0.8 })
    sheet(c, strip(shoulderL, A, 12), C.gold, { lift: 0.7, edgeScale: 0.8 })
    sheet(c, strip(A, shoulderR, 12), C.gold, { lift: 0.7, edgeScale: 0.8 })
    chofa(c, P(L.x + 4, L.y - 4), -1, C.gold, 0.8)
    chofa(c, P(R.x - 4, R.y - 4), 1, C.gold, 0.8)
    if (i === 2) {
      sheet(c, [P(-tw * 0.5, y - th * 0.2), P(0, A.y + 40), P(tw * 0.5, y - th * 0.2)], C.gold, { lift: 0.6, print: p => rays(p, P(0, y - th * 0.2), 13, C.goldDark) })
      chofa(c, P(0, A.y + 4), 1, C.gold, 1.4)
    }
  })
}

export function signBoard(c, { title = '', color = '#f3e3bf' } = {}) {
  sheet(c, rect(-8, -170, 16, 170), C.woodDark, { lift: 0.6 })
  sheet(c, rect(-130, -250, 260, 100), C.wood, { lift: 1.2 })
  sheet(c, rect(-116, -238, 232, 76), color, { lift: 0.5 })
  c.save()
  c.fillStyle = '#3a2414'
  let size = 40
  c.font = `600 ${size}px Kanit`
  while (c.measureText(title).width > 210 && size > 20) c.font = `600 ${--size}px Kanit`
  c.textAlign = 'center'
  c.textBaseline = 'middle'
  c.fillText(title, 0, -199)
  c.restore()
}

export function cloud(c, { rx = 200, ry = 70, seed = 1 } = {}) {
  sheet(c, blob(0, -ry, rx, ry, 5, seed, 0.3), C.cloud, { lift: 1 })
  sheet(c, blob(-rx * 0.2, -ry * 0.75, rx * 0.6, ry * 0.5, 4, seed + 1, 0.25), shade(C.cloud, -0.05), { lift: 0.5 })
}

export function hillRange(c, { w = 1600, h = 300, color = '#93ad8c', bumps = 4, seed = 2 } = {}) {
  sheet(c, scallopTop(-w / 2, w / 2, 0, h, bumps, seed), color, { lift: 1.2 })
}

export function rowBoat(c, { rower = true } = {}) {
  if (rower) {
    const hand = P(36, -86), tip = P(36 + Math.cos(1.25) * 170, -86 + Math.sin(1.25) * 170)
    sheet(c, strip(hand, tip, 8), C.woodDark, { lift: 0.5 })
    sheet(c, [P(-22, -40), P(-30, -118), P(28, -118), P(36, -40)], '#2e4866', { lift: 1 })
    sheet(c, strip(P(10, -108), hand, 18), '#2e4866', { lift: 0.8 })
    sheet(c, ellipse(0, -142, 23, 25, 18), C.skin, { lift: 0.8 })
    fold(c, [P(-74, -150), P(-34, -168), P(0, -186), P(34, -168), P(74, -150), P(0, -140)], C.hat, { apex: P(0, -172), depth: 0.3, lift: 1 })
  }
  const hull = []
  for (let i = 0; i <= 16; i++) { const u = i / 16; hull.push(P(-190 + 380 * u, -42 - Math.pow(Math.abs(u - 0.5) * 2, 3) * 30)) }
  for (let i = 16; i >= 0; i--) { const u = i / 16; hull.push(P(-170 + 340 * u, 18 - Math.sin(u * Math.PI) * 4)) }
  sheet(c, hull, C.woodDark, { lift: 1.3, print: (p, b) => planks(p, b, shade(C.woodDark, -0.25), 16, false) })
  sheet(c, strip(P(-186, -44), P(186, -44), 8), C.wood, { lift: 0.4, edgeScale: 0.7 })
}

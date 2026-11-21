import { P, rng, shade, ease, seg } from '../../lib/core.js'
import { sheet, fold, trace, ellipse, rect, blob, scallopTop, wave, leafShape, strip, setWorld } from '../../lib/paper.js'
import { popUp, slideIn, sway, camera } from '../../lib/motion.js'
import { label, subtitles } from '../../lib/text.js'
import { stage } from '../../lib/stage.js'

const DURATION = 14.5

const C = {
  page: '#e6d5b1',
  skyTop: '#f1c98f',
  skyLow: '#f8e7c6',
  sun: '#ef9b52',
  cloud: '#fbf2df',
  hillFar: '#a9bc9c',
  hillNear: '#86a283',
  earth: '#c7a86c',
  grass: '#8aa95f',
  grassDark: '#6f9450',
  wood: '#9a6a42',
  woodDark: '#6e4529',
  wallA: '#c58d57',
  wallB: '#b77f4c',
  roof: '#8c3b2a',
  roofB: '#6d4a35',
  gable: '#dcb985',
  trim: '#f1dfb6',
  water: '#3d8a86',
  waterLight: '#5aa89c',
  waterDeep: '#2f7471',
  leaf: '#5d8a48',
  leafDark: '#46723a',
  leafLight: '#7aa25a',
  trunk: '#9c7a52',
  lotusPad: '#638f4c',
  lotus: '#e88aa0',
  shirt: '#2e4866',
  skin: '#d6a274',
  hat: '#e2c58a',
}

const AT = {
  sky: 0.15, sun: 0.55, clouds: [0.7, 0.85, 1.0], hillFar: 0.45, hillNear: 0.65, bankBack: 0.8,
  houses: [1.1, 1.35, 1.6], palms: [1.85, 2.1], banana: 2.3, pier: 2.45, lotus: [2.6, 2.75, 2.9],
  bankFront: 0.95, reeds: [2.2, 2.35], foreground: [2.85, 3.0], boat: 3.1, title: 3.4,
}

const LINES = [
  ['บ้านไม้ใต้ถุนสูง เรียงริมคลอง', 4.4, 7.6],
  ['ทุกชิ้นคือกระดาษตัด วาดด้วยโค้ดล้วน', 7.9, 11.0],
  ['ไม่มีภาพ AI สักภาพ', 11.3, 14.2],
]

setWorld({ shadow: '#4a2c16' })

function planks(c, b, color, gap = 22, vertical = true) {
  c.strokeStyle = color
  c.lineWidth = 2
  c.beginPath()
  if (vertical) for (let x = b.x0 + gap; x < b.x1; x += gap) { c.moveTo(x, b.y0); c.lineTo(x, b.y1) }
  else for (let y = b.y0 + gap; y < b.y1; y += gap) { c.moveTo(b.x0, y); c.lineTo(b.x1, y) }
  c.stroke()
}

function sky(c, t) {
  sheet(c, rect(-260, -400, 1600, 1360), C.skyLow, {
    lift: 1.6,
    tone: 0,
    print: (p, b) => {
      const g = p.createLinearGradient(0, b.y0, 0, b.y1)
      g.addColorStop(0, C.skyTop)
      g.addColorStop(1, C.skyLow)
      p.fillStyle = g
      p.fillRect(b.x0, b.y0, b.w, b.h)
    },
  })
  popUp(c, t, AT.sun, P(770, 560), () => {
    sheet(c, ellipse(770, 430, 128, 128, 40), shade(C.sun, 0.25), { lift: 0.8 })
    sheet(c, ellipse(770, 430, 100, 100, 40), C.sun, { lift: 0.6 })
  })
  const clouds = [[250, 330, 170, 62, 3], [860, 640, 150, 52, 7], [560, 230, 110, 40, 11]]
  clouds.forEach(([x, y, rx, ry, s], i) => {
    const drift = Math.sin(t * 0.3 + i) * 14
    popUp(c, t, AT.clouds[i], P(x, y + ry), () => {
      sheet(c, blob(x + drift, y, rx, ry, 5, s, 0.3), C.cloud, { lift: 1 })
      sheet(c, blob(x + drift - rx * 0.2, y + ry * 0.25, rx * 0.6, ry * 0.5, 4, s + 1, 0.25), shade(C.cloud, -0.05), { lift: 0.5 })
    })
  })
}

function hills(c, t) {
  popUp(c, t, AT.hillFar, P(540, 920), () => sheet(c, scallopTop(-260, 1340, 930, 250, 4, 2), C.hillFar, { lift: 1.2 }))
  popUp(c, t, AT.hillNear, P(540, 980), () => sheet(c, scallopTop(-260, 1340, 990, 170, 6, 5), C.hillNear, { lift: 1.2 }))
}

function bankBack(c, t) {
  sheet(c, rect(-260, 960, 1600, 140), C.earth, { lift: 0.8 })
  popUp(c, t, AT.bankBack, P(540, 985), () => sheet(c, scallopTop(-260, 1340, 990, 34, 22, 8), C.grass, { lift: 0.7 }))
}

function chofa(c, tip, dir, color) {
  const s = dir
  sheet(c, [tip, P(tip.x + 10 * s, tip.y - 18), P(tip.x + 4 * s, tip.y - 44), P(tip.x + 16 * s, tip.y - 52), P(tip.x + 22 * s, tip.y - 36), P(tip.x + 20 * s, tip.y - 14), P(tip.x + 6 * s, tip.y + 6)], color, { lift: 0.6, edgeScale: 0.8 })
}

function house(c, x, gy, w, wall, roof, seed) {
  const floor = gy - 118, wallTop = floor - 150, roofH = 200, r = rng(seed)
  for (let i = 0; i < 4; i++) sheet(c, rect(x - w / 2 + 8 + i * (w - 30) / 3, floor, 14, 118), C.woodDark, { lift: 0.6 })
  sheet(c, rect(x - w / 2 - 22, floor - 12, w + 44, 22), C.wood, { lift: 1 })
  sheet(c, rect(x - w / 2, wallTop, w, 150), wall, { lift: 1, print: (p, b) => planks(p, b, shade(wall, -0.18)) })
  sheet(c, rect(x - 30, floor - 112, 60, 112), shade(wall, -0.42), { lift: 0.4 })
  const win = r() > 0.4 ? x + w * 0.27 : x - w * 0.27
  sheet(c, rect(win - 26, wallTop + 34, 52, 56), '#f2c56b', { lift: 0.3 })
  sheet(c, rect(win - 56, wallTop + 32, 28, 60), shade(wall, 0.12), { lift: 0.5 })
  sheet(c, rect(win + 28, wallTop + 32, 28, 60), shade(wall, 0.12), { lift: 0.5 })
  const L = P(x - w / 2 - 40, wallTop + 8), R = P(x + w / 2 + 40, wallTop + 8), A = P(x, wallTop - roofH)
  fold(c, [L, A, R], roof, { apex: P(x, wallTop - roofH * 0.3), depth: 0.32, lift: 1.2 })
  const gl = lpAt(L, A, 0.16), gr = lpAt(R, A, 0.16), ga = P(x, wallTop - roofH * 0.72)
  sheet(c, [P(gl.x + 14, wallTop + 4), ga, P(gr.x - 14, wallTop + 4)], C.gable, {
    lift: 0.5,
    print: (p, b) => {
      p.strokeStyle = shade(C.gable, -0.2)
      p.lineWidth = 2
      const o = P(x, wallTop + 4)
      for (let k = 0; k < 11; k++) {
        const a = Math.PI + (k + 0.5) * (Math.PI / 11)
        p.beginPath()
        p.moveTo(o.x, o.y)
        p.lineTo(o.x + Math.cos(a) * 400, o.y + Math.sin(a) * 400)
        p.stroke()
      }
    },
  })
  sheet(c, strip(L, A, 14), C.trim, { lift: 0.6, edgeScale: 0.8 })
  sheet(c, strip(A, R, 14), C.trim, { lift: 0.6, edgeScale: 0.8 })
  chofa(c, P(A.x, A.y + 4), 1, C.trim)
  sheet(c, [L, P(L.x - 22, L.y - 18), P(L.x - 16, L.y + 6)], C.trim, { lift: 0.5, edgeScale: 0.8 })
  sheet(c, [R, P(R.x + 22, R.y - 18), P(R.x + 16, R.y + 6)], C.trim, { lift: 0.5, edgeScale: 0.8 })
}

const lpAt = (a, b, k) => P(a.x + (b.x - a.x) * k, a.y + (b.y - a.y) * k)

function palm(c, t, x, gy, h, lean, seed) {
  const top = P(x + lean, gy - h), n = 10, left = [], right = []
  for (let i = 0; i <= n; i++) {
    const u = i / n, px = x + lean * u * u, py = gy - h * u, w = 15 - 6 * u
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
  const order = [0, 8, 1, 7, 2, 6, 3, 5, 4]
  order.forEach(i => {
    const a = angles[i] + sway(t, seed + i, 0.05), len = 185 + ((i * 37) % 40), droop = i < 4 ? -0.6 : i > 4 ? 0.6 : 0
    const col = [C.leafDark, C.leaf, C.leafLight][i % 3]
    sheet(c, leafShape(top, a, len, 24, seed + i, 1, droop), col, { lift: 1.1 })
  })
  for (let k = 0; k < 3; k++) sheet(c, ellipse(top.x - 12 + k * 13, top.y + 14 + (k % 2) * 6, 11, 12, 14), '#7a5a2e', { lift: 0.4 })
}

function banana(c, t, x, gy, seed) {
  sheet(c, [P(x - 22, gy), P(x - 13, gy - 170), P(x + 13, gy - 170), P(x + 22, gy)], '#93a85c', { lift: 0.9 })
  const leaves = [[-2.5, -0.55, 200], [-0.65, 0.55, 210], [-2.0, -0.35, 230], [-1.15, 0.4, 230], [-1.6, 0.05, 190]]
  leaves.forEach(([a, bend, len], i) => {
    const base = P(x, gy - 160), angle = a + sway(t, seed + i, 0.04), col = [C.leaf, C.leafLight, C.leafDark][i % 3]
    sheet(c, leafShape(base, angle, len, 40, seed + i, 0, bend), col, {
      lift: 1.1,
      print: p => {
        p.strokeStyle = shade(col, 0.25)
        p.lineWidth = 4
        p.beginPath()
        let px = base.x, py = base.y
        p.moveTo(px, py)
        for (let k = 1; k <= 16; k++) {
          const ak = angle + bend * (k / 16)
          px += Math.cos(ak) * len / 16
          py += Math.sin(ak) * len / 16
          p.lineTo(px, py)
        }
        p.stroke()
      },
    })
  })
}

function water(c, t) {
  sheet(c, rect(-260, 1060, 1600, 380), C.water, { lift: 0.4 })
  for (let i = 0; i < 6; i++) {
    const y = 1085 + i * 56, col = [C.waterLight, C.waterDeep, C.waterLight][i % 3]
    sheet(c, wave(-300, 1380, y, 16, 6, 240 + i * 30, t * (0.9 + i * 0.12) + i), col, { lift: 0.35, edgeScale: 0.7 })
  }
}

function boat(c, t) {
  const k = seg(t, AT.boat, DURATION + 0.6)
  if (k <= 0) return
  const x = -220 + (ease.out(Math.min(1, k * 6)) * 0.12 + k * 0.88) * 1560, y = 1262 + Math.sin(t * 2.1) * 4, tilt = Math.sin(t * 1.7) * 0.025
  c.save()
  c.translate(x, y)
  c.rotate(tilt)
  sheet(c, wave(-200, 200, 34, 12, 4, 120, t * 3), shade(C.waterLight, 0.18), { lift: 0.3, edgeScale: 0.6 })
  const paddle = Math.sin(t * 2.6) * 0.5
  const hand = P(36, -86)
  const tip = P(hand.x + Math.cos(1.25 + paddle) * 170, hand.y + Math.sin(1.25 + paddle) * 170)
  sheet(c, strip(hand, tip, 8), C.woodDark, { lift: 0.5 })
  sheet(c, ellipse(tip.x, tip.y, 12, 24, 12, 1.25 + paddle), C.wood, { lift: 0.5 })
  sheet(c, [P(-22, -40), P(-30, -118), P(28, -118), P(36, -40)], C.shirt, { lift: 1 })
  sheet(c, strip(P(10, -108), hand, 18), C.shirt, { lift: 0.8 })
  sheet(c, ellipse(0, -142, 23, 25, 18), C.skin, { lift: 0.8 })
  fold(c, [P(-74, -150), P(-34, -168), P(0, -186), P(34, -168), P(74, -150), P(0, -140)], C.hat, { apex: P(0, -172), depth: 0.3, lift: 1 })
  const hull = []
  for (let i = 0; i <= 16; i++) { const u = i / 16, hx = -190 + 380 * u; hull.push(P(hx, -42 - Math.pow(Math.abs(u - 0.5) * 2, 3) * 30)) }
  for (let i = 16; i >= 0; i--) { const u = i / 16, hx = -170 + 340 * u; hull.push(P(hx, 18 - Math.sin(u * Math.PI) * 4)) }
  sheet(c, hull, C.woodDark, { lift: 1.3, print: (p, b) => planks(p, b, shade(C.woodDark, -0.25), 16, false) })
  sheet(c, strip(P(-186, -44), P(186, -44), 8), C.wood, { lift: 0.4, edgeScale: 0.7 })
  c.restore()
}

function lotus(c, t) {
  const spots = [[150, 1400, 3], [300, 1418, 5], [980, 1408, 9]]
  spots.forEach(([x, y, s], i) => popUp(c, t, AT.lotus[i], P(x, y + 10), () => {
    const pad = ellipse(x, y, 70, 22, 26)
    pad.splice(3, 2, P(x + 30, y))
    sheet(c, pad, C.lotusPad, { lift: 0.5 })
    if (i !== 1) {
      sheet(c, strip(P(x + 10, y - 4), P(x + 14 + sway(t, s, 4), y - 90), 7), C.leafDark, { lift: 0.5 })
      const bx = x + 14 + sway(t, s, 4)
      sheet(c, [P(bx, y - 84), P(bx - 40, y - 112), P(bx - 30, y - 132), P(bx - 6, y - 104)], shade(C.lotus, -0.1), { lift: 0.7 })
      sheet(c, [P(bx, y - 84), P(bx + 40, y - 112), P(bx + 30, y - 132), P(bx + 6, y - 104)], shade(C.lotus, -0.1), { lift: 0.7 })
      fold(c, [P(bx, y - 82), P(bx - 20, y - 118), P(bx, y - 162), P(bx + 20, y - 118)], C.lotus, { apex: P(bx, y - 118), depth: 0.3, lift: 0.9 })
    }
  }))
}

function bankFront(c, t) {
  sheet(c, rect(-260, 1420, 1600, 700), C.earth, {
    lift: 1.2,
    print: (p, b) => {
      const r = rng(41)
      for (let i = 0; i < 46; i++) {
        p.fillStyle = r() > 0.5 ? shade(C.earth, -0.12) : shade(C.earth, 0.12)
        p.beginPath()
        p.ellipse(b.x0 + 260 + r() * 1080, 1520 + r() * 440, 16 + r() * 22, 7 + r() * 6, 0, 0, 7)
        p.fill()
      }
    },
  })
  popUp(c, t, AT.bankFront, P(540, 1450), () => {
    sheet(c, scallopTop(-260, 1340, 1460, 48, 18, 12), C.grass, { lift: 0.9 })
    const r = rng(17)
    for (let i = 0; i < 9; i++) {
      const fx = 40 + i * 120 + r() * 50, fy = 1442 + r() * 18
      sheet(c, ellipse(fx, fy, 9, 9, 10), i % 2 ? '#f4e2a8' : '#e97e5e', { lift: 0.4, edgeScale: 0.6 })
    }
  })
}

function pier(c, t) {
  popUp(c, t, AT.pier, P(880, 1450), () => {
    for (const px of [800, 860, 930, 990]) sheet(c, rect(px, 1300 + (px > 900 ? 0 : 30), 14, 150), C.woodDark, { lift: 0.6 })
    sheet(c, [P(770, 1452), P(1020, 1452), P(1000, 1300), P(840, 1300)], C.wood, { lift: 1, print: (p, b) => planks(p, b, shade(C.wood, -0.22), 18, false) })
  })
}

function reeds(c, t) {
  const groups = [[70, 1460, 21], [1030, 1462, 33]]
  groups.forEach(([x, y, s], g) => popUp(c, t, AT.reeds[g], P(x, y), () => {
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + (i - 2.5) * 0.18 + sway(t, s + i, 0.04)
      sheet(c, leafShape(P(x + (i - 2.5) * 8, y), a, 150 + (i % 3) * 40, 9, s + i, 0, (i - 2.5) * 0.12), i % 2 ? C.leafDark : C.grassDark, { lift: 0.8, edgeScale: 0.7 })
    }
  }))
}

function bigLeaf(c, base, angle, length, width, seed, bend, color) {
  sheet(c, leafShape(base, angle, length, width, seed, 0, bend), color, {
    lift: 2.6,
    print: p => {
      p.strokeStyle = shade(color, 0.22)
      p.lineWidth = 6
      p.beginPath()
      let x = base.x, y = base.y
      p.moveTo(x, y)
      for (let i = 1; i <= 16; i++) {
        const a = angle + bend * (i / 16)
        x += Math.cos(a) * length / 16
        y += Math.sin(a) * length / 16
        p.lineTo(x, y)
      }
      p.stroke()
      p.lineWidth = 3
      x = base.x
      y = base.y
      for (let i = 1; i <= 16; i++) {
        const a = angle + bend * (i / 16)
        x += Math.cos(a) * length / 16
        y += Math.sin(a) * length / 16
        if (i % 2 || i > 14) continue
        const w = Math.sin((i / 16) * Math.PI) * width * 0.9
        p.beginPath()
        p.moveTo(x, y)
        p.lineTo(x + Math.cos(a - 0.9) * w, y + Math.sin(a - 0.9) * w)
        p.moveTo(x, y)
        p.lineTo(x + Math.cos(a + 0.9) * w, y + Math.sin(a + 0.9) * w)
        p.stroke()
      }
    },
  })
}

function bushes(c, t) {
  const spots = [[180, 1600, 4], [880, 1585, 6]]
  spots.forEach(([x, y, s]) => {
    sheet(c, blob(x, y, 120, 64, 6, s, 0.25), C.leafDark, { lift: 1.2 })
    sheet(c, blob(x - 20, y + 8, 90, 46, 5, s + 2, 0.22), C.leaf, { lift: 0.8 })
    const r = rng(s)
    for (let i = 0; i < 6; i++) sheet(c, ellipse(x - 80 + r() * 150, y - 30 + r() * 60, 10, 10, 10), i % 2 ? '#f4e2a8' : '#e97e5e', { lift: 0.4, edgeScale: 0.6 })
  })
}

function foreground(c, t) {
  popUp(c, t, AT.foreground[0], P(40, 1960), () => {
    bigLeaf(c, P(-80, 2010), -1.05 + sway(t, 3, 0.03), 560, 120, 4, -0.45, C.leafDark)
    bigLeaf(c, P(-60, 2030), -0.55 + sway(t, 5, 0.03), 430, 90, 6, -0.35, C.leaf)
  })
  popUp(c, t, AT.foreground[1], P(1060, 1960), () => {
    bigLeaf(c, P(1160, 2010), -2.2 + sway(t, 8, 0.03), 520, 110, 9, 0.45, C.leafDark)
  })
}

function world(c, t) {
  c.fillStyle = C.page
  c.fillRect(-400, -600, 1900, 3100)
  popUp(c, t, AT.sky, P(540, 960), () => sky(c, t), { lean: 0.15 })
  hills(c, t)
  bankBack(c, t)
  const houses = [[190, 1050, 196, C.wallA, C.roof, 2], [545, 1046, 226, C.wallB, C.roofB, 5], [900, 1052, 190, C.wallA, C.roof, 8]]
  const trees = () => {
    popUp(c, t, AT.palms[0], P(385, 1050), () => palm(c, t, 385, 1050, 400, 30, 20))
    popUp(c, t, AT.palms[1], P(1030, 1052), () => palm(c, t, 1030, 1052, 330, -40, 40))
    popUp(c, t, AT.banana, P(720, 1054), () => banana(c, t, 720, 1054, 60))
  }
  trees()
  houses.forEach(([x, gy, w, wall, roof, s], i) => popUp(c, t, AT.houses[i], P(x, gy), () => house(c, x, gy, w, wall, roof, s)))
  water(c, t)
  boat(c, t)
  lotus(c, t)
  bankFront(c, t)
  pier(c, t)
  reeds(c, t)
  popUp(c, t, AT.bankFront + 0.4, P(540, 1650), () => bushes(c, t))
  foreground(c, t)
}

function draw(c, t) {
  camera(c, t, [[0, 540, 960, 1], [3.2, 540, 980, 1.02], [DURATION, 560, 1010, 1.07]], () => world(c, t))
}

function overlay(c, t) {
  popUp(c, t, AT.title, P(540, 250), () => label(c, 'หมู่บ้านริมคลอง', 540, 200, { size: 80, weight: 700, tilt: -0.025, seed: 3 }), { lean: 0 })
  subtitles(c, t, LINES, { y: 1700, size: 50, highlight: ['กระดาษตัด', 'โค้ดล้วน'] })
}

async function sound(k) {
  const pan = x => (x - 540) / 700
  const pops = [
    [AT.sky, 540, 1.2], [AT.sun, 770, 0.6], ...AT.clouds.map(a => [a, 500, 0.5]), [AT.hillFar, 540, 0.9], [AT.hillNear, 540, 0.9],
    [AT.bankBack, 540, 0.6], [AT.bankFront, 540, 0.8], ...AT.houses.map((a, i) => [a, [205, 545, 880][i], 1]),
    ...AT.palms.map((a, i) => [a, [385, 1030][i], 0.8]), [AT.banana, 720, 0.8], [AT.pier, 880, 0.8],
    ...AT.lotus.map((a, i) => [a, [150, 300, 980][i], 0.5]), ...AT.reeds.map((a, i) => [a, [70, 1030][i], 0.5]),
    ...AT.foreground.map((a, i) => [a, [40, 1060][i], 1.1]), [AT.title, 540, 1],
  ]
  for (const [at, x, gain] of pops) k.fold(at, gain, pan(x))
  k.rustle(AT.palms[0] - 0.05, 0.6, 0.8, -0.3)
  k.rustle(AT.foreground[0] - 0.05, 0.8, 1)
  k.slide(AT.boat, 1.4, 0.7, -0.6)
  k.pad(0, DURATION, [57, 64, 69, 72], 0.9)
  const melody = [76, 74, 72, 69, 72, 74, 76, 79, 76, 74, 72, 74, 69]
  melody.forEach((n, i) => k.pluck(3.6 + i * 0.82, n, 0.9))
}

stage({ duration: DURATION, draw, overlay, sound, lens: { focus: 1120, band: 640, soft: 560, blur: 7 } })

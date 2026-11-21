import * as THREE from 'three'
import { P, rng, shade } from '../../lib/core.js'
import { sheet, ellipse, blob, rect, grain } from '../../lib/paper.js'
import { shingles, kid, signBoard, cloud, lotusFlower, planks } from '../../lib/props.js'
import { bamboo, flowerBed, rocks } from '../../lib/props-places.js'
import { pagoda, pine, blossomTree, floatingPeak, crane, immortal, swordRider, stoneLantern, incenseBurner, moonGate } from '../../lib/props-realms.js'
import { paint, paintFlat, card, foldedHouse, setFrame, groundTexture, skyTexture } from '../../world/cards.js'
import { createWorld } from '../../world/engine.js'

const SIZE = 60, PX = Math.min(innerWidth, innerHeight) < 700 ? 2048 : 4096, U = PX / SIZE
const toPx = (x, z) => P((x + SIZE / 2) * U, (z + SIZE / 2) * U)
const u = v => v * U

const ISLANDS = [[0, 3, 14, 10.5], [0, -17, 10, 6.5], [18.5, 3, 7.5, 7], [-18.5, 3, 7.5, 7]]
const BRIDGES = [[-1.6, -12, 1.6, -6], [12, 1.6, 12.6, 4.4], [-12.6, 1.6, -12, 4.4]]
const POOL = { x: -18.5, z: 3.4, r: 3 }
const C = { mist: '#eef1ec', mistBlue: '#dce9ec', mistPink: '#f6e4e2', jade: '#a9d1a2', jadeDark: '#8fbf92', jadeLight: '#c3e0b4', stone: '#e6e0d2', stoneDark: '#cfc7b4', water: '#6fc3c0', waterLight: '#a8e2dc' }

function onIsland(x, z, shrink = 0.9) {
  return ISLANDS.some(([cx, cz, rx, rz]) => ((x - cx) / (rx * shrink)) ** 2 + ((z - cz) / (rz * shrink)) ** 2 < 1)
}

function walkable(x, z) {
  if (Math.hypot(x - POOL.x, z - POOL.z) < POOL.r - 0.2) return false
  if (onIsland(x, z)) return true
  return [[-1.4, -13, 1.4, -5], [11, 1.8, 13.6, 4.2], [-13.6, 1.8, -11, 4.2]].some(([x0, z0, x1, z1]) => x > x0 && x < x1 && z > z0 && z < z1)
}

function drawGround(c) {
  const r = rng(3)
  c.fillStyle = C.mist
  c.fillRect(0, 0, PX, PX)
  for (let i = 0; i < 150; i++) sheet(c, blob(r() * PX, r() * PX, u(1.5 + r() * 3.5), u(0.7 + r() * 1.2), 6, i, 0.3), [C.mistBlue, C.mistPink, '#ffffff'][i % 3], { lift: 0.3, edge: false, tone: 0 })
  ISLANDS.forEach(([x, z, rx, rz], i) => {
    const p = toPx(x, z)
    sheet(c, blob(p.x, p.y + u(0.5), u(rx + 0.5), u(rz + 0.5), 9, i + 4, 0.1), '#9aa6ae', { lift: 1.4 })
    sheet(c, blob(p.x, p.y, u(rx), u(rz), 9, i + 4, 0.1), C.jade, { lift: 0.4 })
  })
  for (let i = 0; i < 2600; i++) {
    const x = (r() - 0.5) * SIZE, z = (r() - 0.5) * SIZE
    if (!onIsland(x, z, 0.84)) continue
    const q = toPx(x, z)
    if (i % 5 === 0) sheet(c, blob(q.x, q.y, u(0.6 + r() * 1.2), u(0.3 + r() * 0.5), 5, i, 0.2), r() > 0.5 ? C.jadeDark : C.jadeLight, { lift: 0.15, edge: false, tone: 0 })
    c.strokeStyle = r() > 0.5 ? shade(C.jadeDark, -0.14) : shade(C.jadeLight, 0.2)
    c.lineWidth = u(0.035)
    c.lineCap = 'round'
    c.beginPath()
    for (const d of [-0.07, 0, 0.07]) { c.moveTo(q.x + u(d), q.y); c.lineTo(q.x + u(d * 2.4), q.y - u(0.2)) }
    c.stroke()
  }
  for (const [x0, z0, x1, z1] of BRIDGES) {
    const a = toPx(x0, z0), b = toPx(x1, z1)
    sheet(c, rect(a.x, a.y, b.x - a.x, b.y - a.y), C.stone, { lift: 1, print: (p, bb) => planks(p, bb, C.stoneDark, u(0.6), bb.w > bb.h, u(0.05)) })
  }
  const stones = (pts, n) => {
    for (let i = 0; i < n; i++) {
      const k = i / (n - 1), seg = Math.min(pts.length - 2, Math.floor(k * (pts.length - 1))), t = k * (pts.length - 1) - seg
      const q = toPx(pts[seg][0] + (pts[seg + 1][0] - pts[seg][0]) * t, pts[seg][1] + (pts[seg + 1][1] - pts[seg][1]) * t)
      sheet(c, blob(q.x + (r() - 0.5) * u(0.3), q.y, u(0.62), u(0.44), 5, i, 0.12), i % 2 ? C.stone : C.stoneDark, { lift: 0.3 })
    }
  }
  stones([[0, 12], [0, 5], [0, -5], [0, -13]], 26)
  stones([[1, 3], [11, 3], [18, 3]], 16)
  stones([[-1, 3], [-11, 3], [-15, 3]], 13)
  const yard = toPx(0, 1.4)
  sheet(c, ellipse(yard.x, yard.y, u(3.4), u(2.5), 44), C.stone, { lift: 0.3 })
  for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; sheet(c, ellipse(yard.x + Math.cos(a) * u(2.2), yard.y + Math.sin(a) * u(1.6), u(0.6), u(0.28), 14, a), i % 2 ? '#bfe3dc' : '#f6d5d8', { lift: 0.15, edgeScale: 0.7 }) }
  sheet(c, ellipse(yard.x, yard.y, u(1.2), u(0.9), 30), '#f4e7b0', { lift: 0.2 })
  const pool = toPx(POOL.x, POOL.z)
  sheet(c, blob(pool.x, pool.y, u(POOL.r + 0.5), u(POOL.r + 0.3), 8, 2, 0.1), C.stone, { lift: 0.4 })
  sheet(c, blob(pool.x, pool.y, u(POOL.r), u(POOL.r - 0.2), 8, 2, 0.1), C.water, { lift: 0.2, print: (p, b) => { p.strokeStyle = C.waterLight; p.lineWidth = u(0.09); p.lineCap = 'round'; for (let i = 0; i < 10; i++) { const y = b.y0 + u(0.5) + i * (b.h / 10), x = b.x0 + u(0.8) + (i % 4) * u(1.1); p.beginPath(); p.moveTo(x, y); p.quadraticCurveTo(x + u(0.5), y - u(0.14), x + u(1), y); p.stroke() } } })
  for (let i = 0; i < 7; i++) { const a = r() * 6.28, d = r() * u(POOL.r - 0.9); sheet(c, ellipse(pool.x + Math.cos(a) * d, pool.y + Math.sin(a) * d, u(0.44), u(0.34), 18), '#7fbf8a', { lift: 0.2 }) }
  for (let i = 0; i < 500; i++) {
    const x = (r() - 0.5) * SIZE, z = (r() - 0.5) * SIZE
    if (!onIsland(x, z, 0.86)) continue
    const q = toPx(x, z), col = ['#f6c3cf', '#ffffff', '#f2a8b8', '#fbe9a8'][i % 4]
    for (let k = 0; k < 5; k++) sheet(c, ellipse(q.x + Math.cos(k * 1.257) * u(0.07), q.y + Math.sin(k * 1.257) * u(0.07), u(0.06), u(0.045), 8), col, { lift: 0.1, edge: false, tone: 0 })
  }
}

const SIGNS = [
  [2.6, 9.4, 'แดนเซียน', 'แดนเซียนเหนือเมฆ', 'เกาะหยกลอยอยู่กลางทะเลหมอก เซียนฝึกวิชากันที่นี่มานับพันปี เดินตามทางหินไปได้ทุกเกาะ'],
  [3.4, -10.2, 'หอคัมภีร์', 'หอเก้าชั้นฟ้า', 'เจดีย์หลังคาหยกเก็บคัมภีร์วิชากระบี่ ยิ่งชั้นสูงยิ่งลึกล้ำ'],
  [15.6, 0.6, 'สวนท้อ', 'สวนท้อพันปี', 'ต้นท้อออกดอกทั้งปี ว่ากันว่ากินผลแล้วอายุยืนอีกร้อยปี'],
  [-15, 0.4, 'สระบัว', 'สระบัวกระจกฟ้า', 'นกกระเรียนมาพักขาริมสระ น้ำใสจนเห็นเมฆลอยอยู่ข้างใต้'],
  [3.6, 3.4, 'ลานธูป', 'ลานกระถางธูป', 'ควันธูปลอยตรงขึ้นฟ้าไม่เคยขาดสาย เซียนน้อยต้องมาเติมทุกเช้า'],
]

const TOURS = { walk: { start: { x: 3.6, z: 10.2 }, speed: 3.4, wait: 0.5, fadein: true, points: [[3.4, 6], [0.3, 4.6], [2.4, 2.8], [2.6, -0.2], [1, -1.3]] } }
const TOUR = TOURS[new URLSearchParams(location.search).get('tour')] ?? null

async function build() {
  await Promise.all([400, 600, 700].map(w => document.fonts.load(`${w} 40px Kanit`)))
  const playerCard = card([0, 1].map(frame => paint(180, 250, c => kid(c, { frame }))), { height: 1.75 })
  const world = createWorld({
    title: 'แดนเซียน', subtitle: 'kradas · เกาะหยกเหนือทะเลหมอก', size: SIZE, ground: groundTexture(PX, c => { drawGround(c); grain(c, 0.28) }), walkable, start: TOUR ? TOUR.start : { x: 3.6, z: 10.2 }, tour: TOUR, view: TOUR ? { height: 10.5, back: 14.5, ahead: 5 } : {}, player: playerCard,
    background: '#e6eeec', sky: skyTexture('#8fc9d0', '#fbe6d6'),
    theme: { hemiSky: '#f4fbff', hemiGround: '#b4c7ae', hemi: 2.05, sun: '#fff0dc', sunPower: 2.3, vignette: '#3a4f66', fogNear: 30, fogFar: 62, petalColors: ['#f6c3cf', '#ffffff', '#f2a8b8', '#fbe9d0'], bloom: 0.1 },
  })
  const { place, addSign, solid, onUpdate, addPortal, addLight } = world
  const put = (art, height, opts, extra = {}) => place(card(art, { height, ...extra }), opts)

  addPortal(card(paint(460, 460, c => moonGate(c)), { height: 4.8 }), { x: 0, z: 12.2, href: '../walk-village/?from=immortal' })

  const hall = {
    front: paintFlat(440, 300, c => {
      sheet(c, [P(0, 132), P(220, 2), P(440, 132)], '#f3ead6', { lift: 0, print: p => { p.fillStyle = '#d9a441'; p.beginPath(); p.arc(220, 96, 26, 0, 7); p.fill() } })
      sheet(c, rect(0, 130, 440, 170), '#f3ead6', { lift: 0 })
      sheet(c, rect(0, 130, 440, 16), '#3f8f8a', { lift: 0.4 })
      for (let i = 0; i < 5; i++) sheet(c, rect(8 + i * 101, 146, 20, 154), '#b3352a', { lift: 0.6 })
      sheet(c, rect(170, 176, 100, 124), '#8c2a22', { lift: 0.4, print: (p, b) => { p.strokeStyle = '#d9a441'; p.lineWidth = 4; p.strokeRect(b.x0 + 8, b.y0 + 8, b.w - 16, b.h); p.beginPath(); p.moveTo(b.cx, b.y0 + 8); p.lineTo(b.cx, b.y1); p.stroke() } })
      for (const x of [60, 330]) sheet(c, ellipse(x + 25, 214, 30, 30, 26), '#bfe3dc', { lift: 0.3, print: (p, b) => { p.strokeStyle = '#8c2a22'; p.lineWidth = 4; for (let k = -2; k <= 2; k++) { p.beginPath(); p.moveTo(b.cx + k * 12, b.y0); p.lineTo(b.cx + k * 12, b.y1); p.stroke() } } })
    }),
    side: paintFlat(300, 170, c => {
      sheet(c, rect(0, 0, 300, 170), '#efe5d0', { lift: 0 })
      sheet(c, rect(0, 0, 300, 16), '#3f8f8a', { lift: 0.4 })
      for (let i = 0; i < 4; i++) sheet(c, rect(6 + i * 90, 16, 18, 154), '#b3352a', { lift: 0.6 })
    }),
    roof: paintFlat(256, 256, c => {
      c.fillStyle = '#3f8f8a'
      c.fillRect(0, 0, 256, 256)
      shingles(c, { x0: 0, y0: 0, x1: 256, y1: 256 }, '#2d6b68', 32, 32)
      shingles(c, { x0: 0, y0: 3, x1: 256, y1: 259 }, '#6fb5ae', 32, 32)
    }, 1),
  }
  place(foldedHouse({ ...hall, width: 5.2, depth: 3.2, wallH: 2, gableH: 1.5, stilts: 0, overhang: 0.6 }), { x: 0, z: -3.4, reach: 16 })
  for (const x of [-2, 0, 2]) solid(x, -3.4, 1.7)

  put(paint(420, 800, c => pagoda(c, { tiers: 6 })), 9.4, { x: 0, z: -18.6, reach: 17 }, { cross: true })
  solid(0, -18.6, 1.8)
  const smallPagoda = paint(420, 520, c => pagoda(c, { tiers: 3, roof: '#4a7fa8' }))
  ;[[-6, -16.4], [6, -16.4]].forEach(([x, z]) => { put(smallPagoda, 5.4, { x, z, reach: 15 }, { cross: true }); solid(x, z, 1.4) })
  put(paint(200, 360, c => incenseBurner(c)), 2.9, { x: 0, z: 1.4, reach: 14 })
  solid(0, 1.4, 0.8)

  const lanternArt = paint(120, 220, c => stoneLantern(c))
  ;[[-1.9, 7], [1.9, 7], [-1.9, -8], [1.9, -8], [8, 1.5], [-8, 1.5], [-1.9, -12.6], [1.9, -12.6]].forEach(([x, z], i) => {
    put(lanternArt, 1.7, { x, z, reach: 13 })
    solid(x, z, 0.3)
    if (i < 6) addLight(x, 1.2, z + 0.3, '#ffd98a', 6, 5)
  })

  const pineArt = [0, 1, 2].map(i => paint(460, 470, c => pine(c, { seed: 3 + i * 5 })))
  const blossomArt = [0, 1, 2].map(i => paint(520, 460, c => blossomTree(c, { seed: 2 + i * 4, colors: [['#f2a8b8', '#f6c3cf', '#e88aa0'], ['#f6c3cf', '#ffffff', '#f2a8b8'], ['#e88aa0', '#f2a8b8', '#f6c3cf']][i] })))
  const bambooArt = [0, 1].map(i => paint(360, 480, c => bamboo(c, { seed: 2 + i * 5 })))
  const bedArt = [['#f2a8b8', '#fbf2df', '#c98bd0'], ['#bfe3dc', '#ffffff', '#f6c3cf']].map((colors, i) => paint(280, 110, c => flowerBed(c, { seed: i + 2, colors })))
  const rockArt = [0, 1].map(i => paint(200, 80, c => rocks(c, { seed: 3 + i * 4 })))
  const craneArt = paint(220, 250, c => crane(c))
  const lotusArt = [0, 1].map(i => paint(110, 210, c => lotusFlower(c, { seed: i + 1, height: 100 + i * 30 })))

  const taken = [[0, 9.6, 2.4], [0, 12.2, 3.4], [0, -3.4, 4.2], [0, 1.4, 3.6], [0, -18, 8.6], [POOL.x, POOL.z, POOL.r + 1], ...SIGNS.map(s => [s[0], s[1], 1.3])]
  const nearPath = (x, z) => (Math.abs(x) < 1.7 && z > -14) || (Math.abs(z - 3) < 1.5 && Math.abs(x) < 19)
  const r = rng(21)
  const scatter = (count, pad, shrink, fn, region = null) => {
    for (let n = 0, tries = 0; n < count && tries < count * 90; tries++) {
      const x = (r() - 0.5) * 56, z = -24 + r() * 38
      if (!onIsland(x, z, shrink) || nearPath(x, z) || (region && !region(x, z)) || !taken.every(([tx, tz, tr]) => Math.hypot(x - tx, z - tz) > tr + pad)) continue
      taken.push([x, z, pad])
      fn(x, z, n++)
    }
  }
  scatter(9, 1.5, 0.86, (x, z, i) => { put(blossomArt[i % 3], 4.6, { x, z, reach: 14, sway: 0.02 }, { cross: true }); solid(x, z, 0.4) }, x => x > 11.5)
  scatter(16, 1.7, 0.9, (x, z, i) => { put(pineArt[i % 3], 4.9, { x, z, reach: 14, sway: 0.012 }, { cross: true }); solid(x, z, 0.4) }, x => x < 11)
  scatter(6, 1.6, 0.86, (x, z, i) => { put(blossomArt[(i + 1) % 3], 4.2, { x, z, reach: 14, sway: 0.02 }, { cross: true }); solid(x, z, 0.4) }, x => Math.abs(x) < 11)
  scatter(6, 1.4, 0.86, (x, z, i) => { put(bambooArt[i % 2], 4.4, { x, z, reach: 13, sway: 0.035 }, { cross: true }); solid(x, z, 0.5) }, x => x < -11.5)
  scatter(18, 0.8, 0.84, (x, z, i) => put(bedArt[i % 2], 0.85, { x, z, reach: 11 }, { back: false }))
  scatter(10, 0.8, 0.86, (x, z, i) => put(rockArt[i % 2], 0.7, { x, z, reach: 11 }))
  scatter(5, 1, 0.84, (x, z, i) => { const p = put(craneArt, 1.7, { x, z, reach: 12 }); if (i % 2) p.root.userData.pivot.scale.x = -1 })
  ;[[POOL.x - 3.8, POOL.z + 0.6], [POOL.x + 3.7, POOL.z + 1.2]].forEach(([x, z], i) => { const p = put(craneArt, 1.7, { x, z, reach: 12 }); if (i) p.root.userData.pivot.scale.x = -1 })
  for (let i = 0; i < 8; i++) {
    const a = i * 0.8 + 0.3, d = 0.6 + (i % 3) * 0.7
    put(lotusArt[i % 2], 1.2 + (i % 2) * 0.3, { x: POOL.x + Math.cos(a) * d, z: POOL.z + Math.sin(a) * d * 0.8, reach: 11, sway: 0.05 }, { back: false })
  }
  addLight(POOL.x, 1, POOL.z, '#a8fff0', 7, 7)

  for (const [x, z, label, heading, text] of SIGNS) addSign(card(paint(280, 270, c => signBoard(c, { title: label, color: '#eef6f2' })), { height: 1.9 }), { x, z, title: heading, text })

  const peakArt = [0, 1, 2].map(i => paint(360, 480 + i * 60, c => floatingPeak(c, { seed: 2 + i * 3, h: 400 + i * 60 })))
  const peaks = [[-24, 3, -22, 9], [-13, 6, -28, 8], [14, 5, -27, 8.5], [25, 2.5, -20, 10], [-27, 4, -6, 7], [27, 5, -8, 7.5], [3, 9, -31, 7]].map(([x, y, z, h], i) => ({ root: put(peakArt[i % 3], h, { x, z, y, always: true }, { back: false }).root, y, i }))
  const cloudArt = [0, 1, 2].map(i => paint(460, 180, c => cloud(c, { rx: 200, ry: 70, seed: 3 + i * 4 })))
  const mist = []
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * Math.PI * 2, x = Math.cos(a) * (19 + (i % 3) * 5), z = 2 + Math.sin(a) * (14 + (i % 4) * 3)
    if (onIsland(x, z, 1.05)) continue
    mist.push({ root: put(cloudArt[i % 3], 2.2 + (i % 3) * 0.6, { x, z, y: -0.3, always: true }, { back: false, glow: true }).root, x, i })
  }
  const sky = [[-20, 15], [0, 17], [18, 14.5], [32, 16.5]].map(([x, y], i) => ({ root: put(cloudArt[i % 3], 3 + (i % 2), { x, z: -34, y, always: true }, { back: false }).root, x }))
  const riderArt = [paint(340, 180, c => swordRider(c)), paint(340, 180, c => swordRider(c, { robe: '#dfe9f2', sash: '#b3352a' }))]
  const riders = [[-30, 9, -16, 2.6], [10, 11.5, -22, 2], [-8, 7.4, -9, 3.1]].map(([x, y, z, speed], i) => ({ root: put(riderArt[i % 2], 1.5, { x, z, y, always: true }).root, x, y, speed, i }))
  const flyArt = [0, 1].map(frame => paint(200, 110, c => crane(c, { fly: true, frame })))
  const flock = [...Array(5)].map((_, i) => ({ root: put(flyArt, 1.1, { x: 30 - i * 2.2, z: -13 - (i % 2) * 1.6, y: 8 + (i % 3) * 0.5, always: true }, { back: false }).root, off: i * 2.2, i }))

  const robes = [['#eef2f5', '#4a7fa8'], ['#f3ead6', '#3f8f8a'], ['#e9e2f2', '#8a5fb0'], ['#f6e4e2', '#b3352a']]
  const routes = [[[-9, 3], [-1.8, 3], 1.1], [[2, 3], [16, 3], 1.2], [[0, -5.6], [0, -12.6], 0.9], [[-6, 7], [6, 7.6], 1], [[-5, -14.6], [5, -14.6], 0.8]]
  const walkers = routes.map(([a, b, speed], i) => {
    const [robe, sash] = robes[i % 4], frames = [0, 1].map(frame => paint(200, 290, c => immortal(c, { frame, robe, sash, sword: i % 2 === 0 })))
    return { p: put(frames, 2.1, { x: a[0], z: a[1], reach: 14 }), a, b, speed, len: Math.hypot(b[0] - a[0], b[1] - a[1]) }
  })
  ;[[-2.6, -0.4, 0], [2.8, -0.2, 1], [19.4, 5.4, 2]].forEach(([x, z, i]) => put(paint(200, 290, c => immortal(c, { robe: robes[i][0], sash: robes[i][1], sword: false })), 2.1, { x, z, reach: 13 }))

  onUpdate((t, dt) => {
    for (const p of peaks) p.root.position.y = p.y + Math.sin(t * 0.4 + p.i * 1.7) * 0.5
    for (const m of mist) m.root.position.x = m.x + Math.sin(t * 0.12 + m.i) * 2.2
    for (const s of sky) s.root.position.x = s.x + Math.sin(t * 0.05 + s.x) * 3
    for (const rd of riders) {
      rd.x += rd.speed * dt
      if (rd.x > 36) rd.x = -36
      rd.root.position.x = rd.x
      rd.root.position.y = rd.y + Math.sin(t * 0.9 + rd.i * 2) * 0.5
      rd.root.userData.pivot.rotation.z = Math.sin(t * 0.9 + rd.i * 2 + 1.2) * 0.08
    }
    const lead = 34 - ((t * 2.2) % 76)
    for (const f of flock) {
      f.root.position.x = lead + f.off
      f.root.userData.pivot.scale.x = -1
      setFrame(f.root, Math.floor(t * 3 + f.i) % 2)
    }
    for (const w of walkers) {
      const cycle = (t * w.speed / w.len + w.len) % 2, k = cycle < 1 ? cycle : 2 - cycle, dir = cycle < 1 ? 1 : -1
      w.p.x = w.a[0] + (w.b[0] - w.a[0]) * k
      w.p.z = w.a[1] + (w.b[1] - w.a[1]) * k
      w.p.root.position.x = w.p.x
      w.p.root.position.z = w.p.z
      const piv = w.p.root.userData.pivot, facing = Math.sign((w.b[0] - w.a[0]) * dir) || 1
      piv.scale.x += (facing - piv.scale.x) * Math.min(1, dt * 8)
      piv.position.y = 0.12 + Math.sin(t * 1.6 + w.len) * 0.06
      setFrame(w.p.root, Math.floor(t * w.speed * 1.2) % 2)
    }
  })
  world.start()
}

build()

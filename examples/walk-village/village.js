import * as THREE from 'three'
import { P, rng, shade } from '../../lib/core.js'
import { sheet, ellipse, blob, rect, wave, strip, grain } from '../../lib/paper.js'
import { shingles, chofa, palmTree, bananaTree, bush, lotusFlower, kid, stall, temple, signBoard, cloud, hillRange, rowBoat, palette, planks } from '../../lib/props.js'
import { sala, spiritHouse, chedi, haystack, fence, flagLine, lampPost, well, cart, clothesline, parasol, mangoTree, frangipani, bamboo, flowerBed, riceRow, reeds, rocks, scarecrow, kite, pierPosts } from '../../lib/props-places.js'
import { moonGate, hornGate } from '../../lib/props-realms.js'
import { villager, monk, buffalo, egret, chicken, duck, bird, butterfly } from '../../lib/props-life.js'
import { paint, paintFlat, card, stack, foldedHouse, setFrame, groundTexture, skyTexture } from '../../world/cards.js'
import { createWorld } from '../../world/engine.js'

const SIZE = 64, PX = Math.min(innerWidth, innerHeight) < 700 ? 2048 : 4096, U = PX / SIZE
const CANAL = { z0: -3.6, z1: 0.6 }, BRIDGE = 1.5
const POND = { x: 15, z: 13, r: 3.4 }
const TEMPLE = { z: -19 }
const FIELDS = [[8, 18.5, 29, 29], [-29, 18.5, -8, 29]]
const NORTH_HOUSES = [-22, -15, -8, 8, 15, 22]
const SOUTH_HOUSES = [[-18.5, 8], [19, 7.6]]
const PIERS = [-10, 9.5]

const PATHS = [
  [[[0, 30], [0.6, 22], [-0.3, 12], [0, 1]], 2.6],
  [[[0, -4], [0, -11]], 2.6],
  [[[-30, 4.4], [-12, 4], [0, 4.3], [12, 3.9], [30, 4.4]], 2],
  [[[-30, -6.4], [30, -6.4]], 1.8],
  [[[-0.2, 10.5], [-6, 11.4], [-12, 12]], 1.8],
  [[[0.4, 11], [8, 11.4], [11.5, 12.2]], 1.6],
  [[[0.5, 17.6], [10, 17.4], [29, 17.6]], 1.4],
  [[[-0.5, 17.6], [-12, 17.4], [-29, 17.6]], 1.4],
]

const toPx = (x, z) => P((x + SIZE / 2) * U, (z + SIZE / 2) * U)
const u = v => v * U

const C = {
  grass: '#a3bb6e',
  grassDark: '#8aa85c',
  grassLight: '#b9cc82',
  path: '#e0c897',
  pathDark: '#c9ac74',
  bank: '#bfa268',
  earth: '#d2b783',
  stone: '#ece2cc',
  stoneDark: '#d6c9aa',
  water: '#3d8a86',
  waterLight: '#5aa89c',
  waterDeep: '#2f7471',
  paddy: '#b9cf7c',
  paddyB: '#a6c36c',
  paddyRipe: '#d9c668',
}

function segmentDistance(x, z, a, b) {
  const dx = b[0] - a[0], dz = b[1] - a[1], k = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz)))
  return Math.hypot(x - a[0] - dx * k, z - a[1] - dz * k)
}

function onPath(x, z, pad = 0) {
  return PATHS.some(([pts, w]) => pts.some((p, i) => i && segmentDistance(x, z, pts[i - 1], p) < w / 2 + pad))
}

function inField(x, z, pad = 0) {
  return FIELDS.some(([x0, z0, x1, z1]) => x > x0 - pad && x < x1 + pad && z > z0 - pad && z < z1 + pad)
}

function drawPath(c, pts, width, r) {
  const line = offset => {
    c.beginPath()
    pts.forEach((p, i) => { const q = toPx(p[0], p[1]); i ? c.lineTo(q.x + offset, q.y + offset * 1.3) : c.moveTo(q.x + offset, q.y + offset * 1.3) })
    c.stroke()
  }
  c.save()
  c.lineCap = 'round'
  c.lineJoin = 'round'
  c.strokeStyle = 'rgba(74,44,22,0.2)'
  c.lineWidth = u(width) + u(0.14)
  line(u(0.06))
  c.strokeStyle = C.pathDark
  c.lineWidth = u(width) + u(0.05)
  line(0)
  c.strokeStyle = C.path
  c.lineWidth = u(width) - u(0.12)
  line(0)
  c.restore()
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], len = Math.hypot(b[0] - a[0], b[1] - a[1])
    for (let k = 0; k < len * 2.2; k++) {
      const t = r(), off = (r() - 0.5) * (width - 0.5), q = toPx(a[0] + (b[0] - a[0]) * t + off * 0.5, a[1] + (b[1] - a[1]) * t + off)
      sheet(c, ellipse(q.x, q.y, u(0.06 + r() * 0.1), u(0.04 + r() * 0.06), 8), r() > 0.5 ? shade(C.path, 0.2) : shade(C.pathDark, -0.08), { lift: 0.15, edge: false, tone: 0 })
    }
  }
}

function drawPaddies(c, r) {
  for (const [x0, z0, x1, z1] of FIELDS) {
    const a = toPx(x0, z0), b = toPx(x1, z1)
    sheet(c, rect(a.x, a.y, b.x - a.x, b.y - a.y), C.bank, { lift: 0.4 })
    const cols = 4, rows = 2, cw = (x1 - x0 - 0.5) / cols, ch = (z1 - z0 - 0.5) / rows
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      const p = toPx(x0 + 0.5 + i * cw, z0 + 0.5 + j * ch), ripe = r() > 0.72, col = ripe ? C.paddyRipe : (i + j) % 2 ? C.paddy : C.paddyB
      sheet(c, rect(p.x, p.y, u(cw - 0.5), u(ch - 0.5)), col, {
        lift: 0.25,
        print: (g, bb) => {
          g.strokeStyle = shade(col, -0.2)
          g.lineWidth = u(0.07)
          g.lineCap = 'round'
          g.setLineDash([u(0.16), u(0.26)])
          for (let y = bb.y0 + u(0.3); y < bb.y1; y += u(0.42)) { g.beginPath(); g.moveTo(bb.x0 + u(0.2), y); g.lineTo(bb.x1 - u(0.2), y); g.stroke() }
          g.setLineDash([])
        },
      })
    }
  }
}

function drawCourtyard(c) {
  const a = toPx(-10, -25), b = toPx(10, -11)
  sheet(c, rect(a.x, a.y, b.x - a.x, b.y - a.y), C.stoneDark, { lift: 0.5 })
  sheet(c, rect(a.x + u(0.4), a.y + u(0.4), b.x - a.x - u(0.8), b.y - a.y - u(0.8)), C.stone, {
    lift: 0.2,
    print: (p, bb) => {
      p.strokeStyle = C.stoneDark
      p.lineWidth = u(0.05)
      for (let x = bb.x0; x < bb.x1; x += u(1.2)) { p.beginPath(); p.moveTo(x, bb.y0); p.lineTo(x, bb.y1); p.stroke() }
      for (let y = bb.y0; y < bb.y1; y += u(1.2)) { p.beginPath(); p.moveTo(bb.x0, y); p.lineTo(bb.x1, y); p.stroke() }
    },
  })
  const m = toPx(0, -13.6)
  sheet(c, ellipse(m.x, m.y, u(2), u(1.5), 40), '#e3d3ad', { lift: 0.2 })
  for (let i = 0; i < 10; i++) {
    const ang = i * Math.PI / 5
    sheet(c, ellipse(m.x + Math.cos(ang) * u(1.15), m.y + Math.sin(ang) * u(0.86), u(0.55), u(0.26), 14, ang), i % 2 ? '#e8a9b6' : '#f3c7cf', { lift: 0.15, edgeScale: 0.7 })
  }
  sheet(c, ellipse(m.x, m.y, u(0.5), u(0.38), 20), '#f4d04a', { lift: 0.2 })
}

function drawGround(c) {
  const r = rng(5)
  c.fillStyle = C.grass
  c.fillRect(0, 0, PX, PX)
  for (let i = 0; i < 240; i++) sheet(c, blob(r() * PX, r() * PX, u(0.9 + r() * 2), u(0.5 + r() * 0.9), 5, i, 0.2), r() > 0.5 ? C.grassDark : C.grassLight, { lift: 0.2, edge: false, tone: 0 })
  c.lineCap = 'round'
  c.lineWidth = u(0.035)
  for (let i = 0; i < 5200; i++) {
    const x = r() * PX, y = r() * PX
    c.strokeStyle = r() > 0.5 ? shade(C.grassDark, -0.12) : shade(C.grassLight, 0.16)
    c.beginPath()
    for (const d of [-0.07, 0, 0.07]) { c.moveTo(x + u(d), y); c.lineTo(x + u(d * 2.4), y - u(0.16 + r() * 0.08)) }
    c.stroke()
  }
  drawPaddies(c, r)
  for (const x of NORTH_HOUSES) { const p = toPx(x, -8); sheet(c, blob(p.x, p.y, u(3.3), u(1.9), 6, x + 40, 0.14), C.earth, { lift: 0.2 }) }
  for (const [x, z] of SOUTH_HOUSES) { const p = toPx(x, z + 0.4); sheet(c, blob(p.x, p.y, u(3.3), u(1.9), 6, 7, 0.14), C.earth, { lift: 0.2 }) }
  const market = toPx(-12, 13)
  sheet(c, blob(market.x, market.y, u(6.4), u(3.2), 7, 3, 0.1), C.earth, { lift: 0.2 })
  const north = toPx(0, CANAL.z0 - 0.7).y, south = toPx(0, CANAL.z1 + 0.7).y
  sheet(c, rect(0, north, PX, south - north), C.bank, { lift: 0.4 })
  for (let x = 0; x < PX; x += u(0.9)) {
    for (const y of [north + u(0.42), south - u(0.5)]) sheet(c, blob(x + r() * u(0.3), y + r() * u(0.1), u(0.34), u(0.2), 4, x, 0.1), r() > 0.5 ? '#cfc7b4' : '#b9b3a4', { lift: 0.15, edgeScale: 0.6 })
  }
  drawCourtyard(c)
  for (const [pts, w] of PATHS) drawPath(c, pts, w, r)
  for (const x of PIERS) {
    const p = toPx(x - 0.8, CANAL.z1 - 0.9)
    sheet(c, rect(p.x, p.y, u(1.6), u(2.4)), palette.wood, { lift: 0.5, print: (g, b) => planks(g, b, shade(palette.wood, -0.25), u(0.3), false, u(0.05)) })
  }
  const garden = toPx(20, 10.6)
  sheet(c, rect(garden.x, garden.y, u(6), u(4.6)), '#a9794e', {
    lift: 0.3,
    print: (g, b) => {
      for (let row = 0; row < 6; row++) {
        const y = b.y0 + u(0.5) + row * u(0.72)
        g.fillStyle = '#8f6238'
        g.fillRect(b.x0 + u(0.3), y - u(0.14), b.w - u(0.6), u(0.28))
        for (let x = b.x0 + u(0.5); x < b.x1 - u(0.4); x += u(0.46)) sheet(g, blob(x, y, u(0.19), u(0.15), 5, row * 9 + x, 0.25), row % 2 ? '#6f9a4a' : '#8fb552', { lift: 0.12, edgeScale: 0.5 })
      }
    },
  })
  const pond = toPx(POND.x, POND.z)
  sheet(c, blob(pond.x, pond.y, u(POND.r + 0.55), u(POND.r + 0.35), 7, 4, 0.12), C.bank, { lift: 0.4 })
  sheet(c, blob(pond.x, pond.y, u(POND.r), u(POND.r - 0.2), 7, 4, 0.12), C.water, {
    lift: 0.2,
    print: (p, b) => {
      p.strokeStyle = C.waterLight
      p.lineWidth = u(0.09)
      p.lineCap = 'round'
      for (let i = 0; i < 12; i++) { const y = b.y0 + u(0.5) + i * (b.h / 12), x = b.x0 + u(0.8) + (i % 4) * u(1.2); p.beginPath(); p.moveTo(x, y); p.quadraticCurveTo(x + u(0.5), y - u(0.14), x + u(1), y); p.stroke() }
    },
  })
  for (let i = 0; i < 9; i++) {
    const a = r() * 6.28, d = r() * u(POND.r - 0.9), x = pond.x + Math.cos(a) * d, y = pond.y + Math.sin(a) * d * 0.9
    const pad = ellipse(x, y, u(0.46), u(0.36), 20)
    pad.splice(2, 2, P(x + u(0.1), y + u(0.03)))
    sheet(c, pad, i % 3 ? palette.lotusPad : '#7aa25a', { lift: 0.2 })
  }
  for (let i = 0; i < 420; i++) {
    const x = (r() - 0.5) * 62, z = (r() - 0.5) * 62
    if (onPath(x, z, 0.1) || inField(x, z) || (z > CANAL.z0 - 0.8 && z < CANAL.z1 + 0.8) || (Math.abs(x) < 10 && z < -11 && z > -25)) continue
    const q = toPx(x, z), col = ['#f4e2a8', '#e97e5e', '#fbf2df', '#f2a8b8'][i % 4]
    for (let k = 0; k < 5; k++) sheet(c, ellipse(q.x + Math.cos(k * 1.257) * u(0.07), q.y + Math.sin(k * 1.257) * u(0.07), u(0.06), u(0.045), 8), col, { lift: 0.1, edge: false, tone: 0 })
    sheet(c, ellipse(q.x, q.y, u(0.04), u(0.04), 8), '#e0a030', { lift: 0, edge: false, tone: 0 })
  }
}

function waterTexture() {
  return groundTexture(512, (c, s) => {
    c.fillStyle = C.water
    c.fillRect(0, 0, s, s)
    for (let i = 0; i < 8; i++) sheet(c, wave(-40, s + 40, 20 + i * 64, 20, 8, 128, i), i % 2 ? C.waterLight : C.waterDeep, { lift: 0.3, edgeScale: 0.7 })
  })
}

function bridgeDeck(scene) {
  const tex = groundTexture(512, (c, s) => {
    c.fillStyle = palette.wood
    c.fillRect(0, 0, s, s)
    planks(c, { x0: 0, y0: 0, x1: s, y1: s }, shade(palette.wood, -0.3), 40, false, 5)
    c.fillStyle = shade(palette.woodDark, -0.1)
    c.fillRect(0, 0, 26, s)
    c.fillRect(s - 26, 0, 26, s)
  })
  const deck = new THREE.Mesh(new THREE.PlaneGeometry(BRIDGE * 2 + 0.6, CANAL.z1 - CANAL.z0 + 1.6), new THREE.MeshLambertMaterial({ map: tex }))
  deck.rotation.x = -Math.PI / 2
  deck.position.set(0, 0.09, (CANAL.z0 + CANAL.z1) / 2)
  deck.receiveShadow = true
  deck.castShadow = true
  scene.add(deck)
}

function walkable(x, z) {
  if (Math.abs(x) > 29.5 || z > 29.5 || z < -27) return false
  if (z > CANAL.z0 - 0.2 && z < CANAL.z1 + 0.2 && Math.abs(x) > BRIDGE - 0.35) return false
  if (Math.hypot(x - POND.x, z - POND.z) < POND.r - 0.3) return false
  return true
}

const SIGNS = [
  [2.4, 9, 'ยินดีต้อนรับ', 'หมู่บ้านกระดาษริมคลอง', 'ทุกอย่างที่นี่นอนราบเป็นลายบนกระดาษ แล้วพับตั้งขึ้นเมื่อคุณเดินเข้าใกล้ ลองเดินข้ามสะพานไปทางวัดดูสิ'],
  [2.8, 2.2, 'สะพานไม้', 'สะพานข้ามคลอง', 'ทางเดียวที่ข้ามไปฝั่งเหนือได้ เรือพายกับเรือขายผลไม้ยังล่องผ่านใต้สะพานอยู่ทั้งวัน'],
  [-3.2, -5.2, 'เรือนไทย', 'เรือนไทยใต้ถุนสูง', 'ยกพื้นสูงหนีน้ำหลาก ใต้ถุนบ้านไว้เก็บโอ่งน้ำ นั่งเล่น และผูกเรือ หลังคาจั่วชันให้ฝนไหลเร็ว'],
  [3.6, -10.4, 'วัดริมคลอง', 'วัดประจำชุมชน', 'หลังคาซ้อนกันหลายชั้น ปลายจั่วมีช่อฟ้า ใบระกา และหางหงส์ เป็นที่รวมใจของคนทั้งคลอง'],
  [-8.4, -13.4, 'เจดีย์', 'เจดีย์ทรงระฆัง', 'องค์ระฆังสีขาว ยอดปล้องไฉนสีทองซ้อนขึ้นไปถึงปลียอด'],
  [-6.4, 10.2, 'ตลาดเช้า', 'ตลาดเช้าริมทาง', 'แผงผลไม้ใต้ผ้าใบลายทาง แม่ค้าหาบกระจาดเดินขายตามทาง มาเช้าได้ของสด'],
  [11.4, 10.2, 'บึงบัว', 'บึงบัวหลังบ้าน', 'บัวหลวงชูดอกพ้นน้ำ เป็ดลอยเล่นอยู่กลางบึง ระวังตกน้ำนะ'],
  [-1.9, 21.6, 'ประตูเซียน', 'ประตูสู่แดนเซียน', 'ประตูวงพระจันทร์ เดินทะลุเข้าไปจะโผล่ที่เกาะหยกเหนือทะเลหมอก'],
  [1.9, 21.6, 'ประตูมาร', 'ประตูสู่แดนมาร', 'ประตูเขากระดูก เดินทะลุเข้าไปจะโผล่ใต้จันทร์เลือด ใจไม่ถึงอย่าเข้า'],
  [3, 18.8, 'ทุ่งนา', 'ทุ่งนาท้ายหมู่บ้าน', 'นาข้าวแบ่งเป็นกระทงด้วยคันนา แปลงสีทองคือข้าวสุกพร้อมเกี่ยว ควายกับนกกระยางเป็นเพื่อนกันมานาน'],
  [10.2, 2.7, 'ศาลาท่าน้ำ', 'ศาลาริมน้ำ', 'ที่นั่งพักรอเรือ หลบแดดตอนบ่าย และนั่งคุยกันตอนเย็น'],
]

const FROM = new URLSearchParams(location.search).get('from')
const TOURS = {
  walk: { start: { x: 0, z: 14.5 }, speed: 3.6, points: [[0.3, 9], [0, 4.2], [0, -5], [0, -9.6], [1.6, -12.2]] },
  gateA: { start: { x: 0, z: 19.4 }, speed: 3.6, wait: 0.5, points: [[-1.6, 22.4], [-4.6, 24.4]] },
  gateB: { start: { x: 0, z: 19.4 }, speed: 3.6, wait: 0.5, points: [[1.6, 22.4], [4.6, 24.4]] },
  close: { start: { x: -25, z: -6.3 }, speed: 3, wait: 0.4, points: [[-9, -6.3]] },
}
const QUERY = new URLSearchParams(location.search), TOUR = TOURS[QUERY.get('tour')] ?? null
const VIEW = QUERY.get('tour') === 'close' ? { height: 5.4, back: 10.5, lookY: 1.8, ahead: 1.5 } : TOUR ? { height: 10.5, back: 14.5, ahead: 5 } : {}
const START = TOUR ? TOUR.start : FROM === 'immortal' ? { x: -1.2, z: 23.4 } : FROM === 'demon' ? { x: 1.2, z: 23.4 } : { x: 0, z: 14.5 }

async function build() {
  await Promise.all([400, 600, 700].map(w => document.fonts.load(`${w} 40px Kanit`)))

  const kidFrames = [0, 1].map(frame => paint(180, 250, c => kid(c, { frame })))
  const playerCard = card(kidFrames, { height: 1.75 })
  const world = createWorld({ title: 'หมู่บ้านริมคลอง', size: SIZE, ground: groundTexture(PX, c => { drawGround(c); grain(c, 0.3) }), walkable, start: START, tour: TOUR, view: VIEW, player: playerCard, subtitle: 'kradas · แดนธรรมดา', background: '#f3e2bd', sky: skyTexture('#efbf80', '#f9e9c9') })
  const { scene, place, addSign, solid, onUpdate, addPortal } = world
  const put = (art, height, opts, extra = {}) => place(card(art, { height, ...extra }), opts)

  addPortal(card(paint(460, 460, c => moonGate(c)), { height: 4.6 }), { x: -4.6, z: 24.6, href: '../realm-immortal/' })
  addPortal(card(paint(520, 490, c => hornGate(c)), { height: 4.8 }), { x: 4.6, z: 24.6, href: '../realm-demon/' })

  const water = waterTexture()
  water.wrapS = water.wrapT = THREE.RepeatWrapping
  water.repeat.set(16, 1)
  const canal = new THREE.Mesh(new THREE.PlaneGeometry(SIZE, CANAL.z1 - CANAL.z0), new THREE.MeshLambertMaterial({ map: water }))
  canal.rotation.x = -Math.PI / 2
  canal.position.set(0, 0.03, (CANAL.z0 + CANAL.z1) / 2)
  canal.receiveShadow = true
  scene.add(canal)
  bridgeDeck(scene)

  const lampArt = ['#c2412d', '#f0a23a'].map(color => paint(160, 270, c => lampPost(c, { color })))
  ;[[-2.2, 1.2], [2.2, 1.2], [-2.2, -4.2], [2.2, -4.2]].forEach(([x, z], i) => {
    const p = put(lampArt[i % 2], 2.7, { x, z, reach: 12 })
    if (x < 0) p.root.userData.pivot.scale.x = -1
    solid(x, z, 0.2)
  })
  ;[[-6, 5.6], [8, 5.4], [-14, -5.4], [12, -5.4], [-2.4, -11.4], [2.4, -11.4]].forEach(([x, z], i) => { put(lampArt[(i + 1) % 2], 2.7, { x, z, reach: 11 }); solid(x, z, 0.2) })

  const houseStyles = [[palette.wallA, palette.roof], [palette.wallB, palette.roofB], ['#c9975f', '#7d5a3c'], ['#b9804f', '#9a4a2e']]
  const window = (c, x, y, wall) => {
    sheet(c, rect(x - 30, y - 4, 60, 64), shade(wall, 0.22), { lift: 0.5 })
    sheet(c, rect(x - 24, y + 2, 48, 52), '#f2c56b', { lift: 0.3, print: (p, b) => { p.strokeStyle = shade(wall, -0.3); p.lineWidth = 3; p.beginPath(); p.moveTo(b.cx, b.y0); p.lineTo(b.cx, b.y1); p.moveTo(b.x0, b.cy); p.lineTo(b.x1, b.cy); p.stroke() } })
    for (const sx of [-1, 1]) sheet(c, rect(x + sx * 42 - 13, y, 26, 58), shade(wall, 0.12), { lift: 0.6, print: (p, b) => planks(p, b, shade(wall, -0.15), 9, false) })
  }
  const houseParts = houseStyles.map(([wall, roof], i) => ({
    front: paintFlat(300, 300, c => {
      sheet(c, [P(0, 152), P(150, 2), P(300, 152)], palette.gable, {
        lift: 0,
        print: p => {
          p.strokeStyle = shade(palette.gable, -0.2)
          p.lineWidth = 2
          for (let k = 0; k < 13; k++) { const a = Math.PI + (k + 0.5) * Math.PI / 13; p.beginPath(); p.moveTo(150, 150); p.lineTo(150 + Math.cos(a) * 300, 150 + Math.sin(a) * 300); p.stroke() }
        },
      })
      sheet(c, rect(0, 150, 300, 150), wall, { lift: 0, print: (p, b) => planks(p, b, shade(wall, -0.18)) })
      sheet(c, rect(0, 150, 300, 12), shade(wall, -0.3), { lift: 0.4, edgeScale: 0.7 })
      sheet(c, rect(112, 176, 76, 124), shade(wall, 0.2), { lift: 0.5 })
      sheet(c, rect(120, 184, 60, 116), shade(wall, -0.45), { lift: 0.3 })
      window(c, i % 2 ? 56 : 244, 190, wall)
      const px = i % 2 ? 244 : 56
      sheet(c, [P(px - 18, 300), P(px + 18, 300), P(px + 14, 268), P(px - 14, 268)], '#b5553a', { lift: 0.5 })
      sheet(c, blob(px, 252, 26, 22, 5, i + 2, 0.25), palette.leaf, { lift: 0.5 })
      for (let k = 0; k < 4; k++) sheet(c, ellipse(px - 14 + k * 10, 244 - (k % 2) * 10, 5, 5, 8), k % 2 ? '#e97e5e' : '#f4e2a8', { lift: 0.2, edgeScale: 0.5 })
    }),
    side: paintFlat(260, 150, c => {
      sheet(c, rect(0, 0, 260, 150), shade(wall, -0.06), { lift: 0, print: (p, b) => planks(p, b, shade(wall, -0.22)) })
      sheet(c, rect(0, 0, 260, 12), shade(wall, -0.3), { lift: 0.4, edgeScale: 0.7 })
      window(c, 70, 44, wall)
      window(c, 190, 44, wall)
    }),
    roof: paintFlat(256, 256, c => {
      c.fillStyle = roof
      c.fillRect(0, 0, 256, 256)
      shingles(c, { x0: 0, y0: 0, x1: 256, y1: 256 }, shade(roof, -0.28), 32, 32)
      shingles(c, { x0: 0, y0: 3, x1: 256, y1: 259 }, shade(roof, 0.14), 32, 32)
    }, 1),
  }))
  const fasciaArt = paintFlat(396, 290, c => {
    const L = P(10, 262), R = P(386, 262), A = P(198, 78)
    sheet(c, strip(L, A, 18), palette.trim, { lift: 0.4 })
    sheet(c, strip(A, R, 18), palette.trim, { lift: 0.4 })
    chofa(c, P(198, 80), 1, palette.trim, 1.2)
    sheet(c, [L, P(L.x - 8, L.y - 30), P(L.x + 18, L.y - 6), P(L.x + 10, L.y + 16)], palette.trim, { lift: 0.4 })
    sheet(c, [R, P(R.x + 8, R.y - 30), P(R.x - 18, R.y - 6), P(R.x - 10, R.y + 16)], palette.trim, { lift: 0.4 })
  })
  fasciaArt.apexFrac = 78 / 290
  const ladderArt = paintFlat(80, 150, c => {
    sheet(c, rect(6, 0, 10, 150), palette.woodDark, { lift: 0.3 })
    sheet(c, rect(64, 0, 10, 150), palette.woodDark, { lift: 0.3 })
    for (let y = 14; y < 150; y += 26) sheet(c, rect(4, y, 72, 9), palette.wood, { lift: 0.4, edgeScale: 0.7 })
  })
  const house = (x, z, i) => {
    place(foldedHouse({ ...houseParts[i % 4], fascia: fasciaArt, ladder: ladderArt, width: 3.2, depth: 2.7, wallH: 1.6, gableH: 1.6, stilts: 1.2 }), { x, z, reach: 15 })
    solid(x, z, 1.9)
    solid(x, z + 1.6, 1)
  }
  NORTH_HOUSES.forEach((x, i) => house(x, -9, i))
  SOUTH_HOUSES.forEach(([x, z], i) => house(x, z, i + 2))

  const templeArt = ['body', 'roof'].map(part => paint(1000, 780, c => temple(c, { w: 560, part })))
  place(stack(templeArt, { height: 8.4, gap: 0.2 }), { x: 0, z: TEMPLE.z, reach: 15 })
  for (let x = -5; x <= 5; x += 1.25) solid(x, TEMPLE.z, 0.9)
  put(paint(360, 620, c => chedi(c)), 6.4, { x: -6.6, z: -15.6, reach: 14 })
  solid(-6.6, -15.6, 1.5)
  put(paint(560, 520, c => mangoTree(c, { seed: 4, fruits: false, ribbons: true, s: 1.1 })), 5.6, { x: 7, z: -15.2, reach: 13, sway: 0.015 })
  solid(7, -15.2, 0.4)
  const flagArt = paint(520, 270, c => flagLine(c))
  put(flagArt, 2.9, { x: 0, z: -10.9, reach: 12, sway: 0.01 })
  put(flagArt, 2.9, { x: -11.6, z: 10.6, reach: 11, sway: 0.01 })

  const spiritArt = paint(200, 330, c => spiritHouse(c))
  ;[[-11.4, -7.4], [18.6, -7.6], [-15.4, 9.6]].forEach(([x, z]) => { put(spiritArt, 2.3, { x, z, reach: 10 }); solid(x, z, 0.3) })

  put(paint(460, 420, c => sala(c)), 3.9, { x: 6.6, z: 1.9, reach: 12 })
  solid(5.2, 1.9, 0.5)
  solid(8, 1.9, 0.5)
  const pierArt = paint(160, 110, c => pierPosts(c))
  for (const x of PIERS) put(pierArt, 1, { x, z: CANAL.z1 - 0.5, reach: 10 })

  const stallStyles = [['#c2412d', 1, ['#e8a33d', '#d9533a', '#7aa25a']], ['#3f6b9a', 2, ['#f4d04a', '#7aa25a', '#e97e5e']], ['#5d8a48', 3, ['#d9533a', '#e8a33d', '#f4d04a']]]
  ;[[-12, 13.4], [-8.4, 14.2], [-15.6, 12.6]].forEach(([x, z], i) => {
    put(paint(420, 330, c => stall(c, { awning: stallStyles[i][0], seed: stallStyles[i][1], goods: stallStyles[i][2] })), 2.7, { x, z, reach: 11 })
    solid(x, z, 1.1)
  })
  ;[[-9.8, 11.2, '#d18a2c'], [-14.4, 15.2, '#c2412d']].forEach(([x, z, color]) => { put(paint(400, 320, c => parasol(c, { color })), 2.6, { x, z, reach: 11 }); solid(x, z, 0.6) })

  put(paint(260, 300, c => well(c)), 2.5, { x: 22.4, z: 6.2, reach: 11 })
  solid(22.4, 6.2, 0.8)
  put(paint(420, 250, c => cart(c)), 2.1, { x: -7.2, z: 16.4, reach: 11 })
  solid(-7.2, 16.4, 1)
  const hayArt = paint(260, 280, c => haystack(c))
  ;[[8.6, 16.4], [-24.4, 16.2], [26, -10.6]].forEach(([x, z]) => { put(hayArt, 2.5, { x, z, reach: 13 }, { cross: true }); solid(x, z, 0.9) })
  const clothArt = [paint(360, 220, c => clothesline(c)), paint(360, 220, c => clothesline(c, { cloths: ['#f6ead2', '#5d8a48', '#f0a23a', '#3f6b9a'] }))]
  ;[[-18.4, -10.6], [11.6, -10.8], [-22.4, 9.4]].forEach(([x, z], i) => put(clothArt[i % 2], 1.9, { x, z, reach: 10, sway: 0.02 }))
  const fenceArt = paint(320, 110, c => fence(c))
  ;[[18.6, 9.9], [21.4, 9.9], [24.2, 9.9], [18.6, 15.8], [21.4, 15.8], [24.2, 15.8], [-26, -11.4], [-23.2, -11.4], [23, -11.6], [20.2, -11.6]].forEach(([x, z]) => put(fenceArt, 0.95, { x, z, reach: 10 }, { back: false }))
  const scareArt = paint(220, 290, c => scarecrow(c))
  ;[[16, 23.4], [-11, 24.6]].forEach(([x, z]) => put(scareArt, 2.3, { x, z, reach: 12, sway: 0.03 }))

  const taken = [[0, 14.5, 2.5], [-4.6, 24, 3.6], [4.6, 24, 3.6], [POND.x, POND.z, POND.r + 1.2], [0, TEMPLE.z, 10.5], [-12, 13.2, 6], [6.6, 1.9, 2.6], [22.4, 6.2, 1.6], [23, 13, 4], ...NORTH_HOUSES.map(x => [x, -8.6, 3]), ...SOUTH_HOUSES.map(([x, z]) => [x, z, 3]), ...SIGNS.map(s => [s[0], s[1], 1.3])]
  const free = (x, z, pad) => walkable(x, z) && !onPath(x, z, 0.5) && !inField(x, z, 0.6) && (z < CANAL.z0 - 1.2 || z > CANAL.z1 + 1.4) && taken.every(([tx, tz, tr]) => Math.hypot(x - tx, z - tz) > tr + pad)
  const r = rng(12)
  const scatter = (count, pad, fn) => {
    for (let n = 0, tries = 0; n < count && tries < count * 80; tries++) {
      const x = (r() - 0.5) * 58, z = -26 + r() * 55
      if (!free(x, z, pad)) continue
      taken.push([x, z, pad])
      fn(x, z, n++)
    }
  }
  const palmArt = [0, 1, 2].map(i => paint(480, 470 + i * 60, c => palmTree(c, { h: 400 + i * 60, lean: [30, -40, 10][i], seed: 20 + i * 9 })))
  const bananaArt = [0, 1].map(i => paint(460, 400, c => bananaTree(c, { seed: 3 + i })))
  const mangoArt = [0, 1].map(i => paint(520, 480, c => mangoTree(c, { seed: 5 + i * 6, fruits: i === 0 })))
  const bambooArt = [0, 1].map(i => paint(360, 480, c => bamboo(c, { seed: 2 + i * 5 })))
  const frangiArt = paint(380, 340, c => frangipani(c))
  const bushArt = [0, 1, 2].map(i => paint(280, 170, c => bush(c, { rx: 120, ry: 66, seed: 4 + i * 3 })))
  const bedArt = [['#f0a23a', '#f4d04a', '#e97e5e'], ['#f2a8b8', '#fbf2df', '#c98bd0'], ['#f4d04a', '#fbf2df', '#f0a23a']].map((colors, i) => paint(280, 110, c => flowerBed(c, { seed: i + 2, colors })))
  const rockArt = [0, 1].map(i => paint(200, 80, c => rocks(c, { seed: 3 + i * 4 })))
  const reedArt = [0, 1].map(i => paint(160, 210, c => reeds(c, { seed: 2 + i * 7 })))
  const lotusArt = [0, 1].map(i => paint(110, 210, c => lotusFlower(c, { seed: i + 1, height: 100 + i * 30 })))

  ;[[12.4, 9.4], [18.4, 16.2], [-4.4, 7.2], [4.6, -12.4]].forEach(([x, z]) => { put(frangiArt, 3.2, { x, z, reach: 13, sway: 0.02 }, { cross: true }); solid(x, z, 0.3); taken.push([x, z, 1.4]) })
  scatter(8, 2.2, (x, z, i) => { put(mangoArt[i % 2], 5, { x, z, reach: 14, sway: 0.015 }, { cross: true }); solid(x, z, 0.4) })
  scatter(22, 1.5, (x, z, i) => { put(palmArt[i % 3], 4.4 + (i % 3) * 0.6, { x, z, reach: 14, sway: 0.03 }, { cross: true }); solid(x, z, 0.35) })
  scatter(10, 1.4, (x, z, i) => { put(bananaArt[i % 2], 3.2, { x, z, reach: 13, sway: 0.04 }, { cross: true }); solid(x, z, 0.35) })
  scatter(7, 1.6, (x, z, i) => { put(bambooArt[i % 2], 4.6, { x, z, reach: 13, sway: 0.035 }, { cross: true }); solid(x, z, 0.5) })
  scatter(22, 0.9, (x, z, i) => put(bushArt[i % 3], 1.1, { x, z, reach: 12 }, { cross: true }))
  scatter(18, 0.8, (x, z, i) => put(bedArt[i % 3], 0.85, { x, z, reach: 9 }, { back: false }))
  scatter(9, 0.8, (x, z, i) => put(rockArt[i % 2], 0.6, { x, z, reach: 9 }))
  const beds = [[-2.2, 6.4], [2.2, 12.6], [-1.9, -8.4], [1.9, -8.4], [-9, -11.6], [9, -11.6], [13.4, 17], [20.6, 16.6]]
  beds.forEach(([x, z], i) => put(bedArt[i % 3], 0.85, { x, z, reach: 9 }, { back: false }))
  for (let i = 0; i < 16; i++) {
    const x = -29 + i * 3.8 + r() * 1.4, south = i % 2
    if (Math.abs(x) < 3.2 || PIERS.some(px => Math.abs(px - x) < 1.6) || (south && Math.abs(x - 6.6) < 3)) continue
    put(reedArt[i % 2], 1.6, { x, z: south ? CANAL.z1 + 0.5 : CANAL.z0 - 0.5, reach: 10, sway: 0.05 }, { back: false })
  }
  for (let i = 0; i < 8; i++) {
    const a = i * 0.8 + 0.4, d = 0.7 + (i % 3) * 0.8
    put(lotusArt[i % 2], 1.2 + (i % 2) * 0.3, { x: POND.x + Math.cos(a) * d, z: POND.z + Math.sin(a) * d * 0.8, reach: 9, sway: 0.05 }, { back: false })
  }
  ;[[POND.x - 4, POND.z + 1.2, 0], [POND.x + 3.9, POND.z - 0.6, 1], [POND.x + 1, POND.z + 3.8, 0]].forEach(([x, z, i]) => put(reedArt[i], 1.5, { x, z, reach: 9, sway: 0.05 }, { back: false }))

  const riceArt = [paint(330, 90, c => riceRow(c, { seed: 2 })), paint(330, 90, c => riceRow(c, { seed: 6 })), paint(330, 90, c => riceRow(c, { seed: 9, ripe: true }))]
  FIELDS.forEach(([x0, z0, x1, z1], f) => {
    for (let z = z0 + 1.2, row = 0; z < z1 - 0.4; z += 2.1, row++) for (let x = x0 + 2 + (row % 2) * 1.6; x < x1 - 1; x += 4.2) put(riceArt[Math.abs(row + f + Math.round(x)) % 3], 0.8, { x, z, reach: 10, sway: 0.05 }, { back: false })
  })

  for (const [x, z, label, heading, text] of SIGNS) addSign(card(paint(280, 270, c => signBoard(c, { title: label })), { height: 1.9 }), { x, z, title: heading, text })

  const hillArt = [paint(1700, 380, c => hillRange(c, { w: 1600, h: 320, color: '#a9bc9c', bumps: 4, seed: 2 })), paint(1700, 300, c => hillRange(c, { w: 1600, h: 240, color: '#8fab8a', bumps: 6, seed: 5 })), paint(1700, 220, c => hillRange(c, { w: 1600, h: 170, color: '#7d9c6e', bumps: 9, seed: 8 }))]
  ;[-36, 0, 36].forEach(x => put(hillArt[0], 9, { x, z: -36, always: true }, { back: false }))
  ;[-30, 6, 40].forEach(x => put(hillArt[1], 6.5, { x, z: -33, always: true }, { back: false }))
  ;[-22, 16].forEach(x => put(hillArt[2], 4, { x, z: -30.5, always: true }, { back: false }))
  put(paint(300, 300, c => { sheet(c, ellipse(0, -150, 140, 140, 44), '#f6b877', { lift: 0.8 }); sheet(c, ellipse(0, -150, 108, 108, 44), '#ef9b52', { lift: 0.6 }) }), 6, { x: 17, z: -37, y: 9.5, always: true }, { back: false })
  const cloudArt = [0, 1, 2].map(i => paint(460, 180, c => cloud(c, { rx: 200, ry: 70, seed: 3 + i * 4 })))
  const clouds = [[-24, 14], [-6, 16.5], [10, 13.5], [30, 16], [-38, 17]].map(([x, y], i) => ({ root: put(cloudArt[i % 3], 2.8 + (i % 2), { x, z: -34, y, always: true }, { back: false }).root, x }))
  const kiteArt = [paint(200, 200, c => kite(c)), paint(200, 200, c => kite(c, { color: '#3f6b9a' }))]
  const kites = [[-13, 11.5, -24], [24, 13, -27]].map(([x, y, z], i) => ({ root: put(kiteArt[i], 1.7, { x, z, y, always: true }).root, x, y }))
  const birdFrames = [0, 1].map(frame => paint(130, 80, c => bird(c, { frame })))
  const birds = [...Array(7)].map((_, i) => ({ root: put(birdFrames, 0.75, { x: -30 + i * 9, z: -14 - (i % 3) * 5, y: 8.5 + (i % 4) * 0.9, always: true }, { back: false }).root, x: -30 + i * 9, y: 8.5 + (i % 4) * 0.9, speed: 2.6 + (i % 3) * 0.7, i }))
  const flyColors = ['#f0a23a', '#f2a8b8', '#fbf2df', '#c98bd0']
  const flyFrames = flyColors.map(color => [0, 1].map(frame => paint(70, 50, c => butterfly(c, { frame, color }))))
  const flies = [...beds, [POND.x - 3.6, POND.z - 2], [-11, 9.6]].map(([x, z], i) => ({ root: put(flyFrames[i % 4], 0.42, { x, z, y: 0.9, always: true }, { back: false }).root, x, z, i }))

  const boatArt = paint(420, 230, c => rowBoat(c))
  const vendorArt = paint(420, 230, c => {
    const pr = rng(8)
    for (let i = 0; i < 12; i++) sheet(c, ellipse(-150 + (i % 6) * 17, -52 - Math.floor(i / 6) * 13 - pr() * 3, 11, 10, 10), ['#f0a23a', '#d9533a', '#9ab84a'][i % 3], { lift: 0.4, edgeScale: 0.6 })
    for (let i = 0; i < 8; i++) sheet(c, ellipse(84 + (i % 4) * 18, -52 - Math.floor(i / 4) * 13, 11, 10, 10), ['#f4d04a', '#7aa25a'][i % 2], { lift: 0.4, edgeScale: 0.6 })
    rowBoat(c)
  })
  const boats = [[-20, 0.12, -2.5, boatArt], [12, -0.085, -0.7, vendorArt]].map(([x, speed, z, art]) => ({ root: put(art, 1.9, { x, z, y: 0.02, always: true }).root, x, speed, z }))
  put(paint(420, 120, c => rowBoat(c, { rower: false })), 1.0, { x: PIERS[0] + 2.2, z: -0.1, y: 0.02, always: true })
  const duckArt = [paint(120, 70, c => duck(c)), paint(120, 70, c => duck(c, { color: '#f1dc9a' }))]
  const ducks = [...Array(5)].map((_, i) => ({ root: put(duckArt[i ? 1 : 0], i ? 0.42 : 0.6, { x: 0, z: -1.6, y: 0.03, always: true }, { back: false }).root, i }))
  ;[[POND.x - 0.8, POND.z - 1.4], [POND.x + 1.3, POND.z + 0.6]].forEach(([x, z], i) => ducks.push({ root: put(duckArt[0], 0.55, { x, z, y: 0.02, always: true }, { back: false }).root, i, still: [x, z] }))

  const buffaloArt = paint(460, 290, c => buffalo(c))
  const grazers = [[-17, 22.4, 1], [22.6, 25.4, -1], [-25.4, 26.6, 1]].map(([x, z, face]) => {
    const p = put(buffaloArt, 2.5, { x, z, reach: 12 })
    p.root.userData.pivot.scale.x = face
    solid(x, z, 1)
    return p
  })
  const egretArt = paint(180, 200, c => egret(c))
  ;[[12.4, 21.6], [9.2, 26.2], [-21.4, 20.6], [POND.x + 4.4, POND.z + 1.6]].forEach(([x, z], i) => { const p = put(egretArt, 1.25, { x, z, reach: 10 }); if (i % 2) p.root.userData.pivot.scale.x = -1 })
  const chickenArt = ['#c9772f', '#f6ead2', '#6e4529'].map(color => paint(110, 90, c => chicken(c, { color })))
  const hens = [[-13, -6.9], [-12.2, -7.3], [-20, -6.8], [10, -7.2], [16.6, -7], [-16.4, 9.8], [-17.4, 10.3], [21, 9.2], [-9.6, 15.8]].map(([x, z], i) => ({ p: put(chickenArt[i % 3], 0.62, { x, z, reach: 9 }, { back: false }), i }))

  const people = [
    [{ top: '#3f6b9a', bottom: '#7a3f2c', carry: 'baskets' }, [-26, 4.3], [-3, 4.3], 1.5],
    [{ top: '#f6ead2', bottom: '#2e4866', hat: false }, [4, 4], [26, 4.2], 1.3],
    [{ top: '#c98bd0', bottom: '#5d3a6e', hat: false, hair: '#3a2414' }, [-10.8, 11.8], [-2, 10.9], 1.1],
    [{ top: '#5d8a48', bottom: '#6e4529' }, [-26, -6.4], [-4, -6.4], 1.4],
    [{ top: '#e97e5e', bottom: '#3a2e5a', carry: 'baskets' }, [5, -6.4], [27, -6.4], 1.5],
    [{ top: '#d9b65a', bottom: '#2e4866' }, [3, 17.5], [26, 17.5], 1.2],
  ]
  const walkers = people.map(([style, a, b, speed]) => {
    const frames = [0, 1].map(frame => paint(style.carry ? 260 : 160, 290, c => villager(c, { ...style, frame })))
    return { p: put(frames, 2.05, { x: a[0], z: a[1], reach: 13 }), a, b, speed, len: Math.hypot(b[0] - a[0], b[1] - a[1]) }
  })
  const monkFrames = [0, 1].map(frame => paint(140, 270, c => monk(c, { frame })))
  ;[[[-7, -12.6], [7, -12.6], 0.9], [[-4.6, -22], [-4.6, -14], 0.8], [[5, -14.6], [8.6, -22.4], 0.8]].forEach(([a, b, speed]) => walkers.push({ p: put(monkFrames, 1.95, { x: a[0], z: a[1], reach: 13 }), a, b, speed, len: Math.hypot(b[0] - a[0], b[1] - a[1]) }))
  const sellers = [[{ top: '#f6ead2', bottom: '#7a3f2c' }, -12, 12.9], [{ top: '#3f6b9a', bottom: '#5d3a6e', hat: false }, -8.4, 13.7], [{ top: '#e97e5e', bottom: '#2e4866' }, -15.6, 12.1], [{ top: '#5d8a48', bottom: '#6e4529' }, 7.4, 1.6]]
  for (const [style, x, z] of sellers) put(paint(160, 290, c => villager(c, style)), 2.05, { x, z, reach: 11 })

  onUpdate((t, dt) => {
    water.offset.x = t * 0.012
    for (const c of clouds) c.root.position.x = c.x + Math.sin(t * 0.05 + c.x) * 3
    for (const k of kites) {
      k.root.position.x = k.x + Math.sin(t * 0.4 + k.x) * 1.6
      k.root.position.y = k.y + Math.sin(t * 0.7 + k.x) * 0.6
      k.root.userData.pivot.rotation.z = Math.sin(t * 0.9 + k.x) * 0.2
    }
    for (const b of birds) {
      b.x += b.speed * dt
      if (b.x > 40) b.x = -40
      b.root.position.x = b.x
      b.root.position.y = b.y + Math.sin(t * 1.4 + b.i) * 0.4
      setFrame(b.root, Math.floor(t * 5 + b.i) % 2)
    }
    for (const f of flies) {
      f.root.position.set(f.x + Math.sin(t * 0.9 + f.i * 2) * 0.9, 0.7 + Math.sin(t * 2.3 + f.i) * 0.3, f.z + Math.cos(t * 0.7 + f.i) * 0.5)
      setFrame(f.root, Math.floor(t * 9 + f.i) % 2)
    }
    for (const b of boats) {
      b.x += b.speed * dt * 12
      if (b.x > 30) b.speed = -Math.abs(b.speed)
      if (b.x < -30) b.speed = Math.abs(b.speed)
      b.root.position.set(b.x, 0.02 + Math.sin(t * 2 + b.z) * 0.03, b.z)
      const piv = b.root.userData.pivot
      piv.scale.x += (Math.sign(b.speed) - piv.scale.x) * Math.min(1, dt * 3)
      piv.rotation.z = Math.sin(t * 1.7 + b.z) * 0.03
    }
    const lead = ((t * 0.5) % 50) - 25
    for (const d of ducks) {
      if (d.still) d.root.position.set(d.still[0] + Math.sin(t * 0.4 + d.i * 3) * 0.5, 0.02 + Math.sin(t * 2 + d.i) * 0.015, d.still[1])
      else d.root.position.set(lead - d.i * 0.75 - (d.i ? 0.15 : 0), 0.03 + Math.sin(t * 3 + d.i) * 0.015, -1.6 + Math.sin(t * 0.6 + d.i * 0.8) * 0.25)
    }
    for (const g of grazers) g.root.userData.pivot.rotation.z = Math.sin(t * 0.8 + g.x) * 0.02
    for (const h of hens) {
      const piv = h.p.root.userData.pivot, peck = Math.max(0, Math.sin(t * 2.6 + h.i * 1.9))
      piv.rotation.z = -peck * 0.45 * Math.sign(piv.scale.x)
      piv.position.y = Math.max(0, Math.sin(t * 5 + h.i * 2.3)) * 0.04 * (1 - peck)
      piv.scale.x = h.i % 2 ? -1 : 1
    }
    for (const w of walkers) {
      const cycle = (t * w.speed / w.len + w.len) % 2, k = cycle < 1 ? cycle : 2 - cycle, dir = cycle < 1 ? 1 : -1
      w.p.x = w.a[0] + (w.b[0] - w.a[0]) * k
      w.p.z = w.a[1] + (w.b[1] - w.a[1]) * k
      w.p.root.position.x = w.p.x
      w.p.root.position.z = w.p.z
      const piv = w.p.root.userData.pivot, facing = Math.sign((w.b[0] - w.a[0]) * dir) || 1, step = t * w.speed * 1.6
      piv.scale.x += (facing - piv.scale.x) * Math.min(1, dt * 8)
      piv.position.y = Math.abs(Math.sin(step * Math.PI)) * 0.05
      setFrame(w.p.root, Math.floor(step) % 2)
    }
  })

  world.start()
}

build()

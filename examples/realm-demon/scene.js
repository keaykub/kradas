import * as THREE from 'three'
import { P, rng, shade } from '../../lib/core.js'
import { sheet, ellipse, blob, rect, wave, grain } from '../../lib/paper.js'
import { shingles, kid, signBoard, planks } from '../../lib/props.js'
import { lampPost, rocks } from '../../lib/props-places.js'
import { bird } from '../../lib/props-life.js'
import { pagoda, deadTree, skullPile, crystal, demon, hornGate, tombstone, cauldron, wisp, warBanner, boneFence, rockSpire } from '../../lib/props-realms.js'
import { paint, paintFlat, card, foldedHouse, setFrame, groundTexture, skyTexture } from '../../world/cards.js'
import { createWorld } from '../../world/engine.js'

const SIZE = 60, PX = Math.min(innerWidth, innerHeight) < 700 ? 2048 : 4096, U = PX / SIZE
const toPx = (x, z) => P((x + SIZE / 2) * U, (z + SIZE / 2) * U)
const u = v => v * U
const RIVER = { z0: -3.4, z1: 0.4 }, BRIDGE = 1.6
const FORTS = [[-17, -8.6], [-9, -9.2], [9, -9], [17, -8.4], [-15, 8.4], [15.5, 8]]
const GRAVES = { x: 17, z: 16 }
const PATHS = [[[[0, 28], [0.4, 14], [0, 1]], 2.6], [[[0, -4], [0, -13]], 2.6], [[[-27, 4.2], [0, 4], [27, 4.2]], 2], [[[-27, -6], [27, -6]], 1.8], [[[0.4, 12], [9, 13.4], [15, 15]], 1.6], [[[-0.4, 12], [-9, 13.4], [-15, 15]], 1.6]]
const C = { ground: '#3a3350', groundDark: '#2e2842', groundLight: '#4a4264', path: '#5d566e', pathDark: '#3a3448', lava: '#ff6a2c', lavaHot: '#ffd24a', lavaDark: '#a8281a' }

function segmentDistance(x, z, a, b) {
  const dx = b[0] - a[0], dz = b[1] - a[1], k = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz)))
  return Math.hypot(x - a[0] - dx * k, z - a[1] - dz * k)
}
const onPath = (x, z, pad = 0) => PATHS.some(([pts, w]) => pts.some((p, i) => i && segmentDistance(x, z, pts[i - 1], p) < w / 2 + pad))

function walkable(x, z) {
  if (Math.abs(x) > 27.5 || z > 27.5 || z < -24) return false
  if (z > RIVER.z0 - 0.2 && z < RIVER.z1 + 0.2 && Math.abs(x) > BRIDGE - 0.35) return false
  return true
}

function cracks(c, glow) {
  const r = rng(31)
  c.lineCap = 'round'
  c.lineJoin = 'round'
  for (let i = 0; i < 70; i++) {
    let x = (r() - 0.5) * 56, z = (r() - 0.5) * 54, a = r() * 6.28
    if (onPath(x, z, 0.6) || (z > RIVER.z0 - 1.5 && z < RIVER.z1 + 1.5)) continue
    const pts = [toPx(x, z)]
    for (let k = 0; k < 5 + r() * 5; k++) {
      a += (r() - 0.5) * 1.4
      x += Math.cos(a) * (0.5 + r() * 0.7)
      z += Math.sin(a) * (0.4 + r() * 0.5)
      pts.push(toPx(x, z))
    }
    const stroke = (color, width) => { c.strokeStyle = color; c.lineWidth = u(width); c.beginPath(); pts.forEach((p, k) => (k ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y))); c.stroke() }
    if (glow) { stroke('#7a1c10', 0.2); stroke(C.lava, 0.09); stroke(C.lavaHot, 0.035) }
    else { stroke('#160f1a', 0.26); stroke(C.lavaDark, 0.12); stroke(C.lava, 0.06) }
  }
}

function drawGround(c) {
  const r = rng(8)
  c.fillStyle = C.ground
  c.fillRect(0, 0, PX, PX)
  for (let i = 0; i < 260; i++) sheet(c, blob(r() * PX, r() * PX, u(0.9 + r() * 2.4), u(0.5 + r() * 1), 5, i, 0.22), r() > 0.5 ? C.groundDark : C.groundLight, { lift: 0.25, edge: false, tone: 0 })
  for (let i = 0; i < 900; i++) sheet(c, blob(r() * PX, r() * PX, u(0.1 + r() * 0.16), u(0.07 + r() * 0.1), 4, i, 0.15), r() > 0.5 ? '#4a4050' : '#1c1620', { lift: 0.15, edge: false, tone: 0 })
  const north = toPx(0, RIVER.z0 - 0.7).y, south = toPx(0, RIVER.z1 + 0.7).y
  sheet(c, rect(0, north, PX, south - north), '#1c1620', { lift: 0.4 })
  for (const [pts, w] of PATHS) {
    c.lineCap = 'round'
    c.lineJoin = 'round'
    const line = (color, width) => { c.strokeStyle = color; c.lineWidth = u(width); c.beginPath(); pts.forEach((p, i) => { const q = toPx(p[0], p[1]); i ? c.lineTo(q.x, q.y) : c.moveTo(q.x, q.y) }); c.stroke() }
    line('rgba(0,0,0,0.4)', w + 0.2)
    line(C.pathDark, w + 0.06)
    line(C.path, w - 0.12)
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i], len = Math.hypot(b[0] - a[0], b[1] - a[1])
      for (let k = 0; k < len * 2.4; k++) {
        const t = r(), off = (r() - 0.5) * (w - 0.5), q = toPx(a[0] + (b[0] - a[0]) * t + off * 0.5, a[1] + (b[1] - a[1]) * t + off)
        sheet(c, blob(q.x, q.y, u(0.14 + r() * 0.16), u(0.1 + r() * 0.1), 5, k, 0.12), r() > 0.5 ? '#5a5262' : '#3a3342', { lift: 0.15, edgeScale: 0.5 })
      }
    }
  }
  const yard = toPx(0, -16)
  sheet(c, ellipse(yard.x, yard.y, u(8), u(5), 50), '#3a3040', { lift: 0.3 })
  sheet(c, ellipse(yard.x, yard.y, u(4.4), u(2.8), 44), '#241c2a', { lift: 0.2 })
  const g = toPx(GRAVES.x, GRAVES.z)
  sheet(c, blob(g.x, g.y, u(6.6), u(4.6), 8, 6, 0.12), '#27302a', { lift: 0.3 })
  cracks(c, false)
}

function drawGlow(c) {
  c.fillStyle = '#000000'
  c.fillRect(0, 0, PX, PX)
  cracks(c, true)
  const yard = toPx(0, -16)
  c.strokeStyle = '#ff3c2c'
  c.lineWidth = u(0.12)
  c.beginPath()
  c.ellipse(yard.x, yard.y, u(4.4), u(2.8), 0, 0, 7)
  c.stroke()
  c.beginPath()
  for (let k = 0; k < 6; k++) { const a = k * 2.513 - 1.57, x = yard.x + Math.cos(a) * u(4.2), y = yard.y + Math.sin(a) * u(2.66); k ? c.lineTo(x, y) : c.moveTo(x, y) }
  c.stroke()
}

const SIGNS = [
  [2.6, 22.4, 'แดนมาร', 'แดนมารใต้จันทร์เลือด', 'ผืนดินแตกเป็นร่องลาวา ไม่มีกลางวันที่นี่ มีแต่แสงจันทร์แดงกับโคมไฟของพวกมาร'],
  [2.8, 2, 'สะพานกระดูก', 'สะพานข้ามธารลาวา', 'ธารลาวาไหลผ่ากลางแดน ทางข้ามมีแค่สะพานนี้ เดินตรงกลางไว้'],
  [3.6, -10.4, 'หอมาร', 'หอคอยจอมมาร', 'หอเก้าชั้นของจอมมาร วงเวทสีเลือดบนลานส่องแสงทั้งคืน'],
  [-12.4, 13.2, 'หม้อยา', 'ลานหม้อยาพิษ', 'พวกมารต้มยาสีเขียวเรืองแสงกันตรงนี้ กลิ่นไม่ค่อยน่าดมเท่าไหร่'],
  [12.2, 13, 'สุสาน', 'สุสานไฟวิญญาณ', 'ดวงไฟสีฟ้าลอยเหนือป้ายหิน ว่ากันว่าเป็นวิญญาณที่ยังหาทางกลับบ้านไม่เจอ'],
]

const TOURS = { walk: { start: { x: 4, z: 24.2 }, speed: 3.6, wait: 0.5, fadein: true, points: [[0.4, 21], [0.2, 12], [0, 5], [0, 1], [0, -4.6], [0, -8]] } }
const TOUR = TOURS[new URLSearchParams(location.search).get('tour')] ?? null

async function build() {
  await Promise.all([400, 600, 700].map(w => document.fonts.load(`${w} 40px Kanit`)))
  const playerCard = card([0, 1].map(frame => paint(180, 250, c => kid(c, { frame }))), { height: 1.75 })
  const world = createWorld({
    title: 'แดนมาร', subtitle: 'kradas · ใต้จันทร์เลือด', size: SIZE, ground: groundTexture(PX, c => { drawGround(c); grain(c, 0.3) }), groundGlow: groundTexture(PX, drawGlow), walkable, start: TOUR ? TOUR.start : { x: 4, z: 24.2 }, tour: TOUR, view: TOUR ? { height: 10.5, back: 14.5, ahead: 5 } : {}, player: playerCard,
    background: '#241a34', sky: skyTexture('#0e0a1e', '#6a2230'),
    theme: { hemiSky: '#8f8ad6', hemiGround: '#4a2a3a', hemi: 2.3, sun: '#c9b8ff', sunPower: 1.9, vignette: '#08040e', fogNear: 26, fogFar: 60, petalColors: ['#ff8a3c', '#ffd24a', '#ff5a2c'], petalRise: true, petalGlow: true, bloom: 0.45 },
  })
  const { scene, place, addSign, solid, onUpdate, addPortal, addLight } = world
  const put = (art, height, opts, extra = {}) => place(card(art, { height, ...extra }), opts)

  addPortal(card(paint(520, 490, c => hornGate(c)), { height: 5.2 }), { x: 0, z: 26, href: '../walk-village/?from=demon' })
  addLight(0, 2, 26.6, '#ff7a4c', 9, 8)

  const lavaTex = groundTexture(512, (c, s) => {
    c.fillStyle = C.lava
    c.fillRect(0, 0, s, s)
    for (let i = 0; i < 8; i++) sheet(c, wave(-40, s + 40, 20 + i * 64, 22, 9, 128, i), i % 2 ? C.lavaHot : C.lavaDark, { lift: 0.2, edge: false })
  })
  lavaTex.wrapS = lavaTex.wrapT = THREE.RepeatWrapping
  lavaTex.repeat.set(15, 1)
  const river = new THREE.Mesh(new THREE.PlaneGeometry(SIZE, RIVER.z1 - RIVER.z0), new THREE.MeshBasicMaterial({ map: lavaTex }))
  river.rotation.x = -Math.PI / 2
  river.position.set(0, 0.03, (RIVER.z0 + RIVER.z1) / 2)
  scene.add(river)
  const deckTex = groundTexture(512, (c, s) => {
    c.fillStyle = '#d9cdb0'
    c.fillRect(0, 0, s, s)
    planks(c, { x0: 0, y0: 0, x1: s, y1: s }, '#8f8468', 46, false, 6)
    c.fillStyle = '#3a3040'
    c.fillRect(0, 0, 30, s)
    c.fillRect(s - 30, 0, 30, s)
  })
  const deck = new THREE.Mesh(new THREE.PlaneGeometry(BRIDGE * 2 + 0.6, RIVER.z1 - RIVER.z0 + 1.6), new THREE.MeshLambertMaterial({ map: deckTex }))
  deck.rotation.x = -Math.PI / 2
  deck.position.set(0, 0.09, (RIVER.z0 + RIVER.z1) / 2)
  deck.receiveShadow = true
  scene.add(deck)
  for (const x of [-15, 15]) addLight(x, 0.8, -1.5, '#ff7a3c', 12, 10)

  const windows = (c, list, color) => { for (const [x, y, w, h] of list) sheet(c, [P(x, y + h), P(x, y + h * 0.3), P(x + w / 2, y), P(x + w, y + h * 0.3), P(x + w, y + h)], color, { lift: 0, edge: false }) }
  const frontWin = [[42, 176, 44, 70], [214, 176, 44, 70], [128, 60, 44, 56]], sideWin = [[40, 40, 40, 70], [130, 40, 40, 70], [220, 40, 40, 70]]
  const stoneWall = (c, b, color) => {
    c.strokeStyle = shade(color, -0.35)
    c.lineWidth = 3
    for (let row = 0, y = b.y0; y < b.y1; y += 26, row++) {
      c.beginPath(); c.moveTo(b.x0, y); c.lineTo(b.x1, y); c.stroke()
      for (let x = b.x0 + (row % 2) * 24; x < b.x1; x += 48) { c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 26); c.stroke() }
    }
  }
  const fort = ['#ff8a3c', '#ff5a3c', '#c98bff'].map((lit, i) => {
    const wall = ['#4a4050', '#55404a', '#3f3a52'][i]
    return {
      front: paintFlat(300, 300, c => {
        sheet(c, [P(0, 152), P(150, 2), P(300, 152)], shade(wall, -0.1), { lift: 0, print: (p, b) => stoneWall(p, b, wall) })
        sheet(c, rect(0, 150, 300, 150), wall, { lift: 0, print: (p, b) => stoneWall(p, b, wall) })
        sheet(c, [P(112, 300), P(112, 214), P(150, 186), P(188, 214), P(188, 300)], '#1c1620', { lift: 0.4 })
        windows(c, frontWin, lit)
      }),
      glowFront: paintFlat(300, 300, c => { c.fillStyle = '#000'; c.fillRect(0, 0, 300, 300); windows(c, frontWin, lit) }, 1),
      side: paintFlat(300, 150, c => { sheet(c, rect(0, 0, 300, 150), shade(wall, -0.08), { lift: 0, print: (p, b) => stoneWall(p, b, wall) }); windows(c, sideWin, lit) }),
      glowSide: paintFlat(300, 150, c => { c.fillStyle = '#000'; c.fillRect(0, 0, 300, 150); windows(c, sideWin, lit) }, 1),
      roof: paintFlat(256, 256, c => { c.fillStyle = '#2a2230'; c.fillRect(0, 0, 256, 256); shingles(c, { x0: 0, y0: 0, x1: 256, y1: 256 }, '#120c16', 32, 32); shingles(c, { x0: 0, y0: 3, x1: 256, y1: 259 }, '#5a3a4a', 32, 32) }, 1),
    }
  })
  const hornArt = paintFlat(420, 300, c => {
    const bone = '#e8dcc0'
    sheet(c, [P(210, 96), P(196, 40), P(210, 4), P(224, 40)], bone, { lift: 0.4 })
    for (const s of [-1, 1]) sheet(c, [P(210 + s * 150, 250), P(210 + s * 204, 214), P(210 + s * 200, 160), P(210 + s * 184, 210), P(210 + s * 140, 232)], bone, { lift: 0.4 })
  })
  hornArt.apexFrac = 96 / 300
  FORTS.forEach(([x, z], i) => {
    place(foldedHouse({ ...fort[i % 3], fascia: hornArt, width: 3.4, depth: 3, wallH: 1.8, gableH: 1.8, stilts: 0, overhang: 0.35 }), { x, z, reach: 15 })
    solid(x, z, 2)
    if (i % 2 === 0) addLight(x, 1.4, z + 2.4, ['#ff8a3c', '#ff5a3c', '#c98bff'][i % 3], 10, 7)
  })

  put(paint(420, 800, c => pagoda(c, { tiers: 6, roof: '#3a2a3e', wall: '#55404a', pillar: '#b3261e' })), 9.6, { x: 0, z: -18.4, reach: 18 }, { cross: true })
  solid(0, -18.4, 1.8)
  addLight(0, 3, -15.6, '#ff5a3c', 16, 13)

  const lampArt = paint(160, 270, c => lampPost(c, { color: '#ff4a2c' }))
  ;[[-2.2, 1], [2.2, 1], [-2.2, -4], [2.2, -4], [-2.2, 9], [2.2, 15], [-2.2, 20], [-9, 5.4], [9, 5.4], [-2.2, -10], [2.2, -10]].forEach(([x, z], i) => {
    const p = put(lampArt, 2.7, { x, z, reach: 14 })
    if (x < 0) p.root.userData.pivot.scale.x = -1
    solid(x, z, 0.2)
    if (i > 3 && i < 9) addLight(x + (x < 0 ? -0.4 : 0.4), 1.9, z + 0.3, '#ffa860', 7, 7)
  })

  put(paint(220, 220, c => cauldron(c)), 2, { x: -15, z: 16, reach: 14 })
  solid(-15, 16, 0.9)
  addLight(-15, 1.8, 16.5, '#7dff8a', 20, 9)
  const demonStyles = [['#3a2a3e', '#b3261e', '#8f6a78'], ['#2a2f42', '#c98bff', '#7a8a92'], ['#42262a', '#ff8a3c', '#a06a5a']]
  ;[[-17.2, 15.2, 0, 1], [-12.8, 16.6, 1, -1], [-15.6, 18.4, 2, 1], [-3.2, -13.6, 0, 1], [3.2, -13.6, 1, -1]].forEach(([x, z, i, face]) => {
    const p = put(paint(220, 370, c => demon(c, { robe: demonStyles[i][0], trim: demonStyles[i][1], skin: demonStyles[i][2], spear: z < 0 })), 2.6, { x, z, reach: 14 })
    p.root.userData.pivot.scale.x = face
  })

  const graveArt = [0, 1, 2].map(i => paint(110, 130, c => tombstone(c, { seed: i })))
  const wispArt = [paint(80, 130, c => wisp(c)), paint(80, 130, c => wisp(c, { color: '#b8ffd0' }))]
  const wisps = []
  for (let i = 0; i < 13; i++) {
    const x = GRAVES.x - 5 + (i % 5) * 2.4 + (i % 2) * 0.6, z = GRAVES.z - 2.6 + Math.floor(i / 5) * 2.4
    put(graveArt[i % 3], 1.15, { x, z, reach: 13 })
    solid(x, z, 0.3)
    if (i % 3 === 0) wisps.push({ root: put(wispArt[i % 2], 0.9, { x, z, y: 1.2, always: true }, { glow: true, back: false }).root, x, z, i })
  }
  addLight(GRAVES.x - 2, 1.6, GRAVES.z, '#9df2ff', 14, 9)
  addLight(GRAVES.x + 3, 1.6, GRAVES.z + 1.5, '#9df2ff', 10, 8)

  const treeArt = [0, 1, 2, 3].map(i => paint(460, 420, c => deadTree(c, { seed: 3 + i * 4, leaves: i === 3 ? null : ['#b3261e', '#d9432c', '#8a1f3a'][i] })))
  const crystalArt = ['#8a4fd0', '#c93a5a', '#5a6fd0'].map((color, i) => paint(240, 250, c => crystal(c, { color, seed: i + 2 })))
  const skullArt = [0, 1].map(i => paint(200, 150, c => skullPile(c, { seed: i + 3 })))
  const rockArt = [0, 1].map(i => paint(200, 80, c => rocks(c, { seed: 3 + i * 4 })))
  const spireArt = [0, 1, 2].map(i => paint(240, 320 + i * 60, c => rockSpire(c, { seed: i + 2, h: 300 + i * 60 })))
  const bannerArt = [paint(260, 370, c => warBanner(c)), paint(260, 370, c => warBanner(c, { color: '#6a2a8a' }))]
  const fenceArt = paint(320, 110, c => boneFence(c))

  ;[[-3.4, 12], [3.4, 18.6], [-5.4, -11.6], [5.4, -11.6], [-11.4, -6.9], [11.4, -6.9], [-18, 5.6], [18, 5.6]].forEach(([x, z], i) => { put(bannerArt[i % 2], 3.5, { x, z, reach: 14, sway: 0.03 }); solid(x, z, 0.2) })
  ;[[12.4, 12.2], [15.2, 12.2], [18, 12.2], [20.8, 12.2], [-19.4, 13.4], [-10.6, 13.6]].forEach(([x, z]) => put(fenceArt, 1.05, { x, z, reach: 12 }, { back: false }))

  const taken = [[0, 23, 2.5], [0, 26, 3.6], [0, -17, 7.6], [-15, 16, 4.4], [GRAVES.x, GRAVES.z, 6.4], ...FORTS.map(([x, z]) => [x, z, 3.3]), ...SIGNS.map(s => [s[0], s[1], 1.3])]
  const free = (x, z, pad) => walkable(x, z) && !onPath(x, z, 0.5) && (z < RIVER.z0 - 1.2 || z > RIVER.z1 + 1.3) && taken.every(([tx, tz, tr]) => Math.hypot(x - tx, z - tz) > tr + pad)
  const r = rng(17)
  const scatter = (count, pad, fn) => {
    for (let n = 0, tries = 0; n < count && tries < count * 80; tries++) {
      const x = (r() - 0.5) * 54, z = -23 + r() * 50
      if (!free(x, z, pad)) continue
      taken.push([x, z, pad])
      fn(x, z, n++)
    }
  }
  scatter(24, 1.6, (x, z, i) => { put(treeArt[i % 4], 4.2 + (i % 3) * 0.5, { x, z, reach: 14, sway: 0.012 }, { cross: true }); solid(x, z, 0.35) })
  scatter(12, 1.5, (x, z, i) => { put(spireArt[i % 3], 3.2 + (i % 3) * 0.7, { x, z, reach: 14 }, { cross: true }); solid(x, z, 0.8) })
  scatter(14, 1.1, (x, z, i) => { put(crystalArt[i % 3], 1.9 + (i % 2) * 0.5, { x, z, reach: 13 }, { cross: true }); solid(x, z, 0.5); if (i < 2) addLight(x, 1, z + 0.5, ['#a86aff', '#ff5a7a', '#7a8aff'][i % 3], 9, 6) })
  scatter(14, 0.9, (x, z, i) => put(skullArt[i % 2], 1.05, { x, z, reach: 12 }))
  scatter(12, 0.8, (x, z, i) => put(rockArt[i % 2], 0.7, { x, z, reach: 12 }))

  for (const [x, z, label, heading, text] of SIGNS) addSign(card(paint(280, 270, c => signBoard(c, { title: label, color: '#d9cdb0' })), { height: 1.9 }), { x, z, title: heading, text })

  const farSpire = [0, 1, 2].map(i => paint(240, 440 + i * 80, c => rockSpire(c, { seed: i + 9, h: 420 + i * 80, color: '#1f1826' })))
  for (let i = 0; i < 16; i++) put(farSpire[i % 3], 8 + (i % 4) * 2.4, { x: -36 + i * 4.8, z: -27 - (i % 3) * 2.4, always: true }, { back: false })
  put(paint(320, 320, c => { sheet(c, ellipse(0, -160, 150, 150, 50), '#ff5a3c', { lift: 0, edge: false }); sheet(c, ellipse(-30, -190, 34, 28, 16), '#d9432c', { lift: 0, edge: false }); sheet(c, ellipse(40, -120, 46, 38, 16), '#d9432c', { lift: 0, edge: false }); sheet(c, ellipse(24, -214, 18, 16, 12), '#d9432c', { lift: 0, edge: false }) }), 9, { x: -12, z: -36, y: 9, always: true }, { glow: true, back: false })
  const batFrames = [0, 1].map(frame => paint(130, 80, c => bird(c, { frame, color: '#120c16' })))
  const bats = [...Array(9)].map((_, i) => ({ root: put(batFrames, 0.7, { x: -30 + i * 7, z: -10 - (i % 3) * 5, y: 7 + (i % 4) * 0.9, always: true }, { back: false }).root, x: -30 + i * 7, y: 7 + (i % 4) * 0.9, speed: 3.4 + (i % 3) * 0.9, i }))

  const routes = [[[-24, 4.2], [-4, 4.2], 1.3, 0], [[5, 4.2], [24, 4.2], 1.2, 1], [[-22, -6], [-3, -6], 1.3, 2], [[4, -6], [23, -6], 1.1, 0], [[0, -5.4], [0, -12.4], 1, 1]]
  const walkers = routes.map(([a, b, speed, i]) => {
    const [robe, trim, skin] = demonStyles[i], frames = [0, 1].map(frame => paint(220, 370, c => demon(c, { frame, robe, trim, skin, spear: true })))
    return { p: put(frames, 2.6, { x: a[0], z: a[1], reach: 15 }), a, b, speed, len: Math.hypot(b[0] - a[0], b[1] - a[1]) }
  })

  onUpdate((t, dt) => {
    lavaTex.offset.x = t * 0.02
    for (const b of bats) {
      b.x += b.speed * dt
      if (b.x > 38) b.x = -38
      b.root.position.x = b.x
      b.root.position.y = b.y + Math.sin(t * 2.4 + b.i) * 0.7
      setFrame(b.root, Math.floor(t * 8 + b.i) % 2)
    }
    for (const w of wisps) w.root.position.set(w.x + Math.sin(t * 0.7 + w.i) * 0.8, 1.2 + Math.sin(t * 1.3 + w.i * 2) * 0.35, w.z + Math.cos(t * 0.5 + w.i) * 0.6)
    for (const w of walkers) {
      const cycle = (t * w.speed / w.len + w.len) % 2, k = cycle < 1 ? cycle : 2 - cycle, dir = cycle < 1 ? 1 : -1
      w.p.x = w.a[0] + (w.b[0] - w.a[0]) * k
      w.p.z = w.a[1] + (w.b[1] - w.a[1]) * k
      w.p.root.position.x = w.p.x
      w.p.root.position.z = w.p.z
      const piv = w.p.root.userData.pivot, facing = Math.sign((w.b[0] - w.a[0]) * dir) || 1, step = t * w.speed * 1.5
      piv.scale.x += (facing - piv.scale.x) * Math.min(1, dt * 8)
      piv.position.y = Math.abs(Math.sin(step * Math.PI)) * 0.05
      setFrame(w.p.root, Math.floor(step) % 2)
    }
  })
  world.start()
}

build()

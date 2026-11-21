import { P } from '../../lib/core.js'
import { sheet, fold, rect, ellipse, scallopTop, blob } from '../../lib/paper.js'
import { popUp, camera } from '../../lib/motion.js'
import { label, subtitles } from '../../lib/text.js'
import { stage } from '../../lib/stage.js'

const DURATION = 8

const AT = { backdrop: 0.2, hills: 0.6, hero: 1.1, title: 1.8 }

const LINES = [
  ['เปลี่ยนประโยคนี้เป็นเรื่องของคุณ', 2.6, 5.2],
  ['แล้วสั่ง render เป็น mp4', 5.4, 7.8],
]

function world(c, t) {
  c.fillStyle = '#e6d5b1'
  c.fillRect(-400, -600, 1900, 3100)
  popUp(c, t, AT.backdrop, P(540, 1100), () => {
    sheet(c, rect(-260, -400, 1600, 1500), '#f4dcae', { lift: 1.6 })
    sheet(c, ellipse(760, 480, 110, 110, 36), '#ef9b52', { lift: 0.8 })
    sheet(c, blob(280, 420, 160, 60, 5, 3, 0.3), '#fbf2df', { lift: 1 })
  })
  popUp(c, t, AT.hills, P(540, 1120), () => sheet(c, scallopTop(-260, 1340, 1130, 260, 4, 2), '#93ad8c', { lift: 1.2 }))
  sheet(c, rect(-260, 1120, 1600, 1000), '#c7a86c', { lift: 1 })
  popUp(c, t, AT.hero, P(540, 1260), () => {
    sheet(c, rect(470, 1080, 140, 180), '#c58d57', { lift: 1 })
    fold(c, [P(440, 1090), P(540, 960), P(640, 1090)], '#8c3b2a', { apex: P(540, 1050), depth: 0.3, lift: 1.2 })
  })
}

function draw(c, t) {
  camera(c, t, [[0, 540, 960, 1], [DURATION, 540, 1000, 1.05]], () => world(c, t))
}

function overlay(c, t) {
  popUp(c, t, AT.title, P(540, 250), () => label(c, 'ชื่อเรื่อง', 540, 200, { size: 80, weight: 700, tilt: -0.02 }), { lean: 0 })
  subtitles(c, t, LINES, { y: 1700 })
}

async function sound(k) {
  for (const at of Object.values(AT)) k.fold(at)
  k.pad(0, DURATION, [57, 64, 69, 72])
}

stage({ duration: DURATION, draw, overlay, sound, lens: { focus: 1150, band: 600, soft: 520, blur: 7 } })

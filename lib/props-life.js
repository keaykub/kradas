import { P, shade } from './core.js'
import { sheet, fold, rect, ellipse, blob, strip } from './paper.js'
import { palette as C, planks } from './props.js'

function basket(c, x, y, goods) {
  sheet(c, [P(x - 24, y), P(x + 24, y), P(x + 18, y + 30), P(x - 18, y + 30)], '#c9a45c', { lift: 0.6, print: (p, b) => planks(p, b, '#a8843f', 7) })
  for (let i = 0; i < 4; i++) sheet(c, ellipse(x - 15 + i * 10, y - 4 - (i % 2) * 5, 8, 8, 10), goods[i % goods.length], { lift: 0.3, edgeScale: 0.5 })
}

export function villager(c, { frame = 0, top = '#3f6b9a', bottom = '#7a3f2c', skin = C.skin, hat = true, carry = null, hair = '#2b1d12' } = {}) {
  const stride = frame ? 14 : 0
  sheet(c, [P(-12 - stride, 0), P(-14, -40), P(-2, -40), P(-2 - stride * 0.3, 0)], skin, { lift: 0.5 })
  sheet(c, [P(4 + stride * 0.3, 0), P(2, -40), P(14, -40), P(14 + stride, 0)], shade(skin, -0.08), { lift: 0.5 })
  sheet(c, [P(-26, -34), P(26, -34), P(22, -126), P(-22, -126)], bottom, {
    lift: 0.9,
    print: (p, b) => { p.strokeStyle = shade(bottom, 0.3); p.lineWidth = 3; for (let y = b.y1 - 12; y > b.y1 - 40; y -= 9) { p.beginPath(); p.moveTo(b.x0, y); p.lineTo(b.x1, y); p.stroke() } },
  })
  sheet(c, [P(-27, -120), P(-30, -196), P(30, -196), P(27, -120)], top, { lift: 1 })
  const swing = frame ? 0.3 : -0.12
  if (carry === 'baskets') {
    sheet(c, rect(-104, -200, 208, 7), '#a67f45', { lift: 0.7, edgeScale: 0.7 })
    for (const x of [-96, 96]) {
      sheet(c, strip(P(x - 14, -196), P(x - 20, -116), 3), '#6e4529', { lift: 0, edge: false })
      sheet(c, strip(P(x + 14, -196), P(x + 20, -116), 3), '#6e4529', { lift: 0, edge: false })
      basket(c, x, -118, x < 0 ? ['#f0a23a', '#f4d04a'] : ['#7aa25a', '#d9533a'])
    }
    sheet(c, strip(P(-28, -188), P(-44, -198), 14), shade(top, -0.1), { lift: 0.8 })
    sheet(c, strip(P(28, -188), P(44, -198), 14), shade(top, -0.1), { lift: 0.8 })
  } else {
    sheet(c, strip(P(-29, -188), P(-29 - Math.sin(swing) * 54, -188 + Math.cos(swing) * 54), 15), shade(top, -0.1), { lift: 0.8 })
    sheet(c, strip(P(29, -188), P(29 + Math.sin(swing) * 54, -188 + Math.cos(swing) * 54), 15), shade(top, -0.1), { lift: 0.8 })
  }
  sheet(c, ellipse(0, -224, 24, 26, 20), skin, { lift: 0.9 })
  sheet(c, ellipse(8, -226, 3.2, 4, 8), '#2b1d12', { lift: 0, edge: false })
  sheet(c, ellipse(-7, -226, 3.2, 4, 8), '#2b1d12', { lift: 0, edge: false })
  if (hat) fold(c, [P(-66, -232), P(-32, -250), P(0, -268), P(32, -250), P(66, -232), P(0, -222)], C.hat, { apex: P(0, -252), depth: 0.3, lift: 1 })
  else {
    sheet(c, [P(-25, -228), P(-22, -250), P(0, -256), P(22, -250), P(25, -228), P(12, -242), P(-12, -242)], hair, { lift: 0.5 })
    sheet(c, ellipse(0, -258, 11, 9, 12), hair, { lift: 0.5 })
  }
}

export function monk(c, { frame = 0 } = {}) {
  const robe = '#e08a2c', stride = frame ? 12 : 0
  sheet(c, [P(-10 - stride, 0), P(-12, -30), P(0, -30), P(-stride * 0.3, 0)], C.skin, { lift: 0.5 })
  sheet(c, [P(4 + stride * 0.3, 0), P(2, -30), P(14, -30), P(12 + stride, 0)], shade(C.skin, -0.08), { lift: 0.5 })
  fold(c, [P(-34, -24), P(34, -24), P(30, -200), P(-30, -200)], robe, { apex: P(-6, -110), depth: 0.16, lift: 1 })
  sheet(c, [P(-30, -200), P(4, -200), P(34, -80), P(20, -70)], shade(robe, -0.14), { lift: 0.6 })
  sheet(c, ellipse(6, -112, 26, 20, 16), '#3a2e2a', { lift: 0.8 })
  sheet(c, rect(-20, -128, 52, 8), '#55443c', { lift: 0.3, edgeScale: 0.6 })
  sheet(c, ellipse(0, -226, 24, 26, 20), C.skin, { lift: 0.9 })
  sheet(c, ellipse(8, -228, 3.2, 4, 8), '#2b1d12', { lift: 0, edge: false })
  sheet(c, ellipse(-7, -228, 3.2, 4, 8), '#2b1d12', { lift: 0, edge: false })
}

export function buffalo(c, { egret = true } = {}) {
  const hide = '#5d5762', dark = '#48434c'
  for (const [x, back] of [[-84, 1], [70, 1], [-60, 0], [94, 0]]) sheet(c, rect(x - 13, -70, 26, 70), back ? dark : hide, { lift: 0.5 })
  sheet(c, [P(-140, -112), P(-166, -40), P(-154, -36), P(-126, -96)], dark, { lift: 0.4 })
  sheet(c, blob(0, -118, 150, 70, 4, 6, 0.08), hide, { lift: 1.1 })
  sheet(c, blob(142, -146, 58, 46, 4, 2, 0.08), hide, { lift: 1 })
  sheet(c, [P(170, -132), P(204, -122), P(200, -98), P(168, -104)], shade(hide, 0.14), { lift: 0.5 })
  sheet(c, ellipse(150, -152, 5, 6, 8), '#1c1414', { lift: 0, edge: false })
  const horn = s => [P(132 + s * 20, -182), P(132 + s * 62, -206), P(132 + s * 86, -250), P(132 + s * 66, -222), P(132 + s * 24, -168)]
  sheet(c, horn(-1), '#e8dcc0', { lift: 0.6 })
  sheet(c, horn(1), '#e8dcc0', { lift: 0.6 })
  if (!egret) return
  sheet(c, rect(-22, -206, 3, 26), '#3a2414', { lift: 0, edge: false })
  sheet(c, rect(-12, -206, 3, 26), '#3a2414', { lift: 0, edge: false })
  sheet(c, ellipse(-18, -220, 24, 14, 14, -0.2), '#fdf8ec', { lift: 0.6 })
  sheet(c, [P(-2, -226), P(12, -262), P(20, -258), P(6, -218)], '#fdf8ec', { lift: 0.5 })
  sheet(c, [P(16, -262), P(38, -258), P(18, -254)], '#f0a23a', { lift: 0.2, edgeScale: 0.5 })
}

export function egret(c) {
  sheet(c, rect(-8, -70, 4, 70), '#3a2414', { lift: 0.2, edge: false })
  sheet(c, rect(4, -70, 4, 70), '#3a2414', { lift: 0.2, edge: false })
  sheet(c, ellipse(-4, -96, 40, 24, 16, -0.25), '#fdf8ec', { lift: 0.8 })
  sheet(c, [P(20, -104), P(34, -160), P(46, -160), P(34, -94)], '#fdf8ec', { lift: 0.7 })
  sheet(c, ellipse(42, -166, 12, 10, 12), '#fdf8ec', { lift: 0.6 })
  sheet(c, [P(50, -170), P(84, -164), P(50, -160)], '#f0a23a', { lift: 0.3, edgeScale: 0.6 })
  sheet(c, ellipse(44, -168, 2.5, 2.5, 6), '#1c1414', { lift: 0, edge: false })
}

export function chicken(c, { color = '#c9772f' } = {}) {
  sheet(c, rect(-4, -18, 3, 18), '#d9a441', { lift: 0, edge: false })
  sheet(c, rect(6, -18, 3, 18), '#d9a441', { lift: 0, edge: false })
  sheet(c, [P(-24, -34), P(-48, -62), P(-40, -34), P(-50, -44), P(-30, -22)], shade(color, -0.25), { lift: 0.5, edgeScale: 0.6 })
  sheet(c, blob(0, -34, 28, 20, 4, 2, 0.08), color, { lift: 0.7, edgeScale: 0.7 })
  sheet(c, ellipse(22, -54, 12, 12, 12), color, { lift: 0.6, edgeScale: 0.7 })
  sheet(c, [P(16, -64), P(22, -74), P(26, -66), P(30, -72), P(30, -62)], '#c2412d', { lift: 0.3, edgeScale: 0.5 })
  sheet(c, [P(32, -56), P(44, -52), P(32, -48)], '#f0a23a', { lift: 0.2, edgeScale: 0.5 })
  sheet(c, ellipse(25, -56, 2, 2, 6), '#1c1414', { lift: 0, edge: false })
}

export function duck(c, { color = '#fdf8ec' } = {}) {
  sheet(c, [P(-40, -8), P(-52, -30), P(-30, -24), P(20, -26), P(34, -10), P(24, 2), P(-28, 2)], color, { lift: 0.7, edgeScale: 0.7 })
  sheet(c, [P(-26, -14), P(4, -18), P(-4, -4), P(-22, -4)], shade(color, -0.1), { lift: 0.3, edgeScale: 0.5 })
  sheet(c, [P(16, -22), P(20, -46), P(34, -46), P(32, -18)], color, { lift: 0.5, edgeScale: 0.7 })
  sheet(c, ellipse(28, -50, 12, 11, 12), color, { lift: 0.5, edgeScale: 0.7 })
  sheet(c, [P(38, -54), P(54, -48), P(38, -44)], '#f0a23a', { lift: 0.2, edgeScale: 0.5 })
  sheet(c, ellipse(31, -53, 2, 2, 6), '#1c1414', { lift: 0, edge: false })
}

export function bird(c, { frame = 0, color = '#4a4038' } = {}) {
  const w = frame ? -26 : 22
  sheet(c, [P(-8, -40), P(-58, -40 - w), P(-30, -36)], shade(color, 0.1), { lift: 0.4, edgeScale: 0.6 })
  sheet(c, [P(8, -40), P(58, -40 - w), P(30, -36)], shade(color, 0.1), { lift: 0.4, edgeScale: 0.6 })
  sheet(c, [P(-20, -38), P(0, -46), P(26, -40), P(0, -32)], color, { lift: 0.5, edgeScale: 0.6 })
}

export function butterfly(c, { frame = 0, color = '#f0a23a' } = {}) {
  const w = frame ? 8 : 22
  sheet(c, [P(0, -20), P(-w, -40), P(-w - 4, -22), P(-w * 0.6, -6)], color, { lift: 0.3, edgeScale: 0.5 })
  sheet(c, [P(0, -20), P(w, -40), P(w + 4, -22), P(w * 0.6, -6)], shade(color, 0.15), { lift: 0.3, edgeScale: 0.5 })
  sheet(c, rect(-2, -30, 4, 22), '#3a2414', { lift: 0, edge: false })
}

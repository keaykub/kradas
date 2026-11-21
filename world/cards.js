import * as THREE from 'three'
import { paperFinish } from '../lib/paper.js'

const KRAFT = '#b8986a'

function makeTexture(canvas) {
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

export function paint(pxW, pxH, draw, scale = 1.5) {
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(pxW * scale)
  canvas.height = Math.round(pxH * scale)
  canvas.baseFrac = 6 / pxH
  const c = canvas.getContext('2d')
  c.scale(scale, scale)
  c.translate(pxW / 2, pxH - 6)
  draw(c)
  paperFinish(canvas, 0.55)
  return canvas
}

export function paintFlat(pxW, pxH, draw, scale = 2) {
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(pxW * scale)
  canvas.height = Math.round(pxH * scale)
  const c = canvas.getContext('2d')
  c.scale(scale, scale)
  draw(c)
  paperFinish(canvas, 0.55)
  return canvas
}

function silhouette(src, color) {
  const canvas = document.createElement('canvas')
  canvas.width = src.width
  canvas.height = src.height
  const c = canvas.getContext('2d')
  c.drawImage(src, 0, 0)
  c.globalCompositeOperation = 'source-in'
  c.fillStyle = color
  c.fillRect(0, 0, canvas.width, canvas.height)
  return canvas
}

function cardMaterial(tex, side = THREE.FrontSide) {
  return new THREE.MeshLambertMaterial({ map: tex, alphaTest: 0.5, side })
}

function depthMaterial(tex) {
  return new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: 0.5 })
}

export function card(frames, { height, back = KRAFT, thickness = 0.035, cross = false, glow = false }) {
  const list = Array.isArray(frames) ? frames : [frames]
  const first = list[0], width = height * (first.width / first.height)
  const geo = new THREE.PlaneGeometry(width, height)
  geo.translate(0, height / 2 - height * (first.baseFrac ?? 0), 0)
  const textures = list.map(makeTexture)
  const front = new THREE.Mesh(geo, glow ? new THREE.MeshBasicMaterial({ map: textures[0], alphaTest: 0.5, fog: false }) : cardMaterial(textures[0]))
  front.castShadow = !glow
  front.receiveShadow = !glow
  front.customDepthMaterial = depthMaterial(textures[0])
  const pivot = new THREE.Group()
  pivot.add(front)
  if (cross) {
    const wing = new THREE.Mesh(geo, cardMaterial(textures[0], THREE.DoubleSide))
    wing.rotation.y = Math.PI / 2
    wing.castShadow = true
    wing.receiveShadow = true
    wing.customDepthMaterial = depthMaterial(textures[0])
    pivot.add(wing)
  }
  if (back) {
    const rear = new THREE.Mesh(geo, cardMaterial(makeTexture(silhouette(first, back)), THREE.BackSide))
    rear.position.z = -thickness
    pivot.add(rear)
  }
  const root = new THREE.Group()
  root.add(pivot)
  root.userData = { pivot, front, textures, width, height, frame: 0 }
  return root
}

export function stack(layers, { height, back = KRAFT, gap = 0.13, thickness = 0.035 }) {
  const first = layers[0], width = height * (first.width / first.height)
  const geo = new THREE.PlaneGeometry(width, height)
  geo.translate(0, height / 2 - height * (first.baseFrac ?? 0), 0)
  const pivot = new THREE.Group()
  const textures = layers.map(makeTexture)
  let front = null
  textures.forEach((tex, i) => {
    front = new THREE.Mesh(geo, cardMaterial(tex))
    front.position.z = i * gap
    front.castShadow = true
    front.receiveShadow = true
    front.customDepthMaterial = depthMaterial(tex)
    pivot.add(front)
  })
  const rear = new THREE.Mesh(geo, cardMaterial(makeTexture(silhouette(first, back)), THREE.BackSide))
  rear.position.z = -thickness
  pivot.add(rear)
  const root = new THREE.Group()
  root.add(pivot)
  root.userData = { pivot, front, textures: [textures[textures.length - 1]], width, height, frame: 0 }
  return root
}

function solidMesh(geo, material) {
  const mesh = new THREE.Mesh(geo, material)
  mesh.castShadow = true
  mesh.receiveShadow = true
  if (material.alphaTest) mesh.customDepthMaterial = depthMaterial(material.map)
  return mesh
}

export function foldedHouse({ front, side, roof, glowFront = null, glowSide = null, fascia = null, ladder = null, width = 3, depth = 2.6, wallH = 1.5, gableH = 1.5, stilts = 1.15, overhang = 0.4, wood = '#6e4529', floor = '#9a6a42' }) {
  const pivot = new THREE.Group(), body = stilts + wallH, faceH = wallH + gableH
  const frontTex = makeTexture(front), sideTex = makeTexture(side), roofTex = makeTexture(roof)
  roofTex.wrapS = roofTex.wrapT = THREE.RepeatWrapping
  roofTex.repeat.set(2, 2)
  const lit = canvas => (canvas ? { emissiveMap: makeTexture(canvas), emissive: new THREE.Color('#ffffff') } : {})
  const face = new THREE.PlaneGeometry(width, faceH)
  for (const s of [1, -1]) {
    const m = solidMesh(face, new THREE.MeshLambertMaterial({ map: frontTex, alphaTest: 0.5, side: THREE.DoubleSide, ...lit(glowFront) }))
    m.position.set(0, stilts + faceH / 2, s * depth / 2)
    if (s < 0) m.rotation.y = Math.PI
    pivot.add(m)
  }
  const wall = new THREE.PlaneGeometry(depth, wallH)
  for (const s of [1, -1]) {
    const m = solidMesh(wall, new THREE.MeshLambertMaterial({ map: sideTex, side: THREE.DoubleSide, ...lit(glowSide) }))
    m.position.set(s * width / 2, stilts + wallH / 2, 0)
    m.rotation.y = s * Math.PI / 2
    pivot.add(m)
  }
  const angle = Math.atan2(gableH, width / 2), slope = Math.hypot(width / 2, gableH) + overhang
  const slab = new THREE.BoxGeometry(slope, 0.06, depth + overhang * 2)
  for (const s of [1, -1]) {
    const m = solidMesh(slab, new THREE.MeshLambertMaterial({ map: roofTex }))
    m.position.set(s * Math.cos(angle) * slope / 2, stilts + faceH + 0.05 - Math.sin(angle) * slope / 2, 0)
    m.rotation.z = -s * angle
    pivot.add(m)
  }
  if (fascia) {
    const tex = makeTexture(fascia), h = (width + overhang * 2.4) * (fascia.height / fascia.width)
    const m = solidMesh(new THREE.PlaneGeometry(width + overhang * 2.4, h), new THREE.MeshLambertMaterial({ map: tex, alphaTest: 0.5, side: THREE.DoubleSide }))
    m.position.set(0, stilts + faceH + 0.1 + h * (fascia.apexFrac ?? 0) - h / 2, depth / 2 + overhang + 0.04)
    pivot.add(m)
  }
  if (stilts > 0) {
    const deck = solidMesh(new THREE.BoxGeometry(width + 0.5, 0.12, depth + 1.1), new THREE.MeshLambertMaterial({ color: floor }))
    deck.position.set(0, stilts - 0.06, 0.3)
    pivot.add(deck)
    const post = new THREE.BoxGeometry(0.14, stilts, 0.14), postMat = new THREE.MeshLambertMaterial({ color: wood })
    for (const x of [-1, 0, 1]) for (const z of [-1, 1]) {
      const m = solidMesh(post, postMat)
      m.position.set(x * (width / 2 - 0.12), stilts / 2, z * (depth / 2 - 0.1) + (z > 0 ? 0.55 : 0))
      pivot.add(m)
    }
    if (ladder) {
      const run = stilts * 0.75, len = Math.hypot(stilts, run)
      const m = solidMesh(new THREE.PlaneGeometry(0.8, len), new THREE.MeshLambertMaterial({ map: makeTexture(ladder), alphaTest: 0.5, side: THREE.DoubleSide }))
      m.position.set(0, stilts / 2, depth / 2 + 0.85 + run / 2)
      m.rotation.x = -Math.atan2(run, stilts)
      pivot.add(m)
    }
  }
  const root = new THREE.Group()
  root.add(pivot)
  root.userData = { pivot, rise: true, width, height: stilts + faceH }
  return root
}

export function skyTexture(top, bottom) {
  const canvas = document.createElement('canvas')
  canvas.width = 8
  canvas.height = 512
  const c = canvas.getContext('2d'), g = c.createLinearGradient(0, 0, 0, 512)
  g.addColorStop(0, top)
  g.addColorStop(0.62, bottom)
  g.addColorStop(1, bottom)
  c.fillStyle = g
  c.fillRect(0, 0, 8, 512)
  return makeTexture(canvas)
}

export function setFrame(cardRoot, i) {
  const d = cardRoot.userData
  if (d.frame === i) return
  d.frame = i
  d.front.material.map = d.textures[i]
  d.front.customDepthMaterial.map = d.textures[i]
  d.front.material.needsUpdate = true
  d.front.customDepthMaterial.needsUpdate = true
}

export function groundTexture(size, draw) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  draw(canvas.getContext('2d'), size)
  const tex = makeTexture(canvas)
  tex.anisotropy = 8
  return tex
}

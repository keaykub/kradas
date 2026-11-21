import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { foley, renderSound, toWav } from '../lib/sound.js'
import { rng } from '../lib/core.js'
import { setFrame } from './cards.js'

const VERT = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }'

const TILT = {
  uniforms: {
    tDiffuse: { value: null },
    dir: { value: new THREE.Vector2(1, 0) },
    res: { value: new THREE.Vector2(1, 1) },
    focus: { value: 0.45 },
    band: { value: 0.2 },
    soft: { value: 0.4 },
    amount: { value: 1.7 },
  },
  vertexShader: VERT,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform vec2 dir; uniform vec2 res; uniform float focus; uniform float band; uniform float soft; uniform float amount;
    varying vec2 vUv;
    void main() {
      float b = smoothstep(band, band + soft, abs(vUv.y - focus)) * amount;
      vec4 sum = vec4(0.0); float total = 0.0;
      for (int i = -6; i <= 6; i++) {
        float w = exp(-float(i * i) / 18.0);
        sum += texture2D(tDiffuse, vUv + dir * float(i) * b / res) * w;
        total += w;
      }
      gl_FragColor = sum / total;
    }`,
}

const FINISH = {
  uniforms: { tDiffuse: { value: null }, time: { value: 0 }, fade: { value: 0 }, tint: { value: new THREE.Color('#2a170c') }, res: { value: new THREE.Vector2(1, 1) } },
  vertexShader: VERT,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float time; uniform float fade; uniform vec3 tint; uniform vec2 res;
    varying vec2 vUv;
    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    void main() {
      vec4 col = texture2D(tDiffuse, vUv);
      float d = distance(vUv, vec2(0.5));
      col.rgb = mix(col.rgb, tint, smoothstep(0.42, 0.85, d) * 0.45);
      float g = hash(floor(vUv * res / 1.5) + floor(time * 12.0)) - 0.5;
      col.rgb += g * 0.04 * (0.25 + dot(col.rgb, vec3(0.33)));
      col.rgb = mix(col.rgb, vec3(0.93, 0.85, 0.68), fade);
      gl_FragColor = col;
    }`,
}

function injectUi(title, subtitle) {
  document.head.insertAdjacentHTML('beforeend', `
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Kanit:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  html,body{margin:0;height:100%;overflow:hidden;background:#e9d8b4;font-family:Kanit,system-ui,sans-serif;color:#3a2414;touch-action:none;user-select:none;-webkit-user-select:none}
  canvas{display:block}
  .kr-chip{position:fixed;background:#f6ecd6;border-radius:4px;box-shadow:3px 5px 0 rgba(74,44,22,.25);padding:8px 14px;font-weight:600}
  #kr-title{top:16px;left:16px;font-size:18px;transform:rotate(-1.5deg)}
  #kr-title small{display:block;font-weight:400;font-size:12px;opacity:.7}
  #kr-sound{top:16px;right:16px;border:0;font:inherit;font-size:14px;color:inherit;cursor:pointer;min-height:44px;min-width:44px}
  #kr-sound:active{transform:scale(.97)}
  #kr-hint{left:50%;bottom:22px;transform:translateX(-50%);font-size:15px;font-weight:400;white-space:nowrap;transition:opacity .6s}
  #kr-caption{left:50%;bottom:28px;transform:translate(-50%,16px) rotate(-.8deg);max-width:min(520px,calc(100vw - 32px));box-sizing:border-box;
    padding:14px 18px;opacity:0;transition:opacity .25s,transform .25s;pointer-events:none}
  #kr-caption.on{opacity:1;transform:translate(-50%,0) rotate(-.8deg)}
  #kr-caption b{display:block;font-size:19px;margin-bottom:2px;color:#a6331f}
  #kr-caption span{font-weight:400;font-size:15px;line-height:1.55}
  #kr-fade{position:fixed;inset:0;background:#f6ecd6;opacity:0;pointer-events:none;transition:opacity .6s}
  #kr-fade.on{opacity:1}
  body.rec .kr-chip,body.rec #kr-stick,body.rec #kr-fade{display:none!important}
  #kr-stick{position:fixed;width:96px;height:96px;margin:-48px 0 0 -48px;border-radius:50%;background:rgba(246,236,214,.55);box-shadow:inset 0 0 0 2px rgba(74,44,22,.25);display:none;pointer-events:none}
  #kr-stick i{position:absolute;left:50%;top:50%;width:40px;height:40px;margin:-20px 0 0 -20px;border-radius:50%;background:#f6ecd6;box-shadow:2px 3px 0 rgba(74,44,22,.3)}
  @media (prefers-reduced-motion: reduce){#kr-caption,#kr-hint{transition:none}}
</style>`)
  document.body.insertAdjacentHTML('beforeend', `
<div id="kr-title" class="kr-chip">${title}<small>${subtitle}</small></div>
<button id="kr-sound" class="kr-chip">เปิดเสียง</button>
<div id="kr-hint" class="kr-chip">เดินด้วย WASD / ลูกศร หรือแตะค้างแล้วลาก</div>
<div id="kr-caption" class="kr-chip"><b></b><span></span></div>
<div id="kr-stick"><i></i></div>
<div id="kr-fade"></div>`)
}

export function createWorld({ title = '', size = 64, ground, walkable = () => true, start = { x: 0, z: 8 }, background = '#f1dfba', sky = null, petals = 46, player, theme = {}, subtitle = 'kradas · เดินเล่นในโลกกระดาษ', groundGlow = null, tour = null, view = {} }) {
  injectUi(title, subtitle)
  const query = new URLSearchParams(location.search), rec = query.has('rec'), rand = rng(7), events = []
  if (rec) document.body.classList.add('rec')
  const T = {
    hemiSky: '#ffeccb', hemiGround: '#8d8a58', hemi: 1.75, sun: '#ffdfae', sunPower: 2.7, vignette: '#2a170c', fogNear: 36, fogFar: 74,
    petalColors: ['#f6c3cf', '#fbf2df', '#f4d97a', '#f2a8b8'], petalRise: false, petalGlow: false, bloom: 0, ...theme,
  }
  const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' })
  const quality = query.get('q')
  renderer.setPixelRatio(rec ? 1 : Math.min(devicePixelRatio, quality === 'high' ? 2 : 1.25))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  document.body.prepend(renderer.domElement)

  const scene = new THREE.Scene()
  scene.background = sky ?? new THREE.Color(background)
  scene.fog = new THREE.Fog(background, T.fogNear, T.fogFar)
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 200)

  scene.add(new THREE.HemisphereLight(T.hemiSky, T.hemiGround, T.hemi))
  const sun = new THREE.DirectionalLight(T.sun, T.sunPower)
  sun.castShadow = true
  sun.shadow.mapSize.set(2048, 2048)
  Object.assign(sun.shadow.camera, { left: -18, right: 18, top: 18, bottom: -18, near: 1, far: 60 })
  sun.shadow.radius = 5
  sun.shadow.bias = -0.0006
  sun.shadow.normalBias = 0.02
  scene.add(sun, sun.target)

  const groundMesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshLambertMaterial(groundGlow ? { map: ground, emissiveMap: groundGlow, emissive: '#ffffff' } : { map: ground }))
  groundMesh.rotation.x = -Math.PI / 2
  groundMesh.receiveShadow = true
  scene.add(groundMesh)

  const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, { samples: 4, type: THREE.HalfFloatType }))
  composer.addPass(new RenderPass(scene, camera))
  if (T.bloom) composer.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), T.bloom, 0.7, 0.78))
  const tiltH = new ShaderPass(TILT), tiltV = new ShaderPass(TILT), finish = new ShaderPass(FINISH)
  tiltV.uniforms.dir.value.set(0, 1)
  composer.addPass(tiltH)
  composer.addPass(tiltV)
  finish.uniforms.tint.value.set(T.vignette)
  composer.addPass(finish)
  composer.addPass(new OutputPass())

  const resize = () => {
    const w = innerWidth, h = innerHeight
    renderer.setSize(w, h)
    composer.setSize(w, h)
    camera.aspect = w / h
    camera.fov = w < h ? 42 : 30
    camera.updateProjectionMatrix()
    const pr = renderer.getPixelRatio()
    for (const p of [tiltH, tiltV, finish]) p.uniforms.res.value.set(w * pr, h * pr)
  }
  addEventListener('resize', resize)
  resize()

  const petalMesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.13, 0.09), new THREE.MeshBasicMaterial(T.petalGlow ? { side: THREE.DoubleSide, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false } : { side: THREE.DoubleSide }), petals)
  const petalSeeds = [...Array(petals)].map((_, i) => ({ x: Math.sin(i * 12.9) * 13, z: Math.cos(i * 7.3) * 9, y: 0.6 + ((i * 37) % 50) / 12, s: 0.5 + ((i * 17) % 10) / 10 }))
  const petalColors = T.petalColors
  petalSeeds.forEach((_, i) => petalMesh.setColorAt(i, new THREE.Color(petalColors[i % petalColors.length])))
  petalMesh.frustumCulled = false
  if (petals) scene.add(petalMesh)
  const petalDummy = new THREE.Object3D()
  function updatePetals(t, cx, cz) {
    petalSeeds.forEach((p, i) => {
      const fall = (p.y + (T.petalRise ? 1 : -1) * t * 0.25 * p.s) % 4.5, y = fall < 0 ? fall + 4.5 : fall
      petalDummy.position.set(cx + p.x + Math.sin(t * 0.6 * p.s + i) * 1.4, y + 0.1, cz + p.z + Math.cos(t * 0.5 + i * 2) * 0.8 - 4)
      petalDummy.rotation.set(t * 1.3 * p.s + i, t * 0.9 + i * 2, Math.sin(t * 2 + i))
      petalDummy.updateMatrix()
      petalMesh.setMatrixAt(i, petalDummy.matrix)
    })
    petalMesh.instanceMatrix.needsUpdate = true
  }

  const props = [], circles = [], signs = [], updates = []
  let audio = null, kit = null, master = null, soundOn = false, clock = 0

  function pose(p) {
    const pivot = p.root.userData.pivot
    if (p.root.userData.rise) pivot.scale.y = Math.max(0.001, p.k)
    else pivot.rotation.x = -(1 - p.k) * Math.PI / 2
  }

  function place(root, { x, z, y = 0, radius = 0, reach = 13, always = false, sway = 0, spin = 0 }) {
    root.position.set(x, y + 0.004 + (props.length % 20) * 0.0004, z)
    root.rotation.y = spin
    scene.add(root)
    const p = { root, x, z, reach, always, sway, k: always ? 1 : 0, v: 0, target: always ? 1 : 0, wait: 0 }
    pose(p)
    props.push(p)
    if (radius) circles.push({ x, z, r: radius })
    return p
  }

  const portals = []
  let leaving = false
  function addPortal(root, { x, z, href, reach = 15, radius = 1.3 }) {
    place(root, { x, z, reach })
    portals.push({ x, z, href, radius })
  }
  function updatePortals() {
    if (leaving || clock < 1.5) return
    const hit = portals.find(p => Math.hypot(p.x - me.x, p.z + 0.4 - me.z) < p.radius)
    if (!hit) return
    leaving = true
    if (kit) kit.fold(now(), 1.2)
    fadeTarget = 1
    if (!rec) setTimeout(() => { location.href = hit.href }, 650)
  }
  function addLight(x, y, z, color, power = 14, distance = 9) {
    const light = new THREE.PointLight(color, power, distance, 1.6)
    light.position.set(x, y, z)
    scene.add(light)
    return light
  }

  function addSign(root, { x, z, title: heading, text, reach = 2.8 }) {
    place(root, { x, z, radius: 0.3, reach: 9 })
    signs.push({ x, z, heading, text, reach })
  }

  const me = { x: start.x, z: start.z, vx: 0, vz: 0, phase: 0, frame: 0, face: 1, moved: false }
  scene.add(player)
  const playerPivot = player.userData.pivot

  const keys = new Set()
  addEventListener('keydown', e => {
    keys.add(e.code)
    if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault()
    wakeAudio()
  })
  addEventListener('keyup', e => keys.delete(e.code))
  const stick = { on: false, ox: 0, oy: 0, x: 0, y: 0, id: null }
  const stickEl = document.getElementById('kr-stick'), knob = stickEl.querySelector('i')
  renderer.domElement.addEventListener('pointerdown', e => {
    wakeAudio()
    Object.assign(stick, { on: true, ox: e.clientX, oy: e.clientY, x: 0, y: 0, id: e.pointerId })
    renderer.domElement.setPointerCapture(e.pointerId)
    stickEl.style.display = 'block'
    stickEl.style.left = e.clientX + 'px'
    stickEl.style.top = e.clientY + 'px'
    knob.style.transform = ''
  })
  renderer.domElement.addEventListener('pointermove', e => {
    if (!stick.on || e.pointerId !== stick.id) return
    let dx = (e.clientX - stick.ox) / 48, dy = (e.clientY - stick.oy) / 48
    const l = Math.hypot(dx, dy)
    if (l > 1) { dx /= l; dy /= l }
    stick.x = dx
    stick.y = dy
    knob.style.transform = `translate(${dx * 28}px,${dy * 28}px)`
  })
  const release = e => {
    if (e.pointerId !== stick.id) return
    stick.on = false
    stick.x = stick.y = 0
    stickEl.style.display = 'none'
  }
  renderer.domElement.addEventListener('pointerup', release)
  renderer.domElement.addEventListener('pointercancel', release)

  const soundBtn = document.getElementById('kr-sound')
  function wakeAudio() {
    if (audio) return
    audio = new AudioContext()
    master = audio.createGain()
    master.connect(audio.destination)
    kit = foley(audio, master)
    setSound(true)
  }
  function setSound(on) {
    soundOn = on
    if (master) master.gain.setTargetAtTime(on ? 0.9 : 0, audio.currentTime, 0.05)
    soundBtn.textContent = on ? 'ปิดเสียง' : 'เปิดเสียง'
  }
  soundBtn.addEventListener('pointerdown', e => e.stopPropagation())
  soundBtn.addEventListener('click', () => {
    if (!audio) return wakeAudio()
    setSound(!soundOn)
  })
  let padUntil = 0
  const music = () => {
    if (rec || !kit || audio.currentTime < padUntil - 2) return
    const at = Math.max(audio.currentTime, padUntil)
    kit.pad(at, 24, [57, 64, 69, 72], 0.7)
    ;[76, 74, 72, 69, 72, 74, 76, 79].forEach((n, i) => kit.pluck(at + 3 + i * 1.6, n, 0.45))
    padUntil = at + 24
  }

  function blocked(x, z) {
    if (!walkable(x, z)) return true
    return circles.some(c => (x - c.x) ** 2 + (z - c.z) ** 2 < (c.r + 0.35) ** 2)
  }

  const hint = document.getElementById('kr-hint'), caption = document.getElementById('kr-caption')
  let activeSign = null

  let tourIndex = 0
  function autopilot() {
    if (clock < (tour.wait ?? 0.9)) return [0, 0]
    while (tourIndex < tour.points.length && Math.hypot(tour.points[tourIndex][0] - me.x, tour.points[tourIndex][1] - me.z) < 0.35) tourIndex++
    if (tourIndex >= tour.points.length) return [0, 0]
    const [tx, tz] = tour.points[tourIndex], l = Math.hypot(tx - me.x, tz - me.z)
    return [(tx - me.x) / l, (tz - me.z) / l]
  }

  function input() {
    if (tour) return autopilot()
    let x = stick.x, z = stick.y
    if (keys.has('KeyA') || keys.has('ArrowLeft')) x -= 1
    if (keys.has('KeyD') || keys.has('ArrowRight')) x += 1
    if (keys.has('KeyW') || keys.has('ArrowUp')) z -= 1
    if (keys.has('KeyS') || keys.has('ArrowDown')) z += 1
    const l = Math.hypot(x, z)
    return l > 1 ? [x / l, z / l] : [x, z]
  }

  function movePlayer(dt) {
    const [ix, iz] = input(), speed = tour?.speed ?? 4.6
    me.vx += (ix * speed - me.vx) * Math.min(1, dt * 10)
    me.vz += (iz * speed - me.vz) * Math.min(1, dt * 10)
    const nx = me.x + me.vx * dt, nz = me.z + me.vz * dt
    if (!blocked(nx, nz)) { me.x = nx; me.z = nz }
    else if (!blocked(nx, me.z)) me.x = nx
    else if (!blocked(me.x, nz)) me.z = nz
    const moving = Math.hypot(me.vx, me.vz) > 0.4
    if (moving && !me.moved) {
      me.moved = true
      hint.style.opacity = 0
    }
    if (ix < -0.1) me.face = -1
    if (ix > 0.1) me.face = 1
    if (moving) {
      me.phase += dt * Math.hypot(me.vx, me.vz) * 1.5
      const frame = Math.floor(me.phase) % 2
      if (frame !== me.frame && kit) kit.step(now(), 0.9)
      me.frame = frame
    } else {
      me.phase = 0
      me.frame = 0
    }
    setFrame(player, me.frame)
    player.position.set(me.x, 0.01, me.z)
    playerPivot.scale.x += (me.face - playerPivot.scale.x) * Math.min(1, dt * 14)
    playerPivot.position.y = moving ? Math.abs(Math.sin(me.phase * Math.PI)) * 0.07 : 0
    playerPivot.rotation.z = moving ? Math.sin(me.phase * Math.PI) * 0.04 : 0
  }

  function updateProps(dt) {
    for (const p of props) {
      if (!p.always) {
        const d = Math.hypot(p.x - me.x, p.z - me.z)
        const want = clock < 0.5 ? 0 : d < p.reach ? 1 : d > p.reach + 3 ? 0 : p.target
        if (want !== p.target) {
          p.target = want
          p.wait = want ? d * 0.035 + rand() * 0.08 : 0
          p.sounded = false
        }
        if (p.wait > 0) p.wait -= dt
        else {
          if (!p.sounded && kit) {
            const gain = 0.25 + 0.75 * Math.max(0, 1 - d / (p.reach + 2)), pan = Math.max(-1, Math.min(1, (p.x - me.x) / 10))
            if (p.target) kit.fold(now(), gain, pan)
            else kit.flick(now(), gain * 0.6, pan)
          }
          p.sounded = true
          const a = (p.target - p.k) * 150 - p.v * 13
          p.v += a * dt
          p.k += p.v * dt
        }
      }
      const pivot = p.root.userData.pivot
      pose(p)
      pivot.rotation.z = p.sway ? Math.sin(clock * 1.3 + p.x * 0.7) * p.sway * Math.min(1, p.k) : 0
      p.root.visible = p.always || Math.hypot(p.x - me.x, p.z - me.z) < 48
    }
  }

  function updateSigns() {
    let best = null, bestD = Infinity
    for (const s of signs) {
      const d = Math.hypot(s.x - me.x, s.z - me.z)
      if (d < s.reach && d < bestD) { best = s; bestD = d }
    }
    if (best === activeSign) return
    activeSign = best
    if (best) {
      caption.querySelector('b').textContent = best.heading
      caption.querySelector('span').textContent = best.text
      caption.classList.add('on')
      hint.style.opacity = 0
      if (kit) kit.flick(now(), 0.6)
    } else caption.classList.remove('on')
  }

  const now = () => (rec ? clock : audio.currentTime)
  if (rec) kit = new Proxy({}, { get: (_, name) => (at, ...args) => events.push([name, at, ...args]) })
  let fadeLevel = tour?.fadein ? 1 : 0, fadeTarget = 0
  const camPos = new THREE.Vector3(start.x, view.height ?? 11, start.z + (view.back ?? 14)), look = new THREE.Vector3(), projected = new THREE.Vector3()
  function updateCamera(dt) {
    const portrait = innerWidth < innerHeight
    const high = view.height ?? (portrait ? 12 : 9.6), back = view.back ?? (portrait ? 16 : 13.6)
    const want = new THREE.Vector3(me.x, high, me.z + back)
    camPos.lerp(want, 1 - Math.exp(-dt * 4))
    camera.position.copy(camPos)
    look.set(camPos.x, view.lookY ?? 1.0, camPos.z - back - (view.ahead ?? 0))
    camera.lookAt(look)
    sun.position.set(me.x - 9, 15, me.z + 7)
    sun.target.position.set(me.x, 0, me.z)
    projected.set(me.x, 0.9, me.z).project(camera)
    const focus = (projected.y + 1) / 2
    tiltH.uniforms.focus.value = tiltV.uniforms.focus.value = focus
  }

  let last = performance.now()
  const stats = new URLSearchParams(location.search).has('stats') ? [] : null
  function tick(dt) {
    clock += dt
    fadeLevel = Math.max(0, Math.min(1, fadeLevel + Math.sign(fadeTarget - fadeLevel) * dt / 0.45))
    finish.uniforms.fade.value = fadeLevel * fadeLevel * (3 - 2 * fadeLevel)
    movePlayer(dt)
    updateProps(dt)
    updateSigns()
    updatePortals()
    for (const fn of updates) fn(clock, dt, me)
    updateCamera(dt)
    if (petals) updatePetals(clock, camPos.x, me.z)
    finish.uniforms.time.value = clock
    music()
    composer.render()
  }
  function frame(time) {
    const dt = Math.min(0.05, (time - last) / 1000)
    last = time
    tick(dt)
    if (stats) {
      renderer.getContext().finish()
      stats.push(performance.now() - time)
      if (stats.length > 120) stats.shift()
      window.__kradasStats = stats
    }
    requestAnimationFrame(frame)
  }
  function startRecording() {
    tick(0)
    const toBase64 = ab => {
      const bytes = new Uint8Array(ab)
      let s = ''
      for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
      return btoa(s)
    }
    window.__kradas = {
      step: target => { while (clock + 1e-6 < target) tick(1 / 30) },
      wav: async () => toBase64(toWav(await renderSound(clock + 0.8, k => { for (const [name, at, ...args] of events) if (k[name]) k[name](at, ...args) }))),
    }
  }

  return {
    scene,
    place,
    addSign,
    solid: (x, z, r) => circles.push({ x, z, r }),
    addPortal,
    addLight,
    onUpdate: fn => updates.push(fn),
    start: () => document.fonts.ready.then(() => (rec ? startRecording() : requestAnimationFrame(t => { last = t; frame(t) }))),
  }
}

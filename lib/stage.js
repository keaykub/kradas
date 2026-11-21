import { W, H } from './core.js'
import { grain, tiltShift, vignette } from './paper.js'
import { renderSound, toWav } from './sound.js'
import { fonts } from './text.js'

const params = new URLSearchParams(location.search)

function injectPage(background) {
  document.head.insertAdjacentHTML('beforeend', `
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${fonts.href}" rel="stylesheet">
<style>
  html,body{margin:0;height:100%;background:${background};overflow:hidden;font-family:${fonts.body},system-ui,sans-serif;color:#f4ead6}
  #kradas-stage{position:fixed;inset:0;display:grid;place-items:center}
  #kradas-stage canvas{display:block;box-shadow:0 20px 80px rgba(0,0,0,.45)}
  #kradas-ui{position:fixed;left:50%;bottom:14px;transform:translateX(-50%);display:flex;gap:8px;align-items:center;background:rgba(30,20,14,.9);
    padding:8px 12px;border-radius:14px;font-size:14px;max-width:calc(100vw - 32px);box-sizing:border-box}
  #kradas-ui button{font:inherit;color:#f4ead6;background:#4a3324;border:0;border-radius:9px;padding:8px 12px;cursor:pointer;min-height:36px}
  #kradas-ui button:active{transform:scale(.97)}
  #kradas-ui input{width:min(320px,40vw);accent-color:#d9653b}
  #kradas-ui span{font-variant-numeric:tabular-nums;min-width:52px;text-align:right;opacity:.8}
  body.rec #kradas-ui{display:none}
  body.rec #kradas-stage{place-items:start}
</style>`)
  document.body.insertAdjacentHTML('afterbegin', `<div id="kradas-stage"><canvas width="${W}" height="${H}"></canvas></div>
<div id="kradas-ui"><button data-act="play">หยุด</button><input type="range" min="0" step="0.01" value="0"><span>0.0s</span><button data-act="sound">เปิดเสียง</button></div>`)
}

function toBase64(ab) {
  const bytes = new Uint8Array(ab)
  let s = ''
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(s)
}

export function stage({ duration, draw, overlay = null, sound = null, lens = {}, background = '#1c130d', vignetteColor = '#2a170c', grainAmount = 0.22 }) {
  injectPage(background)
  const cv = document.querySelector('#kradas-stage canvas'), c = cv.getContext('2d')
  const rec = params.has('rec'), freeze = params.has('t') ? parseFloat(params.get('t')) : null
  if (rec) document.body.classList.add('rec')

  const render = t => {
    c.setTransform(1, 0, 0, 1, 0, 0)
    c.globalAlpha = 1
    c.clearRect(0, 0, W, H)
    draw(c, t)
    c.setTransform(1, 0, 0, 1, 0, 0)
    c.globalAlpha = 1
    if (lens) tiltShift(c, lens)
    if (vignetteColor) vignette(c, vignetteColor)
    if (overlay) {
      overlay(c, t)
      c.setTransform(1, 0, 0, 1, 0, 0)
      c.globalAlpha = 1
    }
    if (grainAmount) grain(c, grainAmount)
  }

  const fit = () => {
    if (rec) {
      cv.style.width = W + 'px'
      cv.style.height = H + 'px'
      return
    }
    const s = Math.min(innerWidth / W, (innerHeight - 70) / H)
    cv.style.width = W * s + 'px'
    cv.style.height = H * s + 'px'
  }
  addEventListener('resize', fit)
  fit()

  let soundBuffer = null
  const ready = (async () => {
    await Promise.all([400, 600, 700].map(w => document.fonts.load(`${w} 40px ${fonts.body}`)))
    await document.fonts.ready
    if (sound) soundBuffer = await renderSound(duration, sound)
    render(freeze ?? 0)
    return true
  })()

  if (rec) {
    window.__kradas = {
      duration,
      ready,
      step: t => render(t),
      wav: async () => (soundBuffer ? toBase64(toWav(soundBuffer)) : null),
    }
    return { render, ready }
  }

  const ui = document.getElementById('kradas-ui')
  const [playBtn, scrub, time, soundBtn] = [ui.querySelector('[data-act=play]'), ui.querySelector('input'), ui.querySelector('span'), ui.querySelector('[data-act=sound]')]
  scrub.max = duration
  let t = freeze ?? 0, playing = freeze === null, last = performance.now(), audio = null, source = null, soundOn = false

  const stopAudio = () => {
    if (source) {
      try { source.stop() } catch {}
      source.disconnect()
      source = null
    }
  }
  const syncAudio = () => {
    stopAudio()
    if (!soundOn || !playing || !soundBuffer || !audio) return
    source = audio.createBufferSource()
    source.buffer = soundBuffer
    source.connect(audio.destination)
    source.start(0, t)
  }
  const setPlaying = on => {
    playing = on
    playBtn.textContent = on ? 'หยุด' : 'เล่น'
    last = performance.now()
    syncAudio()
  }
  playBtn.onclick = () => setPlaying(!playing)
  cv.onclick = () => setPlaying(!playing)
  soundBtn.onclick = () => {
    audio ??= new AudioContext()
    soundOn = !soundOn
    soundBtn.textContent = soundOn ? 'ปิดเสียง' : 'เปิดเสียง'
    syncAudio()
  }
  scrub.oninput = () => {
    t = +scrub.value
    syncAudio()
  }
  addEventListener('keydown', e => {
    if (e.code === 'Space') {
      e.preventDefault()
      setPlaying(!playing)
    }
  })
  setPlaying(playing)

  const loop = now => {
    if (playing) {
      t += Math.min(0.1, (now - last) / 1000)
      if (t >= duration) {
        t = 0
        syncAudio()
      }
    }
    last = now
    render(t)
    scrub.value = t
    time.textContent = t.toFixed(1) + 's'
    requestAnimationFrame(loop)
  }
  ready.then(() => requestAnimationFrame(loop))
  return { render, ready }
}

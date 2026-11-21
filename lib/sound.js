import { rng } from './core.js'

const RATE = 48000

function noiseBuffer(ac, seconds = 2, seed = 9) {
  const r = rng(seed), buf = ac.createBuffer(1, Math.round(ac.sampleRate * seconds), ac.sampleRate), d = buf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = r() * 2 - 1
  return buf
}

function voice(ac, out, noise) {
  const offset = rng(31)
  const play = (at, { freq = 1800, q = 0.9, type = 'bandpass', gain = 0.5, attack = 0.004, decay = 0.12, length = 0.4, pan = 0 } = {}) => {
    const src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(), p = ac.createStereoPanner()
    src.buffer = noise
    f.type = type
    f.frequency.value = freq
    f.Q.value = q
    p.pan.value = pan
    g.gain.setValueAtTime(0, at)
    g.gain.linearRampToValueAtTime(gain, at + attack)
    g.gain.exponentialRampToValueAtTime(0.0008, at + attack + decay)
    src.connect(f).connect(g).connect(p).connect(out)
    src.start(at, offset() * 1.2, length)
  }
  const tone = (at, { from = 140, to = 60, gain = 0.4, decay = 0.16, type = 'sine' } = {}) => {
    const o = ac.createOscillator(), g = ac.createGain()
    o.type = type
    o.frequency.setValueAtTime(from, at)
    o.frequency.exponentialRampToValueAtTime(to, at + decay)
    g.gain.setValueAtTime(0, at)
    g.gain.linearRampToValueAtTime(gain, at + 0.006)
    g.gain.exponentialRampToValueAtTime(0.0008, at + decay)
    o.connect(g).connect(out)
    o.start(at)
    o.stop(at + decay + 0.05)
  }
  return { play, tone }
}

export function foley(ac, out) {
  const noise = noiseBuffer(ac)
  const v = voice(ac, out, noise)
  return {
    step(at, k = 1, pan = 0) {
      v.play(at, { freq: 650, q: 1.1, gain: 0.16 * k, decay: 0.05, pan })
      v.play(at + 0.01, { freq: 3000, q: 0.8, gain: 0.05 * k, decay: 0.03, pan })
    },
    fold(at, k = 1, pan = 0) {
      v.play(at, { freq: 2200, q: 0.7, gain: 0.32 * k, decay: 0.09, pan })
      v.play(at + 0.03, { freq: 900, q: 0.8, gain: 0.22 * k, decay: 0.14, pan })
      v.tone(at + 0.02, { from: 170, to: 70, gain: 0.28 * k, decay: 0.18 })
    },
    flick(at, k = 1, pan = 0) {
      v.play(at, { freq: 4200, q: 1.2, type: 'highpass', gain: 0.25 * k, decay: 0.05, pan })
    },
    rustle(at, length = 0.8, k = 1, pan = 0) {
      const r = rng(Math.round(at * 100))
      for (let x = 0; x < length; x += 0.045) v.play(at + x + r() * 0.02, { freq: 2600 + r() * 2200, q: 0.6, gain: (0.05 + r() * 0.09) * k, decay: 0.05 + r() * 0.05, pan })
    },
    slide(at, length = 0.6, k = 1, pan = 0) {
      const src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(), p = ac.createStereoPanner()
      src.buffer = noise
      f.type = 'bandpass'
      f.Q.value = 0.5
      f.frequency.setValueAtTime(900, at)
      f.frequency.linearRampToValueAtTime(2600, at + length)
      p.pan.value = pan
      g.gain.setValueAtTime(0, at)
      g.gain.linearRampToValueAtTime(0.12 * k, at + length * 0.3)
      g.gain.linearRampToValueAtTime(0, at + length)
      src.connect(f).connect(g).connect(p).connect(out)
      src.start(at, 0, length + 0.05)
    },
    pad(at, length, notes, k = 1) {
      const g = ac.createGain(), f = ac.createBiquadFilter()
      f.type = 'lowpass'
      f.frequency.value = 1400
      g.gain.setValueAtTime(0, at)
      g.gain.linearRampToValueAtTime(0.07 * k, at + 1.2)
      g.gain.setValueAtTime(0.07 * k, at + length - 1.5)
      g.gain.linearRampToValueAtTime(0, at + length)
      g.connect(f).connect(out)
      for (const n of notes) {
        for (const detune of [-6, 6]) {
          const o = ac.createOscillator()
          o.type = 'triangle'
          o.frequency.value = 440 * Math.pow(2, (n - 69) / 12)
          o.detune.value = detune
          o.connect(g)
          o.start(at)
          o.stop(at + length + 0.1)
        }
      }
    },
    pluck(at, note, k = 1) {
      const o = ac.createOscillator(), g = ac.createGain(), f = ac.createBiquadFilter()
      o.type = 'triangle'
      o.frequency.value = 440 * Math.pow(2, (note - 69) / 12)
      f.type = 'lowpass'
      f.frequency.setValueAtTime(3200, at)
      f.frequency.exponentialRampToValueAtTime(500, at + 0.5)
      g.gain.setValueAtTime(0, at)
      g.gain.linearRampToValueAtTime(0.16 * k, at + 0.005)
      g.gain.exponentialRampToValueAtTime(0.0008, at + 1.1)
      o.connect(f).connect(g).connect(out)
      o.start(at)
      o.stop(at + 1.2)
    },
  }
}

export async function renderSound(duration, build) {
  const ac = new OfflineAudioContext(2, Math.ceil(duration * RATE), RATE)
  const out = ac.createGain()
  out.gain.value = 0.9
  const comp = ac.createDynamicsCompressor()
  out.connect(comp).connect(ac.destination)
  await build({ ac, out, ...foley(ac, out) })
  return ac.startRendering()
}

export function toWav(buffer) {
  const ch = buffer.numberOfChannels, len = buffer.length, bytes = 44 + len * ch * 2, ab = new ArrayBuffer(bytes), v = new DataView(ab)
  const str = (o, s) => [...s].forEach((x, i) => v.setUint8(o + i, x.charCodeAt(0)))
  str(0, 'RIFF')
  v.setUint32(4, bytes - 8, true)
  str(8, 'WAVE')
  str(12, 'fmt ')
  v.setUint32(16, 16, true)
  v.setUint16(20, 1, true)
  v.setUint16(22, ch, true)
  v.setUint32(24, buffer.sampleRate, true)
  v.setUint32(28, buffer.sampleRate * ch * 2, true)
  v.setUint16(32, ch * 2, true)
  v.setUint16(34, 16, true)
  str(36, 'data')
  v.setUint32(40, len * ch * 2, true)
  const data = [...Array(ch)].map((_, i) => buffer.getChannelData(i))
  let o = 44
  for (let i = 0; i < len; i++) {
    for (let c = 0; c < ch; c++) {
      const s = Math.max(-1, Math.min(1, data[c][i]))
      v.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7fff, true)
      o += 2
    }
  }
  return ab
}

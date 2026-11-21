#!/usr/bin/env node
import http from 'node:http'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'

const args = process.argv.slice(2)
const flag = (name, fallback) => {
  const i = args.indexOf(name)
  if (i < 0) return fallback
  const v = args[i + 1]
  args.splice(i, 2)
  return v
}
const fps = +flag('--fps', 30)
const [outW, outH] = flag('--size', '1080x1920').split('x').map(Number)
const root = path.resolve(flag('--root', process.cwd()))
const [pageArg, outArg, secondsArg] = args
if (!pageArg || !outArg || !secondsArg) {
  console.error('usage: node scripts/capture-world.mjs "<page>?rec=1&tour=walk" <outDir> <seconds> [--size 740x1316] [--fps 30]')
  process.exit(1)
}
const outDir = path.resolve(outArg)
fs.mkdirSync(outDir, { recursive: true })

const chromePath = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium'].filter(Boolean).find(p => fs.existsSync(p))
if (!chromePath) throw new Error('Chrome not found, set CHROME_PATH')

const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg' }
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://local')
  let file = path.join(root, decodeURIComponent(url.pathname))
  if (!file.startsWith(root)) { res.writeHead(403); return res.end() }
  if (url.pathname.endsWith('/')) file = path.join(file, 'index.html')
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end() }
    res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream' })
    res.end(data)
  })
})
await new Promise(r => server.listen(0, '127.0.0.1', r))
const pageUrl = `http://127.0.0.1:${server.address().port}/${pageArg.replace(/^\//, '')}`

const sleep = ms => new Promise(r => setTimeout(r, ms))
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'kradas-world-'))
const port = 9400 + Math.floor(Math.random() * 400)
const chrome = spawn(chromePath, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--hide-scrollbars', '--mute-audio', '--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11', '--window-size=1080,1920', 'about:blank'], { stdio: 'ignore' })
let target
for (let i = 0; i < 60 && !target; i++) {
  await sleep(200)
  try { target = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(x => x.type === 'page') } catch {}
}
if (!target) throw new Error('Chrome did not start')
const ws = new WebSocket(target.webSocketDebuggerUrl)
await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject })
let seq = 0
const pending = new Map()
ws.onmessage = ev => {
  const msg = JSON.parse(ev.data)
  if (msg.method === 'Runtime.exceptionThrown') console.log('page error:', msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text)
  if (!msg.id || !pending.has(msg.id)) return
  const { resolve, reject } = pending.get(msg.id)
  pending.delete(msg.id)
  msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result)
}
const cdp = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++seq
  pending.set(id, { resolve, reject })
  ws.send(JSON.stringify({ id, method, params }))
})
const evaluate = async expression => {
  const r = await cdp('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text)
  return r.result.value
}

try {
  await cdp('Emulation.setDeviceMetricsOverride', { width: 1080, height: 1920, deviceScaleFactor: 1, mobile: false })
  await cdp('Page.enable')
  await cdp('Runtime.enable')
  await cdp('Page.navigate', { url: pageUrl })
  console.log('page', pageUrl)
  let ready = false
  for (let i = 0; i < 400 && !ready; i++) {
    await sleep(200)
    ready = await evaluate('!!window.__kradas').catch(() => false)
  }
  if (!ready) throw new Error('page never exposed window.__kradas (is ?rec=1 set?)')
  console.log('gpu', await evaluate("(() => { const gl = document.querySelector('canvas').getContext('webgl2'); const e = gl.getExtension('WEBGL_debug_renderer_info'); return e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : 'unknown' })()"))

  const total = Math.round(+secondsArg * fps)
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', String(fps), '-i', 'pipe:0', '-vf', `scale=${outW}:${outH}:flags=lanczos`, '-q:v', '2', '-start_number', '1', path.join(outDir, 'f%04d.jpg')], { stdio: ['pipe', 'inherit', 'inherit'] })
  const started = Date.now()
  for (let i = 0; i < total; i++) {
    await evaluate(`window.__kradas.step(${(i + 1) / fps}); 0`)
    const { data } = await cdp('Page.captureScreenshot', { format: 'jpeg', quality: 95, clip: { x: 0, y: 0, width: 1080, height: 1920, scale: 1 } })
    if (!ff.stdin.write(Buffer.from(data, 'base64'))) await new Promise(r => ff.stdin.once('drain', r))
    if (i % 30 === 0 || i === total - 1) process.stdout.write(`\rframe ${i + 1}/${total}  ${((Date.now() - started) / 1000).toFixed(0)}s   `)
  }
  ff.stdin.end()
  await new Promise(r => ff.on('close', r))
  const wav = await evaluate('window.__kradas.wav()')
  fs.writeFileSync(path.join(outDir, 'sound.wav'), Buffer.from(wav, 'base64'))
  console.log(`\ndone ${outDir}`)
} finally {
  ws.close()
  chrome.kill()
  server.close()
  await sleep(400)
  try { fs.rmSync(profile, { recursive: true, force: true }) } catch {}
}

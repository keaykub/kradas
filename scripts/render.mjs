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
const root = path.resolve(flag('--root', process.cwd()))
const only = flag('--frames', null)
const [pageArg, outArg] = args

if (!pageArg) {
  console.error('usage: node scripts/render.mjs <page.html | folder> [out.mp4] [--fps 30] [--root .] [--frames 0-90]')
  process.exit(1)
}

let pagePath = path.resolve(root, pageArg)
if (fs.existsSync(pagePath) && fs.statSync(pagePath).isDirectory()) pagePath = path.join(pagePath, 'index.html')
if (!fs.existsSync(pagePath)) throw new Error(`page not found: ${pagePath}`)
if (!pagePath.startsWith(root)) throw new Error('the page must live inside --root so its imports can be served')
const out = path.resolve(outArg || path.join(path.dirname(pagePath), `${path.basename(path.dirname(pagePath))}.mp4`))

const chromeCandidates = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean)
const chromePath = chromeCandidates.find(p => fs.existsSync(p))
if (!chromePath) throw new Error('Chrome not found, set CHROME_PATH')

const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.wav': 'audio/wav', '.mp3': 'audio/mpeg' }
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://local')
  let file = path.join(root, decodeURIComponent(url.pathname))
  if (!file.startsWith(root)) {
    res.writeHead(403)
    return res.end()
  }
  if (url.pathname.endsWith('/')) file = path.join(file, 'index.html')
  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404)
      return res.end()
    }
    res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream' })
    res.end(data)
  })
})
await new Promise(r => server.listen(0, '127.0.0.1', r))
const rel = path.relative(root, pagePath).split(path.sep).join('/')
const pageUrl = `http://127.0.0.1:${server.address().port}/${rel}?rec=1`

const sleep = ms => new Promise(r => setTimeout(r, ms))
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'kradas-'))
const port = 9400 + Math.floor(Math.random() * 400)
const chrome = spawn(chromePath, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--hide-scrollbars', '--mute-audio', '--window-size=1080,1920', 'about:blank'], { stdio: 'ignore' })

let target
for (let i = 0; i < 60 && !target; i++) {
  await sleep(200)
  try {
    target = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(x => x.type === 'page')
  } catch {}
}
if (!target) throw new Error('Chrome did not start')

const ws = new WebSocket(target.webSocketDebuggerUrl)
await new Promise((resolve, reject) => {
  ws.onopen = resolve
  ws.onerror = reject
})
let seq = 0
const pending = new Map()
ws.onmessage = ev => {
  const msg = JSON.parse(ev.data)
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
  let duration = 0
  for (let i = 0; i < 400; i++) {
    await sleep(150)
    duration = await evaluate('window.__kradas ? window.__kradas.ready.then(() => window.__kradas.duration) : 0').catch(() => 0)
    if (duration) break
  }
  if (!duration) throw new Error('page never became ready (window.__kradas missing?)')

  const wav = await evaluate('window.__kradas.wav()')
  const wavPath = path.join(profile, 'sound.wav')
  if (wav) fs.writeFileSync(wavPath, Buffer.from(wav, 'base64'))

  const total = Math.round(duration * fps)
  const [from, to] = only ? only.split('-').map(Number) : [0, total - 1]
  const ffArgs = ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', String(fps), '-i', 'pipe:0']
  if (wav && !only) ffArgs.push('-i', wavPath)
  ffArgs.push('-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p')
  if (wav && !only) ffArgs.push('-c:a', 'aac', '-b:a', '192k', '-shortest')
  ffArgs.push('-movflags', '+faststart', out)
  const ff = spawn('ffmpeg', ffArgs, { stdio: ['pipe', 'inherit', 'inherit'] })
  const started = Date.now()
  for (let i = from; i <= Math.min(to, total - 1); i++) {
    await evaluate(`window.__kradas.step(${i / fps}); 0`)
    const { data } = await cdp('Page.captureScreenshot', { format: 'jpeg', quality: 93, clip: { x: 0, y: 0, width: 1080, height: 1920, scale: 1 } })
    if (!ff.stdin.write(Buffer.from(data, 'base64'))) await new Promise(r => ff.stdin.once('drain', r))
    if (i % 30 === 0 || i === to) process.stdout.write(`\rframe ${i + 1}/${total}  ${((Date.now() - started) / 1000).toFixed(0)}s   `)
  }
  ff.stdin.end()
  const code = await new Promise(r => ff.on('close', r))
  console.log(code === 0 ? `\ndone ${out}` : `\nffmpeg exited with ${code}`)
} finally {
  ws.close()
  chrome.kill()
  server.close()
  await sleep(400)
  try { fs.rmSync(profile, { recursive: true, force: true }) } catch {}
}

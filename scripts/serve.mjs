#!/usr/bin/env node
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(process.argv[2] || process.cwd())
const port = +(process.env.PORT || 5180)
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.mp4': 'video/mp4' }

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://local')
  let file = path.join(root, decodeURIComponent(url.pathname))
  if (!file.startsWith(root)) {
    res.writeHead(403)
    return res.end()
  }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html')
  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404)
      return res.end('not found')
    }
    res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' })
    res.end(data)
  })
}).listen(port, '127.0.0.1', () => {
  console.log(`kradas serving ${root}`)
  console.log(`open http://127.0.0.1:${port}/examples/canal-village/`)
})

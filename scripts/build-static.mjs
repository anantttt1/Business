import { cpSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'

const dist = 'dist'
mkdirSync(dist, { recursive: true })

// Root index (static HTML)
cpSync('index.html', join(dist, 'index.html'))

// Public assets
if (existsSync('public')) {
  cpSync('public', dist, { recursive: true })
}

console.log('Static build complete → dist/')

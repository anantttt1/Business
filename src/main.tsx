import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

/*
 * Welcome splash (markup lives in index.html so it paints before any JS runs).
 * It stays for a short minimum time, waits for the app + fonts, fades out and is
 * removed. If anything here fails, a CSS fail-safe animation hides it anyway.
 */
const splash = document.getElementById('splash')
if (splash) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const MIN_MS = reduce ? 700 : 1800
  const MAX_MS = 3500
  const root = document.documentElement
  let finished = false

  const finish = () => {
    if (finished) return
    finished = true
    root.classList.add('ready')
    splash.classList.add('hide')
    window.setTimeout(() => splash.remove(), reduce ? 50 : 900)
  }

  const appReady = () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
  const fontsReady = () => (document.fonts?.ready ? document.fonts.ready.then(() => undefined) : Promise.resolve())
  const cap = new Promise<void>((resolve) => window.setTimeout(resolve, MAX_MS))

  Promise.race([appReady().then(fontsReady), cap])
    .catch(() => undefined)
    .then(() => window.setTimeout(finish, Math.max(0, MIN_MS - performance.now())))
  window.setTimeout(finish, MAX_MS + 1000)
}

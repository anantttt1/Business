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
 * Welcome splash — stays longer, user can tap anytime to enter.
 * Auto-enters after a few seconds if they do not tap.
 */
const splash = document.getElementById('splash')
if (splash) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  // Longer welcome so it is not rushed; tap still skips anytime after ready
  const AUTO_MS = reduce ? 1200 : 5500
  const MAX_MS = reduce ? 2500 : 9000
  const root = document.documentElement
  let finished = false

  const finish = () => {
    if (finished) return
    finished = true
    root.classList.add('ready')
    splash.classList.add('hide')
    splash.removeAttribute('role')
    splash.removeAttribute('tabindex')
    window.setTimeout(() => splash.remove(), reduce ? 50 : 800)
  }

  const onEnter = (e?: Event) => {
    e?.preventDefault()
    finish()
  }

  splash.addEventListener('click', onEnter)
  splash.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') onEnter(e)
  })

  const appReady = () =>
    new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
  const fontsReady = () =>
    document.fonts?.ready ? document.fonts.ready.then(() => undefined) : Promise.resolve()

  // Wait for app/fonts, then keep splash until AUTO_MS (or user taps)
  Promise.all([appReady(), fontsReady()])
    .catch(() => undefined)
    .then(() => {
      const wait = Math.max(0, AUTO_MS - performance.now())
      window.setTimeout(finish, wait)
    })

  // Hard fallback so splash never sticks forever
  window.setTimeout(finish, MAX_MS)
}

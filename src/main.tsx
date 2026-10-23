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
 * Welcome splash — tap to enter, or auto after a short pause.
 */
const splash = document.getElementById('splash')
if (splash) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const AUTO_MS = reduce ? 800 : 3200
  const MAX_MS = reduce ? 1800 : 5500
  const root = document.documentElement
  let finished = false

  const finish = () => {
    if (finished) return
    finished = true
    root.classList.add('ready')
    splash.classList.add('hide')
    splash.removeAttribute('role')
    splash.removeAttribute('tabindex')
    window.setTimeout(() => splash.remove(), reduce ? 50 : 700)
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

  Promise.all([appReady(), fontsReady()])
    .catch(() => undefined)
    .then(() => {
      const wait = Math.max(0, AUTO_MS - performance.now())
      window.setTimeout(finish, wait)
    })

  window.setTimeout(finish, MAX_MS)
}

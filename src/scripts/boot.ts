const LINES = [
  '[    0.000000] Linux version 6.19 (jcalado@blog) 2026',
  '[    0.001234] BIOS-provided physical RAM map:',
  '[    0.002001] tty: ttyJC0 at 0x3f8 (irq = 4)',
  '[    0.003812] Loading posts...',
  '[    0.004900] Mounting /home/visitor',
  '[    0.005400] systemd[1]: Started jcalado.com',
  'jcalado.com login: visitor',
  'Last login: just now on tty1',
]

export function runBoot() {
  if (typeof sessionStorage === 'undefined') return
  if (sessionStorage.getItem('booted')) return
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    sessionStorage.setItem('booted', '1')
    return
  }

  const overlay = document.getElementById('boot-overlay')
  const out = document.getElementById('boot-output')
  if (!overlay || !out) return

  overlay.classList.remove('hidden')
  sessionStorage.setItem('booted', '1')

  let i = 0
  let cancelled = false
  const finish = () => {
    overlay.classList.add('opacity-0')
    setTimeout(() => overlay.classList.add('hidden'), 200)
  }
  const tick = () => {
    if (cancelled || i >= LINES.length) return finish()
    const line = document.createElement('div')
    line.textContent = LINES[i++]
    out.appendChild(line)
    setTimeout(tick, 160)
  }
  const skip = () => {
    cancelled = true
    finish()
  }
  document.addEventListener('keydown', skip, { once: true })
  document.addEventListener('click', skip, { once: true })
  tick()
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runBoot)
  } else {
    runBoot()
  }
}

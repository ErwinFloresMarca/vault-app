import { chromium } from 'playwright'

const BASE = process.env.E2E_BASE_URL || 'http://localhost:3000'
const results = []
function check(name, ok) {
  results.push({ name, ok })
  console.log(`${ok ? 'PASS' : 'FAIL'} — ${name}`)
}

const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await context.newPage()
const pageErrors = []
page.on('pageerror', (e) => pageErrors.push(e.message))

const collectBtn = () => page.getByRole('button', { name: /^(Conseguir|Conseguido)$/ }).first()
const wishBtn = () => page.getByRole('button', { name: /^(Lo quiero|En mi lista)$/ }).first()
const label = async (loc) => ((await loc.textContent()) ?? '').trim()

try {
  // 1. Login de test (ADMIN cubre usuario + admin)
  const res = await context.request.post(`${BASE}/api/test/login`, { data: { role: 'ADMIN' } })
  check('login de test', res.ok())

  // 2. Item: dejar en estado "Conseguido" (probando ambos sentidos)
  await page.goto(`${BASE}/collections/animalitos-flexibles/gato`, { waitUntil: 'networkidle' })
  if ((await label(collectBtn())) === 'Conseguido') {
    await collectBtn().click()
    await page.waitForTimeout(700)
  }
  await collectBtn().click()
  await page.waitForTimeout(800)
  check('marcar item como Conseguido', (await label(collectBtn())) === 'Conseguido')

  // 3. Wishlist: dejar en "En mi lista"
  if ((await label(wishBtn())) === 'En mi lista') {
    await wishBtn().click()
    await page.waitForTimeout(500)
  }
  await wishBtn().click()
  await page.waitForTimeout(700)
  check('añadir a wishlist', (await label(wishBtn())) === 'En mi lista')

  // 4. /me con progreso
  await page.goto(`${BASE}/me`, { waitUntil: 'networkidle' })
  const meText = await page.locator('body').innerText()
  check('/me accesible autenticado', page.url().endsWith('/me'))
  check('/me muestra progreso', /conseguidos/.test(meText))

  // 5. Admin como ADMIN
  await page.goto(`${BASE}/admin/dashboard`, { waitUntil: 'networkidle' })
  check('admin dashboard accesible (ADMIN)', page.url().includes('/admin/dashboard'))
  check('admin dashboard renderiza', /Dashboard/i.test(await page.locator('body').innerText()))

  // 6. Sin sesión, admin redirige a login
  const anon = await browser.newContext()
  const anonPage = await anon.newPage()
  await anonPage.goto(`${BASE}/admin/dashboard`, { waitUntil: 'networkidle' })
  check('admin redirige a login sin sesión', anonPage.url().includes('/login'))
  await anon.close()

  check('sin errores de página', pageErrors.length === 0)
} catch (e) {
  console.error('E2E ERROR:', e.message)
  check('ejecución sin excepciones', false)
} finally {
  await browser.close()
}

const failed = results.filter((r) => !r.ok)
console.log(`\n${results.length - failed.length}/${results.length} checks OK`)
process.exit(failed.length ? 1 : 0)

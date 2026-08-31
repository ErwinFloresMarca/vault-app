import { setUserSession } from '#imports'
export default defineEventHandler(async (event) => {
  await setUserSession(event, { user: { id: 'cmtchtolm0000w5olow8sej6j', email: 'ramiromarca6@gmail.com', name: 'Admin', role: 'ADMIN' } })
  return { ok: true }
})

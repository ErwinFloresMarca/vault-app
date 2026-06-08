export default defineEventHandler(async (event) => {
  // Limpiar la sesión
  await clearUserSession(event)

  return {
    statusCode: 200,
    message: 'Sesión cerrada correctamente',
  }
})

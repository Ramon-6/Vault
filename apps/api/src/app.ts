import Fastify from 'fastify'
import cors from '@fastify/cors'
import cookie from '@fastify/cookie'
import rateLimit from '@fastify/rate-limit'
import authRoutes from './modules/auth/routes.js'
import databaseRoutes from './modules/databases/routes.js'
import backupRoutes from './modules/backups/routes.js'
import billingRoutes from './modules/billing/routes.js'
import alertRoutes from './modules/alerts/routes.js'
import tokenRoutes from './modules/tokens/routes.js'
import { setupScheduler } from './jobs/scheduler.js'

const app = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    transport:
      process.env.NODE_ENV !== 'production'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
  },
})

// Plugins
await app.register(cors, {
  origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  credentials: true,
})

await app.register(cookie)

await app.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
})

// Health check
app.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() }
})

// Routes
await app.register(authRoutes)
await app.register(databaseRoutes)
await app.register(backupRoutes)
await app.register(billingRoutes)
await app.register(alertRoutes)
await app.register(tokenRoutes)

// Start server
const port = parseInt(process.env.PORT ?? '3001', 10)
const host = '0.0.0.0'

try {
  await app.listen({ port, host })
  console.log(`Servidor Snapvault rodando em http://${host}:${port}`)

  // Iniciar agendador de backups
  setupScheduler()
} catch (err) {
  app.log.error(err)
  process.exit(1)
}

export default app

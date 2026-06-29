import type { FastifyInstance } from 'fastify'
import { authenticate } from '../../middleware/auth.js'

// Placeholder: Configurações de alertas armazenadas em memória por enquanto
// Quando necessário, criar modelo no Prisma
interface AlertSettings {
  emailOnSuccess: boolean
  emailOnFailure: boolean
}

const settingsStore = new Map<string, AlertSettings>()

const defaultSettings: AlertSettings = {
  emailOnSuccess: false,
  emailOnFailure: true,
}

export default async function alertRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate)

  // GET /alerts/settings
  app.get('/alerts/settings', async (request, reply) => {
    const userId = request.user.id
    const settings = settingsStore.get(userId) ?? { ...defaultSettings }

    return reply.send({ settings })
  })

  // PUT /alerts/settings
  app.put('/alerts/settings', async (request, reply) => {
    const userId = request.user.id
    const body = request.body as Partial<AlertSettings>

    const current = settingsStore.get(userId) ?? { ...defaultSettings }

    const updated: AlertSettings = {
      emailOnSuccess: body.emailOnSuccess ?? current.emailOnSuccess,
      emailOnFailure: body.emailOnFailure ?? current.emailOnFailure,
    }

    settingsStore.set(userId, updated)

    return reply.send({ settings: updated })
  })
}

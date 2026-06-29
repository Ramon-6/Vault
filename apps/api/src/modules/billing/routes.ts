import type { FastifyInstance } from 'fastify'
import { PLAN_LIMITS, PLAN_PRICES } from '@snapvault/shared'
import { prisma } from '../../lib/prisma.js'
import { authenticate } from '../../middleware/auth.js'

export default async function billingRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate)

  // GET /billing/plan
  app.get('/billing/plan', async (request, reply) => {
    const user = await prisma.user.findUnique({
      where: { id: request.user.id },
      select: {
        plan: true,
        _count: { select: { databases: true } },
      },
    })

    if (!user) {
      return reply.status(404).send({ error: 'Usuário não encontrado' })
    }

    const plan = user.plan
    const limits = PLAN_LIMITS[plan]
    const price = PLAN_PRICES[plan]

    return reply.send({
      plan: {
        name: plan,
        price,
        limits,
        usage: {
          databases: user._count.databases,
        },
      },
      // Placeholder para integração com Stripe
      stripe: {
        customerId: null,
        subscriptionId: null,
        currentPeriodEnd: null,
      },
    })
  })
}

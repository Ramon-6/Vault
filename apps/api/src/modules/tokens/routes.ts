import type { FastifyInstance } from 'fastify'
import crypto from 'node:crypto'
import { prisma } from '../../lib/prisma.js'
import { authenticate } from '../../middleware/auth.js'

function generateToken(): string {
  return 'sv_live_' + crypto.randomBytes(24).toString('base64url')
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export default async function tokenRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate)

  // GET /tokens
  app.get('/tokens', async (request, reply) => {
    const tokens = await prisma.apiToken.findMany({
      where: { userId: request.user.id },
      select: {
        id: true,
        label: true,
        lastUsedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return reply.send({ tokens })
  })

  // POST /tokens
  app.post('/tokens', async (request, reply) => {
    const { label } = request.body as { label: string }

    if (!label || label.trim().length === 0) {
      return reply.status(400).send({ error: 'Label é obrigatório' })
    }

    const plainToken = generateToken()
    const tokenHash = hashToken(plainToken)

    const token = await prisma.apiToken.create({
      data: {
        userId: request.user.id,
        label: label.trim(),
        tokenHash,
      },
      select: {
        id: true,
        label: true,
        createdAt: true,
      },
    })

    return reply.status(201).send({
      token: {
        ...token,
        plainToken,
      },
    })
  })

  // DELETE /tokens/:id
  app.delete('/tokens/:id', async (request, reply) => {
    const { id } = request.params as { id: string }

    const token = await prisma.apiToken.findFirst({
      where: { id, userId: request.user.id },
    })

    if (!token) {
      return reply.status(404).send({ error: 'Token não encontrado' })
    }

    await prisma.apiToken.delete({ where: { id } })

    return reply.send({ message: 'Token revogado com sucesso' })
  })
}

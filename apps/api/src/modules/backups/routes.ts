import type { FastifyInstance } from 'fastify'
import { prisma } from '../../lib/prisma.js'
import { authenticate } from '../../middleware/auth.js'

export default async function backupRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate)

  // GET /backups
  app.get('/backups', async (request, reply) => {
    const query = request.query as {
      page?: string
      limit?: string
      databaseId?: string
      status?: string
    }

    const page = Math.max(1, parseInt(query.page ?? '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? '20', 10)))
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {
      database: { userId: request.user.id },
    }

    if (query.databaseId) {
      where.databaseId = query.databaseId
    }

    if (query.status) {
      where.status = query.status
    }

    const [backups, total] = await Promise.all([
      prisma.backup.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startedAt: 'desc' },
        select: {
          id: true,
          databaseId: true,
          status: true,
          sizeBytes: true,
          startedAt: true,
          finishedAt: true,
          errorMessage: true,
          database: {
            select: { name: true, type: true },
          },
        },
      }),
      prisma.backup.count({ where }),
    ])

    // Converter BigInt para string para serialização JSON
    const serialized = backups.map((b) => ({
      ...b,
      sizeBytes: b.sizeBytes?.toString() ?? null,
    }))

    return reply.send({
      backups: serialized,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  })

  // GET /backups/:id/download
  app.get('/backups/:id/download', async (request, reply) => {
    const { id } = request.params as { id: string }

    const backup = await prisma.backup.findFirst({
      where: {
        id,
        database: { userId: request.user.id },
      },
      select: {
        id: true,
        status: true,
        b2FileId: true,
        b2FilePath: true,
      },
    })

    if (!backup) {
      return reply.status(404).send({ error: 'Backup não encontrado' })
    }

    if (backup.status !== 'SUCCESS') {
      return reply.status(400).send({ error: 'Apenas backups concluídos podem ser baixados' })
    }

    // Placeholder: gerar URL assinada do B2
    // Quando a integração com B2 estiver pronta, isso será substituído
    const downloadUrl = `https://placeholder.backblaze.com/file/snapvault-backups/${backup.b2FilePath ?? backup.id}?token=signed-url-placeholder`

    return reply.send({
      downloadUrl,
      expiresIn: 3600, // 1 hora
    })
  })
}

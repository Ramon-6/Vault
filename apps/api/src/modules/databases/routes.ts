import type { FastifyInstance } from 'fastify'
import { createDatabaseSchema, updateDatabaseSchema, PLAN_LIMITS } from '@snapvault/shared'
import { prisma } from '../../lib/prisma.js'
import { encrypt, decrypt } from '../../lib/crypto.js'
import { authenticate } from '../../middleware/auth.js'
import { validate } from '../../middleware/validate.js'

export default async function databaseRoutes(app: FastifyInstance): Promise<void> {
  // All database routes require authentication
  app.addHook('preHandler', authenticate)

  // GET /databases
  app.get('/databases', async (request, reply) => {
    const databases = await prisma.database.findMany({
      where: { userId: request.user.id },
      select: {
        id: true,
        name: true,
        type: true,
        host: true,
        port: true,
        dbName: true,
        username: true,
        schedule: true,
        retention: true,
        isActive: true,
        lastBackupAt: true,
        lastStatus: true,
        createdAt: true,
        _count: { select: { backups: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return reply.send({ databases })
  })

  // POST /databases
  app.post(
    '/databases',
    { preHandler: [validate(createDatabaseSchema)] },
    async (request, reply) => {
      const data = request.body as {
        name: string
        type: 'MYSQL' | 'POSTGRES'
        host: string
        port: number
        dbName: string
        username: string
        password: string
        schedule: string
        retention: number
      }

      // Verificar limite do plano
      const plan = request.user.plan
      const limits = PLAN_LIMITS[plan]
      const dbCount = await prisma.database.count({
        where: { userId: request.user.id },
      })

      if (dbCount >= limits.maxDatabases) {
        return reply.status(403).send({
          error: `Seu plano ${plan} permite no máximo ${limits.maxDatabases} banco(s) de dados`,
        })
      }

      if (data.retention > limits.maxRetention) {
        return reply.status(403).send({
          error: `Seu plano ${plan} permite retenção máxima de ${limits.maxRetention} dias`,
        })
      }

      // Criptografar a senha
      const { encrypted: passwordEnc, iv, tag: authTag } = encrypt(data.password)

      const database = await prisma.database.create({
        data: {
          userId: request.user.id,
          name: data.name,
          type: data.type,
          host: data.host,
          port: data.port,
          dbName: data.dbName,
          username: data.username,
          passwordEnc,
          iv,
          authTag,
          schedule: data.schedule,
          retention: data.retention,
        },
        select: {
          id: true,
          name: true,
          type: true,
          host: true,
          port: true,
          dbName: true,
          username: true,
          schedule: true,
          retention: true,
          isActive: true,
          createdAt: true,
        },
      })

      return reply.status(201).send({ database })
    },
  )

  // GET /databases/:id
  app.get('/databases/:id', async (request, reply) => {
    const { id } = request.params as { id: string }

    const database = await prisma.database.findFirst({
      where: { id, userId: request.user.id },
      select: {
        id: true,
        name: true,
        type: true,
        host: true,
        port: true,
        dbName: true,
        username: true,
        schedule: true,
        retention: true,
        isActive: true,
        lastBackupAt: true,
        lastStatus: true,
        createdAt: true,
        _count: { select: { backups: true } },
      },
    })

    if (!database) {
      return reply.status(404).send({ error: 'Banco de dados não encontrado' })
    }

    return reply.send({ database })
  })

  // PUT /databases/:id
  app.put(
    '/databases/:id',
    { preHandler: [validate(updateDatabaseSchema)] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const data = request.body as {
        name?: string
        type?: 'MYSQL' | 'POSTGRES'
        host?: string
        port?: number
        dbName?: string
        username?: string
        password?: string
        schedule?: string
        retention?: number
      }

      // Verificar que o banco pertence ao usuário
      const existing = await prisma.database.findFirst({
        where: { id, userId: request.user.id },
      })

      if (!existing) {
        return reply.status(404).send({ error: 'Banco de dados não encontrado' })
      }

      // Verificar limite de retenção
      if (data.retention) {
        const limits = PLAN_LIMITS[request.user.plan]
        if (data.retention > limits.maxRetention) {
          return reply.status(403).send({
            error: `Seu plano ${request.user.plan} permite retenção máxima de ${limits.maxRetention} dias`,
          })
        }
      }

      // Preparar dados de atualização
      const updateData: Record<string, unknown> = {}
      if (data.name !== undefined) updateData.name = data.name
      if (data.type !== undefined) updateData.type = data.type
      if (data.host !== undefined) updateData.host = data.host
      if (data.port !== undefined) updateData.port = data.port
      if (data.dbName !== undefined) updateData.dbName = data.dbName
      if (data.username !== undefined) updateData.username = data.username
      if (data.schedule !== undefined) updateData.schedule = data.schedule
      if (data.retention !== undefined) updateData.retention = data.retention

      // Se uma nova senha foi fornecida, criptografar
      if (data.password) {
        const { encrypted, iv, tag } = encrypt(data.password)
        updateData.passwordEnc = encrypted
        updateData.iv = iv
        updateData.authTag = tag
      }

      const database = await prisma.database.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          name: true,
          type: true,
          host: true,
          port: true,
          dbName: true,
          username: true,
          schedule: true,
          retention: true,
          isActive: true,
          lastBackupAt: true,
          lastStatus: true,
          createdAt: true,
        },
      })

      return reply.send({ database })
    },
  )

  // DELETE /databases/:id
  app.delete('/databases/:id', async (request, reply) => {
    const { id } = request.params as { id: string }

    const database = await prisma.database.findFirst({
      where: { id, userId: request.user.id },
    })

    if (!database) {
      return reply.status(404).send({ error: 'Banco de dados não encontrado' })
    }

    // Cascade delete irá remover os backups associados
    await prisma.database.delete({ where: { id } })

    return reply.send({ message: 'Banco de dados removido com sucesso' })
  })

  // POST /databases/:id/test
  app.post('/databases/:id/test', async (request, reply) => {
    const { id } = request.params as { id: string }

    const database = await prisma.database.findFirst({
      where: { id, userId: request.user.id },
    })

    if (!database) {
      return reply.status(404).send({ error: 'Banco de dados não encontrado' })
    }

    try {
      const password = decrypt(database.passwordEnc, database.iv, database.authTag)

      if (database.type === 'MYSQL') {
        try {
          // mysql2 é uma dependência opcional para testar conexões
          // @ts-expect-error mysql2 é opcional e pode não estar instalado
          const mysql = await import('mysql2/promise')
          const connection = await mysql.createConnection({
            host: database.host,
            port: database.port,
            user: database.username,
            password,
            database: database.dbName,
            connectTimeout: 10000,
          })
          await connection.ping()
          await connection.end()
        } catch (importErr: any) {
          if (importErr?.code === 'ERR_MODULE_NOT_FOUND' || importErr?.code === 'MODULE_NOT_FOUND') {
            return reply.status(500).send({
              success: false,
              message: 'Driver mysql2 não está instalado. Execute: npm install mysql2',
            })
          }
          throw importErr
        }
      } else {
        try {
          // pg é uma dependência opcional para testar conexões
          // @ts-expect-error pg é opcional e pode não estar instalado
          const pg = await import('pg')
          const Client = pg.default?.Client ?? pg.Client
          const client = new Client({
            host: database.host,
            port: database.port,
            user: database.username,
            password,
            database: database.dbName,
            connectionTimeoutMillis: 10000,
          })
          await client.connect()
          await client.query('SELECT 1')
          await client.end()
        } catch (importErr: any) {
          if (importErr?.code === 'ERR_MODULE_NOT_FOUND' || importErr?.code === 'MODULE_NOT_FOUND') {
            return reply.status(500).send({
              success: false,
              message: 'Driver pg não está instalado. Execute: npm install pg',
            })
          }
          throw importErr
        }
      }

      return reply.send({
        success: true,
        message: 'Conexão estabelecida com sucesso',
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido'
      return reply.send({
        success: false,
        message: `Falha na conexão: ${message}`,
      })
    }
  })
}

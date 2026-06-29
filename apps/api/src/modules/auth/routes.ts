import type { FastifyInstance } from 'fastify'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { registerSchema, loginSchema } from '@snapvault/shared'
import { prisma } from '../../lib/prisma.js'
import { authenticate } from '../../middleware/auth.js'
import { validate } from '../../middleware/validate.js'
import { sendWelcome } from '../../lib/email.js'

const BCRYPT_ROUNDS = 12
const ACCESS_TOKEN_EXPIRY = '15m'
const REFRESH_TOKEN_EXPIRY = '7d'

function signAccessToken(payload: { id: string; email: string; plan: string }): string {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET não está definido')
  return jwt.sign(payload, secret, { expiresIn: ACCESS_TOKEN_EXPIRY })
}

function signRefreshToken(payload: { id: string }): string {
  const secret = process.env.JWT_REFRESH_SECRET
  if (!secret) throw new Error('JWT_REFRESH_SECRET não está definido')
  return jwt.sign(payload, secret, { expiresIn: REFRESH_TOKEN_EXPIRY })
}

export default async function authRoutes(app: FastifyInstance): Promise<void> {
  // POST /auth/register
  app.post(
    '/auth/register',
    { preHandler: [validate(registerSchema)] },
    async (request, reply) => {
      const { name, email, password } = request.body as {
        name: string
        email: string
        password: string
      }

      const existing = await prisma.user.findUnique({ where: { email } })
      if (existing) {
        return reply.status(409).send({ error: 'E-mail já cadastrado' })
      }

      const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS)

      const user = await prisma.user.create({
        data: { name, email, passwordHash },
      })

      const accessToken = signAccessToken({
        id: user.id,
        email: user.email,
        plan: user.plan,
      })

      sendWelcome(user.email, user.name).catch(() => {
        // Falha no envio do e-mail não deve bloquear o registro
      })

      return reply.status(201).send({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          plan: user.plan,
        },
        token: accessToken,
      })
    },
  )

  // POST /auth/login
  app.post(
    '/auth/login',
    { preHandler: [validate(loginSchema)] },
    async (request, reply) => {
      const { email, password } = request.body as {
        email: string
        password: string
      }

      const user = await prisma.user.findUnique({ where: { email } })
      if (!user) {
        return reply.status(401).send({ error: 'Credenciais inválidas' })
      }

      const valid = await bcrypt.compare(password, user.passwordHash)
      if (!valid) {
        return reply.status(401).send({ error: 'Credenciais inválidas' })
      }

      const accessToken = signAccessToken({
        id: user.id,
        email: user.email,
        plan: user.plan,
      })

      const refreshToken = signRefreshToken({ id: user.id })

      reply.setCookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/auth/refresh',
        maxAge: 7 * 24 * 60 * 60, // 7 dias
      })

      return reply.send({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          plan: user.plan,
        },
        token: accessToken,
      })
    },
  )

  // POST /auth/refresh
  app.post('/auth/refresh', async (request, reply) => {
    const refreshToken = request.cookies.refreshToken
    if (!refreshToken) {
      return reply.status(401).send({ error: 'Refresh token não encontrado' })
    }

    try {
      const secret = process.env.JWT_REFRESH_SECRET
      if (!secret) throw new Error('JWT_REFRESH_SECRET não está definido')

      const decoded = jwt.verify(refreshToken, secret) as { id: string }
      const user = await prisma.user.findUnique({ where: { id: decoded.id } })

      if (!user) {
        return reply.status(401).send({ error: 'Usuário não encontrado' })
      }

      const accessToken = signAccessToken({
        id: user.id,
        email: user.email,
        plan: user.plan,
      })

      return reply.send({ token: accessToken })
    } catch {
      return reply.status(401).send({ error: 'Refresh token inválido ou expirado' })
    }
  })

  // POST /auth/logout
  app.post('/auth/logout', async (_request, reply) => {
    reply.clearCookie('refreshToken', {
      path: '/auth/refresh',
    })

    return reply.send({ message: 'Logout realizado com sucesso' })
  })

  // PUT /auth/profile
  app.put(
    '/auth/profile',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { name, currentPassword, newPassword } = request.body as {
        name?: string
        currentPassword?: string
        newPassword?: string
      }

      const user = await prisma.user.findUnique({
        where: { id: request.user.id },
      })

      if (!user) {
        return reply.status(404).send({ error: 'Usuário não encontrado' })
      }

      const updateData: Record<string, unknown> = {}

      if (name !== undefined) {
        updateData.name = name
      }

      if (newPassword) {
        if (!currentPassword) {
          return reply.status(400).send({ error: 'Senha atual é obrigatória para alterar a senha' })
        }
        const valid = await bcrypt.compare(currentPassword, user.passwordHash)
        if (!valid) {
          return reply.status(401).send({ error: 'Senha atual incorreta' })
        }
        if (newPassword.length < 8) {
          return reply.status(400).send({ error: 'Nova senha deve ter no mínimo 8 caracteres' })
        }
        updateData.passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS)
      }

      if (Object.keys(updateData).length === 0) {
        return reply.status(400).send({ error: 'Nenhum dado para atualizar' })
      }

      const updated = await prisma.user.update({
        where: { id: request.user.id },
        data: updateData,
        select: { id: true, name: true, email: true, plan: true },
      })

      return reply.send({ user: updated })
    },
  )

  // GET /auth/me
  app.get(
    '/auth/me',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const user = await prisma.user.findUnique({
        where: { id: request.user.id },
        select: {
          id: true,
          name: true,
          email: true,
          plan: true,
          createdAt: true,
          _count: { select: { databases: true } },
        },
      })

      if (!user) {
        return reply.status(404).send({ error: 'Usuário não encontrado' })
      }

      return reply.send({ user })
    },
  )
}

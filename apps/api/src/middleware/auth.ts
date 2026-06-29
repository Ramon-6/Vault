import type { FastifyRequest, FastifyReply } from 'fastify'
import jwt from 'jsonwebtoken'

export interface JwtPayload {
  id: string
  email: string
  plan: string
}

declare module 'fastify' {
  interface FastifyRequest {
    user: JwtPayload
  }
}

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const authHeader = request.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'Token de autenticação não fornecido' })
  }

  const token = authHeader.slice(7)

  try {
    const secret = process.env.JWT_SECRET
    if (!secret) {
      throw new Error('JWT_SECRET não está definido')
    }

    const decoded = jwt.verify(token, secret) as JwtPayload
    request.user = decoded
  } catch {
    return reply.status(401).send({ error: 'Token inválido ou expirado' })
  }
}

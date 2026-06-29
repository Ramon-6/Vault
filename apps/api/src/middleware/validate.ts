import type { FastifyRequest, FastifyReply } from 'fastify'
import type { ZodSchema, ZodError } from 'zod'

export function validate(schema: ZodSchema) {
  return async function validateHandler(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const result = schema.safeParse(request.body)

    if (!result.success) {
      const zodError = result.error as ZodError
      const messages = zodError.errors.map((e) => e.message)

      return reply.status(400).send({
        error: 'Dados inválidos',
        details: messages,
      })
    }

    request.body = result.data
  }
}

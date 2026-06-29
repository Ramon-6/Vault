import { z } from 'zod'

export const DatabaseType = z.enum(['MYSQL', 'POSTGRES'])
export type DatabaseType = z.infer<typeof DatabaseType>

export const BackupStatus = z.enum(['PENDING', 'RUNNING', 'SUCCESS', 'FAILED'])
export type BackupStatus = z.infer<typeof BackupStatus>

export const Plan = z.enum(['STARTER', 'PRO', 'BUSINESS'])
export type Plan = z.infer<typeof Plan>

export const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
})

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
})

export const createDatabaseSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  type: DatabaseType,
  host: z.string().min(1, 'Host é obrigatório'),
  port: z.number().int().min(1).max(65535),
  dbName: z.string().min(1, 'Nome do banco é obrigatório'),
  username: z.string().min(1, 'Usuário é obrigatório'),
  password: z.string().min(1, 'Senha é obrigatória'),
  schedule: z.string().default('0 2 * * *'),
  retention: z.number().int().min(7).max(90).default(7),
})

export const updateDatabaseSchema = createDatabaseSchema.partial().omit({ password: true }).extend({
  password: z.string().optional(),
})

export const testConnectionSchema = z.object({
  type: DatabaseType,
  host: z.string().min(1),
  port: z.number().int().min(1).max(65535),
  dbName: z.string().min(1),
  username: z.string().min(1),
  password: z.string().min(1),
})

export const PLAN_LIMITS: Record<string, { maxDatabases: number; maxRetention: number }> = {
  STARTER: { maxDatabases: 1, maxRetention: 7 },
  PRO: { maxDatabases: 5, maxRetention: 30 },
  BUSINESS: { maxDatabases: Infinity, maxRetention: 90 },
}

export const PLAN_PRICES: Record<string, number> = {
  STARTER: 29,
  PRO: 79,
  BUSINESS: 199,
}

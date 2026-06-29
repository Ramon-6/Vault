import cron from 'node-cron'
import { createWriteStream } from 'node:fs'
import { mkdir, stat, unlink } from 'node:fs/promises'
import { join } from 'node:path'
import { createGzip } from 'node:zlib'
import { pipeline } from 'node:stream/promises'
import { createReadStream } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { prisma } from '../lib/prisma.js'
import { decrypt } from '../lib/crypto.js'
import { executeDump } from '../lib/dump.js'
import { sendBackupSuccess, sendBackupFailed } from '../lib/email.js'

const BACKUP_DIR = join(process.cwd(), 'tmp', 'backups')

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

export async function runBackup(
  database: {
    id: string
    name: string
    type: 'MYSQL' | 'POSTGRES'
    host: string
    port: number
    dbName: string
    username: string
    passwordEnc: string
    iv: string
    authTag: string
    userId: string
  },
): Promise<void> {
  const backupId = randomUUID()
  const dumpFile = join(BACKUP_DIR, `${backupId}.dump`)
  const compressedFile = join(BACKUP_DIR, `${backupId}.dump.gz`)

  // Criar registro de backup
  const backup = await prisma.backup.create({
    data: {
      databaseId: database.id,
      status: 'RUNNING',
    },
  })

  try {
    // Garantir que o diretório existe
    await mkdir(BACKUP_DIR, { recursive: true })

    // Descriptografar a senha
    const password = decrypt(database.passwordEnc, database.iv, database.authTag)

    // Executar dump
    await executeDump(database.type, {
      host: database.host,
      port: database.port,
      dbName: database.dbName,
      username: database.username,
      password,
    }, dumpFile)

    // Comprimir o dump
    await pipeline(
      createReadStream(dumpFile),
      createGzip(),
      createWriteStream(compressedFile),
    )

    // Obter tamanho do arquivo comprimido
    const fileStats = await stat(compressedFile)
    const sizeBytes = fileStats.size

    // Placeholder: upload para B2
    // Quando integrado, substituir por upload real
    const b2FilePath = `backups/${database.userId}/${database.id}/${backupId}.dump.gz`

    // Atualizar registro de backup
    await prisma.backup.update({
      where: { id: backup.id },
      data: {
        status: 'SUCCESS',
        sizeBytes: BigInt(sizeBytes),
        b2FilePath,
        finishedAt: new Date(),
      },
    })

    // Atualizar último backup do banco
    await prisma.database.update({
      where: { id: database.id },
      data: {
        lastBackupAt: new Date(),
        lastStatus: 'SUCCESS',
      },
    })

    // Buscar e-mail do usuário para notificação
    const user = await prisma.user.findUnique({
      where: { id: database.userId },
      select: { email: true },
    })

    if (user) {
      await sendBackupSuccess(user.email, database.name, formatBytes(sizeBytes))
    }

    // Limpar arquivos temporários
    await unlink(dumpFile).catch(() => {})
    await unlink(compressedFile).catch(() => {})

    // Limpar backups antigos conforme retenção
    const dbRecord = await prisma.database.findUnique({
      where: { id: database.id },
      select: { retention: true },
    })

    if (dbRecord) {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - dbRecord.retention)

      await prisma.backup.deleteMany({
        where: {
          databaseId: database.id,
          startedAt: { lt: cutoffDate },
          status: 'SUCCESS',
        },
      })
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'

    await prisma.backup.update({
      where: { id: backup.id },
      data: {
        status: 'FAILED',
        errorMessage,
        finishedAt: new Date(),
      },
    })

    await prisma.database.update({
      where: { id: database.id },
      data: {
        lastBackupAt: new Date(),
        lastStatus: 'FAILED',
      },
    })

    const user = await prisma.user.findUnique({
      where: { id: database.userId },
      select: { email: true },
    })

    if (user) {
      await sendBackupFailed(user.email, database.name, errorMessage)
    }

    // Limpar arquivos temporários em caso de erro
    await unlink(dumpFile).catch(() => {})
    await unlink(compressedFile).catch(() => {})
  }
}

export function setupScheduler(): void {
  console.log('[SCHEDULER] Agendador de backups iniciado - verificando a cada minuto')

  // Verificar a cada minuto se há backups pendentes
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date()

      // Buscar bancos ativos que precisam de backup
      const databases = await prisma.database.findMany({
        where: { isActive: true },
      })

      for (const db of databases) {
        // Verificar se o cron schedule bate com o momento atual
        if (!cron.validate(db.schedule)) {
          console.log(`[SCHEDULER] Schedule inválido para ${db.name}: ${db.schedule}`)
          continue
        }

        // Verificar se já existe um backup em andamento
        const runningBackup = await prisma.backup.findFirst({
          where: {
            databaseId: db.id,
            status: 'RUNNING',
          },
        })

        if (runningBackup) {
          continue
        }

        // Verificar se o cron deve executar agora
        const cronFields = db.schedule.split(' ')
        const minute = now.getMinutes()
        const hour = now.getHours()
        const dayOfMonth = now.getDate()
        const month = now.getMonth() + 1
        const dayOfWeek = now.getDay()

        const matches = matchCronField(cronFields[0], minute)
          && matchCronField(cronFields[1], hour)
          && matchCronField(cronFields[2], dayOfMonth)
          && matchCronField(cronFields[3], month)
          && matchCronField(cronFields[4], dayOfWeek)

        if (matches) {
          console.log(`[SCHEDULER] Iniciando backup para ${db.name}`)
          // Executar backup sem await para não bloquear o loop
          runBackup(db).catch((err) => {
            console.error(`[SCHEDULER] Erro no backup de ${db.name}:`, err)
          })
        }
      }
    } catch (err) {
      console.error('[SCHEDULER] Erro ao verificar backups pendentes:', err)
    }
  })
}

function matchCronField(field: string, value: number): boolean {
  if (field === '*') return true

  // Suporte a valores separados por vírgula
  const parts = field.split(',')
  for (const part of parts) {
    // Suporte a intervalos (e.g., 1-5)
    if (part.includes('-')) {
      const [start, end] = part.split('-').map(Number)
      if (value >= start && value <= end) return true
    }
    // Suporte a steps (e.g., */5)
    else if (part.includes('/')) {
      const [, step] = part.split('/')
      if (value % parseInt(step, 10) === 0) return true
    }
    // Valor exato
    else if (parseInt(part, 10) === value) {
      return true
    }
  }

  return false
}

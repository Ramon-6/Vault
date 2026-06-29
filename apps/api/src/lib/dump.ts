import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

const DUMP_TIMEOUT_MS = 5 * 60 * 1000 // 5 minutos

interface DumpCredentials {
  host: string
  port: number
  dbName: string
  username: string
  password: string
}

export async function executeDump(
  type: 'MYSQL' | 'POSTGRES',
  credentials: DumpCredentials,
  outputPath: string,
): Promise<void> {
  const { host, port, dbName, username, password } = credentials

  if (type === 'MYSQL') {
    const args = [
      '-h', host,
      '-P', String(port),
      '-u', username,
      '--result-file', outputPath,
      '--single-transaction',
      '--routines',
      '--triggers',
      dbName,
    ]

    await execFileAsync('mysqldump', args, {
      timeout: DUMP_TIMEOUT_MS,
      env: { ...process.env, MYSQL_PWD: password },
    })
  } else {
    const args = [
      '-h', host,
      '-p', String(port),
      '-U', username,
      '-d', dbName,
      '-F', 'c',
      '-f', outputPath,
    ]

    await execFileAsync('pg_dump', args, {
      timeout: DUMP_TIMEOUT_MS,
      env: { ...process.env, PGPASSWORD: password },
    })
  }
}

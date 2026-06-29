import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

const from = process.env.EMAIL_FROM ?? 'Snapvault <backup@snapvault.com.br>'
const isDev = process.env.NODE_ENV !== 'production'

async function send(to: string, subject: string, html: string): Promise<void> {
  if (isDev || !resend) {
    console.log(`[EMAIL] Para: ${to} | Assunto: ${subject}`)
    console.log(`[EMAIL] Corpo: ${html}`)
    return
  }

  await resend.emails.send({ from, to, subject, html })
}

export async function sendBackupSuccess(
  email: string,
  dbName: string,
  size: string,
): Promise<void> {
  const subject = `Backup concluído - ${dbName}`
  const html = `
    <h2>Backup realizado com sucesso!</h2>
    <p>O backup do banco de dados <strong>${dbName}</strong> foi concluído.</p>
    <p>Tamanho: <strong>${size}</strong></p>
    <p>Data: ${new Date().toLocaleString('pt-BR')}</p>
    <br>
    <p>— Equipe Snapvault</p>
  `
  await send(email, subject, html)
}

export async function sendBackupFailed(
  email: string,
  dbName: string,
  error: string,
): Promise<void> {
  const subject = `Falha no backup - ${dbName}`
  const html = `
    <h2>Falha no backup</h2>
    <p>O backup do banco de dados <strong>${dbName}</strong> falhou.</p>
    <p>Erro: <strong>${error}</strong></p>
    <p>Data: ${new Date().toLocaleString('pt-BR')}</p>
    <br>
    <p>Verifique as credenciais e a conectividade do banco.</p>
    <p>— Equipe Snapvault</p>
  `
  await send(email, subject, html)
}

export async function sendWelcome(email: string, name: string): Promise<void> {
  const subject = 'Bem-vindo ao Snapvault!'
  const html = `
    <h2>Olá, ${name}!</h2>
    <p>Bem-vindo ao <strong>Snapvault</strong> — sua solução de backup automático para bancos de dados.</p>
    <p>Comece adicionando seu primeiro banco de dados no painel.</p>
    <br>
    <p>— Equipe Snapvault</p>
  `
  await send(email, subject, html)
}

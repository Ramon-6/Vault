import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToastStore } from '../stores/toast';
import { ChevronLeftIcon, CopyIcon } from '../components/ui/Icons';
import Toggle from '../components/ui/Toggle';

type TCState = 'idle' | 'testing' | 'ok' | 'fail';

export default function AddDatabase() {
  const navigate = useNavigate();
  const showToast = useToastStore((s) => s.show);
  const [step, setStep] = useState(1);
  const [tc, setTc] = useState<TCState>('idle');
  const [dbType, setDbType] = useState<'mysql' | 'postgres'>('mysql');
  const [emailSuccess, setEmailSuccess] = useState(true);
  const [retention, setRetention] = useState(30);

  const testConnection = () => {
    setTc('testing');
    setTimeout(() => setTc('ok'), 2000);
  };

  const nextStep = () => {
    if (step === 1 && tc !== 'ok') return;
    if (step < 3) {
      setStep((s) => s + 1);
    } else {
      navigate('/databases');
      showToast('success', '✓ Banco adicionado com sucesso!');
    }
  };

  const prevStep = () => setStep((s) => Math.max(1, s - 1));

  const circleStyle = (n: number): React.CSSProperties => {
    const on = step >= n;
    return {
      width: 28,
      height: 28,
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '12px',
      fontWeight: 700,
      background: on ? '#B8F241' : '#F4F3EF',
      color: on ? '#0A0E00' : '#A9A8A3',
      border: on ? 'none' : '1px solid #E6E4DE',
    };
  };

  const labelStyle = (n: number): React.CSSProperties => ({
    fontSize: '12px',
    fontWeight: 500,
    color: step >= n ? '#0C0C0A' : '#A9A8A3',
  });

  const lineStyle = (n: number): React.CSSProperties => ({
    width: 40,
    height: 1,
    background: step > n ? '#B8F241' : '#E6E4DE',
    flexShrink: 0,
  });

  return (
    <div>
      {/* Header with steps */}
      <div className="px-7 pt-[18px] pb-4 border-b border-sv-border bg-sv-bg sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => navigate('/databases')}
            className="bg-transparent border-none text-sv-secondary text-[13px] flex items-center gap-1 p-0 hover:text-sv-text transition-colors"
          >
            <ChevronLeftIcon />
            Cancelar
          </button>
          <span className="text-sv-border">&middot;</span>
          <h2 className="text-[16px] font-bold text-sv-text" style={{ letterSpacing: '-0.3px' }}>
            Adicionar banco de dados
          </h2>
        </div>
        {/* Step indicator */}
        <div className="flex items-center gap-2">
          <div style={circleStyle(1)}>{step > 1 ? '✓' : '1'}</div>
          <span style={labelStyle(1)}>Conexao</span>
          <div style={lineStyle(1)} />
          <div style={circleStyle(2)}>{step > 2 ? '✓' : '2'}</div>
          <span style={labelStyle(2)}>Backup</span>
          <div style={lineStyle(2)} />
          <div style={circleStyle(3)}>3</div>
          <span style={labelStyle(3)}>Agente</span>
        </div>
      </div>

      <div className="px-7 py-8 max-w-[560px]">
        {/* Step 1: Connection */}
        {step === 1 && (
          <div className="animate-slideDown">
            <h3 className="text-[15px] font-semibold text-sv-text mb-1">Informacoes de conexao</h3>
            <p className="text-[13px] text-sv-secondary mb-6">Testamos a conexao antes de salvar qualquer dado.</p>

            <div className="mb-4">
              <label className="block text-[12px] font-medium text-sv-secondary mb-1.5">Nome amigavel</label>
              <input
                type="text"
                placeholder="ex: Banco do Cliente Joao"
                className="w-full bg-sv-input border border-sv-border rounded-sv-md py-[9px] px-3 text-sv-text text-[13px] outline-none"
              />
            </div>

            <div className="mb-4">
              <label className="block text-[12px] font-medium text-sv-secondary mb-2">Tipo de banco</label>
              <div className="flex gap-2">
                <div
                  onClick={() => setDbType('mysql')}
                  className="flex-1 bg-sv-input rounded-sv-md py-2.5 px-3.5 flex items-center gap-2 cursor-pointer"
                  style={{ border: dbType === 'mysql' ? '1px solid #B8F241' : '1px solid #E6E4DE' }}
                >
                  <div
                    className="w-[18px] h-[18px] rounded-full flex items-center justify-center"
                    style={{
                      background: dbType === 'mysql' ? '#B8F241' : 'transparent',
                      border: dbType === 'mysql' ? 'none' : '2px solid #D4D2CC',
                    }}
                  >
                    {dbType === 'mysql' && <div className="w-[7px] h-[7px] rounded-full bg-sv-accent-text" />}
                  </div>
                  <span className={`text-[13px] ${dbType === 'mysql' ? 'font-medium text-sv-text' : 'text-sv-secondary'}`}>
                    MySQL
                  </span>
                </div>
                <div
                  onClick={() => setDbType('postgres')}
                  className="flex-1 bg-sv-input rounded-sv-md py-2.5 px-3.5 flex items-center gap-2 cursor-pointer hover:border-[#D4D2CC]"
                  style={{ border: dbType === 'postgres' ? '1px solid #B8F241' : '1px solid #E6E4DE' }}
                >
                  <div
                    className="w-[18px] h-[18px] rounded-full flex items-center justify-center"
                    style={{
                      background: dbType === 'postgres' ? '#B8F241' : 'transparent',
                      border: dbType === 'postgres' ? 'none' : '2px solid #D4D2CC',
                    }}
                  >
                    {dbType === 'postgres' && <div className="w-[7px] h-[7px] rounded-full bg-sv-accent-text" />}
                  </div>
                  <span className={`text-[13px] ${dbType === 'postgres' ? 'font-medium text-sv-text' : 'text-sv-secondary'}`}>
                    PostgreSQL
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-[1fr_120px] gap-3 mb-4">
              <div>
                <label className="block text-[12px] font-medium text-sv-secondary mb-1.5">Host</label>
                <input
                  type="text"
                  placeholder="192.168.1.10"
                  className="w-full bg-sv-input border border-sv-border rounded-sv-md py-[9px] px-3 text-sv-text text-[13px] outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-sv-secondary mb-1.5">Porta</label>
                <input
                  type="number"
                  defaultValue={dbType === 'mysql' ? 3306 : 5432}
                  className="w-full bg-sv-input border border-sv-border rounded-sv-md py-[9px] px-3 text-sv-text text-[13px] outline-none font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-[12px] font-medium text-sv-secondary mb-1.5">Banco de dados</label>
                <input
                  type="text"
                  placeholder="nome_do_banco"
                  className="w-full bg-sv-input border border-sv-border rounded-sv-md py-[9px] px-3 text-sv-text text-[13px] outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-sv-secondary mb-1.5">Usuario</label>
                <input
                  type="text"
                  placeholder="db_user"
                  className="w-full bg-sv-input border border-sv-border rounded-sv-md py-[9px] px-3 text-sv-text text-[13px] outline-none font-mono"
                />
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-[12px] font-medium text-sv-secondary mb-1.5">Senha</label>
              <input
                type="password"
                placeholder="••••••••••••"
                className="w-full bg-sv-input border border-sv-border rounded-sv-md py-[9px] px-3 text-sv-text text-[13px] outline-none"
              />
              <p className="text-[11px] text-sv-hint mt-1.5">
                Armazenada com criptografia AES-256-GCM. Nunca exibida em texto puro.
              </p>
            </div>

            {/* Test connection */}
            <div className="bg-sv-input border border-sv-border rounded-sv-md p-4 mb-6">
              {tc === 'idle' && (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[13px] font-medium text-sv-text mb-[2px]">Testar conexao</div>
                    <div className="text-[12px] text-sv-secondary">Verifica acesso ao banco antes de continuar.</div>
                  </div>
                  <button
                    onClick={testConnection}
                    className="bg-sv-border text-sv-text border-none py-2 px-4 rounded-sv-md text-[12px] font-medium flex-shrink-0 ml-4 hover:bg-[#D4D2CC] transition-colors"
                  >
                    Testar &rarr;
                  </button>
                </div>
              )}
              {tc === 'testing' && (
                <div className="flex items-center gap-3">
                  <div
                    className="w-[18px] h-[18px] rounded-full flex-shrink-0 animate-spin"
                    style={{ border: '2px solid #4F8EF7', borderTopColor: 'transparent' }}
                  />
                  <div>
                    <div className="text-[13px] font-medium text-sv-info">Conectando...</div>
                    <div className="text-[12px] text-sv-secondary">Testando conexao com o banco de dados</div>
                  </div>
                </div>
              )}
              {tc === 'ok' && (
                <div className="flex items-center gap-3">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-sv-accent text-[13px] flex-shrink-0"
                    style={{ background: 'rgba(184,242,65,0.13)' }}
                  >
                    &#10003;
                  </div>
                  <div>
                    <div className="text-[13px] font-medium text-sv-accent">Conexao bem-sucedida</div>
                    <div className="text-[12px] text-sv-secondary">Banco acessivel. Pode prosseguir.</div>
                  </div>
                </div>
              )}
              {tc === 'fail' && (
                <div>
                  <div className="flex items-center gap-3 mb-2.5">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-sv-error text-[13px] flex-shrink-0"
                      style={{ background: 'rgba(255,71,87,0.1)' }}
                    >
                      &#10007;
                    </div>
                    <div>
                      <div className="text-[13px] font-medium text-sv-error">Falha na conexao</div>
                      <div className="text-[12px] text-sv-secondary">Verifique host, porta e credenciais.</div>
                    </div>
                  </div>
                  <div
                    className="rounded-sv p-2.5 px-3 text-[12px] text-sv-error font-mono mb-2.5"
                    style={{ background: 'rgba(255,71,87,0.06)', border: '1px solid rgba(255,71,87,0.15)' }}
                  >
                    Error: Connection refused after 10s timeout
                  </div>
                  <button
                    onClick={testConnection}
                    className="bg-transparent text-sv-secondary py-1.5 px-3.5 rounded-sv text-[12px] hover:border-[#D4D2CC] hover:text-sv-text transition-colors"
                    style={{ border: '1px solid #E6E4DE' }}
                  >
                    Tentar novamente
                  </button>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => navigate('/databases')}
                className="bg-sv-border text-sv-secondary border-none py-2.5 px-5 rounded-sv-md text-[13px] font-medium hover:bg-[#D4D2CC] hover:text-sv-text transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={nextStep}
                className="border-none py-2.5 px-6 rounded-sv-md text-[13px] font-semibold transition-colors"
                style={{
                  background: tc === 'ok' ? '#B8F241' : '#E6E4DE',
                  color: tc === 'ok' ? '#0A0E00' : '#373B52',
                  cursor: tc === 'ok' ? 'pointer' : 'not-allowed',
                  opacity: tc === 'ok' ? 1 : 0.5,
                }}
              >
                Proximo &rarr;
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Config */}
        {step === 2 && (
          <div className="animate-slideDown">
            <h3 className="text-[15px] font-semibold text-sv-text mb-1">Configuracao do backup</h3>
            <p className="text-[13px] text-sv-secondary mb-6">Quando e como o backup deve ser executado.</p>

            <div className="mb-5">
              <label className="block text-[12px] font-medium text-sv-secondary mb-2">Horario do backup</label>
              <select className="w-full bg-sv-input border border-sv-border rounded-sv-md py-[9px] px-3 text-sv-text text-[13px] outline-none cursor-pointer">
                <option value="0 2 * * *">02:00 — Madrugada (recomendado)</option>
                <option value="0 3 * * *">03:00 — Madrugada</option>
                <option value="0 6 * * *">06:00 — Manha cedo</option>
                <option value="0 12 * * *">12:00 — Meio-dia</option>
                <option value="0 22 * * *">22:00 — Noite</option>
              </select>
              <p className="text-[11px] text-sv-hint mt-1.5">Horario de Brasilia (UTC-3).</p>
            </div>

            <div className="mb-5">
              <label className="block text-[12px] font-medium text-sv-secondary mb-2">Retencao dos backups</label>
              <div className="flex gap-2">
                {[
                  { days: 7, disabled: true },
                  { days: 30, disabled: false },
                  { days: 90, disabled: true },
                ].map((opt) => (
                  <div
                    key={opt.days}
                    onClick={() => !opt.disabled && setRetention(opt.days)}
                    className="py-2 px-4 rounded-sv-md text-[12px] cursor-pointer"
                    style={{
                      background:
                        retention === opt.days && !opt.disabled
                          ? 'rgba(184,242,65,0.13)'
                          : '#E6E4DE',
                      color:
                        retention === opt.days && !opt.disabled
                          ? '#B8F241'
                          : '#A9A8A3',
                      border:
                        retention === opt.days && !opt.disabled
                          ? '1px solid rgba(184,242,65,0.38)'
                          : '1px solid #E6E4DE',
                      fontWeight: retention === opt.days && !opt.disabled ? 500 : 400,
                      opacity: opt.disabled ? 0.5 : 1,
                      cursor: opt.disabled ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {opt.days} dias
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-sv-hint mt-2">Retencao de 30 dias incluida no Plano Pro.</p>
            </div>

            <div className="bg-sv-input border border-sv-border rounded-sv-md overflow-hidden mb-6">
              <div className="px-4 py-3.5 border-b border-sv-border flex items-center justify-between">
                <div>
                  <div className="text-[13px] font-medium text-sv-text">E-mail em caso de sucesso</div>
                  <div className="text-[12px] text-sv-secondary mt-[1px]">Confirma quando o backup e concluido</div>
                </div>
                <Toggle checked={emailSuccess} onChange={() => setEmailSuccess(!emailSuccess)} />
              </div>
              <div className="px-4 py-3.5 flex items-center justify-between">
                <div>
                  <div className="text-[13px] font-medium text-sv-text">E-mail em caso de falha</div>
                  <div className="text-[12px] text-sv-secondary mt-[1px]">
                    Sempre ativo — alertas imediatos sao essenciais
                  </div>
                </div>
                <Toggle checked={true} locked />
              </div>
            </div>

            <div className="flex justify-end gap-2.5">
              <button
                onClick={prevStep}
                className="bg-sv-border text-sv-text border-none py-2.5 px-5 rounded-sv-md text-[13px] font-medium hover:bg-[#D4D2CC] transition-colors"
              >
                &larr; Voltar
              </button>
              <button
                onClick={nextStep}
                className="bg-sv-accent text-sv-accent-text border-none py-2.5 px-6 rounded-sv-md text-[13px] font-semibold"
              >
                Proximo &rarr;
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Agent */}
        {step === 3 && (
          <div className="animate-slideDown">
            <h3 className="text-[15px] font-semibold text-sv-text mb-1">Instalar agente</h3>
            <p className="text-[13px] text-sv-secondary mb-6">
              O agente roda no servidor do cliente e envia os backups com seguranca.
            </p>

            {/* Terminal block */}
            <div
              className="rounded-sv-lg p-5 font-mono text-[12.5px] mb-4"
              style={{
                background: '#080A0D',
                border: '1px solid #E6E4DE',
                lineHeight: 1.9,
              }}
            >
              <div className="flex gap-1.5 mb-4">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#FF5F56' }} />
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#FFBD2E' }} />
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#27C93F' }} />
              </div>
              <div style={{ color: '#A9A8A3' }}># 1. instala o agente no servidor do cliente</div>
              <div>
                <span style={{ color: '#B8F241' }}>$</span>{' '}
                <span style={{ color: '#E8E6E1' }}>npm install -g @snapvault/agent</span>
              </div>
              <div className="mt-2" style={{ color: '#A9A8A3' }}>
                # 2. inicializa com o token da conta
              </div>
              <div>
                <span style={{ color: '#B8F241' }}>$</span>{' '}
                <span style={{ color: '#E8E6E1' }}>snapvault init --token sv_live_xk9mPq3...</span>
              </div>
              <div className="mt-2" style={{ color: '#706F6B' }}>
                {'  '}Conectando ao banco... <span style={{ color: '#B8F241' }}>&#10003;</span>
              </div>
              <div style={{ color: '#706F6B' }}>
                {'  '}Configurando backup as 02:00... <span style={{ color: '#B8F241' }}>&#10003;</span>
              </div>
              <div style={{ color: '#706F6B' }}>
                {'  '}Executando backup inicial... <span style={{ color: '#B8F241' }}>&#10003;</span>
              </div>
              <div className="mt-1" style={{ color: '#B8F241' }}>
                &#10003; Snapvault ativo. Proximo backup em 23h 47min.
              </div>
            </div>

            {/* Token copy */}
            <div className="flex items-center gap-2 bg-sv-input border border-sv-border rounded-sv-md py-2.5 px-3.5 mb-5">
              <CopyIcon />
              <span className="flex-1 text-[12px] font-mono text-sv-secondary">sv_live_xk9mPq3R7nW2jKpL4bXz...</span>
              <button
                onClick={() => showToast('success', '✓ Token copiado para a area de transferencia.')}
                className="bg-sv-border text-sv-text border-none py-[5px] px-3 rounded-sv text-[11px] font-medium flex-shrink-0 hover:bg-[#D4D2CC] transition-colors"
              >
                Copiar
              </button>
            </div>

            {/* Summary checklist */}
            <div className="bg-sv-input border border-sv-border rounded-sv-md p-4 mb-6">
              <div className="text-[11px] font-semibold text-sv-secondary uppercase mb-3" style={{ letterSpacing: '0.07em' }}>
                O que foi configurado
              </div>
              <div className="flex flex-col gap-2">
                {[
                  'Banco adicionado e credenciais criptografadas',
                  'Backup diario as 02:00 (horario de Brasilia)',
                  'Retencao de 30 dias configurada',
                  'Alertas por e-mail ativados',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2.5">
                    <span className="text-sv-accent text-[13px] flex-shrink-0">&#10003;</span>
                    <span className="text-[13px] text-sv-text">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2.5">
              <button
                onClick={prevStep}
                className="bg-sv-border text-sv-text border-none py-2.5 px-5 rounded-sv-md text-[13px] font-medium hover:bg-[#D4D2CC] transition-colors"
              >
                &larr; Voltar
              </button>
              <button
                onClick={nextStep}
                className="bg-sv-accent text-sv-accent-text border-none py-2.5 px-6 rounded-sv-md text-[13px] font-semibold"
              >
                Concluir &rarr;
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

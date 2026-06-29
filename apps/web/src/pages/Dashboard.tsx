import { useNavigate } from 'react-router-dom';
import { useToastStore } from '../stores/toast';
import StatusBadge from '../components/ui/StatusBadge';
import { PlusIcon } from '../components/ui/Icons';
import { useDatabases, useBackups, fmtDate, formatBytes, formatDuration } from '../hooks/useData';

export default function Dashboard() {
  const navigate = useNavigate();
  const showToast = useToastStore((s) => s.show);
  const { data: databases = [], isLoading: dbLoading } = useDatabases();
  const { data: backupData, isLoading: bkLoading } = useBackups({ limit: 6 });

  const recentBackups = backupData?.backups ?? [];
  const totalDbs = databases.length;

  const today = new Date().toDateString();
  const todayBackups = recentBackups.filter(
    (b) => b.status === 'SUCCESS' && new Date(b.startedAt).toDateString() === today,
  ).length;

  const lastBackupTime = databases.reduce((latest: string | null, db) => {
    if (!db.lastBackupAt) return latest;
    if (!latest) return db.lastBackupAt;
    return new Date(db.lastBackupAt) > new Date(latest) ? db.lastBackupAt : latest;
  }, null);

  const lastBackupStr = lastBackupTime
    ? String(new Date(lastBackupTime).getHours()).padStart(2, '0') + ':' + String(new Date(lastBackupTime).getMinutes()).padStart(2, '0')
    : '—';

  const loading = dbLoading || bkLoading;

  return (
    <div>
      {/* Header */}
      <div className="px-7 py-5 border-b border-sv-border flex items-center justify-between bg-sv-bg sticky top-0 z-10">
        <div>
          <h2 className="text-[18px] font-bold text-sv-text font-display" style={{ letterSpacing: '-0.4px' }}>
            Visao geral
          </h2>
          <p className="text-[12px] text-sv-secondary mt-[1px]">
            {new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button
          onClick={() => navigate('/databases/new')}
          className="bg-sv-accent text-sv-accent-text border-none px-4 py-2 rounded-sv-md text-[13px] font-semibold flex items-center gap-1.5"
        >
          <PlusIcon />
          Adicionar banco
        </button>
      </div>

      <div className="px-7 py-6">
        {loading ? (
          <div className="text-[13px] text-sv-secondary py-12 text-center">Carregando...</div>
        ) : (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-4 gap-3 mb-7">
              {[
                { label: 'Bancos ativos', value: String(totalDbs) },
                { label: 'Backups hoje', value: String(todayBackups) },
                { label: 'Ultimo backup', value: lastBackupStr },
                { label: 'Total backups', value: String(backupData?.pagination?.total ?? 0) },
              ].map((stat) => (
                <div key={stat.label} className="bg-sv-surface border border-sv-border rounded-sv-lg p-[18px_20px]">
                  <div className="text-[11px] font-medium text-sv-secondary uppercase mb-2" style={{ letterSpacing: '0.07em' }}>
                    {stat.label}
                  </div>
                  <div className="text-[32px] font-extrabold text-sv-text font-display" style={{ letterSpacing: '-1.5px' }}>
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>

            {/* DB Table */}
            <div className="bg-sv-surface border border-sv-border rounded-sv-lg overflow-hidden mb-6">
              <div className="px-5 py-[14px] border-b border-sv-border flex items-center justify-between">
                <span className="text-[13px] font-semibold text-sv-text">Meus bancos</span>
                <button
                  onClick={() => navigate('/databases')}
                  className="text-[12px] text-sv-secondary bg-transparent border-none p-0 hover:text-sv-text transition-colors"
                >
                  Ver todos &rarr;
                </button>
              </div>
              {databases.length === 0 ? (
                <div className="px-5 py-8 text-center text-[13px] text-sv-secondary">
                  Nenhum banco cadastrado.{' '}
                  <button onClick={() => navigate('/databases/new')} className="text-sv-accent bg-transparent border-none font-medium cursor-pointer">
                    Adicionar primeiro banco
                  </button>
                </div>
              ) : (
                <>
                  <div
                    className="grid gap-3 px-5 py-[9px] border-b border-sv-border"
                    style={{ gridTemplateColumns: '2.2fr 1fr 0.75fr 1fr 1fr 70px', background: 'rgba(0,0,0,0.018)' }}
                  >
                    {['Banco', 'Ultimo backup', 'Status', 'Retencao', 'Backups', ''].map((h) => (
                      <span key={h} className="text-[11px] font-medium text-sv-hint uppercase" style={{ letterSpacing: '0.06em' }}>
                        {h}
                      </span>
                    ))}
                  </div>
                  {databases.map((db) => {
                    const status = db.lastStatus ? db.lastStatus.toLowerCase() : 'running';
                    return (
                      <div
                        key={db.id}
                        className="grid gap-3 px-5 py-[9px] border-b border-sv-border items-center hover:bg-[rgba(0,0,0,0.025)] transition-colors"
                        style={{ gridTemplateColumns: '2.2fr 1fr 0.75fr 1fr 1fr 70px' }}
                      >
                        <div>
                          <div className="text-[13px] font-medium text-sv-text">{db.name}</div>
                          <div className="text-[11px] text-sv-secondary font-mono mt-[1px]">
                            {db.type} &middot; {db.host}:{db.port}
                          </div>
                        </div>
                        <span className="text-[12px] text-sv-secondary font-mono">{fmtDate(db.lastBackupAt)}</span>
                        <div>
                          <StatusBadge status={status as 'success' | 'failed' | 'running'} />
                        </div>
                        <span className="text-[12px] text-sv-secondary font-mono">{db.retention}d</span>
                        <span className="text-[12px] text-sv-secondary font-mono">{db._count.backups}</span>
                        <div className="flex gap-[5px]">
                          {status === 'success' && (
                            <button
                              onClick={() => showToast('success', '↓ Link de download gerado. Expira em 15 minutos.')}
                              className="bg-sv-border text-sv-secondary border-none py-[5px] px-[9px] rounded-sv text-[12px] hover:bg-[#D4D2CC] hover:text-sv-text transition-colors"
                              title="Download"
                            >
                              &darr;
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            {/* Recent Activity */}
            <div className="bg-sv-surface border border-sv-border rounded-sv-lg overflow-hidden">
              <div className="px-5 py-[14px] border-b border-sv-border flex items-center justify-between">
                <span className="text-[13px] font-semibold text-sv-text">Atividade recente</span>
                <button
                  onClick={() => navigate('/history')}
                  className="text-[12px] text-sv-secondary bg-transparent border-none p-0 hover:text-sv-text transition-colors"
                >
                  Ver historico &rarr;
                </button>
              </div>
              {recentBackups.length === 0 ? (
                <div className="px-5 py-6 text-center text-[13px] text-sv-secondary">Nenhum backup realizado ainda.</div>
              ) : (
                recentBackups.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center px-5 py-[9px] border-b border-sv-border gap-3 hover:bg-[rgba(0,0,0,0.025)] transition-colors"
                  >
                    {b.status === 'SUCCESS' ? (
                      <span
                        className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-[11px] flex-shrink-0"
                        style={{ background: 'rgba(184,242,65,0.13)', color: '#3D5C00' }}
                      >
                        &#10003;
                      </span>
                    ) : (
                      <span
                        className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-[11px] flex-shrink-0"
                        style={{ background: 'rgba(255,71,87,0.1)', color: '#FF4757' }}
                      >
                        &#10007;
                      </span>
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="text-[12px] font-medium text-sv-text">{b.database.name}</span>
                      <span className="text-[12px] text-sv-hint ml-2 font-mono">{fmtDate(b.startedAt)}</span>
                    </div>
                    <span className="text-[12px] text-sv-secondary font-mono flex-shrink-0">
                      {formatBytes(b.sizeBytes)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

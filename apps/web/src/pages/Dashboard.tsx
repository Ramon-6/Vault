import { useNavigate } from 'react-router-dom';
import { DBS, BACKUPS, fmtDate } from '../lib/mockData';
import { useToastStore } from '../stores/toast';
import StatusBadge from '../components/ui/StatusBadge';
import { PlusIcon } from '../components/ui/Icons';

export default function Dashboard() {
  const navigate = useNavigate();
  const showToast = useToastStore((s) => s.show);

  const totalDbs = DBS.length;
  const todayCount = DBS.filter((d) => d.status === 'success').length;
  const recentBackups = BACKUPS.slice(0, 6);

  return (
    <div>
      {/* Header */}
      <div className="px-7 py-5 border-b border-sv-border flex items-center justify-between bg-sv-bg sticky top-0 z-10">
        <div>
          <h2 className="text-[18px] font-bold text-sv-text font-display" style={{ letterSpacing: '-0.4px' }}>
            Visao geral
          </h2>
          <p className="text-[12px] text-sv-secondary mt-[1px]">28 de junho de 2026</p>
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
        {/* Stat cards */}
        <div className="grid grid-cols-4 gap-3 mb-7">
          {[
            { label: 'Bancos ativos', value: String(totalDbs) },
            { label: 'Backups hoje', value: String(todayCount) },
            { label: 'Ultimo backup', value: '03:00' },
            { label: 'Espaco usado', value: '257 MB' },
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
          <div
            className="grid gap-3 px-5 py-[9px] border-b border-sv-border"
            style={{ gridTemplateColumns: '2.2fr 1fr 0.75fr 1fr 1fr 70px', background: 'rgba(0,0,0,0.018)' }}
          >
            {['Banco', 'Ultimo backup', 'Tam.', 'Status', 'Prox. backup', ''].map((h) => (
              <span key={h} className="text-[11px] font-medium text-sv-hint uppercase" style={{ letterSpacing: '0.06em' }}>
                {h}
              </span>
            ))}
          </div>
          {DBS.map((db) => (
            <div
              key={db.id}
              className="grid gap-3 px-5 py-[9px] border-b border-sv-border items-center hover:bg-[rgba(0,0,0,0.025)] transition-colors"
              style={{ gridTemplateColumns: '2.2fr 1fr 0.75fr 1fr 1fr 70px' }}
            >
              <div>
                <div className="text-[13px] font-medium text-sv-text">{db.name}</div>
                <div className="text-[11px] text-sv-secondary font-mono mt-[1px]">
                  {db.type.toUpperCase()} &middot; {db.host}:{db.port}
                </div>
              </div>
              <span className="text-[12px] text-sv-secondary font-mono">{fmtDate(db.lastAt)}</span>
              <span className="text-[12px] text-sv-secondary font-mono">{db.size || '—'}</span>
              <div>
                <StatusBadge status={db.status} />
              </div>
              <span className="text-[12px] text-sv-hint font-mono">
                {db.status === 'running' ? 'executando...' : db.lastAt ? 'em ~22h' : '—'}
              </span>
              <div className="flex gap-[5px]">
                {db.status === 'success' && (
                  <button
                    onClick={() => showToast('success', '↓ Link de download gerado. Expira em 15 minutos.')}
                    className="bg-sv-border text-sv-secondary border-none py-[5px] px-[9px] rounded-sv text-[12px] hover:bg-[#D4D2CC] hover:text-sv-text transition-colors"
                    title="Download"
                  >
                    &darr;
                  </button>
                )}
                {db.status === 'failed' && (
                  <button
                    onClick={() => showToast('error', '✗ ' + db.error)}
                    className="border-none py-[5px] px-[9px] rounded-sv text-[11px]"
                    style={{ background: 'rgba(255,71,87,0.08)', color: '#FF4757' }}
                    title="Ver erro"
                  >
                    !
                  </button>
                )}
              </div>
            </div>
          ))}
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
          {recentBackups.map((b) => (
            <div
              key={b.id}
              className="flex items-center px-5 py-[9px] border-b border-sv-border gap-3 hover:bg-[rgba(0,0,0,0.025)] transition-colors"
            >
              {b.status === 'success' ? (
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
                <span className="text-[12px] font-medium text-sv-text">{b.dbName}</span>
                <span className="text-[12px] text-sv-hint ml-2 font-mono">{fmtDate(b.at)}</span>
              </div>
              <span className="text-[12px] text-sv-secondary font-mono flex-shrink-0">{b.size}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

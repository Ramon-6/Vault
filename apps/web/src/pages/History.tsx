import { useState } from 'react';
import { DBS, BACKUPS, fmtDate } from '../lib/mockData';
import { useToastStore } from '../stores/toast';
import StatusBadge from '../components/ui/StatusBadge';

export default function History() {
  const showToast = useToastStore((s) => s.show);
  const [filterDb, setFilterDb] = useState('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'success' | 'failed'>('all');

  const filtered = BACKUPS.filter((b) => {
    if (filterDb !== 'all' && b.dbId !== filterDb) return false;
    if (filterStatus !== 'all' && b.status !== filterStatus) return false;
    return true;
  });

  const chipStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 14px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: active ? 600 : 400,
    background: active ? 'rgba(184,242,65,0.13)' : 'transparent',
    color: active ? '#3D5C00' : '#706F6B',
    border: active ? '1px solid rgba(184,242,65,0.38)' : '1px solid #E6E4DE',
    cursor: 'pointer',
  });

  return (
    <div>
      {/* Header */}
      <div className="px-7 py-5 border-b border-sv-border flex items-center justify-between bg-sv-bg sticky top-0 z-10">
        <div>
          <h2 className="text-[18px] font-bold text-sv-text font-display" style={{ letterSpacing: '-0.4px' }}>
            Historico de backups
          </h2>
          <p className="text-[12px] text-sv-secondary mt-[1px]">{filtered.length} registros encontrados</p>
        </div>
      </div>

      <div className="px-7 py-6">
        {/* Filters */}
        <div className="flex items-center gap-2.5 mb-5 flex-wrap">
          <select
            value={filterDb}
            onChange={(e) => setFilterDb(e.target.value)}
            className="bg-sv-surface border border-sv-border rounded-sv-md py-[7px] px-3 text-sv-text text-[12px] outline-none cursor-pointer"
          >
            <option value="all">Todos os bancos</option>
            {DBS.map((db) => (
              <option key={db.id} value={db.id}>
                {db.name}
              </option>
            ))}
          </select>
          <div className="flex gap-1.5">
            <button style={chipStyle(filterStatus === 'all')} onClick={() => setFilterStatus('all')}>
              Todos
            </button>
            <button style={chipStyle(filterStatus === 'success')} onClick={() => setFilterStatus('success')}>
              &#10003; Sucesso
            </button>
            <button style={chipStyle(filterStatus === 'failed')} onClick={() => setFilterStatus('failed')}>
              &#10007; Falhou
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-sv-surface border border-sv-border rounded-sv-lg overflow-hidden">
          <div
            className="grid gap-3 px-5 py-[9px] border-b border-sv-border"
            style={{ gridTemplateColumns: '1.8fr 1.2fr 0.9fr 0.75fr 0.75fr 80px', background: 'rgba(0,0,0,0.018)' }}
          >
            {['Banco', 'Data/hora', 'Status', 'Tam.', 'Duracao', ''].map((h) => (
              <span key={h} className="text-[11px] font-medium text-sv-hint uppercase" style={{ letterSpacing: '0.06em' }}>
                {h}
              </span>
            ))}
          </div>
          {filtered.map((b) => (
            <div
              key={b.id}
              className="grid gap-3 px-5 py-[9px] border-b border-sv-border items-center hover:bg-[rgba(0,0,0,0.025)] transition-colors"
              style={{ gridTemplateColumns: '1.8fr 1.2fr 0.9fr 0.75fr 0.75fr 80px' }}
            >
              <span className="text-[13px] font-medium text-sv-text">{b.dbName}</span>
              <span className="text-[12px] text-sv-secondary font-mono">{fmtDate(b.at)}</span>
              <div>
                <StatusBadge status={b.status} />
              </div>
              <span className="text-[12px] text-sv-secondary font-mono">{b.size}</span>
              <span className="text-[12px] text-sv-secondary font-mono">{b.dur}</span>
              <div>
                {b.status === 'success' ? (
                  <button
                    onClick={() => showToast('success', '↓ Link gerado para ' + b.dbName + '.')}
                    className="bg-sv-border text-sv-secondary border-none py-[5px] px-3 rounded-sv text-[12px] hover:bg-[#D4D2CC] hover:text-sv-text transition-colors"
                  >
                    &darr;
                  </button>
                ) : (
                  <span
                    className="text-[11px] text-sv-error font-mono cursor-help"
                    title={b.error}
                  >
                    ver erro
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4">
          <span className="text-[12px] text-sv-hint">
            Mostrando {filtered.length} de {BACKUPS.length} registros
          </span>
          <div className="flex gap-1.5">
            <button
              className="bg-sv-surface border border-sv-border text-sv-secondary py-1.5 px-3.5 rounded-sv text-[12px] opacity-40 cursor-not-allowed"
              disabled
            >
              &larr; Anterior
            </button>
            <button
              className="bg-sv-surface border border-sv-border text-sv-secondary py-1.5 px-3.5 rounded-sv text-[12px] opacity-40 cursor-not-allowed"
              disabled
            >
              Proxima &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useToastStore } from '../stores/toast';
import StatusBadge from '../components/ui/StatusBadge';
import { useDatabases, useBackups, fmtDate, formatBytes, formatDuration } from '../hooks/useData';

export default function History() {
  const showToast = useToastStore((s) => s.show);
  const [filterDb, setFilterDb] = useState('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [page, setPage] = useState(1);

  const { data: databases = [] } = useDatabases();
  const { data: backupData, isLoading } = useBackups({
    page,
    limit: 20,
    databaseId: filterDb !== 'all' ? filterDb : undefined,
    status: filterStatus !== 'all' ? filterStatus : undefined,
  });

  const backups = backupData?.backups ?? [];
  const pagination = backupData?.pagination ?? { page: 1, total: 0, totalPages: 1 };

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
          <p className="text-[12px] text-sv-secondary mt-[1px]">{pagination.total} registros encontrados</p>
        </div>
      </div>

      <div className="px-7 py-6">
        {/* Filters */}
        <div className="flex items-center gap-2.5 mb-5 flex-wrap">
          <select
            value={filterDb}
            onChange={(e) => { setFilterDb(e.target.value); setPage(1); }}
            className="bg-sv-surface border border-sv-border rounded-sv-md py-[7px] px-3 text-sv-text text-[12px] outline-none cursor-pointer"
          >
            <option value="all">Todos os bancos</option>
            {databases.map((db) => (
              <option key={db.id} value={db.id}>
                {db.name}
              </option>
            ))}
          </select>
          <div className="flex gap-1.5">
            <button style={chipStyle(filterStatus === 'all')} onClick={() => { setFilterStatus('all'); setPage(1); }}>
              Todos
            </button>
            <button style={chipStyle(filterStatus === 'SUCCESS')} onClick={() => { setFilterStatus('SUCCESS'); setPage(1); }}>
              &#10003; Sucesso
            </button>
            <button style={chipStyle(filterStatus === 'FAILED')} onClick={() => { setFilterStatus('FAILED'); setPage(1); }}>
              &#10007; Falhou
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-[13px] text-sv-secondary py-12 text-center">Carregando...</div>
        ) : backups.length === 0 ? (
          <div className="bg-sv-surface border border-sv-border rounded-sv-lg p-12 text-center">
            <div className="text-[14px] font-medium text-sv-text mb-2">Nenhum backup encontrado</div>
            <p className="text-[13px] text-sv-secondary">Os backups aparecerao aqui quando forem realizados.</p>
          </div>
        ) : (
          <>
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
              {backups.map((b) => {
                const status = b.status.toLowerCase();
                return (
                  <div
                    key={b.id}
                    className="grid gap-3 px-5 py-[9px] border-b border-sv-border items-center hover:bg-[rgba(0,0,0,0.025)] transition-colors"
                    style={{ gridTemplateColumns: '1.8fr 1.2fr 0.9fr 0.75fr 0.75fr 80px' }}
                  >
                    <span className="text-[13px] font-medium text-sv-text">{b.database.name}</span>
                    <span className="text-[12px] text-sv-secondary font-mono">{fmtDate(b.startedAt)}</span>
                    <div>
                      <StatusBadge status={status as 'success' | 'failed'} />
                    </div>
                    <span className="text-[12px] text-sv-secondary font-mono">{formatBytes(b.sizeBytes)}</span>
                    <span className="text-[12px] text-sv-secondary font-mono">{formatDuration(b.startedAt, b.finishedAt)}</span>
                    <div>
                      {status === 'success' ? (
                        <button
                          onClick={() => showToast('success', '↓ Link gerado para ' + b.database.name + '.')}
                          className="bg-sv-border text-sv-secondary border-none py-[5px] px-3 rounded-sv text-[12px] hover:bg-[#D4D2CC] hover:text-sv-text transition-colors"
                        >
                          &darr;
                        </button>
                      ) : (
                        <span
                          className="text-[11px] text-sv-error font-mono cursor-help"
                          title={b.errorMessage || ''}
                        >
                          ver erro
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
              <span className="text-[12px] text-sv-hint">
                Pagina {pagination.page} de {pagination.totalPages} &middot; {pagination.total} registros
              </span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="bg-sv-surface border border-sv-border text-sv-secondary py-1.5 px-3.5 rounded-sv text-[12px] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  &larr; Anterior
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page >= pagination.totalPages}
                  className="bg-sv-surface border border-sv-border text-sv-secondary py-1.5 px-3.5 rounded-sv text-[12px] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Proxima &rarr;
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

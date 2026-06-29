import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DBS, fmtDate } from '../lib/mockData';
import { useToastStore } from '../stores/toast';
import StatusBadge from '../components/ui/StatusBadge';
import Modal from '../components/ui/Modal';
import { PlusIcon } from '../components/ui/Icons';

export default function Databases() {
  const navigate = useNavigate();
  const showToast = useToastStore((s) => s.show);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const deleteDb = DBS.find((d) => d.id === deleteId);

  const handleDelete = () => {
    setDeleteId(null);
    showToast('success', '✓ Banco removido permanentemente.');
  };

  return (
    <div>
      {/* Header */}
      <div className="px-7 py-5 border-b border-sv-border flex items-center justify-between bg-sv-bg sticky top-0 z-10">
        <div>
          <h2 className="text-[18px] font-bold text-sv-text font-display" style={{ letterSpacing: '-0.4px' }}>
            Meus bancos
          </h2>
          <p className="text-[12px] text-sv-secondary mt-[1px]">{DBS.length} de 5 slots &middot; Plano Pro</p>
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
        <div className="bg-sv-surface border border-sv-border rounded-sv-lg overflow-hidden">
          <div
            className="grid gap-3 px-5 py-[9px] border-b border-sv-border"
            style={{ gridTemplateColumns: '2.2fr 1fr 1fr 1fr 0.6fr 130px', background: 'rgba(0,0,0,0.018)' }}
          >
            {['Banco', 'Status', 'Ultimo backup', 'Prox. backup', 'Ret.', ''].map((h) => (
              <span key={h} className="text-[11px] font-medium text-sv-hint uppercase" style={{ letterSpacing: '0.06em' }}>
                {h}
              </span>
            ))}
          </div>
          {DBS.map((db) => (
            <div
              key={db.id}
              className="grid gap-3 px-5 py-[9px] border-b border-sv-border items-center hover:bg-[rgba(0,0,0,0.025)] transition-colors"
              style={{ gridTemplateColumns: '2.2fr 1fr 1fr 1fr 0.6fr 130px' }}
            >
              <div>
                <div className="text-[13px] font-medium text-sv-text mb-[2px]">{db.name}</div>
                <div className="text-[11px] text-sv-secondary font-mono">
                  {db.type.toUpperCase()} &middot; {db.host}:{db.port}
                </div>
              </div>
              <div>
                <StatusBadge status={db.status} />
              </div>
              <span className="text-[12px] text-sv-secondary font-mono">{fmtDate(db.lastAt)}</span>
              <span className="text-[12px] text-sv-hint font-mono">
                {db.status === 'running' ? 'executando...' : db.lastAt ? 'em ~22h' : '—'}
              </span>
              <span className="text-[12px] text-sv-secondary font-mono">{db.ret}d</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => showToast('success', '✓ Conexao com "' + db.name + '" testada com sucesso.')}
                  className="bg-sv-border text-sv-secondary border-none py-[5px] px-2.5 rounded-sv text-[11px] font-medium hover:bg-[#D4D2CC] hover:text-sv-text transition-colors"
                >
                  Testar
                </button>
                {db.status === 'success' && (
                  <button
                    onClick={() => showToast('success', '↓ Link de download gerado. Expira em 15 minutos.')}
                    className="bg-sv-border text-sv-secondary border-none py-[5px] px-[9px] rounded-sv text-[12px] hover:bg-[#D4D2CC] hover:text-sv-text transition-colors"
                    title="Download"
                  >
                    &darr;
                  </button>
                )}
                <button
                  onClick={() => setDeleteId(db.id)}
                  className="bg-transparent text-sv-hint border-none py-[5px] px-2 rounded-sv text-[15px] leading-none hover:text-[#C43030] transition-colors"
                  style={{ }}
                  title="Remover"
                >
                  &times;
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Delete Modal */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)}>
        <div className="text-[16px] font-semibold text-sv-text mb-2">Remover banco de dados</div>
        <p className="text-[13px] text-sv-secondary leading-[1.7] mb-6">
          Tem certeza? O banco <strong className="text-sv-text font-semibold">{deleteDb?.name}</strong> e todos os seus
          backups serao removidos permanentemente. Esta acao nao pode ser desfeita.
        </p>
        <div className="flex gap-2.5 justify-end">
          <button
            onClick={() => setDeleteId(null)}
            className="bg-sv-border text-sv-text border-none py-[9px] px-[18px] rounded-sv-md text-[13px] font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleDelete}
            className="bg-sv-error text-white border-none py-[9px] px-[18px] rounded-sv-md text-[13px] font-semibold"
          >
            Remover permanentemente
          </button>
        </div>
      </Modal>
    </div>
  );
}

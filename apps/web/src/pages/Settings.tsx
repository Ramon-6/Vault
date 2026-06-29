import { useState } from 'react';
import { useToastStore } from '../stores/toast';
import { useAuthStore } from '../stores/auth';
import Toggle from '../components/ui/Toggle';
import {
  useApiTokens,
  useCreateToken,
  useDeleteToken,
  useAlertSettings,
  useUpdateAlerts,
  useBillingPlan,
  useUpdateProfile,
  fmtDate,
  fmtShort,
} from '../hooks/useData';

type Tab = 'account' | 'notif' | 'bill' | 'tokens';

export default function Settings() {
  const showToast = useToastStore((s) => s.show);
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const [tab, setTab] = useState<Tab>('account');

  // Account
  const [name, setName] = useState(user?.name ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const profileMutation = useUpdateProfile();

  // Notifications
  const { data: alertSettings } = useAlertSettings();
  const alertMutation = useUpdateAlerts();

  // Billing
  const { data: billingPlan } = useBillingPlan();

  // Tokens
  const { data: tokens = [] } = useApiTokens();
  const createTokenMutation = useCreateToken();
  const deleteTokenMutation = useDeleteToken();

  const handleSaveAccount = async () => {
    const body: { name?: string; currentPassword?: string; newPassword?: string } = {};
    if (name !== user?.name) body.name = name;
    if (newPassword) {
      if (newPassword !== confirmPassword) {
        showToast('error', 'As senhas nao coincidem.');
        return;
      }
      body.currentPassword = currentPassword;
      body.newPassword = newPassword;
    }
    if (Object.keys(body).length === 0) {
      showToast('success', '✓ Nenhuma alteracao detectada.');
      return;
    }
    try {
      const updated = await profileMutation.mutateAsync(body);
      if (updated) updateUser(updated);
      showToast('success', '✓ Configuracoes salvas.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      showToast('error', err.response?.data?.error || 'Erro ao salvar.');
    }
  };

  const handleCreateToken = async () => {
    const label = prompt('Nome do token (ex: Servidor do cliente):');
    if (!label) return;
    try {
      const result = await createTokenMutation.mutateAsync(label);
      await navigator.clipboard.writeText(result.plainToken).catch(() => {});
      showToast('success', '✓ Novo token gerado. Copie-o agora — nao sera exibido novamente.');
    } catch {
      showToast('error', 'Erro ao criar token.');
    }
  };

  const handleRevokeToken = async (id: string, label: string) => {
    try {
      await deleteTokenMutation.mutateAsync(id);
      showToast('success', `Token "${label}" revogado.`);
    } catch {
      showToast('error', 'Erro ao revogar token.');
    }
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: active ? 600 : 400,
    color: active ? '#0C0C0A' : '#706F6B',
    background: 'transparent',
    border: 'none',
    borderBottom: `2px solid ${active ? '#B8F241' : 'transparent'}`,
    cursor: 'pointer',
    marginBottom: '-1px',
  });

  return (
    <div>
      {/* Header */}
      <div className="px-7 py-5 border-b border-sv-border bg-sv-bg sticky top-0 z-10">
        <h2 className="text-[18px] font-bold text-sv-text font-display" style={{ letterSpacing: '-0.4px' }}>
          Configuracoes
        </h2>
      </div>

      <div className="px-7 py-6">
        {/* Tabs */}
        <div className="flex gap-0 mb-7 border-b border-sv-border">
          <button style={tabStyle(tab === 'account')} onClick={() => setTab('account')}>Conta</button>
          <button style={tabStyle(tab === 'notif')} onClick={() => setTab('notif')}>Notificacoes</button>
          <button style={tabStyle(tab === 'bill')} onClick={() => setTab('bill')}>Cobranca</button>
          <button style={tabStyle(tab === 'tokens')} onClick={() => setTab('tokens')}>Tokens de API</button>
        </div>

        {/* Account Tab */}
        {tab === 'account' && (
          <div className="max-w-[480px] animate-slideDown">
            <div className="mb-4">
              <label className="block text-[12px] font-medium text-sv-secondary mb-1.5">Nome completo</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-sv-input border border-sv-border rounded-sv-md py-[9px] px-3 text-sv-text text-[13px] outline-none"
              />
            </div>
            <div className="mb-7">
              <label className="block text-[12px] font-medium text-sv-secondary mb-1.5">E-mail</label>
              <input
                type="email"
                defaultValue={user?.email ?? ''}
                disabled
                className="w-full bg-sv-input border border-sv-border rounded-sv-md py-[9px] px-3 text-sv-secondary text-[13px] outline-none cursor-not-allowed opacity-70"
              />
              <p className="text-[11px] text-sv-hint mt-[5px]">Para alterar o e-mail, entre em contato com o suporte.</p>
            </div>

            <div className="border-t border-sv-border pt-6 mb-7">
              <div className="text-[13px] font-semibold text-sv-text mb-4">Alterar senha</div>
              <div className="mb-3.5">
                <label className="block text-[12px] font-medium text-sv-secondary mb-1.5">Senha atual</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-sv-input border border-sv-border rounded-sv-md py-[9px] px-3 text-sv-text text-[13px] outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-medium text-sv-secondary mb-1.5">Nova senha</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-sv-input border border-sv-border rounded-sv-md py-[9px] px-3 text-sv-text text-[13px] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-sv-secondary mb-1.5">Confirmar</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-sv-input border border-sv-border rounded-sv-md py-[9px] px-3 text-sv-text text-[13px] outline-none"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleSaveAccount}
              disabled={profileMutation.isPending}
              className="bg-sv-accent text-sv-accent-text border-none py-[9px] px-5 rounded-sv-md text-[13px] font-semibold disabled:opacity-60"
            >
              {profileMutation.isPending ? 'Salvando...' : 'Salvar alteracoes'}
            </button>

            {/* Danger zone */}
            <div className="mt-10 pt-6" style={{ borderTop: '1px solid rgba(255,71,87,0.15)' }}>
              <div className="text-[11px] font-semibold text-sv-error uppercase mb-2.5" style={{ letterSpacing: '0.08em' }}>
                Zona de perigo
              </div>
              <p className="text-[13px] text-sv-secondary mb-3.5 leading-relaxed max-w-[380px]">
                Ao cancelar a conta todos os backups sao removidos permanentemente apos 30 dias.
              </p>
              <button
                className="bg-transparent py-2 px-4 rounded-sv-md text-[12px] font-medium text-sv-error hover:bg-[rgba(255,71,87,0.08)] transition-colors"
                style={{ border: '1px solid rgba(255,71,87,0.25)' }}
              >
                Cancelar conta
              </button>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {tab === 'notif' && (
          <div className="max-w-[480px] animate-slideDown">
            <div className="bg-sv-surface border border-sv-border rounded-sv-lg overflow-hidden mb-5">
              <div className="px-5 py-[15px] border-b border-sv-border flex items-center justify-between">
                <div>
                  <div className="text-[13px] font-medium text-sv-text">E-mail em caso de sucesso</div>
                  <div className="text-[12px] text-sv-secondary mt-[2px]">Confirma quando cada backup e concluido</div>
                </div>
                <Toggle
                  checked={alertSettings?.emailOnSuccess ?? false}
                  onChange={() => alertMutation.mutate({ emailOnSuccess: !alertSettings?.emailOnSuccess })}
                />
              </div>
              <div className="px-5 py-[15px] border-b border-sv-border flex items-center justify-between">
                <div>
                  <div className="text-[13px] font-medium text-sv-text">E-mail em caso de falha</div>
                  <div className="text-[12px] text-sv-secondary mt-[2px]">
                    Sempre ativo — alertas imediatos sao essenciais
                  </div>
                </div>
                <Toggle checked={true} locked />
              </div>
              <div className="px-5 py-[15px] flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium text-sv-text">WhatsApp</span>
                    <span
                      className="text-[10px] font-semibold py-[2px] px-[7px] rounded font-mono"
                      style={{ background: 'rgba(184,242,65,0.13)', color: '#3D5C00' }}
                    >
                      PRO
                    </span>
                  </div>
                  <div className="text-[12px] text-sv-secondary mt-[2px]">
                    Alertas no WhatsApp para falhas criticas
                  </div>
                </div>
                <Toggle checked={false} onChange={() => showToast('success', 'Em breve!')} />
              </div>
            </div>
            <div className="mb-5">
              <label className="block text-[12px] font-medium text-sv-secondary mb-1.5">
                E-mail de destino para alertas
              </label>
              <input
                type="email"
                defaultValue={user?.email ?? ''}
                className="w-full bg-sv-input border border-sv-border rounded-sv-md py-[9px] px-3 text-sv-text text-[13px] outline-none"
              />
            </div>
            <button
              onClick={() => showToast('success', '✓ Configuracoes salvas.')}
              className="bg-sv-accent text-sv-accent-text border-none py-[9px] px-5 rounded-sv-md text-[13px] font-semibold"
            >
              Salvar
            </button>
          </div>
        )}

        {/* Billing Tab */}
        {tab === 'bill' && (
          <div className="max-w-[520px] animate-slideDown">
            <div
              className="bg-sv-surface rounded-sv-lg p-5 px-6 mb-4 relative"
              style={{ border: '1px solid rgba(184,242,65,0.38)' }}
            >
              <div
                className="absolute top-3.5 right-3.5 text-[10px] font-bold py-[3px] px-2.5 rounded-full font-mono"
                style={{ background: 'rgba(184,242,65,0.13)', color: '#3D5C00' }}
              >
                PLANO ATUAL
              </div>
              <div
                className="text-[11px] font-semibold text-sv-secondary uppercase font-mono mb-1.5"
                style={{ letterSpacing: '0.08em' }}
              >
                {billingPlan?.name ?? user?.plan ?? 'Free'}
              </div>
              <div className="text-[32px] font-extrabold text-sv-text font-mono" style={{ letterSpacing: '-1.5px' }}>
                R${billingPlan?.price ?? 0}
                <span className="text-[14px] font-normal text-sv-secondary">/mes</span>
              </div>
              <div className="mt-3.5 flex flex-col gap-2">
                {[
                  { label: 'Bancos de dados', value: `${billingPlan?.usage?.databases ?? 0} / ${billingPlan?.limits?.maxDatabases ?? 1}` },
                  { label: 'Retencao', value: `${billingPlan?.limits?.maxRetention ?? 7} dias` },
                ].map((row, i) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between py-2 px-3 rounded-sv-md"
                    style={{ background: i === 0 ? '#000000' : '#1A1A17' }}
                  >
                    <span className="text-[13px]" style={{ color: '#B8F241' }}>
                      {row.label}
                    </span>
                    <span className="text-[13px] font-mono" style={{ color: '#B8F241' }}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-sv-surface border border-sv-border rounded-sv-lg p-[18px_20px] mb-5 flex items-center justify-between gap-5">
              <div>
                <div className="text-[14px] font-semibold text-sv-text mb-1">Upgrade para Business</div>
                <div className="text-[12px] text-sv-secondary leading-relaxed">
                  Bancos ilimitados, retencao de 90 dias, backup a cada 6h.
                </div>
              </div>
              <button
                onClick={() => showToast('success', 'Em breve! Integracao com Stripe.')}
                className="bg-sv-accent text-sv-accent-text border-none py-[9px] px-[18px] rounded-sv-md text-[13px] font-semibold flex-shrink-0 whitespace-nowrap"
              >
                R$199/mes &rarr;
              </button>
            </div>

            <button className="bg-transparent border-none text-sv-hint text-[12px] p-0 cursor-pointer hover:text-sv-secondary transition-colors">
              Cancelar assinatura
            </button>
          </div>
        )}

        {/* API Tokens Tab */}
        {tab === 'tokens' && (
          <div className="max-w-[520px] animate-slideDown">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[13px] text-sv-secondary">Tokens autenticam o agente no servidor do cliente.</p>
              <button
                onClick={handleCreateToken}
                disabled={createTokenMutation.isPending}
                className="bg-sv-accent text-sv-accent-text border-none py-[7px] px-3.5 rounded-sv-md text-[12px] font-semibold flex-shrink-0 whitespace-nowrap disabled:opacity-60"
              >
                + Novo token
              </button>
            </div>

            {tokens.length === 0 ? (
              <div className="bg-sv-surface border border-sv-border rounded-sv-lg p-8 text-center mb-4">
                <div className="text-[13px] text-sv-secondary">Nenhum token criado ainda.</div>
              </div>
            ) : (
              <div className="bg-sv-surface border border-sv-border rounded-sv-lg overflow-hidden mb-4">
                {tokens.map((t) => (
                  <div
                    key={t.id}
                    className="px-5 py-[9px] border-b border-sv-border flex items-center gap-4 hover:bg-[rgba(0,0,0,0.025)] transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium text-sv-text mb-[2px]">{t.label}</div>
                      <div className="text-[11px] text-sv-hint font-mono">
                        Usado {fmtDate(t.lastUsedAt)} &middot; Criado {fmtShort(t.createdAt)}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRevokeToken(t.id, t.label)}
                      disabled={deleteTokenMutation.isPending}
                      className="bg-transparent py-[5px] px-3 rounded-sv text-[11px] font-medium flex-shrink-0 text-sv-error hover:bg-[rgba(255,71,87,0.08)] transition-colors disabled:opacity-50"
                      style={{ border: '1px solid rgba(255,71,87,0.2)' }}
                    >
                      Revogar
                    </button>
                  </div>
                ))}
              </div>
            )}

            <p className="text-[12px] text-sv-hint leading-relaxed">
              Os tokens sao exibidos apenas uma vez ao serem gerados. Guarde-os com seguranca.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

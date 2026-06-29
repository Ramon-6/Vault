import { useToastStore } from '../../stores/toast';

export default function Toast() {
  const toast = useToastStore((s) => s.toast);

  if (!toast) return null;

  return (
    <div
      className="fixed top-5 right-5 z-[9999] bg-sv-surface border border-sv-border rounded-sv-md py-3 px-4 text-[13px] text-sv-text flex items-center gap-2.5 animate-slideDown min-w-[280px] max-w-[420px]"
      style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.06)' }}
    >
      {toast.type === 'success' ? (
        <span className="text-sv-accent text-[16px] flex-shrink-0">&#10003;</span>
      ) : (
        <span className="text-sv-error text-[16px] flex-shrink-0">&#10007;</span>
      )}
      <span className="leading-[1.45]">{toast.msg}</span>
    </div>
  );
}

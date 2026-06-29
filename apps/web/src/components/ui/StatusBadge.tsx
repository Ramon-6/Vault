interface StatusBadgeProps {
  status: 'success' | 'failed' | 'running';
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  if (status === 'success') {
    return (
      <span
        className="inline-flex items-center gap-[5px] text-[11px] font-medium py-[3px] px-[9px] rounded-full font-mono"
        style={{ background: 'rgba(184,242,65,0.13)', color: '#3D5C00' }}
      >
        <span className="w-[5px] h-[5px] rounded-full bg-current inline-block" />
        OK
      </span>
    );
  }

  if (status === 'failed') {
    return (
      <span
        className="inline-flex items-center gap-[5px] text-[11px] font-medium py-[3px] px-[9px] rounded-full font-mono"
        style={{ background: 'rgba(255,71,87,0.1)', color: '#FF4757' }}
      >
        <span className="w-[5px] h-[5px] rounded-full bg-current inline-block" />
        Falhou
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-[5px] text-[11px] font-medium py-[3px] px-[9px] rounded-full font-mono"
      style={{ background: 'rgba(79,142,247,0.1)', color: '#4F8EF7' }}
    >
      <span className="w-[5px] h-[5px] rounded-full bg-current inline-block animate-pulse" />
      Backup
    </span>
  );
}

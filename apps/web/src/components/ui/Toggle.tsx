interface ToggleProps {
  checked: boolean;
  onChange?: () => void;
  disabled?: boolean;
  locked?: boolean;
}

export default function Toggle({ checked, onChange, disabled, locked }: ToggleProps) {
  const bg = checked ? '#B8F241' : '#E6E4DE';
  const dotColor = checked ? '#0A0E00' : '#373B52';
  const cursor = locked ? 'cursor-not-allowed' : disabled ? 'cursor-not-allowed' : 'cursor-pointer';
  const opacity = locked ? 'opacity-50' : '';

  return (
    <div
      className={`w-10 h-[22px] rounded-[11px] relative flex-shrink-0 transition-colors ${cursor} ${opacity}`}
      style={{ background: bg }}
      onClick={() => {
        if (!locked && !disabled && onChange) onChange();
      }}
    >
      <div
        className="absolute top-[3px] w-4 h-4 rounded-full transition-all"
        style={{
          background: dotColor,
          left: checked ? 'auto' : '3px',
          right: checked ? '3px' : 'auto',
        }}
      />
    </div>
  );
}

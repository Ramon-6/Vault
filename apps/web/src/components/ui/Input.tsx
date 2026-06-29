import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  mono?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, mono, className = '', style, ...props }, ref) => {
    return (
      <div className={className}>
        {label && (
          <label className="block text-[12px] font-medium text-sv-secondary mb-1.5">{label}</label>
        )}
        <input
          ref={ref}
          className="w-full bg-sv-input border border-sv-border rounded-sv-md py-[9px] px-3 text-sv-text text-[13px] outline-none focus:border-[#D4D2CC] transition-colors"
          style={{
            fontFamily: mono ? "'JetBrains Mono', monospace" : undefined,
            ...style,
          }}
          {...props}
        />
        {hint && (
          <p className="text-[11px] text-sv-hint mt-1.5">{hint}</p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
export default Input;

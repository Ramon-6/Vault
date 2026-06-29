import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md';
  children: React.ReactNode;
}

export default function Button({ variant = 'primary', size = 'md', children, className = '', style, ...props }: ButtonProps) {
  const base = 'border-none font-semibold flex items-center justify-center gap-1.5 transition-all';
  const sizes = {
    sm: 'px-3 py-1.5 text-[12px] rounded-sv',
    md: 'px-4 py-[9px] text-[13px] rounded-sv-md',
  };
  const variants: Record<string, React.CSSProperties> = {
    primary: { background: '#B8F241', color: '#0A0E00' },
    secondary: { background: '#E6E4DE', color: '#706F6B' },
    danger: { background: 'transparent', color: '#FF4757', border: '1px solid rgba(255,71,87,0.25)' },
    ghost: { background: 'transparent', color: '#706F6B' },
  };
  const hoverClass: Record<string, string> = {
    primary: 'hover:opacity-90',
    secondary: 'hover:bg-[#D4D2CC] hover:text-sv-text',
    danger: 'hover:bg-[rgba(255,71,87,0.08)]',
    ghost: 'hover:text-sv-text',
  };

  return (
    <button
      className={`${base} ${sizes[size]} ${hoverClass[variant]} ${className}`}
      style={{ ...variants[variant], ...style }}
      {...props}
    >
      {children}
    </button>
  );
}

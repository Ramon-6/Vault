import React from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function Modal({ open, onClose, children }: ModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9000] flex items-center justify-center animate-fadeIn"
      style={{ background: 'rgba(0,0,0,0.42)' }}
      onClick={onClose}
    >
      <div
        className="bg-sv-surface border border-sv-border rounded-sv-lg p-7 w-[420px]"
        style={{ boxShadow: '0 24px 60px rgba(0,0,0,0.06)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

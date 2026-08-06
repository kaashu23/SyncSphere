import React from 'react';

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', confirmColor = 'bg-error text-on-error hover:bg-error-container hover:text-on-error-container' }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-surface w-full max-w-[400px] rounded-2xl shadow-2xl p-6 flex flex-col gap-4 border border-outline-variant/30 animate-in fade-in zoom-in duration-200">
        <h3 className="font-title-md text-on-surface font-semibold tracking-tight">{title}</h3>
        <p className="font-body-md text-on-surface-variant leading-relaxed">
          {message}
        </p>
        <div className="flex gap-3 mt-2">
          <button 
            onClick={onClose} 
            className="flex-1 py-2.5 rounded-lg font-title-sm text-on-surface-variant bg-surface-container hover:bg-surface-container-high transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => { onConfirm(); onClose(); }} 
            className={`flex-1 py-2.5 rounded-lg font-title-sm transition-colors ${confirmColor}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

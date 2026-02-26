import React, { useEffect } from 'react';

const styles = {
  success: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
  error: 'bg-red-500/15 border-red-500/30 text-red-400',
  warning: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
  info: 'bg-blue-500/15 border-blue-500/30 text-blue-400',
};

export default function Toast({ message, type = 'info', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  const icons = { success: '✓', error: '✗', warning: '⚠', info: 'ℹ' };

  return (
    <div
      className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm cursor-pointer animate-slide-in min-w-[250px] max-w-[400px] backdrop-blur-lg border ${styles[type] || styles.info}`}
      onClick={onClose}
    >
      <span className="text-base font-bold">{icons[type] || icons.info}</span>
      <span className="flex-1">{message}</span>
    </div>
  );
}

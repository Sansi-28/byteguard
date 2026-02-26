import React from 'react';

export default function TopBar({ user, onMenuToggle, onProfileClick }) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 bg-gray-900/85 backdrop-blur-xl border-b border-gray-800">
      <button
        className="flex flex-col gap-1 p-1.5 lg:hidden"
        onClick={onMenuToggle}
        aria-label="Toggle menu"
      >
        <span className="block w-5 h-0.5 bg-gray-400 rounded-sm" />
        <span className="block w-5 h-0.5 bg-gray-400 rounded-sm" />
        <span className="block w-5 h-0.5 bg-gray-400 rounded-sm" />
      </button>

      <div className="flex items-center gap-2 font-bold text-white text-sm lg:hidden">
        <span>🛡️</span>
        <span>ByteGuard</span>
      </div>
      <div className="hidden lg:block" />

      <div className="flex items-center gap-3">
        <span className="hidden md:flex items-center gap-1.5 text-xs text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_theme(colors.emerald.500)]" />
          Quantum Safe
        </span>
        <button
          className="flex items-center gap-2 bg-white/5 border border-gray-700 rounded-full py-1 pl-1 pr-3 cursor-pointer text-white hover:border-indigo-500 transition"
          onClick={onProfileClick}
        >
          <span className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold">
            {user?.researcherId?.charAt(0)?.toUpperCase() || 'R'}
          </span>
          <span className="text-xs hidden md:inline">{user?.researcherId || 'Researcher'}</span>
        </button>
      </div>
    </header>
  );
}

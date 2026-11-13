import { useState, useRef, useEffect } from 'react';
import { LogOut, Snowflake, UserRound, ChevronDown, Bell } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ROLE_LABELS } from '../types';

export default function UserMenu() {
  const { profile, signOut, unreadNotifications } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!profile) return null;
  const initial = profile.full_name.charAt(0).toUpperCase();

  return (
    <div ref={ref} className="relative flex items-center gap-2">
      <span className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-frost-200 bg-white text-frost-500">
        <Bell className="h-4 w-4" />
        {unreadNotifications > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-ice-600 px-1 text-[10px] font-bold text-white">
            {unreadNotifications > 9 ? '9+' : unreadNotifications}
          </span>
        )}
      </span>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 rounded-xl border border-frost-200 bg-white px-3 py-2 shadow-sm transition-all hover:border-ice-300 hover:shadow-md"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ice-600 text-sm font-bold text-white">
          {initial}
        </div>
        <div className="hidden text-left sm:block">
          <p className="text-xs text-frost-400">{ROLE_LABELS[profile.role]}</p>
          <p className="max-w-[10rem] truncate text-sm font-semibold text-frost-700">{profile.full_name}</p>
        </div>
        <ChevronDown className={`h-4 w-4 text-frost-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-40 mt-2 w-64 animate-slide-up rounded-xl border border-frost-200 bg-white shadow-xl">
          <div className="flex items-center gap-3 border-b border-frost-100 px-4 py-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ice-100 text-ice-700">
              <UserRound className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-frost-800">{profile.full_name}</p>
              <p className="truncate text-xs text-frost-400">{profile.email}</p>
            </div>
          </div>
          <div className="px-4 py-2 text-xs font-medium uppercase tracking-wide text-frost-400">
            {ROLE_LABELS[profile.role]}
          </div>
          <button
            onClick={() => signOut()}
            className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}

export function AppLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-ice-400 to-ice-600 shadow-lg shadow-ice-500/30">
        <Snowflake className="h-5 w-5 text-white" />
      </div>
      <div>
        <h1 className="font-display text-lg font-bold leading-tight text-frost-800">Helados System</h1>
        <p className="text-xs text-frost-400">Inventarios 3D / RA</p>
      </div>
    </div>
  );
}

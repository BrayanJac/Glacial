import { Warehouse, ShoppingCart, BarChart3, User, Snowflake, Check, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import type { Role } from '../types';
import { ROLE_LABELS } from '../types';

const ROLE_LIST: Role[] = ['bodeguero', 'vendedor', 'gerente', 'cliente'];

const ROLE_ICON_MAP: Record<Role, typeof Warehouse> = {
  bodeguero: Warehouse,
  vendedor: ShoppingCart,
  gerente: BarChart3,
  cliente: User,
};

interface RoleSelectorProps {
  role: Role;
  onChange: (r: Role) => void;
}

export default function RoleSelector({ role, onChange }: RoleSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const CurrentIcon = ROLE_ICON_MAP[role];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 rounded-xl border border-frost-200 bg-white px-4 py-2.5 shadow-sm transition-all hover:border-ice-300 hover:shadow-md"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ice-100">
          <CurrentIcon className="h-4.5 w-4.5 text-ice-600" />
        </div>
        <div className="text-left">
          <p className="text-xs text-frost-400">Rol activo</p>
          <p className="text-sm font-semibold text-frost-700">{ROLE_LABELS[role]}</p>
        </div>
        <ChevronDown className={`h-4 w-4 text-frost-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-40 mt-2 w-64 animate-slide-up rounded-xl border border-frost-200 bg-white shadow-xl">
          <div className="px-3 py-2 border-b border-frost-100">
            <p className="text-xs font-medium text-frost-400">Cambiar rol</p>
          </div>
          {ROLE_LIST.map((r) => {
            const Icon = ROLE_ICON_MAP[r];
            const isActive = r === role;
            return (
              <button
                key={r}
                onClick={() => {
                  onChange(r);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                  isActive ? 'bg-ice-50' : 'hover:bg-frost-50'
                }`}
              >
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                  isActive ? 'bg-ice-600' : 'bg-frost-100'
                }`}>
                  <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-frost-500'}`} />
                </div>
                <span className={`flex-1 text-sm font-medium ${isActive ? 'text-ice-700' : 'text-frost-700'}`}>
                  {ROLE_LABELS[r]}
                </span>
                {isActive && <Check className="h-4 w-4 text-ice-600" />}
              </button>
            );
          })}
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

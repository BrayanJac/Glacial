import { useState } from 'react';
import {
  LayoutDashboard, Box, BarChart3, Menu, X, Bell, Loader2,
} from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext';
import UserMenu, { AppLogo } from './components/RoleSelector';
import AuthView from './views/AuthView';
import BodegueroView from './views/BodegueroView';
import VendedorView from './views/VendedorView';
import GerenteView from './views/GerenteView';
import ClienteView from './views/ClienteView';
import NotificationsView from './views/NotificationsView';
import type { Role } from './types';

type ViewKey = 'dashboard' | 'notifications';

interface NavItem {
  key: ViewKey;
  label: string;
  icon: typeof LayoutDashboard;
  roles: Role[];
}

const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', label: 'Operacion', icon: LayoutDashboard, roles: ['bodeguero', 'vendedor', 'gerente', 'cliente'] },
  { key: 'notifications', label: 'Notificaciones', icon: Bell, roles: ['bodeguero', 'vendedor', 'gerente', 'cliente'] },
];

function AppContent() {
  const { session, authReady, role } = useApp();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activeView, setActiveView] = useState<ViewKey>('dashboard');

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-frost-50">
        <Loader2 className="h-8 w-8 animate-spin text-ice-600" />
      </div>
    );
  }

  if (!session) {
    return <AuthView />;
  }

  const visibleNav = NAV_ITEMS.filter((n) => n.roles.includes(role));
  const currentView = visibleNav.some((n) => n.key === activeView) ? activeView : visibleNav[0]?.key ?? 'dashboard';

  function handleNavigate(key: ViewKey) {
    setActiveView(key);
    setMobileNavOpen(false);
  }

  function renderMainView() {
    if (currentView === 'notifications') return <NotificationsView />;
    switch (role) {
      case 'bodeguero': return <BodegueroView />;
      case 'vendedor': return <VendedorView />;
      case 'gerente': return <GerenteView />;
      case 'cliente': return <ClienteView />;
      default: return <ClienteView />;
    }
  }

  return (
    <div className="min-h-screen bg-frost-50">
      <header className="sticky top-0 z-30 border-b border-frost-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="lg:hidden flex h-9 w-9 items-center justify-center rounded-lg border border-frost-200 text-frost-600"
            >
              {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <AppLogo />
          </div>
          <UserMenu />
        </div>

        <nav className="hidden lg:block border-t border-frost-100">
          <div className="mx-auto flex max-w-7xl gap-1 px-6">
            {visibleNav.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => handleNavigate(item.key)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative ${
                    isActive ? 'text-ice-600' : 'text-frost-500 hover:text-frost-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                  {item.key === 'notifications' && <NotificationDot />}
                  {isActive && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-ice-600" />
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      </header>

      {mobileNavOpen && (
        <nav className="lg:hidden fixed top-[65px] left-0 right-0 z-20 border-b border-frost-200 bg-white shadow-lg animate-slide-up">
          <div className="flex flex-col p-3 gap-1">
            {visibleNav.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => handleNavigate(item.key)}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                    isActive ? 'bg-ice-50 text-ice-600' : 'text-frost-500 hover:bg-frost-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                  {item.key === 'notifications' && <NotificationDot />}
                </button>
              );
            })}
          </div>
        </nav>
      )}

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 animate-fade-in">
        {renderMainView()}
      </main>

      <footer className="border-t border-frost-200 bg-white/50">
        <div className="mx-auto max-w-7xl px-6 py-4 text-center text-xs text-frost-400">
          Helados System - Sistema de Control de Inventarios y Catalogo 3D/RA | Distribuidora Don Willy
        </div>
      </footer>
    </div>
  );
}

function NotificationDot() {
  const { unreadNotifications } = useApp();
  if (unreadNotifications === 0) return null;
  return (
    <span className="ml-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-ice-600 px-1 text-[10px] font-bold text-white">
      {unreadNotifications > 9 ? '9+' : unreadNotifications}
    </span>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

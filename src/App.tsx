import { useState } from 'react';
import {
  LayoutDashboard, Box, BarChart3, Menu, X,
} from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext';
import RoleSelector, { AppLogo } from './components/RoleSelector';
import DashboardView from './views/DashboardView';
import CatalogView from './views/CatalogView';
import AnalyticsView from './views/AnalyticsView';
import type { Role } from './types';

type ViewKey = 'dashboard' | 'catalog' | 'analytics';

interface NavItem {
  key: ViewKey;
  label: string;
  icon: typeof LayoutDashboard;
  roles: Role[];
}

const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard de Inventarios', icon: LayoutDashboard, roles: ['bodeguero', 'gerente'] },
  { key: 'catalog', label: 'Catalogo 3D / RA', icon: Box, roles: ['cliente', 'vendedor'] },
  { key: 'analytics', label: 'Analytics y Rotacion', icon: BarChart3, roles: ['gerente'] },
];

function AppContent() {
  const { role, setRole } = useApp();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const visibleNav = NAV_ITEMS.filter((n) => n.roles.includes(role));
  const [activeView, setActiveView] = useState<ViewKey>('dashboard');

  // Auto-switch to first available view when role changes
  const currentView = visibleNav.some((n) => n.key === activeView) ? activeView : visibleNav[0]?.key ?? 'dashboard';

  function handleNavigate(key: ViewKey) {
    setActiveView(key);
    setMobileNavOpen(false);
  }

  return (
    <div className="min-h-screen bg-frost-50">
      {/* Top Header */}
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
          <RoleSelector role={role} onChange={setRole} />
        </div>

        {/* Nav tabs - desktop */}
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
                  {isActive && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-ice-600" />
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      </header>

      {/* Mobile nav */}
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
                </button>
              );
            })}
          </div>
        </nav>
      )}

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 animate-fade-in">
        {currentView === 'dashboard' && <DashboardView />}
        {currentView === 'catalog' && <CatalogView />}
        {currentView === 'analytics' && <AnalyticsView />}
      </main>

      {/* Footer */}
      <footer className="border-t border-frost-200 bg-white/50">
        <div className="mx-auto max-w-7xl px-6 py-4 text-center text-xs text-frost-400">
          Helados System - Sistema de Control de Inventarios y Catalogo 3D/RA | Prototipo funcional
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

import { useState } from 'react';
import { ArrowRight, Eye, EyeOff, Loader2, LockKeyhole, Mail, Snowflake, UserRound, Zap } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import { ROLE_LABELS } from '../types';
import type { Role } from '../types';

interface AuthResult {
  error?: string;
  message?: string;
}

const QUICK_ACCESS: { role: Role; email: string; label: string; color: string }[] = [
  { role: 'gerente', email: 'gerente@helados.test', label: ROLE_LABELS.gerente, color: 'from-ice-500 to-ice-700' },
  { role: 'bodeguero', email: 'bodeguero@helados.test', label: ROLE_LABELS.bodeguero, color: 'from-emerald-500 to-emerald-700' },
  { role: 'vendedor', email: 'vendedor@helados.test', label: ROLE_LABELS.vendedor, color: 'from-amber-500 to-amber-600' },
  { role: 'cliente', email: 'cliente@helados.test', label: ROLE_LABELS.cliente, color: 'from-frost-500 to-frost-700' },
];
const DEMO_PASSWORD = 'helados123';
const DEMO_EMAILS = new Set(QUICK_ACCESS.map((q) => q.email));

export default function AuthView() {
  const { signIn, signUp } = useApp();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function ensureDemoUsersAndRetry(email: string, password: string): Promise<AuthResult> {
    const { error: fnError } = await supabase.functions.invoke('setup-demo-users');
    if (fnError) return { error: 'No se pudieron configurar los usuarios demo. Intenta de nuevo.' };
    return signIn(email, password);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    let result = mode === 'login'
      ? await signIn(email, password)
      : await signUp(fullName, email, password);
    if (result.error && mode === 'login' && DEMO_EMAILS.has(email)) {
      setMessage('Configurando usuarios demo, por favor espera...');
      result = await ensureDemoUsersAndRetry(email, password);
      setMessage('');
    }
    setLoading(false);
    if (result.error) setError(result.error);
    if (result.message) setMessage(result.message);
  }

  async function quickAccess(roleEmail: string) {
    setError('');
    setMessage('');
    setLoading(true);
    let result = await signIn(roleEmail, DEMO_PASSWORD);
    if (result.error) {
      setMessage('Configurando usuarios demo, por favor espera...');
      result = await ensureDemoUsersAndRetry(roleEmail, DEMO_PASSWORD);
      setMessage('');
    }
    setLoading(false);
    if (result.error) setError(result.error);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-frost-900 via-ice-900 to-ice-700 px-4 py-8 sm:px-6">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden text-white lg:block">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
              <Snowflake className="h-6 w-6" />
            </div>
            <div>
              <p className="font-display text-xl font-bold">Helados System</p>
              <p className="text-sm text-ice-100">Distribuidora Don Willy</p>
            </div>
          </div>
          <p className="mb-5 max-w-xl text-sm font-semibold uppercase tracking-[0.24em] text-ice-200">Control comercial inteligente</p>
          <h1 className="max-w-2xl font-display text-5xl font-bold leading-tight">Todo el frío de tu operación, bajo control.</h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-ice-100">Inventario, pedidos, recompra y decisiones estratégicas en un solo espacio, con una experiencia distinta para cada rol.</p>
          <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
            {['Inventario vivo', 'Alertas preventivas', 'Catálogo 3D / RA'].map((item) => (
              <div key={item} className="rounded-2xl border border-white/15 bg-white/10 p-4 text-sm text-ice-50 backdrop-blur-sm">{item}</div>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-ice-100"><Snowflake className="h-5 w-5 text-ice-600" /></div>
            <div><p className="font-display text-lg font-bold text-frost-800">Helados System</p><p className="text-xs text-frost-400">Distribuidora Don Willy</p></div>
          </div>
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ice-600">Acceso seguro</p>
            <h2 className="mt-2 font-display text-3xl font-bold text-frost-900">{mode === 'login' ? 'Bienvenido de vuelta' : 'Crea tu cuenta'}</h2>
            <p className="mt-2 text-sm leading-6 text-frost-500">{mode === 'login' ? 'Ingresa para continuar con tu operación.' : 'Las cuentas nuevas comienzan como Cliente.'}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && <label className="block"><span className="mb-1.5 block text-sm font-medium text-frost-700">Nombre completo</span><div className="relative"><UserRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-frost-400" /><input className="input-field pl-10" value={fullName} onChange={(event) => setFullName(event.target.value)} required placeholder="Ej. Ana Torres" /></div></label>}
            <label className="block"><span className="mb-1.5 block text-sm font-medium text-frost-700">Correo electrónico</span><div className="relative"><Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-frost-400" /><input type="email" className="input-field pl-10" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="nombre@empresa.com" /></div></label>
            <label className="block"><span className="mb-1.5 block text-sm font-medium text-frost-700">Contraseña</span><div className="relative"><LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-frost-400" /><input type={showPassword ? 'text' : 'password'} className="input-field px-10" value={password} onChange={(event) => setPassword(event.target.value)} minLength={6} required placeholder="Mínimo 6 caracteres" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-frost-400 hover:text-frost-700" aria-label="Mostrar contraseña">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></label>
            {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
            {message && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}
            <button disabled={loading} className="btn-primary w-full justify-center py-3">{loading ? 'Procesando...' : mode === 'login' ? 'Ingresar al sistema' : 'Crear cuenta'}<ArrowRight className="h-4 w-4" /></button>
          </form>

          {mode === 'login' && (
            <div className="mt-6">
              <div className="mb-3 flex items-center gap-3">
                <div className="h-px flex-1 bg-frost-200" />
                <span className="text-xs font-semibold uppercase tracking-wide text-frost-400">Acceso rápido demo</span>
                <div className="h-px flex-1 bg-frost-200" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_ACCESS.map((qa) => (
                  <button
                    key={qa.role}
                    onClick={() => quickAccess(qa.email)}
                    disabled={loading}
                    className="group flex items-center gap-2 rounded-xl border border-frost-200 bg-white p-3 text-left transition-all hover:border-ice-300 hover:shadow-md disabled:opacity-50"
                  >
                    <span className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${qa.color} text-white`}>
                      <Zap className="h-4 w-4" />
                    </span>
                    <span className="text-xs font-semibold text-frost-700">{qa.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setMessage(''); }} className="mt-6 w-full text-center text-sm font-medium text-ice-700 hover:text-ice-900">{mode === 'login' ? '¿Aún no tienes una cuenta? Regístrate' : 'Ya tengo una cuenta. Iniciar sesión'}</button>
        </section>
      </div>
    </main>
  );
}

import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import {
  LayoutDashboard,
  Pill,
  ShoppingCart,
  Package,
  FileText,
  LogOut,
  UserCircle,
} from 'lucide-react';
import { cn } from './ui/utils';
import { useAuth } from '../lib/authContext';
import { logout } from '../lib/auth';

const menuItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/medicines', label: 'Obat', icon: Pill },
  { path: '/transactions', label: 'Transaksi', icon: ShoppingCart },
  { path: '/stock', label: 'Stok', icon: Package },
  { path: '/reports', label: 'Laporan', icon: FileText },
];

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-700 text-white">
            <Pill className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold tracking-tight text-slate-900">Apotek Sehat</h1>
            <p className="mt-0.5 truncate text-xs text-slate-500">Sistem Informasi Apotek</p>
          </div>
        </div>

        <nav aria-label="Navigasi utama" className="flex-1 space-y-1 px-3 py-6">
          <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Menu utama
          </p>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'group flex items-center gap-3 rounded-lg border-l-2 px-3 py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2',
                  isActive
                    ? 'border-blue-700 bg-blue-50/80 font-semibold text-blue-800'
                    : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                <Icon className={cn(
                  'h-[18px] w-[18px] shrink-0',
                  isActive ? 'text-blue-700' : 'text-slate-400 group-hover:text-slate-600'
                )} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-100 p-3">
          <div className="mb-2 flex items-center gap-3 rounded-lg px-2 py-2">
            <UserCircle className="h-9 w-9 shrink-0 text-slate-400" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-800">{user?.name}</p>
              <p className="mt-0.5 text-xs text-slate-500">
                {user?.role === 'admin' ? 'Administrator' : user?.role === 'kasir' ? 'Kasir' : user?.role}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-600 transition-colors hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            <LogOut className="h-[18px] w-[18px]" />
            Keluar
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="p-5 sm:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

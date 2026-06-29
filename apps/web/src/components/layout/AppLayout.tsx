import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth';
import { LogoIcon, DashboardIcon, DatabaseIcon, HistoryIcon, SettingsIcon, LogoutIcon } from '../ui/Icons';
import Toast from '../ui/Toast';

const navItems = [
  { to: '/dashboard', label: 'Visao geral', icon: DashboardIcon },
  { to: '/databases', label: 'Meus bancos', icon: DatabaseIcon },
  { to: '/history', label: 'Historico', icon: HistoryIcon },
  { to: '/settings', label: 'Configuracoes', icon: SettingsIcon },
];

export default function AppLayout() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-sv-page">
      <Toast />
      {/* Sidebar */}
      <nav className="w-[224px] bg-sv-surface border-r border-sv-border flex flex-col flex-shrink-0">
        <div className="px-4 py-[18px] border-b border-sv-border">
          <div className="flex items-center gap-[9px]">
            <div className="w-7 h-7 bg-sv-accent rounded-sv flex items-center justify-center flex-shrink-0 text-sv-accent-text">
              <LogoIcon size={15} />
            </div>
            <span className="text-[15px] font-bold text-sv-text" style={{ letterSpacing: '-0.4px' }}>
              snapvault
            </span>
          </div>
        </div>

        <div className="px-2 py-2.5 flex-1 flex flex-col gap-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-sv text-[13px] select-none transition-colors ${
                  isActive
                    ? 'font-semibold'
                    : 'font-normal text-sv-secondary hover:text-sv-text hover:bg-[rgba(0,0,0,0.025)]'
                }`
              }
              style={({ isActive }) =>
                isActive
                  ? { background: 'rgba(184,242,65,0.13)', color: '#3D5C00' }
                  : {}
              }
            >
              <item.icon />
              {item.label}
            </NavLink>
          ))}
        </div>

        <div className="px-4 py-3 border-t border-sv-border flex items-center gap-2.5">
          <div className="w-[30px] h-[30px] bg-sv-border rounded-full flex items-center justify-center text-[12px] font-semibold text-sv-secondary flex-shrink-0">
            {user?.name?.charAt(0) || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-medium text-sv-text truncate">
              {user?.name || 'Andre Oliveira'}
            </div>
            <div className="text-[11px] text-sv-secondary font-mono">
              Plano {user?.plan || 'Pro'}
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sair"
            className="bg-transparent border-none text-sv-hint p-1 flex-shrink-0 hover:text-sv-secondary transition-colors"
          >
            <LogoutIcon />
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto min-w-0 flex flex-col">
        <Outlet />
      </div>
    </div>
  );
}

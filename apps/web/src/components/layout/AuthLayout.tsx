import { Outlet } from 'react-router-dom';
import { LogoIcon } from '../ui/Icons';
import Toast from '../ui/Toast';

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-sv-page px-6">
      <Toast />
      <div className="flex items-center gap-2.5 mb-10">
        <div className="w-[34px] h-[34px] bg-sv-accent rounded-sv flex items-center justify-center flex-shrink-0 text-sv-accent-text">
          <LogoIcon size={18} />
        </div>
        <span className="text-[18px] font-bold text-sv-text" style={{ letterSpacing: '-0.5px' }}>
          snapvault
        </span>
      </div>
      <Outlet />
    </div>
  );
}

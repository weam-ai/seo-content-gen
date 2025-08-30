import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';
import { Logo } from '../ui/logo';
import { MainNavigation } from '../ui/main-navigation';
import { User } from 'lucide-react';

export function Header() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  return (
    <header className="border-b border-border/40 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Logo onClick={() => navigate('/projects')} />
            <MainNavigation />
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4" />
                  <span>{user.firstname} {user.lastname}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

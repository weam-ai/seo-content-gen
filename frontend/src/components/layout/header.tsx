import { useNavigate } from 'react-router-dom';
import { Logo } from '../ui/logo';
import { MainNavigation } from '../ui/main-navigation';

export function Header() {
  const navigate = useNavigate();

  return (
    <header className="border-b border-border/40 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Logo onClick={() => navigate('/projects')} />
            <MainNavigation />
          </div>
        </div>
      </div>
    </header>
  );
}

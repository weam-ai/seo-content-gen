import { useNavigate } from 'react-router-dom';
import { Logo } from '../ui/logo';
import { MainNavigation } from '../ui/main-navigation';
import { Button } from '../ui/button';
import { ArrowLeft } from 'lucide-react';

export function Header() {
  const navigate = useNavigate();

  const handleBackToParent = () => {
    const frontendUrl = import.meta.env.VITE_FRONTEND_URL;
    const cleanUrl = frontendUrl.replace(/\/$/, '');
    const parentUrl = cleanUrl.substring(0, cleanUrl.lastIndexOf('/'));
    window.location.href = parentUrl;
  };

  return (
    <header className="border-b border-border/40 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Logo onClick={() => navigate('/projects')} />
            <MainNavigation />
          </div>
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToParent}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Weam
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

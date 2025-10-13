import { Outlet } from 'react-router-dom';
import { Header } from './header';
import { Toaster } from '@/components/ui/toaster';

interface MainLayoutProps {
  children?: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen" style={{
      background: `
        radial-gradient(circle at 20% 80%, hsl(var(--razor-primary) / 0.03) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, hsl(var(--razor-secondary) / 0.03) 0%, transparent 50%)
      `,
    }}>
      <Header />
      
      <div className="flex">
        {/* Main content */}
        <main className="flex-1 md:px-6 px-2 bg-gradient-to-br from-background via-background to-muted/20 razor-mesh">
          {children || <Outlet />}
        </main>
      </div>

      <Toaster />
    </div>
  );
}

import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  FolderOpen,
  FileText,
  Settings,
  Brain,
  Layers,
  ChevronDown,
} from 'lucide-react';
// Removed permission hooks - single user application has full access

const mainNavItems = [
  { name: 'Projects', href: '/projects', icon: FolderOpen },
  { name: 'Articles', href: '/articles', icon: FileText },
];

const setupNavItems = [
  {
    category: 'Content & Guidelines',
    items: [
      {
        name: 'Industry Guidelines',
        href: '/setup/industry-guidelines',
        icon: Layers,
      },
      { name: 'System Prompts', href: '/setup/system-prompts', icon: Brain },
      { name: 'Article Types', href: '/setup/article-types', icon: FileText },
    ],
  },
];

export function MainNavigation() {
  const location = useLocation();
  const pathname = location.pathname;
  // Single user application - all features accessible
  const canViewIndustryGuidelines = true;
  const canViewSystemPrompts = true;

  const isActive = (href: string) => {
    return pathname.startsWith(href);
  };

  const isSetupActive = () => {
    return pathname.startsWith('/setup');
  };

  // Calculate all visible setup items
  const allVisibleSetupItems = setupNavItems.flatMap((category) =>
    category.items.filter((item) => {
      if (item.name === 'Industry Guidelines') {
        return canViewIndustryGuidelines;
      }
      if (item.name === 'System Prompts') {
        return canViewSystemPrompts;
      }
      if (item.name === 'Article Types') {
        return canViewSystemPrompts;
      }
      return true;
    })
  );

  return (
    <nav className="flex items-center space-x-2">
      {/* Main Navigation Items */}
      {mainNavItems.map((item) => (
          <Link key={item.name} to={item.href}>
            <div
              className={cn(
                'px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-gray-100',
                isActive(item.href)
                  ? 'bg-black text-white hover:text-white hover:bg-black'
                  : ''
              )}
            >
              {item.name}
            </div>
          </Link>
        ))}

      {/* Setup Dropdown */}
      {allVisibleSetupItems.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'gap-2 px-3 py-2 rounded-lg transition-all duration-200 hover:bg-gray-100',
                isSetupActive()
                  ? 'bg-black text-white hover:text-white hover:bg-black'
                  : 'text-muted-foreground'
              )}
            >
              <Settings className="h-4 w-4" />
              Setup
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {setupNavItems.map((category, categoryIndex) => {
              const visibleItems = category.items.filter((item) => {
                if (item.name === 'Industry Guidelines') {
                  return canViewIndustryGuidelines;
                }
                if (item.name === 'System Prompts') {
                  return canViewSystemPrompts;
                }
                if (item.name === 'Article Types') {
                  return canViewSystemPrompts;
                }
                return true;
              });
              if (visibleItems.length === 0) return null;
              return (
                <div key={category.category}>
                  <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
                    {category.category}
                  </DropdownMenuLabel>
                  {visibleItems.map((item) => (
                    <Link key={item.name} to={item.href}>
                      <DropdownMenuItem
                        className={cn(
                          'gap-2 cursor-pointer',
                          isActive(item.href)
                            ? 'bg-gray-100'
                            : ''
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.name}
                      </DropdownMenuItem>
                    </Link>
                  ))}
                  {categoryIndex < setupNavItems.length - 1 && (
                    <DropdownMenuSeparator />
                  )}
                </div>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </nav>
  );
}

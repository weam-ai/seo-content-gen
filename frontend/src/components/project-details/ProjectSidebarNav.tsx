import {
  Eye,
  Target,
  FileText,
  CheckCircle,
  Globe,
} from 'lucide-react';

const navigationItems = [
  {
    id: 'overview',
    label: 'Overview',
    icon: Eye,
    description: 'Project summary and details',
  },
  {
    id: 'keywords',
    label: 'Keywords',
    icon: Target,
    description: 'SEO keywords and targeting',
  },

  {
    id: 'content',
    label: 'Content',
    icon: FileText,
    description: 'Content pieces and drafts',
  },
  {
    id: 'audit',
    label: 'Site Audit',
    icon: CheckCircle,
    description: 'Technical SEO analysis',
  },
  {
    id: 'sitemap',
    label: 'Sitemap',
    icon: Globe,
    description: 'Website sitemap analysis',
  },
];

interface ProjectSidebarNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function ProjectSidebarNav({
  activeTab,
  setActiveTab,
}: ProjectSidebarNavProps) {
  return (
    <div className="w-64 min-w-64 bg-background/50 backdrop-blur-sm border-r border-border/40 h-[calc(100vh-73px)] sticky top-[73px] overflow-y-auto">
      <div className="p-4">
        <div className="space-y-1">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg transition-all hover-lift ${
                activeTab === item.id
                  ? 'bg-[hsl(var(--razor-primary))] text-white shadow-sm'
                  : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
              }`}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{item.label}</div>
                {activeTab !== item.id && (
                  <div className="text-xs opacity-70 truncate">
                    {item.description}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

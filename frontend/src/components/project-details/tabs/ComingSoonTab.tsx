import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, BarChart3, Sparkles, Settings, Info } from 'lucide-react';

interface ComingSoonTabProps {
  activeTab: string;
}

export default function ComingSoonTab({ activeTab }: ComingSoonTabProps) {
  const tabDetails: {
    [key: string]: {
      icon: React.ElementType;
      title: string;
      description: string;
    };
  } = {
    content: {
      icon: FileText,
      title: 'Content Hub Coming Soon!',
      description:
        'Manage all your content pieces, drafts, and published articles in one place',
    },
    analytics: {
      icon: BarChart3,
      title: 'Analytics Dashboard Coming Soon!',
      description:
        'Track performance, engagement, and SEO metrics for your content',
    },
    recommendations: {
      icon: Sparkles,
      title: 'AI Recommendations Coming Soon!',
      description: 'AI-powered suggestions to improve your content strategy',
    },
    settings: {
      icon: Settings,
      title: 'Project Settings Coming Soon!',
      description: 'Configure project settings and preferences',
    },
  };

  const currentTab = tabDetails[activeTab];

  if (!currentTab) {
    return null;
  }

  const Icon = currentTab.icon;

  return (
    <Card className="hover-lift">
      <CardContent className="p-12">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-[hsl(var(--razor-primary))] to-[hsl(var(--razor-secondary))] flex items-center justify-center subtle-float">
            <Icon className="h-12 w-12 text-white" />
          </div>
          <h3 className="text-2xl font-bold mb-3">{currentTab.title}</h3>
          <p className="text-muted-foreground text-lg mb-6 max-w-md mx-auto">
            {currentTab.description}
          </p>
          <Button variant="outline" className="hover-lift">
            <Info className="h-4 w-4 mr-2" />
            Get Notified When Ready
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

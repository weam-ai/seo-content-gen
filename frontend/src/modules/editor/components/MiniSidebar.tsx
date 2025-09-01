import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  CheckSquare,
  Clock,
  Settings,
  Share2,
  Info,
  History,
} from 'lucide-react';
import { SidebarSection } from '../types';
import useEditor from '../hooks/useEditor';

const sidebarItems = [
  { id: 'checklist' as const, icon: CheckSquare, label: 'Document Checker' },

  { id: 'time' as const, icon: Clock, label: 'Time & History' },
  { id: 'versions' as const, icon: History, label: 'Version History' },
  { id: 'extras' as const, icon: Info, label: 'Extra Information' },
  { id: 'settings' as const, icon: Settings, label: 'Settings' },
  { id: 'share' as const, icon: Share2, label: 'Share' },
];

export const MiniSidebar: React.FC = () => {
  const { rightSidebarSection, toggleRightSidebar } = useEditor();

  const activeSection = rightSidebarSection;

  const handleSectionClick = (sectionId: SidebarSection) => {
    toggleRightSidebar(sectionId);
  };

  return (
    <TooltipProvider>
      <div className="w-12 bg-muted/30 border-l flex flex-col items-center py-4 gap-2">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;

          return (
            <Tooltip key={item.id}>
              <TooltipTrigger asChild>
                <Button
                  variant={isActive ? 'default' : 'ghost'}
                  size="sm"
                  className="w-8 h-8 p-0"
                  onClick={() => handleSectionClick(item.id)}
                >
                  <Icon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>{item.label}</p>
              </TooltipContent>
            </Tooltip>
          );
         })}
       </div>
    </TooltipProvider>
  );
};

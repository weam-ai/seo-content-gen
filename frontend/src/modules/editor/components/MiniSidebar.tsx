import React from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverTrigger } from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  User,
  CheckSquare,
  Clock,
  Settings,
  Share2,
  Award,
  Info,
  History,
} from 'lucide-react';
import { SidebarSection } from '../types';
import useEditor from '../hooks/useEditor';

import { useAuthStore } from '@/stores/auth-store';

const sidebarItems = [
  { id: 'profile' as const, icon: User, label: 'Profile' },
  { id: 'checklist' as const, icon: CheckSquare, label: 'Document Checker' },
  { id: 'eeat' as const, icon: Award, label: 'EEAT Analysis' },
  { id: 'time' as const, icon: Clock, label: 'Time & History' },
  { id: 'versions' as const, icon: History, label: 'Version History' },
  { id: 'extras' as const, icon: Info, label: 'Extra Information' },
  { id: 'settings' as const, icon: Settings, label: 'Settings' },
  { id: 'share' as const, icon: Share2, label: 'Share' },
];

export const MiniSidebar: React.FC = () => {
  const { rightSidebarSection, toggleRightSidebar } = useEditor();
  const { user } = useAuthStore();

  const activeSection = rightSidebarSection;

  const getInitials = (firstname: string, lastname: string) => {
    return `${firstname.charAt(0)}${lastname.charAt(0)}`.toUpperCase();
  };

  const handleSectionClick = (sectionId: SidebarSection) => {
    if (sectionId !== 'profile') {
      toggleRightSidebar(sectionId);
    }
  };

  return (
    <TooltipProvider>
      <div className="w-12 bg-muted/30 border-l flex flex-col items-center py-4 gap-2">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id && item.id !== 'profile';

          if (item.id === 'profile') {
            return (
              <Popover key={item.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                      <div className="w-6 h-6 cursor-pointer">
                        <Avatar className="w-6 h-6">
                          <AvatarImage
                            src={user?.profile_image || '/placeholder-user.jpg'}
                            alt={
                              user
                                ? `${user.firstname} ${user.lastname}`
                                : 'User'
                            }
                          />
                          <AvatarFallback className="text-xs">
                            {user
                              ? getInitials(user.firstname, user.lastname)
                              : 'U'}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </PopoverTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    <p>{item.label}</p>
                  </TooltipContent>
                </Tooltip>

              </Popover>
            );
          }

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

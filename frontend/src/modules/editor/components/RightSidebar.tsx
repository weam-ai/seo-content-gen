import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SidebarSection } from '../types';
import useEditor from '../hooks/useEditor';
import { ChecklistSection } from './sections/ChecklistSection';
import { TimeSection } from './sections/TimeSection';
import { SettingsSection } from './sections/SettingsSection';
import { ShareSection } from './sections/ShareSection';
import { EEATSection } from './sections/EEATSection';
import { ExtrasSection } from './sections/ExtrasSection';
import { VersionHistorySection } from './sections/VersionHistorySection';

import { withResizableSidebar } from './hoc/withResizableSidebar';

const getSectionTitle = (section: SidebarSection): string => {
  switch (section) {
    case 'checklist':
      return 'Document Checks';

    case 'eeat':
      return 'EEAT Analysis';
    case 'time':
      return 'Time & History';
    case 'versions':
      return 'Version History';
    case 'extras':
      return 'Extra Information';
    case 'settings':
      return 'Settings';
    case 'share':
      return 'Share';
    default:
      return '';
  }
};

/**
 * Clean RightSidebar component without resize functionality
 * The resize functionality is added via the withResizableSidebar HOC
 */
const RightSidebarCore: React.FC = () => {
  const { rightSidebarSection, toggleRightSidebar, article } = useEditor();

  const activeSection = rightSidebarSection;
  const onClose = () => toggleRightSidebar(null);

  return (
    <>
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="font-semibold text-lg">
          {getSectionTitle(activeSection)}
        </h2>
        <Button variant="ghost" size="sm" onClick={onClose} className="p-1">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content - keep all sections mounted; toggle visibility to preserve state */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div
          className={activeSection === 'checklist' ? 'block h-full' : 'hidden'}
        >
          <ChecklistSection />
        </div>

        {/* Mount EEAT only once article is available; then keep it mounted */}
        {article ? (
          <div className={activeSection === 'eeat' ? 'block h-full' : 'hidden'}>
            <EEATSection />
          </div>
        ) : null}
        <div className={activeSection === 'time' ? 'block h-full' : 'hidden'}>
          <TimeSection />
        </div>
        <div className={activeSection === 'versions' ? 'block' : 'hidden'}>
          <VersionHistorySection />
        </div>
        <div className={activeSection === 'extras' ? 'block h-full' : 'hidden'}>
          <ExtrasSection />
        </div>
        <div
          className={activeSection === 'settings' ? 'block h-full' : 'hidden'}
        >
          <SettingsSection />
        </div>
        <div className={activeSection === 'share' ? 'block h-full' : 'hidden'}>
          <ShareSection />
        </div>
      </div>
    </>
  );
};

// Create the resizable version using the HOC
const ResizableRightSidebar = withResizableSidebar(RightSidebarCore, {
  minWidth: 280,
  maxWidth: 600,
  defaultWidth: 320,
  storageKey: 'rightSidebarWidth',
  handlePosition: 'left',
  enableKeyboardShortcuts: true,
  keyboardStep: 20,
  maxViewportPercentage: 0.4,
});

// Main component that handles the open/close state
export const RightSidebar: React.FC = () => {
  const { rightSidebarSection } = useEditor();

  return (
    <ResizableRightSidebar
      isOpen={!!rightSidebarSection}
      className="bg-background border-l"
    />
  );
};

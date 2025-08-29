import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { EditorProvider } from '../context/EditorContext';
import { CommentProvider } from '../context/CommentContext';
import useEditor from '../hooks/useEditor';
import { LeftSidebar } from './LeftSidebar';
import { EditorContent } from './EditorContent';
import { RightSidebar } from './RightSidebar';
import { MiniSidebar } from './MiniSidebar';
import { FocusModeExitButton } from './FocusModeExitButton';

const EditorLayout: React.FC = () => {
  const { leftSidebarOpen, settings, toggleLeftSidebar, updateSettings } =
    useEditor();

  // Handle fullscreen mode for focus mode
  useEffect(() => {
    if (settings.focusMode) {
      // Enter fullscreen
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {
          // Fallback if fullscreen fails
          console.warn('Could not enter fullscreen mode');
        });
      }
    } else {
      // Exit fullscreen
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {
          console.warn('Could not exit fullscreen mode');
        });
      }
    }

    // Cleanup function to exit fullscreen when component unmounts
    return () => {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {
          console.warn('Could not exit fullscreen mode');
        });
      }
    };
  }, [settings.focusMode]);

  // Handle fullscreen change events (when user presses ESC or exits fullscreen)
  useEffect(() => {
    const handleFullscreenChange = () => {
      // If we're in focus mode but no longer in fullscreen, disable focus mode
      if (settings.focusMode && !document.fullscreenElement) {
        updateSettings({ focusMode: false });
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () =>
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [settings.focusMode, updateSettings]);

  if (settings.focusMode) {
    return (
      <div
        className={`h-screen flex ${settings.theme === 'dark' ? 'dark' : ''}`}
      >
        {/* Focus Mode - Editor Content with Chat */}
        <div className="flex-1 flex">
          <EditorContent />

          {/* Right Sidebar - Only Chat in Focus Mode */}
          <RightSidebar />

          <FocusModeExitButton
            onExit={() => updateSettings({ focusMode: false })}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`h-screen flex ${settings.theme === 'dark' ? 'dark' : ''}`}>
      {/* Left Sidebar */}
      <LeftSidebar isOpen={leftSidebarOpen} onToggle={toggleLeftSidebar} />

      {/* Main Editor Area */}
      <div className="flex-1 flex">
        <EditorContent />

        {/* Right Sidebar - Between Editor and Mini Sidebar */}
        <RightSidebar />

        {/* Mini Sidebar */}
        <MiniSidebar />
      </div>
    </div>
  );
};

const Editor: React.FC = () => {
  const { articleId } = useParams<{ articleId: string }>();

  return (
    <EditorProvider articleId={articleId}>
      <CommentProvider>
        <EditorLayout />
      </CommentProvider>
    </EditorProvider>
  );
};

export default Editor;

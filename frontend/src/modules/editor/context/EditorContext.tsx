import React, {
  createContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
} from 'react';
import { SidebarSection, EditorSettings } from '../types';
import { useTheme } from '@/components/theme-provider';
import { Article } from '@/lib/types';
import {
  startTimeTracking as apiStartTimeTracking,
  stopTimeTracking as apiStopTimeTracking,
  getTimeTrackingStatus,
} from '@/lib/services/time-tracking.service';
import { getArticleDetail } from '@/lib/services/topics.service';

import { toast } from 'sonner';

interface EditorContextType {
  leftSidebarOpen: boolean;
  rightSidebarSection: SidebarSection;
  settings: EditorSettings;
  // Editor reference
  editorRef: React.MutableRefObject<any> | null;
  // Article state
  article: Article | null;
  isLoadingArticle: boolean;
  articleError: string | null;
  // Save status state
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  saveError: string | null;
  // Time tracking state
  isTimeTracking: boolean;
  totalTimeSeconds: number;
  isLoading: boolean;
  error: string | null;
  // Preview mode state
  isPreviewMode: boolean;
  previewVersion: string | null;
  // Programmatic content change flag
  toggleLeftSidebar: () => void;
  toggleRightSidebar: (section: SidebarSection) => void;
  updateSettings: (settings: Partial<EditorSettings>) => void;
  // Editor methods
  setEditorRef: (ref: React.MutableRefObject<any>) => void;
  // Article methods
  loadArticle: (articleId: string) => Promise<void>;
  // Save methods
  setSaveStatus: (
    status: 'idle' | 'saving' | 'saved' | 'error',
    error?: string
  ) => void;
  // Time tracking methods
  startTimeTracking: (articleId: string) => Promise<void>;
  pauseTimeTracking: (articleId: string) => Promise<void>;
  // Preview mode methods
  setPreviewMode: (isPreview: boolean, version?: string) => void;
  resetTimeTracking: () => void;
  loadTimeTrackingStatus: (articleId: string) => Promise<void>;
}

export const EditorContext = createContext<EditorContextType | undefined>(
  undefined
);

interface EditorProviderProps {
  children: ReactNode;
  articleId?: string;
}

export const EditorProvider: React.FC<EditorProviderProps> = ({
  children,
  articleId,
}) => {
  const { setTheme: setAppTheme } = useTheme();
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [rightSidebarSection, setRightSidebarSection] =
    useState<SidebarSection>(null);
  const [settings, setSettings] = useState<EditorSettings>({
    theme: 'light',
    focusMode: true,
    typography: {
      fontFamily: 'Inter',
      fontSize: 16,
      lineHeight: 1.6,
      blockSpacing: 1.25,
    },
    ai: {
      model: 'gpt-4',
      temperature: 0.7,
      documentLanguage: 'en',
      tone: 'professional',
    },
  });

  // Editor reference
  const [editorRef, setEditorRefState] =
    useState<React.MutableRefObject<any> | null>(null);

  // Article state
  const [article, setArticle] = useState<Article | null>(null);
  const [isLoadingArticle, setIsLoadingArticle] = useState(false);
  const [articleError, setArticleError] = useState<string | null>(null);

  // Save status state
  const [saveStatus, setSaveStatusState] = useState<
    'idle' | 'saving' | 'saved' | 'error'
  >('idle');
  const [saveError, setSaveError] = useState<string | null>(null);

  // Time tracking state
  const [isTimeTracking, setIsTimeTracking] = useState(false);
  const [totalTimeSeconds, setTotalTimeSeconds] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);

  // Preview mode state
  const [isPreviewMode, setIsPreviewModeState] = useState(false);
  const [previewVersion, setPreviewVersionState] = useState<string | null>(
    null
  );

  const toggleLeftSidebar = useCallback(() => {
    setLeftSidebarOpen((prev) => !prev);
  }, []);

  const toggleRightSidebar = useCallback((section: SidebarSection) => {
    setRightSidebarSection((prev) => (prev === section ? null : section));
  }, []);

  const updateSettings = useCallback((newSettings: Partial<EditorSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  const setEditorRef = useCallback((ref: React.MutableRefObject<any>) => {
    setEditorRefState(ref);
  }, []);

  // Load article details from API
  const loadArticle = useCallback(async (articleId: string) => {
    if (!articleId) return;

    try {
      setIsLoadingArticle(true);
      setArticleError(null);
      const articleData = await getArticleDetail(articleId);
      setArticle(articleData);

      // If server provides settings, merge them into editor settings
      if (articleData && articleData.settings) {
        const defaultSettings: EditorSettings = {
          theme: 'light',
          focusMode: false,
          typography: {
            fontFamily: 'Inter',
            fontSize: 16,
            lineHeight: 1.6,
            blockSpacing: 1.25,
          },
          ai: {
            model: 'gpt-4',
            temperature: 0.7,
            documentLanguage: 'en',
            tone: 'professional',
          },
        };

        const apiSettings = articleData.settings as EditorSettings;
        const mergedSettings: EditorSettings = {
          ...defaultSettings,
          ...apiSettings,
        };
        setSettings(mergedSettings);
        // Mirror theme from merged settings to app theme/localStorage
        if (
          mergedSettings.theme === 'light' ||
          mergedSettings.theme === 'dark'
        ) {
          setAppTheme(mergedSettings.theme);
        }
      }
    } catch (err: any) {
      setArticleError(err.message);
      console.error('Failed to load article details:', err);
    } finally {
      setIsLoadingArticle(false);
    }
  }, []);

  // Load time tracking status from API
  const loadTimeTrackingStatus = useCallback(async (articleId: string) => {
    if (!articleId) return;

    try {
      setIsLoading(true);
      setError(null);
      const status = await getTimeTrackingStatus(articleId);

      setIsTimeTracking(status.status === 'running');
      setTotalTimeSeconds(status.totalDuration);

      if (status.status === 'running') {
        setStartTime(new Date());
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load time tracking status';
      setError(errorMessage);
      console.error('Failed to load time tracking status:', err);

      // Show toast notification for API error
      toast.error(`Timer Status Error : ` + errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Time tracking methods
  const startTimeTracking = useCallback(async (articleId: string) => {
    if (!articleId) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await apiStartTimeTracking(articleId);

      if (response.status) {
        setIsTimeTracking(true);
        setStartTime(new Date());
        // Don't reset totalTimeSeconds here - it should continue from current value
      } else {
        throw new Error(response.message || 'Failed to start time tracking');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to start time tracking';
      setError(errorMessage);
      console.error('Failed to start time tracking:', err);

      // Show toast notification for API error
      toast.error(`Timer Status Error : ` + errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const pauseTimeTracking = useCallback(async (articleId: string) => {
    if (!articleId) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await apiStopTimeTracking(articleId);

      if (response.status) {
        setIsTimeTracking(false);
        setStartTime(null);
        // Keep totalTimeSeconds as is - it represents the total tracked time
      } else {
        throw new Error(response.message || 'Failed to stop time tracking');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to stop time tracking';
      setError(errorMessage);
      console.error('Failed to stop time tracking:', err);

      // Show toast notification for API error
      toast.error(`Timer Status Error : ` + errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetTimeTracking = useCallback(() => {
    setIsTimeTracking(false);
    setTotalTimeSeconds(0);
    setStartTime(null);
    setError(null);
  }, []);

  // Preview mode methods
  const setPreviewMode = useCallback((isPreview: boolean, version?: string) => {
    setIsPreviewModeState(isPreview);
    setPreviewVersionState(version || null);
  }, []);

  // Save status methods
  const setSaveStatus = useCallback(
    (status: 'idle' | 'saving' | 'saved' | 'error', error?: string) => {
      setSaveStatusState(status);
      setSaveError(error || null);

      // Auto-reset 'saved' status after 2 seconds
      if (status === 'saved') {
        setTimeout(() => {
          setSaveStatusState('idle');
        }, 2000);
      }
    },
    []
  );



  // Timer effect - only increment local counter when tracking is active
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isTimeTracking && startTime) {
      interval = setInterval(() => {
        setTotalTimeSeconds((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimeTracking, startTime]);

  // Load initial data when articleId changes
  useEffect(() => {
    if (articleId) {
      loadArticle(articleId);
      loadTimeTrackingStatus(articleId);
    }
  }, [articleId, loadArticle, loadTimeTrackingStatus]);

  return (
    <EditorContext.Provider
      value={{
        leftSidebarOpen,
        rightSidebarSection,
        settings,
        editorRef,
        article,
        isLoadingArticle,
        articleError,
        saveStatus,
        saveError,
        isTimeTracking,
        totalTimeSeconds,
        isLoading,
        error,
        toggleLeftSidebar,
        toggleRightSidebar,
        updateSettings,
        setEditorRef,
        loadArticle,
        setSaveStatus,
        startTimeTracking,
        pauseTimeTracking,
        resetTimeTracking,
        loadTimeTrackingStatus,
        isPreviewMode,
        previewVersion,
        setPreviewMode,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
};

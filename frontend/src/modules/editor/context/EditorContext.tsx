import React, {
  createContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { SidebarSection, EditorSettings } from '../types';
import { useTheme } from '@/components/theme-provider';
import { Article } from '@/lib/types';
// Time tracking services removed for single-user application
import { getArticleDetail } from '@/lib/services/topics.service';

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
  // Time tracking removed for single-user application
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
  // Time tracking methods removed for single-user application
  // Preview mode methods
  setPreviewMode: (isPreview: boolean, version?: string) => void;
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

  // Time tracking state removed for single-user application

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

  // Time tracking methods removed for single-user application

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
        toggleLeftSidebar,
        toggleRightSidebar,
        updateSettings,
        setEditorRef,
        loadArticle,
        setSaveStatus,
        isPreviewMode,
        previewVersion,
        setPreviewMode,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
};

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from '@/components/ui/sonner';

import PrivateRoute from '@/components/PrivateRoute';
import { useEffect } from 'react';
import { useSessionStore } from '@/lib/store/session-store';
// Removed PERMISSIONS import - not needed in single-user application

// Removed auth pages - single user application

// Main Pages
import Projects from '@/pages/projects/ProjectListPage';
import ProjectDetail from '@/pages/projects/ProjectDetail.tsx';
import ProjectEdit from '@/pages/projects/projectEditPage';
import ProjectNew from '@/pages/projects/ProjectAddPage';
import Articles from '@/pages/articles/index.tsx';
import ArticleDetail from '@/pages/articles/ArticleDetail.tsx';
import ArticleAddPage from '@/pages/articles/ArticleAddPage';
import Topics from '@/pages/topics/TopicListPage';
import TopicDetail from '@/pages/topics/TopicDetail.tsx';
import TopicAddPage from '@/pages/topics/TopicAddPage';

// Setup Pages
import ArticleTypes from '@/pages/setup/article-types.tsx';
import SystemPrompts from '@/pages/setup/system-prompts.tsx';
import IndustryGuidelines from '@/pages/setup/industry-guidelines.tsx';
import NewIndustryGuidelinePage from '@/pages/setup/new-industry-guideline.tsx';
import NewSystemPromptPage from '@/pages/setup/new-system-prompt.tsx';
import NewArticleTypePage from '@/pages/setup/new-article-type.tsx';
import EditIndustryGuidelinePage from '@/pages/setup/edit-industry-guideline.tsx';
import EditSystemPromptPage from '@/pages/setup/edit-system-prompt.tsx';
import EditArticleTypePage from '@/pages/setup/edit-article-type.tsx';
// Settings
import Settings from '@/pages/settings/SettingsPage';
import { MainLayout } from './components/layout/main-layout';
import EditorPage from './pages/editor/EditorPage';

function App() {
  // Ensure session is initialized globally
  const { sessionId, initSession } = useSessionStore();
  useEffect(() => {
    if (!sessionId) {
      initSession();
    }
    // Set up interval to refresh session every 30 minutes
    const interval = setInterval(() => {
      initSession();
    }, 30 * 60 * 1000); // 30 minutes
    return () => clearInterval(interval);
  }, [sessionId, initSession]);

  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <Router>
          <div
            className="min-h-screen"
            style={{
              background: `
              radial-gradient(circle at 20% 80%, hsl(var(--razor-primary) / 0.03) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, hsl(var(--razor-secondary) / 0.03) 0%, transparent 50%)
            `,
            }}
          >
            <Routes>
              {/* All routes are now accessible - single user application */}
              <Route
                path="/"
                element={<MainLayout children={<PrivateRoute />} />}
              >
                <Route index element={<Navigate to="/projects" replace />} />

                {/* Projects - Single user has access to all */}
                <Route
                  path="projects"
                  element={<PrivateRoute />}
                >
                  <Route index element={<Projects />} />
                  <Route
                    path="new"
                    element={<PrivateRoute />}
                  >
                    <Route index element={<ProjectNew />} />
                  </Route>
                  <Route path=":id" element={<ProjectDetail />} />
                  <Route
                    path=":id/edit"
                    element={<PrivateRoute />}
                  >
                    <Route index element={<ProjectEdit />} />
                  </Route>
                </Route>

                {/* Articles - Single user has access to all */}
                <Route
                  path="articles"
                  element={<PrivateRoute />}
                >
                  <Route index element={<Articles />} />
                  <Route
                    path="new"
                    element={<PrivateRoute />}
                  >
                    <Route index element={<ArticleAddPage />} />
                  </Route>
                  <Route path=":id" element={<ArticleDetail />} />
                </Route>

                {/* Topics - Single user has access to all */}
                <Route
                  path="topics"
                  element={<PrivateRoute />}
                >
                  <Route index element={<Topics />} />
                  <Route
                    path="new"
                    element={<PrivateRoute />}
                  >
                    <Route index element={<TopicAddPage />} />
                  </Route>
                  <Route path=":id" element={<TopicDetail />} />
                </Route>

                {/* Settings */}
                <Route path="settings" element={<Settings />} />

                {/* Setup Routes - Single User Application */}
                <Route path="/setup" element={<PrivateRoute />}>
                  {/* Article Types */}
                  <Route
                    path="article-types"
                    element={<PrivateRoute />}
                  >
                    <Route index element={<ArticleTypes />} />
                    <Route
                      path="new"
                      element={<PrivateRoute />}
                    >
                      <Route index element={<NewArticleTypePage />} />
                    </Route>
                    <Route
                      path=":id/edit"
                      element={<PrivateRoute />}
                    >
                      <Route index element={<EditArticleTypePage />} />
                    </Route>
                  </Route>
                  {/* System Prompts */}
                  <Route
                    path="system-prompts"
                    element={<PrivateRoute />}
                  >
                    <Route index element={<SystemPrompts />} />
                    <Route
                      path="new"
                      element={<PrivateRoute />}
                    >
                      <Route index element={<NewSystemPromptPage />} />
                    </Route>
                    <Route
                      path=":id/edit"
                      element={<PrivateRoute />}
                    >
                      <Route index element={<EditSystemPromptPage />} />
                    </Route>
                  </Route>

                  {/* Industry Guidelines */}
                  <Route
                    path="industry-guidelines"
                    element={<PrivateRoute />}
                  >
                    <Route index element={<IndustryGuidelines />} />
                    <Route
                      path="new"
                      element={<PrivateRoute />}
                    >
                      <Route index element={<NewIndustryGuidelinePage />} />
                    </Route>
                    <Route
                      path=":id/edit"
                      element={<PrivateRoute />}
                    >
                      <Route index element={<EditIndustryGuidelinePage />} />
                    </Route>
                  </Route>
                </Route>
              </Route>

              {/* Editor Route - Outside of MainLayout */}
              <Route
                path="/article-editor/:articleId"
                element={<EditorPage />}
              />

              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/projects" replace />} />
            </Routes>
          </div>
          <Toaster />
          <SonnerToaster />
        </Router>
    </ThemeProvider>
  );
}

export default App;

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from '@/components/ui/sonner';

import { PrivateRoute } from '@/components/auth/private-route';
import { useEffect } from 'react';
import { useSessionStore } from '@/lib/store/session-store';

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
  useEffect(() => {
    if (window.location.pathname === "/") {
      window.location.replace("/seo-content-gen/");
    }
  }, []);
  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <Router basename="/seo-content-gen/">
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
              {/* Protected Routes */}
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <MainLayout />
                  </PrivateRoute>
                }
              >
                <Route index element={<Navigate to="/projects" replace />} />

                {/* Projects */}
                <Route path="projects">
                  <Route index element={<Projects />} />
                  <Route path="new" element={<ProjectNew />} />
                  <Route path=":id" element={<ProjectDetail />} />
                  <Route path=":id/edit" element={<ProjectEdit />} />
                </Route>

                {/* Articles */}
                <Route path="articles">
                  <Route index element={<Articles />} />
                  <Route path="new" element={<ArticleAddPage />} />
                  <Route path=":id" element={<ArticleDetail />} />
                </Route>

                {/* Topics */}
                <Route path="topics">
                  <Route index element={<Topics />} />
                  <Route path="new" element={<TopicAddPage />} />
                  <Route path=":id" element={<TopicDetail />} />
                </Route>

                {/* Settings */}
                <Route path="settings" element={<Settings />} />

                {/* Setup Routes */}
                <Route path="/setup">
                  {/* Article Types */}
                  <Route path="article-types">
                    <Route index element={<ArticleTypes />} />
                    <Route path="new" element={<NewArticleTypePage />} />
                    <Route path=":id/edit" element={<EditArticleTypePage />} />
                  </Route>
                  {/* System Prompts */}
                  <Route path="system-prompts">
                    <Route index element={<SystemPrompts />} />
                    <Route path="new" element={<NewSystemPromptPage />} />
                    <Route path=":id/edit" element={<EditSystemPromptPage />} />
                  </Route>
                  {/* Industry Guidelines */}
                  <Route path="industry-guidelines">
                    <Route index element={<IndustryGuidelines />} />
                    <Route path="new" element={<NewIndustryGuidelinePage />} />
                    <Route path=":id/edit" element={<EditIndustryGuidelinePage />} />
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

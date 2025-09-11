import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  getArticleDetail,
  getArticleTypes,
  ArticleTypeOption,
  getArticleAIContent,
  ArticleAIContent,
  getArticleEditorContent,
  ArticleEditorContent,
  updateArticle,
  generateArticleAIContent,
  selectArticleAIContent,
  generateOutline,
  getRecommendedKeywords,
} from '@/lib/services/topics.service';
import {
  ArrowLeft,
  Edit,
  FileText,
  RotateCcw,
  X,
  Loader2,
  Brain,
  Sparkles,
  Zap,
  BarChart3,
  Save,
  Copy,
  Clock,
  CheckCircle,
  XCircle,
  Download,
  FileDown,
  Globe,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from '@/components/ui/use-toast';
import type { Article } from '@/lib/types';
import ReactMarkdown from 'react-markdown';

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
  DialogTrigger,
} from '@/components/ui/dialog';
import TaskSidebar from '@/components/layout/TaskSidebar';
// Removed ManageTeamAssignmentModal and UserService for single-user application
// Removed useAuthStore import - not needed for single user application
// Removed hasPermission import - single user application has full access
// Removed ArticleAuditReport import - audit report functionality removed for single-user application

import { markdownToBlocks } from '@/lib/blocknote.util';
import ImplementMergeModal from '@/components/article/ImplementMergeModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import ArticlePublishModel from '@/components/article/ArticlePublishModel';

// Removed ArticleTimeTracker import for single-user application
import TextareaAutosize from 'react-textarea-autosize';
import RegenerateTitleModal from '@/components/topics/RegenerateTitleModal';
import { OutlineRequiredModal } from '@/components/ui/OutlineRequiredModal';
import SecondaryKeywordModal from '../topics/SecondaryKeywordModal';
import { useSessionStore } from '@/lib/store/session-store';

// Add a simple skeleton component
function AISkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-5 bg-muted rounded w-1/2" />
      <div className="h-4 bg-muted rounded w-full" />
      <div className="h-4 bg-muted rounded w-5/6" />
      <div className="h-4 bg-muted rounded w-2/3" />
      <div className="h-4 bg-muted rounded w-3/4" />
      <div className="h-4 bg-muted rounded w-1/2" />
    </div>
  );
}

// Add this utility function to count words in editor blocks
function countWordsInBlocks(blocks: any[]): number {
  if (!Array.isArray(blocks)) return 0;
  let wordCount = 0;
  for (const block of blocks) {
    if (block && Array.isArray(block.content)) {
      for (const node of block.content) {
        if (typeof node.text === 'string') {
          wordCount += node.text.trim().split(/\s+/).filter(Boolean).length;
        }
      }
    }
  }
  return wordCount;
}

export default function ArticleDetails() {
  const [showBusinessDetailsDialog, setShowBusinessDetailsDialog] =
    useState(false);
  const params = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const articleId = params.id as string;
  const sessionId = useSessionStore((state) => state.sessionId);
  const initSession = useSessionStore((state) => state.initSession);

  // Initialize session ID on component mount
  useEffect(() => {
    if (!sessionId) {
      initSession();
    }
  }, [sessionId, initSession]);
  const [articleType, setArticleType] = useState('');
  const [activeTab, setActiveTab] = useState('open_ai');

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newSecondaryKeyword, setNewSecondaryKeyword] = useState('');
  const [addingKeyword, setAddingKeyword] = useState(false);
  const [articleTypeLoading, setArticleTypeLoading] = useState(false);
  const [articleTypeOptions, setArticleTypeOptions] = useState<
    ArticleTypeOption[]
  >([]);
  const [aiContent, setAIContent] = useState<ArticleAIContent | null>(null);
  const [editorContent, setEditorContent] =
    useState<ArticleEditorContent | null>(null);

  // Add per-provider loading state
  const [regeneratingProviders, setRegeneratingProviders] = useState<{
    [key: string]: boolean;
  }>({});

  // Add state for outline editing
  const [isEditingOutline, setIsEditingOutline] = useState(false);
  const [outline, setOutline] = useState(article?.generated_outline || '');
  const [outlineLoading, setOutlineLoading] = useState(false);
  const [outlineError, setOutlineError] = useState<string | null>(null);

  // Topic-style interface states (for rejected/pending articles)
  const [isEditing, setIsEditing] = useState(false);
  const [generatingOutline, setGeneratingOutline] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState('');
  const [regenerateTitleModalOpen, setRegenerateTitleModalOpen] =
    useState(false);
  const [pendingArticleType, setPendingArticleType] = useState<string | null>(
    null
  );
  const [showOutlineDialog, setShowOutlineDialog] = useState(false);
  const [recommendedKeywords, setRecommendedKeywords] = useState<any[]>([]);
  const [recommendedLoading, setRecommendedLoading] = useState(false);
  const [showAddKeywordModal, setShowAddKeywordModal] = useState(false);

  const statusColors: Record<string, string> = {
    'not started': 'bg-gray-100 text-gray-800 border-gray-200',
    'in progress': 'bg-blue-100 text-blue-800 border-blue-200',
    'internal review': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'awaiting feedback': 'bg-orange-100 text-orange-800 border-orange-200',
    published: 'bg-green-100 text-green-800 border-green-200',
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    rejected: 'bg-red-100 text-red-800 border-red-200',
    'mark as rejected': 'bg-red-100 text-red-800 border-red-200',
    'mark as approved': 'bg-green-100 text-green-800 border-green-200',
    approved: 'bg-green-100 text-green-800 border-green-200',
    not_started: 'bg-green-100 text-green-800 border-green-200',
  };

  // Removed teamMembers state for single-user application
  const [showPublishModal, setShowPublishModal] = useState(false);
  // Removed user variable for single-user application

  const hasFetchedAfterToken = useRef(false);
  const [generatingProviders, setGeneratingProviders] = useState<{
    [key: string]: boolean;
  }>({});

  // Add state to track selected provider

  // Share functionality helpers
  const triggerDownload = (
    content: string | Blob,
    filename: string,
    type: string
  ) => {
    const blob =
      typeof content === 'string' ? new Blob([content], { type }) : content;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadAIContent = async (format: string, provider: string) => {
    let content = '';
    const filename = article?.title || 'ai-content';
    
    try {
      switch (provider) {
        case 'open_ai':
          content = aiContent?.open_ai_content || '';
          break;
        case 'gemini':
          content = aiContent?.gemini_content || '';
          break;
        case 'claude':
          content = aiContent?.claude_content || '';
          break;
        default:
          return;
      }

      if (!content) {
        toast({ title: 'No content to download' });
        return;
      }

      switch (format) {
        case 'Markdown':
          triggerDownload(content, `${filename}-${provider}.md`, 'text/markdown');
          break;
        case 'HTML':
          const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${filename}</title></head><body>${content.replace(/\n/g, '<br>')}</body></html>`;
          triggerDownload(html, `${filename}-${provider}.html`, 'text/html');
          break;
        case 'TXT':
          triggerDownload(content, `${filename}-${provider}.txt`, 'text/plain');
          break;
        default:
          toast({ title: 'Unknown format' });
      }
      
      toast({
        title: 'Download started',
        description: `Downloading ${provider} content as ${format}`,
      });
    } catch (e) {
      console.log(e);
      toast({ title: 'Error', description: 'Failed to download content' });
    }
  };

  const handleCopyAIContent = async (format: string, provider: string) => {
    let content = '';
    
    try {
      switch (provider) {
        case 'open_ai':
          content = aiContent?.open_ai_content || '';
          break;
        case 'gemini':
          content = aiContent?.gemini_content || '';
          break;
        case 'claude':
          content = aiContent?.claude_content || '';
          break;
        default:
          return;
      }

      if (!content) {
        toast({ title: 'No content to copy' });
        return;
      }

      if (format === 'Markdown' || format === 'TXT') {
        await navigator.clipboard.writeText(content);
      } else if (format === 'HTML') {
        const html = content.replace(/\n/g, '<br>');
        await navigator.clipboard.write([
          new window.ClipboardItem({
            'text/html': new Blob([html], { type: 'text/html' }),
            'text/plain': new Blob([content], { type: 'text/plain' }),
          }),
        ]);
      }
      
      toast({
        title: 'Content copied',
        description: `${provider} content copied as ${format}`,
      });
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to copy content' });
    }
  };


  // Add state for confirmation dialog
  const [confirmProvider, setConfirmProvider] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Add state for pending approval confirmation dialog
  const [showPendingConfirmDialog, setShowPendingConfirmDialog] =
    useState(false);
  const [pendingStatusValue, setPendingStatusValue] = useState<string | null>(
    null
  );

  // Add state for author bio
  const [authorBio, setAuthorBio] = useState('');
  const [authorBioSaving, setAuthorBioSaving] = useState(false);

  // Keep the OpenAI tab as default - removed editor auto-switching logic

  useEffect(() => {
    // Reset the flag when switching tabs
    hasFetchedAfterToken.current = false;
  }, [activeTab]);

  // Move fetchVersions to top-level so it can be called from anywhere

  useEffect(() => {
    async function fetchArticle() {
      setLoading(true);
      setError(null);
      try {
        const data = await getArticleDetail(articleId);
        setArticle(data);
        setTitle(data.title || '');
        setOutline(data.generated_outline || '');
        setAuthorBio(data.author_bio ?? '');
        // Normalize and set articleType
        const match = articleTypeOptions.find(
          (opt) =>
            opt.name.toLowerCase().trim() ===
            (data.articleType?.toLowerCase().trim() || '')
        );

        setArticleType(match ? match._id : articleTypeOptions[0]?._id || '');
      } catch (err: any) {
        setError(err.message || 'Failed to fetch article details');
        toast({
          title: 'Error',
          description: err.message || 'Failed to fetch article details',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }
    if (articleId && articleTypeOptions.length) fetchArticle();
  }, [articleId, articleTypeOptions]);

  useEffect(() => {
    setArticleTypeLoading(true);
    getArticleTypes()
      .then(setArticleTypeOptions)
      .catch((err: any) => {
        toast({
          title: 'Error',
          description: err.message || 'Failed to fetch article types',
          variant: 'destructive',
        });
      })
      .finally(() => setArticleTypeLoading(false));
  }, []);

  // Removed fetchTeamMembers useEffect for single-user application

  // Fetch recommended keywords for the article (for topic-style interface)
  useEffect(() => {
    async function fetchRecommended() {
      if (!article?._id || !isTopicStyleInterface()) return;
      setRecommendedLoading(true);
      try {
        const data = await getRecommendedKeywords(article._id);
        setRecommendedKeywords(
          data.filter(
            (k: any) => !(article.secondaryKeywords || []).includes(k.keyword)
          )
        );
      } catch (e) {
        setRecommendedKeywords([]);
      } finally {
        setRecommendedLoading(false);
      }
    }
    if (article) fetchRecommended();
  }, [article]);

  // Helper function to determine if we should show topic-style interface
  const isTopicStyleInterface = () => {
    return article?.status === 'rejected' || article?.status === 'pending';
  };



  const aiProviders = [
    { id: 'open_ai', name: 'OpenAI', icon: Brain, color: 'text-green-600' },
    { id: 'gemini', name: 'Gemini', icon: Sparkles, color: 'text-blue-600' },
    { id: 'claude', name: 'Claude', icon: Zap, color: 'text-purple-600' },
  ];

  const fetchAIContent = useCallback(async () => {
    if (!article?._id) return;

    try {
      const content = await getArticleAIContent(article._id);
      console.log('Fetched AI content:', content); // Debug log
      setAIContent(content);
    } catch (error: any) {
      console.error('Error fetching AI content:', error); // Debug log
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch AI content',
        variant: 'destructive',
      });
    }
  }, [article?._id]);

  const fetchEditorContent = useCallback(async () => {
    if (!article?._id) return;

    try {
      const content = await getArticleEditorContent(article._id);
      setEditorContent(content);
    } catch (error: any) {
      console.error('Error fetching editor content:', error);
      // toast({
      //   title: 'Error',
      //   description: error.message || 'Failed to fetch editor content',
      //   variant: 'destructive',
      // });
    }
  }, [article?._id]);

  useEffect(() => {
    if (article?._id) {
      fetchAIContent();
      fetchEditorContent();
    }
  }, [article?._id, fetchAIContent, fetchEditorContent]);

  // Add effect to fetch editor content after /collab/token is called when switching to Editor tab
  useEffect(() => {
    if (activeTab === 'editor' && article?._id) {
      // Assume /collab/token is called by the EditorProvider or elsewhere
      // Immediately fetch the latest editor content
      fetchEditorContent();
    }
    // Only run when activeTab or article.id changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, article?._id]);

  // Placeholder handlers to fix linter errors
  const handleRemoveSecondaryKeyword = async (idx: number) => {
    if (!article) {
      toast({
        title: 'Error',
        description: 'Article not loaded',
        variant: 'destructive',
      });
      return;
    }
    setAddingKeyword(true);
    const updatedKeywords = article.secondaryKeywords.filter(
      (_: any, i: number) => i !== idx
    );
    try {
      await updateArticle(article._id, { secondary_keywords: updatedKeywords.map(kw => typeof kw === 'string' ? kw : kw.keyword) });
      setArticle((prev: any) =>
        prev ? { ...prev, secondaryKeywords: updatedKeywords } : prev
      );
      toast({
        title: 'Secondary keyword removed',
        description: 'Keyword removed successfully.',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to remove keyword',
        variant: 'destructive',
      });
    } finally {
      setAddingKeyword(false);
    }
  };

  const handleAddSecondaryKeyword = async () => {
    if (!article) {
      toast({
        title: 'Error',
        description: 'Article not loaded',
        variant: 'destructive',
      });
      return;
    }
    if (!newSecondaryKeyword.trim()) return;
    setAddingKeyword(true);
    const newKeywordObj = {
      keyword: newSecondaryKeyword.trim(),
      volume: null,
      competition: null,
      article_type: null
    };
    const updatedKeywords = [
      ...(article.secondaryKeywords || []),
      newKeywordObj,
    ];
    try {
      await updateArticle(article._id, { secondary_keywords: updatedKeywords.map(kw => typeof kw === 'string' ? kw : kw.keyword) });
      setArticle((prev: any) =>
        prev ? { ...prev, secondaryKeywords: updatedKeywords } : prev
      );
      setNewSecondaryKeyword('');
      toast({
        title: 'Secondary keyword added',
        description: 'Keyword added successfully.',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to add keyword',
        variant: 'destructive',
      });
    } finally {
      setAddingKeyword(false);
    }
  };

  const handleAddMultipleSecondaryKeywords = async (keywords: string[]) => {
    if (!article) {
      toast({
        title: 'Error',
        description: 'Article not loaded',
        variant: 'destructive',
      });
      return;
    }
    if (keywords.length === 0) return;
    setAddingKeyword(true);
    const keywordObjects = keywords.map(keyword => ({
      keyword: keyword.trim(),
      volume: null,
      competition: null,
      article_type: null
    }));
    const updatedKeywords = [...(article.secondaryKeywords || []), ...keywordObjects];
    try {
      await updateArticle(article._id, { secondary_keywords: updatedKeywords.map(kw => kw.keyword) });
      setArticle((prev: any) =>
        prev ? { ...prev, secondaryKeywords: updatedKeywords } : prev
      );
      toast({
        title: 'Success',
        description: `Added ${keywords.length} keyword${keywords.length > 1 ? 's' : ''
          } from pasted content`,
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to add keywords',
        variant: 'destructive',
      });
    } finally {
      setAddingKeyword(false);
    }
  };

  // handleRemoveAssignedMember function removed for single-user application

  const handleStatusChange = async (value: string) => {
    if (!article) {
      toast({
        title: 'Error',
        description: 'Article not loaded',
        variant: 'destructive',
      });
      return;
    }
    // Only show modal if changing to published and not already published
    if (value === 'published' && article.status !== 'published') {
      setShowPublishModal(true);
      return;
    }
    // Show confirmation dialog if changing to pending approval, but only in regular article interface (not topic-style)
    if (
      value === 'pending' &&
      article.status !== 'pending' &&
      !isTopicStyleInterface()
    ) {
      setShowPendingConfirmDialog(true);
      setPendingStatusValue(value);
      return;
    }
    // For topic-style interface, when changing to approved (not_started), use the same validation as the approve button
    if (
      value === 'not_started' &&
      isTopicStyleInterface() &&
      article.status !== 'not_started'
    ) {
      handleApproveWithOutlineCheck();
      return;
    }
    setLoading(true);
    try {
      // Map UI value to backend value if needed
      let backendStatus = value;
      if (value === 'not started') backendStatus = 'not_started';
      else if (value === 'in progress') backendStatus = 'in_progress';
      else if (value === 'internal review') backendStatus = 'internal_review';
      else if (value === 'awaiting feedback')
        backendStatus = 'awaiting_feedback';
      else if (value === 'published') backendStatus = 'published';
      // Topic-style status mappings
      else if (value === 'pending') backendStatus = 'pending';
      else if (value === 'rejected') backendStatus = 'rejected';
      else if (value === 'not_started') backendStatus = 'not_started';
      await updateArticle(article._id, { status: backendStatus });
      setArticle((prev: any) => (prev ? { ...prev, status: value } : prev));
      toast({
        title: 'Status updated',
        description: 'Article status updated successfully.',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to update status',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleArticleTypeChange = async (value: string) => {
    if (!article) {
      toast({
        title: 'Error',
        description: 'Article not loaded',
        variant: 'destructive',
      });
      return;
    }

    // Check if the current status allows article type changes
    const allowedStatuses = ['pending', 'rejected'];
    if (!allowedStatuses.includes(article.status)) {
      toast({
        title: 'Not Allowed',
        description: 'Article type cannot be changed for this status.',
        variant: 'destructive',
      });
      return;
    }

    // For topic-style interface, use the regenerate title modal
    if (isTopicStyleInterface()) {
      setPendingArticleType(value);
      setRegenerateTitleModalOpen(true);
      return;
    }

    setArticleTypeLoading(true);
    try {
      const selectedType = articleTypeOptions.find((type) => type._id === value);
        const promptTypeId = selectedType ? selectedType._id : value;
      await updateArticle(article._id, { prompt_type: promptTypeId });
      setArticleType(value);
      setArticle((prev: any) =>
        prev ? { ...prev, articleType: selectedType?.name || value } : prev
      );
      toast({
        title: 'Article type updated',
        description: 'Article type updated successfully.',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to update article type',
        variant: 'destructive',
      });
    } finally {
      setArticleTypeLoading(false);
    }
  };
  // Add regenerate handler
  const handleRegenerateAIContent = async (
    providerId: 'open_ai' | 'gemini' | 'claude'
  ) => {
    if (!article?._id) return;

    // Set regeneration mode and reset selected provider states
    
    setAIContent((prev) => (prev ? { ...prev, selected_content: providerId } : prev));

    setRegeneratingProviders((prev) => ({ ...prev, [providerId]: true }));
    setGeneratingProviders((prev) => ({ ...prev, [providerId]: true }));
    try {
      const res = await generateArticleAIContent(article._id, providerId);
      console.log('Generate AI Content Response:', res); // Debug log
      
      if (res.status && res.data) {
        // The markdown content is now in the data key
        console.log('Setting AI content:', res.data); // Debug log
        setAIContent((prev) =>
          prev
            ? {
                ...prev,
                [`${providerId}_content`]: res.data, // res.data contains the markdown content
              }
            : null
        );
        
        // Wait a bit for the webhook to process, then fetch the latest content
        setTimeout(async () => {
          console.log('Fetching AI content after delay...'); // Debug log
          await fetchAIContent();
        }, 2000);
        
        toast({
          title: 'Success',
          description: `Regenerated ${providerId.replace('_', ' ')} content.`,
        });
      } else {
        throw new Error(res.message || 'Failed to regenerate content');
      }
    } catch (err: any) {
      toast({
        title: 'Error in Article Generation',
        description:
          err?.response?.data?.message ??
          (err.message || 'Failed to regenerate content'),
        variant: 'destructive',
      });
    } finally {
      setGeneratingProviders((prev) => ({ ...prev, [providerId]: false }));
      setRegeneratingProviders((prev) => ({ ...prev, [providerId]: false }));
    }
  };

  // Handler to regenerate outline
  const handleRegenerateOutline = async () => {
    if (!article) return;
    setOutlineLoading(true);
    setOutlineError(null);
    try {
      const newOutline = await generateOutline(article._id);
      setOutline(newOutline);
      setArticle((prev: any) =>
        prev ? { ...prev, generated_outline: newOutline } : prev
      );
      toast({
        title: 'Outline regenerated',
        description: 'The outline was regenerated successfully.',
      });
    } catch (err: any) {
      setOutlineError(err.message || 'Failed to regenerate outline');
      toast({
        title: 'Error',
        description: err.message || 'Failed to regenerate outline',
        variant: 'destructive',
      });
    } finally {
      setOutlineLoading(false);
    }
  };

  // Auto-regenerate outline if URL parameter is present
  useEffect(() => {
    const shouldAutoRegenerate = searchParams.get('autoRegenerateOutline') === 'true';
    if (shouldAutoRegenerate && article && !loading) {
      // Remove the parameter from URL to prevent repeated regeneration
      searchParams.delete('autoRegenerateOutline');
      setSearchParams(searchParams, { replace: true });

      // Trigger outline regeneration based on interface type
      if (isTopicStyleInterface()) {
        handleGenerateOutline();
      } else {
        handleRegenerateOutline();
      }
    }
  }, [article, loading, searchParams, setSearchParams]);

  // Handler to save edited outline
  const handleSaveOutline = async () => {
    if (!article) return;
    setOutlineLoading(true);
    setOutlineError(null);
    try {
      await updateArticle(article._id, { generated_outline: outline });
      setArticle((prev: any) =>
        prev ? { ...prev, generated_outline: outline } : prev
      );
      setIsEditingOutline(false);
      setIsEditing(false); // Also handle topic-style editing
      toast({
        title: 'Outline saved',
        description: 'The outline was updated successfully.',
      });
    } catch (err: any) {
      setOutlineError(err.message || 'Failed to save outline');
      toast({
        title: 'Error',
        description: err.message || 'Failed to save outline',
        variant: 'destructive',
      });
    } finally {
      setOutlineLoading(false);
    }
  };

  // Topic-style handlers
  const handleGenerateOutline = async () => {
    setGeneratingOutline(true);
    setOutlineLoading(true);
    try {
      const outlineText = await generateOutline(articleId);
      setOutline(outlineText);
      setArticle((prev: any) =>
        prev ? { ...prev, generated_outline: outlineText } : prev
      );
      toast({
        title: 'Outline generated',
        description: 'The outline was generated successfully.',
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to generate outline due to server error',
        variant: 'destructive',
      });
    } finally {
      setGeneratingOutline(false);
      setOutlineLoading(false);
    }
  };

  const handleSaveTitle = async () => {
    try {
      await updateArticle(article!._id, { name: title });
      setArticle((prev: any) => (prev ? { ...prev, title } : prev));
      setIsEditingTitle(false);
      toast({
        title: 'Title updated',
        description: 'Article title updated successfully.',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to update title',
        variant: 'destructive',
      });
    }
  };
  // Handler to save author bio
  const handleSaveAuthorBio = async () => {
    if (!article) return;
    setAuthorBioSaving(true);
    try {
      await updateArticle(article._id, { author_bio: authorBio });
      setArticle((prev: any) =>
        prev ? { ...prev, authorBio: authorBio } : prev
      );
      toast({
        title: 'Author bio saved',
        description: 'The author bio was updated successfully.',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to save author bio',
        variant: 'destructive',
      });
    } finally {
      setAuthorBioSaving(false);
    }
  };

  const handleApproveWithOutlineCheck = async () => {
    if (!article) return;
    if (!article.generated_outline || article.generated_outline.trim() === '') {
      setShowOutlineDialog(true);
      return;
    }
    // If outline exists, show modal to optionally add secondary keyword
    setShowAddKeywordModal(true);
  };

  // Direct approval function that bypasses validation checks
  const handleDirectApproval = async () => {
    if (!article) return;
    setLoading(true);
    try {
      await updateArticle(article._id, { status: 'not_started' });
      // Update local state - use 'not_started' to match the backend value and UI expectations
      setArticle((prev: any) =>
        prev ? { ...prev, status: 'not_started' } : prev
      );
      toast({
        title: 'Status updated',
        description: 'Article approved successfully.',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to approve article',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handler to add a recommended keyword
  const handleAddRecommendedKeyword = async (keyword: string) => {
    setNewSecondaryKeyword(keyword);
  };

  // Add these helpers after article is loaded
  const isApproved =
    article?.status === 'not_started' ||
    article?.status === 'approved' ||
    article?.status === 'mark as approved';

  const isRejected =
    article?.status === 'rejected' || article?.status === 'mark as rejected';

  // Refactor the proceed logic into a function
  const handleProceed = async (
    apiProvider: 'open_ai' | 'gemini' | 'claude',
    providerName: string
  ) => {
    if (!article) return;

    try {
      const res = await selectArticleAIContent(article._id, apiProvider, sessionId);
      if (res.status) {
        setAIContent((prev) =>
          prev
            ? {
              ...prev,
              selected_content: apiProvider,
            }
            : prev
        );

        toast({
          title: 'Success',
          description: `You have selected ${providerName} content to proceed with.`,
        });

        // Add a small delay before fetching editor content to ensure backend processing is complete
        setTimeout(async () => {
          await fetchEditorContent();
        }, 500);
      } else {
        throw new Error(res.message || 'Failed to select content');
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to select content',
        variant: 'destructive',
      });
    }
  };

  const editorRef = useRef<any>(null);



  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [mergeCurrentBlocks] = useState<any[]>([]);
  const [mergeGeneratedBlocks] = useState<any[]>([]);

  // Compute total word count from editor content
  const totalWordCount = useMemo(() => {
    if (editorContent && editorContent.snapshot_data) {
      try {
        let jsonString = '';
        if (typeof editorContent.snapshot_data === 'string') {
          const str = editorContent.snapshot_data;
          try {
            // Try to decode as base64 - be more lenient with detection
            if (str.length > 0 && !/^[\s\[\{]/.test(str)) {
              // If it doesn't start with whitespace, [, or {, try base64 decode
              jsonString = atob(str);
            } else {
              jsonString = str;
            }
          } catch {
            // If base64 decode fails, use as-is
            jsonString = str;
          }
        } else if ((editorContent.snapshot_data as any).data) {
          // Legacy format support
          const buffer = new Uint8Array((editorContent.snapshot_data as any).data);
          jsonString = new TextDecoder().decode(buffer);
        }
        
        if (jsonString) {
          const blocks = JSON.parse(jsonString);
          return countWordsInBlocks(blocks);
        }
      } catch {
        return 0;
      }
    }
    return 0;
  }, [editorContent]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }
  if (error || !article) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {error || 'Article not found.'}
      </div>
    );
  }

  // Render topic-style interface for rejected/pending articles
  if (isTopicStyleInterface()) {
    return (
      <div>
        <main className="container mx-auto px-4 py-8">
          {/* Back Button - Now in content area */}
          <div className="mb-6">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar - Task Information */}
            <div className="lg:col-span-1 space-y-6">
              <TaskSidebar
                projectName={{
                  id: article.relatedProject._id,
                  name: article.relatedProject.name,
                }}
                businessDetails={{
                  description: article.relatedProject.description || '',
                  audience: article.relatedProject.targetedAudience || '',
                }}
                onShowBusinessDetails={() => setShowBusinessDetailsDialog(true)}
                primaryKeyword={{
                  value: article.keyword,
                  volume: article.volume,
                  difficulty: article.keywordDifficulty,
                }}
                secondaryKeywords={article.secondaryKeywords || []}
                newSecondaryKeyword={newSecondaryKeyword}
                onNewSecondaryKeywordChange={setNewSecondaryKeyword}
                onAddSecondaryKeyword={handleAddSecondaryKeyword}
                onRemoveSecondaryKeyword={handleRemoveSecondaryKeyword}
                addingKeyword={addingKeyword}
                // Team assignment and followers removed for single-user mode
                status={article.status}
                statusOptions={[
                  { value: 'pending', label: 'Pending Approval' },
                  { value: 'rejected', label: 'Rejected' },
                  { value: 'not_started', label: 'Approved' },
                ]}
                onStatusChange={handleStatusChange}
                articleType={articleType}
                articleTypeOptions={articleTypeOptions.map((type) => ({
                  _id: type._id,
                  name: type.name.trim(),
                }))}
                onArticleTypeChange={handleArticleTypeChange}
                articleTypeLoading={articleTypeLoading}

                createdAt={article.createdAt}
                startDate={article.startDate}
                dueDate={article.dueDate}
                // Removed assignMemberTrigger prop for single-user application
                recommendedKeywordsUI={
                  recommendedLoading ? (
                    <div className="text-xs text-muted-foreground mt-1">
                      Loading recommended keywords...
                    </div>
                  ) : recommendedKeywords.length > 0 ? (
                    <div className="space-y-1 mt-1">
                      <div className="text-xs font-medium text-muted-foreground">
                        Recommended Keywords
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {recommendedKeywords.map((k) => (
                          <button
                            key={k.keyword}
                            type="button"
                            className="px-2 py-1 rounded bg-muted text-xs border hover:bg-primary/10 transition"
                            onClick={() =>
                              handleAddRecommendedKeyword(k.keyword)
                            }
                            disabled={addingKeyword}
                          >
                            {k.keyword}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null
                }
                // Removed assignedMembers prop for single-user application
              />
              {/* Business Details Dialog */}
              <Dialog
                open={showBusinessDetailsDialog}
                onOpenChange={setShowBusinessDetailsDialog}
              >
                <DialogContent className="w-full max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-3xl max-h-[80vh] p-0 hide-default-dialog-close">
                  <div className="sticky top-0 z-10 bg-background border-b px-6 py-4 flex items-center justify-between">
                    <DialogTitle>Business Details</DialogTitle>
                    <DialogClose asChild>
                      <button
                        className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
                        aria-label="Close"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </DialogClose>
                  </div>
                  <div className="overflow-y-auto max-h-[calc(80vh-70px)] px-6 py-4">
                    <div className="space-y-4">
                      {/* Target Audience - always show */}
                      <div>
                        <h4 className="font-semibold mb-2">Target Audience</h4>
                        {((article.relatedProject.targetedAudience &&
                          article.relatedProject.targetedAudience.trim()) ||
                          ((article.relatedProject as any)?.[
                            'targeted_audience'
                          ] && (article.relatedProject as any)['targeted_audience'].trim())) ? (
                          <p className="text-sm text-muted-foreground">
                            {article.relatedProject.targetedAudience ||
                              (article.relatedProject as any)?.[
                              'targeted_audience'
                              ]}
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No target audience specified for this project.
                          </p>
                        )}
                      </div>

                      {/* Description - always show */}
                      <div>
                        <h4 className="font-semibold mb-2">Description</h4>
                        {((article.relatedProject.description &&
                          article.relatedProject.description.trim()) ||
                          (article.relatedProject['description'] &&
                            article.relatedProject['description'].trim())) ? (
                          <div className="prose prose-sm max-w-none text-muted-foreground">
                            <ReactMarkdown>
                              {article.relatedProject.description ||
                                article.relatedProject['description']}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No description available for this project.
                          </p>
                        )}
                      </div>


                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            {/* Main Content - Outline */}
            <div className="lg:col-span-3">
              <Card className="hover-lift bg-card/50 backdrop-blur-sm border-border/40">
                <CardHeader>
                  <div className="flex flex-col gap-2 w-full">
                    {isEditingTitle ? (
                      <TextareaAutosize
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter article title..."
                        className="min-h-[48px] text-2xl font-bold resize-y w-full bg-transparent border border-input rounded-md px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        required
                        autoFocus
                        maxLength={200}
                        minRows={1}
                        maxRows={6}
                      />
                    ) : (
                      <CardTitle className="text-2xl" title={article.title}>
                        {article.title}
                      </CardTitle>
                    )}
                    {!isEditingTitle && (
                      <div className="flex flex-row items-center justify-between w-full gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            className={
                              isApproved
                                ? statusColors['mark as approved']
                                : isRejected
                                  ? statusColors['mark as rejected']
                                  : statusColors[article.status]
                            }
                            variant="outline"
                          >
                            {isApproved
                              ? 'Approved'
                              : isRejected
                                ? 'Rejected'
                                : article.status === 'pending'
                                  ? 'Pending Approval'
                                  : article.status.charAt(0).toUpperCase() +
                                  article.status.slice(1)}
                          </Badge>
                          {article.status === 'pending' && (
                            <>
                              <Button
                                onClick={handleApproveWithOutlineCheck}
                                size="sm"
                                className="text-green-600 bg-white border border-green-600 hover:bg-green-50"
                              >
                                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                                Approve
                              </Button>
                              <Button
                                onClick={() => handleStatusChange('rejected')}
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-600 hover:bg-red-50"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject
                              </Button>
                            </>
                          )}
                          {article.status === 'rejected' && (
                            <>
                              <Button
                                onClick={() => handleStatusChange('pending')}
                                size="sm"
                                variant="outline"
                                className="text-yellow-600 border-yellow-600 hover:bg-yellow-50"
                              >
                                <Clock className="h-4 w-4 mr-2 text-yellow-600" />
                                Pending Approval
                              </Button>
                              <Button
                                onClick={() =>
                                  handleStatusChange('not_started')
                                }
                                size="sm"
                                className="text-green-600 bg-white border border-green-600 hover:bg-green-50"
                              >
                                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                                Approve
                              </Button>
                            </>
                          )}
                          {isApproved && (
                            <Link to={`/articles/${article._id}`}>
                              <Button
                                size="sm"
                                className="text-blue-600 bg-white border border-blue-600 hover:bg-blue-50 "
                              >
                                <FileText className="h-4 w-4 mr-2 text-blue-600" />
                                Go to Article
                              </Button>
                            </Link>
                          )}
                        </div>
                        <div className="flex flex-row gap-2">
                          <Button
                            onClick={() => setIsEditingTitle(true)}
                            size="sm"
                            className={isEditingTitle ? 'razor-gradient' : ''}
                            variant={isEditingTitle ? 'default' : 'outline'}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Title
                          </Button>
                          <Button
                            onClick={() => setRegenerateTitleModalOpen(true)}
                            variant="outline"
                            size="sm"
                            title="Regenerate Article"
                          >
                            <Brain className="h-4 w-4 mr-2" />
                            Regenerate Title
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Content Outline</h3>
                      {isEditingTitle ? (
                        <div className="flex gap-2">
                          <Button
                            onClick={() => setIsEditingTitle(false)}
                            variant="outline"
                            size="sm"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </Button>
                          <Button
                            onClick={handleSaveTitle}
                            className="razor-gradient"
                            size="sm"
                          >
                            <Save className="h-4 w-4 mr-2" />
                            Save Article
                          </Button>
                        </div>
                      ) : !isEditing ? (
                        <div className="flex gap-2">
                          <Button
                            onClick={() => setIsEditing(true)}
                            variant="outline"
                            size="sm"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Outline
                          </Button>

                          <Button
                            onClick={handleGenerateOutline}
                            variant="outline"
                            size="sm"
                            disabled={generatingOutline}
                            title="Regenerate Outline"
                          >
                            {generatingOutline ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Brain className="h-4 w-4 mr-2" />
                            )}
                            Regenerate Outline
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Button
                            onClick={() => setIsEditing(false)}
                            variant="outline"
                            size="sm"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </Button>
                          <Button
                            onClick={handleSaveOutline}
                            className="razor-gradient"
                            size="sm"
                          >
                            <Save className="h-4 w-4 mr-2" />
                            Save Outline
                          </Button>
                        </div>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="space-y-4">
                        <Textarea
                          value={outline}
                          onChange={(e) => setOutline(e.target.value)}
                          placeholder="Enter the content outline..."
                          className="min-h-[500px] font-mono text-sm"
                        />
                      </div>
                    ) : (
                      <div className="prose prose-sm max-w-none">
                        {article.generated_outline ? (
                          <pre className="whitespace-pre-wrap text-sm bg-muted/30 p-4 rounded-lg border text-black">
                            {article.generated_outline}
                          </pre>
                        ) : (
                          <div className="text-center py-12 text-muted-foreground">
                            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No outline created yet</p>
                            <Button
                              onClick={handleGenerateOutline}
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                              disabled={generatingOutline}
                            >
                              {generatingOutline ? (
                                <>
                                  <span className="animate-spin mr-2">⏳</span>{' '}
                                  Generating...
                                </>
                              ) : (
                                <>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Generate Outline
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
        <RegenerateTitleModal
          open={regenerateTitleModalOpen}
          onOpenChange={(open) => {
            setRegenerateTitleModalOpen(open);
            if (!open) setPendingArticleType(null);
          }}
          topicId={article._id}
          currentTitle={title}
          onSaveAndGenerateOutline={async (newTitle: string) => {
            const typeToUse = pendingArticleType || articleType;
            try {
              await updateArticle(article._id, {
                prompt_type: typeToUse,
                name: newTitle,
              });
              setArticleType(typeToUse);
              const selectedType = articleTypeOptions.find(
                (type) => type._id === typeToUse
              );
              setArticle((prev: any) =>
                prev
                  ? {
                    ...prev,
                    articleType: selectedType ? selectedType.name : typeToUse,
                    title: newTitle,
                  }
                  : prev
              );
              setTitle(newTitle);
              setIsEditingTitle(false);
              setRegenerateTitleModalOpen(false);
              setPendingArticleType(null);
              await handleGenerateOutline();
            } catch (err: any) {
              toast({
                title: 'Error',
                description:
                  err.message || 'Failed to update article type and title',
                variant: 'destructive',
              });
            }
          }}
        />
        <OutlineRequiredModal
          open={showOutlineDialog}
          onOpenChange={setShowOutlineDialog}
          loading={outlineLoading}
          onGenerate={async () => {
            setOutlineLoading(true);
            try {
              await handleGenerateOutline();
              setShowOutlineDialog(false);
            } finally {
              setOutlineLoading(false);
            }
          }}
        />
        {/* Modal for optionally adding a secondary keyword before approval */}
        <SecondaryKeywordModal
          open={showAddKeywordModal}
          onOpenChange={setShowAddKeywordModal}
          initialKeywords={(article.secondaryKeywords || []).map(kw => typeof kw === 'string' ? kw : kw.keyword)}
          recommendedKeywords={recommendedKeywords}
          topicTitle={article.title}
          primaryKeyword={article.keyword}
          onApprove={async (updatedKeywords) => {
            try {
              await updateArticle(article._id, {
                secondary_keywords: updatedKeywords,
              });
              setArticle((prev: any) =>
                prev ? { ...prev, secondaryKeywords: updatedKeywords } : prev
              );
              toast({
                title: 'Secondary keywords updated',
                description: 'Keywords updated successfully.',
              });
              await handleDirectApproval();
            } catch (err: any) {
              toast({
                title: 'Error',
                description: err.message || 'Failed to approve article',
                variant: 'destructive',
              });
            }
          }}
        />
      </div>
    );
  }

  // Regular article interface for non-rejected/non-pending articles
  return (
    <div className="">
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
          {/* Sidebar - Task Information */}
          <div className="lg:col-span-1 space-y-6">
            <TaskSidebar
              topicId={article._id}
              projectName={{
                id: article.relatedProject._id,
                name: article.relatedProject.name,
              }}
              businessDetails={{
                description: article.relatedProject.description || '',
                audience: article.relatedProject.targetedAudience || '',
              }}
              onShowBusinessDetails={() => setShowBusinessDetailsDialog(true)}
              primaryKeyword={{
                value: article.keyword,
                volume: article.volume,
                difficulty: article.keywordDifficulty,
              }}
              secondaryKeywords={article.secondaryKeywords || []}
              newSecondaryKeyword={newSecondaryKeyword}
              onNewSecondaryKeywordChange={setNewSecondaryKeyword}
              onAddSecondaryKeyword={handleAddSecondaryKeyword}
              onRemoveSecondaryKeyword={handleRemoveSecondaryKeyword}
              onAddMultipleSecondaryKeywords={
                handleAddMultipleSecondaryKeywords
              }
              addingKeyword={addingKeyword}
              // Team assignment and followers removed for single-user mode
              status={article.status}
              statusOptions={[
                { value: 'pending', label: 'Pending Approval' },
                { value: 'not started', label: 'Not Started' },
                { value: 'in progress', label: 'In Progress' },
                { value: 'internal review', label: 'Internal Review' },
                { value: 'awaiting feedback', label: 'Awaiting Feedback' },
                { value: 'published', label: 'Published' },
                { value: 'rejected', label: 'Rejected' }
              ]}
              onStatusChange={handleStatusChange}
              articleType={articleType}
              articleTypeOptions={articleTypeOptions.map((type) => ({
                _id: type._id,
                name: type.name,
              }))}
              onArticleTypeChange={handleArticleTypeChange}
              articleTypeLoading={articleTypeLoading}

              createdAt={article.createdAt}
              startDate={article.startDate}
              dueDate={article.dueDate}
              customSections={[
                // Outline Details Dialog
                <Dialog key="outline-details">
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                      <FileText className="h-4 w-4 mr-2" />
                      Outline Details
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-full max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-3xl max-h-[80vh] p-0 hide-default-dialog-close flex flex-col">
                    <div className="sticky top-0 z-10 bg-background border-b px-4 py-3 flex items-center justify-between flex-shrink-0">
                      <DialogTitle>Outline Details</DialogTitle>
                      <div className="flex items-center gap-2">
                        {/* Action buttons */}
                        {!isEditingOutline &&
                          article &&
                          true && (
                            <>
                              <Button
                                onClick={() => {
                                  setOutline(article.generated_outline || '');
                                  setIsEditingOutline(true);
                                }}
                                variant="outline"
                                size="sm"
                                disabled={outlineLoading}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </Button>
                              <Button
                                onClick={handleRegenerateOutline}
                                variant="outline"
                                size="sm"
                                disabled={outlineLoading}
                                title={article.generated_outline ? "Regenerate Outline" : "Generate Outline"}
                              >
                                {outlineLoading ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <RotateCcw className="h-4 w-4 mr-2" />
                                )}
                                {article.generated_outline ? "Regenerate" : "Generate"}
                              </Button>
                            </>
                          )}
                        {isEditingOutline && (
                          <>
                            <Button
                              onClick={() => setIsEditingOutline(false)}
                              variant="outline"
                              size="sm"
                              disabled={outlineLoading}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Cancel
                            </Button>
                            <Button
                              onClick={handleSaveOutline}
                              className="razor-gradient"
                              size="sm"
                              disabled={outlineLoading}
                            >
                              {outlineLoading ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Save className="h-4 w-4 mr-2" />
                              )}
                              Save
                            </Button>
                          </>
                        )}
                        {/* Divider before close button */}
                        <span className="h-6 border-l border-muted mx-2" />
                        {/* Close button */}
                        <DialogClose asChild>
                          <Button variant="ghost" size="icon" className="ml-1">
                            <X className="h-5 w-5" />
                          </Button>
                        </DialogClose>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto px-4 py-3">
                      {outlineError && (
                        <div className="text-destructive text-sm mb-2">
                          {outlineError}
                        </div>
                      )}
                      {isEditingOutline ? (
                        <div className="space-y-4">
                          <Textarea
                            value={outline}
                            onChange={(e) => setOutline(e.target.value)}
                            placeholder="Enter the content outline..."
                            className="min-h-[67vh] font-mono text-sm"
                            disabled={outlineLoading}
                          />
                        </div>
                      ) : article && article.generated_outline ? (
                        <div className="prose prose-sm max-w-none text-muted-foreground">
                          <ReactMarkdown>
                            {article.generated_outline}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <div className="min-h-[67vh] flex items-center justify-center border rounded-md bg-muted/10">
                          <span className="text-muted-foreground">
                            No outline available.
                          </span>
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>,
                // Word Count
                ((aiContent?.avg_word_count && aiContent.avg_word_count > 0) ||
                  (typeof article.avgWordCount === 'number' &&
                    article.avgWordCount > 0) ||
                  totalWordCount > 0) && (
                  <div className="mt-4" key="avg-word-count">
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      Word Count
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-[hsl(var(--razor-primary))]" />
                        <span className="text-sm text-muted-foreground">
                          {aiContent?.avg_word_count &&
                            aiContent.avg_word_count > 0
                            ? aiContent.avg_word_count.toLocaleString()
                            : typeof article.avgWordCount === 'number' &&
                              article.avgWordCount > 0
                              ? article.avgWordCount.toLocaleString()
                              : ''}
                          <span className="font- text-base ml-1">words</span>
                        </span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          (Recommended)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-[hsl(var(--razor-primary))]" />
                        <span className="text-sm text-muted-foreground">
                          {totalWordCount.toLocaleString()}
                          <span className="font- text-base ml-1">words</span>
                        </span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          (Total Word Count)
                        </span>
                      </div>
                    </div>
                  </div>
                ),
              ]}
              // Removed assignMemberTrigger prop for single-user application
              // Removed assignedMembers prop for single-user application
            ></TaskSidebar>
            {/* Business Details Dialog */}
            <Dialog
              open={showBusinessDetailsDialog}
              onOpenChange={setShowBusinessDetailsDialog}
            >
              <DialogContent className="w-full max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-3xl max-h-[80vh] p-0 hide-default-dialog-close">
                <div className="sticky top-0 z-10 bg-background border-b px-6 py-4 flex items-center justify-between">
                  <DialogTitle>Business Details</DialogTitle>
                  <DialogClose asChild>
                    <button
                      className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
                      aria-label="Close"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </DialogClose>
                </div>
                <div className="overflow-y-auto max-h-[calc(80vh-70px)] px-6 py-4">
                  <div className="space-y-4">
                    {/* Target Audience - always show */}
                    <div>
                      <h4 className="font-semibold mb-2">Target Audience</h4>
                      {((article.relatedProject.targetedAudience &&
                        article.relatedProject.targetedAudience.trim()) ||
                        ((article.relatedProject as any)?.[
                          'targeted_audience'
                        ] && (article.relatedProject as any)['targeted_audience'].trim())) ? (
                        <p className="text-sm text-muted-foreground">
                          {article.relatedProject.targetedAudience ||
                            (article.relatedProject as any)?.[
                            'targeted_audience'
                            ]}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No target audience specified for this project.
                        </p>
                      )}
                    </div>

                    {/* Description - always show */}
                    <div>
                      <h4 className="font-semibold mb-2">Description</h4>
                      {((article.relatedProject.description &&
                        article.relatedProject.description.trim()) ||
                        (article.relatedProject['description'] &&
                          article.relatedProject['description'].trim())) ? (
                        <div className="prose prose-sm max-w-none text-muted-foreground">
                          <ReactMarkdown>
                            {article.relatedProject.description ||
                              article.relatedProject['description']}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No description available for this project.
                        </p>
                      )}
                    </div>


                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {/* Main Content - Article Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Editor Container */}
            <Card className="hover-lift bg-card/50 backdrop-blur-sm border-border/40">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl min-w-0">
                    {article.title}
                  </CardTitle>
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    {' '}
                    {/* Prevent wrap */}
                    <Badge
                      className={statusColors[article!.status as string]}
                      variant="outline"
                    >
                      {article.status === 'pending'
                        ? 'Pending Approval'
                        : article.status.charAt(0).toUpperCase() +
                        article.status.slice(1)}
                    </Badge>

                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-3">
                    {aiProviders.map((provider) => (
                      <TabsTrigger
                        key={provider.id}
                        value={provider.id}
                        className="flex items-center gap-2"
                      >
                        <provider.icon
                          className={`h-4 w-4 ${provider.color}`}
                        />
                        {provider.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {/* AI Provider Tabs */}
                  {aiProviders.map((provider) => (
                    <TabsContent
                      key={provider.id}
                      value={provider.id}
                      className="mt-6"
                    >
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            <provider.icon
                              className={`h-5 w-5 ${provider.color}`}
                            />
                            {provider.name} Generated Content
                          </h3>
                          {((provider.id === 'open_ai' &&
                            aiContent?.open_ai_content) ||
                            (provider.id === 'gemini' &&
                              aiContent?.gemini_content &&
                              aiContent.gemini_content !==
                              'Error generating content.') ||
                            (provider.id === 'claude' &&
                              aiContent?.claude_content &&
                              aiContent.claude_content !==
                              'Error generating content.')) && (
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleRegenerateAIContent(
                                      provider.id === 'open_ai'
                                        ? 'open_ai'
                                        : (provider.id as 'gemini' | 'claude')
                                    )
                                  }
                                  disabled={regeneratingProviders[provider.id]}
                                >
                                  {regeneratingProviders[provider.id] ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  ) : (
                                    <Brain className="h-4 w-4 mr-2" />
                                  )}
                                  Regenerate
                                </Button>
                                
                                {/* Share Options */}
                                <div className="flex gap-1">
                                  {/* Download Options */}
                                  <div className="relative group">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="px-2"
                                    >
                                      <Download className="h-4 w-4" />
                                    </Button>
                                    <div className="absolute top-full left-0 mt-1 bg-popover border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 min-w-[120px]">
                                      <div className="p-1">
                                        <button
                                          onClick={() => handleDownloadAIContent('Markdown', provider.id)}
                                          className="w-full text-left px-2 py-1 text-sm hover:bg-accent rounded flex items-center gap-2"
                                        >
                                          <FileDown className="h-3 w-3" />
                                          Markdown
                                        </button>
                                        <button
                                          onClick={() => handleDownloadAIContent('HTML', provider.id)}
                                          className="w-full text-left px-2 py-1 text-sm hover:bg-accent rounded flex items-center gap-2"
                                        >
                                          <Globe className="h-3 w-3" />
                                          HTML
                                        </button>
                                        <button
                                          onClick={() => handleDownloadAIContent('TXT', provider.id)}
                                          className="w-full text-left px-2 py-1 text-sm hover:bg-accent rounded flex items-center gap-2"
                                        >
                                          <FileText className="h-3 w-3" />
                                          Text
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Copy Options */}
                                  <div className="relative group">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="px-2"
                                    >
                                      <Copy className="h-4 w-4" />
                                    </Button>
                                    <div className="absolute top-full left-0 mt-1 bg-popover border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 min-w-[120px]">
                                      <div className="p-1">
                                        <button
                                          onClick={() => handleCopyAIContent('Markdown', provider.id)}
                                          className="w-full text-left px-2 py-1 text-sm hover:bg-accent rounded flex items-center gap-2"
                                        >
                                          <Copy className="h-3 w-3" />
                                          Markdown
                                        </button>
                                        <button
                                          onClick={() => handleCopyAIContent('HTML', provider.id)}
                                          className="w-full text-left px-2 py-1 text-sm hover:bg-accent rounded flex items-center gap-2"
                                        >
                                          <Copy className="h-3 w-3" />
                                          HTML
                                        </button>
                                        <button
                                          onClick={() => handleCopyAIContent('TXT', provider.id)}
                                          className="w-full text-left px-2 py-1 text-sm hover:bg-accent rounded flex items-center gap-2"
                                        >
                                          <Copy className="h-3 w-3" />
                                          Text
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                        </div>

                        <div className="prose prose-sm max-w-none">
                          {generatingProviders[provider.id] ? (
                            <>
                              <div className="flex items-center gap-2 text-muted-foreground animate-pulse mb-4">
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Generating {provider.name} content...
                              </div>
                              <AISkeleton />
                            </>
                          ) : provider.id === 'open_ai' ? (
                            <div className="whitespace-pre-wrap text-sm leading-relaxed">
                              {aiContent?.open_ai_content ? (
                                <>
                                  {/* Word count for OpenAI content using blocks logic */}
                                  <div className="mb-2 text-xs text-muted-foreground">
                                    Total words:{' '}
                                    {countWordsInBlocks(
                                      markdownToBlocks(
                                        aiContent.open_ai_content
                                      )
                                    ).toLocaleString()}
                                  </div>
                                  <div className="[&>h1]:text-2xl [&>h1]:font-bold [&>h1]:mb-4 [&>h2]:text-xl [&>h2]:font-bold [&>h2]:mb-3 [&>h3]:text-lg [&>h3]:font-bold [&>h3]:mb-2 [&>p]:mb-4 [&>ul]:list-disc [&>ul]:ml-4 [&>ol]:list-decimal [&>ol]:ml-4">
                                    <ReactMarkdown>
                                      {aiContent.open_ai_content}
                                    </ReactMarkdown>
                                  </div>
                                </>
                              ) : (
                                <div className="text-center py-12">
                                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center">
                                    <Brain className="h-8 w-8 text-white" />
                                  </div>
                                  <h3 className="text-lg font-semibold mb-2">
                                    No OpenAI content yet
                                  </h3>
                                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                                    Generate AI-powered content using OpenAI's
                                    advanced language models to create engaging
                                    articles.
                                  </p>
                                  <Button
                                    onClick={() =>
                                      handleRegenerateAIContent('open_ai')
                                    }
                                    disabled={regeneratingProviders['open_ai']}
                                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                                  >
                                    {regeneratingProviders['open_ai'] ? (
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                      <Brain className="h-4 w-4 mr-2" />
                                    )}
                                    Generate with OpenAI
                                  </Button>
                                </div>
                              )}
                            </div>
                          ) : provider.id === 'gemini' ? (
                            <div className="whitespace-pre-wrap text-sm leading-relaxed">
                              {aiContent?.gemini_content &&
                                aiContent.gemini_content !==
                                'Error generating content.' ? (
                                <>
                                  {/* Word count for Gemini content using blocks logic */}
                                  <div className="mb-2 text-xs text-muted-foreground">
                                    Total words:{' '}
                                    {countWordsInBlocks(
                                      markdownToBlocks(aiContent.gemini_content)
                                    ).toLocaleString()}
                                  </div>
                                  <div className="[&>h1]:text-2xl [&>h1]:font-bold [&>h1]:mb-4 [&>h2]:text-xl [&>h2]:font-bold [&>h2]:mb-3 [&>h3]:text-lg [&>h3]:font-bold [&>h3]:mb-2 [&>p]:mb-4 [&>ul]:list-disc [&>ul]:ml-4 [&>ol]:list-decimal [&>ol]:ml-4">
                                    <ReactMarkdown>
                                      {aiContent.gemini_content}
                                    </ReactMarkdown>
                                  </div>
                                </>
                              ) : (
                                <div className="text-center py-12">
                                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
                                    <Sparkles className="h-8 w-8 text-white" />
                                  </div>
                                  <h3 className="text-lg font-semibold mb-2">
                                    No Gemini content yet
                                  </h3>
                                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                                    Leverage Google's Gemini AI to create
                                    innovative and contextually rich content for
                                    your articles.
                                  </p>
                                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium opacity-60 cursor-not-allowed">
                                    <Sparkles className="h-4 w-4 mr-2 inline" />
                                    Coming Soon
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : provider.id === 'claude' ? (
                            <div className="whitespace-pre-wrap text-sm leading-relaxed">
                              {aiContent?.claude_content &&
                                aiContent.claude_content !==
                                'Error generating content.' ? (
                                <>
                                  {/* Word count for Claude content using blocks logic */}
                                  <div className="mb-2 text-xs text-muted-foreground">
                                    Total words:{' '}
                                    {countWordsInBlocks(
                                      markdownToBlocks(aiContent.claude_content)
                                    ).toLocaleString()}
                                  </div>
                                  <div className="[&>h1]:text-2xl [&>h1]:font-bold [&>h1]:mb-4 [&>h2]:text-xl [&>h2]:font-bold [&>h2]:mb-3 [&>h3]:text-lg [&>h3]:font-bold [&>h3]:mb-2 [&>p]:mb-4 [&>ul]:list-disc [&>ul]:ml-4 [&>ol]:list-decimal [&>ol]:ml-4">
                                    <ReactMarkdown>
                                      {aiContent.claude_content}
                                    </ReactMarkdown>
                                  </div>
                                </>
                              ) : (
                                <div className="text-center py-12">
                                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center">
                                    <Zap className="h-8 w-8 text-white" />
                                  </div>
                                  <h3 className="text-lg font-semibold mb-2">
                                    No Claude content yet
                                  </h3>
                                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                                    Use Anthropic's Claude AI to generate
                                    thoughtful, well-structured content with
                                    enhanced reasoning capabilities.
                                  </p>
                                  <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-2 rounded-md text-sm font-medium opacity-60 cursor-not-allowed">
                                    <Zap className="h-4 w-4 mr-2 inline" />
                                    Coming Soon
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </TabsContent>
                  ))}


                </Tabs>
              </CardContent>
            </Card>

            {/* Author Bio Section */}
            <Card className="hover-lift bg-card/50 backdrop-blur-sm border-border/40">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Edit className="h-5 w-5" />
                  Author Bio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Textarea
                    placeholder="Enter author bio information here..."
                    value={authorBio}
                    onChange={(e) => setAuthorBio(e.target.value)}
                    className="min-h-[120px] resize-none"
                    disabled={false}
                  />
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      Add biographical information about the article author that
                      will be displayed with the published content.
                    </div>
                    <Button
                      onClick={handleSaveAuthorBio}
                      disabled={authorBioSaving}
                      size="sm"
                      className="razor-gradient"
                    >
                      {authorBioSaving ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Save Bio
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Audit Report Section removed - not needed for single-user application */}
            <ImplementMergeModal
              open={mergeModalOpen}
              onOpenChange={setMergeModalOpen}
              currentBlocks={mergeCurrentBlocks}
              generatedBlocks={mergeGeneratedBlocks}
              onApply={(mergedBlocks) => {
                setEditorContent((prev) =>
                  prev
                    ? {
                      ...prev,
                      snapshot_data: JSON.stringify(mergedBlocks),
                    }
                    : prev
                );
                // Update the editor content in place
                if (
                  editorRef.current &&
                  typeof editorRef.current.replaceBlocks === 'function'
                ) {
                  editorRef.current.replaceBlocks(mergedBlocks);
                }

                // Editor tab removed - keeping current tab

                // Save the content to trigger the update API
                setTimeout(async () => {
                  try {
                    if (
                      editorRef.current &&
                      typeof editorRef.current.save === 'function'
                    ) {
                      // Show a toast notification to inform the user
                      toast({
                        title: 'Changes Applied',
                        description:
                          'Refreshing page to show the latest version...',
                      });

                      // Add a small delay before reloading
                      setTimeout(() => {
                        window.location.reload();
                      }, 1500);
                    }
                  } catch (error) {
                    console.error('Error saving content:', error);
                  }
                }, 500);
              }}
            />
          </div>
        </div>



        {/* Publish Modal */}
        {showPublishModal && (
          <ArticlePublishModel
            articleId={article._id}
            onOpenChange={setShowPublishModal}
            open={showPublishModal}
            onFinish={(publishUrl: string) => {
              setArticle((prev: any) =>
                prev
                  ? {
                    ...prev,
                    status: 'published',
                    publishedUrl: publishUrl.trim(),
                  }
                  : prev
              );
            }}
          />
        )}

        <ConfirmDialog
          open={showConfirmDialog}
          onOpenChange={setShowConfirmDialog}
          title="Update editor content?"
          description={`Don't worry — you can undo this change anytime from the
                    version history.`}
          onConfirm={async () => {
            if (confirmProvider) {
              const providerObj = aiProviders.find(
                (p) => p.id === confirmProvider
              );
              await handleProceed(
                confirmProvider as 'open_ai' | 'gemini' | 'claude',
                providerObj?.name || confirmProvider
              );
            }
            setShowConfirmDialog(false);
            setConfirmProvider(null);
          }}
        />

        {/* Pending Approval Confirmation Dialog */}
        <AlertDialog
          open={showPendingConfirmDialog}
          onOpenChange={setShowPendingConfirmDialog}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Status Change</AlertDialogTitle>
              <AlertDialogDescription>
                <div className="mb-2 text-destructive font-semibold">
                  Attention: You are about to change this article status back to{' '}
                  <b>Pending Approval</b>.<br />
                  This action will require a new review and may interrupt your
                  team's workflow.
                </div>
                Are you sure you want to continue?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() => {
                  setShowPendingConfirmDialog(false);
                  setPendingStatusValue(null);
                }}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  if (!article || !pendingStatusValue) return;
                  setLoading(true);
                  try {
                    await updateArticle(article._id, { status: 'pending' });
                    setArticle((prev: any) =>
                      prev ? { ...prev, status: pendingStatusValue } : prev
                    );
                    toast({
                      title: 'Status updated',
                      description:
                        'Article status changed to Pending Approval.',
                    });
                  } catch (err: any) {
                    toast({
                      title: 'Error',
                      description: err.message || 'Failed to update status',
                      variant: 'destructive',
                    });
                  } finally {
                    setLoading(false);
                    setShowPendingConfirmDialog(false);
                    setPendingStatusValue(null);
                  }
                }}
                className="razor-gradient"
              >
                Yes, Change to Pending Approval
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}

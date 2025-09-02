import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  Edit,
  Clock,
  FileText,
  CheckCircle,
  XCircle,
  Brain,
  Loader2,
  X,
  Save,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  getTopicDetail,
  generateOutline,
  getArticleTypes,
  ArticleTypeOption,
  updateArticle,
  getRecommendedKeywords,
} from '@/lib/services/topics.service';
import { toast } from '@/components/ui/use-toast';
import TextareaAutosize from 'react-textarea-autosize';
// Removed ManageTeamAssignmentModal and UserService for single-user application
import RegenerateTitleModal from '@/components/topics/RegenerateTitleModal';
import TaskSidebar from '@/components/layout/TaskSidebar';
import ReactMarkdown from 'react-markdown';
import { OutlineRequiredModal } from '@/components/ui/OutlineRequiredModal';
import SecondaryKeywordModal from './SecondaryKeywordModal';

export default function TopicDetail() {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const topicId = params.id as string;
  const [isEditing, setIsEditing] = useState(false);
  const [outline, setOutline] = useState('');
  const [articleType, setArticleType] = useState('');
  const [topic, setTopic] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingOutline, setGeneratingOutline] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState('');
  const [articleTypeOptions, setArticleTypeOptions] = useState<
    ArticleTypeOption[]
  >([]);
  const [articleTypeLoading, setArticleTypeLoading] = useState(false);
  const [newSecondaryKeyword, setNewSecondaryKeyword] = useState('');
  const [addingKeyword, setAddingKeyword] = useState(false);
  // Removed teamMembers state for single-user application
  const [regenerateTitleModalOpen, setRegenerateTitleModalOpen] =
    useState(false);
  const [pendingArticleType, setPendingArticleType] = useState<string | null>(
    null
  );
  const hasAutoRegenerated = useRef(false);
  const [showBusinessDetailsDialog, setShowBusinessDetailsDialog] =
    useState(false);
  const [showOutlineDialog, setShowOutlineDialog] = useState(false);
  const [outlineDialogLoading, setOutlineDialogLoading] = useState(false);
  const [recommendedKeywords, setRecommendedKeywords] = useState<any[]>([]);
  const [showAddKeywordModal, setShowAddKeywordModal] = useState(false);

  useEffect(() => {
    async function fetchTopic() {
      setLoading(true);
      setError(null);
      try {
        const data = await getTopicDetail(topicId);
        setTopic(data);
        setOutline(data.outline || '');
        setArticleType((data.articleType || '').trim());
        setTitle(data.title || '');
      } catch (err: any) {
        setError(err.message || 'Failed to fetch topic details');
        toast({
          title: 'Error',
          description: err.message || 'Failed to fetch topic details',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }
    if (topicId) fetchTopic();
  }, [topicId]);

  // Separate useEffect for auto-regenerate outline
  useEffect(() => {
    if (
      topic &&
      searchParams.get('autoRegenerateOutline') === 'true' &&
      !hasAutoRegenerated.current
    ) {
      hasAutoRegenerated.current = true;

      // Remove the query parameter from URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('autoRegenerateOutline');
      window.history.replaceState({}, '', newUrl.toString());

      // Auto-trigger outline generation
      setTimeout(() => {
        handleGenerateOutline();
      }, 1000); // Small delay to ensure page is fully loaded
    }
  }, [topic, searchParams]);

  useEffect(() => {
    setArticleTypeLoading(true);
    getArticleTypes()
      .then((options) => {
        setArticleTypeOptions(options);
        if (topic && topic.articleType) {
          const found = options.find(
            (type) => type.name.trim() === topic.articleType.trim()
          );
          if (found) setArticleType(found._id);
        }
      })
      .catch((err: any) => {
        toast({
          title: 'Error',
          description: err.message || 'Failed to fetch article types',
          variant: 'destructive',
        });
      })
      .finally(() => setArticleTypeLoading(false));
  }, [topic]);

  // Removed fetchTeamMembers useEffect for single-user application

  // Fetch recommended keywords for the article
  useEffect(() => {
    async function fetchRecommended() {
      if (!topic?.id) return;
      try {
        const data = await getRecommendedKeywords(topic.id);
        setRecommendedKeywords(
          data.filter(
            (k: any) => !(topic.secondaryKeywords || []).includes(k.keyword)
          )
        );
      } catch (e) {
        setRecommendedKeywords([]);
      } finally {
      }
    }
    if (topic) fetchRecommended();
  }, [topic]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full razor-gradient flex items-center justify-center gentle-glow" />
          <h1 className="text-2xl font-bold mb-2">Loading topic...</h1>
        </div>
      </div>
    );
  }

  if (error || !topic) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Topic Not Found</h1>
          <p className="text-muted-foreground mb-4">
            {error ||
              `The topic you're looking for doesn't exist. ID: ${topicId}`}
          </p>
          <Link to="/topics">
            <Button>Back to Topics</Button>
          </Link>
        </div>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    'pending approval': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    rejected: 'bg-red-100 text-red-800 border-red-200',
    'mark as rejected': 'bg-red-100 text-red-800 border-red-200',
    'mark as approved': 'bg-green-100 text-green-800 border-green-200',
    approved: 'bg-green-100 text-green-800 border-green-200',
    not_started: 'bg-green-100 text-green-800 border-green-200',
  };

  const handleGenerateOutline = async () => {
    setGeneratingOutline(true);
    try {
      const outlineText = await generateOutline(topicId);
      setOutline(outlineText);
      setTopic((prev: any) =>
        prev ? { ...prev, outline: outlineText } : prev
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
    }
  };

  const handleSaveTitle = async () => {
    try {
      await updateArticle(topic.id, { name: title });
      setTopic((prev: any) => (prev ? { ...prev, title } : prev));
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
    } finally {
    }
  };

  const handleSaveOutline = async () => {
    try {
      await updateArticle(topic.id, { generated_outline: outline });
      setTopic((prev: any) => (prev ? { ...prev, outline } : prev));
      setIsEditing(false);
      toast({
        title: 'Outline updated',
        description: 'Article outline updated successfully.',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to update outline',
        variant: 'destructive',
      });
    } finally {
    }
  };

  const handleStatusChange = async (value: string) => {
    // Intercept approve action for outline check
    if (
      value === 'mark as approved' &&
      (!topic.outline || topic.outline.trim() === '')
    ) {
      setShowOutlineDialog(true);
      return;
    }
    try {
      let backendStatus = value;
      if (value === 'pending approval') backendStatus = 'pending';
      else if (value === 'mark as rejected') backendStatus = 'rejected';
      else if (value === 'mark as approved') backendStatus = 'not_started';
      await updateArticle(topic.id, { status: backendStatus });
      setTopic((prev: any) => (prev ? { ...prev, status: value } : prev));
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
    }
  };

  const handleArticleTypeSelect = (id: string) => {
    setPendingArticleType(id);
    setRegenerateTitleModalOpen(true);
  };

  const handleAddSecondaryKeyword = async () => {
    if (!newSecondaryKeyword.trim()) return;
    setAddingKeyword(true);
    const updatedKeywords = [
      ...(topic.secondaryKeywords || []),
      newSecondaryKeyword.trim(),
    ];
    try {
      await updateArticle(topic.id, { secondary_keywords: updatedKeywords });
      setTopic((prev: any) =>
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
    if (keywords.length === 0) return;
    setAddingKeyword(true);
    const updatedKeywords = [...(topic.secondaryKeywords || []), ...keywords];
    try {
      await updateArticle(topic.id, { secondary_keywords: updatedKeywords });
      setTopic((prev: any) =>
        prev ? { ...prev, secondaryKeywords: updatedKeywords } : prev
      );
      toast({
        title: 'Success',
        description: `Added ${keywords.length} keyword${
          keywords.length > 1 ? 's' : ''
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

  // Team assignment functionality removed for single-user application

  const handleRemoveSecondaryKeyword = async (idx: number) => {
    setAddingKeyword(true);
    const updatedKeywords = topic.secondaryKeywords.filter(
      (_: string, i: number) => i !== idx
    );
    try {
      await updateArticle(topic.id, { secondary_keywords: updatedKeywords });
      setTopic((prev: any) =>
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

  // Add these helpers after topic is loaded
  const isApproved =
    topic.status === 'not_started' ||
    topic.status === 'approved' ||
    topic.status === 'mark as approved';

  const isRejected =
    topic.status === 'rejected' || topic.status === 'mark as rejected';

  const handleApproveWithOutlineCheck = async () => {
    if (!topic) return;
    if (!topic.outline || topic.outline.trim() === '') {
      setShowOutlineDialog(true);
      return;
    }
    // If outline exists, show modal to optionally add secondary keyword
    setShowAddKeywordModal(true);
  };

  return (
    <div>
      <main className="container mx-auto px-4 py-8">
        {/* Back Button - Now in content area */}
        <div className="mb-6">
          <Link to="/topics">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Topics
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Task Information */}
          <div className="lg:col-span-1 space-y-6">
            <TaskSidebar
              topicId={topic.id}
              projectName={{
                id: topic.relatedProject.id,
                name: topic.relatedProject.name,
              }}
              businessDetails={{
                description: topic.relatedProject.description || '',
                audience: topic.relatedProject.targetedAudience || '',
              }}
              onShowBusinessDetails={() => setShowBusinessDetailsDialog(true)}
              primaryKeyword={{
                value: topic.keyword,
                volume: topic.volume,
                difficulty: topic.keywordDifficulty,
              }}
              secondaryKeywords={topic.secondaryKeywords || []}
              newSecondaryKeyword={newSecondaryKeyword}
              onNewSecondaryKeywordChange={setNewSecondaryKeyword}
              onAddSecondaryKeyword={handleAddSecondaryKeyword}
              onRemoveSecondaryKeyword={handleRemoveSecondaryKeyword}
              onAddMultipleSecondaryKeywords={
                handleAddMultipleSecondaryKeywords
              }
              addingKeyword={addingKeyword}
              status={topic.status}
              statusOptions={[
                { value: 'pending approval', label: 'Pending Approval' },
                { value: 'mark as rejected', label: 'Rejected' },
                { value: 'mark as approved', label: 'Approved' },
              ]}
              onStatusChange={handleStatusChange}
              articleType={articleType}
              articleTypeOptions={articleTypeOptions.map((type) => ({
                _id: type._id,
                name: type.name.trim(),
              }))}
              onArticleTypeChange={handleArticleTypeSelect}
              articleTypeLoading={articleTypeLoading}
              createdAt={topic.createdAt}
              startDate={topic.startDate}
              dueDate={topic.dueDate}
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
                    {/* Target Audience */}
                    {(topic.relatedProject.targetedAudience ||
                      (topic.relatedProject as any)?.['targeted_audience']) && (
                      <div>
                        <h4 className="font-semibold mb-2">Target Audience</h4>
                        <p className="text-sm text-muted-foreground">
                          {topic.relatedProject.targetedAudience ||
                            (topic.relatedProject as any)?.[
                              'targeted_audience'
                            ]}
                        </p>
                      </div>
                    )}
                    {/* Description */}
                    {(topic.relatedProject.description ||
                      topic.relatedProject['description']) && (
                      <div>
                        <h4 className="font-semibold mb-2">Description</h4>
                        <div className="prose prose-sm max-w-none text-muted-foreground">
                          <ReactMarkdown>
                            {topic.relatedProject.description ||
                              topic.relatedProject['description']}
                          </ReactMarkdown>
                        </div>
                      </div>
                    )}
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
                      placeholder="Enter topic title..."
                      className="min-h-[48px] text-2xl font-bold resize-y w-full bg-transparent border border-input rounded-md px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      required
                      autoFocus
                      maxLength={200}
                      minRows={1}
                      maxRows={6}
                    />
                  ) : (
                    <CardTitle className="text-2xl" title={topic.title}>
                      {topic.title}
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
                              : statusColors[topic.status]
                          }
                          variant="outline"
                        >
                          {isApproved
                            ? 'Approved'
                            : isRejected
                            ? 'Rejected'
                            : topic.status.charAt(0).toUpperCase() +
                              topic.status.slice(1)}
                        </Badge>
                        {topic.status === 'pending approval' && (
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
                              onClick={() =>
                                handleStatusChange('mark as rejected')
                              }
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-600 hover:bg-red-50"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                          </>
                        )}
                        {(topic.status === 'rejected' ||
                          topic.status === 'mark as rejected') && (
                          <>
                            <Button
                              onClick={() =>
                                handleStatusChange('pending approval')
                              }
                              size="sm"
                              variant="outline"
                              className="text-yellow-600 border-yellow-600 hover:bg-yellow-50"
                            >
                              <Clock className="h-4 w-4 mr-2 text-yellow-600" />
                              Pending Approval
                            </Button>
                            <Button
                              onClick={() =>
                                handleStatusChange('mark as approved')
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
                          <Link to={`/articles/${topic.articleId || topic.id}`}>
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
                          Edit Topic
                        </Button>
                        <Button
                          onClick={() => setRegenerateTitleModalOpen(true)}
                          variant="outline"
                          size="sm"
                          title="Regenerate Topic"
                        >
                          <Brain className="h-4 w-4 mr-2" />
                          Regenerate Topic
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
                          Save Topic
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
                      {topic.outline ? (
                        <pre className="whitespace-pre-wrap text-sm bg-muted/30 p-4 rounded-lg border text-black">
                          {topic.outline}
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
        topicId={topic.id}
        currentTitle={title}
        onSaveAndGenerateOutline={async (newTitle: string) => {
          const typeToUse = pendingArticleType || articleType;
          try {
            await updateArticle(topic.id, {
              prompt_type: typeToUse,
              name: newTitle,
            });
            setArticleType(typeToUse);
            const selectedType = articleTypeOptions.find(
              (type) => type._id === typeToUse
            );
            setTopic((prev: any) =>
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
        loading={outlineDialogLoading}
        onGenerate={async () => {
          setOutlineDialogLoading(true);
          try {
            await handleGenerateOutline();
            setShowOutlineDialog(false);
          } finally {
            setOutlineDialogLoading(false);
          }
        }}
      />
      {/* Modal for optionally adding a secondary keyword before approval */}
      <SecondaryKeywordModal
        open={showAddKeywordModal}
        onOpenChange={setShowAddKeywordModal}
        initialKeywords={topic.secondaryKeywords || []}
        recommendedKeywords={recommendedKeywords}
        topicTitle={topic.title}
        primaryKeyword={topic.keyword}
        onApprove={async (updatedKeywords) => {
          try {
            await updateArticle(topic.id, {
              secondary_keywords: updatedKeywords,
            });
            setTopic((prev: any) =>
              prev ? { ...prev, secondaryKeywords: updatedKeywords } : prev
            );
            toast({
              title: 'Secondary keywords updated',
              description: 'Keywords updated successfully.',
            });
            await handleStatusChange('mark as approved');
          } catch (err: any) {
            toast({
              title: 'Error',
              description: err.message || 'Failed to approve topic',
              variant: 'destructive',
            });
          } finally {
          }
        }}
      />
    </div>
  );
}

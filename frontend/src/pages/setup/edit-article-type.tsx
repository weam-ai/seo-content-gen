import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { ArrowLeft } from 'lucide-react';
import promptTypeService from '@/lib/services/prompt-type.service';
import systemPromptService, { SystemPrompt } from '@/lib/services/system-prompt.service';
import { useToast } from '@/hooks/use-toast';
import { useSystemPromptPermissions } from '@/hooks/use-permissions';

export default function EditArticleTypePage() {
  const { canUpdateSystemPrompts } = useSystemPromptPermissions();
  if (!canUpdateSystemPrompts) {
    return (
      <div className="">
        {/* Back Button - Positioned below the logo */}
        <div className="container mx-auto px-4 mt-4">
          <Button variant="ghost" className="gap-2 pl-0" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
        
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <h2 className="text-2xl font-semibold mb-2">Not authorized</h2>
          <p className="text-muted-foreground mb-4">You do not have permission to edit article types.</p>
        </div>
      </div>
    );
  }
  const { id } = useParams<{ id: string }>();
  const [formData, setFormData] = useState({
    name: '',
    titlePrompt: '',
    outlinePrompt: '',
    articlePrompt: '',
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [promptLoading, setPromptLoading] = useState(true);
  const [titlePrompts, setTitlePrompts] = useState<SystemPrompt[]>([]);
  const [outlinePrompts, setOutlinePrompts] = useState<SystemPrompt[]>([]);
  const [articlePrompts, setArticlePrompts] = useState<SystemPrompt[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchPrompts() {
      setPromptLoading(true);
      try {
        const [title, outline, article] = await Promise.all([
          systemPromptService.getSystemPromptsByType('topic_title'),
          systemPromptService.getSystemPromptsByType('topic_outline'),
          systemPromptService.getSystemPromptsByType('article'),
        ]);
        setTitlePrompts(title.data || []);
        setOutlinePrompts(outline.data || []);
        setArticlePrompts(article.data || []);
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to fetch system prompts', variant: 'destructive' });
      } finally {
        setPromptLoading(false);
      }
    }
    fetchPrompts();
  }, [toast]);

  useEffect(() => {
    async function fetchArticleType() {
      setFetching(true);
      try {
        const res = await promptTypeService.getPromptTypeById(id!);
        const found = res.data;
        if (!found) throw new Error('Article type not found');
        setFormData({
          name: found.name,
          titlePrompt: found.titlePrompt?.id || '',
          outlinePrompt: found.outlinePrompt?.id || '',
          articlePrompt: found.articlePrompt?.id || '',
        });
      } catch (error: any) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
        navigate('/setup/article-types');
      } finally {
        setFetching(false);
      }
    }
    if (id) fetchArticleType();
  }, [id, toast, navigate]);

  const isFormValid =
    formData.name &&
    formData.titlePrompt &&
    formData.outlinePrompt &&
    formData.articlePrompt;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    setLoading(true);
    try {
      await promptTypeService.updatePromptType(id!, {
        name: formData.name,
        titlePrompt: formData.titlePrompt,
        outlinePrompt: formData.outlinePrompt,
        articlePrompt: formData.articlePrompt,
      });
      toast({ title: 'Success', description: 'Article type updated successfully.' });
      navigate('/setup/article-types');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="">
        {/* Back Button - Positioned below the logo */}
        <div className="container mx-auto px-4 mt-4">
          <Button variant="ghost" className="gap-2 pl-0" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
        
        <div className="container max-w-4xl mx-auto px-4 py-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-6 bg-muted rounded w-1/2" />
            <div className="h-40 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="">
      {/* Back Button - Positioned below the logo */}
      <div className="container mx-auto px-4 mt-4">
        <Button variant="ghost" className="gap-2 pl-0" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>
      
      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="max-w-4xl mx-auto space-y-8">
          <PageHeader
            title="Edit Article Type"
            description="Update the configuration for this article type"
          />

          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle>Edit Article Type Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="name">
                      Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      placeholder="Enter article type name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      disabled={loading}
                    />
                  </div>

                  {/* Title Prompt */}
                  <div className="space-y-2">
                    <Label htmlFor="titlePrompt">
                      Title Prompt <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.titlePrompt}
                      onValueChange={(value) =>
                        setFormData({ ...formData, titlePrompt: value })
                      }
                      disabled={loading || promptLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select title prompt" />
                      </SelectTrigger>
                      <SelectContent>
                        {promptLoading ? (
                          <div className="p-2 text-sm text-muted-foreground">
                            Loading prompts...
                          </div>
                        ) : (
                          titlePrompts.map((prompt) => (
                            <SelectItem key={prompt.id} value={prompt.id}>
                              {prompt.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Outline Prompt */}
                  <div className="space-y-2">
                    <Label htmlFor="outlinePrompt">
                      Outline Prompt <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.outlinePrompt}
                      onValueChange={(value) =>
                        setFormData({ ...formData, outlinePrompt: value })
                      }
                      disabled={loading || promptLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select outline prompt" />
                      </SelectTrigger>
                      <SelectContent>
                        {promptLoading ? (
                          <div className="p-2 text-sm text-muted-foreground">
                            Loading prompts...
                          </div>
                        ) : (
                          outlinePrompts.map((prompt) => (
                            <SelectItem key={prompt.id} value={prompt.id}>
                              {prompt.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Article Prompt */}
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="articlePrompt">
                      Article Prompt <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.articlePrompt}
                      onValueChange={(value) =>
                        setFormData({ ...formData, articlePrompt: value })
                      }
                      disabled={loading || promptLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select article prompt" />
                      </SelectTrigger>
                      <SelectContent>
                        {promptLoading ? (
                          <div className="p-2 text-sm text-muted-foreground">
                            Loading prompts...
                          </div>
                        ) : (
                          articlePrompts.map((prompt) => (
                            <SelectItem key={prompt.id} value={prompt.id}>
                              {prompt.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-4 pt-6">
                  <Link to="/setup/article-types">
                    <Button variant="outline" disabled={loading}>Cancel</Button>
                  </Link>
                  <Button
                    type="submit"
                    disabled={!isFormValid || loading}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {loading ? <span className="animate-spin mr-2">⏳</span> : null}
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <div className="pb-16"></div>
    </div>
  );
}
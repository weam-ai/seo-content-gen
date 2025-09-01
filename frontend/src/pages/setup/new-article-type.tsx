import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import promptTypeService from '@/lib/services/prompt-type.service';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import systemPromptService, { SystemPrompt } from '@/lib/services/system-prompt.service';
import { PageHeader } from '@/components/ui/page-header';
import { useSystemPromptPermissions } from '@/hooks/use-permissions';

export default function NewArticleTypePage() {
  const { canCreateSystemPrompts } = useSystemPromptPermissions();
  if (!canCreateSystemPrompts) {
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
          <p className="text-muted-foreground mb-4">You do not have permission to create article types.</p>
        </div>
      </div>
    );
  }
  const [articlePrompts, setArticlePrompts] = useState<SystemPrompt[]>([]);
  const [outlinePrompts, setOutlinePrompts] = useState<SystemPrompt[]>([]);
  const [titlePrompts, setTitlePrompts] = useState<SystemPrompt[]>([]);
  const [promptLoading, setPromptLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    articlePrompt: '',
    outlinePrompt: '',
    titlePrompt: '',
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const isFormValid =
    formData.name &&
    formData.articlePrompt &&
    formData.outlinePrompt &&
    formData.titlePrompt;

  useEffect(() => {
    async function fetchPrompts() {
      setPromptLoading(true);
      try {
        const [article, outline, title] = await Promise.all([
          systemPromptService.getSystemPromptsByType('article'),
          systemPromptService.getSystemPromptsByType('topic_outline'),
          systemPromptService.getSystemPromptsByType('topic_title'),
        ]);
        setArticlePrompts(article.data || []);
        setOutlinePrompts(outline.data || []);
        setTitlePrompts(title.data || []);
      } catch (error) {
        // Optionally show a toast
      } finally {
        setPromptLoading(false);
      }
    }
    fetchPrompts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    setLoading(true);
    try {
      await promptTypeService.createPromptType({
        name: formData.name,
        articlePrompt: formData.articlePrompt,
        outlinePrompt: formData.outlinePrompt,
        titlePrompt: formData.titlePrompt,
      });
      toast({ title: 'Success', description: 'Article type created successfully.' });
      navigate('/setup/article-types');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

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
        <div className="max-w-4xl mx-auto">
          <PageHeader
            title="Add New Article Type"
            description="Create a new article type configuration for your organization"
          />
          <Card className="mt-8">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Article Type Information</h2>
              </div>
            </CardHeader>
            <CardContent className="p-8">
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

                  {/* Article Prompt */}
                  <div className="space-y-2">
                    <Label htmlFor="articlePrompt">
                      Article Prompt <span className="text-red-500">*</span>
                    </Label>
                    <select
                      id="articlePrompt"
                      value={formData.articlePrompt}
                      onChange={e => setFormData({ ...formData, articlePrompt: e.target.value })}
                      disabled={loading || promptLoading}
                      className="block w-full border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    >
                      <option value="" disabled>Select article prompt...</option>
                      {articlePrompts.map(p => (
                        <option key={p._id} value={p._id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Outline Prompt */}
                  <div className="space-y-2">
                    <Label htmlFor="outlinePrompt">
                      Outline Prompt <span className="text-red-500">*</span>
                    </Label>
                    <select
                      id="outlinePrompt"
                      value={formData.outlinePrompt}
                      onChange={e => setFormData({ ...formData, outlinePrompt: e.target.value })}
                      disabled={loading || promptLoading}
                      className="block w-full border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    >
                      <option value="" disabled>Select outline prompt...</option>
                      {outlinePrompts.map(p => (
                        <option key={p._id} value={p._id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Title Prompt */}
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="titlePrompt">
                      Title Prompt <span className="text-red-500">*</span>
                    </Label>
                    <select
                      id="titlePrompt"
                      value={formData.titlePrompt}
                      onChange={e => setFormData({ ...formData, titlePrompt: e.target.value })}
                      disabled={loading || promptLoading}
                      className="block w-full border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    >
                      <option value="" disabled>Select title prompt...</option>
                      {titlePrompts.map(p => (
                        <option key={p._id} value={p._id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-4 pt-6">
                  <Link to="/setup/article-types">
                    <Button variant="outline">Cancel</Button>
                  </Link>
                  <Button
                    type="submit"
                    disabled={!isFormValid || loading}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {loading ? <span className="animate-spin mr-2">⏳</span> : null}
                    Save Article Type
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

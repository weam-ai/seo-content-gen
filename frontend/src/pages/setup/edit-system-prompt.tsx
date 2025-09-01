import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { ArrowLeft } from 'lucide-react';
import systemPromptService from '@/lib/services/system-prompt.service';
import { useToast } from '@/hooks/use-toast';
import { useSystemPromptPermissions } from '@/hooks/use-permissions';

export default function EditSystemPromptPage() {
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
          <p className="text-muted-foreground mb-4">You do not have permission to edit system prompts.</p>
        </div>
      </div>
    );
  }
  const { id } = useParams<{ id: string }>();
  const [promptName, setPromptName] = useState('');
  const [promptDescription, setPromptDescription] = useState('');
  const [promptType, setPromptType] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchPrompt() {
      setFetching(true);
      try {
        const res = await systemPromptService.getSystemPromptById(id!);
        const found = res.data;
        if (!found) throw new Error('System prompt not found');
        setPromptName(found.name);
        setPromptDescription(found.description);
        setPromptType(found.type || '');
      } catch (error: any) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
        navigate('/setup/system-prompts');
      } finally {
        setFetching(false);
      }
    }
    if (id) fetchPrompt();
  }, [id, toast, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptType || !promptName.trim() || !promptDescription.trim()) {
      toast({ title: 'Validation Error', description: 'Type, name, and description are required.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      await systemPromptService.updateSystemPrompt(id!, { name: promptName, description: promptDescription, type: promptType });
      toast({ title: 'Success', description: 'System prompt updated successfully.' });
      navigate('/setup/system-prompts');
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
        <div className="max-w-4xl mx-auto">
          <PageHeader
            title="Edit System Prompt"
            description="Update the details for this AI system prompt template"
          />

          {/* Prompt Information */}
          <form onSubmit={handleSubmit}>
            <Card className='mt-8'>
              <CardHeader>
                <CardTitle>Edit Prompt Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="promptType">Prompt Type *</Label>
                  <select
                    id="promptType"
                    value={promptType}
                    onChange={e => setPromptType(e.target.value)}
                    disabled={loading}
                    className="block w-full border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="" disabled>Select type...</option>
                    <option value="article">Article</option>
                    <option value="topic_title">Topic Title</option>
                    <option value="topic_outline">Topic Outline</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="promptName">Prompt Name *</Label>
                  <Input
                    id="promptName"
                    placeholder="Enter prompt name"
                    value={promptName}
                    onChange={(e) => setPromptName(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="promptDescription">Prompt Description *</Label>
                  <Textarea
                    id="promptDescription"
                    placeholder="Enter detailed description..."
                    value={promptDescription}
                    onChange={(e) => setPromptDescription(e.target.value)}
                    rows={10}
                    className="min-h-[200px]"
                    disabled={loading}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex items-center justify-end gap-4 mt-4">
              <Link to="/setup/system-prompts">
                <Button variant="outline" disabled={loading}>Cancel</Button>
              </Link>
              <Button
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                type="submit"
                disabled={loading}
              >
                {loading ? <span className="animate-spin mr-2">⏳</span> : null}
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </main>
      <div className="pb-16"></div>
    </div>
  );
}
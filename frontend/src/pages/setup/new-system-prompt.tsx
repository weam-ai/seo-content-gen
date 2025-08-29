import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import systemPromptService from '@/lib/services/system-prompt.service';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/ui/page-header';
import { useSystemPromptPermissions } from '@/hooks/use-permissions';

export default function NewSystemPromptPage() {
  const { canCreateSystemPrompts } = useSystemPromptPermissions();
  if (!canCreateSystemPrompts) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h2 className="text-2xl font-semibold mb-2">Not authorized</h2>
        <p className="text-muted-foreground mb-4">You do not have permission to create system prompts.</p>
      </div>
    );
  }
  const [promptName, setPromptName] = useState("");
  const [promptDescription, setPromptDescription] = useState("");
  const [promptType, setPromptType] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptType || !promptName.trim() || !promptDescription.trim()) {
      toast({ title: 'Validation Error', description: 'Type, name, and description are required.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      await systemPromptService.createSystemPrompt({ name: promptName, description: promptDescription });
      toast({ title: 'Success', description: 'System prompt created successfully.' });
      navigate('/setup/system-prompts');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="">
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link to="/setup/system-prompts">
            <Button variant="ghost" className="gap-2 mb-4">
              <ArrowLeft className="h-4 w-4" />
              Back to System Prompts
            </Button>
          </Link>
        </div>
        <div className="max-w-4xl mx-auto">
          <PageHeader
            title="Add New System Prompt"
            description="Create a new AI system prompt template"
          />
          <Card className="shadow-lg mt-6">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Prompt Information</h2>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              {/* Prompt Information */}
              <form onSubmit={handleSubmit}>
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
                    placeholder="Enter prompt name (e.g., Content Generation Prompt)"
                    value={promptName}
                    onChange={(e) => setPromptName(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="promptDescription">Prompt Description *</Label>
                  <Textarea
                    id="promptDescription"
                    placeholder="Enter detailed system prompt including instructions, tone guidelines, formatting requirements, and any specific parameters for AI content generation..."
                    value={promptDescription}
                    onChange={(e) => setPromptDescription(e.target.value)}
                    rows={10}
                    className="min-h-[200px]"
                    disabled={loading}
                  />
                </div>

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
                    Save Prompt
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
} 
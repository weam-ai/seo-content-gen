import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { ArrowLeft } from 'lucide-react';
import guidelineService from '@/lib/services/guideline.service';
import { useToast } from '@/hooks/use-toast';
import { useIndustryGuidelinePermissions } from '@/hooks/use-permissions';

export default function EditIndustryGuidelinePage() {
  const { canUpdateIndustryGuidelines } = useIndustryGuidelinePermissions();
  if (!canUpdateIndustryGuidelines) {
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
          <p className="text-muted-foreground mb-4">You do not have permission to edit industry guidelines.</p>
        </div>
      </div>
    );
  }

  const { id } = useParams<{ id: string }>();
  const [guidelineName, setGuidelineName] = useState('');
  const [guidelineDescription, setGuidelineDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchGuideline() {
      setFetching(true);
      try {
        const res = await guidelineService.getGuidelineById(id!);
        const found = res.data;
        if (!found) throw new Error('Guideline not found');
        setGuidelineName(found.name);
        setGuidelineDescription(found.description);
      } catch (error: any) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
        navigate('/setup/industry-guidelines');
      } finally {
        setFetching(false);
      }
    }
    if (id) fetchGuideline();
  }, [id, toast, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guidelineName.trim() || !guidelineDescription.trim()) {
      toast({ title: 'Validation Error', description: 'Name and description are required.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      await guidelineService.updateGuideline(id!, { name: guidelineName, description: guidelineDescription });
      toast({ title: 'Success', description: 'Guideline updated successfully.' });
      navigate('/setup/industry-guidelines');
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
            title="Edit Industry Guideline"
            description="Update the details for this industry-specific content guideline"
          />

          {/* Guideline Information */}
          <form onSubmit={handleSubmit}>
            <Card className='mt-8'>
              <CardHeader>
                <CardTitle>Edit Guideline Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="guidelineName">Guideline Name *</Label>
                  <Input
                    id="guidelineName"
                    placeholder="Enter guideline name"
                    value={guidelineName}
                    onChange={(e) => setGuidelineName(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guidelineDescription">
                    Guideline Description *
                  </Label>
                  <Textarea
                    id="guidelineDescription"
                    placeholder="Enter detailed description..."
                    value={guidelineDescription}
                    onChange={(e) => setGuidelineDescription(e.target.value)}
                    rows={8}
                    className="min-h-[200px]"
                    disabled={loading}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex items-center justify-end gap-4 mt-4">
              <Link to="/setup/industry-guidelines">
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
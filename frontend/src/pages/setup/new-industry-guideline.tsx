import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import guidelineService from '@/lib/services/guideline.service';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/ui/page-header';
import { useIndustryGuidelinePermissions } from '@/hooks/use-permissions';

export default function NewIndustryGuidelinePage() {
  const { canCreateIndustryGuidelines } = useIndustryGuidelinePermissions();
  if (!canCreateIndustryGuidelines) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h2 className="text-2xl font-semibold mb-2">Not authorized</h2>
        <p className="text-muted-foreground mb-4">You do not have permission to create industry guidelines.</p>
      </div>
    );
  }
  const [guidelineName, setGuidelineName] = useState("");
  const [guidelineDescription, setGuidelineDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guidelineName.trim() || !guidelineDescription.trim()) {
      toast({ title: 'Validation Error', description: 'Name and description are required.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      await guidelineService.createGuideline({ name: guidelineName, description: guidelineDescription });
      toast({ title: 'Success', description: 'Guideline created successfully.' });
      navigate('/setup/industry-guidelines');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="">
      <main className="container mx-auto md:px-4 px-2 md:py-8 py-4">
        <div className="mb-6">
          <Link to="/setup/industry-guidelines">
            <Button variant="ghost" className="gap-2 mb-4">
              <ArrowLeft className="h-4 w-4" />
              Back to Guidelines
            </Button>
          </Link>
        </div>
        <div className="max-w-4xl mx-auto">
          <PageHeader
            title="Add New Industry Guideline"
            description="Create a new industry-specific content guideline"
          />
          <Card className="shadow-lg mt-6">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Guideline Information</h2>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              {/* Guideline Information */}
              <form onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="guidelineName">Guideline Name *</Label>
                  <Input
                    id="guidelineName"
                    placeholder="Enter guideline name (e.g., Healthcare & Medical)"
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
                    placeholder="Enter detailed description of the industry guideline, including specific requirements, tone, terminology, and best practices..."
                    value={guidelineDescription}
                    onChange={(e) => setGuidelineDescription(e.target.value)}
                    rows={8}
                    className="min-h-[200px]"
                    disabled={loading}
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-4 mt-4">
                  <Link to="/setup/industry-guidelines">
                    <Button variant="outline" disabled={loading}>Cancel</Button>
                  </Link>
                  <Button
                    className=""
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? <span className="animate-spin mr-2">⏳</span> : null}
                    Save Guideline
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

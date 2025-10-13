import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, ArrowRight, Building } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SetupBusiness() {
  return (
    <div className=" flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-[hsl(var(--razor-primary))]/10 text-gray-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Building className="h-4 w-4" />
            Step 1 of 4
          </div>
          <h1 className="md:text-2xl text-lg font-bold tracking-tight mb-4">
            Tell us about your business
          </h1>
          <p className="text-muted-foreground md:text-base text-sm">
            This information helps us customize your experience and provide
            relevant content suggestions.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company-name">Company Name</Label>
                <Input
                  id="company-name"
                  placeholder="Enter your company name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input id="website" placeholder="https://yourcompany.com" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Business Description</Label>
              <Textarea
                id="description"
                placeholder="Briefly describe your business and what you do..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="goals">Content Goals</Label>
              <Textarea
                id="goals"
                placeholder="What are your main content marketing goals? (e.g., brand awareness, lead generation, thought leadership)"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between items-center mt-8">
          <Link to="/setup/welcome">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <Link to="/setup/team">
            <Button className="razor-gradient hover:opacity-90">
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, CheckCircle, Star, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SetupWelcome() {
  return (
    <div className=" flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-[hsl(var(--razor-primary))]/10 text-[hsl(var(--razor-primary))] px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Star className="h-4 w-4" />
            Welcome to RazorCopy
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Let's get your content platform
            <span className="text-[hsl(var(--razor-primary))]">
              {' '}
              up and running
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            We'll guide you through setting up your workspace, team, and
            preferences in just a few steps.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Team Setup card removed for single-user application */}

          <Card className="text-center">
            <CardHeader>
              <div className="w-12 h-12 bg-[hsl(var(--razor-primary))]/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Zap className="h-6 w-6 text-[hsl(var(--razor-primary))]" />
              </div>
              <CardTitle className="text-lg">Business Info</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Configure your business details and industry guidelines
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="w-12 h-12 bg-[hsl(var(--razor-primary))]/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-6 w-6 text-[hsl(var(--razor-primary))]" />
              </div>
              <CardTitle className="text-lg">Preferences</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Customize your workspace settings and preferences
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Link to="/setup/business">
            <Button size="lg" className="razor-gradient hover:opacity-90">
              Get Started
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
          <p className="text-sm text-muted-foreground mt-4">
            This will only take a few minutes
          </p>
        </div>
      </div>
    </div>
  );
}

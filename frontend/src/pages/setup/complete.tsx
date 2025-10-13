import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Rocket, Sparkles, Target } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SetupComplete() {
  return (
    <div className=" flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-green-500/10 text-green-500 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <CheckCircle className="h-4 w-4" />
            Setup Complete!
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            You're all set up!
          </h1>
          <p className="text-xl text-muted-foreground">
            Your RazorCopy workspace is ready. Let's start creating amazing
            content together.
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-gray-800" />
              What's Next?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-[hsl(var(--razor-primary))]/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-gray-800 font-semibold text-sm">
                  1
                </span>
              </div>
              <div>
                <h3 className="font-medium">Create Your First Project</h3>
                <p className="text-sm text-muted-foreground">
                  Set up a new content project and define your goals and target
                  audience.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-[hsl(var(--razor-primary))]/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-gray-800 font-semibold text-sm">
                  2
                </span>
              </div>
              <div>
                <h3 className="font-medium">Explore Topics</h3>
                <p className="text-sm text-muted-foreground">
                  Discover trending topics and keywords relevant to your
                  industry.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-[hsl(var(--razor-primary))]/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-gray-800 font-semibold text-sm">
                  3
                </span>
              </div>
              <div>
                <h3 className="font-medium">Start Writing</h3>
                <p className="text-sm text-muted-foreground">
                  Use our AI-powered tools to create high-quality content faster
                  than ever.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center space-y-4">
          <Link to="/projects">
            <Button size="lg" className="razor-gradient hover:opacity-90">
              <Rocket className="h-5 w-5 mr-2" />
              Go to Projects
            </Button>
          </Link>

          <div className="flex justify-center gap-4">
            <Link to="/projects/new">
              <Button variant="outline">
                <Target className="h-4 w-4 mr-2" />
                Create Project
              </Button>
            </Link>
            <Link to="/topics">
              <Button variant="outline">
                <Sparkles className="h-4 w-4 mr-2" />
                Explore Topics
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Need help? Check out our{' '}
            <a
              href="#"
              className="text-gray-800 hover:underline"
            >
              documentation
            </a>{' '}
            or{' '}
            <a
              href="#"
              className="text-gray-800 hover:underline"
            >
              contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

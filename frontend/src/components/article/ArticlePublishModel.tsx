import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { updateArticle } from '@/lib/services/topics.service';
import { toast } from '@/components/ui/use-toast';
import RatingModel from './RatingModel';

interface ArticlePublishModelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  articleId: string;
  onFinish: (publishUrl: string) => void;
}

const ArticlePublishModel: React.FC<ArticlePublishModelProps> = ({
  open,
  onOpenChange,
  articleId,
  onFinish,
}: ArticlePublishModelProps) => {
  const [publishUrl, setPublishUrl] = useState('');
  const [publishUrlError, setPublishUrlError] = useState('');
  const [showRatingModal, setShowRatingModal] = useState(false);

  const handlePublishSubmit = async () => {
    setPublishUrlError('');
    // Simple URL validation
    if (!publishUrl.trim() || !/^https?:\/\//.test(publishUrl.trim())) {
      setPublishUrlError(
        'Please enter a valid URL (must start with http:// or https://)'
      );
      return;
    }
    try {
      await updateArticle(articleId, {
        status: 'published',
        published_url: publishUrl.trim(),
      });

      toast({
        title: 'Article published',
        description: 'Article status set to Published and URL saved.',
      });
      onOpenChange(false);
      setPublishUrl('');
      onFinish(publishUrl);
      // Show rating modal after publish
      setShowRatingModal(true);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to publish article',
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter URL for Publishing</DialogTitle>
            <DialogDescription>
              Please enter the URL where this article is published. This is
              required to complete publishing.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label htmlFor="publish-url" className="text-sm font-medium">
              URL
            </label>
            <Input
              id="publish-url"
              placeholder="Enter URL"
              value={publishUrl}
              onChange={(e) => setPublishUrl(e.target.value)}
              autoFocus
            />
            {publishUrlError && (
              <div className="text-destructive text-xs mt-1">
                {publishUrlError}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                setPublishUrl('');
                setPublishUrlError('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePublishSubmit}
              disabled={!publishUrl}
              className="ml-2"
            >
              Publish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rating Modal */}
      <RatingModel
        articleId={articleId}
        open={showRatingModal}
        onOpenChange={setShowRatingModal}
      />
    </>
  );
};

export default ArticlePublishModel;

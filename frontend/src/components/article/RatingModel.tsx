import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { toast } from '@/components/ui/use-toast';
import axios from 'axios';
import { useAuthStore } from '@/stores/auth-store';

interface RatingModelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  articleId: string;
}

const RatingModel: React.FC<RatingModelProps> = ({
  open,
  onOpenChange,
  articleId,
}: RatingModelProps) => {
  const [rating, setRating] = useState<number>(0);
  const [review, setReview] = useState('');
  const [ratingError, setRatingError] = useState('');
  const [ratingLoading, setRatingLoading] = useState(false);
  const user = useAuthStore.getState().user;

  const handleSaveRatingReview = async () => {
    setRatingError('');
    if (!rating) {
      setRatingError('Please select a rating.');
      return;
    }
    setRatingLoading(true);
    try {
      const payload = {
        rating,
        review,
        staffid: user?._id,
        taskid: articleId,
      };
      await axios.post('/add/rating', payload); // Adjust base URL as needed
      toast({
        title: 'Thank you!',
        description: 'Your feedback has been submitted.',
      });
      onOpenChange(false);
      setRating(0);
      setReview('');
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to submit rating',
        variant: 'destructive',
      });
    } finally {
      setRatingLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rate and Complete Publishing</DialogTitle>
          <DialogDescription>
            How would you rate your overall publishing experience?
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className={star <= rating ? 'text-yellow-400' : 'text-gray-300'}
                aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  className="w-8 h-8"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.175c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.966c.3.922-.755 1.688-1.54 1.118l-3.38-2.455a1 1 0 00-1.175 0l-3.38 2.455c-.784.57-1.838-.196-1.54-1.118l1.287-3.966a1 1 0 00-.364-1.118L2.05 9.394c-.783-.57-.38-1.81.588-1.81h4.175a1 1 0 00.95-.69l1.286-3.967z" />
                </svg>
              </button>
            ))}
          </div>
          {ratingError && (
            <div className="text-destructive text-xs">{ratingError}</div>
          )}
          <textarea
            className="w-full border rounded p-2 text-sm min-h-[60px]"
            placeholder="Please provide any comments or suggestions. (optional)"
            value={review}
            onChange={(e) => setReview(e.target.value)}
            rows={2}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            onClick={handleSaveRatingReview}
            disabled={ratingLoading}
            className="ml-2"
          >
            {ratingLoading ? (
              <span className="animate-spin mr-2">⏳</span>
            ) : null}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RatingModel;

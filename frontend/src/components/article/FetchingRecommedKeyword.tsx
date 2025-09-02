import React, { useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import {
  fetchRecommendedKeywordsByKeyword,
  RecommendedKeywordData,
} from '@/lib/services/topics.service';

interface FetchingRecommendedKeywordProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  primaryKeyword: string;
  onFinish: (keywords: RecommendedKeywordData[]) => void;
}

const FetchingRecommendedKeyword: React.FC<FetchingRecommendedKeywordProps> = ({
  children,
  primaryKeyword,
  onFinish,
  ...restProps
}) => {
  const handleFetchRecommendedKeywords = async (primaryKeyword: string) => {
    if (!primaryKeyword.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a primary keyword first',
        variant: 'destructive',
      });
      return;
    }

    setFetchingRecommended(true);
    try {
      const keywords = await fetchRecommendedKeywordsByKeyword(
        primaryKeyword.trim()
      );

      onFinish && onFinish(keywords.slice(0, 20));
      toast({
        title: 'Success',
        description: `Found ${
          keywords.slice(0, 20).length
        } recommended keywords`,
      });
    } catch (error) {
      console.error('Failed to fetch recommended keywords', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to fetch recommended keywords',
        variant: 'destructive',
      });
      onFinish && onFinish([]);
    } finally {
      setFetchingRecommended(false);
    }
  };
  const [fetchingRecommended, setFetchingRecommended] =
    useState<boolean>(false);

  return (
    <div
      onClick={() =>
        !fetchingRecommended && handleFetchRecommendedKeywords(primaryKeyword)
      }
      {...restProps}
    >
      {children ?? (
        <span className="text-xs text-[hsl(var(--razor-primary))] cursor-pointer">
          {fetchingRecommended
            ? 'Fetching Recommendations...'
            : 'Fetch Recommendations'}
        </span>
      )}
    </div>
  );
};

export default FetchingRecommendedKeyword;

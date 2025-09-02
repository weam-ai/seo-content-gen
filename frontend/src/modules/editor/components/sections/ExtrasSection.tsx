import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { User, Save, FileText, Hash } from 'lucide-react';
import {
  updateArticle,
  UpdateArticlePayload,
} from '@/lib/services/topics.service';
import { useParams } from 'react-router-dom';
import useEditor from '../../hooks/useEditor';

export const ExtrasSection: React.FC = () => {
  const { articleId } = useParams();
  const { article } = useEditor();
  const [authorBio, setAuthorBio] = useState(article?.author_bio ?? '');
  const [metaTitle, setMetaTitle] = useState(article?.meta_title ?? '');
  const [metaDescription, setMetaDescription] = useState(
    article?.meta_description ?? ''
  );

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!authorBio.trim() && !metaTitle.trim() && !metaDescription.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter at least one field before saving.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const payload: Partial<UpdateArticlePayload> = {
        author_bio: authorBio ?? undefined,
        meta_title: metaTitle ?? undefined,
        meta_description: metaDescription ?? undefined,
      };
      if (articleId) await updateArticle(articleId, payload);
      Object.assign(article ?? {}, payload);

      toast({
        title: 'Saved',
        description: 'Extra Information have been saved successfully.',
      });
      setIsSaving(false);
    } catch {
      toast({
        title: 'Error',
        description: 'Error in saving..',
      });
      setIsSaving(false);
    }
  };

  return (
    <div className="p-3 space-y-4">
      {/* Meta Title */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Hash className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs font-medium">Meta Title</span>
        </div>
        <Input
          placeholder="Enter meta title..."
          value={metaTitle}
          onChange={(e) => setMetaTitle(e.target.value)}
          className="h-7 text-xs"
          maxLength={60}
        />
        <div className="text-xs text-muted-foreground text-right">
          {metaTitle.length}/60
        </div>
      </div>

      {/* Meta Description */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <FileText className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs font-medium">Meta Description</span>
        </div>
        <Textarea
          placeholder="Enter meta description..."
          value={metaDescription}
          onChange={(e) => setMetaDescription(e.target.value)}
          className="min-h-[60px] text-xs resize-none"
          maxLength={160}
        />
        <div className="text-xs text-muted-foreground text-right">
          {metaDescription.length}/160
        </div>
      </div>

      {/* Author Bio */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <User className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs font-medium">Author Bio</span>
        </div>
        <Textarea
          placeholder="Enter author biography..."
          value={authorBio}
          onChange={(e) => setAuthorBio(e.target.value)}
          className="min-h-[80px] text-xs resize-none"
        />
      </div>

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={
          isSaving ||
          (!authorBio.trim() && !metaTitle.trim() && !metaDescription.trim())
        }
        size="sm"
        className="w-full h-7"
      >
        {isSaving ? (
          <>
            <div className="h-3 w-3 mr-1.5 animate-spin rounded-full border-2 border-background border-t-transparent" />
            Saving...
          </>
        ) : (
          <>
            <Save className="h-3 w-3 mr-1.5" />
            Save All
          </>
        )}
      </Button>
    </div>
  );
};

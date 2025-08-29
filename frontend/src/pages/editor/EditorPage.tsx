import React from 'react';
import { Editor } from '@/modules/editor';
import { Toaster } from '@/components/ui/toaster';

const EditorPage: React.FC = () => {
  return (
    <div className="h-screen">
      <Editor />
      <Toaster />
    </div>
  );
};

export default EditorPage;

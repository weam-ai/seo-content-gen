import { useBlockNoteEditor, useComponentsContext } from '@blocknote/react';

interface CustomAIButtonProps {
  onAIButtonClick?: (selectedText: string, block: any) => void;
}

export const CustomAIButton = ({ onAIButtonClick }: CustomAIButtonProps) => {
  const editor = useBlockNoteEditor();
  const Components = useComponentsContext();

  const handleClick = () => {
    const selectedText = editor.getSelectedText();
    const selection = editor.getSelection();

    if (!selectedText || !selection) {
      // Show message that text must be selected
      alert('Please select some text for AI assistance');
      return;
    }

    console.log('🎯 AI button clicked with text:', selectedText);
    console.log('📝 Selection blocks:', selection.blocks);

    // Call the callback if provided
    if (onAIButtonClick && selection.blocks?.[0]) {
      onAIButtonClick(selectedText, selection.blocks[0]);
    }
  };

  if (!Components) return null;
  return (
    <Components.FormattingToolbar.Button
      key="aiButton"
      onClick={(e) => { e.preventDefault(); handleClick(); }}
      mainTooltip="AI Assistant"
      className="ai-toolbar-button"
    >
      <div className="bn-button-icon">
        <span>✨</span>
        <span>AI</span>
      </div>
    </Components.FormattingToolbar.Button>
  );
};
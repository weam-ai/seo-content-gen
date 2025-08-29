import { MessageCircle } from 'lucide-react';
import { useBlockNoteEditor, useComponentsContext } from '@blocknote/react';

interface CustomCommentButtonProps {
  onCommentClick: (selectionInfo: any) => void;
}

export const CustomCommentButton = ({
  onCommentClick,
}: CustomCommentButtonProps) => {
  const editor = useBlockNoteEditor();
  const Components = useComponentsContext();

  const handleClick = () => {
    // Get current selection and block
    const selection = editor.getSelection();
    const selectedText = editor.getSelectedText();
    const currentBlock = editor.getTextCursorPosition().block;

    if (!selectedText || !currentBlock) {
      // Show message that text must be selected
      alert('Please select some text to add a comment');
      return;
    }

    // Store additional selection information for better positioning
    const selectionInfo = {
      selectedText: selectedText.trim(), // Trim whitespace to improve matching
      block: currentBlock,
      selection: selection,
      // Store the raw selection for debugging
      rawSelectedText: selectedText,
    };

    console.log('Comment button clicked with selection:', selectionInfo);
    onCommentClick(selectionInfo);
  };

  if (!Components) return null;
  return (
    <Components.FormattingToolbar.Button
      className="bn-button"
      onClick={handleClick}
      label="Add Comment"
      icon={<MessageCircle size={18} />}
    />
  );
};

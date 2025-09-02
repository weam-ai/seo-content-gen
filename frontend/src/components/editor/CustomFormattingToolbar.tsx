import {
  BasicTextStyleButton,
  BlockTypeSelect,
  ColorStyleButton,
  CreateLinkButton,
  FileCaptionButton,
  FileDeleteButton,
  FileDownloadButton,
  FilePreviewButton,
  FileRenameButton,
  FileReplaceButton,
  NestBlockButton,
  TableCellMergeButton,
  TextAlignButton,
  UnnestBlockButton,
  useComponentsContext,
} from '@blocknote/react';
import { CustomAIButton } from './CustomAIButton';

const ResponsiveBlockTypeSelect = () => (
  <div className="responsive-block-select-wrapper">
    <BlockTypeSelect />
  </div>
);

export const getFormattingToolbarItems = (
  onAIButtonClick: (selectedText: string, block: any) => void
) => [
    <CustomAIButton key={'customAIButton'} onAIButtonClick={onAIButtonClick} />,
    <ResponsiveBlockTypeSelect key={'blockTypeSelect'} />,
    <TableCellMergeButton key={'tableCellMergeButton'} />,
    <FileCaptionButton key={'fileCaptionButton'} />,
    <FileReplaceButton key={'replaceFileButton'} />,
    <FileRenameButton key={'fileRenameButton'} />,
    <FileDeleteButton key={'fileDeleteButton'} />,
    <FileDownloadButton key={'fileDownloadButton'} />,
    <FilePreviewButton key={'filePreviewButton'} />,
    <BasicTextStyleButton basicTextStyle={'bold'} key={'boldStyleButton'} />,
    <BasicTextStyleButton basicTextStyle={'italic'} key={'italicStyleButton'} />,
    <BasicTextStyleButton
      basicTextStyle={'underline'}
      key={'underlineStyleButton'}
    />,
    <BasicTextStyleButton basicTextStyle={'strike'} key={'strikeStyleButton'} />,
    <TextAlignButton textAlignment={'left'} key={'textAlignLeftButton'} />,
    <TextAlignButton textAlignment={'center'} key={'textAlignCenterButton'} />,
    <TextAlignButton textAlignment={'right'} key={'textAlignRightButton'} />,
    <ColorStyleButton key={'colorStyleButton'} />,
    <NestBlockButton key={'nestBlockButton'} />,
    <UnnestBlockButton key={'unnestBlockButton'} />,
    <CreateLinkButton key={'createLinkButton'} />,
  ];

interface CustomFormattingToolbarProps {
  children?: React.ReactNode;
  onAIButtonClick?: (selectedText: string, block: any) => void;
}

/**
 * Custom formatting toolbar for single-user mode (comments removed)
 */
export function CustomFormattingToolbar(props: CustomFormattingToolbarProps) {
  const Components = useComponentsContext();

  if (!Components?.FormattingToolbar) {
    return (
      <div className="text-red-500 p-2">
        FormattingToolbar is not available. Make sure your editor is wrapped in
        the correct provider.
      </div>
    );
  }

  return (
    <Components.FormattingToolbar.Root
      className={'bn-toolbar bn-formatting-toolbar'}
    >
      {props.children ||
        getFormattingToolbarItems(
          props.onAIButtonClick || (() => {})
        )}
    </Components.FormattingToolbar.Root>
  );
}

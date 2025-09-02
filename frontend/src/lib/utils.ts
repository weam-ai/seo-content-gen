import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { diffWords } from 'diff';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Diff two arrays of blocks and return two arrays with diff highlights
export function diffBlocks(leftBlocks: any[], rightBlocks: any[]) {
  // Helper to get content array from block
  const getContent = (block: any) =>
    block.content ?? block.props?.content ?? [];

  // Match blocks by index (simple version)
  const maxLen = Math.max(leftBlocks.length, rightBlocks.length);
  const leftResult: any[] = [];
  const rightResult: any[] = [];

  for (let i = 0; i < maxLen; i++) {
    const left = leftBlocks[i];
    const right = rightBlocks[i];
    if (left && right && left.type === right.type) {
      // Diff their content
      const leftContent = getContent(left);
      const rightContent = getContent(right);
      const leftText = (leftContent ?? []).map((n: any) => n.text).join('');
      const rightText = (rightContent ?? []).map((n: any) => n.text).join('');
      const diff = diffWords(leftText, rightText);
      // For left: show removed and unchanged
      const leftDiff = diff
        .filter((part) => !part.added)
        .map((part, idx) => ({
          type: 'text',
          text: part.value,
          removed: part.removed,
          key: idx,
        }));
      // For right: show added and unchanged
      const rightDiff = diff
        .filter((part) => !part.removed)
        .map((part, idx) => ({
          type: 'text',
          text: part.value,
          added: part.added,
          key: idx,
        }));
      leftResult.push({ ...left, content: leftDiff });
      rightResult.push({ ...right, content: rightDiff });
    } else if (left && !right) {
      // Block only in left (removed)
      leftResult.push({ ...left, removed: true });
    } else if (!left && right) {
      // Block only in right (added)
      rightResult.push({ ...right, added: true });
    }
  }
  return { left: leftResult, right: rightResult };
}

// Diff the entire document as a single block with highlights
export function diffWholeDocument(leftBlocks: any[], rightBlocks: any[]) {
  // Flatten all text from all blocks
  const flatten = (blocks: any[]) =>
    (blocks ?? [])
      .map((block) => {
        const content = block.content ?? block.props?.content ?? [];
        return (content ?? []).map((n: any) => n.text).join('');
      })
      .join('\n'); // Use newline to separate blocks

  const leftText = flatten(leftBlocks);
  const rightText = flatten(rightBlocks);

  const diff = diffWords(leftText, rightText);

  // Return as a single paragraph block for each side
  const leftBlock = {
    id: 'diff-left',
    type: 'paragraph',
    content: diff
      .filter((part) => !part.added)
      .map((part, idx) => ({
        type: 'text',
        text: part.value,
        removed: part.removed,
        key: idx,
      })),
  };
  const rightBlock = {
    id: 'diff-right',
    type: 'paragraph',
    content: diff
      .filter((part) => !part.removed)
      .map((part, idx) => ({
        type: 'text',
        text: part.value,
        added: part.added,
        key: idx,
      })),
  };

  return { left: [leftBlock], right: [rightBlock] };
}

// Diff the entire document as paragraphs with highlights
export function diffWholeDocumentByParagraph(
  leftBlocks: any[],
  rightBlocks: any[]
) {
  // Flatten all text from all blocks, separated by newlines
  const flatten = (blocks: any[]) =>
    (blocks ?? [])
      .map((block) => {
        const content = block.content ?? block.props?.content ?? [];
        return (content ?? []).map((n: any) => n.text).join('');
      })
      .join('\n');

  const leftText = flatten(leftBlocks);
  const rightText = flatten(rightBlocks);

  const diff = diffWords(leftText, rightText);

  // Split diff result on newlines, preserving diff highlights
  function splitDiffByParagraph(diffArr: any[], isLeft: boolean) {
    const paragraphs: any[][] = [[]];
    diffArr.forEach((part, idx) => {
      const lines = part.value.split('\n');
      lines.forEach((line: string, i: number) => {
        if (i > 0) paragraphs.push([]);
        if (line.length > 0) {
          paragraphs[paragraphs.length - 1].push({
            type: 'text',
            text: line,
            ...(isLeft ? { removed: part.removed } : { added: part.added }),
            key: idx + '-' + i,
          });
        }
      });
    });
    return paragraphs;
  }

  const leftParagraphs = splitDiffByParagraph(
    diff.filter((part) => !part.added),
    true
  );
  const rightParagraphs = splitDiffByParagraph(
    diff.filter((part) => !part.removed),
    false
  );

  const leftBlocksResult = leftParagraphs.map((content, idx) => ({
    id: `diff-left-${idx}`,
    type: 'paragraph',
    props: { content }, // ensure props.content for BlockRenderer
  }));
  const rightBlocksResult = rightParagraphs.map((content, idx) => ({
    id: `diff-right-${idx}`,
    type: 'paragraph',
    props: { content }, // ensure props.content for BlockRenderer
  }));

  return { left: leftBlocksResult, right: rightBlocksResult };
}

// Block-aware diff that preserves block type and formatting
export function diffBlocksByStructure(leftBlocks: any[], rightBlocks: any[]) {
  const maxLen = Math.max(leftBlocks.length, rightBlocks.length);
  const leftResult: any[] = [];
  const rightResult: any[] = [];

  for (let i = 0; i < maxLen; i++) {
    const left = leftBlocks[i];
    const right = rightBlocks[i];
    if (left && right && left.type === right.type) {
      // Diff inline content for matching block types
      const leftContent = (left.props?.content ?? left.content ?? []);
      const rightContent = (right.props?.content ?? right.content ?? []);
      const leftText = leftContent.map((n: any) => n.text).join('');
      const rightText = rightContent.map((n: any) => n.text).join('');
      const diff = diffWords(leftText, rightText);
      const leftDiff = diff
        .filter((part) => !part.added)
        .map((part, idx) => ({
          type: 'text',
          text: part.value,
          removed: part.removed,
          key: idx,
        }));
      const rightDiff = diff
        .filter((part) => !part.removed)
        .map((part, idx) => ({
          type: 'text',
          text: part.value,
          added: part.added,
          key: idx,
        }));
      // Always output correct structure for supported block types
      if ([
        'paragraph',
        'heading',
        'quote',
        'numberedListItem',
        'bulletedListItem',
      ].includes(left.type)) {
        leftResult.push({
          id: left.id || `diff-left-${i}`,
          type: left.type,
          props: { ...(left.props || {}), content: leftDiff },
        });
        rightResult.push({
          id: right.id || `diff-right-${i}`,
          type: right.type,
          props: { ...(right.props || {}), content: rightDiff },
        });
      } else if (left.type === 'bulleted-list' || left.type === 'numbered-list') {
        // For lists, preserve items
        leftResult.push({
          id: left.id || `diff-left-${i}`,
          type: left.type,
          props: { ...(left.props || {}) },
        });
        rightResult.push({
          id: right.id || `diff-right-${i}`,
          type: right.type,
          props: { ...(right.props || {}) },
        });
      } else if (left.type === 'code') {
        leftResult.push({
          id: left.id || `diff-left-${i}`,
          type: left.type,
          props: { ...(left.props || {}) },
        });
        rightResult.push({
          id: right.id || `diff-right-${i}`,
          type: right.type,
          props: { ...(right.props || {}) },
        });
      } else {
        // Fallback: pass through
        leftResult.push(left);
        rightResult.push(right);
      }
    } else if (left && !right) {
      // Block only in left (removed)
      if ([
        'paragraph',
        'heading',
        'quote',
        'numberedListItem',
        'bulletedListItem',
      ].includes(left.type)) {
        leftResult.push({
          id: left.id || `diff-left-${i}`,
          type: left.type,
          props: { ...(left.props || {}), content: getRemovedContent(left) },
        });
      } else {
        leftResult.push(left);
      }
    } else if (!left && right) {
      // Block only in right (added)
      if ([
        'paragraph',
        'heading',
        'quote',
        'numberedListItem',
        'bulletedListItem',
      ].includes(right.type)) {
        rightResult.push({
          id: right.id || `diff-right-${i}`,
          type: right.type,
          props: { ...(right.props || {}), content: getAddedContent(right) },
        });
      } else {
        rightResult.push(right);
      }
    }
  }
  return { left: leftResult, right: rightResult };
}

// Helpers for marking all content as added/removed
function getRemovedContent(block: any) {
  const content = block.props?.content ?? block.content ?? [];
  return (content ?? []).map((n: any, idx: number) => ({ ...n, removed: true, key: idx }));
}
function getAddedContent(block: any) {
  const content = block.props?.content ?? block.content ?? [];
  return (content ?? []).map((n: any, idx: number) => ({ ...n, added: true, key: idx }));
}

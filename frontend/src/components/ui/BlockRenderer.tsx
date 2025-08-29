import React from 'react';
import { diffWords } from 'diff';

// Types for inline formatting
export type InlineNode = {
  type: 'text';
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  code?: boolean;
  // Add more as needed
};

export type Block =
  | {
      id: string;
      type: 'paragraph';
      props: { content?: InlineNode[] };
    }
  | {
      id: string;
      type: 'heading';
      props: { level: number; content?: InlineNode[] };
    }
  | {
      id: string;
      type: 'bulleted-list';
      props: { items?: InlineNode[][] };
    }
  | {
      id: string;
      type: 'numbered-list';
      props: { items?: InlineNode[][] };
    }
  | {
      id: string;
      type: 'quote';
      props: { content?: InlineNode[] };
    }
  | {
      id: string;
      type: 'code';
      props: { content: string };
    }
  | {
      id: string;
      type: 'numberedListItem';
      props: { content?: InlineNode[] };
    }
  | {
      id: string;
      type: 'bulletedListItem';
      props: { content?: InlineNode[] };
    }
  | {
      id: string;
      type: 'bulletListItem';
      props: { content?: InlineNode[] };
    }
  | {
      id: string;
      type: 'numberListItem';
      props: { content?: InlineNode[] };
    }
  | {
      id: string;
      type: 'table';
      content: { rows: any[]; headerRows?: number };
    };
// Add more block types as needed

export interface BlockRendererProps {
  content: string; // JSON string
}

const renderInline = (nodes?: InlineNode[]) =>
  (nodes ?? []).map((node, i) => {
    let el: React.ReactNode = node.text;
    if (node.bold) el = <strong key={i}>{el}</strong>;
    if (node.italic) el = <em key={i}>{el}</em>;
    if (node.underline) el = <u key={i}>{el}</u>;
    if (node.code)
      el = (
        <code key={i} className="bg-gray-100 px-1 rounded">
          {el}
        </code>
      );
    // Diff highlighting
    if ((node as any).added)
      el = (
        <span key={i} className="bg-green-100 text-green-800">
          {el}
        </span>
      );
    if ((node as any).removed)
      el = (
        <span key={i} className="bg-red-100 text-red-800 line-through">
          {el}
        </span>
      );
    return <React.Fragment key={i}>{el}</React.Fragment>;
  });

// Helper to get content array from either block.content or block.props.content
const getBlockContent = (block: any) =>
  block.content ?? block.props?.content ?? [];

// Utility to get word-level diff between two strings
export function getWordDiff(oldStr: string, newStr: string) {
  return diffWords(oldStr, newStr);
}

const BlockRenderer: React.FC<BlockRendererProps> = ({ content }) => {
  let blocks: Block[] = [];
  if (
    !content ||
    typeof content !== 'string' ||
    content.trim() === '' ||
    content === 'null' ||
    content === '[]' ||
    content === '{}' ||
    content === 'undefined'
  ) {
    return <div style={{ minHeight: 24 }} />;
  }
  try {
    blocks = JSON.parse(content);
    // Patch: ensure all blocks have props.content if content exists at root
    blocks = (blocks ?? []).map((block: any, _idx: number) => {
      if (
        (block.type === 'paragraph' ||
          block.type === 'heading' ||
          block.type === 'numberedListItem' ||
          block.type === 'bulletedListItem' ||
          block.type === 'quote') &&
        !block.props?.content &&
        block.content
      ) {
        return {
          ...block,
          props: { ...(block.props || {}), content: block.content },
        };
      }
      return block;
    });
    // End patch
    console.log('BlockRenderer blocks:', blocks); // Debug log
  } catch {
    console.error('BlockRenderer: Invalid content format', content); // Log raw content on error
    return <div className="text-red-500">Invalid content format</div>;
  }

  return (
    <div className="space-y-4">
      {(blocks ?? []).map((block: Block, idx) => {
        console.log('BlockRenderer block', idx, block, block.type); // Debug log for each block
        switch (block.type) {
          case 'heading': {
            // Defensive: If no valid level, or content is too long, render as paragraph
            const level = block.props?.level;
            const text = getBlockContent(block)
              .map((n: any) => n.text || '')
              .join('');
            if (!level || typeof level !== 'number' || text.length > 150) {
              return (
                <p key={block.id || idx} className="text-base">
                  {renderInline(getBlockContent(block))}
                </p>
              );
            }
            const Tag = `h${level}` as keyof JSX.IntrinsicElements;
            return (
              <Tag
                key={block.id || idx}
                className={`font-bold mt-4 text-${
                  level === 1 ? '2xl' : level === 2 ? 'xl' : 'lg'
                }`}
              >
                {renderInline(getBlockContent(block))}
              </Tag>
            );
          }
          case 'paragraph':
            return (
              <p key={block.id || idx} className="text-base">
                {renderInline(getBlockContent(block))}
              </p>
            );
          case 'numberedListItem':
          case 'numberListItem': // Support alternate spelling
            return (
              <li key={block.id || idx} className="ml-6 list-decimal">
                {renderInline(getBlockContent(block))}
              </li>
            );
          case 'bulletedListItem':
          case 'bulletListItem': // Support alternate spelling
            return (
              <li key={block.id || idx} className="ml-6 list-disc">
                {renderInline(getBlockContent(block))}
              </li>
            );
          case 'bulleted-list':
            return (
              <ul key={block.id || idx} className="list-disc ml-6">
                {(block.props.items ?? []).map((item, itemIdx) => (
                  <li key={itemIdx}>{renderInline(item)}</li>
                ))}
              </ul>
            );
          case 'numbered-list':
            return (
              <ol key={block.id || idx} className="list-decimal ml-6">
                {(block.props.items ?? []).map((item, itemIdx) => (
                  <li key={itemIdx}>{renderInline(item)}</li>
                ))}
              </ol>
            );
          case 'quote':
            return (
              <blockquote
                key={block.id || idx}
                className="border-l-4 pl-4 italic text-gray-600"
              >
                {renderInline(getBlockContent(block))}
              </blockquote>
            );
          case 'code':
            return (
              <pre
                key={block.id || idx}
                className="bg-gray-100 rounded p-2 overflow-x-auto"
              >
                <code>{block.props.content}</code>
              </pre>
            );
          case 'table': {
            // Defensive: check for tableContent in props
            const tableContent = block.content;
            if (
              !tableContent ||
              typeof tableContent !== 'object' ||
              !Array.isArray(tableContent.rows)
            ) {
              return (
                <div key={block.id || idx} className="text-xs text-red-500">
                  Malformed table block
                </div>
              );
            }
            const { rows, headerRows = 1 } = tableContent;
            return (
              <div key={block.id || idx} className="overflow-x-auto">
                <table className="min-w-full border border-gray-300 rounded text-sm">
                  <tbody>
                    {rows.map((row: any, rowIdx: number) => (
                      <tr key={rowIdx}>
                        {row.cells.map((cell: any, cellIdx: number) => {
                          const isHeader = rowIdx < headerRows;
                          const Tag = isHeader ? 'th' : 'td';
                          // Inline style for alignment, background, etc.
                          const style: React.CSSProperties = {
                            textAlign: cell.props?.textAlignment || 'left',
                          };
                          // Optionally add background or text color if not default
                          if (
                            cell.props?.backgroundColor &&
                            cell.props.backgroundColor !== 'default'
                          ) {
                            style.backgroundColor = cell.props.backgroundColor;
                          }
                          if (
                            cell.props?.textColor &&
                            cell.props.textColor !== 'default'
                          ) {
                            style.color = cell.props.textColor;
                          }
                          return (
                            <Tag
                              key={cellIdx}
                              colSpan={cell.props?.colspan || 1}
                              rowSpan={cell.props?.rowspan || 1}
                              style={style}
                              className={`border border-gray-300 px-2 py-1 ${
                                isHeader ? 'font-bold bg-gray-100' : ''
                              }`}
                            >
                              {/* Render cell content, supporting styles */}
                              {(cell.content || []).map((n: any, i: number) => {
                                let el: React.ReactNode = n.text;
                                // Support for styles object (bold, italic, etc.)
                                if (n.styles) {
                                  if (n.styles.bold)
                                    el = <strong key={i}>{el}</strong>;
                                  if (n.styles.italic)
                                    el = <em key={i}>{el}</em>;
                                  if (n.styles.underline)
                                    el = <u key={i}>{el}</u>;
                                  if (n.styles.code)
                                    el = <code key={i}>{el}</code>;
                                }
                                return (
                                  <React.Fragment key={i}>{el}</React.Fragment>
                                );
                              })}
                            </Tag>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }
          default:
            // Type guard for Block
            const hasId =
              typeof block === 'object' &&
              block !== null &&
              'id' in block &&
              typeof (block as any).id === 'string';
            return (
              <div
                key={hasId ? (block as any).id : idx}
                className="text-xs text-red-500"
              >
                Unsupported or malformed block
              </div>
            );
        }
      })}
    </div>
  );
};

export default BlockRenderer;

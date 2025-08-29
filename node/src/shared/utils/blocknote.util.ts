import { marked } from 'marked';

export interface Block {
  type: string;
  content: any[];
  props?: Record<string, any>;
}

export const markdownToBlocks = (markdown: string): Block[] => {
  if (!markdown) return [];

  const cleanedMarkdown = markdown
    .replace(/\\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^(\s*)[+*](\s*)\*\*/g, '$1- $2**')
    .replace(/(\n\s*)\n(\s*[-*+])/g, '$1$2')
    .replace(/^(\d+)\.\s+/gm, (match, p1) => `${p1}. `)
    .replace(/(\n)(\d+)\.\s+/gm, (match, p1, p2) => `${p1}${p2}. `)
    .split('\n\n')
    .map((p) => p.trim())
    .join('\n\n');
  const lexer = marked.lexer(cleanedMarkdown);

  interface Block {
    type: string;
    content: any[];
    props?: Record<string, any>;
  }

  const blocks: Block[] = [];

  interface TextNode {
    type: 'text';
    text: string;
    styles: StylesObject;
  }

  interface LinkNode {
    type: 'link';
    content: InlineNode[];
    props: {
      href: string;
    };
  }

  type InlineNode = TextNode | LinkNode;

  interface StylesObject {
    bold?: boolean;
    italic?: boolean;
    code?: boolean;
    [key: string]: boolean | undefined;
  }

  interface Token {
    type: string;
    text?: string;
    tokens?: Token[];
    raw?: string;
    href?: string;
  }

  const parseInline = (
    tokens: Token[],
    styles: StylesObject = {},
  ): InlineNode[] => {
    return tokens.flatMap((token: Token): InlineNode[] => {
      const currentStyles: StylesObject = { ...styles };

      switch (token.type) {
        case 'text':
          if (token.text && token.text.includes('**')) {
            const parts: TextNode[] = [];
            let remaining: string = token.text;
            let boldStart: number = remaining.indexOf('**');

            while (boldStart !== -1) {
              if (boldStart > 0) {
                parts.push({
                  type: 'text',
                  text: remaining.substring(0, boldStart),
                  styles: currentStyles,
                });
              }

              remaining = remaining.substring(boldStart + 2);
              const boldEnd: number = remaining.indexOf('**');

              if (boldEnd !== -1) {
                parts.push({
                  type: 'text',
                  text: remaining.substring(0, boldEnd),
                  styles: { ...currentStyles, bold: true },
                });
                remaining = remaining.substring(boldEnd + 2);
                boldStart = remaining.indexOf('**');
              } else {
                parts.push({
                  type: 'text',
                  text: '**' + remaining,
                  styles: currentStyles,
                });
                break;
              }
            }

            if (remaining && !remaining.includes('**')) {
              parts.push({
                type: 'text',
                text: remaining,
                styles: currentStyles,
              });
            }

            return parts;
          }
          return [
            {
              type: 'text',
              text: token.text || '',
              styles: currentStyles,
            },
          ];

        case 'em':
          return parseInline(token.tokens || [], {
            ...currentStyles,
            italic: true,
          });

        case 'strong':
          return parseInline(token.tokens || [], {
            ...currentStyles,
            bold: true,
          });

        case 'link':
          return [
            {
              type: 'link',
              content: parseInline(token.tokens || [], currentStyles),
              props: { href: token.href || '' },
            },
          ];

        case 'codespan':
          return [
            {
              type: 'text',
              text: token.text || '',
              styles: { ...currentStyles, code: true },
            },
          ];

        default:
          return [
            {
              type: 'text',
              text: token.raw || '',
              styles: currentStyles,
            },
          ];
      }
    });
  };

  const processToken = (token) => {
    switch (token.type) {
      case 'heading':
        return {
          type: 'heading',
          content: parseInline(token.tokens),
          props: { level: token.depth },
        };

      case 'paragraph': {
        const paraContent = parseInline(token.tokens);
        return paraContent.length > 0
          ? {
              type: 'paragraph',
              content: paraContent,
            }
          : null;
      }

      case 'list':
        interface ListItem {
          tokens: Token[];
        }

        interface ListToken extends Token {
          items: ListItem[];
          ordered: boolean;
          start?: number;
        }

        interface ListItemBlock {
          type: string;
          content: InlineNode[];
          props: {
            level: number;
            number?: number;
          };
        }

        return (token as ListToken).items
          .map((item: ListItem, index: number) => {
            const itemContent: InlineNode[] = parseInline(item.tokens);
            return {
              type: (token as ListToken).ordered
                ? 'numberedListItem'
                : 'bulletListItem',
              content: itemContent,
              props: {
                level: 0,
                number: (token as ListToken).ordered
                  ? ((token as ListToken).start || 0) + index
                  : undefined,
              },
            } as ListItemBlock;
          })
          .filter((block: ListItemBlock) => block.content.length > 0);

      case 'code':
        return {
          type: 'codeBlock',
          content: [{ type: 'text', text: token.code, styles: {} }],
          props: { language: token.lang || 'plaintext' },
        };

      case 'blockquote':
        return {
          type: 'paragraph',
          content: parseInline([token]),
          props: { textAlignment: 'right' },
        };

      default:
        return {
          type: 'paragraph',
          content: parseInline([token]),
        };
    }
  };

  lexer.forEach((token) => {
    const block = processToken(token);
    if (!block) return;

    if (Array.isArray(block)) {
      blocks.push(...block.filter((b) => b?.content?.length > 0));
    } else {
      blocks.push(block);
    }
  });

  return blocks.filter((block) => {
    return (
      block.content?.length > 0 &&
      !block.content.every((c) => c.text?.trim() === '')
    );
  });
};

/**
 * Converts an array of BlockNote blocks to Markdown.
 * Supports headings, paragraphs, bullet/numbered lists, code blocks, blockquotes, and inline styles.
 */
export const blocksToMarkdown = (blocks: Block[]): string => {
  if (!Array.isArray(blocks)) return '';

  // Helper to serialize inline content
  const serializeInline = (content: any[]): string => {
    return (content || [])
      .map((node) => {
        if (node.type === 'text') {
          let text = node.text || '';
          if (node.styles) {
            if (node.styles.bold) text = `**${text}**`;
            if (node.styles.italic) text = `_${text}_`;
            if (node.styles.code) text = `${text}`;
          }
          return text;
        } else if (node.type === 'link') {
          const inner = serializeInline(node.content);
          return `[${inner}](${node.props?.href || '#'})`;
        }
        return node.text || '';
      })
      .join('');
  };

  // Helper to serialize a block
  const serializeBlock = (block: Block): string => {
    switch (block.type) {
      case 'heading': {
        const level = block.props?.level || 1;
        return `${'#'.repeat(level)} ${serializeInline(block.content)}`;
      }
      case 'paragraph': {
        return serializeInline(block.content);
      }
      case 'bulletListItem': {
        return `- ${serializeInline(block.content)}`;
      }
      case 'numberedListItem': {
        // Optionally use block.props.number for explicit numbering
        return `1. ${serializeInline(block.content)}`;
      }
      case 'codeBlock': {
        const lang = block.props?.language || '';
        const code = (block.content && block.content[0]?.text) || '';
        return `\n\n\u001C${lang}\n${code}\n\u001D`;
      }
      case 'blockquote': {
        return `> ${serializeInline(block.content)}`;
      }
      default: {
        return serializeInline(block.content);
      }
    }
  };

  // Group consecutive list items
  const result: string[] = [];
  let i = 0;
  while (i < blocks.length) {
    const block = blocks[i];
    if (block.type === 'bulletListItem' || block.type === 'numberedListItem') {
      const listType = block.type;
      const listBlocks: Block[] = [];
      while (
        i < blocks.length &&
        blocks[i].type === listType
      ) {
        listBlocks.push(blocks[i]);
        i++;
      }
      if (listType === 'bulletListItem') {
        result.push(listBlocks.map((b) => `- ${serializeInline(b.content)}`).join('\n'));
      } else {
        result.push(listBlocks.map((b, idx) => `${idx + 1}. ${serializeInline(b.content)}`).join('\n'));
      }
      continue;
    }
    result.push(serializeBlock(block));
    i++;
  }

  // Clean up code block markers and inline code
  let markdown = result.join('\n\n');
  markdown = markdown.replace(/\u001C/g, '`').replace(/\u001D/g, '`'); // Inline code
  markdown = markdown.replace(/\\n\\n\\u007F{3}/g, '\n\n```'); // Code block start
  markdown = markdown.replace(/\\u007F{3}/g, '```'); // Code block end
  return markdown.trim();
};

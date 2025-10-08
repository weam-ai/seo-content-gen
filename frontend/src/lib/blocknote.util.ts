import { marked } from 'marked';

export interface Block {
  type: string;
  content: any[];
  props?: Record<string, any>;
}

// Dynamic link mappings - can be populated at runtime
let DYNAMIC_LINK_MAPPINGS: Record<string, string> = {};

// Utility functions to manage dynamic link mappings
export const addLinkMapping = (linkText: string, url: string): void => {
  DYNAMIC_LINK_MAPPINGS[linkText] = url;
};

export const addLinkMappings = (mappings: Record<string, string>): void => {
  DYNAMIC_LINK_MAPPINGS = { ...DYNAMIC_LINK_MAPPINGS, ...mappings };
};

export const clearLinkMappings = (): void => {
  DYNAMIC_LINK_MAPPINGS = {};
};

export const getLinkMappings = (): Record<string, string> => {
  return { ...DYNAMIC_LINK_MAPPINGS };
};

// Function to recover original URL from link text
function recoverOriginalUrl(linkText: string, currentHref: string): string {
  // If current href is already a valid external URL, use it
  if (
    currentHref &&
    (currentHref.startsWith('http://') || currentHref.startsWith('https://')) &&
    !currentHref.includes('localhost')
  ) {
    return currentHref;
  }

  // Try exact match first
  if (DYNAMIC_LINK_MAPPINGS[linkText]) {
    return DYNAMIC_LINK_MAPPINGS[linkText];
  }

  // Try partial matches (case insensitive)
  const lowerLinkText = linkText.toLowerCase();
  for (const [knownText, url] of Object.entries(DYNAMIC_LINK_MAPPINGS)) {
    if (
      lowerLinkText.includes(knownText.toLowerCase()) ||
      knownText.toLowerCase().includes(lowerLinkText)
    ) {
      return url;
    }
  }

  // If link text itself is a URL, use it
  if (linkText.startsWith('http://') || linkText.startsWith('https://')) {
    return linkText;
  }

  // Return original href as fallback
  return currentHref;
}

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
            if (node.styles.code) text = `\u001C${text}\u001D`;
          }
          return text;
        } else if (node.type === 'link') {
          const inner = serializeInline(node.content);
          let href = node.props?.href || '#';

          // Handle corrupted local URLs that should be external
          if (
            href.includes('localhost:3000') ||
            href.startsWith('/articles/') ||
            href === '#'
          ) {
            // First, check if we have the original URL stored
            const originalHref =
              node.props?.originalHref ||
              node.props?.externalHref ||
              node.props?.originalUrl;
            if (
              originalHref &&
              (originalHref.startsWith('http://') ||
                originalHref.startsWith('https://'))
            ) {
              href = originalHref;
            } else {
              // Use the recovery function to find the original URL
              const recoveredUrl = recoverOriginalUrl(inner, href);
              if (recoveredUrl !== href) {
                href = recoveredUrl;
              } else {
                console.warn('Could not recover original URL for link:', {
                  inner,
                  href,
                  node,
                });
              }
            }
          }

          return `[${inner}](${href})`;
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
      const listBlocks = [];
      while (i < blocks.length && blocks[i].type === listType) {
        listBlocks.push(blocks[i]);
        i++;
      }
      if (listType === 'bulletListItem') {
        result.push(
          listBlocks.map((b) => `- ${serializeInline(b.content)}`).join('\n')
        );
      } else {
        result.push(
          listBlocks
            .map((b, idx) => `${idx + 1}. ${serializeInline(b.content)}`)
            .join('\n')
        );
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

/**
 * Converts an array of BlockNote blocks to HTML.
 * Supports headings, paragraphs, bullet/numbered lists, code blocks, blockquotes, and inline styles.
 */
export const blocksToHTML = (blocks: Block[]): string => {
  if (!Array.isArray(blocks)) return '';

  // Helper to serialize inline content
  const serializeInline = (content: any[]): string => {
    return (content || [])
      .map((node) => {
        if (node.type === 'text') {
          let text = node.text || '';
          if (node.styles) {
            if (node.styles.bold) text = `<strong>${text}</strong>`;
            if (node.styles.italic) text = `<em>${text}</em>`;
            if (node.styles.underline) text = `<u>${text}</u>`;
            if (node.styles.strike) text = `<s>${text}</s>`;
          }
          return text;
        } else if (node.type === 'link') {
          const inner = serializeInline(node.content);
          let href = node.props?.href || node.href || '#';
          return `<a href="${href}" target="_blank">${inner}</a>`;
        }
        // Add more node types as needed
        return '';
      })
      .join('');
  };

  // Helper to serialize a block
  const serializeBlock = (block: Block): string => {

    // Robust heading detection
    if (block.type.startsWith('heading')) {
      let level = block.props?.level;
      if (!level) {
        const match = block.type.match(/^heading([1-6])$/);
        level = match ? Number(match[1]) : 1;
      }
      // Clamp level between 1 and 6
      level = Math.max(1, Math.min(6, level));
      return `<h${level}>${serializeInline(block.content)}</h${level}>`;
    }
    switch (block.type) {
      case 'paragraph': {
        return `<p>${serializeInline(block.content)}</p>`;
      }
      case 'bulletListItem': {
        return `<li>${serializeInline(block.content)}</li>`;
      }
      case 'numberedListItem': {
        return `<li>${serializeInline(block.content)}</li>`;
      }
      case 'codeBlock': {
        const lang = block.props?.language || '';
        const code = (block.content && block.content[0]?.text) || '';
        return `<pre><code${
          lang ? ` class="language-${lang}"` : ''
        }>${code}</code></pre>`;
      }
      case 'blockquote': {
        return `<blockquote>${serializeInline(block.content)}</blockquote>`;
      }
      default: {
        return serializeInline(block.content);
      }
    }
  };

  // Group consecutive list items
  let html = '';
  let i = 0;
  while (i < blocks.length) {
    const block = blocks[i];
    if (block.type === 'bulletListItem' || block.type === 'numberedListItem') {
      const listType = block.type;
      const listBlocks = [];
      while (i < blocks.length && blocks[i].type === listType) {
        listBlocks.push(blocks[i]);
        i++;
      }
      if (listType === 'bulletListItem') {
        html += `<ul>${listBlocks.map((b) => serializeBlock(b)).join('')}</ul>`;
      } else {
        html += `<ol>${listBlocks.map((b) => serializeBlock(b)).join('')}</ol>`;
      }
      continue;
    }
    html += serializeBlock(block);
    i++;
  }
  return html;
};

export const markdownToBlocks = (markdown: string): Block[] => {
  if (!markdown) return [];

  // Normalize headings and links to ensure proper parsing
  // This fixes issues where paragraphs are incorrectly identified as headings
  const normalizedMarkdown = markdown
    // Ensure proper heading format with space after #
    .replace(/^(#{1,6})([^#\s])/gm, '$1 $2')
    // Fix headings that don't have proper spacing
    .replace(/^(#{1,6})\s+/gm, (match) => match.trim() + ' ')
    // Ensure paragraphs that start with numbers aren't treated as lists
    .replace(/^(\d+)\.(?!\s)/gm, '$1\\. ')
    // Don't auto-convert URLs in markdown links - we want to preserve the original format
    // Convert plain URLs to markdown links if they're not already in a link format
    .replace(/(?<!\]\()(?<!\[)(https?:\/\/[^\s\]]+)(?!\))/g, (match) => {
      // Don't convert if it's already part of a markdown link
      return `[${match}](${match})`;
    });

  const cleanedMarkdown = normalizedMarkdown
    .replace(/\\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^(\s*)[+*](\s*)\*\*/g, '$1- $2**')
    .replace(/(\n\s*)\n(\s*[-*+])/g, '$1$2')
    .replace(/^(\d+)\.\s+/gm, (_match, p1) => `${p1}. `)
    .replace(/(\n)(\d+)\.\s+/gm, (_match, p1, p2) => `${p1}${p2}. `)
    .split('\n\n')
    .map((p) => p.trim())
    .join('\n\n');
  // Configure marked options to better handle links
  const markedOptions = {
    gfm: true,
    breaks: true,
    pedantic: false,
    smartLists: true,
    smartypants: false,
  };

  const lexer = marked.lexer(cleanedMarkdown, markedOptions);

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
      originalHref?: string;
      originalUrl?: string;
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
    styles: StylesObject = {}
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
          // Parse the tokens within the link to get its content, preserving inline styles
          const linkContent: InlineNode[] = parseInline(
            token.tokens || [],
            currentStyles
          );

          const href = token.href || '';

          return [
            {
              type: 'link',
              content: linkContent,
              props: {
                href: href,
                originalHref: href, // Store original for recovery
                originalUrl: href, // Alternative storage
              },
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

  const processToken = (token: any) => {
    switch (token.type) {
      case 'heading':
        // Validate heading - ensure it's a proper heading with valid depth
        if (token.depth >= 1 && token.depth <= 6) {
          return {
            type: 'heading',
            content: parseInline(token.tokens),
            props: { level: token.depth },
          };
        } else {
          // If heading depth is invalid, treat as paragraph
          console.warn('Invalid heading depth, treating as paragraph:', token);
          return {
            type: 'paragraph',
            content: parseInline(token.tokens),
          };
        }

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

  // Process blocks to convert plain URL text to proper links
  const processedBlocks = blocks.map((block) => {
    if (block.type === 'paragraph' && block.content) {
      // Look for URL patterns in text nodes
      const newContent = [];
      for (const node of block.content) {
        if (node.type === 'text' && node.text) {
          // Enhanced URL regex pattern to handle various URL formats
          const urlRegex = /(https?:\/\/[^\s\]]+)/g;
          let lastIndex = 0;
          let match;
          const textParts = [];
          // Find all URLs in the text
          while ((match = urlRegex.exec(node.text)) !== null) {
            // Add text before the URL
            if (match.index > lastIndex) {
              const beforeText = node.text.substring(lastIndex, match.index);
              if (beforeText.trim()) {
                textParts.push({
                  type: 'text',
                  text: beforeText,
                  styles: node.styles || {},
                });
              }
            }

            // Clean up the URL (remove trailing punctuation that might not be part of the URL)
            let url = match[0];
            let trailingPunctuation = '';

            // Check for trailing punctuation
            const trailingPunctuationRegex = /[.,;:!?)\]]+$/;
            const punctuationMatch = url.match(trailingPunctuationRegex);
            if (punctuationMatch) {
              trailingPunctuation = punctuationMatch[0];
              url = url.slice(0, -trailingPunctuation.length);
            }

            // Add the URL as a link with original URL preservation
            textParts.push({
              type: 'link',
              content: [
                {
                  type: 'text',
                  text: url,
                  styles: {},
                },
              ],
              props: {
                href: url,
                originalHref: url, // Store original for recovery
                originalUrl: url, // Alternative storage
              },
            });

            // Add trailing punctuation as separate text if any
            if (trailingPunctuation) {
              textParts.push({
                type: 'text',
                text: trailingPunctuation,
                styles: node.styles || {},
              });
            }

            lastIndex = match.index + match[0].length;
          }

          // Add remaining text after the last URL
          if (lastIndex < node.text.length) {
            const remainingText = node.text.substring(lastIndex);
            if (remainingText.trim()) {
              textParts.push({
                type: 'text',
                text: remainingText,
                styles: node.styles || {},
              });
            }
          }

          // If we found URLs, use the parts; otherwise, keep the original node
          if (textParts.length > 0) {
            newContent.push(...textParts);
          } else {
            newContent.push(node);
          }
        } else {
          newContent.push(node);
        }
      }

      return {
        ...block,
        content: newContent,
      };
    }
    return block;
  });

  return processedBlocks.filter((block) => {
    return (
      block.content?.length > 0 &&
      !block.content.every((c) => c.text?.trim() === '')
    );
  });
};

import { createReactInlineContentSpec } from '@blocknote/react';

// Props for the grammar marker
export interface GrammarMarkerProps {
  originalText: string;
  suggestions: string; // Store as comma-separated string for BlockNote compatibility
  message: string;
  type: 'spelling' | 'grammar' | 'punctuation' | 'style';
  severity: 'error' | 'warning' | 'suggestion';
  issueId: string;
}

// Grammar marker component
const GrammarMarkerComponent = ({ inlineContent }: any) => {
  const { originalText, type, severity, message, suggestions } =
    inlineContent.props;

  // Get appropriate styling based on type and severity
  const getMarkerStyle = () => {
    const baseStyle = {
      position: 'relative' as const,
      cursor: 'pointer',
      borderRadius: '2px',
      padding: '0 1px',
      display: 'inline',
      // Prevent layout shifts that could cause cursor flickering
      verticalAlign: 'baseline',
    };

    switch (type) {
      case 'spelling':
        return {
          ...baseStyle,
          backgroundColor:
            severity === 'error'
              ? 'rgba(248, 113, 113, 0.12)' // More visible red for errors
              : 'rgba(251, 191, 36, 0.12)', // More visible amber for warnings
          borderBottom:
            severity === 'error' ? '2px wavy #f87171' : '2px wavy #fbbf24',
        };
      case 'grammar':
        return {
          ...baseStyle,
          backgroundColor: 'rgba(251, 146, 60, 0.30)', // More visible warm orange
          borderBottom: '2px wavy #fb923c',
        };
      case 'punctuation':
        return {
          ...baseStyle,
          backgroundColor: 'rgba(196, 181, 253, 0.12)', // More visible purple
          borderBottom: '2px wavy #c4b5fd',
        };
      case 'style':
        return {
          ...baseStyle,
          backgroundColor: 'rgba(74, 222, 128, 0.12)', // More visible green
          borderBottom: '2px wavy #4ade80',
        };
      default:
        return {
          ...baseStyle,
          backgroundColor: 'rgba(156, 163, 175, 0.10)', // More visible gray
          borderBottom: '2px wavy #9ca3af',
        };
    }
  };

  return (
    <span
      style={getMarkerStyle()}
      title={`${type}: ${message}${
        suggestions && suggestions.trim()
          ? ` | Suggestions: ${suggestions}`
          : ''
      }`}
      data-grammar-issue-id={inlineContent.props.issueId}
      data-grammar-type={type}
      data-grammar-severity={severity}
    >
      {originalText}
    </span>
  );
};

// BlockNote inline content spec for grammar markers
export const GrammarMarker = createReactInlineContentSpec(
  {
    type: 'grammar' as const,
    propSchema: {
      originalText: {
        default: '',
      },
      suggestions: {
        default: '' as string,
      },
      message: {
        default: '',
      },
      type: {
        default: 'grammar' as const,
        values: ['spelling', 'grammar', 'punctuation', 'style'] as const,
      },
      severity: {
        default: 'warning' as const,
        values: ['error', 'warning', 'suggestion'] as const,
      },
      issueId: {
        default: '',
      },
    },
    content: 'none',
  },
  {
    render: (props) => (
      <GrammarMarkerComponent inlineContent={props.inlineContent} />
    ),
  }
);

// Grammar highlight style for BlockNote
export const GrammarHighlight = {
  type: 'grammarHighlight' as const,
  propSchema: {
    type: {
      default: 'grammar' as const,
      values: ['spelling', 'grammar', 'punctuation', 'style'] as const,
    },
    severity: {
      default: 'warning' as const,
      values: ['error', 'warning', 'suggestion'] as const,
    },
  },
};

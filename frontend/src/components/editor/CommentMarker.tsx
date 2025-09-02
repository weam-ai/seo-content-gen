import { createReactInlineContentSpec } from '@blocknote/react';

// The Comment inline content spec for BlockNote
export const CommentMarker = createReactInlineContentSpec(
  {
    type: 'comment',
    propSchema: {
      text: {
        default: 'Unknown',
      },
      threadId: {
        default: 'Unknown',
      },
    },
    text: 'Comment',
    content: 'none',
  },
  {
    render: (props) => (
      <span
        style={{
          backgroundColor: '#ffc80026',
          cursor: 'pointer',
          display: 'inline',
          position: 'relative',
          color: '#333333',
          borderBottom: '1px dotted #f59e0b',
          padding: '1px 2px',
          borderRadius: '2px',
        }}
        data-thread-id={props.inlineContent.props.threadId}
        data-comment-id={props.inlineContent.props.threadId}
        data-comment-marker={true}
        title="Click to view comment"
      >
        {props.inlineContent.props.text}
      </span>
    ),
  }
);
